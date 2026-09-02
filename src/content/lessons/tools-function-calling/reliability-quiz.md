---
title: "Reliability Quiz"
track: "tools-function-calling"
status: live
summary: "Six questions on classifying failures, routing them correctly, writing actionable errors, and spotting a missing loop guard."
duration: "5 min read"
---

Six questions, pulled from the classification, routing, and message-writing judgment calls this module keeps coming back to.

## 1. Classify the failure

A tool call to `get_invoice(invoice_id=8821)` returns `500 Internal Server Error` from the billing service, and the same call has succeeded for other invoice IDs minutes earlier.

A) Bad or missing argument
B) Hallucinated tool
C) Execution error
D) Empty or ambiguous result

<details>
<summary>Answer</summary>

**Correct: C.** The call was well-formed (a real tool, a real field, a valid-looking ID) and dispatched successfully — the failure happened *during* execution, on the server side, which is exactly what defines an execution error in [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures).

- A is wrong: the argument itself isn't shown to be invalid — nothing indicates `8821` is malformed, and other IDs of the same shape work fine.
- B is wrong: `get_invoice` is a real, registered tool that's been called successfully before — there's no naming mismatch here.
- C is correct: a 500 from the service itself, on a well-formed request, is the execution-error class by definition.
- D is wrong: this isn't a case of the call succeeding with an unhelpful answer — the call itself failed with a server error.

</details>

## 2. Retry, return, or escalate?

`delete_environment(env_id="staging-04")` fails with `403 Forbidden` — the agent's service account doesn't have delete permissions on that environment.

A) Retry immediately with backoff
B) Return the error to the model as a tool result and let it retry
C) Escalate to a human for authorization
D) Silently retry once, then give up without telling anyone

<details>
<summary>Answer</summary>

**Correct: C.** No amount of retrying or model reasoning grants a permission the service account doesn't have — this is squarely a human-fixable failure, per the routing fork in [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries).

- A is wrong: `403` is deterministic, not transient — retrying the identical request returns the identical `403` every time, per [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools).
- B is wrong: the model can't fix a permission it has no power to grant itself — sending it back just adds a wasted turn before the failure inevitably needs a human anyway.
- C is correct: only a person can grant the missing permission or explicitly authorize the deletion — this is exactly the escalate-to-user case in [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies).
- D is wrong: retrying wastes an attempt on a guaranteed failure, and "give up without telling anyone" is the swallowed-error anti-pattern from [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes) — a failed deletion should never look like nothing happened.

</details>

## 3. Rewrite the error

A tool currently returns this on failure:

```json
{"ok": false, "error": "Traceback (most recent call last):\n  File \"handlers/booking.py\", line 44, in book\n    date.fromisoformat(depart_date)\nValueError: Invalid isoformat string: '03/2026'"}
```

Which rewrite is most actionable for the model, without leaking internals?

A) `{"ok": false, "error": "An error occurred while processing your request."}`
B) `{"ok": false, "error": "invalid_argument", "message": "'depart_date' must be in YYYY-MM-DD format, got '03/2026'."}`
C) `{"ok": false, "error": str(exc)}` (pass the original exception message through unchanged)
D) `{"ok": false, "error": "ValueError", "message": "handlers/booking.py line 44 failed."}`

<details>
<summary>Answer</summary>

**Correct: B.** It names the field (`depart_date`), states the constraint (`YYYY-MM-DD`), and includes the offending value (`'03/2026'`) — the full template from [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) — with zero internal detail (no file paths, no line numbers, no stack frames).

- A is wrong: too vague to act on — the model can't tell which argument was wrong or what a valid one looks like, the same failure mode traced in [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example).
- B is correct: field, constraint, and value are all present, and nothing internal leaked through.
- C is wrong: this is the raw traceback with different formatting — it still contains an internal file path and a Python-specific exception name that mean nothing to the model's reasoning about the *booking* schema, and it's exactly the leak pattern flagged in [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes).
- D is wrong: `line 44` is internal detail with zero corrective value, and "failed" without the expected format still leaves the model guessing at what a valid date looks like.

</details>

## 4. Spot the missing guard

```python
while True:
    response = model.generate(messages)
    if not response.tool_calls:
        break
    for call in response.tool_calls:
        result = dispatch(call.name, call.args)
        messages.append(to_tool_result(call, result))
```

This loop can run forever. What's the single most important guard missing?

A) A `try`/`except` around `dispatch`
B) A hard cap on total tool calls per turn
C) A system prompt reminding the model to be efficient
D) Logging every tool call to a file

<details>
<summary>Answer</summary>

**Correct: B.** Nothing in this loop can terminate a run where the model keeps generating tool calls indefinitely — a max-call cap is the one guard that bounds the loop unconditionally, regardless of what's causing it to keep going, per [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps).

- A is wrong: exception handling matters for individual call failures, but it doesn't stop a loop where every call "succeeds" and the model just keeps calling more tools — a healthy-looking loop can still run forever.
- B is correct: this is the one guard with no failure mode that lets the loop run past it — every other guard (identical-call detection, failure streaks) can be defeated by a loop varying its behavior enough, but a hard count cap always fires.
- C is wrong: a prompt instruction is a soft nudge, not an enforced bound — it can reduce how often the model over-calls, but it provides no guarantee, unlike code that actually counts and stops.
- D is wrong: logging helps you debug a stuck loop after the fact (see [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop)) but does nothing to stop one while it's happening.

</details>

## 5. Transient or deterministic?

A tool call to a third-party shipping API returns `429 Too Many Requests` with a `Retry-After: 2` header.

A) Deterministic — return it to the model to pick a different tool
B) Transient — retry after the indicated delay, with backoff if it recurs
C) Hallucinated call — the tool name must be wrong
D) Escalate to the user immediately

<details>
<summary>Answer</summary>

**Correct: B.** `429` is the textbook transient failure — rate limiting is about *when* you asked, not what you asked, and the API is explicitly telling you how long to wait, per the transient set in [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools).

- A is wrong: nothing about the request itself is invalid — a different tool wouldn't help, and the model has no power over the rate limit anyway.
- B is correct: respect the `Retry-After` hint (or fall back to exponential backoff with jitter if none is given) and retry entirely in code — the model never needs to see this.
- C is wrong: a `429` is a normal, well-formed response from a real API under load — there's no naming mismatch involved at all.
- D is wrong: escalating a routine rate limit to a human wastes their attention on something code should absorb silently, per the cost comparison in [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies).

</details>

## 6. Empty result or error?

A `find_flights(origin="JFK", destination="LAX", date="2026-12-25")` call runs successfully against a working flights API and genuinely has no matching flights for that route and date.

A) Return `{"ok": false, "error": "no_results"}` so the model knows to retry
B) Return `{"ok": true, "results": []}` — a correct, if unhelpful, answer
C) Raise an exception so it gets caught by the error handler
D) Silently retry the identical call a few times in case a flight appears

<details>
<summary>Answer</summary>

**Correct: B.** The tool did its job correctly and the honest answer is "no flights match" — that's a successful call with an empty payload, not a failure, per the taxonomy's empty/ambiguous-result class in [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures).

- A is wrong: this is the exact mislabeling that caused the stuck rephrasing loop in [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop) — a model told "failed" reasonably tries different arguments, which won't produce flights that don't exist.
- B is correct: nothing about the call actually failed — reporting it as a success with an empty result is the accurate, and the useful, answer.
- C is wrong: no exceptional condition occurred; raising treats a normal branch of the tool's behavior as if the tool were broken.
- D is wrong: retrying an identical query against a static "no flights on this date" fact wastes calls for an outcome that isn't going to change moments later — flagged directly in [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes).

</details>

**Related:** [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures), [Error Handling Cheatsheet](/learn/tools-function-calling/error-handling-cheatsheet), [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps)
