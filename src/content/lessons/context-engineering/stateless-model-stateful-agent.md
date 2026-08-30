---
title: "The Stateless Model Behind the Stateful Agent"
track: "context-engineering"
status: live
summary: "Nothing persists between calls except what your code explicitly resends — the mechanism behind every memory decision in this track."
duration: "8 min read"
---

> This one goes a layer deeper than the rest of the module strictly needs. Read it when you want the actual mechanism behind "the model doesn't remember," not just the implication.

A model call is a pure function: context in, a probability distribution over the next token out. Nothing about that function call retains anything once it returns. Everything that feels like memory in an agent or a chat interface is a fact about your code, not a fact about the model.

## The mechanism

Each call to a model API is computed fresh from the tokens present in that request. There is no session object inside the model, no hidden variable that survives from one call to the next, and no mechanism by which the model "recalls" a fact from a previous call unless that fact's tokens are present again, this time, in the current request. This is explicit at the API level: the standard multi-turn pattern is to resend the entire conversation history — system prompt, every prior turn, tool results — on every single request, because the server has no standing memory of a "conversation" between calls unless a session-preserving feature is explicitly used.

This holds even when a provider offers session-like conveniences. A stateful convenience layer built on top (a conversation ID, a compaction feature that returns a summarized block for you to resend) doesn't contradict the mechanism — it just moves *where* the bookkeeping happens, from your application code to the provider's. Even server-side compaction, which returns a special summarized block in the response, requires your code to append that block back into the next request's messages array; the model doesn't hold onto it on its own. Drop that append, and the "memory" it represents is gone, immediately, because nothing about it lived anywhere except in tokens you have to carry forward yourself.

## What the KV cache actually is (and isn't)

It's worth being precise here, because this is the detail that most often gets mistaken for the model "remembering" something. During generation, a transformer computes key and value tensors for every token it attends over; a performance optimization called the KV cache lets a provider reuse those tensors for tokens that are identical to a previous request's prefix, instead of recomputing them from scratch. See [The KV Cache](/learn/llm-foundations/the-kv-cache) for the mechanism and [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) for how to structure a payload to benefit from it.

This is a compute and cost optimization, not memory. It only helps when you resend the exact same prefix — the model still needs every one of those tokens present in the request to condition on them; the cache just avoids recomputing their internal representations from scratch. Change one byte anywhere in that prefix, and the cache for everything after it is void — the tokens have to be recomputed, and, notably, they still have to be *present*, cache or no cache. A cached prefix that you stopped sending wouldn't "still be remembered" — it just wouldn't be there anymore, full stop.

## Tracing one turn of an agent loop

Concretely, here's what actually happens across a single round-trip of a tool-using agent, the pattern behind Aria in [The Whole Game of Context Engineering](/learn/context-engineering/the-whole-game-of-context-engineering):

1. Application code holds a `messages` list, entirely in its own memory (a variable, a database row — nothing model-side).
2. A user message is appended to that list.
3. The application sends the model call with the *entire* `messages` list, plus `system` and `tools`, from scratch.
4. The model returns a response — say, a `tool_use` block. The application appends that full response back onto `messages`.
5. The application executes the tool itself and appends the result as a new message.
6. The application calls the model again — with the entire, now-longer `messages` list, sent again in full.
7. This repeats until the model returns a final answer.

Every single one of those calls is independently computed from whatever was in the request at that moment. Step 6 doesn't "continue" step 3's call in any model-internal sense — it's a brand new, self-contained computation that happens to have been handed a longer version of the same history. The illusion of one continuous conversation is entirely a property of the application faithfully reconstructing that history, turn after turn.

## Why this is the reason memory is an engineering problem

Once the mechanism is this explicit, the practical consequence follows directly: anything you want to survive beyond the current request — a customer's preference from three sessions ago, a fact from a conversation that's since been compacted away, a standing account detail — has to be captured, stored, and deliberately re-inserted by your code. The model contributes no persistence of its own to lean on. This is exactly why [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) and [Structured Memory Stores](/learn/context-engineering/structured-memory-stores) exist as their own topic in this track, distinct from context window management: memory is what you build *because* the model doesn't have any.

## The tradeoffs, stated precisely

**What statelessness buys you:** reproducibility (the same input, modulo sampling, always maps to the same conditioned distribution — nothing is drifting based on unseen prior state), horizontal scalability (any server holding the model can service any request, since there's no session affinity to maintain at the model layer), and auditability (the entire input that produced a given output is, by construction, fully visible in the request itself — nothing relevant was invisible to you).

**What it costs you:** every turn of a growing conversation resends everything that came before, so token cost and latency both scale with how much history has accumulated unless something actively manages it — the direct motivation for [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) and [Sliding Window Context Management](/learn/context-engineering/sliding-window-context-management). And the entire burden of deciding what persists, what gets forgotten, and what gets re-fetched moves to your application — the model offers no default here, good or bad, to fall back on.

**Related:** [The Window as Working Memory](/learn/context-engineering/context-window-as-working-memory) · [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) · [The KV Cache](/learn/llm-foundations/the-kv-cache) · [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
