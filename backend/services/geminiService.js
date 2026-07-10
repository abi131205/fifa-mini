/**
 * @fileoverview Service for interacting with Gemini 2.5 Flash, including caching and local fallback logic.
 */
import '../config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiCache, generateDensityCacheKey } from '../utils/cache.js';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' }
  });
  console.log(`✅ Gemini Service initialized using model: ${modelName}`);
} else {
  console.warn('⚠️ No GEMINI_API_KEY found or using placeholder. Running Gemini service in Mock Fallback Mode.');
}

/**
 * Normalizes JSON output from Gemini (stripping Markdown block wrappers if present).
 * @param {string} text Raw text returned from Gemini API.
 * @returns {Object} Parsed JSON object.
 */
function parseGeminiJson(text) {
  try {
    const cleanedText = text
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse Gemini JSON:', text, error.message);
    throw new Error('Invalid JSON structure returned by Gemini');
  }
}

/**
 * Predicts gate congestion based on history.
 * @param {{id: string, name: string, density: number}} gate Target gate.
 * @param {Array<number>} recentHistory Historical density levels (newest to oldest).
 * @param {Array<{id: string, name: string, density: number}>} allGates Current states of all gates.
 * @returns {Promise<{gateId: string, predictedMinutes: number, urgency: string, predictionText: string}>}
 */
export async function getPredictionForGate(gate, recentHistory, allGates) {
  const cacheKey = `pred:${gate.id}:${generateDensityCacheKey(allGates)}:hist:${recentHistory.join(',')}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Gemini prediction cached for ${gate.id}`);
    return cached;
  }

  // Fallback if API key is not present
  if (!model) {
    const mockResult = generateMockPrediction(gate, recentHistory);
    geminiCache.set(cacheKey, mockResult);
    return mockResult;
  }

  const historyString = recentHistory.map((d, i) => `T-${i * 5}s: ${d}%`).join(', ');
  const allGatesString = allGates.map(g => `${g.name}: ${g.density}%`).join('\n');

  const prompt = `
    You are an AI crowd management system for the FIFA World Cup 2026.
    Analyze the density trend at: ${gate.name} (Current Density: ${gate.density}%)
    Recent Density Readings (newest to oldest, 5-second intervals): [${historyString}]
    All Stadium Gates Current Densities:
    ${allGatesString}

    Predict if and when this gate will cross critical capacity (>= 90%) in minutes.
    Assess threat urgency as "low", "medium", or "high" based on how fast density is rising.
    Provide a concise, professional plain-language warning.

    Your output MUST be a JSON object with this exact schema:
    {
      "gateId": "${gate.id}",
      "predictedMinutes": 8, // Estimated minutes to reach critical capacity (90%+). Return null if not rising or stable.
      "urgency": "high", // "low", "medium", or "high"
      "predictionText": "Gate 3 is trending upward rapidly and is expected to exceed critical density in roughly 8 minutes if current flow continues."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const responseData = parseGeminiJson(text);
    geminiCache.set(cacheKey, responseData);
    return responseData;
  } catch (error) {
    console.error(`[Gemini API Error] Prediction failed for ${gate.id}:`, error.message);
    // Graceful error fallback
    return generateMockPrediction(gate, recentHistory);
  }
}

/**
 * Generates crowd rerouting recommendation.
 * @param {Array<{id: string, name: string, density: number}>} overloadedGates List of overloaded gates (>=80%).
 * @param {Array<{id: string, name: string, density: number}>} allGates All gates state.
 * @returns {Promise<{message: string, suggestedAction: string}>}
 */
export async function getReroutingRecommendation(overloadedGates, allGates) {
  const cacheKey = `reroute:${generateDensityCacheKey(allGates)}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) {
    console.log('[Cache Hit] Gemini rerouting recommendation cached.');
    return cached;
  }

  if (!model) {
    const mockResult = generateMockRerouting(overloadedGates, allGates);
    geminiCache.set(cacheKey, mockResult);
    return mockResult;
  }

  const overloadedString = overloadedGates.map(g => `- ${g.name} is currently at ${g.density}% density`).join('\n');
  const allGatesString = allGates.map(g => `- ${g.name}: ${g.density}%`).join('\n');

  const prompt = `
    You are a smart crowd controller for the FIFA World Cup 2026.
    The following gates have crossed the critical density threshold (80%):
    ${overloadedString}

    Here is the density state of all gates:
    ${allGatesString}

    Please generate a specific and actionable rerouting recommendation.
    Divert crowd flows away from overloaded gates to the closest gates operating under 50% density.
    Explain the routing path in plain language.

    Your output MUST be a JSON object with this exact schema:
    {
      "message": "Diverting South Concourse outflows from Gate 6 (95%) to Gate 5 (50%) and Gate 7 (40%).",
      "suggestedAction": "Direct security staff at Sector S-South to close Gate 6 incoming lanes and guide spectators along Concourse Corridor C-South to Gates 5 and 7, which are running well below capacity."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const responseData = parseGeminiJson(text);
    geminiCache.set(cacheKey, responseData);
    return responseData;
  } catch (error) {
    console.error('[Gemini API Error] Rerouting recommendation failed:', error.message);
    return generateMockRerouting(overloadedGates, allGates);
  }
}

/**
 * Responds to natural language queries from volunteer staff, grounded in live data.
 * @param {string} userMessage The staff's message.
 * @param {Array<{id: string, name: string, density: number}>} currentGates Live gate density records.
 * @param {Array<Object>} recentAlerts Latest predictive alerts.
 * @returns {Promise<string>} Gemini response text.
 */
export async function getChatResponse(userMessage, currentGates, recentAlerts) {
  // Chat requests are not cached directly by density keys since user message queries vary,
  // but we can sanitize the user input.
  if (!model) {
    return generateMockChat(userMessage, currentGates, recentAlerts);
  }

  // Construct text model instance without JSON constraint for chat helper
  const chatModel = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  });

  const gatesString = currentGates.map(g => `- ${g.name}: ${g.density}% density`).join('\n');
  const alertsString = recentAlerts.length > 0 
    ? recentAlerts.map(a => `- [${a.urgency.toUpperCase()} Alert] ${a.message} (Action: ${a.suggestedAction || 'None'})`).join('\n')
    : 'No active alerts.';

  const prompt = `
    You are "FIFA Crowd Assist", an AI-powered assistant for volunteer stadium staff at the FIFA World Cup 2026.
    You are grounded in the following live gate densities:
    ${gatesString}

    Active Alerts & Suggestions:
    ${alertsString}

    Answer the volunteer's question: "${userMessage}"
    
    Guidelines:
    1. Be concise, polite, and professional.
    2. Only rely on the provided live densities and active alerts.
    3. If the user's message is irrelevant to stadium gates, crowd management, or volunteer tasks, politely guide them back to venue operations.
    4. Do not hallucinate or speculate on details not given above.
  `;

  try {
    const result = await chatModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('[Gemini API Error] Chat response failed:', error.message);
    return generateMockChat(userMessage, currentGates, recentAlerts);
  }
}

/* --- DETAILED DETERMINISTIC MOCK GENERATORS FOR OFFLINE / TEST MODE --- */

function generateMockPrediction(gate, recentHistory) {
  // Simple trend analysis: check if density is rising
  const isRising = recentHistory.length > 1 && recentHistory[0] > recentHistory[recentHistory.length - 1];
  let predictedMinutes = null;
  let urgency = 'low';
  let text = `${gate.name} is currently stable at ${gate.density}% density. No immediate capacity threats identified.`;

  if (isRising && gate.density >= 70) {
    const rate = (recentHistory[0] - recentHistory[recentHistory.length - 1]) / (recentHistory.length - 1);
    const densityToCritical = 90 - gate.density;
    predictedMinutes = rate > 0 ? Math.max(1, Math.round(densityToCritical / (rate * 12))) : 8; // scaled by 12 (5s to 60s ratio)
    urgency = gate.density >= 85 ? 'high' : 'medium';
    text = `🚨 [Mock Alert] ${gate.name} is filling up at a high rate. Predicted to exceed critical capacity (90%) in approximately ${predictedMinutes} minutes based on current inflows.`;
  } else if (gate.density >= 80) {
    urgency = 'high';
    predictedMinutes = 3;
    text = `🚨 [Mock Critical] ${gate.name} density has reached ${gate.density}%. Congestion is imminent within 2-3 minutes.`;
  }

  return {
    gateId: gate.id,
    predictedMinutes,
    urgency,
    predictionText: text
  };
}

function generateMockRerouting(overloadedGates, allGates) {
  const overName = overloadedGates.map(g => g.name).join(', ');
  // Find gates with low density
  const clearGates = allGates
    .filter(g => g.density < 50)
    .sort((a, b) => a.density - b.density);

  const bestFallback = clearGates[0] || { name: 'Gate 2 (VIP/Staff)', density: 10 };
  const secondFallback = clearGates[1] || { name: 'Gate 8 (Media/VIP)', density: 15 };

  return {
    message: `Diverting crowd flows away from congested ${overName} to alternate under-capacity entryways.`,
    suggestedAction: `[Mock Route] Security team should close incoming lanes at ${overloadedGates[0]?.name || 'congested gates'} and divert incoming fans towards ${bestFallback.name} (currently ${bestFallback.density}% density) and ${secondFallback.name} (currently ${secondFallback.density}% density).`
  };
}

function generateMockChat(userMessage, currentGates, recentAlerts) {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('status') || msg.includes('density') || msg.includes('gate')) {
    // Find if user asked about a specific gate, e.g., "gate 3"
    const match = msg.match(/gate\s*([1-8])/);
    if (match) {
      const gateNum = match[1];
      const gate = currentGates.find(g => g.id.endsWith(gateNum));
      if (gate) {
        return `[FIFA Crowd Assist] The status at ${gate.name} is currently at ${gate.density}% density. ${
          gate.density >= 80 ? 'Warning: This gate is congested. Rerouting is recommended.' : 'Operations are normal.'
        }`;
      }
    }
    
    // Default overall status
    const critical = currentGates.filter(g => g.density >= 80);
    const criticalNames = critical.map(g => g.name).join(', ');
    return `[FIFA Crowd Assist] Currently monitoring all 8 gates. ${
      critical.length > 0
        ? `We have high congestion at: ${criticalNames}. Other gates are operating within safe bounds.`
        : 'All gates are running smoothly within normal capacity limits.'
    }`;
  }

  if (msg.includes('alert') || msg.includes('warning') || msg.includes('reroute')) {
    if (recentAlerts.length > 0) {
      const latest = recentAlerts[0];
      return `[FIFA Crowd Assist] Latest active alert is: "${latest.message}". Suggested Action: "${latest.suggestedAction}"`;
    }
    return `[FIFA Crowd Assist] There are currently no active congestion alerts. All systems normal.`;
  }

  return `[FIFA Crowd Assist] Hello! I am your staff helper. I can answer questions about live gate density, active alerts, and crowd rerouting instructions (e.g. "What is the status of Gate 3?"). How can I help you manage stadium crowds today?`;
}
