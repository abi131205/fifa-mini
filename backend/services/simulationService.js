/**
 * @fileoverview Crowd simulation service generating realistic, phased density patterns.
 */
import DensityLog from '../models/DensityLog.js';
import { runAutoPredictions } from '../controllers/predictionController.js';

export const PHASES = {
  PRE_MATCH_RUSH: 'PRE_MATCH_RUSH',
  MID_MATCH_CALM: 'MID_MATCH_CALM',
  HALFTIME_CONCOURSE: 'HALFTIME_CONCOURSE',
  POST_MATCH_EXIT_SURGE: 'POST_MATCH_EXIT_SURGE',
  NORMAL_OPERATIONS: 'NORMAL_OPERATIONS'
};

// Target densities for each gate depending on the current phase
const PHASE_TARGETS = {
  [PHASES.PRE_MATCH_RUSH]: {
    gate_1: 55, gate_2: 30, gate_3: 88, gate_4: 50,
    gate_5: 60, gate_6: 78, gate_7: 45, gate_8: 25
  },
  [PHASES.MID_MATCH_CALM]: {
    gate_1: 15, gate_2: 10, gate_3: 20, gate_4: 15,
    gate_5: 18, gate_6: 22, gate_7: 12, gate_8: 10
  },
  [PHASES.HALFTIME_CONCOURSE]: {
    gate_1: 25, gate_2: 15, gate_3: 30, gate_4: 20,
    gate_5: 85, gate_6: 40, gate_7: 82, gate_8: 15 // Spikes at Gate 5 and 7 due to central concession flow
  },
  [PHASES.POST_MATCH_EXIT_SURGE]: {
    gate_1: 45, gate_2: 30, gate_3: 65, gate_4: 92,
    gate_5: 50, gate_6: 95, gate_7: 60, gate_8: 88 // Spikes at Gates 4, 6, 8 (main stadium exits)
  },
  [PHASES.NORMAL_OPERATIONS]: {
    gate_1: 30, gate_2: 20, gate_3: 35, gate_4: 30,
    gate_5: 25, gate_6: 35, gate_7: 28, gate_8: 18
  }
};

const GATE_NAMES = {
  gate_1: 'Gate 1 (East - General)',
  gate_2: 'Gate 2 (North-East - VIP/Staff)',
  gate_3: 'Gate 3 (North - General)',
  gate_4: 'Gate 4 (North-West - General)',
  gate_5: 'Gate 5 (South - General)',
  gate_6: 'Gate 6 (South-West - Supporters)',
  gate_7: 'Gate 7 (West - General)',
  gate_8: 'Gate 8 (West - Media/VIP)'
};

class SimulationService {
  constructor() {
    this.currentPhase = PHASES.PRE_MATCH_RUSH;
    this.gates = Object.keys(GATE_NAMES).map(id => ({
      id,
      name: GATE_NAMES[id],
      density: PHASE_TARGETS[this.currentPhase][id]
    }));
    this.timer = null;
    this.lastAlertTime = {}; // gateId -> timestamp (prevents alert spamming)
  }

  /**
   * Sets the active simulation phase and recalculates base densities.
   * @param {string} phase The new phase.
   */
  setPhase(phase) {
    if (!PHASES[phase]) {
      throw new Error(`Invalid simulation phase: ${phase}`);
    }
    this.currentPhase = phase;
    // Reset densities to phase targets instantly to reflect scenario switch
    this.gates = this.gates.map(gate => ({
      ...gate,
      density: PHASE_TARGETS[phase][gate.id]
    }));
    console.log(`[Simulation] Switched phase to: ${phase}`);
  }

  /**
   * Helper to determine status label from density percentage.
   * @param {number} density Gate density level.
   * @returns {string} Status label.
   */
  getGateStatus(density) {
    if (density < 30) return 'NORMAL';
    if (density < 60) return 'MODERATE';
    if (density < 80) return 'HIGH WARNING';
    return 'CRITICAL CONGESTION';
  }

  /**
   * Gets the current live density states with status.
   * @returns {Array<{id: string, name: string, density: number, status: string}>}
   */
  getCurrentState() {
    return this.gates.map(gate => ({
      ...gate,
      status: this.getGateStatus(gate.density)
    }));
  }

  /**
   * Performs one simulation tick, adding realistic fluctuations and saving history.
   */
  async tick() {
    const targets = PHASE_TARGETS[this.currentPhase];
    const threshold = 80;
    const crossedGates = [];

    this.gates = this.gates.map(gate => {
      const target = targets[gate.id];
      // Generate a small fluctuate step towards target with slight random jitter
      const diff = target - gate.density;
      const step = diff * 0.2; // Move 20% closer to target value
      const jitter = (Math.random() - 0.5) * 6; // Random jitter between -3% and +3%
      
      let newDensity = Math.round(gate.density + step + jitter);
      newDensity = Math.max(0, Math.min(100, newDensity));

      // Record threshold crossing
      if (newDensity >= threshold) {
        crossedGates.push({ ...gate, density: newDensity });
      }

      return {
        ...gate,
        density: newDensity
      };
    });

    // Write to history log in database (or mock collection)
    try {
      const logEntries = this.gates.map(gate => ({
        gateId: gate.id,
        gateName: gate.name,
        density: gate.density,
        timestamp: new Date()
      }));
      await DensityLog.insertMany(logEntries);
    } catch (err) {
      console.error('[Simulation] Failed to save density history:', err.message);
    }

    // Trigger prediction and rerouting check if gates cross threshold
    if (crossedGates.length > 0) {
      const now = Date.now();
      const gatesToTrigger = crossedGates.filter(gate => {
        const lastTime = this.lastAlertTime[gate.id] || 0;
        // Require at least 60 seconds gap between alerts for the same gate
        if (now - lastTime > 60000) {
          this.lastAlertTime[gate.id] = now;
          return true;
        }
        return false;
      });

      if (gatesToTrigger.length > 0) {
        // Run predictions asynchronously to avoid blocking the tick loop
        runAutoPredictions(gatesToTrigger, this.gates).catch(err => {
          console.error('[Simulation] Auto prediction failed:', err.message);
        });
      }
    }
  }

  /**
   * Starts the simulation clock.
   * @param {number} [intervalMs=5000] Tick interval (default 5 seconds).
   */
  start(intervalMs = 5000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), intervalMs);
    console.log(`[Simulation] Crowd simulation started with ${intervalMs / 1000}s ticks.`);
  }

  /**
   * Stops the simulation clock.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Simulation] Crowd simulation stopped.');
    }
  }
}

export const simulationService = new SimulationService();
