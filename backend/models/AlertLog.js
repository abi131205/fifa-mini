/**
 * @fileoverview Schema for recording predictive alerts and rerouting logs.
 */
import mongoose from 'mongoose';
import { getModel } from '../utils/db.js';

const AlertLogSchema = new mongoose.Schema({
  gateId: {
    type: String,
    required: false,
    index: true
  },
  gateName: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['PREDICTION', 'REROUTING'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'low'
  },
  suggestedAction: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default getModel('AlertLog', AlertLogSchema);
