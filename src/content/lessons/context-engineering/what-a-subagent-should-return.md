---
title: "What a Subagent Should Return"
track: "context-engineering"
status: live
summary: "The instinct for what belongs in a subagent's return value: a report with sources, never the scratch paper."
duration: "6 min read"
---

You ask a colleague to research something and get back to you. A good colleague hands you a one-page memo: the answer, the key reasons, and where to look if you want to verify it. A well-meaning but unhelpful colleague hands you their entire notebook — every calculation, every crossed-out idea, sticky notes and all — and says "it's all in there somewhere." Both colleagues did the same research. Only one of them actually delivered it.

## The analogy

A subagent returning its full working transcript to an orchestrator is the notebook. A subagent returning a short report — answer, reasoning in brief, pointers to sources — is the memo. The orchestrator's job gets harder or easier depending entirely on which one it receives, even though the underlying research was identical.

## The mental simulation

The orchestrator asks a subagent: "What's our current test coverage on the payments module, and is it enough to ship the refactor?"

The subagent's actual process, staying entirely inside its own window: run the coverage tool, get a wall of output, grep for the payments module's lines, cross-reference against the file list, notice the number looks off, re-run with a different flag, confirm the corrected number, check git blame on the still-uncovered lines to see whether they're dead code or genuinely risky.

**The notebook version of the return** pastes the full coverage tool output — dozens of files, hundreds of lines — plus both runs, plus the git blame output, ending with "so yeah I think it's like 71% but check the numbers above." The orchestrator now has to re-read the same wall of output and might grab the first, wrong run instead of the corrected one — remaking a mistake the subagent already caught and fixed.

**The report version:**

```json
{
  "answer": "71% line coverage on payments/, verified with a second run after an initial flag mismatch.",
  "verdict": "borderline — the uncovered 29% includes 3 files handling refund logic, which is not dead code.",
  "recommendation": "add tests for refund logic before shipping; other gaps are lower-risk.",
  "sources": ["coverage run (pytest --cov=payments)", "git blame on payments/refunds.py"]
}
```

With this version, the orchestrator has an answer, a verdict it can act on immediately, and a two-item source list if it ever needs to check the subagent's work. Nothing more, nothing it has to redo.

## The common wrong intuition — and the correction

The wrong instinct: "more context is safer — if I give the orchestrator everything, it can't miss anything." This feels conservative but runs backwards. The orchestrator doesn't gain safety from the raw output; it gains confusion, because it now has to figure out which of two coverage runs is authoritative without the context the subagent had while investigating — namely, that it noticed and fixed a flag mismatch. Handing over the raw material without the resolution is often less informative than handing over the resolution alone, because the reader has to redo the reconciliation with less information than the original agent had while doing it live.

The right intuition isn't "less information" — it's the same conclusion, plus enough provenance to trust or check it, minus the exploration that already resolved itself. A report that only said "71%," with no sources, would be too thin: the orchestrator can't verify or challenge it. A report that includes the full tool output is too thick: the orchestrator can't use it without redoing the subagent's work. The right size sits in between, measured by whether the orchestrator can act without either re-deriving the answer or blindly trusting it.

## When the analogy breaks

The report analogy assumes the reader trusts the writer enough to act on a summary. That breaks in a few places:

- **High-stakes, hard-to-reverse actions.** When the orchestrator's next move is deleting data or sending an external message, a report-only return may not carry enough for an independent sanity check. That calls for slightly more provenance, or a second subagent whose job is to verify the first one's work — not a reversion to full transcripts.
- **Genuine uncertainty.** When the subagent's honest finding is "there isn't a clean answer, and here's why the space is more complicated than expected," a thin report can undersell that. The report should say so explicitly — "no clean answer; here are the two live hypotheses" — rather than force a false-confident one-liner just to look like a good memo.
- **Reconciling disagreeing reports.** When two subagents' reports conflict, a good report needs enough of the *why* to let the orchestrator judge which one to trust — more than a bare verdict, still far short of a full trace. That reconciliation problem is worked through in [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow).

**Related:** [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow), [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Compressing Context for Handoff](/learn/context-engineering/compressing-context-for-handoff)
