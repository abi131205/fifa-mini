/**
 * @fileoverview Controller for crowd density status and simulation controls.
 */
import { simulationService } from '../services/simulationService.js';
import DensityLog from '../models/DensityLog.js';

/**
 * Retrieves the current live density state of all gates.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function getCurrentStatus(req, res) {
  try {
    const status = simulationService.getCurrentState();
    const phase = simulationService.currentPhase;
    res.json({ success: true, phase, gates: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Retrieves historical density records for a specific gate or all gates, with limits.
 * Satisfies the Efficiency requirement for query limiting and pagination.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getHistory(req, res) {
  try {
    const { gateId, limit = 50, page = 1 } = req.query;
    const parsedLimit = Math.min(100, parseInt(limit, 10) || 50); // Cap limit at 100 for safety
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};
    if (gateId) {
      filter.gateId = gateId;
    }

    const records = await DensityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .exec();

    res.json({
      success: true,
      page: parsedPage,
      limit: parsedLimit,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Changes the active crowd simulation phase.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function changePhase(req, res) {
  try {
    const { phase } = req.body;
    if (!phase) {
      return res.status(400).json({ success: false, message: 'Simulation phase is required.' });
    }

    simulationService.setPhase(phase);
    res.json({
      success: true,
      message: `Simulation phase updated successfully to ${phase}`,
      phase: simulationService.currentPhase,
      gates: simulationService.getCurrentState()
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
