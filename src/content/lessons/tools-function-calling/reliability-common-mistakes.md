---
title: "Reliability Mistakes"
track: "tools-function-calling"
status: live
summary: "The four anti-patterns that turn an occasional tool failure into a production incident, with the fix for each."
duration: "6 min read"
---

Every mistake below shipped somewhere believing it was a reasonable shortcut. Each one is a specific, avoidable choice — not bad luck.

### The mistake: swallowing errors so the model thinks a call succeeded

```python
def call_tool(name, args):
    try:
        return {"ok": True, "result": dispatch(name, args)}
    except Exception:
        return {"ok": True, "result": None}  # "handled" the exception
```

**Why it's wrong.** `ok: True` tells the model the call worked. A `result: None` inside a success envelope looks like "the tool ran and there was nothing to return" — indistinguishable from a legitimate empty result — not "the tool crashed." The model has no signal that anything went wrong, so it proceeds as if the action it asked for actually happened.

**Symptom.** The model confidently reports something completed — "I've updated the ticket" — when the update never landed. Nobody notices until someone checks the ticket and it's untouched. These are among the hardest bugs to catch because nothing in the trace looks like an error; every call reports success.

**Fix.** Every code path that catches an exception returns `ok: False` with a real error object, per [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries). If you genuinely can't recover any information from the exception, that's still a failure — say so, don't default to success.

### The mistake: retrying non-retryable failures

```python
def call_tool_with_retry(name, args, attempts=3):
    for _ in range(attempts):
        try:
            return dispatch(name, args)
        except Exception:
            continue  # retry on literally anything
    raise
```

**Why it's wrong.** A `400` because an argument is malformed will return the identical `400` on every attempt — nothing about the request changed, so nothing about the outcome will either. [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) exists specifically because *some* failures are worth retrying and some never are, and catching `Exception` broadly erases that distinction.

**Symptom.** Elevated latency on failures that were never going to succeed — three round trips and three identical stack traces where one would have told you everything. In aggregate, this shows up as tail latency spikes that correlate with deterministic failures, not with actual infrastructure load.

**Fix.** Classify before retrying. Retry the transient set (timeouts, 429, 502/503/504) with backoff; route everything else back to the model or the user immediately, per the decision tree in [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools).

### The mistake: leaking secrets or stack traces in error text

```python
except Exception as e:
    return {"ok": False, "error": str(e)}
    # str(e) on a DB error can read:
    # "connection to postgresql://admin:hunter2@10.0.4.12:5432/prod failed"
```

**Why it's wrong.** `str(exc)` is written for a developer reading logs, not a model that's about to include it in a response the user might see. Connection strings, internal hostnames, file paths, and library-specific internals all leak straight into model context — and from there, potentially into a user-facing message, a summary, or a downstream tool call that echoes it back.

**Symptom.** A security review (or an incident) finds a production credential or internal hostname sitting in a chat transcript, because it passed through an error message nobody scrubbed. Even without a literal secret, internal file paths and stack traces handed to an end user look unprofessional and can leak information about your system's structure.

**Fix.** Never interpolate a raw exception into a model-facing message. Map exception types to a small set of hand-written, generic-but-actionable messages — the pattern built out fully in [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) — and log the real exception separately, somewhere the model's context never reaches.

### The mistake: shipping without an iteration cap

```python
while True:
    response = model.generate(messages)
    if response.tool_calls:
        for call in response.tool_calls:
            messages.append(execute(call))
    else:
        break
```

**Why it's wrong.** Nothing in this loop can terminate a run where the model keeps calling tools and never produces a final text response — a genuinely stuck model, a tool that always returns something call-worthy, or a tight failure loop like the one in [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop). Without a ceiling, "stuck" and "still working" look identical from the outside until someone notices the bill or the latency.

**Symptom.** A single conversation racks up dozens or hundreds of tool calls, the user gives up waiting long before the loop does, and the incident review finds no code path that would ever have stopped it on its own.

**Fix.** A hard max-call cap per turn, repeated-identical-call detection, and an escalate-after-N-failures rule — all three, stacked, as covered in [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps). None of the three is optional; each catches a shape of stuck loop the others miss.

### The mistake: treating an empty result as an error (or the reverse)

```python
def search(query):
    results = kb.query(query)
    if not results:
        return {"ok": False, "error": "search_failed"}  # it didn't fail
    return {"ok": True, "results": results}
```

**Why it's wrong.** "Found nothing" and "the tool broke" are different facts and call for different next moves — one calls for a different strategy, the other calls for a retry or a fix. Reporting the first as the second tells the model something false about what happened, and the model reasons from that false premise. This is the exact root cause traced end-to-end in [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop).

**Symptom.** The model retries a search with slightly reworded queries indefinitely, because every result says "failed" and rephrasing is the natural response to a failure — when the actual answer was "nothing matches, and no rephrasing will change that."

**Fix.** Keep a legitimate empty result inside the success envelope (`{"ok": true, "results": []}`), reserving the error channel for cases where the tool genuinely could not do its job. See the taxonomy's [empty/ambiguous result class](/learn/tools-function-calling/taxonomy-of-tool-failures) for why this gets its own category rather than folding into either "success" or "error."

## Pre-flight checklist

- [ ] Every `except` branch returns a real `ok: False` error object — none silently report success.
- [ ] Retries are gated on failure type (transient vs. deterministic), not applied uniformly to every exception.
- [ ] No raw `str(exception)` ever reaches a model-facing message; all error text is hand-written and reviewed for leaks.
- [ ] A hard max-tool-call cap exists for every agent turn, independent of any per-call retry cap.
- [ ] Repeated identical (or same-tool, no-success-streak) calls are detected and short-circuited before re-executing.
- [ ] Empty results return through the success path, not the error path.
- [ ] There's an escalation path to a human for failures the model can't plausibly fix on its own.

**Related:** [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries), [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps), [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors), [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop)
