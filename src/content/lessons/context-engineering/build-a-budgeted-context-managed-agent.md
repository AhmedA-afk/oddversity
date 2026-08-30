---
title: "Capstone: Build a Budgeted, Context-Managed Agent"
track: "context-engineering"
status: live
summary: "The track's capstone: a support agent that budgets, retrieves, compacts, resists poisoning, and hands off to a specialist."
duration: "10 min read"
---

Every prior lesson in this track was a piece. This is where they have to work together, under a fixed budget, against an adversarial input, in front of an eval set that either passes or doesn't.

## The brief

Build a multi-turn customer-support agent — the same shape as the architecture audited in [Reviewing a Full Context Architecture](/learn/context-engineering/end-to-end-context-architecture-review) — that handles a running conversation with a user, retrieves from a small knowledge base, and hands off to a specialist subagent for anything outside its own scope, such as a billing dispute that needs a billing-specific worker.

The agent must: stay inside a fixed token budget across the whole conversation; retrieve and filter rather than stuff its knowledge base; compact conversation history once it crosses a set threshold, without dropping any commitment the agent has made to the user; detect and decline to act on a planted poisoned document seeded into its retrieval corpus — the same threat modeled in [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction); keep a stable, cacheable prompt prefix across turns, per [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design); and hand off cleanly to a specialist subagent using a structured payload, with the specialist resuming correctly from that payload alone.

This is graded in the sense that matters: an eval set of scripted conversations — including at least one with the poisoned document and one long enough to force compaction — either passes against your thresholds or it doesn't, and a token/cost ledger either stays under budget or it doesn't.

## Acceptance criteria

- [ ] A per-segment token budget is defined and enforced in code, not just documented, for system instructions, retrieved context, history, and output reserve.
- [ ] Retrieval is selective — the agent queries the knowledge base per turn and filters results by relevance, never attaches the whole corpus.
- [ ] History compaction triggers automatically once the conversation crosses a set token threshold, and a scripted long-conversation test confirms no user-stated commitment — a promised refund, a stated deadline — is lost after compaction.
- [ ] A planted poisoned document is present in the eval corpus, gets retrieved at least once during the run, and the agent does not follow the instruction embedded in it.
- [ ] The prompt's static content forms a stable prefix, byte-identical across turns holding the same system and tool content; a cache-hit measurement, even a simulated one counting stable-prefix tokens versus total, shows the prefix holding across at least several consecutive turns.
- [ ] The agent hands off to a specialist subagent using a structured payload, per [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design); the specialist is tested in isolation, receiving only the payload, and completes its task correctly from that alone.
- [ ] A token/cost ledger logs per-turn and running-total token use, broken down by segment, across the full eval set.
- [ ] A short write-up justifies every context decision — budget split, compaction trigger, retrieval cap, cache layout, handoff schema — against the [Context Engineering Master Cheatsheet](/learn/context-engineering/context-engineering-master-cheatsheet), including at least one decision you'd make differently under a tighter budget.

## Suggested stack

Language and framework are your choice — nothing here depends on a specific SDK. You'll want: a token counter for your target model's tokenizer, even an approximate one applied consistently; a small local knowledge base, a handful of markdown or JSON documents is enough, with the poisoned one just another document carrying a buried payload; a place to log the ledger, a CSV or JSONL file is sufficient; and a way to run the specialist subagent as a genuinely separate context — a fresh model call with only the handoff payload as input, not a continuation of the main agent's conversation.

## Milestones

Treat these as capabilities to reach, not a fixed build order — several can be developed in parallel:

- **Budgeted.** The agent tracks and enforces its segment budgets on every turn, and you can point to the code path that would truncate or reject an over-budget input rather than silently exceeding it.
- **Selective.** Retrieval returns a bounded, relevance-filtered set of chunks per query, never the whole corpus.
- **Durable.** A long conversation compacts without losing a commitment the agent made earlier — provable with a scripted test, not just eyeballing the transcript.
- **Hardened.** The poisoned document is in the corpus, gets retrieved during the eval run, and the agent's behavior doesn't change because of it.
- **Cache-stable.** The same prefix, in the same order, survives from the first turn to the last of a conversation, with only genuinely dynamic content appended after it.
- **Delegating.** The specialist subagent, run with nothing but the handoff payload, produces a correct result — meaning it never needed anything from the main agent's conversation that the payload didn't carry.

## What good looks like

A submission that passes every acceptance criterion above, with a ledger showing the token budget held across the full eval set — not just the easy cases — and a write-up that reads like a design review, not a changelog: each decision stated, the alternative considered, and why this one won given the budget. The strongest submissions treat the poisoned-document test as a real adversarial case, with the planted instruction genuinely plausible-looking rather than an obvious joke line, and show the specialist subagent succeeding cold, with no debugging access to the main agent's context, on the first attempt.

## Extensions

- Add a second specialist and a router that decides which one to hand off to, using the flow shape from [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow).
- Replace the fixed compaction threshold with dynamic reallocation, and measure whether it actually saves tokens over the eval set or just moves the cost around.
- Extend the ledger into a small dashboard showing spend by segment over the conversation.
- Run the same eval set with two different compaction methods — rolling window versus hierarchical summarization — and compare which one better preserves the commitments the poisoned-document and long-conversation tests are checking for.

**Related:** [Reviewing a Full Context Architecture](/learn/context-engineering/end-to-end-context-architecture-review), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Context Engineering Master Cheatsheet](/learn/context-engineering/context-engineering-master-cheatsheet), [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow), [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction), [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design)
