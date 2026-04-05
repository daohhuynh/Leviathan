import os
import asyncio
from browser_use import Agent, Browser
from browser_use.llm import ChatOpenAI

# 1. API Keys
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
os.environ["ANONYMIZED_TELEMETRY"] = "false"

# 2. LLM
# Add max_retries to prevent infinite token/API loops on 500 errors
llm = ChatOpenAI(model="gpt-4o", max_retries=2)

async def execute_swarm_browser_task(dynamic_task_description: str) -> str:
    browser = Browser()
    
    import urllib.parse
    import re
    
    # Strip any leading digits (e.g. "5000") so Alibaba's search engine doesn't trip on quantities
    clean_query = re.sub(r'^\d+\s*', '', dynamic_task_description).replace("'", "").strip()
    encoded_search = urllib.parse.quote_plus(clean_query)
    
    b2b_prompt = (
        "=== B2B PROCUREMENT INSTRUCTIONS ===\n"
        f"OBJECTIVE: {dynamic_task_description}\n\n"
        "CRITICAL RULES & WORKFLOW:\n"
        "1. DO NOT START ON A HOMEPAGE. Navigate DIRECTLY to this pre-constructed search URL to bypass popups:\n"
        f"   https://www.alibaba.com/trade/search?SearchText={encoded_search}\n"
        "2. STRICT DIRECTIVE: DO NOT click on individual product pages. Alibaba's deep product pages are too fortified for extraction. You MUST STAY on the search results page.\n"
        "3. SCROLL: Once the search page loads, scroll down to ensure dynamic search cards load into the DOM.\n"
        "4. SHALLOW EXTRACT: Use your `extract` action to pull the basic Product Title, Price Bounds, and MOQ from the top 3 supplier cards visible directly on the search results page.\n"
        "5. Treat any leading numbers in the target as QUANTITIES for bulk manufacturing.\n"
        "6. Final step: Summarize the extracted data immediately."
    )
    
    agent = Agent(
        task=b2b_prompt,
        llm=llm,
        browser=browser,
        use_vision=False  # 🚨 CRITICAL: Disables screenshots. Saves ~80% of token costs.
    )
    
    try:
        # 🚨 CRITICAL: Cap the steps at 10. 
        # If it gets confused, it fails early instead of looping infinitely and draining your card.
        history = await agent.run(max_steps=10)
        
        final_text = history.final_result()
        if not final_text:
            return "Task completed or max steps reached, but no final text was returned."
        return final_text
    
    except Exception as e:
        # Catch the API error and print the actual error
        print(f"[SWARM_AGENT_ERROR] {str(e)}")
        # Return a clean plain-text string back to the swarm so it doesn't get stuck in a loop
        return "Task failed due to server error"
        
    finally:
        try:
            if hasattr(browser, 'close'):
                await browser.close()
        except Exception:
            pass

if __name__ == "__main__":
    target_objective = "Go to google.com, search for '5000 Custom Solar Inverters'. Click on 2 legitimate supplier websites, extract their pricing, and summarize your findings."
    
    print("[SWARM_CTRL] Dispatching local task (Cost-Optimized)...")
    final_report = asyncio.run(execute_swarm_browser_task(target_objective))
    
    print("\n=== AGENT OUTPUT ===")
    print(final_report)