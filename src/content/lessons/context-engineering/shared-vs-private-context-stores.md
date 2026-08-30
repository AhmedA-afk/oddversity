---
title: "Shared vs Private Context Stores"
track: "context-engineering"
status: live
summary: "Four ways multi-agent systems share state, and the consistency-versus-contamination tradeoff each one makes."
duration: "7 min read"
---

"Should agents share context or not" doesn't have one answer — it has at least four common architectures, each trading consistency for isolation differently. The right pick depends on how much agents actually need to see each other's live state versus just each other's conclusions.

## Shared blackboard

**How it works.** One store — a document, a database record, a shared scratch object — that every agent can read and write during the task. Whoever needs a fact reads it live; whoever discovers a fact writes it for everyone else to see, immediately.

**When it wins.** Tasks where agents genuinely need to see each other's in-progress state to avoid duplicate work or contradictory actions — several agents editing different parts of the same document and needing to know what's already claimed or already changed.

**Failure mode.** Contamination. Anything written to the blackboard, including a wrong or half-formed guess, is now visible to every other agent as if it were settled, and a stale entry can silently mislead an agent that reads it after the fact has changed. This is [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction) generalized to a multi-writer store: with N writers, there are N sources of potential contamination instead of one.

**Relative cost.** Cheap to build, expensive to keep correct — without write discipline (timestamps, ownership, retraction), a blackboard degrades into noise faster than any single agent's own context window would.

## Private stores with explicit handoffs

**How it works.** Each agent keeps its own context; nothing crosses to another agent except through a deliberate handoff message, built to the schema in [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design).

**When it wins.** Pipelines and orchestrator/worker splits where the dependency between agents is genuinely one-directional or occurs at known points — most delegated-task systems fit this shape.

**Failure mode.** Staleness by omission. If an agent learns something new after handing off to another, and doesn't re-send it, the receiver never finds out — there's no ambient channel to catch a late update. This is the isolation cost discussed in [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation).

**Relative cost.** More upfront design — you have to think through exactly what crosses each boundary — but far cheaper to keep correct at runtime, because there's no shared mutable state that can go stale silently.

## Hub-and-spoke shared state

**How it works.** A middle ground: one authoritative owner, usually the orchestrator, holds the single source of truth. Workers get a filtered, read-only view of it at dispatch time and send proposed updates back through the hub rather than writing directly. The hub decides whether to accept each update.

**When it wins.** A few long-running workers operating on a shared resource — a shared plan, a shared file, a shared ledger — where conflicting simultaneous writes are unacceptable but workers still need reasonably current shared facts.

**Failure mode.** The hub becomes a bottleneck. Every update round-trips through it, and if the hub batches or delays acceptance, workers can end up reasoning from a view that's already a step behind what the hub has actually accepted from someone else.

**Relative cost.** Moderate — more infrastructure than plain message passing, since you need an accept/merge step — but the consistency guarantee is much stronger than a raw blackboard, because there's exactly one writer.

## Event log / append-only ledger

**How it works.** Agents don't overwrite shared state; they append immutable events — "worker 2 found X," "orchestrator accepted Y" — to a log, and each agent derives whatever view it needs by reading and filtering the log, typically just the events relevant to it.

**When it wins.** Systems where provenance and auditability matter as much as current state — you can always answer "what did we know, and when" — and where multiple agents run concurrently and need to reconcile without a central lock.

**Failure mode.** Unbounded growth. Nothing is ever removed by design, so the log itself becomes a context management problem — every agent that reads it needs its own filtering and compaction pass, reintroducing the discipline this pattern was meant to avoid, just at the log-reading layer instead of the state layer.

**Relative cost.** Highest engineering cost of the four — append-only storage, per-agent filtering logic, and eventually your own compaction strategy for the log — but it's the only one of the four that gives you a full, ordered history for free.

## Decision table

| Approach | Consistency | Contamination risk | Build cost | Best for |
|---|---|---|---|---|
| Shared blackboard | Live, but unmoderated | High | Low | Small teams of agents editing a shared artifact in real time |
| Private + handoffs | Point-in-time snapshots | Low | Medium (design-heavy) | Orchestrator/worker pipelines, most delegated tasks |
| Hub-and-spoke | Strong (single writer) | Low–medium | Medium–high | Long-running workers sharing one resource, needing conflict control |
| Event log | Eventually consistent | Medium (stale reads possible) | High | Auditable, concurrent multi-agent systems where history matters |

## How to choose

Default to private stores with explicit handoffs — it's the cheapest to keep correct, and most task decompositions really are one-directional enough to fit it, which is why it's the shape assumed through the rest of this module (see [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow)). Flip to hub-and-spoke when you have genuine concurrent writers to one shared resource and can afford a moderation step. Reach for a shared blackboard only for small, short-lived collaborations where a stale read is cheap and speed of visibility matters more than correctness. Reach for an event log when the task's audit trail is itself a deliverable, or compliance and debugging needs mean you can't afford to lose the "what did we know, when" record — and budget separately for compacting that log, because it will not stay small on its own.

**Related:** [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow), [Structured Memory Stores](/learn/context-engineering/structured-memory-stores)
