---
title: "Orchestrator-Worker Context Flow"
track: "context-engineering"
status: live
summary: "One research task traced end to end through an orchestrator and three workers, showing what each one holds."
duration: "7 min read"
---

The previous lessons argued for isolation and disciplined handoffs in the abstract. This is the same ideas traced through one concrete task, step by step, so you can see exactly what context each agent holds at each moment — and where the earlier modules' budgets and dedup rules actually apply.

## The setup

Task: "Write a one-page brief comparing three vector database options — pgvector, Pinecone, and Weaviate — for a mid-size RAG deployment." An orchestrator delegates one worker per option, then merges the three results into the brief.

## Step by step

**Step 1 — the orchestrator writes three handoffs.** Using the schema from [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), it produces one payload per candidate, identical in shape:

```json
{
  "goal": "Assess pgvector for a mid-size RAG deployment (~5M vectors, 50 QPS).",
  "inputs": {"candidate": "pgvector", "scale": "5M vectors, 50 QPS"},
  "decisions": [],
  "artifacts": [],
  "next_steps": [
    "Summarize operational cost, latency characteristics, and scaling limits at this scale.",
    "Return a structured verdict: fit / partial fit / poor fit, with one sentence why."
  ]
}
```

> **Why this step?** Each worker gets a symmetric, narrow handoff — same shape, different `candidate`. That symmetry is what makes the merge step tractable: the orchestrator will compare three structurally identical results instead of reconciling three different report formats. Each worker's eventual return is also capped under a small budget, per [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), so three merges can't quietly outgrow what the final brief-writing step can hold.

At this point the orchestrator's own context is just the task plus the three handoffs it wrote — a few hundred tokens.

**Step 2 — each worker executes in its own isolated window.** Worker 1 (pgvector) does its own research: reading docs, comparing indexing strategies, reasoning about tradeoffs. That work might run to several thousand tokens internally — but per [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), none of it crosses to the orchestrator. What crosses is the return:

```json
{
  "candidate": "pgvector",
  "verdict": "partial fit",
  "reason": "Handles 5M vectors fine on decent hardware, but HNSW index build time and recall tuning need ops attention at this QPS.",
  "sources": ["pgvector README benchmarks", "internal notes on IVFFlat vs HNSW tradeoffs"]
}
```

> **Why this step?** The worker returns a verdict, a reason, and source labels — not its search trace. That's the distilled-answer discipline from [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return): the orchestrator can act on this without knowing which of the worker's several searches actually paid off.

**Step 3 — workers 2 and 3 run the same way, in parallel, each isolated.** Pinecone and Weaviate come back with the same-shaped object: `candidate`, `verdict`, `reason`, `sources`.

**Step 4 — the orchestrator merges the three returns.** Its context now holds three small JSON objects — far cheaper than if it had received even one worker's full internal trace. This is [Multi-Source Context Merging](/learn/context-engineering/multi-source-context-merging) at the handoff layer: the orchestrator checks whether any two workers cited the same external benchmark and, if so, cites it once in the final brief rather than three times.

```json
[
  {"candidate": "pgvector", "verdict": "partial fit", "reason": "..."},
  {"candidate": "Pinecone", "verdict": "fit", "reason": "..."},
  {"candidate": "Weaviate", "verdict": "fit", "reason": "..."}
]
```

**Step 5 — the orchestrator writes the final brief.** Because everything upstream arrived pre-distilled, most of the orchestrator's remaining budget is available for the actual writing task, not for parsing three workers' worth of raw material.

## Where it breaks (+fix)

**A worker times out or returns something malformed.** The merge step needs to detect this rather than silently treating a missing field as a default:

```python
for result in worker_results:
    if "verdict" not in result:
        raise ValueError(f"worker for {result.get('candidate', '?')} returned an incomplete result")
```

**Two workers independently paste in the same lengthy vendor pricing page as a source excerpt.** If the orchestrator naively concatenates the raw returns instead of merging verdicts, that pricing page shows up twice in the final brief's supporting material. This is exactly the failure [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) targets — just occurring across agents instead of across turns of one agent. The fix is the same principle applied at the merge boundary: dedupe by source identity before the brief gets written, not after.

## Takeaways

- The orchestrator's context, at every point in this trace, only ever grows by what a worker returns — never by what a worker did to get there. That's isolation paying off in a way you can actually measure.
- Symmetric handoffs — same schema, different `inputs` — make merging tractable. Free-text worker reports in different shapes would force the orchestrator to do extra interpretation work that itself costs context.
- Budgets, dedup, and validation don't disappear in a multi-agent flow; they just move to the seams. Each handoff is a place to enforce a budget, each merge is a place to dedupe, and every worker result is a place to validate.

**Related:** [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), [What a Subagent Should Return](/learn/context-engineering/what-a-subagent-should-return), [Multi-Source Context Merging](/learn/context-engineering/multi-source-context-merging), [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies)
