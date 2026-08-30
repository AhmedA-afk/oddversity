---
title: "System, User, Assistant, Tool: Roles as Structure"
track: "context-engineering"
status: live
summary: "The same fact behaves differently depending on which of the four message roles carries it into the window."
duration: "7 min read"
---

Put the identical sentence in a system prompt, a user turn, an assistant turn, and a tool result, and you get four different behaviors out of the model — not because the words changed, but because the role changed what the model does with them.

**The fact:** "Annual plans have no cancellation fee; monthly plans have a $15 fee." Here's what happens depending on which of the four roles carries it.

## System

**How it works:** the system field is sent once per request as a distinct, persistent channel — not a message in the conversation, but a standing instruction layer the model treats with the highest default authority. It's also, structurally, the part of the payload best positioned for [prompt caching](/learn/context-engineering/cache-aware-context-design): render order puts a stable system block ahead of the conversation, so an unchanged system prompt can be served from cache turn after turn.

**When it wins:** for facts and rules that should apply on every single turn regardless of what's being discussed — standing policy, not a one-off answer. Some current models also support appending an operator-style system message mid-conversation without invalidating the cached prefix, which is the right channel for a policy update that needs to take effect partway through a long session.

**Failure mode:** everything in the system prompt is sent on every call whether it's relevant to this turn or not — it's a fixed tax on the budget. A system prompt that accumulates every fact anyone ever thought was important stops being a "standing policy" and starts being an expensive, stale wall of text nobody re-audits. See [Context Window Anatomy](/learn/context-engineering/context-window-anatomy).

**Relative cost:** low per-token cost thanks to caching, but a real ongoing cost if it grows unchecked, since it can't be trimmed per-turn the way history can.

## User

**How it works:** the user role carries the human's (or the application's) turn-by-turn input. Content placed here — including retrieved passages injected as part of the user's message — gets normal conversational attention and is scoped to that turn, but it only persists into future turns if the full transcript containing it is still present in the window.

**When it wins:** for anything genuinely turn-specific — the actual question, retrieved context relevant to *this* question, structured data assembled just for this request. See [Structured Context Injection](/learn/context-engineering/structured-context-injection) for patterns on shaping this well.

**Failure mode:** a fact stated once in a user turn is not durable. If history gets compacted or trimmed later (see [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction)), a naive summarizer can drop it entirely unless it's specifically flagged as worth preserving — the fee policy mentioned once in turn three can simply vanish by turn twenty.

**Relative cost:** scales with conversation length — it's the segment most exposed to unbounded growth if nothing manages it.

## Assistant

**How it works:** prior assistant turns are replayed back into the window as part of history, and the model treats its own past outputs as established precedent — a strong conditioning signal, similar in effect to a worked example. If an earlier assistant turn stated the fee policy, later turns tend to stay consistent with it, the same way [in-context learning](/learn/llm-foundations/in-context-learning) lets prior examples shape new output.

**When it wins:** for reinforcing a fact you want the model to stay consistent with across a long conversation, once it's been correctly established — precedent that's right tends to stay right without needing to be re-injected some other way.

**Failure mode:** the same mechanism cuts the other way. If an earlier assistant turn stated the fee policy *wrong*, that error now carries the authority of "what we already agreed," and later turns tend to stay consistent with the mistake rather than correcting it — a wrong assistant turn is stickier than a wrong user turn, precisely because the model weights its own prior output as precedent.

**Relative cost:** free to add (it's generated, not authored), but every turn kept in history compounds the same unbounded-growth cost as the user role, and a bad one is expensive to leave in place.

## Tool

**How it works:** tool results carry externally-fetched, structured data — the output of `get_account`, `search_kb`, and similar. The model generally treats this as grounded fact from a system, not an assertion from either party in the conversation, which makes it the right channel for anything that needs to be current rather than assumed.

**When it wins:** for facts that must be freshly verified rather than relied on from memory or a static system prompt — pulling the customer's actual plan tier and its exact current fee from a live billing API, rather than hardcoding it into the system prompt where it can go stale.

**Failure mode:** tool content is also the highest-risk channel for [context poisoning](/learn/context-engineering/context-poisoning-and-distraction) — text embedded in a fetched document or API response can look like an instruction to the model, and it's easy to forget that content from an external source deserves less trust than content you authored yourself. See [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too).

**Relative cost:** variable and often the most volatile line item — raw API responses are frequently far larger than the fact you actually need from them, which is the whole argument behind [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication).

## Decision table

| Role | Best for | Persistence | Cache behavior | Main risk |
|---|---|---|---|---|
| System | Standing policy, persona, rules that apply every turn | Every call, by construction | Best cache candidate — keep it stable | Silent, unaudited growth |
| User | This turn's actual question or injected context | Only if history retains it | Volatile, grows with conversation | Facts lost on compaction |
| Assistant | Reinforcing an established, correct precedent | Only if history retains it | Volatile, same as user | A wrong fact becomes sticky precedent |
| Tool | Freshly fetched, must-be-current facts | Only if history retains it, and often raw/verbose | Volatile, often largest single line item | Injection risk, verbose duplication |

## How to choose

Ask what kind of fact this is before picking a role. A rule that should govern every answer, indefinitely, belongs in system — and stays cheap only if you actually audit it periodically rather than letting it accrete. A fact specific to what's being asked right now belongs in the user turn, alongside whatever was retrieved for it. A fact you want the model to stay consistent with across a long thread, once you're confident it's correct, benefits from having appeared in an assistant turn — but double-check assistant turns during review, since a wrong one is harder to dislodge than a wrong user turn. And anything that could have changed since the model last "knew" it — pricing, account state, inventory — belongs behind a tool call, fetched fresh, not asserted from any of the other three roles.

**Related:** [The Stateless Model Behind the Stateful Agent](/learn/context-engineering/stateless-model-stateful-agent) · [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) · [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) · [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) · [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction)
