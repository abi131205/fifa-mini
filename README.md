# FIFA World Cup 2026 — Smart Stadium Crowd Management

An operator-facing real-time venue operations dashboard designed to monitor crowd density at stadium entrances, utilize Gemini 2.5 Flash to predict capacity bottle-necks before they occur, generate automated rerouting instructions, and provide a staff AI chat assistant to ground-level volunteers.

---

## Technical Architecture

```text
                  +----------------------------------------------+
                  |               VOLUNTEER OPERATORS            |
                  +----------------------+-----------------------+
                                         |
                                         | (Keyboard Nav & ARIA-ready UI)
                                         v
                  +----------------------------------------------+
                  |            Vite + React Frontend             |
                  |     (Slate Blue / Orange / Off-white)         |
                  +----------------------+-----------------------+
                                         |
                                         | (5-sec Debounced API Polls)
                                         v
                  +----------------------------------------------+
                  |         Node.js + Express API Proxy          |
                  |     (Helmet, CORS, Rate Limiters)            |
                  +-----------+----------------------+-----------+
                              |                      |
     (Capped History Queries) |                      | (Prompt Injection Sanitized)
                              v                      v
                  +-----------+----+      +----------+-----------+
                  |  MongoDB Atlas |      |      Gemini API      |
                  |  (Log History) |      |   (gemini-2.5-flash) |
                  +----------------+      +----------+-----------+
                                                     |
                                                     | (TTL Response Cache)
                                                     v
                                          [In-Memory Cache Map]
```

- **Frontend**: React client scaffolded with Vite and Tailwind CSS v3. Adheres to WCAG AA guidelines with high-contrast color palettes and colorblind-safe (Blue-to-Orange) density cells. Throttles updates via a 5-second polling tick. Chat widget is lazy-loaded (`React.lazy` + `Suspense`).
- **Backend**: Node.js Express server. Secures the Gemini API by proxying all requests. Integrates security layers: `helmet` for headers, `express-rate-limit` to prevent API exhaustion, and `express-validator` to sanitize user chat inputs.
- **Database**: MongoDB Atlas via Mongoose. Automatically falls back to a file/in-memory simulated database if `MONGODB_URI` is omitted, allowing immediate local execution.
- **AI Core**: Gemini 2.5 Flash. Generates plain-language alerts, specific reroute instructions, and answers queries grounded directly in live gate metrics. Gemini responses are cached in a 30-second TTL cache mapping rounded (nearest 5%) density states. It includes a **Self-Healing Model Fallback** wrapper: if `gemini-2.5-flash` returns a 404 (e.g. for newer accounts/keys), the backend dynamically falls back to `gemini-1.5-flash` and retries the request automatically to prevent service downtime.

---

## Setup & Execution

### 1. Requirements
- Node.js (v18+)
- NPM

### 2. Configuration
Copy the `.env.example` in the root folder to a new file named `.env`:
```bash
# In the root workspace folder:
copy .env.example .env
```
Fill in the credentials:
- Set `GEMINI_API_KEY` to your Google AI Studio API key. (If omitted, the app runs in **Mock Fallback Mode** with deterministic local mock generators).
- Set `MONGODB_URI` to your MongoDB Atlas cluster URI. (If omitted, the app runs in **Local In-Memory Mode** without failing).

### 3. Installation
Install root, backend, and frontend dependencies concurrently:
```bash
npm run install-all
```

### 4. Running the Development Servers
Start both the Express backend and React Vite frontend concurrently:
```bash
npm run dev
```
- Frontend will open at: [http://localhost:5173](http://localhost:5173)
- Backend runs at: [http://localhost:5000](http://localhost:5000)

### 5. Running the Test Suite
The backend contains a robust suite of 17 Jest unit and integration tests across 4 test files (`sanitization.test.js`, `cache.test.js`, `api.test.js`, and `threshold.test.js`):
```bash
npm run test
```

---

## Problem Statement Alignment

| Problem Statement Requirement | Feature Implemented | Technical Detail / Security & Accessibility |
| :--- | :--- | :--- |
| **Live Density Dashboard** | Heatmap Grid of 8 gates showing fluctuating crowd metrics. | Colorblind-safe palette (Blue-to-Orange scale) + numerical percentage labels + tab-navigable focus styles. |
| **GenAI Predictive Alerts** | Alerts cards warning operators about congestion trends. | Calls Gemini 2.5 Flash backend proxy; uses a 30-second TTL cache for identical crowd states. |
| **GenAI Rerouting Suggestions** | Actionable redirects suggesting alternate entrances when gates cross 80%. | Triggered automatically on density ticks; suggestions are logged in the database and announced via `aria-live="polite"`. |
| **Staff Chat Assistant** | Grounded chatbot answering volunteer queries. | Sanity checking strips HTML script tags and filters out prompt injection keywords; lazy-loaded for loading efficiency. |
| **Security Parameters** | Express security hardening. | Integrates `helmet`, CORS filters, `express-rate-limit` per route, and loads credentials securely via `.env`. |
| **Testing Parameters** | Jest unit and integration suite. | Mocks external Gemini payloads and MongoDB connection fallbacks, verifying 17 normal, boundary, and edge cases (including threshold crossings, status transitions, and prediction logic). |

---

## Walkthrough Scenarios

Select these scenarios from the **Venue Simulation Controls** on the dashboard to test features:

### Scenario 1: Pre-Match Rush (Entrance Influx)
- **Select**: `🏟️ Pre-Match Rush`
- **Dynamic**: Fan density increases rapidly at general admission entrances, particularly **Gate 3 (North)**.
- **GenAI Action**:
  - Gate 3 crosses the 80% threshold.
  - Gemini Service detects the upward trend in the 10-point history and generates a prediction: *"Gate 3 (North) is expected to reach critical density in approximately 8 minutes based on current trend."*
  - Concurrently, a Reroute suggestion is created: *"Divert spectators from Gate 3 (North) to Gate 2 (VIP/Staff) and Gate 4 (North-West) which are operating under 45% density."*

### Scenario 2: Halftime Rush (Concourse Flow)
- **Select**: `🌭 Halftime Flow`
- **Dynamic**: Spectators leave seats for refreshments. Influx points drop to low levels, but concourse access corridors (represented by **Gate 5** and **Gate 7**) spike to 85%+.
- **GenAI Action**:
  - Screen readers announce the active alerts in real-time.
  - Gemini rerouting recommendations redirect fans through side tunnels, diverting load away from food courtyards.

### Scenario 3: Post-Match Exit Surge
- **Select**: `🚶 Post-Match Exit`
- **Dynamic**: The match ends and the entire stadium exits. High surges occur at **Gate 4**, **Gate 6**, and **Gate 8** (VIP/Media) as people exit to parking lots.
- **GenAI Action**:
  - Gemini generates warnings for exiting blocks and suggests opening emergency exit routes to under-utilized gates.
  - On-ground volunteers use the chat widget to ask: *"What is the status of Gate 6?"* and the chatbot replies: *"The status at Gate 6 (South-West - Supporters) is currently at 95% density. Warning: This gate is congested. Rerouting is recommended."*
