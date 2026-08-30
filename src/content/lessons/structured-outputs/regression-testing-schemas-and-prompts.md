---
title: "Regression-Testing Structured Output in CI"
track: "structured-outputs"
status: live
summary: "Turning the eval harness into a CI gate means picking thresholds that survive sampling noise, not just picking a number that feels safe."
duration: "9 min read"
---

[Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) produces a report on demand. Wiring it into CI means that report has to make a binary decision — merge or block — every time a model version, prompt, or schema changes. This is the deferred rigor underneath that decision: why a naive threshold produces flaky builds, and what actually makes a gate trustworthy. Treat it as optional depth once you already have a harness running manually.

## The mechanism: a gate is a hypothesis test wearing a CI badge

A regression gate answers one question: did this change make the pipeline worse? That's a comparison between two accuracy estimates — before and after — each computed from a finite, noisy sample. Framed honestly, it's a hypothesis test: is the observed drop larger than what sampling noise alone would produce, or is it real.

Ignore that framing and the naive version looks like this:

```python
if report_after["exact_match_rate"] < report_before["exact_match_rate"]:
    fail_build()
```

This fails the build on *any* decrease, including one caused by nothing but which random tickets got sampled that run, or which token the model's sampler happened to draw at a low-probability branch point. On a gold set where the true exact-match rate hasn't moved at all, this comparison will still fail some nonzero fraction of the time, purely from noise — and a gate that cries wolf gets its threshold loosened by an annoyed engineer, then loosened again, until it's not actually gating anything.

## Deriving why noise alone can flip a threshold

Treat each gold-set item's pass/fail as a coin flip with true probability `p` (the pipeline's real exact-match rate). Run `n` items and you get an observed rate `p̂ = k/n`. The standard error of that estimate is:

```text
SE = sqrt(p̂ · (1 - p̂) / n)
```

Plug in illustrative numbers to see the shape of the problem, not to claim these are real measured rates: at `p̂ = 0.85` and `n = 20` (a gold set sized the way [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) warns can still be too small), `SE = sqrt(0.85 · 0.15 / 20) ≈ 0.08`. A single run's observed rate can easily land anywhere from roughly 0.77 to 0.93 purely from sampling noise, on a pipeline whose true rate never moved. A gate that fails on any decrease will trip constantly on a set this size, for reasons that have nothing to do with the change under test.

The fix isn't a cleverer threshold — it's shrinking `SE` and only trusting a drop that clears it by a real margin:

- **Grow `n`.** `SE` shrinks with `1/sqrt(n)`, so quadrupling the gold set halves the noise. This is the strongest lever, and it's why gate reliability is downstream of gold-set size, not just of the gate's own logic.
- **Run each item more than once and average**, if sampling temperature is nonzero. A single draw per item conflates "the model is worse" with "the model drew an unlucky token this one time." Averaging `m` draws per item shrinks the effective noise the same way growing `n` does.
- **Require the drop to clear a margin, not just cross zero.** A rule like "fail only if `p̂_after < p̂_before - 2·SE`" is a real, if informal, significance test — it fails the build when a drop is unlikely to be pure noise, and lets through the swings that are.

## The tradeoff that matters

Tightening the gate to reduce false failures (blocking a genuinely fine change) always costs you some true failures (letting a genuine regression through, because it didn't clear the margin this run). There is no threshold that eliminates both kinds of error on a fixed-size gold set — you're choosing a point on that tradeoff, not solving it away. Two reasonable defaults, depending on which mistake costs you more:

- **Conservative** (favor catching every regression, accept occasional false alarms): a smaller margin, more frequent human review of borderline gate failures, and a larger gold set to keep false-alarm frequency tolerable despite the smaller margin.
- **Permissive** (favor a quiet CI pipeline, accept an occasional small regression slipping through): a wider margin, paired with the production monitoring from [Monitoring Structured Output in Production](/learn/structured-outputs/monitoring-structured-output-in-production) catching what the gate missed after deploy rather than before merge.

Neither is "correct" in the abstract — pick based on how expensive a production regression actually is for your pipeline versus how expensive a blocked merge is for your team's velocity.

## What actually changed, and why the gate has to know

A gate firing tells you the pipeline got worse. It doesn't tell you why, and the three possible causes need different fixes:

- **Model version change** (the provider shipped a new default, or you upgraded on purpose) — the fix might be a prompt adjustment to accommodate the new model's habits, or a rollback to a pinned older version if one is available.
- **Prompt change** — the fix is almost always a diff against the previous prompt, checked against the specific gold items that newly failed.
- **Schema change** — this one needs [Schema Versioning and Migration](/learn/structured-outputs/schema-versioning-and-migration)'s discipline layered on top: a schema change that also changes gold-set labels (a renamed field, a narrowed enum) means the "before" and "after" reports aren't comparable on that field at all, and the gate needs to know to exclude it rather than report a false regression on a field that was deliberately redefined.

Log which of the three changed alongside every gate run — without it, a failing gate tells you "something regressed" and leaves the actual diagnosis to whoever's on call.

## Minimal implementation

```python
import math

def gate(before: dict, after: dict, n: int, margin_sds: float = 2.0) -> bool:
    """Returns True if the build should PASS."""
    p_after = after["exact_match_rate"]
    se = math.sqrt(p_after * (1 - p_after) / n)
    threshold = before["exact_match_rate"] - margin_sds * se
    if p_after < threshold:
        return False
    if after["valid_rate"] < 0.98:          # a hard floor, independent of the comparison
        return False
    return True
```

The hard floor on `valid_rate` matters separately from the comparative check: a comparative-only gate can pass a build whose valid-rate *and* accuracy both quietly declined together over several small changes, each one individually within the noise margin. A floor catches slow drift that a change-over-change comparison is structurally blind to.

## Where next

Once the gate is real, the natural next question is what happens between deploys — [Monitoring Structured Output in Production](/learn/structured-outputs/monitoring-structured-output-in-production) covers the live signals that catch what a pre-merge gate, running against a fixed gold set, structurally cannot: drift in the real input distribution itself.

**Related:** [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness), [Schema Versioning and Migration](/learn/structured-outputs/schema-versioning-and-migration), [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Monitoring Structured Output in Production](/learn/structured-outputs/monitoring-structured-output-in-production)
