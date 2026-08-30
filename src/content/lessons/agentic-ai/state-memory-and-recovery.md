---
title: "Design agent state, memory, and recovery explicitly"
track: "agentic-ai"
status: live
summary: "State is what the current run needs to continue; memory is information carried across runs."
duration: "3 min read"
---

## The short answer

State is what the current run needs to continue; memory is information carried across runs. Store only what has a purpose, scope it to the user and task, and make every step resumable or safely repeatable. Recovery is a designed path, not “ask the model to try again.”

## Separate the stores

- **Run state:** current plan, tool results, approvals, and retry count.
- **User memory:** durable preferences with consent and deletion behavior.
- **Knowledge:** retrievable source documents, not a hidden personal memory.
- **Trace:** events for debugging and audit, with retention controls.

## Four examples

### Example A: resumable research

Store completed searches and source IDs. If summarization fails, resume from the
evidence set instead of searching again.

### Example B: user preference

Remember “prefer concise answers” only if the user can inspect and remove it. Do
not infer sensitive traits from repeated requests.

### Boundary case: duplicate write

A network retry may repeat “create ticket.” Use an idempotency key or a read-before-
write check so recovery does not create duplicates.

### Counterexample: memory as authority

A stale remembered instruction should not override current permissions or policy.
Memory supplies context; application policy decides authority.

## An illustrative story

A travel assistant kept proposing an expired preference. The real bug was not
memory retrieval quality; there was no expiry, provenance, or user control. Adding
those fields made correction possible.

## Two ways to see it

### Orchestration view

State makes a run restartable and observable.

### Privacy view

Memory is retained user data with a purpose, owner, scope, and deletion path.

## Hands-on

Build a two-step mock agent that can pause after a tool result. Persist run state,
retry one failed step, prevent a duplicate write, and expose a delete action for a
synthetic user preference.

## Checkpoint

- [ ] Run state and durable memory are different records.
- [ ] Retries are safe or idempotent.
- [ ] Retention, provenance, and deletion are explicit.

## What this does not solve

Good state management cannot decide whether a user should have access to a source
or tool. Authorization remains an application concern.

## Continue, go deeper, apply it

- Continue: Observability, cost, and latency
- Go deeper: Red-teaming LLM applications
- Apply it: add a state schema and recovery table to an agent design.
