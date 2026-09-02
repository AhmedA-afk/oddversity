---
title: "Moving Long Tasks to Background Jobs"
track: "genai-app-dev"
status: live
summary: "When a task exceeds the request budget, decide sync vs. async by expected duration before you write a line of queue code."
duration: "6 min read"
---

Every lesson so far in this module has been about making a request faster or cheaper inside the request-response cycle. This one is about the tasks where that cycle is the wrong shape entirely, no matter how much you optimize it.

## What it is

[Background Jobs for Long-Running AI Tasks](/learn/genai-app-dev/background-jobs-for-long-running-ai-tasks) covers the queue-and-worker mechanics for moving slow generations off the request thread. This lesson is the decision that comes first: when does a task actually cross the line from "optimize it" to "don't run it synchronously at all"? Multi-step agent runs, batch document summarization across hundreds of files, and video or long-form audio generation share one property — their expected duration isn't a latency problem you can budget your way out of. No amount of caching or a faster model turns a 90-second agent run into a 2-second one.

## The mental model

Line up every task your product runs against its expected duration, and put your [latency budget](/learn/genai-app-dev/latency-budgets) on the same axis. Anything comfortably inside the budget stays synchronous — that's every lesson before this one in the module. Anything that structurally can't fit, no matter how well-optimized, has to move off the request path entirely. There's a messy middle (10-30 seconds) where the honest move is often to just try synchronous with a hard timeout and a fallback, rather than build async infrastructure for a task that's merely slow rather than fundamentally long.

The test isn't "is this slow right now" — a slow synchronous call might just need caching or a smaller model, both covered earlier in this module. The test is "does this task's duration scale with something outside your control" — page count, agent step count, minutes of video — such that no per-call optimization changes which bucket it's in.

## Why it works this way

HTTP connections aren't built to hang open for minutes: load balancers time out, mobile connections drop, and tying up a server process for the full duration of a long generation means paying for idle wait time instead of compute. None of that is a latency problem you fix with a faster model — it's a structural mismatch between what a request-response cycle is for and what the task actually needs. Once you accept that, the fix stops being "make it faster" and becomes "give the client a job ID immediately and let it find out later," which is a completely different architecture, not a tuned version of the same one.

## A concrete example (shown)

A product summarizes uploaded documents. A single 3-page PDF finishes in a couple of seconds — synchronous, no different from any other feature in this module, budget it like the [chat-reply example](/learn/genai-app-dev/latency-budgets) and move on. A 200-page compliance report run through a multi-step extraction-then-summarize pipeline takes minutes, scaling roughly with page count. That's not a latency problem to optimize; it's structurally a different shape of task. The correct move isn't "try harder to make it fast" — it's return a job ID the instant the upload lands, run the extraction and summarization in a worker, and let the client poll or get notified when it's done.

Notice the two features share a codebase and a model, but not an architecture — the deciding factor is exactly the "does duration scale with something outside your control" test above, not the fact that one document happens to be bigger than another in the abstract.

## Where it shows up

- **Batch operations** — summarizing, tagging, or extracting across many documents in one request.
- **Multi-step agentic pipelines** — see [Multi-Step Agentic Tool Loops](/learn/genai-app-dev/multi-step-agentic-tool-loops) for the loop itself; once that loop's expected length is unbounded or large, it belongs off the request path.
- **Multimodal generation** — video, long audio, or anything where the generation itself, not just the model call, takes real wall-clock time. See [Handling Multimodal Input](/learn/genai-app-dev/handling-multimodal-input) for the input side of this.
- **Anywhere a human reviews output before it ships** — a background job pairs naturally with [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues), since neither the model run nor the review happens on a request thread.

## Watch out for

1. **Building async infrastructure for a task that just needed caching.** If the slowness is a repeated, cacheable prefix or an oversized model for the task, fix that first — see [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching) and [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade) — before reaching for a queue.
2. **Leaving the messy middle (10-30 seconds) undecided.** Don't let a task sit in ambiguous territory with no plan; pick synchronous-with-timeout-and-fallback or async-with-job-id deliberately, and write down which one and why.
3. **Forgetting the client still needs a UX for "not done yet."** Moving work off the request path doesn't remove the waiting — it moves where the waiting is designed, and an unstyled polling spinner is still a bad experience even though the architecture underneath it is now correct.

## Where next

[The Queue, Worker, and Webhook Pattern](/learn/genai-app-dev/queue-worker-webhook-pattern) builds the actual pipeline — enqueue, worker, status, and notification — for tasks that land on the async side of this decision.

**Related:** [Background Jobs for Long-Running AI Tasks](/learn/genai-app-dev/background-jobs-for-long-running-ai-tasks), [The Queue, Worker, and Webhook Pattern](/learn/genai-app-dev/queue-worker-webhook-pattern), [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues)
