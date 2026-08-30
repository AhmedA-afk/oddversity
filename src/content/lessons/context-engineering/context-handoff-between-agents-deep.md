---
title: "Context Handoff Between Agents"
track: "context-engineering"
status: live
summary: "The deep mechanics of what must cross an agent boundary intact, and what must never survive the trip."
duration: "8 min read"
---

The companion lesson on [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents) establishes the headline rule: pass the slice, not the stack. This is the deep-dive underneath that rule — optional depth, worth reading once the headline version feels obvious — covering what exactly counts as "the slice," why a transcript is the wrong unit to reason about, and how to decide precisely what a handoff can drop versus what it must never drop.

## The handoff as a channel, not a copy

Model it formally for a moment. Agent A has state S_A — everything currently in its context window. It produces a payload P, a function of S_A, and sends it to Agent B. Everything B does afterward depends on P plus B's own instructions and tools — never on S_A directly, because B never sees S_A. B succeeds at its task if and only if P retains whatever subset of S_A is actually decision-relevant to that task.

Since P is almost always far smaller than S_A, the entire craft of handoff design is choosing that subset well. Get it right and B performs as if it had done the work itself. Get it wrong and B either fails outright or, worse, produces a confident answer built on a gap it never knew was there.

## What must survive: four categories

**Task.** Stated as an instruction — "verify the fix passes the existing test suite" — not reconstructed from a history of turns. Omit it, and B will infer its own task from whatever it does receive, which drifts from what A actually needed.

**Constraints.** Anything that would make an otherwise-valid answer wrong: scope boundaries, non-negotiable requirements, format or resource limits. Constraints are disproportionately costly to drop, because B has no signal that a constraint even exists until it violates one — there's no error message for "you weren't told."

**Findings.** The decided facts A already established, so B doesn't have to re-derive them. This is where compression is legitimate: a conclusion is a good proxy for the reasoning that produced it, as long as it's stated with enough specificity to act on — a file and line number, not "somewhere in the file."

**Open questions.** What A didn't resolve, and B needs to either resolve or explicitly ignore. Silently omitting these makes B assume everything upstream was already settled, which is often false.

## What must not survive: the trace

The trace is actively harmful, not just wasted space. A model conditions on everything in its context, including abandoned reasoning paths, and there's no free mechanism for it to know "we don't believe this part anymore." A stale hypothesis sitting in context reads exactly as confidently as a confirmed one — which is a specific instance of [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction), just occurring at a handoff boundary instead of within one agent's own turn.

```text
# What A internally went through (12 tool calls, 2 dead ends)
1. grep for "auth" -> too broad, 40 hits
2. read login.py -> nothing obvious
3. tried grepping "token" -> found compare in session.py:41
4. re-read login.py more carefully -> the real bug is login.py:84, not session.py
...

# What crosses to B
finding: "app/auth/login.py:84 uses == for token comparison (timing attack);
session.py:41 was a false lead, not an issue."
```

Notice the false lead is worth exactly one line in the payload — B doesn't need to re-live the mistake, it just needs to know not to re-investigate a track that's already dead. Leave that line out, and B might repeat the same 40-hit grep against "auth" from scratch. That's the subtle case: not everything about the trace is worth zero. A compressed "ruled out: X" note earns its place precisely because omitting it costs more than including it. The raw 40-hit grep output around it, on the other hand, carries no such value — that's the part that's safe to discard entirely.

## Deriving the minimal sufficient payload

A practical test, applied fact by fact: if you remove this, does B reach a different, wrong output, or does it redo work it already had the answer to? If neither, cut it. This is a more disciplined, boundary-specific version of the pressure behind ordinary [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) — general compaction asks what's worth keeping across a growing history; handoff compaction asks the narrower, more answerable question of what one named receiver specifically needs to act.

## The precision tradeoff

State the tradeoff precisely, because there's no context-free right answer here. A tighter payload is cheaper and faster, but carries higher risk of dropping something decision-relevant you didn't anticipate B would need. A looser, fuller payload is safer against that blind spot, but reintroduces the noise-and-cost problem the handoff exists to solve, and raises the odds B has to wade through material to find the two facts that actually matter.

The variable that should set this dial is how expensive it is for B to discover a gap versus how expensive it is to carry the extra tokens on every call. A worker calling a cheap model on a narrow, well-understood task should err toward tight. A worker whose mistakes are costly to catch downstream — a financial calculation, an irreversible action — should err toward including borderline-relevant constraints even at some token cost.

## A rule that generalizes

Prefer a pointer to source plus the conclusion over the source itself "just in case the conclusion is wrong." If B truly needs to re-verify against source material, give it a path or query it can run itself — this is [Reference by Pointer, Not Value](/learn/context-engineering/reference-by-pointer-not-value) combined with [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) — rather than pre-emptively pasting the source in for safety. That keeps the default payload small while still leaving a recovery path for the cases where the conclusion alone genuinely isn't enough. The concrete schema this rule produces is built out in [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design).

**Related:** [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction), [Reference by Pointer, Not Value](/learn/context-engineering/reference-by-pointer-not-value), [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction)
