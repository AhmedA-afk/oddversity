---
title: "Quiz: Performance and Cost"
track: "genai-app-dev"
status: live
summary: "Ten questions on latency decomposition, tail metrics, cost math, cacheable prefixes, model cascades, and the sync-vs-async boundary."
duration: "10 min read"
---

Ten questions covering the whole module, including a scenario where you pick the right optimizations to hit a latency budget. Each answer explains why the other options are wrong, not just which one is right.

## 1. Decomposing a slow request

A feature's total latency is dominated by a long delay before the first token appears, but once it starts streaming, tokens arrive quickly. Which stage is most likely the bottleneck?

- **A.** Generation — the output is too long.
- **B.** Prefill, driven by a long input — the model has to process the whole prompt before producing anything.
- **C.** The network hop between client and server.
- **D.** The response can't be diagnosed without more information.

<details><summary>Answer</summary>

**Correct: B.** As [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) breaks down, TTFT is network + queue + prefill — and prefill scales with input length. A long delay before the first token, followed by fast streaming once it starts, is the signature of expensive prefill on a large input, not slow generation. **A** is wrong because generation speed shows up *after* the first token, in how quickly subsequent tokens arrive — which the question says is fast. **C** network delay would show up as a roughly constant, usually small, overhead — it doesn't typically explain a long variable delay tied to prompt size. **D** the question already gives you the signature (long delay, then fast streaming) that specifically points to prefill — enough information to diagnose it.

</details>

## 2. Why output length costs latency linearly

Why does a response with three times the output tokens take roughly three times as long to finish generating?

- **A.** The provider deliberately throttles longer responses to save compute.
- **B.** Tokens are generated sequentially, each depending on the ones before it, so total generation time scales with token count.
- **C.** Longer responses always use a larger, slower model.
- **D.** It doesn't — output length has no effect on latency once streaming starts.

<details><summary>Answer</summary>

**Correct: B.** [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) covers this directly: generation is autoregressive — each token's computation depends causally on every token before it, so there's no shortcut to producing more tokens faster. Time scales with count. **A** there's no deliberate throttling mechanism at play here; the linear relationship is a direct consequence of how generation works, not a policy. **C** model size is an independent choice from response length — a small model can still be asked for a long response, and it will still take proportionally longer for a longer one. **D** is the opposite of what happens — output length is precisely what generation time scales with.

</details>

## 3. Reading a latency dashboard

A dashboard shows average latency for a chat feature at 900ms — well within budget. A support ticket says a user experienced an 8-second wait. Which of these best explains why both can be true?

- **A.** The support ticket is describing a different feature.
- **B.** The average is dragged toward the bulk of fast requests and hides the tail — the p95 or p99 could be far above 900ms even with a low average.
- **C.** Averages and percentiles always report the same number for a large enough sample.
- **D.** The 8-second wait must be a measurement error.

<details><summary>Answer</summary>

**Correct: B.** [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95) makes exactly this point — the average lies about the experience of users in the tail. A low average is fully consistent with a p95 or p99 many multiples higher, and that's the number the unlucky user actually felt. **A** assumes information not given — there's no reason to doubt the report without evidence. **C** is false by definition; average and percentile only converge when the distribution has no tail at all, which is rarely true for LLM latency. **D** dismisses a real signal instead of investigating the tail, which is the actual mistake this question is testing for.

</details>

## 4. The token-cost formula

A request uses 3,000 input tokens and 600 output tokens against a model priced at $2.00 per million input tokens and $10.00 per million output tokens. What's the cost of this request?

- **A.** $0.012
- **B.** $0.006
- **C.** $0.030
- **D.** $0.0006

<details><summary>Answer</summary>

**Correct: A.** `(3000/1,000,000)*2.00 + (600/1,000,000)*10.00 = 0.006 + 0.006 = $0.012`, matching the formula in the [Performance and Cost Cheatsheet](/learn/genai-app-dev/perf-cost-cheatsheet). **B** is only the output-token half of the cost ($0.006), missing the input contribution. **C** overstates it — that would require roughly 2.5x the actual output cost or a much higher per-token rate than given. **D** is off by two orders of magnitude, likely from a units slip (treating the prices as per-token instead of per-million-tokens).

</details>

## 5. What makes a prefix cacheable

Which of these prefixes is the best candidate for a prompt-caching breakpoint?

- **A.** The user's current message, since it's what the model needs to answer.
- **B.** A 4,000-token system prompt and tool schema that's identical across every call to this feature.
- **C.** A prompt that includes the current server timestamp for logging purposes.
- **D.** A prompt that's different on every single call, with no repeated content.

<details><summary>Answer</summary>

**Correct: B.** [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching) is explicit: caching only pays off for content that's stable and repeated across calls — a static, sizable system prompt and tool schema is the textbook case. **A** the user's message is exactly the part that should sit *after* the cache breakpoint, since it's unique every time — caching it gives no benefit. **C** a timestamp inside the prefix is a classic silent cache-buster — it changes on every call, breaking the match for everything after it even if the rest is stable. **D** with no repeated content, there's nothing for a breakpoint to reuse — the first call would pay the cache-write premium and never earn it back.

</details>

## 6. Diagnosing a caching bug

A team adds `cache_control` to their system prompt, but `usage.cache_read_input_tokens` reads zero across thousands of otherwise-similar calls. What's the most likely cause?

- **A.** Caching only works for user messages, never system prompts.
- **B.** Something ahead of the breakpoint — a session ID, a timestamp, or unsorted JSON — differs on every call, invalidating the match every time.
- **C.** The feature simply hasn't been called enough times yet.
- **D.** `cache_read_input_tokens` only populates after 24 hours.

<details><summary>Answer</summary>

**Correct: B.** [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching) calls this out directly as the most common failure: any byte difference ahead of the breakpoint breaks the match, and a zero read rate across many calls is the signature of exactly that. **A** system prompts are one of the most common things to cache — that's not a restriction. **C** caching either works or it doesn't on a call-by-call basis; volume alone doesn't cause it to "turn on." **D** there's no such delay — a cache hit or miss is knowable on the very next matching call within the TTL, not after a fixed waiting period.

</details>

## 7. Tuning a model cascade

A cascade's cheap model reports a confidence score, and requests below a threshold escalate to a strong model. If the threshold is set very low (say, escalating almost nothing), what's the most likely consequence?

- **A.** Cost drops close to the always-cheap baseline, but errors the cheap model would have caught by escalating go uncaught.
- **B.** Cost rises close to the always-strong baseline, with no quality benefit.
- **C.** The cascade behaves identically regardless of threshold.
- **D.** Latency increases significantly for every request.

<details><summary>Answer</summary>

**Correct: A.** [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade) walks through exactly this tradeoff: a low escalation rate keeps blended cost near the cheap model's price, but it also means fewer of the genuinely uncertain cases get the strong model's second look — the whole point of the threshold is to catch those. **B** describes the opposite end of the threshold range (a very *high* escalation rate), not a low one. **C** the threshold is precisely what determines the cascade's behavior — the worked example's blended-cost formula depends directly on the escalation rate it produces. **D** a lower escalation rate means *fewer* strong-model calls, which would tend to lower average latency across the population, not raise it.

</details>

## 8. The sync-vs-async decision

A feature runs a multi-step agent loop whose duration scales with how many steps the task needs — sometimes 5 seconds, sometimes several minutes, depending on the input. What's the right default architecture?

- **A.** Always synchronous, since most requests finish quickly.
- **B.** Background job with a queue and worker — the task's duration scales with something outside your control, which is the structural signal for moving it off the request path.
- **C.** Always synchronous, but with a much higher timeout configured.
- **D.** Client-side inference, to avoid the server round-trip entirely.

<details><summary>Answer</summary>

**Correct: B.** [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks) gives exactly this test: a task whose duration scales with something outside your control — step count, page count, media length — is structurally the wrong shape for a request-response cycle, regardless of how fast the typical case is. **A** the typical-case speed doesn't matter if the tail can run minutes long — that's precisely the case a queue is for. **C** a longer timeout doesn't fix the underlying problem (load balancer timeouts, dropped mobile connections, a held-open server process) — it just delays when it breaks. **D** client-side inference is a narrow exception for small, specific tasks — an unbounded multi-step agent loop is exactly the kind of task [Client-Side Inference: When It Makes Sense](/learn/genai-app-dev/client-side-inference-tradeoffs) says doesn't fit a small local model.

</details>

## 9. Scenario: hitting a 1-second TTFT budget

A support-chat feature has a 1,000ms TTFT budget. Measurement shows: input averages 8,000 tokens (a large static knowledge-base excerpt plus conversation history), the model is a frontier-tier model used for every request regardless of complexity, and p95 TTFT is currently 2,400ms. Which single change is most likely to close the largest part of that gap?

- **A.** Increase `max_tokens` so responses don't get cut off.
- **B.** Add a prompt-caching breakpoint after the static knowledge-base excerpt, since it doesn't change between requests.
- **C.** Switch to a background job with polling.
- **D.** Add a retry with exponential backoff around the model call.

<details><summary>Answer</summary>

**Correct: B.** The 8,000-token input dominated by a *static* excerpt is exactly the profile [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching) and [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) point to — prefill on a large stable prefix is a direct, controllable contributor to TTFT, and caching removes it from every call after the first in a session. **A** `max_tokens` affects generation length and total latency, not TTFT — it doesn't touch the delay before the first token. **C** this is an interactive chat feature with a sub-second budget — moving it to a background job changes the product, it doesn't hit the budget. **D** retries address failures, not baseline latency on successful calls — and would make a slow request slower, not faster, if it ever fired.

</details>

## 10. Scenario: the trimming trap

The same feature also resends full conversation history on every turn with no trimming. By turn 30, input tokens have grown to 22,000 and TTFT has grown right along with it, even though the caching fix from question 9 is already in place. Why didn't caching alone solve this?

- **A.** Caching doesn't work on conversation history at all, only system prompts.
- **B.** The conversation history itself is not the *stable* part of the request — it grows and changes every turn, so it sits after the cache breakpoint and gets reprocessed in full each time, on top of whatever's cached.
- **C.** The cache TTL expired partway through the conversation.
- **D.** This means the caching fix from question 9 must have been implemented incorrectly.

<details><summary>Answer</summary>

**Correct: B.** This is the exact interaction [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching) and [Performance and Cost Antipatterns](/learn/genai-app-dev/perf-cost-antipatterns) both flag: caching only removes the cost of the *stable* prefix, and an ever-growing history is by definition not stable — it needs its own fix, a trimming strategy, addressed separately in [Trimming Conversation History for Context Limits](/learn/genai-app-dev/trimming-conversation-history). Caching and trimming solve different parts of the same input-length problem, and neither substitutes for the other. **A** caching works on any stable prefix, including a frozen system prompt — the issue here is that history specifically isn't stable, not a blanket restriction on what can be cached. **C** a TTL expiring would show up as an occasional cache miss, not a smooth, steady growth in TTFT tied to turn count. **D** nothing in the scenario suggests the caching fix broke — it's still doing its job on the knowledge-base excerpt; it just was never going to cover a different, growing part of the prompt.

</details>

**Related:** [Performance and Cost Cheatsheet](/learn/genai-app-dev/perf-cost-cheatsheet), [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Performance and Cost Antipatterns](/learn/genai-app-dev/perf-cost-antipatterns), [Streaming, Caching, and Batching Together](/learn/genai-app-dev/streaming-caching-batching-together)
