/**
 * @fileoverview Schema for recording historical crowd density measurements.
 */
import mongoose from 'mongoose';
import { getModel } from '../utils/db.js';

const DensityLogSchema = new mongoose.Schema({
  gateId: {
    type: String,
    required: true,
    index: true
  },
  gateName: {
    type: String,
    required: true
  },
  density: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index to speed up retrieval of gate trends
DensityLogSchema.index({ gateId: 1, timestamp: -1 });

export default getModel('DensityLog', DensityLogSchema);
