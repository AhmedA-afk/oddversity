---
title: "The Window as Working Memory"
track: "context-engineering"
status: live
summary: "The context window behaves like a bounded desk you re-read every time, not a filing cabinet you can silently rely on."
duration: "6 min read"
---

Here's the one image worth keeping: the context window is a desk, not a filing cabinet. Everything on the desk gets looked at, every single time you glance at it. Nothing off the desk exists as far as that glance is concerned.

## The analogy

Picture working memory the way cognitive science actually uses the term: a small, bounded surface where you hold exactly what you're actively using, distinct from long-term memory, which is vast but has to be deliberately retrieved into working memory before it's usable. A context window is that desk, formalized. Every token you place on it is visible to the model on this call. Every token you don't place on it might as well not exist — the model isn't going to "remember" it from some other place, because there is no other place. There's no cabinet the model can open on its own; if a fact matters and it isn't on the desk, it's gone for this call.

The bound matters as much as the re-reading. A real desk only holds so many papers before new ones start sliding off the edge or burying the ones underneath — and a context window has the same property: a fixed token limit, and a real cost (in relevance, not just dollars) to everything you leave sitting on it.

## Walk it through, step by step

Turn one of a conversation: the desk holds a system prompt and the user's first question. Small, clean, everything visible at a glance.

Turn five: the desk now also holds four more question-answer pairs, plus whatever tool results got pulled along the way. Nothing has been taken off the desk — it's not how a naive implementation works — so the desk is now five times as full, and the model has to visually re-scan the whole thing to answer turn six, including the parts from turn one that may no longer be relevant.

Turn twenty, no cleanup: the desk is now covered edge to edge. The fact from turn three that actually answers turn twenty's question is in there — but it's under six other stacks of paper, sandwiched between things that don't matter anymore. This is the mechanism behind [Lost in the Middle](/learn/context-engineering/lost-in-the-middle): not that the fact vanished, but that a full desk makes any one item harder to find and weight correctly, exactly the dynamic walked through concretely in [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload).

Now picture the intervention: instead of stacking every turn's paper permanently, someone periodically bundles the older stack into one summary index card and clears the originals off the desk. That's [compaction](/learn/context-engineering/summarization-for-compaction) — it's not a nice-to-have, it's the desk-clearing that keeps the surface usable turn after turn. And the facts too important to risk losing to a bundling pass — a customer's account tier, a standing preference — get written down somewhere *other* than the desk, a drawer the agent deliberately opens when it needs them. That's the distinction this track draws between the window and durable memory, covered in [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) and [Structured Memory Stores](/learn/context-engineering/structured-memory-stores).

## The wrong intuition, corrected

The common wrong belief is: *the model remembers our conversation the way a person would, so once something's been said, it's known.* That's not what's happening. Nothing is retained between calls unless your code puts it back on the desk — see [The Stateless Model Behind the Stateful Agent](/learn/context-engineering/stateless-model-stateful-agent) for the mechanism underneath this. What feels like memory across a chat session is your application faithfully replaying the desk's contents every single turn, growing it as it goes.

The second wrong belief this corrects: *if it fits, it's fine to leave it there.* A human desk with room left doesn't get worse just because there's more paper on it — you can still find what you need by rifling through. A context window does get worse, because the model isn't rifling, it's giving weighted attention to everything present simultaneously, and more low-relevance material dilutes that attention even before you hit any hard limit. "It still fits" is not the same question as "it still helps," which is the whole argument in [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck).

## When the analogy breaks

The desk analogy implies a human is doing the tidying with judgment, glancing at each paper and deciding what to keep. A model doesn't triage its own context window — it has no built-in instinct to notice that the fact under six other stacks is the one that matters, and no mechanism to quietly clear space on its own between calls. Every bit of "tidying" — trimming, summarizing, retrieving instead of stuffing, deduplicating — has to be built by you, outside the model, as part of the application. See [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) for the pattern of only putting something on the desk the moment it's actually needed, rather than up front "just in case."

The analogy also breaks on cost: a full human desk doesn't charge you per paper. A full context window does — every token you carry, needed or not, costs money and latency on every single call, which is a constraint the physical metaphor doesn't capture at all.

**Related:** [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) · [Stateless Model, Stateful Agent](/learn/context-engineering/stateless-model-stateful-agent) · [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) · [Context Rot](/learn/context-engineering/context-rot) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
