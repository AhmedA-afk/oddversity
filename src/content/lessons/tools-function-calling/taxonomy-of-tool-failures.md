---
title: "A Taxonomy of Tool-Calling Failures"
track: "tools-function-calling"
status: live
summary: "Six named failure classes for tool calls, so the rest of this module can say exactly which one it's fixing."
duration: "6 min read"
---

Before you can fix a broken tool call, you need to say which of a small number of ways it broke. "The agent messed up" isn't a diagnosis — "wrong tool chosen" and "execution error" get fixed by completely different code.

## What it is

Every tool-calling failure falls into one of six classes:

- **Wrong tool chosen** — the model picks a real tool that isn't the right one for the job (`search_orders` instead of `search_invoices`).
- **Bad or missing arguments** — the right tool, called with a value that's malformed, out of range, or absent where the schema requires it.
- **Hallucinated tool or parameter** — the model invents a tool name, or a parameter, that doesn't exist in the registry at all.
- **Execution error** — the call was well-formed and dispatched, but the tool itself failed: a 404, a permission denial, a downstream service throwing.
- **Timeout** — the call didn't finish inside the time budget. Distinct from execution error because you don't actually know whether it failed, succeeded, or is still running server-side.
- **Empty or ambiguous result** — the call succeeded and returned *something*, but that something doesn't answer the question — zero rows, a null field, a result the model can't tell how to use.

Pin these six names down now, because the rest of this module refers back to them by name instead of re-explaining each time.

## The mental model

Sort a failure by asking one question: **where in the call's lifecycle did it go wrong?**

```
choose tool → fill arguments → validate call exists → dispatch → execute → interpret result
     ↓              ↓                 ↓                  ↓          ↓            ↓
 wrong tool     bad/missing      hallucinated          (n/a —    execution     empty /
   chosen        arguments      tool/parameter       dispatch    error /       ambiguous
                                                        itself    timeout        result
                                                       rarely
                                                        fails)
```

That ordering matters because it also orders the fix. A failure earlier in the pipeline (wrong tool, hallucinated name) is a *reasoning or registry* problem — fixed with better descriptions, schemas, or a lookup check before dispatch. A failure later in the pipeline (execution error, timeout) is an *infrastructure* problem — fixed with retries, backoff, or circuit breakers. Empty results sit in a category of their own: nothing technically failed, so the fix is making sure your code doesn't misreport "nothing found" as an error, and doesn't misreport an error as "nothing found."

## Why it works this way

The taxonomy isn't just a naming exercise — each class implies a different owner for the fix:

| Class | Fixed by | Detected where |
|---|---|---|
| Wrong tool chosen | Better tool descriptions, fewer overlapping tools | Compare intent to tool used |
| Bad/missing arguments | Schema validation, clearer parameter docs | Validate before dispatch |
| Hallucinated tool/parameter | Registry check, tighter tool list, prompt fixes | Name lookup fails |
| Execution error | Retry/backoff logic, permission fixes | Non-2xx / exception from the tool |
| Timeout | Retry with backoff, idempotency checks | Deadline exceeded |
| Empty/ambiguous result | Distinguish "no data" from "failed" in the return shape | Result inspection, not an exception |

Collapsing these into one `except Exception` handler is the single most common reliability bug in tool-using agents: it treats a hallucinated tool name (a reasoning bug) the same as a 503 from a flaky downstream API (an infrastructure blip), and neither gets the fix it actually needs.

## A concrete example (shown)

A support-ticket agent, six calls, one failure class each:

| Call | What happened | Class |
|---|---|---|
| `search_orders(customer="jane@x.com")` when the user asked about an invoice | Real tool, wrong choice | Wrong tool chosen |
| `update_ticket(id=4471, priority="urgent")` | `priority` enum is `["low","medium","high"]` — `"urgent"` isn't valid | Bad or missing arguments |
| `lookup_customer_record(email=...)` | No such tool exists; the closest real one is `get_customer` | Hallucinated tool |
| `close_ticket(id=4471)` | Ticket service returns `403 Forbidden` — the caller lacks permission | Execution error |
| `search_kb(query="refund policy")` | Request sent, no response after 30s | Timeout |
| `search_kb(query="warranty for SKU-9981")` | Returns `{"results": []}` — nothing matches | Empty result |

Six calls, six different next steps: fix the description, fix the argument, fix the registry, escalate the permission, retry with backoff, tell the user honestly that nothing was found.

## Where it shows up

This taxonomy is the shared vocabulary for the whole module: [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) uses it to decide model-fixable vs. code-fixable, [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) splits retryable classes from non-retryable ones, and [When the Model Invents a Tool](/learn/tools-function-calling/hallucinated-tool-calls) goes deep on just one row of this table. It's also the finer-grained sibling of [Common Tool-Calling Failure Modes](/learn/tools-function-calling/common-tool-calling-failure-modes), which covers the same ground at a higher level alongside prevention strategies.

## Watch out for

- **Treating a timeout as an execution error.** A timeout tells you the response didn't arrive in time — not that the tool failed. If the call had a side effect (a write, a charge, a send), retrying blind can duplicate it. Timeouts on non-idempotent calls need an "did this actually happen?" check before a retry, not just a retry.
- **Conflating empty result with error.** `{"results": []}` is a correct answer, not a failure. Returning it through the same channel as an error object teaches the model — and your retry logic — to treat "found nothing" as "broken," which triggers pointless retries.
- **Filing hallucinated calls under "bad arguments."** A made-up tool name isn't a validation problem you fix by tightening a schema; the schema for a tool that doesn't exist is irrelevant. It's a registry and prompting problem, and it needs its own detection path — see [When the Model Invents a Tool](/learn/tools-function-calling/hallucinated-tool-calls).

## Where next

With names for the failure classes in place, the next question is what your code actually does when one shows up — [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) covers the core decision, and [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) covers the retry half of it in depth.

**Related:** [Common Tool-Calling Failure Modes](/learn/tools-function-calling/common-tool-calling-failure-modes), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries), [When the Model Invents a Tool](/learn/tools-function-calling/hallucinated-tool-calls), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps)
