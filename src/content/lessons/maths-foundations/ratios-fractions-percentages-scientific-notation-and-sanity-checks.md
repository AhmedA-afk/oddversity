---
title: "Ratios, fractions, percentages, scientific notation, and numerical sanity checks"
track: "maths-foundations"
status: live
summary: "A ratio is a numerator compared with a stated denominator; a fraction."
duration: "5 min read"
---

## The short answer

A ratio is a numerator compared with a stated denominator; a fraction is its
exact form, a decimal is a scale for calculation, and a percentage is that
decimal multiplied by 100. Scientific notation exposes order of magnitude. Keep
percentage points separate from percent change, write the denominator, and do a
rough bound before trusting a metric: most numerical mistakes are unit or scale
mistakes, not difficult arithmetic.

## Why this matters

Accuracy, conversion rate, error rate, prevalence, latency, and cost all look like
small numbers, but their denominators and scales determine their meaning. A
reported “5% improvement” might mean five percentage points or a relative change
of 5%. A probability `0.002` might be mistaken for `0.2%` or `0.02%`. Sanity
checks catch these errors before a plot or model turns them into a confident
decision.

## How it works

For a numerator `a` and nonzero denominator `b`:

```text
ratio = a / b
percentage = 100 × a / b
scientific notation = c × 10^k, where 1 ≤ c < 10
```

The denominator defines the reference population. A percentage-point change is
subtraction on the 0–100 scale: `80% - 75% = 5 percentage points`. A relative
percent change divides the difference by the old value: `(80-75)/75 ≈ 6.67%`.
The two are both valid but answer different questions.

For a quick sanity check, bound the result, estimate its order of magnitude, and
recompute it through a second representation. A rate from counts must lie in
`[0, 1]` when the numerator is a subset of the denominator.

## Worked examples and variations

### Example A: one rate in four forms

**Illustrative.** **Input:** 3 successful cases out of 12. **Mechanism:** `3/12 = 0.25`, then
`0.25 × 100 = 25%`, and scientific notation is `2.5 × 10⁻¹`. **Output:**
`3/12 = 0.25 = 25%`. **Inspect:** numerator and denominator count the same kind
of unit. **Decision:** report both the percentage and `3 of 12` when sample size
matters.

### Example B: percentage points versus relative change

**Illustrative.** **Input:** a model's recall rises from `75%` to `80%`. **Mechanism:** subtracting
gives `5 percentage points`; dividing the improvement by the old recall gives
`5/75 ≈ 6.67%` relative improvement. **Output:** two different summaries.
**Inspect:** the phrase “5% better” is ambiguous. **Decision:** name the scale
explicitly in the report.

### Example C: order-of-magnitude estimate

**Illustrative.** **Input:** `2,400,000` records, each with `500` bytes. **Mechanism:**
`2.4 × 10⁶ × 5 × 10² = 12 × 10⁸ = 1.2 × 10⁹` bytes. **Output:** roughly one
gigabyte before indexes or metadata. **Inspect:** the exponent `6+2=8`, then the
coefficient shifts one place. **Decision:** budget storage in the right order of
magnitude and add overhead separately.

### Boundary case: zero denominator and extreme rates

**Illustrative.** **Input:** zero conversions from zero impressions, or 1 success out of 1 case.
**Mechanism:** `0/0` is undefined, while `1/1=1` is mathematically valid but
based on a tiny denominator. **Output:** undefined versus `100%`. **Inspect:**
check denominator and sample size before formatting. **Decision:** return an
explicit “not estimable” state for `0/0`; attach uncertainty or a small-sample
warning to extreme rates.

### Counterexample: a percentage error hidden by formatting

**Illustrative.** **Input:** a code path stores `0.08` and displays it as `0.08%` rather than
`8%`, or reports `20%` increase followed by `20%` decrease as unchanged.
**Mechanism:** the first confuses decimal and percentage scales; the second
multiplies by `1.2` then `0.8`. **Output:** `0.08%` instead of `8%`, and `96` from
an initial `100`, not `100`. **Inspect:** retain raw decimal values and show the
formula. **Decision:** test formatting and compound changes separately.

## Two ways to see it

### Builder view

Make each metric a typed record: numerator, denominator, unit, scale, valid range,
and display formatter. The formatter must not change the stored quantity. Add a
reasonableness assertion before a metric enters a dashboard or model feature.

### Decision-maker view

The denominator is the story. An impressive rate on a narrow or selected sample
can be less useful than a smaller rate on the population that will actually use
the system. Ask “out of what?” and “compared with which baseline?” before
comparing percentages.

## Hands-on

Build a small metric checker that accepts `numerator`, `denominator`, and an
explicit `metric_name`. Return the fraction, percentage, scientific-notation
string, and a warning when the denominator is small or zero. Add separate helpers
for percentage-point and relative changes.

**Failure fixture:** pass `(8, 100)` to a formatter that appends `%` without
dividing, pass `(0, 0)`, and compare a `75% → 80%` change using the wrong formula.
**Test:** assert `8/100 == 0.08`, display `8%`, reject `0/0` as not estimable,
and return both `5` percentage points and approximately `6.67%` relative change.
**Reset:** restore valid denominators and the decimal storage convention, then
rerun the checker against the hand-computed Example A and B values.

## Checkpoint

- [ ] Convert `7/20` into a decimal and a percentage.
- [ ] Explain the difference between a five-point increase and a five-percent relative increase.
- [ ] Estimate the order of magnitude of `3 × 10⁵ × 2 × 10³`.
- [ ] State what a metric function should return for a zero denominator.

## What this does not solve

Sanity checks do not provide statistical confidence, causal attribution, or a
fair comparison. A rate can be correctly calculated from a biased sample, and a
large denominator can still measure the wrong outcome. Pair arithmetic with
sampling, uncertainty, and metric-definition review.

## Continue, go deeper, apply it

- Continue: Sequences, recurrences, polynomials, quadratics, and growth rates
- Go deeper: Units, scales, and normalisation
- Apply it: Imbalanced data and metrics
