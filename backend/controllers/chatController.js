/**
 * @fileoverview Controller for the staff natural language chat assistant.
 */
import { simulationService } from '../services/simulationService.js';
import AlertLog from '../models/AlertLog.js';
import { getChatResponse } from '../services/geminiService.js';

/**
 * Sanitizes user chat input to prevent prompt injection and cross-site scripting (XSS).
 * Removes HTML elements and patterns typical of override attacks.
 * @param {string} rawInput Raw user input text.
 * @returns {string} Sanitized text.
 */
export function sanitizeChatInput(rawInput) {
  if (typeof rawInput !== 'string') return '';
  
  let cleaned = rawInput
    // Strip HTML tag structures
    .replace(/<[^>]*>/g, '')
    // Escape specific characters to prevent injection
    .replace(/[&<>"']/g, char => {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[char];
    });

  // Block prompt injection patterns attempting to override the system instructions
  const injectionPatterns = [
    /ignore\s+(all\s+)?prior\s+instructions/i,
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /system\s*override/i,
    /you\s+are\s+now\s+a/i,
    /forget\s+(everything\s+)?you\s+were\s+told/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(cleaned)) {
      console.warn(`[Security Alert] Prompt injection attempt blocked: "${cleaned}"`);
      // Return a stripped down message or flag it
      return 'Help with gate status';
    }
  }

  return cleaned.trim();
}

/**
 * Handles incoming chat assistant messages from volunteer staff.
 * Grounds the prompt in live stadium gate densities and active alerts.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function handleChat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Sanitize input to satisfy the Security parameter
    const sanitizedMsg = sanitizeChatInput(message);
    
    // Retrieve live context data
    const currentGates = simulationService.getCurrentState();
    const recentAlerts = await AlertLog.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .exec();

    // Query Gemini grounded in our live state
    const responseText = await getChatResponse(sanitizedMsg, currentGates, recentAlerts);

    res.json({
      success: true,
      originalMessage: message,
      sanitizedMessage: sanitizedMsg,
      response: responseText
    });
  } catch (error) {
    console.error('[Chat Error] Failed to handle chat:', error.message);
    res.status(500).json({ success: false, message: 'An internal error occurred while processing your chat request.' });
  }
}
