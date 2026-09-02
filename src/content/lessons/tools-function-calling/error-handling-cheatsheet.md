---
title: "Error Handling Cheatsheet"
track: "tools-function-calling"
status: live
summary: "One page: the failure taxonomy, the retry decision tree, an error-message template, and the loop guards to always ship."
duration: "4 min read"
---

Everything in this module, compressed into something you can wire a handler from directly.

## The failure taxonomy

*Start here, then measure: log which class fires most in your system before tuning anything.*

| Class | Signal | Default route |
|---|---|---|
| Wrong tool chosen | Right-shaped call, wrong tool name for the intent | Return to model |
| Bad or missing argument | Real tool, real field, invalid/absent value | Return to model |
| Hallucinated tool/parameter | Name not in registry at all | Return to model, with a suggestion |
| Execution error | 4xx/5xx from a real dispatched call, or a raised exception | Depends — see retry tree below |
| Timeout | No response inside the deadline | Silent retry (careful with side effects) |
| Empty/ambiguous result | Call succeeded, answer is `[]`/`null`/unclear | Not an error — return as success |

Full definitions: [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures).

## Retry vs. return decision tree

```
failure occurs
     │
     ▼
is it in {timeout, 429, 502, 503, 504, connection reset}? ──yes──► retry in code,
     │no                                                         exponential backoff
     ▼                                                            + jitter, cap 3-4
does the model have (or can infer) the fix?                       attempts
 (bad arg, wrong tool, hallucinated name) ──yes──► return to model
     │no                                            as a tool result
     ▼
needs authority/info only a human has? ──yes──► escalate to user,
 (permission, real ambiguity, sensitive action)   stop trying automatically
     │no
     ▼
unclassified / already exhausted the above → fail hard, report honestly,
                                               don't loop further
```

Four destinations, compared in full: [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies).

## Backoff snippet (start here, then measure)

```python
import random, time

def call_with_backoff(fn, *a, max_attempts=4, base_delay=0.5, **kw):
    for attempt in range(max_attempts):
        try:
            return fn(*a, **kw)
        except TransientError:
            if attempt == max_attempts - 1:
                raise
            time.sleep(base_delay * (2 ** attempt) + random.uniform(0, base_delay))
```

4 attempts, base 0.5s is a reasonable default for interactive agent turns — tune `max_attempts` down for latency-sensitive UX, up for background jobs.

## Actionable error message template

```json
{
  "ok": false,
  "error": "<stable_snake_case_code>",
  "message": "'<field or tool>' <what's wrong>. Expected: <constraint>. Got: <value>.",
  "retryable": false
}
```

Checklist for every message before it ships:

- [ ] Names the specific field or tool, not just "the request"
- [ ] States the constraint (enum values, format, range) explicitly
- [ ] Includes the offending value, so the model can see exactly what to change
- [ ] Contains zero raw exception text, file paths, hostnames, or credentials
- [ ] `error` code is a stable string other code (loop guards, logs, tests) can match on

Full build-out: [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors). Why this shape works mechanically: [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics).

## Loop guards — ship all three

*Start here, then measure: tune the numbers against your real task depth, not these defaults blindly.*

| Guard | Default | Catches |
|---|---|---|
| Max tool calls per turn | 10-15 | Any runaway loop, varying or not |
| Identical-call short-circuit | 2 repeats | Tight loops resending the same failing call |
| Same-tool failure streak (varied args) | 3 in a row | Loops that vary arguments but never converge |
| Consecutive task failures → escalate | 3 | Failures no amount of self-correction will fix |

Full build-out and why each is necessary on its own: [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps). A real trace where the wrong guard was missing: [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop).

## The five mistakes that cause incidents

1. Catching an exception and returning `ok: True` anyway — the model thinks it succeeded.
2. Retrying a deterministic failure (bad arg, 404) instead of routing it back to the model.
3. Passing `str(exception)` straight into a model-facing message — credentials and internals leak.
4. Shipping an agent loop with no max-call cap.
5. Reporting a legitimate empty result through the error channel — triggers pointless retries.

Full write-up with symptoms and fixes: [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes).

**Related:** [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries), [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps), [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes)
