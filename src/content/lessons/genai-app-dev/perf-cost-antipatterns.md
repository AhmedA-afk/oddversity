---
title: "Performance and Cost Antipatterns"
track: "genai-app-dev"
status: live
summary: "Five real ways features get slow and expensive at scale, each with the symptom that reveals it and the concrete fix."
duration: "7 min read"
---

None of these are exotic — they're the default behavior of code nobody has gone back to optimize yet. Run this list against a feature before it hits real traffic, not after the bill arrives.

### The mistake: re-sending untrimmed history every turn

**Why it's wrong.** The API is stateless — every request re-sends the full conversation, and a chat feature with no trimming strategy sends a linearly growing prompt on every single turn. Turn 40 of a long conversation pays to reprocess the same 39 turns it already paid to process 39 times before, and that cost scales with conversation length, not with what the user actually asked this turn.

**Symptom.** Cost-per-conversation climbs steadily the longer a session runs, and so does time-to-first-token, because a bigger prompt means more prefill before generation starts — see [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from). Users on long sessions report the feature "getting slower," and it genuinely is.

**Fix.** Apply a trimming strategy — a sliding window, summarization of older turns, or both — so history has a ceiling instead of growing unbounded. See [Trimming Conversation History for Context Limits](/learn/genai-app-dev/trimming-conversation-history) and [Sliding Window and Summarization Trim](/learn/genai-app-dev/sliding-window-and-summarization-trim) for the concrete patterns.

### The mistake: no caching on a fixed system prompt

**Why it's wrong.** A system prompt, tool schema, or reference document that's identical on every call is exactly the shape [prompt caching](/learn/genai-app-dev/prompt-caching) exists for — and skipping it means paying full prefill cost, every call, for content that hasn't changed since the last request.

**Symptom.** `usage.cache_read_input_tokens` reads zero (or the feature simply doesn't set `cache_control` at all), and a feature with a large, static prompt shows the same TTFT on the 500th call as the 1st. Cost-per-request stays flat and high instead of dropping after the first repeated call.

**Fix.** Put a cache breakpoint after the stable block and verify the hit rate, not just the presence of the parameter — walked through fully in [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching).

### The mistake: over-large `max_tokens`

**Why it's wrong.** Generation time is roughly linear in output length — asking for room the response will never use doesn't cost anything if the model stops early on its own, but a default `max_tokens` set far above what the feature actually needs invites verbose, padded output, and removes the one signal (a truncated response) that would otherwise tell you your format is too loose.

**Symptom.** Output token counts run consistently high relative to what the feature displays or uses, output cost dominates the per-request bill more than input does, and responses ramble past the point of usefulness before naturally stopping.

**Fix.** Size `max_tokens` to the feature's actual need — a classification task needs a few hundred tokens, not sixteen thousand — and pair it with structured output constraints where the shape of the answer is known in advance. See [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps).

### The mistake: a strong model on a trivial task

**Why it's wrong.** Routing every request to the most capable model "to be safe" pays frontier pricing for tasks a much cheaper model handles correctly — classification, short extraction, simple rewrites rarely need the model you'd reach for on open-ended reasoning.

**Symptom.** Cost-per-request is flat across wildly different task types in your [usage log](/learn/genai-app-dev/token-accounting-and-quotas) — the same model price shows up for a one-word sentiment label as for a multi-paragraph analysis, which is a strong signal nobody has looked at whether the cheap tier would do just as well.

**Fix.** Route by task, not by default — see [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies) — or go further and let a cheap model attempt first with escalation only on low confidence, per [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade).

### The mistake: blocking a request on a 30-second job

**Why it's wrong.** HTTP connections aren't built to hang open for minutes — load balancers time out, mobile connections drop, and a server process held open for the full duration of a long generation is paying for idle wait time, not compute. This is a structural mismatch, not a tuning problem; no amount of prompt optimization turns a genuinely long task into a short request.

**Symptom.** Intermittent timeout errors that correlate with the largest or most complex inputs, users reporting the feature "just hangs" on certain requests, and a server or serverless invocation with an unusually high average hold time for one specific endpoint.

**Fix.** Move the task off the request path — enqueue it, run it in a worker, and let the client poll or receive a webhook. See [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks) for the decision and [The Queue, Worker, and Webhook Pattern](/learn/genai-app-dev/queue-worker-webhook-pattern) for the build.

## Pre-flight checklist

- Every chat or multi-turn feature has an explicit trimming strategy with a hard ceiling — no unbounded history.
- Every fixed or large system prompt has a cache breakpoint, and `cache_read_input_tokens` is actually nonzero in production traffic.
- `max_tokens` is sized to the feature, not left at a generous default "just in case."
- At least one pass has been made asking "does this task need the strong model, or would the cheap one work?" — for every route, not just the obviously trivial ones.
- No request path has a model call that can realistically run past 10-15 seconds without a queue, a hard timeout, or both.
- p95 latency and cost-per-request are both monitored per feature — see [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95) and [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) — not just checked once at launch and forgotten.

**Related:** [Trimming Conversation History for Context Limits](/learn/genai-app-dev/trimming-conversation-history), [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching), [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade), [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
