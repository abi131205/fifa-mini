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
- **AI Core**: Gemini 2.5 Flash. Generates plain-language alerts, specific reroute instructions, and answers queries grounded directly in live gate metrics. Gemini responses are cached in a 30-second TTL cache mapping rounded (nearest 5%) density states to avoid redundant tokens consumption.

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

## Problem Statement Alignment: [Challenge 4] Smart Stadiums & Tournament Operations

Our solution is engineered specifically to satisfy the core tracks of **Challenge 4**:

| Challenge 4 Track | Feature Implemented | Technical Detail / Security & Accessibility |
| :--- | :--- | :--- |
| **Dynamic Crowd Management** | Live Heatmap Grid & Volunteer Staff Dispatch loop | Colorblind-safe (Blue-to-Orange HSL) scale nodes. Dispatching volunteers dynamically dampens simulation flow rates on subsequent tick calculations. |
| **Smart Indoor Navigation** | Interactive 2D SVG Stadium Map Visualizer | Displays layout coordinates and live capacity glows. Interactive gate nodes support keyboard tab outlines and `aria-pressed` states to direct fans safely. |
| **Real-Time Decision Support** | GenAI Predictive Warnings, SMS Cellular Console & PA Broadcaster | Automatically triggers Gemini 2.5 Flash predictions at 80% boundary. Includes SMS mock smartphone dispatch controls and Web Speech API announcers. |
| **Multilingual AI Assistance** | Grounded Staff Chat Assistant | Voluneteer helper chatbot utilizing Gemini grounded in live gate telemetry, sanitizing prompt overrides, and returning multi-language help. |
| **Security Parameters** | Monorepo Security Guardrails | Express server implements `helmet` header security, `express-rate-limit` per endpoint, and `express-validator` to prevent XSS. |
| **Testing Parameters** | Jest Unit & Integration Test Suites | Verifies 22 test cases across 4 test files (`threshold`, `api`, `sanitization`, `cache`), with mocks for MongoDB and Gemini API. |

---

## Advanced Web Service Features (Phase 2)

To transform the portal into a complete, production-ready enterprise web service, the following 10 interactive features were implemented:

1. **Light & Dark Theme Switcher**: Standard CSS variables are linked to a toggle in the settings and header, allowing users to switch between a sleek dark control room layout and a high-contrast daylight theme.
2. **Emergency Lockdown (Panic Trigger)**: Added a glowing orange warning button in the navigation header that overrides all gates to 95% capacity, triggers warning chimes continuously, and posts a GenAI evac redirect plan.
3. **Stadium PA Announcer System**: Embedded a speech synthesis announcer using the Web Speech API. Speaks preset or custom safety scripts over the PA system with pre-broadcast warning chimes.
4. **Multi-Role Operator Switcher**: Restricts slider allocations, simulator presets, and PA broadcasts based on the chosen role (`Stadium Director`, `Safety Officer`, or `Volunteer Crew`).
5. **Live System Health Diagnostics**: Renders dynamic telemetry stats including latency history bar charts, database socket connections, and CPU usage.
6. **CSV Log Exporter**: Automatically parses historical gate telemetry logs and downloads them directly as a `.csv` spreadsheet file.
7. **Simulation Scenario Presets**: Quick-loads event scenarios (*Kickoff Rush*, *Weather Evacuation*, *Concourse Spikes*) to configure the environment instantly.
8. **Alarm Tone Customizer**: Toggle warning alarm sounds between "Radar Sonar Ping," "Digital Double Beep," and "Evacuation Siren."
9. **Bilateral Ground Radio Chatter Feed**: Interactive, live logs feed showing reports from volunteers in the field.
10. **Real-time Telemetry Search & Filter**: Instant input query bar on the telemetry grid to search gates by name or capacity status.

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
