/**
 * @fileoverview Unit and integration tests for crowd density threshold trigger logic and status updates.
 */
import { jest } from '@jest/globals';

// Set up global mock functions
global.mockGetPrediction = jest.fn().mockImplementation((gate, recentHistory, allGates) => {
  return Promise.resolve({
    gateId: gate.id,
    predictedMinutes: 8,
    urgency: 'high',
    predictionText: `🚨 Prediction for ${gate.name}`
  });
});

global.mockGetRerouting = jest.fn().mockImplementation((overloadedGates, allGates) => {
  return Promise.resolve({
    message: 'Mock Reroute Message',
    suggestedAction: 'Mock Reroute Action'
  });
});

// Register the ESM mock BEFORE dynamically importing target modules
jest.unstable_mockModule('../services/geminiService.js', () => ({
  getPredictionForGate: (...args) => global.mockGetPrediction(...args),
  getReroutingRecommendation: (...args) => global.mockGetRerouting(...args)
}));

// Declare module references to be dynamically imported at runtime
let simulationService;
let runAutoPredictions;
let DensityLog;
let AlertLog;

describe('Smart Stadium Crowd Management — Density Threshold Trigger & Status Logic', () => {
  
  beforeAll(async () => {
    // Dynamically import dependencies after Jest mock registration
    const simModule = await import('../services/simulationService.js');
    simulationService = simModule.simulationService;

    const predModule = await import('../controllers/predictionController.js');
    runAutoPredictions = predModule.runAutoPredictions;

    const dlModule = await import('../models/DensityLog.js');
    DensityLog = dlModule.default;

    const alModule = await import('../models/AlertLog.js');
    AlertLog = alModule.default;
  });

  beforeEach(async () => {
    // Clean mock databases
    await DensityLog.deleteMany({});
    await AlertLog.deleteMany({});
    
    // Clear simulation alert time locks
    simulationService.lastAlertTime = {};
    
    // Reset mock call histories
    global.mockGetPrediction.mockClear();
    global.mockGetRerouting.mockClear();
  });

  test('1. When a gate\'s density crosses 80%, verify the AI Congestion Forecaster is triggered', async () => {
    simulationService.setPhase('PRE_MATCH_RUSH');
    // Set Gate 3 density to 85% and other gates below threshold (e.g. 40%)
    simulationService.gates = simulationService.gates.map(g => {
      if (g.id === 'gate_3') return { ...g, density: 85 };
      return { ...g, density: 40 };
    });

    // Run one simulation tick
    await simulationService.tick();

    // Give asynchronous runAutoPredictions calls 100ms to run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the forecaster was triggered
    expect(global.mockGetPrediction).toHaveBeenCalled();
    const calledGate = global.mockGetPrediction.mock.calls[0][0];
    expect(calledGate.id).toBe('gate_3');
    expect(calledGate.density).toBeGreaterThanOrEqual(80);
  });

  test('2. When a gate\'s density crosses 90%, verify the gate\'s status is correctly set to "CRITICAL CONGESTION"', () => {
    simulationService.gates = simulationService.gates.map(g => {
      if (g.id === 'gate_3') return { ...g, density: 92 };
      return g;
    });

    const state = simulationService.getCurrentState();
    const gate3 = state.find(g => g.id === 'gate_3');
    
    expect(gate3.status).toBe('CRITICAL CONGESTION');
  });

  test('3. When density is exactly at the 80% boundary, verify the trigger fires', async () => {
    // Directly invoke runAutoPredictions with exactly 80% density to test boundary logic
    const gate = { id: 'gate_3', name: 'Gate 3 (North - General)', density: 80 };
    
    await runAutoPredictions([gate], [gate]);

    expect(global.mockGetPrediction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gate_3', density: 80 }),
      expect.any(Array),
      expect.any(Array)
    );
  });

  test('4. When density is below 80% (e.g. 79%), verify the forecaster is NOT triggered', async () => {
    simulationService.setPhase('MID_MATCH_CALM'); // Target densities are all < 25
    simulationService.gates = simulationService.gates.map(g => ({
      ...g,
      density: 50 // Keeps it well below the 80% warning threshold after tick transitions
    }));

    await simulationService.tick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify forecaster was not called
    expect(global.mockGetPrediction).not.toHaveBeenCalled();
  });

  test('5. When density drops back down after being critical (e.g. from 85% to 60%), verify the alert/status resets correctly and doesn\'t stay stuck at CRITICAL', () => {
    // 1. Set to critical (85%)
    simulationService.gates = simulationService.gates.map(g => {
      if (g.id === 'gate_3') return { ...g, density: 85 };
      return g;
    });

    let state = simulationService.getCurrentState();
    let gate3 = state.find(g => g.id === 'gate_3');
    expect(gate3.status).toBe('CRITICAL CONGESTION');

    // 2. Drop density down to 60%
    simulationService.gates = simulationService.gates.map(g => {
      if (g.id === 'gate_3') return { ...g, density: 60 };
      return g;
    });

    state = simulationService.getCurrentState();
    gate3 = state.find(g => g.id === 'gate_3');

    // Should reset and no longer report CRITICAL CONGESTION
    expect(gate3.status).not.toBe('CRITICAL CONGESTION');
    expect(gate3.status).toBe('HIGH WARNING');
  });

});
