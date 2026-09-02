---
title: "Streaming, Caching, and Batching Together"
track: "genai-app-dev"
status: live
summary: "How caching, streaming, and background batching interact rather than compete, and what that does to p95 and cost together."
duration: "9 min read"
---

*This is a deep-dive — optional depth for when you need to reason precisely about how the module's levers interact, rather than apply each one in isolation.*

Every lesson before this one treated one lever at a time: cache the prefix, stream the output, batch the background work. In a real system all three are usually in play simultaneously, and the interesting question isn't whether each one works — it's what happens where they touch.

## The three levers, restated precisely

- **Caching** removes recomputation of a stable prefix. It acts on the *prefill* stage of a request — see [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) for the four-stage breakdown this deep-dive builds on. It changes what a request costs and how quickly the first token can start.
- **Streaming** changes when the client can start rendering output, not how long the total generation takes. It acts on *felt* latency, delivering the same total tokens but starting to show them at TTFT instead of at completion.
- **Batching** trades individual-request latency for aggregate throughput and, on some providers, a lower per-token price for work that doesn't need to be interactive. It acts at the level of *how many requests run concurrently and on what timeline*, not on any single request's internal stages.

The reason these compose rather than compete is that they act on different axes of the same request: caching changes the cost of prefill, streaming changes when output becomes visible, batching changes the scheduling of the whole request relative to others. None of them touches the axis the other two operate on.

## Where they interact

**A cached prefix still streams.** This trips people up: caching feels like it should somehow deliver the answer "all at once, faster," but it doesn't — it only removes the prefill cost. Generation still proceeds token by token exactly as it would without caching, and streaming it to the client works exactly the same way. What changes is *when* generation can start: with a cached prefix, TTFT drops because prefill was skipped, so the first streamed token arrives sooner — but once it starts, the stream behaves identically either way. [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching) and [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui) are fully independent code paths that both apply to the same request without conflict.

**Batching forfeits both of the other two, on purpose.** Message Batches (or any equivalent async-batch API) process requests without an interactive connection — there's no client waiting on a stream, so streaming doesn't apply. And a batch job typically isn't repeating the same prefix across a tight time window the way an interactive session does, so the caching payoff is smaller or absent. That's not a design flaw — it's the correct tradeoff for the workload batching is for: hundreds of independent documents processed overnight don't need TTFT or a live prefix cache, they need throughput and, often, a lower per-token rate in exchange for accepting non-interactive turnaround. This is the same sync-vs-async decision from [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks), applied at the level of "how does this task get scheduled" rather than "does this task belong on the request path."

**Caching and background jobs compose cleanly.** A worker processing many jobs against the same reference document or tool schema — see [The Queue, Worker, and Webhook Pattern](/learn/genai-app-dev/queue-worker-webhook-pattern) — benefits from the exact same cache breakpoint an interactive feature would use, as long as the jobs run close enough together in time to fall inside the cache's TTL. A queue that processes one job every few hours per document won't see cache hits between them; one that processes a burst of jobs against the same document within minutes will.

## The combined effect on p95 and cost

Trace one interactive feature — a document Q&A chat — through all three levers stacked:

- **Baseline, no levers:** every question reprocesses the full document (high prefill, high TTFT), waits for the complete answer before showing anything (high felt latency), and runs synchronously (fine for a short answer, a liability if the document is long enough to push total latency past a few seconds).
- **Add caching:** the document's prefill cost and latency contribution drop to near zero after the first question in a session. p95 TTFT improves specifically for sessions with more than one question — session 1's first question doesn't benefit, but every question after it does, which pulls the *distribution* down even though the best case per session was always the same.
- **Add streaming:** felt latency drops independent of the above — the user sees the first words at TTFT instead of waiting for the full response, which for a 400-token answer can be the difference between "instant" and "a few seconds of nothing" even though total tokens delivered and total time are unchanged. This is a p50/p95 story about *perception*, not about the raw total-latency number moving.
- **Move overflow work to background:** if the same feature also supports "summarize this whole document," that request doesn't share the interactive session's latency budget at all — it's queued, and its cost and duration stop counting against the chat feature's p95 entirely, because it was never a synchronous request to begin with. This is what keeps one feature's structurally long task from dragging down the percentile metrics of every other feature sharing the route.

The composed system's p95 improves for a different reason at each layer — caching narrows the tail by removing the compounding prefill cost of a long session, streaming narrows the *felt* tail without changing the measured one, and moving batch work off the interactive path prevents an unrelated long task from polluting the interactive feature's percentile numbers at all. None of the three would get you there alone.

## The one thing that doesn't compose: cache TTL vs. batch scheduling

The one real conflict is scheduling. Prompt caching's TTL is typically minutes, sometimes hours with a paid extension. If a background batch job runs jobs against the same document spaced further apart than the TTL, every job pays a fresh cache write with no read ever landing — the cache exists, but the schedule never lets it pay off. Batching for throughput and caching for repetition are optimizing on different clocks, and a queue that processes jobs too slowly, too sparsely, effectively can't benefit from caching even when the content is identical across jobs. If this matters for your workload, either group same-document jobs to run within the cache's TTL, or accept that a batch workload trades away the caching win in exchange for a lower per-token batch rate — don't assume both discounts stack by default.

**Related:** [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from), [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching), [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui), [The Queue, Worker, and Webhook Pattern](/learn/genai-app-dev/queue-worker-webhook-pattern), [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95)
