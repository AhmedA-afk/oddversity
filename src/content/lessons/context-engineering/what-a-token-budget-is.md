---
title: "What a Token Budget Actually Is"
track: "context-engineering"
status: live
summary: "A token budget is an enforced cap split across segments, not an instruction to the model to 'be concise."
duration: "6 min read"
---

"Keep it concise" is a request you make of a model. A token budget is a constraint you make of your *system* — a number, written down before the first API call, that nothing in the pipeline is allowed to exceed.

## What it is

A token budget is two things at once: a hard total (the context window, minus whatever the provider reserves) and an explicit split of that total across the segments competing for it — system prompt, tool definitions, retrieved context, conversation history, the user's message, and the reply itself. "Budget 12,000 tokens" is not a budget. "12,000 tokens: 700 system, 1,000 tools, 3,800 retrieval, 4,500 history, 2,000 reply" is a budget, because it's a number for every consumer and a rule for what happens when one of them asks for more.

The difference from "try to be concise" is enforceability. Concise is a hope you hand to the model in the system prompt. A budget is a check your code runs before the request goes out — see [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) for the full anatomy of what those segments actually are.

## The mental model

Picture the window as a pie of fixed size: every slice you hand to one segment is a slice unavailable to the others, no matter how large the pie is to begin with. That's the full mental model, and it has its own lesson — [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model). The short version you need here: allocate the pie *before* you know exactly how much each segment wants, then enforce the allocation, rather than filling segments in order and discovering at the end how much is left for the reply.

## Why it works this way

Context windows are hard limits, not soft suggestions — an API call that exceeds one either gets truncated silently or rejected outright, and by the time that happens you've already spent the latency and, often, the money assembling the request. A budget moves the failure earlier and makes it visible: instead of the *provider* deciding what gets cut when you overflow, *you* decide, in code, with a policy you can inspect and test. That's the same shift [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) turns into working code.

It also forces a decision that's easy to duck otherwise: which segment loses when two need the same tokens. Without a budget, that decision gets made implicitly, by whichever segment happens to get assembled last. With a budget, you made it on purpose, in advance, when you could think clearly about the tradeoff instead of debugging a truncated response in production.

## A concrete example

Say you're building Aria, a support-ticket assistant. The model you've picked has plenty of headroom, but you don't hand Aria the whole window — you give her a working budget of 12,000 tokens for everything that isn't the final answer's own generation space, and you write it down before touching the retrieval pipeline:

```json
{
  "window_budget_tokens": 12000,
  "segments": {
    "system_prompt":        700,
    "tool_definitions":    1000,
    "retrieved_context":   3800,
    "conversation_history": 4500,
    "reply_headroom":      2000
  }
}
```

Notice reply headroom is a named line item, not an afterthought — Aria's budget carves it out first, at 2,000 tokens, before retrieval or history get to claim anything. That ordering matters enough that it's the subject of its own lesson later in this module.

Now contrast the unbudgeted version of the same agent. It has the same 12,000-token ceiling, but nobody wrote it down. The system prompt grows by 50 tokens every time someone patches a policy. Tool definitions creep up as the team adds a ninth and tenth tool. Retrieval returns "the top k chunks," where k was tuned once against a small test set. History replays every prior turn, unbounded. Most days this fits. Then a user asks a fact-heavy question, retrieval returns more than usual, history is deep into a long conversation, and the assembled request is 13,400 tokens — 1,400 over. There is no code path that catches this before the call goes out, so the provider truncates something, and it happens to be the end of the answer. Nobody decided that; it just happened, in production, to a real user.

## Where it shows up

Every agent that combines more than one context source needs this: RAG assistants splitting window between retrieval and history, coding agents splitting between file context and tool output, multi-turn chatbots splitting between memory and the current turn. Anywhere two segments can each grow, one of them will eventually crowd out the other unless a budget says otherwise.

## Watch out for

- **Treating the budget as documentation, not code.** A budget written in a design doc that nothing enforces is exactly as reliable as "please be concise" — it describes intent, not behavior. It only counts once a function checks it on every call.
- **Sizing segments in characters or a rough word count instead of real tokens.** The ratio between characters and tokens shifts with language, code, and formatting, so a budget that "looks" fine by character count can already be over by token count. Measure with the tokenizer you actually call — see [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice).
- **Setting the reply allocation last, by whatever's left over.** That's backwards — see the mental-model lesson below for why headroom needs to come first.

## Where next

[Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) turns this JSON object into an enforcement function. [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model) makes the tradeoff between segments concrete. For the broader landscape of allocation strategies, see [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies).

**Related:** [Context Window Anatomy](/learn/context-engineering/context-window-anatomy), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets), [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice)
