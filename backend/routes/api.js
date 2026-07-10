/**
 * @fileoverview API router registering paths, validation middleware, and rate limits.
 */
import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getCurrentStatus, getHistory, changePhase } from '../controllers/crowdController.js';
import { getAlerts } from '../controllers/predictionController.js';
import { handleChat } from '../controllers/chatController.js';
import { PHASES } from '../services/simulationService.js';

const router = Router();

// --- Rate Limiting Middlewares (Security Parameter) ---

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many API requests, please try again later.' }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Limit each IP to 15 chat queries per minute to prevent Gemini API quota draining
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Chat rate limit exceeded. Please wait a minute before sending another message.' }
});

// --- Validation Handler Middleware (Security Parameter) ---

/**
 * Express middleware to halt requests on validation failures.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// --- Route Registrations ---

// Get current live stadium gate densities
router.get('/crowd/status', apiLimiter, getCurrentStatus);

// Get historical logs (supports pagination and page query parameters)
router.get(
  '/crowd/history',
  apiLimiter,
  [
    query('gateId').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  ],
  handleValidationErrors,
  getHistory
);

// Manually switch simulation phase (for reviewer demonstration)
router.post(
  '/crowd/phase',
  apiLimiter,
  [
    body('phase')
      .isString()
      .trim()
      .isIn(Object.values(PHASES))
      .withMessage(`Phase must be one of: ${Object.values(PHASES).join(', ')}`)
  ],
  handleValidationErrors,
  changePhase
);

// Get active alerts (predictions + rerouting)
router.get('/alerts', apiLimiter, getAlerts);

// Natural Language AI chat helper
router.post(
  '/chat',
  chatLimiter,
  [
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Message content cannot be empty')
      .isLength({ max: 500 })
      .withMessage('Message content exceeds maximum limit of 500 characters')
  ],
  handleValidationErrors,
  handleChat
);

export default router;
