---
title: "Multi-Agent and Capstone Quiz"
track: "context-engineering"
status: live
summary: "Six questions on handoff design, isolation, shared vs private stores, and the end-to-end review, tied to each lesson."
duration: "6 min read"
---

Six questions covering this module: what crosses a handoff, why subagents get isolated windows, when to flip from private stores to something shared, what a subagent should actually return, and how a full architecture review catches a bug none of the individual agents caused on its own.

**Q1.** A worker subagent finishes a task and is about to hand its result back to the orchestrator. Which of the following most belongs in that handoff?

A. The worker's full sequence of tool calls, so the orchestrator can verify how the answer was reached.
B. The worker's final answer, restated with no supporting detail, to keep the payload as small as possible.
C. The worker's answer, the key decisions behind it, and a pointer to the source material — not the raw trace.
D. A copy of the orchestrator's original task description, so the worker's context is preserved for later.

<details>
<summary>Answer</summary>

**Correct: C.** The answer, the decisions behind it, and a pointer back to source is the report-not-notebook shape this module builds toward.

- **A:** This is the transcript-dumping mistake — it hands the orchestrator work to redo instead of information to use.
- **B:** Too thin. An answer with zero provenance can't be checked or trusted; see [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return).
- **C:** Correct — the conclusion, the decisions behind it, and pointers back to source, formalized in [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design).
- **D:** The orchestrator already has its own task description; sending it back adds tokens without adding information.

</details>

**Q2.** An orchestrator dispatches a subagent to search a codebase for a specific bug pattern. Why should the subagent's 50,000-token search trace stay inside the subagent's own context window instead of being copied into the orchestrator's?

A. Because the orchestrator's context window is technically smaller than the subagent's.
B. Because copying it would let the orchestrator's later reasoning be conditioned on noise and dead ends it can't evaluate, and any subagent failure would corrupt the orchestrator's context directly instead of just producing a bad result.
C. Because subagents are not allowed to share any information with an orchestrator under any circumstances.
D. Because tool outputs are automatically deleted once a subagent finishes.

<details>
<summary>Answer</summary>

**Correct: B.** Isolation is about fault containment and signal, not window size.

- **A:** Window size isn't the reason — even with a huge window, the trace is still noise relative to the orchestrator's task.
- **B:** Correct — this is the fault-containment argument in [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation): isolation keeps a subagent's failure recoverable, a bad result, instead of corrosive, poisoned orchestrator context.
- **C:** Isolation doesn't mean zero information crosses — the result and its provenance should still cross, deliberately, via the handoff.
- **D:** Nothing is automatically deleted; the trace still exists in the subagent's own window, it's simply never copied to the orchestrator's.

</details>

**Q3.** Two long-running workers need to edit different sections of the same shared document at the same time, and each needs to see the other's in-progress edits to avoid contradicting them. Which context-store approach fits best?

A. Fully private stores per worker, with no handoff until both are completely finished.
B. A shared blackboard with no ownership or versioning, so both workers can write freely.
C. Hub-and-spoke: one authoritative owner of the document state, with workers reading a current view and proposing updates back through it.
D. An append-only event log that neither worker ever reads back.

<details>
<summary>Answer</summary>

**Correct: C.** A single writer with a current, readable view is the fit for concurrent editors of one shared resource.

- **A:** This is where pure isolation costs something real — neither worker would see the other's edits until it's too late to avoid a conflict.
- **B:** A raw blackboard has no way to tell a settled edit from a stale or half-formed one — the contamination risk described in [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores).
- **C:** Correct — hub-and-spoke gives a single writer, avoiding conflicting simultaneous edits, while keeping both workers' views current, exactly the tradeoff [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores) recommends here.
- **D:** A log neither side reads defeats its own purpose — the value of a log here is letting each worker reconstruct current state from it.

</details>

**Q4.** A subagent is asked to check whether a proposed database migration is safe to run. It finds the migration is safe except for one table that needs a backfill first, and is about to report back. Which return best serves the orchestrator?

A. `{"status": "investigated"}`
B. The full sequence of queries it ran against the schema, so the orchestrator can double-check the investigation itself.
C. `{"verdict": "not yet safe", "reason": "orders table needs a backfill of the new column before migrating", "recommendation": "run the backfill, then re-check", "source": "schema diff + row count check on orders"}`
D. `{"verdict": "safe"}`, since the migration is mostly fine and the backfill is a minor detail.

<details>
<summary>Answer</summary>

**Correct: C.** A verdict, a specific reason, an actionable recommendation, and a source — the orchestrator can act without redoing any of the investigation.

- **A:** Content-free — the orchestrator learns nothing it can act on; fails the distilled-answer-plus-provenance test in [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return).
- **B:** This is the notebook, not the memo — it pushes the reconciliation work the subagent already did back onto the orchestrator.
- **C:** Correct, for the reasons above.
- **D:** Silently dropping the backfill requirement to round up to "safe" is worse than useless — it's a wrong answer wearing a right one's clothes, and would cause exactly the downstream failure a good report is meant to prevent.

</details>

**Q5.** During an architecture review of a multi-agent RAG pipeline, you find that a review agent — whose job is to catch policy violations before a reply is sent — only receives a compacted summary of the customer's messages, never the verbatim text. What's the risk, and what's the fix?

A. No real risk — a good summary always preserves everything a review step would need.
B. The summary may have already paraphrased away an exact commitment or phrase the review agent needed to check against, so the fix is to carve out the verbatim snippet for this specific agent even though other agents downstream are fine with the compacted version.
C. The fix is to stop compacting anywhere in the pipeline, for any agent, to be safe.
D. This isn't a context problem at all — it's a policy-training problem for the review agent.

<details>
<summary>Answer</summary>

**Correct: B.** Compaction is a per-agent decision, not a global one.

- **A:** This is exactly the assumption that breaks — see [Reviewing a Full Context Architecture](/learn/context-engineering/end-to-end-context-architecture-review), where compaction quietly drops a specific date and commitment the review step needed intact.
- **B:** Correct — an agent whose job depends on exact original content needs that content preserved even if every other consumer is fine working from a summary.
- **C:** Overcorrecting — most agents in the pipeline are fine with the compacted version, and reverting all compaction reintroduces the cost problem compaction exists to solve.
- **D:** The review agent's instructions might be fine; the input it's reasoning over is what's incomplete — that's a context problem, not a training problem.

</details>

**Q6.** You're building the capstone support agent and need to decide, in order, how to approach its context design. Per the master cheatsheet's decision order, what should you settle first?

A. The exact wording of the cache-stable prompt prefix.
B. Whether the task is actually bottlenecked by context at all, before budgeting or designing anything else.
C. The handoff schema to the specialist subagent.
D. Which compaction method — rolling window vs. hierarchical summarization — to use.

<details>
<summary>Answer</summary>

**Correct: B.** Confirm the bottleneck before you design around it.

- **A:** Cache layout comes near the end of the order in [Context Engineering Master Cheatsheet](/learn/context-engineering/context-engineering-master-cheatsheet) — deciding it first tends to lock in a prefix shape you'll have to redo once budgeting forces a different split.
- **B:** Correct — the first decision in the cheatsheet's order is confirming context is actually the bottleneck, before any budget or structure gets designed around it.
- **C:** Handoff design is last in the order, and only applies once more than one agent is involved — a real capstone requirement, just not the first decision.
- **D:** Compaction method is a mid-pipeline decision, made after the budget is set and only for whichever segment actually needs it.

</details>

**Related:** [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return), [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), [Shared vs Private Context Stores](/learn/context-engineering/shared-vs-private-context-stores), [Reviewing a Full Context Architecture](/learn/context-engineering/end-to-end-context-architecture-review), [Context Engineering Master Cheatsheet](/learn/context-engineering/context-engineering-master-cheatsheet)
