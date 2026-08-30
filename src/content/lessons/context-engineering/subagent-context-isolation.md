---
title: "Subagent Context Isolation"
track: "context-engineering"
status: live
summary: "Why a subagent's window should hold only its own task, and what shared context you lose when it does."
duration: "8 min read"
---

A subagent that hits five dead ends before finding the answer produces a messy 50,000-token trace. Isolation means the orchestrator never has to see that — it only gets the answer. That sounds like a pure win, and mostly is, but it's worth being precise about what you're actually trading away when you cut that channel.

## What isolation actually means, mechanistically

An orchestrator and a subagent each have their own separate context window; the subagent doesn't inherit the orchestrator's history, and the orchestrator doesn't inherit the subagent's, unless something is explicitly copied across. "Isolation" is simply the choice not to copy the subagent's internal trace into the parent — the parent only ever receives the subagent's return value.

```text
Orchestrator window:                Subagent window (separate):
  task description  ---------------> receives task
  [nothing here]     <--- isolated -- 50k tokens of search, retries, dead ends
  subagent's RESULT  <---------------  returns: {findings, sources}
```

The orchestrator's window grows by the size of the result, not the size of the work. That's the entire mechanism, and it composes: with N subagents run this way, the orchestrator's context grows with N results, not with the sum of N traces — the difference between an orchestrator that stays usable across a wide fan-out and one that doesn't.

## Why this is the right default

If a subagent tries three approaches and two fail, the orchestrator doesn't need the failed approaches — it needs to know approach three worked, or that all three failed and why. Feeding it the failures too means every subsequent decision the orchestrator makes is conditioned on material that isn't actually informative for its job, which is the same diluted-attention effect described in [Context Rot](/learn/context-engineering/context-rot) — except now it's happening to the orchestrator specifically because you chose to pipe a worker's noise into it.

There's a fault-containment argument too. If a subagent goes off the rails — loops, hallucinates a tool result, gets steered by something it read — isolation contains that failure to its own window. It shows up in the orchestrator only as a bad or missing result, which is recoverable: retry, reassign, escalate. A corrupted result inside the orchestrator's own reasoning is much harder to detect and undo. This is a structural defense that pairs with the content-level defenses in [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction) — isolation limits blast radius before you've filtered anything.

## Worked illustration

An orchestrator delegates "find every place this deprecated API is called" to a subagent. The subagent's actual work: grep forty files, follow three leads that turn out to be similarly-named but unrelated functions, then confirm six real call sites by reading surrounding context carefully — roughly 50,000 tokens of tool output and reasoning.

What crosses back:

```json
{
  "call_sites": [
    "src/billing/invoice.py:212",
    "src/billing/invoice.py:401",
    "src/reports/export.py:33",
    "src/reports/export.py:88",
    "src/legacy/sync.py:14",
    "src/legacy/sync.py:57"
  ],
  "false_positives_excluded": [
    "src/utils/api.py (similarly named function, different API)"
  ],
  "confidence": "high — verified each call site by reading surrounding context"
}
```

The orchestrator now holds a few hundred tokens instead of fifty thousand, and can hand these six sites to a fix-it subagent, or fold them into a plan, without ever needing to know how the search happened.

## When isolation costs you something real

Isolation is a bet that the subagent's task is genuinely self-contained — that everything it needs can be stated up front in its initial context. That bet fails in a few identifiable situations:

- **Shared state that changes mid-task.** If two subagents run concurrently against the same resource — the same file, the same customer record — and one's edit matters to the other, isolation means neither finds out until their results are merged, possibly too late to avoid a conflict. This is the core tension explored in [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores).
- **Context the orchestrator has but didn't think to pass down.** A constraint discovered by the orchestrator after a subagent was dispatched won't reach that subagent — isolation cuts in both directions. The fix isn't to weaken isolation, it's to make sure the initial handoff (see [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design)) is actually complete before dispatch.
- **Debugging.** When a subagent's result is wrong, isolation is exactly what makes it hard to tell why — you only have the result, not the reasoning. The mitigation is provenance, not un-isolating: have the subagent return a short "how I got here" trail alongside its answer, which is the returned-artifact discipline in [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return).

## The rule this leaves you with

Default to isolation for anything the subagent can complete with what's in its initial handoff. Break isolation deliberately and narrowly — a specific fact copied across, not a channel left open — only when you can name the exact piece of shared state that both sides need and that neither can get any other way. An orchestrator that can't name what shared fact it's missing usually doesn't need to break isolation at all; it needs a better handoff.

*This is a deep-dive. The practical version of the rule, built into a schema, lives in [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design) and [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow).*

**Related:** [Context Rot](/learn/context-engineering/context-rot), [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction), [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return), [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow)
