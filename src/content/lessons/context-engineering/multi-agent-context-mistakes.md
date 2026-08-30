---
title: "Multi-Agent Context Mistakes"
track: "context-engineering"
status: live
summary: "Multi-agent context failures that look fine in a demo and cascade badly in production, with the fix for each."
duration: "7 min read"
---

Each of these mistakes is a decision that felt reasonable — or wasn't really a decision at all — at the moment it was made. All five show up fine in a small demo and get worse the more agents, turns, and edge cases you add.

### The mistake: dumping the full transcript across a handoff

**Why it's wrong.** A transcript records how an agent got somewhere, not where things stand. Forwarding it treats exploration and conclusion as equally trustworthy, when the whole point of an agent's work is to have already separated the two.

**Symptom.** The receiving agent's context balloons even though its task is narrow; it starts citing details from the sender's dead ends as if they were live facts; latency and cost climb with every handoff for no corresponding gain in output quality.

**Fix.** Build handoffs to the schema in [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design) — goal, decided facts, pointers, next steps — and treat "did I just paste the transcript" as a review question on every handoff, not a one-time architecture decision.

### The mistake: skipping isolation "to be safe"

**Why it's wrong.** The instinct that more context can't hurt is backwards for subagents specifically. A subagent given the orchestrator's full running context isn't safer — it's reasoning inside noise it didn't produce and can't evaluate, and any bad assumption upstream propagates straight into its work.

**Symptom.** A subagent's output quietly reflects an orchestrator-level assumption that was never actually true for its specific slice of the task. The failure is hard to trace because the subagent's own reasoning looks locally reasonable — it's the borrowed premise that's wrong.

**Fix.** Default to the minimal, task-scoped window described in [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation). If a subagent genuinely needs a specific upstream fact, name it and put it in the handoff explicitly, rather than opening the whole channel.

### The mistake: an unbounded shared blackboard

**Why it's wrong.** Every write is visible to every reader immediately, with no filter and often no expiry, so a wrong or half-formed entry from one agent is indistinguishable from a settled one to every agent that reads it afterward.

**Symptom.** Two agents acting on the "same" shared fact take contradictory actions because one read it before a correction landed and one read it after. The blackboard grows without anyone owning cleanup, until reading it costs more than any individual agent's own context window.

**Fix.** Either move to private stores with explicit handoffs, or, if a shared store is genuinely needed, adopt an ownership and versioning discipline — timestamped entries, a single writer per fact — as covered in [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores). An unmoderated blackboard is a design that was never actually chosen, just defaulted into.

### The mistake: lost provenance

**Why it's wrong.** A handoff that states a conclusion with nothing pointing back to how it was reached is unverifiable — fine while it's right, a serious liability the first time it's wrong three agents downstream, because nobody can tell which link in the chain introduced the error.

**Symptom.** Debugging a bad final output means re-running the entire pipeline from scratch, rather than checking the one handoff that actually went wrong, because none of the intermediate payloads carry enough of a trail to localize the fault.

**Fix.** Every finding in a handoff carries a pointer — a file path, a query, a source label — via the `artifacts` field in [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), so a wrong conclusion can be traced back to its source in one hop instead of a full re-run.

### The mistake: letting the orchestrator become an accumulator

**Why it's wrong.** Collecting every worker's full return "in case it's needed later" defeats the purpose of isolating those workers in the first place. The orchestrator ends up holding the sum of everyone's context instead of the sum of everyone's conclusions — the single-bloated-agent failure mode rebuilt with extra hops.

**Symptom.** The orchestrator's own context grows fastest of any agent in the system, even though it does the least original work. It starts hitting context limits before any individual worker does, and merges get slower and less reliable as more workers are added — the opposite of what delegating was supposed to buy.

**Fix.** Apply the same cut discipline to what the orchestrator retains as to what any worker returns: merge and discard once a worker's result has been folded into the plan, keeping the merged conclusion and a pointer back to the worker's original payload, not the payload itself. See [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow) for the shape this should take at every step.

## Pre-flight checklist

- [ ] Every handoff was built to a schema — goal, decisions, artifacts, next steps — not assembled by pasting whatever was on hand.
- [ ] Every subagent's context is task-scoped by default; any shared fact it needs was added deliberately, by name, not by opening a wider channel.
- [ ] Any shared or blackboard-style store has an owner per fact and a way to tell a settled entry from a stale one.
- [ ] Every finding that crosses a handoff carries a pointer back to its source.
- [ ] The orchestrator's context size is checked against the number of workers it has merged — if it's growing with worker *output size* rather than worker *count*, something upstream is under-compressing.

**Related:** [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores), [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow)
