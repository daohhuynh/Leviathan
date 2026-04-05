import asyncio
from swarm_agent import run_browser_task

async def main():
    print("[EXAMPLE] Initializing integration with Leviathan Swarm Agent...\n")
    
    # 1. Define your dynamic prompt based on other agent intelligence
    dynamic_prompt = (
        "Go to bestbuy.com and search for 'MacBook Pro M3'."
        "Find the current price of the 14-inch base model and return it."
    )
    
    # 2. Call the refactored function
    print(f"[EXAMPLE] Sending task to browser agent: '{dynamic_prompt}'")
    try:
        # 3. Wait for the browser agent to finish its execution and capture the result
        result = await run_browser_task(dynamic_prompt)
        
        print("\n[EXAMPLE] Task completed successfully!")
        
        # 4. Here you can pass `result.final_result()` (or the raw result) to your other agents.
        # Note: browser-use returns an AgentHistoryList, you usually want the final result.
        final_answer = result.final_result() if hasattr(result, 'final_result') else result
        print(f"[EXAMPLE] Result extracted for other agents: {final_answer}")
        
    except Exception as e:
        print(f"\n[EXAMPLE ERROR] Agent execution failed: {e}")

if __name__ == "__main__":
    # Execute the async main function
    asyncio.run(main())
