---
title: "Why Compaction Is Unavoidable"
track: "context-engineering"
status: live
summary: "Any agent conversation that keeps growing will eventually exceed its context window - the only question is what survives when it does."
duration: "7 min read"
---

Ask anyone running an agent in production long enough and you'll hear the same story: it worked great in the demo, then somewhere around turn 40 it started acting strange - repeating a question it already asked, forgetting an instruction from early in the session, or failing outright with a context-length error from the API. That's not a reasoning failure. That's arithmetic. The context window is a fixed size, the conversation is not, and a fixed ceiling loses to unbounded growth every time.

## What it is

Compaction is the practice of periodically compressing older conversation history into a smaller representation - a summary, a digest, a set of extracted facts - so a long-running session can keep going without hitting a hard token-limit error or silently losing whatever rolls out of the window. It's distinct from plain truncation, which just deletes what doesn't fit. Compaction tries to keep the parts of the history that matter (decisions made, constraints set, open questions) while giving up the parts that don't (the exact wording of a resolved back-and-forth, a tool call that succeeded on the second try).

The core claim of this lesson is unglamorous but important to internalize: compaction isn't a nice-to-have optimization reserved for unusually long sessions. It's a when-not-if requirement for any agent whose context keeps accumulating turn over turn. Build an agent without designing for compaction and you haven't avoided the problem - you've deferred discovering it to whichever user runs the longest session.

## The mental model

Picture the context window as a container with a fixed capacity - whatever your model's limit is, minus whatever you reserve for the system prompt, tool schemas, and the model's own output. See [context window anatomy](/learn/context-engineering/context-window-anatomy) for how that reservation actually gets carved up. Every turn - a user message, an assistant reply, a tool call and its result - adds tokens to that container. Nothing removes them unless you explicitly make it happen.

That's the whole model: a monotonically growing quantity inside a fixed-size box. It doesn't matter how large the box is. As long as the growth rate is positive and the conversation doesn't end on its own, the container fills. A 200K-token window buys more turns than a 32K one, but it doesn't change the shape of the problem - it just moves the turn number where you hit it. Treating a very large window as "big enough that I don't need to think about this" is the trap in [long-context strategies](/learn/context-engineering/long-context-strategies): bigger windows raise the ceiling, they don't remove it, and a genuinely long-running agent - a coding session that runs for hours, a support thread that spans days - will still find it.

## Why it works this way

The reason compaction is the right response, rather than just buying a bigger window, is that not all tokens in a growing transcript carry equal value going forward. A tool call that failed and got retried, a clarifying question answered three turns later, a file read whose contents are stale because the file has since changed - all of that was necessary to produce the current state of the conversation, but very little of it needs to be re-read verbatim to keep going. A small number of facts - the decisions made, the constraints the user stated, the plan currently being executed - retain their value indefinitely. Everything else decays.

Compaction is a bet on that asymmetry: spend a little work (usually an LLM call) converting the bulky, decaying part of the history into a compact, durable form, and let the container hold mostly high-value tokens instead of a flat, undifferentiated log. It trades fidelity - the exact path taken to reach a conclusion - for room, while trying hard not to trade away the conclusion itself. Get that trade wrong and you get [compaction that drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts); get it right and a session can run indefinitely inside a fixed-size window.

## A concrete example

Here's a rough, illustrative trace of what happens to a coding-agent session with no compaction at all. Assume a 200K-token window, with roughly 30K reserved for the system prompt, tool schemas, and headroom for the model's own response - leaving about 170K for conversation history. Each turn (a user or assistant message, plus any tool output like a file read or command result) runs, for this kind of agent, around 3,000 tokens on average - file contents and command output are verbose.

```python
window_budget = 170_000
avg_tokens_per_turn = 3_000
cumulative = 0

for turn in range(1, 100):
    cumulative += avg_tokens_per_turn
    if cumulative > window_budget:
        print(f"turn {turn}: budget exceeded ({cumulative:,} tokens)")
        break
```

```text
turn 57: budget exceeded (171,000 tokens)
```

These numbers are illustrative, not measured - a real session's per-turn size varies a lot with how chatty the tool output is. But the shape is the point: for any agent whose average turn size is a meaningful fraction of the window, the number of turns until the budget runs out is small enough to hit in a single working session, not some hypothetical edge case. Without an intervention, turn 57 either throws a hard API error or forces a crude truncation that drops whatever's oldest - including, potentially, the very first instruction the user gave.

## Where it shows up

This isn't specific to one kind of agent. A coding agent accumulates file reads and command output. A support bot accumulates a growing back-and-forth as a ticket drags on. A research agent accumulates retrieved documents and its own notes across a multi-hour investigation. Any of these hits the same wall, and the fix in every case is some version of the same idea: summarize the aging part of the history - see [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) - and, when a single summary isn't enough, [layer summaries hierarchically](/learn/context-engineering/hierarchical-summarization-explained) so detail survives where it matters most.

## Watch out for

- **Waiting for the hard error before you act.** If compaction only runs after the API rejects a request, you've already lost the chance to fold in the oldest turns gracefully. The healthier pattern triggers compaction on a budget threshold - say, when history crosses 70% of the reserved conversation budget - well before the ceiling, the same trigger discipline as [dynamic budget reallocation](/learn/context-engineering/dynamic-budget-reallocation).
- **Treating compaction as free.** Every compaction pass is itself a model call - it costs tokens and latency, and it's a lossy compression that can drop something you'll want later. It's a genuine tradeoff, not a strictly-better default to run on every turn.
- **Assuming a bigger context window solves this permanently.** A million-token window changes the turn count where you hit the wall, not whether you hit it, and it brings its own cost and [lost-in-the-middle](/learn/context-engineering/lost-in-the-middle) degradation well before the hard limit.

## Where next

Once you accept compaction is coming, the real design questions start: what exactly gets summarized and what has to survive word-for-word ([summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep)), whether one flat summary is enough or you need layers ([hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained)), and how to wire the trigger into an actual budget system rather than a gut feeling ([building a rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer)).

**Related:** [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction-deep), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization-explained), [Context Window Anatomy](/learn/context-engineering/context-window-anatomy), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies)
