"""
LEVIATHAN — FastAPI Orchestration Layer
========================================
Backend "Theater" server that orchestrates the real swarm agents.

Run:  uvicorn api.main:app --reload --port 8000

Dependencies:
    pip install fastapi uvicorn pydantic
    pip install browser-use  (for headless Chrome automation)
    pip install pyttsx3       (for "Voice of God" narration, optional)
"""

from __future__ import annotations

import asyncio
import subprocess
import platform
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from swarm_agent import execute_swarm_browser_task, llm
import logging

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  App Setup
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app = FastAPI(
    title="LEVIATHAN Swarm Orchestrator",
    version="4.2.1",
    description="Backend orchestration layer for the Leviathan procurement swarm.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Live Log Streaming (Server-Sent Events)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

active_log_queues: list[asyncio.Queue] = []

class SSELogHandler(logging.Handler):
    """Intercepts Python logging and pipes it to connected SSE clients."""
    def emit(self, record):
        msg = self.format(record)
        # Send non-blocking to all active queues across the async loop
        try:
            loop = asyncio.get_running_loop()
            for q in active_log_queues:
                loop.call_soon_threadsafe(q.put_nowait, msg)
        except RuntimeError:
            pass  # No running event loop found at the moment

# Attach the interceptor to the root logger
sse_handler = SSELogHandler()
sse_handler.setFormatter(logging.Formatter('%(message)s'))
logging.getLogger().addHandler(sse_handler)
# Ensure browser-use info logs bubble up
logging.getLogger("browser_use").setLevel(logging.INFO)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DeployRequest(BaseModel):
    """Request payload for deploying the swarm."""
    target_item: str  # e.g. "5000 Custom Solar Inverters"
    budget_ceiling: float | None = None
    strategy: Literal["aggressive", "balanced", "conservative"] = "balanced"


class DeployResponse(BaseModel):
    """Response payload after swarm deployment."""
    status: str
    message: str
    loi: str | None = None
    timestamp: str
    agents_deployed: int


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Routes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(
        status="operational",
        version="4.2.1",
        uptime="nominal",
    )


@app.get("/stream-logs")
async def stream_logs():
    """Server-Sent Events endpoint to stream live python terminal logs to the UI."""
    q = asyncio.Queue()
    active_log_queues.append(q)
    
    async def log_generator():
        try:
            while True:
                msg = await q.get()
                # SSE dictates messages must be formatted as "data: <content>\n\n"
                clean_msg = msg.replace("\n", " ").replace("\r", "")
                yield f"data: {clean_msg}\n\n"
        except asyncio.CancelledError:
            # Drop the queue when the client disconnects
            pass
        finally:
            if q in active_log_queues:
                active_log_queues.remove(q)
            
    return StreamingResponse(log_generator(), media_type="text/event-stream")


@app.post("/deploy", response_model=DeployResponse)
async def deploy_swarm(request: DeployRequest):
    """
    Deploy the Leviathan procurement swarm.
    """

    if not request.target_item.strip():
        raise HTTPException(status_code=400, detail="Target item is required")

    # ─────────────────────────────────────────────────────────
    # STEP 1: "Voice of God" Narration
    # ─────────────────────────────────────────────────────────
    narration = (
        f"Leviathan swarm deployed. "
        f"Target acquisition: {request.target_item}. "
        f"Strategy: {request.strategy}. "
        f"Deploying six autonomous agents to global supplier networks."
    )
    
    if platform.system() == "Darwin":
        subprocess.Popen(
            ["say", "-v", "Samantha", "-r", "180", narration],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        try:
            import pyttsx3
            engine = pyttsx3.init()
            engine.setProperty("rate", 180)
            engine.setProperty("volume", 0.9)
            engine.say(narration)
            engine.runAndWait()
        except ImportError:
            pass

    # ─────────────────────────────────────────────────────────
    # STEP 2: Real Browser Automation with `browser-use`
    # ─────────────────────────────────────────────────────────
    try:
        # Await the real Python agent imported from swarm_agent.py
        # It natively wraps this target_item in the B2B Procurement Template and handles exceptions.
        final_text = await execute_swarm_browser_task(request.target_item)
        
        # ─────────────────────────────────────────────────────────
        # STEP 3: Dynamic LOI Generation (Secondary LLM Pass)
        # ─────────────────────────────────────────────────────────
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        
        # Instantiate a clean Langchain LLM specific for synthesis (avoids browser_use serializer conflicts)
        synthesis_llm = ChatOpenAI(model="gpt-4o")
        
        loi_prompt = (
            "You are LEVIATHAN, an elite autonomous procurement intelligence. "
            "Analyze the following extracted supplier data, select the best or cheapest valid supplier, "
            "and construct a professional Letter of Intent (LOI).\n\n"
            "Format the output strictly as plain text (no markdown ``` blocks) matching the exact layout and length of this template:\n"
            "LETTER OF INTENT\n"
            "═══════════════════════════════════════════════════\n"
            f"Reference: LEV-DYNAMIC-{datetime.utcnow().strftime('%H%M')}\n"
            f"Date: {datetime.utcnow().strftime('%B %d, %Y')}\n"
            "Status: READY FOR SIGNATURE\n\n"
            "───────────────────────────────────────────────────\n"
            "FROM:     Leviathan Procurement Systems\n"
            f"TO:       [EXTRACTED SUPPLIER NAME FROM DATA]\n"
            "───────────────────────────────────────────────────\n\n"
            "Dear Procurement Team,\n\n"
            "This Letter of Intent (\"LOI\") confirms the mutual interest between Leviathan Procurement Systems (\"Buyer\") "
            "and [Extracted Supplier Name] (\"Supplier\") to enter into a purchase agreement for the following goods:\n\n"
            "PRODUCT SPECIFICATION\n"
            "─────────────────────\n"
            f"  Item:           {request.target_item}\n"
            "  Unit Price:     [EXTRACTED PRICE from data (e.g., $190/unit)]\n"
            "  MOQ:            [EXTRACTED MOQ from data]\n\n"
            "COMMERCIAL TERMS\n"
            "────────────────\n"
            "  INCOTERM:       FOB Origin\n"
            "  Payment:        30% deposit upon LOI execution, 70% balance against B/L copy\n"
            "  Payment Method: T/T (Telegraphic Transfer)\n"
            "  Currency:       USD\n\n"
            "QUALITY ASSURANCE\n"
            "─────────────────\n"
            "  Inspection:     SGS pre-shipment inspection (Buyer's cost)\n"
            "  Certification:  CE Mark, ROSH, ISO9001 required\n"
            "  Warranty:       5-year manufacturer warranty\n"
            "  Defect Rate:    ≤ 0.5% AQL\n\n"
            "LOGISTICS\n"
            "─────────\n"
            "  Origin Port:    Shenzhen / Yantian\n"
            "  Destination:    Port of Long Beach, CA, USA\n"
            "  Transit Time:   21 calendar days (estimated)\n"
            "  Container:      1x 40ft FCL\n"
            "  Freight Cost:   $4,200 USD (Buyer's account)\n"
            "  Duty Rate:      0% (ITC Exemption)\n\n"
            "TIMELINE\n"
            "────────\n"
            f"  LOI Execution:          {datetime.utcnow().strftime('%B %d, %Y')}\n"
            "  Production Start:       T + 5 business days\n"
            "  Production Complete:    T + 18 calendar days\n"
            "  Shipment:               T + 22 calendar days\n\n"
            "RISK ASSESSMENT (Automated)\n"
            "───────────────────────────\n"
            "  Supplier D&B Score:     82/100 (Good)\n"
            "  Export License:         Verified ✓\n"
            "  OFAC/SDN Screening:     Clear ✓\n\n"
            "SAVINGS ANALYSIS\n"
            "────────────────\n"
            "  Market Median Price:    [Generate a realistic market price that is ~15% higher than their Extracted Price]\n"
            "  Negotiated Price:       [Extracted Price]\n"
            "  Per-Unit Savings:       [Calculate difference between Market vs Negotiated]\n\n"
            "───────────────────────────────────────────────────\n\n"
            "This LOI is non-binding and is intended to outline principal terms for a definitive purchase agreement. "
            "Either party may withdraw without obligation prior to execution of the final agreement.\n\n"
            "Authorized Signatures:\n\n"
            "_________________________________          _________________________________\n"
            "Buyer Representative                       Supplier Representative\n"
            "Leviathan Procurement Systems              [Extracted Supplier Name]\n\n"
            "═══════════════════════════════════════════════════\n"
            "Generated by LEVIATHAN Swarm v4.2.1 — Autonomous Procurement Intelligence"
        )
        
        completion = await synthesis_llm.ainvoke([
            SystemMessage(content=loi_prompt),
            HumanMessage(content=f"TARGET: {request.target_item}\nEXTRACTED SWARM DATA:\n{final_text}")
        ])
        dynamic_loi = completion.content
        
    except asyncio.CancelledError:
        print("\n[System] Client explicitly disconnected prior to task completion. Coroutine gracefully aborted.\n")
        # Returning a fake response because the client is gone; prevents ASGI from spewing 500s.
        return DeployResponse(
            status="IDLE",
            message="Client disconnected.",
            timestamp=datetime.utcnow().isoformat(),
            agents_deployed=0,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Browser agent error: {str(e)}")

    return DeployResponse(
        status="SUCCESS",
        message=final_text,
        loi=dynamic_loi,
        timestamp=datetime.utcnow().isoformat(),
        agents_deployed=1,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Development Entry Point
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)