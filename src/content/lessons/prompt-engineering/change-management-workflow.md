---
title: "A Change-Management Workflow for Prompts"
track: "prompt-engineering"
status: live
summary: "Five gates from proposed diff to full rollout - eval, review, canary, ramp - with the artifact trail for one real change."
duration: "9 min read"
---

Versioning tells you what changed. Change management is the process that decides whether a change is allowed to reach everyone - and it's the same five gates whether the diff is one word or a rewrite.

## What we're building

A lightweight workflow - not new tooling, five checkpoints applied to infrastructure you already have: propose the change as a diff, run it against the eval and golden gate, review the diff and the eval report together, canary a small slice of live traffic, then ramp or roll back. We'll carry the abandoned-then-fixed due-date extractor change from [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts) all the way through, because it's the one place in this module where a change genuinely needed every gate to ship safely.

## Setup

This assumes you already have the pieces from earlier in this module: a `cases.jsonl` and runner ([Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)), a golden-set gate ([Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts)), a git-tracked `prompts/` directory with pinned versions ([Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code)), and a way to split live traffic ([A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production)). None of what follows is new infrastructure - it's an order of operations for the infrastructure you already built.

## Build it

### Step 1: Propose the change as a diff, not a rewrite

```diff
--- prompts/due-date-extractor/v2.txt
+++ prompts/due-date-extractor/v3.txt
@@
-If the date format is ambiguous, default to MM/DD (US convention).
+If the date format is ambiguous, default to DD/MM.
```

**Proposal note:** "case-004 fails because the model ignores an explicit 'DD/MM format' clue and defaults to month-first anyway. Flipping the default should fix it."

> **Why this step?** A change framed as a diff against a specific pinned file - not "here's my new prompt" - is reviewable, and blame for what it changes traces to one commit. It also forces the proposer to say, in one sentence, what problem they think they're solving - which is exactly the sentence Step 3 is going to test.

### Step 2: Run the full eval and the golden gate

```
$ python eval/run_eval.py --gate --tag golden
GOLDEN GATE FAILED: 2/5 regressed
  [case-006] expected '2026-04-06'
  [case-007] expected '2026-02-09'
Golden gate passed: 3/5
```

v3 fails its own gate before it ever reaches a human reviewer - case-004 now passes, but case-006 and case-007, which relied on the MM/DD default the diff just removed, don't.

> **Why this step?** This is what turns "I re-ran it and it looked fine" into a check nobody can skip or forget under deadline pressure. The gate caught this in minutes, automatically, before it consumed a reviewer's attention.

### Step 3: Review the diff and the eval report together

A failed gate doesn't kill the proposal - it redirects it. The reviewer reads the diff *and* the failure report together and asks the question the proposal note skipped: why default-flipping instead of detecting the clue that's actually present in the failing case? The proposer revises to `v3-revised`:

```diff
--- prompts/due-date-extractor/v2.txt
+++ prompts/due-date-extractor/v3-revised.txt
@@
-If the date format is ambiguous, default to MM/DD (US convention).
+If the email explicitly states its own date format (e.g. "DD/MM format",
+"day/month"), use that stated format. Otherwise, if the date is
+ambiguous, default to MM/DD (US convention).
```

```
$ python eval/run_eval.py --gate --tag golden
Golden gate passed: 5/5
```

> **Why this step?** A script can tell you *that* something regressed. Only a human reading the diff next to the report reliably catches *why* the first attempt was solving the wrong layer of the problem - a diff alone would have looked like a plausible one-line fix either time.

### Step 4: Canary a small traffic slice

Merging isn't shipping. `v3-revised` goes live for 5% of real traffic, with the observation window and rollback threshold written down *before* the canary starts - the same pre-commitment discipline as [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production): run for at least one full weekday-plus-weekend cycle, and watch two things the golden gate structurally can't see - the online resolution metric, and the raw parser-error rate (an output that doesn't even parse as a date at all).

> **Why this step?** A canary catches exactly the class of failure a golden set cannot: a real production input nobody has written a case for yet. The gate proves no *known* regression happened; the canary is the first look at the *unknown* ones.

### Step 5: Ramp or roll back

The canary runs clean - resolution metric flat-to-positive, no new parser errors - across the full observation window. Traffic ramps 5% → 25% → 100%. If it hadn't: revert `PROMPT_VERSION` to the last pinned-good version immediately (the whole reason pinning in [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code) matters), and file whatever the canary caught as a new `failure`-tagged case in `cases.jsonl` - closing the loop back to [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)'s instruction to feed every real failure back into the set that guards against it next time.

> **Why this step?** Gradual rollout bounds the blast radius of anything the first four gates missed to a known, small, quickly-reverted slice of traffic - instead of everyone, all at once, with no early warning.

## Run it

The artifact trail for this one change, start to finish:

| Artifact | What it shows |
|---|---|
| PR #142 diff | v2 → v3 (rejected) → v3-revised (merged) |
| CI eval report | golden gate: 3/5 on first attempt, 5/5 on revision |
| Canary dashboard (5% slice, one week) | resolution rate flat, zero new parser errors |
| `CHANGELOG.md` entry | v3-revised promoted 2026-08-29, supersedes v2 |

Four artifacts, one story: what changed, what it broke on the first try, what actually fixed it, and how it was confirmed safe before everyone got it.

## Harden it

- **Require the eval report to be attached to the PR itself**, not run locally and described from memory - a reviewer approving a diff they haven't seen the report for is approving on vibes.
- **Write the canary's rollback trigger down before the canary starts.** Deciding the threshold in the moment, while watching a live dip and feeling anxious about it, is the worst possible time to be calibrating a number.
- **Make the canary window span a full usage cycle.** A canary that only ran during off-hours traffic under-samples exactly the traffic pattern that matters most.

## Extend it

The same five gates apply whether the diff is a one-line wording change or a fully [DSPy-compiled prompt](/learn/prompt-engineering/automatic-prompt-optimization-dspy) - the gates don't change shape based on how the candidate was produced, only the diff does. And "healthy canary" needs the same patience as any A/B read: don't declare three days of thin data conclusive any more than you'd call an A/B test early - see [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results) for exactly what an early, noisy lead looks like before it either holds up or doesn't.

**Related:** [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code), [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production), [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results), [Prompt Versioning: Treating Prompts Like Code](/learn/prompt-engineering/prompt-versioning-and-change-management)
