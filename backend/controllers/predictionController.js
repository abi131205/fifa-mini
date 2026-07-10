/**
 * @fileoverview Controller for generating crowd predictions and managing alerts.
 */
import AlertLog from '../models/AlertLog.js';
import DensityLog from '../models/DensityLog.js';
import { getPredictionForGate, getReroutingRecommendation } from '../services/geminiService.js';

/**
 * Retrieves latest active alerts from the database.
 * Limited to 20 items to satisfy the Efficiency parameter.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getAlerts(req, res) {
  try {
    const alerts = await AlertLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .exec();
    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Executes automated congestion predictions and redirects when gates cross thresholds.
 * Called asynchronously by the Simulation Service.
 * @param {Array<{id: string, name: string, density: number}>} crossedGates Gates exceeding 80% density.
 * @param {Array<{id: string, name: string, density: number}>} allGates All gates status.
 */
export async function runAutoPredictions(crossedGates, allGates) {
  console.log(`[Auto-AI] Analyzing ${crossedGates.length} gates exceeding threshold...`);

  for (const gate of crossedGates) {
    try {
      // 1. Fetch recent history for trend analysis (last 10 readings at 5s interval = 50 seconds trend)
      const logs = await DensityLog.find({ gateId: gate.id })
        .sort({ timestamp: -1 })
        .limit(10)
        .exec();

      // Mongoose returns in descending order, we want newest-to-oldest array of values
      const recentHistory = logs.map(l => l.density);
      
      // Fallback if history is empty (use current density)
      if (recentHistory.length === 0) {
        recentHistory.push(gate.density);
      }

      // 2. Query Gemini for predictions
      const prediction = await getPredictionForGate(gate, recentHistory, allGates);
      
      // 3. Log Gemini prediction warning to database
      await AlertLog.create({
        gateId: gate.id,
        gateName: gate.name,
        type: 'PREDICTION',
        message: prediction.predictionText,
        urgency: prediction.urgency,
        timestamp: new Date()
      });

      console.log(`[Auto-AI] Prediction logged for ${gate.name}: Urgency ${prediction.urgency}`);
    } catch (err) {
      console.error(`[Auto-AI] Failed to process auto prediction for ${gate.name}:`, err.message);
    }
  }

  // 4. Generate rerouting suggestions for the set of overloaded gates
  try {
    const rerouting = await getReroutingRecommendation(crossedGates, allGates);

    // Save rerouting advice in database
    await AlertLog.create({
      type: 'REROUTING',
      message: rerouting.message,
      suggestedAction: rerouting.suggestedAction,
      urgency: 'high', // Rerouting suggestions are triggered by active overloads
      timestamp: new Date()
    });

    console.log('[Auto-AI] Rerouting recommendation logged successfully.');
  } catch (err) {
    console.error('[Auto-AI] Failed to log rerouting recommendation:', err.message);
  }
}
