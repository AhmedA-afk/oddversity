---
title: "Context Poisoning and Distraction"
track: "context-engineering"
status: live
summary: "A false claim in context gets treated as settled fact and compounds across every turn that references it."
duration: "9 min read"
---

> This is a deep dive into the mechanism behind context poisoning. For the practical version — what it is, how it differs from distraction, and the everyday mitigations — start with [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction). This lesson is optional depth: it derives *why* the failure is structural rather than incidental, and traces one poisoned fact through three concrete downstream failures.

## The mechanism, precisely

An autoregressive model generates each token by conditioning on everything that precedes it: `P(token_t | context)`. In an agent loop, "context" includes the model's own prior turns and the results of tools it called, folded back in as if they were part of the ongoing record. Once a false claim occupies a span of that record, generation optimizes for *coherence with the full preceding sequence* — it doesn't re-derive or re-verify the claim, because nothing in the objective asks it to. The model has no built-in flag distinguishing "this was asserted" from "this was checked."

This is the same underlying mechanism that makes [in-context learning](/learn/llm-foundations/in-context-learning) work at all: the model treats what's in context as a strong, load-bearing prior for what comes next. That's a feature when the context is correct — it's exactly why giving a model examples or facts in-context changes its behavior reliably. It's a liability the moment something false gets in, because the same mechanism that lets correct context steer behavior also lets incorrect context steer it, with equal confidence.

## Tracing one poisoned fact through three wrong steps

**Turn 1 — a bad tool result.** An agent calls a schema lookup to plan a database migration:

```json
{"table": "users", "columns": ["id", "user_email", "created_at"]}
```

The real column is `email`, not `user_email` — a stale cache or a tool bug returned the wrong name. Nothing marks this result as unverified; it enters context looking exactly as authoritative as a correct result would.

**Wrong step 1 (turn 2) — the migration script.** The model writes:

```sql
ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;
UPDATE users SET verified_at = created_at WHERE user_email IS NOT NULL;
```

This references `user_email` because that's what turn 1 established as fact. Nothing about this step looks wrong in isolation — it's a correct migration given the premise it was handed.

**Wrong step 2 (turn 3) — the test.** The model writes a unit test for the migration:

```python
def test_migration_sets_verified_at():
    user = User(user_email="a@example.com", created_at=NOW)
    run_migration()
    assert user.verified_at == NOW
```

The wrong field name is now restated in a second artifact. This matters beyond simple repetition: a passing test *looks like independent confirmation* that `user_email` is correct, even though it was derived from the same single, never-checked source as the migration script.

**Wrong step 3 (turn 4) — the changelog.** The model documents the change: "Added `verified_at`, backfilled from `created_at` for all rows with a non-null `user_email`." This now ships somewhere a human might read and trust without checking the database — the wrong field name has moved from an internal artifact to an external one.

By turn 4, nothing in the transcript marks `user_email` as an unverified tool result anymore. It reads as an established fact, restated three times by the model's own output, and each restatement — per the mechanism above — further reinforces it as something later turns condition on rather than question.

## Distraction, by the same mechanism, different input

[Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction) draws the distinction: poisoning is a *false* claim treated as true; distraction is a *true-but-irrelevant* claim crowding out what should be in focus right now. The mechanism underneath both is the same conditioning process — the difference is what kind of content is riding on it. An old, completed subtask's plan sitting in context still conditions generation the same way a false fact does; it pulls phrasing and next steps toward continuing that old plan, because "coherence with preceding tokens" has no way to know the plan is stale. [Context ordering and recency effects](/learn/context-engineering/context-ordering-and-recency-effects) determines how much pull that stale content gets relative to what's actually current — recent, prominent content usually wins the competition even when it's wrong, which is part of why distraction and poisoning often compound each other in a long session rather than showing up separately.

## Tradeoffs in mitigation, stated precisely

**Verify everything.** Checking every fact and intermediate claim against ground truth before it enters context gets you close to the best-case outcome, but the cost scales with the number of facts touched — most of which were never going to be referenced again. A better decision rule than "verify everything" or "verify nothing" is to verify by *fan-out*: a fact referenced by multiple downstream artifacts — a schema name, an ID, a config value, a date — is worth an extra verification call. A fact used exactly once and never revisited usually isn't, because even if it's wrong, it can't cascade.

**Backtracking.** Giving the agent an explicit way to say "step 2 was built on a wrong premise, retract it and everything downstream" is cheap to specify but hard to execute in a freeform transcript, because you need to know *what depended on* the poisoned claim to strike it correctly. This is much more tractable when context carries structure — IDs, tagged sources, explicit references — so a retraction can find every span that cites a given claim's ID. See [Structuring Injected Context](/learn/context-engineering/structured-context-injection) for the formatting habit that makes this possible at all.

**Compaction.** Periodically summarizing a long transcript (see [Compaction](/learn/context-engineering/summarization-for-compaction) and [Compaction That Drops Key Facts](/learn/context-engineering/compaction-that-drops-key-facts)) is a double-edged mitigation, not a clean one. It can flush a poisoned claim if the summarizer judges it unimportant enough to drop — or it can *cement* it, if the summarizer reads "the model asserted this three times, consistently" as evidence of importance and preserves it verbatim into the compacted record. A summarizer has no independent way to tell confidently-repeated apart from actually-verified. State this precisely: compaction is not a poisoning defense on its own. It needs a verification step applied before or during summarization, not assumed to happen automatically because the content survived to that point.

## Where next

To see the same mechanism triggered deliberately by an adversary rather than a tool bug, see [Injection Through Retrieved Content](/learn/context-engineering/prompt-injection-via-retrieved-content). To catch a poisoned session while it's still running rather than after it ships a wrong changelog entry, see [Detecting Context Degradation](/learn/context-engineering/detecting-context-degradation). And for more realistic vectors beyond a bad tool call — stale caches, adversarial pages, drifted summaries — see [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios).

**Related:** [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction), [In-Context Learning](/learn/llm-foundations/in-context-learning), [Detecting Context Degradation](/learn/context-engineering/detecting-context-degradation), [Structuring Injected Context](/learn/context-engineering/structured-context-injection), [Compaction That Drops Key Facts](/learn/context-engineering/compaction-that-drops-key-facts)
