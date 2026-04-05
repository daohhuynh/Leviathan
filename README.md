# Leviathan 🌐

Leviathan is a split-stack, AI-driven B2B sourcing platform that reduces an 8-hour manual procurement workflow into a 2-minute automated process. 

Designed for enterprise supply chain optimization, the system deploys a headless browser agent to autonomously navigate vendor platforms (e.g., Alibaba), extract dynamic pricing/MOQ data, and synthesize the findings into a formalized Letter of Intent (LOI) ready for immediate dispatch.

## System Architecture

The application is built on a decoupled architecture, separating the interactive client from the heavy AI orchestration layer.

### Frontend Client (`Next.js` / `React`)
* **Core:** Next.js 16.2 (App Router), React 19, TypeScript 5.
* **State Management:** `zustand` handles global session state (execution status, live logs, generated LOI), while React Flow manages local node/edge graph states.
* **UI/Visualization:** Tailwind CSS 4 for styling. The core visualization relies on `@xyflow/react` for the node-based canvas (dynamically imported to bypass SSR hydration issues) and `framer-motion` for smooth state transitions. 

### Backend Orchestration (`FastAPI`)
* **Core:** Python, FastAPI, Pydantic, Uvicorn.
* **Concurrency & Streaming:** Exposes an asynchronous `/deploy` endpoint and utilizes a custom logging handler wrapped in a `StreamingResponse` to push Server-Sent Events (SSE) to the frontend, providing real-time execution telemetry to the user.
* **Stateless Design:** Data is handled transiently in-memory without the overhead of an ORM or persistent database, ensuring high throughput for the proof-of-concept.

## The Agentic Pipeline

While the UI conceptualizes the process as a distributed multi-agent swarm, the backend implements a highly deterministic, cost-optimized two-stage LLM pipeline using `gpt-4o`. This deliberate architectural choice prioritizes reliability and speed over the unpredictable latency of open-ended agent frameworks.

* **Stage 1: Headless Sourcing (`browser-use`)**
  The system spins up a headless browser and directly targets pre-encoded vendor search URLs to bypass homepage popups. Vision capabilities are explicitly disabled (`use_vision=False`) to drastically reduce token consumption, and the agent is hard-capped at 10 execution steps to prevent infinite loops on complex DOMs. The agent scrolls the dynamic search results and performs a shallow extraction of `Product Title`, `Price Bounds`, and `Minimum Order Quantity (MOQ)` from the top three vendor cards.

* **Stage 2: Synthesis & Output (`LangChain`)**
  The unstructured plain-text summary from the browser agent is passed to a secondary `gpt-4o` instance. This pass standardizes the extracted data and synthesizes it into a formal Letter of Intent (LOI).

## Integrations & Data Flow
* **Live Telemetry:** Upon deployment, the Next.js client opens an SSE connection to FastAPI (`/stream-logs`). Status updates heuristically trigger UI state changes (e.g., transitioning from `SCRAPING` to `NEGOTIATING`).
* **Document Handling:** The synthesized LOI is pushed to the client via Zustand and rendered in-browser for immediate review, downloadable as a `.txt` file via Blob.
* **Outbound Routing:** Finalized LOIs are routed through a Next.js server-side endpoint (`/api/send-email`) and dispatched to vendors via SMTP using `nodemailer`.

## Running Locally

**Prerequisites:** Node.js (v18+), Python 3.10+, and an OpenAI API Key.

```bash
# 1. Clone & Install
git clone [https://github.com/daohhuynh/Leviathan.git](https://github.com/daohhuynh/Leviathan.git)
cd Leviathan

# 2. Start the FastAPI Backend (Terminal 1)
export OPENAI_API_KEY="your_key_here"
pip install fastapi uvicorn pydantic browser-use langchain-openai langchain-core
fastapi dev api/main.py

# 3. Start the Next.js Client (Terminal 2)
# Open a new terminal tab, ensure you are in the Leviathan directory
npm install
npm run dev