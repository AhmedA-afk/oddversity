---
title: "Context Limits and Why History Must Be Trimmed"
track: "genai-app-dev"
status: live
summary: "Every turn resends the whole conversation, so a chat that runs long enough always hits the context window and the bill."
duration: "6 min read"
---

Because each API call is stateless, every turn resends the entire conversation so far — not just the newest message. A conversation that started at turn 1 with a 200-token exchange is, by turn 50, resending 50 turns of history before the model even sees the new question. Left unmanaged, this doesn't fail gracefully; it fails at a wall.

## What it is

Context trimming is the practice of deciding, on every turn, which subset of the stored history actually gets sent to the model — because "send everything" stops being an option once the conversation is long enough. There are two independent reasons it becomes necessary, and they bite at different points:

1. **The context window is a hard ceiling.** Every model has a maximum number of input tokens it will accept per call — [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) covers what actually constrains that number. Exceed it and the call fails outright, not gracefully.
2. **Cost and latency scale with tokens sent, well before you hit the ceiling.** You'll usually feel this long before the wall: a support bot with a 3,000-token system prompt and growing history is paying for, and waiting on, all of it every single turn.

## The mental model

Picture the context window as a fixed-size envelope you refill every turn, not a growing room the conversation lives in:

```text
[ system prompt ][ tool schemas ][ ...history... ][ new user message ]
|------------------------- token budget ------------------------------|
```

The envelope's total size is fixed by the model. Some of it is spoken for before the conversation even starts (system prompt, tool definitions) — see [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) for how to allocate what's left. What's left over is what history gets to occupy, and once history's natural size exceeds that leftover, something has to give: either you cut history, compress it, or stop the conversation.

## Why it works this way

This is a direct consequence of the statelessness covered in [Session and State for Multi-Turn Features](/learn/genai-app-dev/session-and-state-management): the model doesn't remember turn 1 by the time you're on turn 50, so if you want it to *behave* as if it remembers, you have to physically include enough of turn 1 in every subsequent call. There's no way around resending history without also giving something up — either older content, or fidelity of that content (a summary is less precise than the original transcript). Trimming isn't an optimization you bolt on later; it's the tax you pay for statelessness, due on every single turn.

## A concrete example

Say a model's context window is 32,000 tokens, and your system prompt plus tool schemas reserve 2,000 of those, plus you want to reserve 1,500 for the model's own response. That leaves a **budget of 28,500 tokens for history and the new user message** — arithmetic worth doing explicitly, not eyeballing:

```text
32,000  total window
- 2,000  system prompt + tool schemas
- 1,500  reserved for response
--------
28,500  available for conversation history + new message
```

If an average turn (user message + assistant reply) runs about 150 tokens, that budget holds roughly 190 turns before you're at the ceiling:

```text
28,500 / 150 ≈ 190 turns
```

That sounds like a lot — until one turn includes a pasted document, or a tool result returns a 2,000-token JSON blob, which is common enough that "average turn size" is a fiction most real conversations blow past in a handful of exchanges, not 190. This is exactly the math [the next lesson's](/learn/genai-app-dev/sliding-window-and-summarization-trim) `fitToBudget()` function runs on every turn — not once at design time, but live, because turn size varies.

## Where it shows up

- **Long support or coding sessions** — any chat feature where users don't start a new conversation for every question will eventually hit this, often within the same day of usage.
- **Tool-heavy agents** — tool results are usually the biggest line item in the budget; a single database query or web search result can be worth dozens of ordinary turns.
- **Cost dashboards that don't add up** — if your per-conversation cost is climbing turn-over-turn even though users are asking similarly-sized questions, resent history is almost always why. [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) is where that shows up on a bill.

## Watch out for

- **Confusing "hasn't failed yet" with "handled."** A conversation that hasn't hit the wall in testing will hit it in production, because production conversations run longer and include messier content (pasted logs, long documents) than your test fixtures do.
- **Trimming reactively, after a 400 error.** By the time the API rejects a call for exceeding the window, you've already lost the turn. Budget proactively, before the call, using the arithmetic above — not as an exception handler.
- **Ignoring tool results in the budget.** It's tempting to count only user/assistant text and forget that tool call arguments and their JSON results live in the same window and are often the largest single contributor.

## Where next

[Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim) turns this math into a real `fitToBudget()` function with two concrete strategies. If you haven't built the persistence layer this reads from yet, start with [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history).

**Related:** [Trimming Conversation History](/learn/genai-app-dev/trimming-conversation-history), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics), [Session and State for Multi-Turn Features](/learn/genai-app-dev/session-and-state-management), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
