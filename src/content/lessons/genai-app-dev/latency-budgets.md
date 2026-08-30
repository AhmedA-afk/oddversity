---
title: "Setting a Latency Budget"
track: "genai-app-dev"
status: live
summary: "Pick a concrete latency target per feature before you build it, then let that number decide the model, streaming, and caching choices."
duration: "7 min read"
---

"Make it fast" isn't a budget — it's a mood. A budget is a number you can fail: checked before you ship, and again every time you change the model, the prompt, or the retrieval step underneath it.

## What it is

A latency budget is a target time-to-first-token (TTFT) and a target time-to-completion, set per feature, before you build it — not measured after the fact and rationalized. [Setting Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) already covered breaking a request into a step-by-step timeline; this lesson is about the number that timeline has to add up to, and why you pick it before you pick anything else about the implementation.

A few concrete anchors worth starting from:

- **Interactive chat or autocomplete-style UI:** TTFT under roughly 1,000ms, full response under roughly 5,000ms for a normal-length answer.
- **A "search this and tell me" feature with retrieval in the loop:** TTFT can slip to 1.5-2s — there's a retrieval hop before the model call even starts — with completion under 8-10s.
- **A background job** (batch summarization, a multi-step agent, video or audio generation): no interactive budget at all. See [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks).

These are starting points, not a spec. Tune them against what your own users actually tolerate for that specific feature — a legal-document summarizer and a live chat box do not share a tolerance for waiting.

## The mental model

Design backward. Pick the number first, then work back through the request timeline finding what has to be true at each step for the total to fit. If TTFT has to be under 1,000ms and prefill — processing the input before the first token appears — alone costs 400ms on a long prompt, you've just constrained input length before you've written a single line of retrieval code. The budget isn't a wish; it's an equation you solve in reverse, and every term in that equation is a design decision you get to make on purpose instead of by accident.

## Why it works this way

If you don't set the number first, you set it last — by shipping whatever the first working version happens to do and calling that "the latency," a decision nobody actually made. Setting the budget up front forces the real tradeoffs (model tier, whether to cache, whether to stream, whether this even belongs on the request path) to happen at design time, on purpose, instead of surfacing later as a production incident.

This is the frame the rest of this module hangs off. [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) explains what each millisecond in your budget actually is. [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95) tells you whether you're actually inside the number you set. And prompt caching, model cascades, and background jobs are the concrete levers you reach for when you're not.

## A concrete example (shown)

A support-chat feature: target TTFT under 1,000ms, complete response under 5,000ms for a roughly 300-token reply.

The timeline: auth and routing (~20ms), load conversation history (~15ms), build the prompt (~5ms), then the model call — prefill plus generation — which dominates everything else. At 3,000 input tokens, prefill contributes on the order of a couple hundred milliseconds; generation of 300 output tokens takes several seconds to finish streaming. Total lands inside budget, but not by a wide margin.

Now the team adds a product manual to the prompt for grounding, pushing input to 9,000 tokens. Prefill roughly triples, and the TTFT budget breaks. Solved backward, the options are exactly the levers this module covers: cache the manual's prefix so it's not reprocessed every call ([Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching)), pick a faster model for this tier, or trim what's actually sent ([Trimming Conversation History for Context Limits](/learn/genai-app-dev/trimming-conversation-history)). Notice what just happened: the budget told you which lever to reach for. Nothing about "9,000 tokens feels like a lot" would have told you that on its own.

## Where it shows up

- **Model selection** — [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover): a cheaper, faster tier for a tighter budget.
- **Whether to stream** — [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui): necessary the moment your TTFT and completion targets diverge by more than a beat.
- **Whether a task belongs in the request path at all** — [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks).
- **Cost tradeoffs**, when the fast option is also the pricier one — [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking).

## Watch out for

1. **One number for the whole app instead of per feature.** A legal-summary feature and an autocomplete box do not share a tolerance for waiting, and forcing them to share a budget either wastes money on the autocomplete or ships an unacceptably slow summary feature.
2. **Confusing "average is fine" with "budget met."** A budget checked only against p50 isn't being checked at all — see [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95).
3. **Setting the number after the model is already chosen.** That's not a budget, it's an excuse written down after the fact.

## Where next

[Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) breaks down what's actually inside that number — which parts you control, and which you don't.

**Related:** [Setting Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features), [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from), [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95), [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks), [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover)
