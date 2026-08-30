---
title: "Signal-to-Noise in the Window"
track: "context-engineering"
status: live
summary: "Every irrelevant token doesn't just sit idle — it competes for the model's attention against the tokens that matter."
duration: "5 min read"
---

A microphone doesn't get worse at picking up a voice when you turn up the room's air conditioning. A language model's attention does. Add filler tokens to a context window and the tokens that actually matter don't just sit there unaffected — they get a smaller share of a limited resource.

## The analogy: a radio dial and a crowded band

Think of the context window as a radio signal shared across a fixed amount of bandwidth. The relevant fact is the station you want; every irrelevant token is noise sharing the same band. A little noise and you can still tune in fine. Pack the band with static — chatty preambles, redundant chunks, boilerplate the task doesn't need — and the receiver (the model's attention over the sequence) has to work harder to separate signal from noise, and it starts losing fidelity. It's not that the station stopped broadcasting; it's that the signal-to-noise ratio dropped and something that used to come through clearly now doesn't.

## Walk it step by step

Picture a simple needle-in-noise setup: bury one fact — "the API key rotates every 90 days" — in a context and ask a model to retrieve it.

1. **Fact alone, ~50 tokens of surrounding text.** The model finds it close to every time. Almost the whole context is signal.
2. **Fact plus 2,000 tokens of unrelated filler** — other policies, unrelated logs, boilerplate. The model still finds it most of the time, but you start seeing occasional misses or the model quoting a mangled version of the number.
3. **Fact plus 15,000 tokens of unrelated filler, structured as many small unrelated passages rather than one big block.** Recall drops further — not because the window "ran out of room" (there's plenty of budget left in a long-context model) but because the fact is now one weak signal among many competing passages, and the model's attention has more to sort through per token it actually processes.

The token budget was never the bottleneck in this progression — most modern context windows have room to spare for step 3. What degraded is the ratio of useful tokens to total tokens, and that ratio, not raw capacity, is what tracks retrieval accuracy. This is also why position compounds the problem: a fact buried in a noisy middle is doubly disadvantaged, which is the mechanism behind [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained).

## The wrong intuition to correct

The common wrong intuition is: "the model has a huge context window, so adding more retrieved context is free as long as I'm under the limit." That's true for cost and latency accounting, but false for accuracy. A 200K-token window that's 90% relevant, task-appropriate content behaves differently than the same window at 20% relevant content and 80% filler, even though both fit and both cost roughly proportional tokens. Spare budget is not spare *quality* — it's just spare room, and filling it with weak candidates has a real cost even when nothing overflows.

This is the whole argument for aggressive pruning even when you technically have tokens to spare: the question isn't "can I afford to include this," it's "does including this make the model's job easier or harder." A marginal chunk that clears a similarity threshold but adds little new information is, from this angle, actively harmful — see [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut) for the heuristic that operationalizes "does this earn its place."

## When the analogy breaks

The radio analogy has a limit: real noise is unstructured and random, but context "noise" is often plausible-looking text that competes semantically with the real answer, not just token count that dilutes attention. Two near-duplicate policy documents aren't random static — they're both coherent, on-topic, and can actively compete for the model's answer, sometimes producing a blended or wrong response rather than a merely fuzzy one. That's a sharper failure than a weak radio signal, and it's why redundancy filtering (see [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth)) matters as its own step, not just "add less noise in general." The dial can find a station through static; it can't always tell you which of two clear stations is the right one.

**Related:** [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained), [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut), [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth), [Context Rot](/learn/context-engineering/context-rot)
