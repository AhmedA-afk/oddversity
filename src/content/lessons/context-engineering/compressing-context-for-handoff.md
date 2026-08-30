---
title: "Compressing Context for Handoff"
track: "context-engineering"
status: live
summary: "Turning a worker's 40k-token working context into a 1.5k handoff, then checking the next agent still succeeds."
duration: "7 min read"
---

Compression only counts if the next agent can actually work from what's left. This walks one worker's full working context down to a tight handoff, then checks the receiving agent against the compressed version alone — not the original.

## The setup

A research worker has spent its entire run — roughly 40,000 tokens of context: log reads, three investigative threads, one confirmed conclusion — figuring out why a nightly batch job's latency doubled last week. It now needs to hand off to a fix-it worker under a strict 1,500-token handoff budget, set deliberately per [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) because the fix-it worker's task is narrow and shouldn't require wading through anything larger.

## Step by step

**Step 1 — inventory what's actually in the 40k.** Roughly:

- 15k: reading and re-reading the batch job's logs across three days
- 10k: two abandoned hypotheses — a deploy that turned out unrelated, and a config change that was reverted before the slowdown started
- 8k: the confirmed cause — a new query added last week is missing an index, causing a full table scan on a table that recently crossed a size threshold
- 7k: tool overhead — repeated file listings, timestamps, retries

> **Why this step?** You can't compress what you haven't categorized. Lumping the confirmed cause in with the abandoned hypotheses is exactly how a summarization pass loses the one fact that mattered — triage before you compress, not during it.

**Step 2 — apply the cut rule from the handoff deep-dive.** For each category: does dropping it change the receiver's outcome, or make it redo work?

- Log re-reading (15k): drop entirely. It produced the confirmed cause, but the fix-it worker doesn't need the raw logs, just the conclusion.
- Abandoned hypotheses (10k): compress to one line each. Worth keeping as "ruled out," so the fix-it worker doesn't waste time rechecking the deploy or the reverted config.
- Confirmed cause (8k): this is the payload's core. Compress the reasoning down to the finding plus the evidence that makes it credible, not the full derivation.
- Tool overhead (7k): drop entirely. Zero decision value.

> **Why this step?** This is [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization) applied with a specific downstream reader in mind. General-purpose compaction asks "what's worth keeping"; handoff compaction asks the tighter, more answerable question of what the next agent specifically needs to act on.

**Step 3 — write the compressed handoff against the 1,500-token budget:**

```json
{
  "goal": "Add the missing index so the nightly batch job returns to its prior latency.",
  "inputs": {"job": "nightly_reconcile", "table": "transactions", "regression_window": "last 7 days"},
  "decisions": [
    "Root cause confirmed: query added last week (reconcile_v2) has no index on transactions.account_id; the table crossed a size threshold this month, so a scan that used to be cheap is now a full table scan.",
    "Ruled out: the Tuesday deploy (unrelated service) and the config revert (predates the slowdown by 2 days)."
  ],
  "artifacts": [
    {"kind": "file", "ref": "jobs/nightly_reconcile.sql:118", "note": "the unindexed query"},
    {"kind": "log_range", "ref": "batch_job logs, last 7 days", "note": "shows latency step-change on the day reconcile_v2 shipped"}
  ],
  "next_steps": [
    "Add an index on transactions.account_id.",
    "Re-run the job against a staging copy and confirm latency returns to baseline.",
    "Report before/after latency."
  ]
}
```

> **Why this step?** Notice what didn't make it: no log excerpts, no blow-by-blow of the two dead ends, no tool call history. What remains fits comfortably under 1,500 tokens, and every line is something the fix-it worker would otherwise have to ask for or rediscover.

**Step 4 — verify the receiver succeeds on the compressed payload alone.** Give the fix-it worker only this JSON — no access to the 40k-token trace — and check its plan. It should go straight to `nightly_reconcile.sql:118`, add the index, and not re-investigate the deploy or the config revert, because `decisions` already ruled them out. If the worker instead starts re-checking the deploy, that's a signal the "ruled out" line wasn't specific enough — a diagnostic worth building into any handoff process, not just this one.

## Where it breaks (+fix)

**The fix-it worker discovers a second contributing factor.** In staging, adding the index alone doesn't fully restore latency — the query also fetches unused columns, something the original worker never caught. This isn't a compression failure; it's the normal case where a handoff, however well-built, can't cover a fact nobody yet knew. The fix isn't to have compressed less — it's for the fix-it worker to report this back up as a new finding, not a re-litigation of a ruled-out hypothesis, so the next handoff in the chain includes it.

**Someone compresses too aggressively and drops the "ruled out" lines to save tokens.** The fix-it worker, with no memory of the dead ends, re-investigates the Tuesday deploy from scratch, burning time and a chunk of its own budget re-deriving something the first worker already ruled out. A one-line "ruled out: X" is cheap insurance against exactly this, and cutting it to save a dozen tokens is a bad trade.

## Takeaways

- Compression for a handoff isn't generic summarization — it's summarization aimed at one specific downstream task, so the cut rule is "would the receiver redo work or get it wrong without this," not "is this interesting."
- A confirmed conclusion compresses hard — 8k down to a few lines. A ruled-out hypothesis compresses further, but should never compress to zero: one line of "ruled out and why" is disproportionately valuable for its size.
- Verifying the receiver on the compressed payload alone — not on the original 40k — is the actual test of whether compression worked. A handoff that "looks complete" but that the receiving agent stumbles on hasn't been tested at all.

**Related:** [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents-deep), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies)
