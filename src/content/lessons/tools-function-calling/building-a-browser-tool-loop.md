---
title: "Building a Browser-Control Loop"
track: "tools-function-calling"
status: live
summary: "Wire a screenshot-in, action-out loop that drives a real page to fill and submit a form, with guards against wandering off-task."
duration: "8 min read"
---

Screenshot in, action out, repeat — that's the whole browser-control loop. This lesson builds it against a real page, with the guardrails that keep it from clicking things it shouldn't.

## What we're building

A browser tool where the model drives a real page end to end: capture a screenshot, receive the model's click/type action, execute it via a browser driver, loop until a multi-field form is filled and submitted. We'll use Playwright for the driver, but the loop shape is the same for any automation library.

## Setup

```bash
pip install playwright
playwright install chromium
```

Assume the model is being called with a standard tool-call loop already in place (see [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop)) and a headless browser instance that only this task session controls — never point this at a browser profile that's also logged into anything sensitive.

### Step 1: Define the action schema

```json
{
  "name": "browser_action",
  "description": "Perform one action on the current page based on the screenshot you were shown. Coordinates are pixels from the top-left of the viewport.",
  "input_schema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["click", "type", "scroll", "done"] },
      "x": { "type": "integer", "description": "Required for click." },
      "y": { "type": "integer", "description": "Required for click." },
      "text": { "type": "string", "description": "Required for type." },
      "scroll_amount": { "type": "integer", "description": "Pixels, required for scroll." }
    },
    "required": ["action"]
  }
}
```

> **Why a constrained enum instead of freeform actions?** A finite action set is one your dispatcher can fully validate before executing anything — see [Validating Tool Arguments](/learn/tools-function-calling/validating-tool-arguments). "Click here" as unstructured text has no such guarantee.

### Step 2: Capture and send the screenshot

```python
def capture_state(page):
    screenshot = page.screenshot()
    return {
        "screenshot_base64": base64.b64encode(screenshot).decode(),
        "url": page.url,
    }
```

> **Why this step?** The model can only act on what it currently sees — send the screenshot fresh on every turn, never reuse one from an earlier step. A stale screenshot is the single biggest cause of misclicks in this pattern.

### Step 3: Execute the action

```python
def execute_action(page, action: dict):
    if action["action"] == "click":
        page.mouse.click(action["x"], action["y"])
    elif action["action"] == "type":
        page.keyboard.type(action["text"])
    elif action["action"] == "scroll":
        page.mouse.wheel(0, action["scroll_amount"])
    elif action["action"] == "done":
        return True  # signal loop exit
    page.wait_for_load_state("networkidle", timeout=5000)
    return False
```

> **Why wait for network idle?** Clicking before the page finishes reacting is how you get the "stale coordinates" failure — the next screenshot needs to reflect the *settled* page, not a half-rendered transition.

### Step 4: Loop with a step budget and a domain guard

```python
MAX_STEPS = 15
ALLOWED_DOMAIN = "forms.example.com"

def run_browser_loop(page, goal: str):
    for step in range(MAX_STEPS):
        if urlparse(page.url).netloc != ALLOWED_DOMAIN:
            raise RuntimeError(f"Navigated off-task to {page.url}, aborting.")

        state = capture_state(page)
        tool_call = ask_model_for_next_action(goal, state)   # your model call
        if execute_action(page, tool_call.input):
            return "done"
    raise RuntimeError(f"Exceeded {MAX_STEPS} steps without finishing.")
```

> **Why this step?** Two independent guards, not one: a step cap stops an agent that's stuck retrying the same click forever, and a domain check stops one that follows a link off the page it was scoped to. Neither replaces the other — see [Infinite Loops and Retry Caps](/learn/tools-function-calling/infinite-loop-and-retry-caps) for why the cap alone isn't enough.

## Run it

Task: "Fill out the contact form with name Jane Doe, email jane@example.com, and submit." The loop captures a screenshot, the model clicks the name field, types the name, clicks email, types it, clicks Submit, and returns `done` — five or six turns, each a fresh screenshot and one action.

## Harden it

- Gate the final `submit`-type click behind an [approval step](/learn/tools-function-calling/approval-gates-for-sensitive-tools) if the form has any real-world consequence (a purchase, an account change) — everything up to that point is reversible, that click often isn't.
- Run the browser in a disposable, network-scoped container or VM, never on a machine with other logged-in sessions — see [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution).
- Log every action and every screenshot hash so a failed run is replayable — see [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging).

## Extend it

Swap raw pixel coordinates for a DOM/accessibility-tree snapshot (a labeled list of clickable elements the model picks by ID) — it's faster and far less prone to misclicks than screenshot-and-click, at the cost of only working on the web instead of any application with a screen. See [Computer-Use and Browser-Control Tools](/learn/tools-function-calling/computer-use-and-browser-tools) for that comparison in full.

**Related:** [Computer-Use and Browser-Control Tools](/learn/tools-function-calling/computer-use-and-browser-tools-concept), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Infinite Loops and Retry Caps](/learn/tools-function-calling/infinite-loop-and-retry-caps)
