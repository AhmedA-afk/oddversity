---
title: "Handling Tool Errors and Retries"
track: "tools-function-calling"
status: live
summary: "The core decision every failed tool call forces: fix it in code, fix it with the model, or hand it to a human."
duration: "6 min read"
---

A tool call fails. Something in your harness has to decide, in the next few lines of code, what happens to that failure — and that one decision determines whether the agent recovers gracefully or grinds to a halt.

## What it is

Every failed tool call reduces to the same three-way fork:

1. **Fix it in code.** The failure is infrastructure noise — a timeout, a 429, a flaky connection. Retry automatically, with backoff, without ever showing the model anything went wrong.
2. **Fix it with the model.** The failure is something the model caused and can correct — a bad argument, a wrong tool choice, a call to something that doesn't exist. Return the failure *as a tool result* and let the next turn fix it.
3. **Fix it with a human.** The failure needs information or authority the model doesn't have — a missing credential, a permission the model can't grant itself, a genuinely ambiguous request. Stop and ask.

Picking the wrong branch is the single biggest source of unreliable agents: infrastructure retries dressed up as model corrections burn latency for nothing, and model-fixable errors silently retried in code just fail again in exactly the same way, because the thing that needs to change — the argument, the tool, the plan — never does.

## The mental model

Route on **who has the missing information**, not on how scary the error looks:

```
failure occurs
     │
     ├─ code has everything needed to fix it? ──────► fix in code (retry/backoff)
     │        (transient — timeout, 429, 503)
     │
     ├─ model has (or can infer) what's needed? ─────► fix with model (return as result)
     │        (bad tool, bad argument, hallucinated
     │         name, needs a different approach)
     │
     └─ neither has it — needs a person? ────────────► fix with human (escalate)
              (missing auth, real ambiguity,
               destructive action needs sign-off)
```

Map this against the taxonomy from [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures): timeouts and execution errors from flaky infrastructure usually route to code; wrong tool, bad arguments, and hallucinated calls route to the model; anything gated on permission or genuine missing context routes to a human. Empty results are a special case — they're not a failure to route anywhere, just a result to hand back as-is.

## Why it works this way

The reason this works is almost mechanical: an LLM only knows what's in its context window. A tool call fails because the model didn't have the right information when it made the call — the wrong tool name, an argument it guessed, a resource it assumed existed. Silently retrying the identical call in code doesn't add any information, so it fails the identical way. The only thing that changes a model-caused failure is putting *new* information in front of the model — which is exactly what returning the error as a tool result does. Conversely, a transient network blip has nothing to do with what the model knew; showing the model a 503 and asking it to "fix" the call wastes a turn on a problem it has no power over.

This is the tool-execution layer of a broader pattern. The LLM API call that *produces* the tool-call request can also fail — rate limits, content filters, malformed completions — and that failure needs its own triage, covered in [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls). Keep the two layers separate: a 429 from your model provider is a different problem, with a different fix, than a 429 from the third-party API your tool wraps.

## A concrete example (shown)

```python
def call_tool(tool_name, args):
    try:
        return {"ok": True, "result": dispatch(tool_name, args)}
    except ToolTimeout:
        # code-fixable: retry with backoff, model never sees it
        return retry_with_backoff(tool_name, args)
    except ToolNotFound:
        # model-fixable: name isn't in the registry
        return {"ok": False,
                "error": "unknown_tool",
                "message": f"'{tool_name}' is not a registered tool. "
                           f"Available tools: {list(REGISTRY)}"}
    except ValidationError as e:
        # model-fixable: bad argument, name the field
        return {"ok": False, "error": "invalid_argument", "message": str(e)}
    except PermissionDenied:
        # human-fixable: the model has no way to grant itself access
        return {"ok": False,
                "error": "needs_approval",
                "message": "This action requires operator approval. Ask the user to confirm."}
```

Four branches, three destinations. Notice `ToolTimeout` never reaches the model at all — that's on purpose. The other three all return a structured object rather than raising, because [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model) has to see the failure to act on it, and `PermissionDenied` phrases the message for the *user*, not the model, since the model can't act on it either.

## Where it shows up

This routing decision sits underneath everything else in this module: [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) covers how to word the model-fixable branch so it's actually useful, [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) goes deep on the code-fixable branch, and [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies) expands this same three-way fork into a full comparison with worked tradeoffs.

## Watch out for

- **Retrying a model-fixable error in code.** A `400 Bad Request` because an enum value is wrong will return the identical `400` on attempt two, attempt three, and attempt ten. If the error message never changes and neither does the call, that's a sign it's routed to the wrong branch.
- **Never routing anything to a human.** Not every failure is recoverable by the model — a missing API key or a destructive action needing sign-off has no code fix and no prompt fix. An agent with no escalation path either fails silently or does something it shouldn't.
- **Deciding the route too late.** Route at the point the error is caught, in code, before it reaches the model — not by hoping the model figures out from a vague message which kind of failure it's looking at.

## Where next

Once a failure is routed to the model, the quality of the message you send back is everything — see [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) for how to write one, and [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics) for why a good message is enough to make the model self-correct on the next turn.

**Related:** [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures), [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors), [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools), [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls), [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies)
