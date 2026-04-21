# Leviathan

**Agentic B2B supply chain sourcing platform.**

Leviathan is a split-stack, AI-driven B2B sourcing engine that reduces an 8-hour manual procurement workflow into a 2-minute automated process. Designed for enterprise supply chain optimization, the system deploys a headless browser agent to autonomously navigate complex vendor platforms (e.g., Alibaba), extract dynamic pricing and Minimum Order Quantity (MOQ) data, and synthesize the findings into a formalized Letter of Intent (LOI) ready for immediate SMTP dispatch.

This repository demonstrates the architectural decoupling of a heavy, long-running Python AI workload from a high-frequency Next.js React client, utilizing unidirectional real-time event streaming and complex asynchronous state management.

## Decoupled Architecture & Data Pipeline

The application physically isolates the client UI from the heavy DOM-rendering and LLM inference compute, communicating across network boundaries.

1.  **Deployment Trigger:** The Next.js client initiates a deployment sequence, simultaneously opening a unidirectional Server-Sent Events (SSE) connection (`/stream-logs`) and executing a synchronous RESTful POST request (`/deploy`) to the FastAPI backend.
2.  **Cross-Origin Asynchronous Compute:** The FastAPI server, configured with wildcard CORS middleware, spawns an asynchronous `browser-use` task utilizing Playwright. Because browser orchestration is inherently I/O bound, execution is managed via Python's `async/await` coroutines, ensuring the Uvicorn ASGI event loop is never blocked.
3.  **Real-Time Telemetry (SSE):** A custom Python `logging.Handler` intercepts the root logger. Using `loop.call_soon_threadsafe()`, it pipes execution logs directly into dedicated `asyncio.Queue` instances for every connected client. The Next.js client consumes these via the `EventSource` API, dynamically parsing agent tags from the string payload to update the UI heuristically.
4.  **Synthesis and Egress:** Upon completion of the headless extraction phase, a secondary LangChain/GPT-4o pass synthesizes the unstructured data. The synchronous POST request returns the finalized LOI payload, at which point the client automatically closes the SSE stream.

## Asynchronous State & DOM Optimization

Managing high-frequency streaming data (SSE) within React typically causes fatal DOM thrashing. Leviathan employs strict state boundaries to prevent main-thread locking.

* **Zustand Global Store:** Global session state (execution status, live logs, generated LOI) is managed via Zustand. By utilizing selector-based subscriptions rather than Redux middleware, components only re-render when their specific state slice mutates.
* **DOM Thrashing Prevention:** The Live Terminal component bypasses React reconciliation entirely for scroll behavior. Instead of a state-driven scroll loop, it utilizes a direct `useRef` hook (`scrollRef.current.scrollTop`) combined with Framer Motion (`animate={{ height: 'auto' }}`) to handle layout animations via GPU-accelerated transforms.
* **SSR vs. CSR Segregation:** The application strictly separates rendering paths. Static layouts are Server-Side Rendered (SSR). However, the complex `@xyflow/react` node canvas relies on DOM measurements that do not exist on the server. To prevent fatal hydration mismatches, the Flow Canvas is dynamically imported as a client-only component (`ssr: false`).

## AI Orchestration & Fault Tolerance

LLM APIs and DOM layouts are inherently unreliable. The backend orchestrator is defensively engineered to prevent runaway costs, infinite loops, and unhandled exceptions.

* **Deterministic Token Constraints:** The `browser-use` agent is configured with Vision explicitly disabled (`use_vision=False`), forcing DOM text extraction over screenshot analysis and reducing token consumption by ~80%.
* **Hard Execution Ceilings:** To prevent the LLM from entering infinite agentic loops on complex, anti-scraping DOMs, the agent is hard-capped at a maximum of 10 execution steps (`max_steps=10`).
* **API Reliability Handling:** The LangChain `ChatOpenAI` instance is hardcoded with `max_retries=2`, preventing the system from locking up during upstream 500 errors.
* **Exception Trapping and Disconnects:** FastAPI generic exception catches prevent 500 status code spam. Furthermore, the orchestrator explicitly handles `asyncio.CancelledError`, trapping client disconnects mid-execution and returning a graceful mock payload to stabilize the server logs.
* **Heuristic Routing:** Instead of relying on the LLM to navigate from the Alibaba homepage (which is heavily defended by dynamic popups), the system heuristically constructs the direct search URL query string, bypassing the initial anti-scraping perimeter entirely.

## Running Locally

**Prerequisites:** Node.js (v18+), Python 3.10+, and an OpenAI API Key.

```bash
# 1. Clone & Install
git clone https://github.com/daohhuynh/Leviathan.git
cd Leviathan

# 2. Start the FastAPI Backend (Terminal 1)
export OPENAI_API_KEY="your_key_here"
pip install fastapi uvicorn pydantic browser-use langchain-openai langchain-core
fastapi dev api/main.py

# 3. Start the Next.js Client (Terminal 2)
# Open a new terminal tab, ensure you are in the Leviathan directory
npm install
npm run dev
```
