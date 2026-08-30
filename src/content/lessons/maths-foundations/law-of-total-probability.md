---
title: "The law of total probability"
track: "maths-foundations"
status: live
summary: "Partition the population into disjoint, exhaustive groups B₁,…,Bₖ, then recombine group-specific rates: P(A)=ΣᵢP(A|Bᵢ)P(Bᵢ)."
duration: "5 min read"
---

## The short answer

Partition the population into disjoint, exhaustive groups `B₁,…,Bₖ`, then recombine group-specific rates: `P(A)=ΣᵢP(A|Bᵢ)P(Bᵢ)`. This is a weighted average, not an independence assumption. It is the right tool when outcomes differ by region, traffic source, class, or routing stage and you need a population-level rate.

## Why this matters

An overall model error can change because subgroup mix changed, even when every
subgroup error stayed fixed. Conversely, a stable overall metric can hide a
large subgroup regression. The law forces the denominator and the weights into
the open, which is essential for imbalanced data and monitoring.

## How it works

If the `Bᵢ` are pairwise disjoint and cover `Ω`, then `A` can be split into the
disjoint pieces `A∩Bᵢ`. Add them and use the conditional multiplication rule:

`P(A)=ΣᵢP(A∩Bᵢ)=ΣᵢP(A|Bᵢ)P(Bᵢ)`.

The assumptions are important: the groups must cover the target population,
not merely the rows that survived an undocumented filter; their weights must
sum to one; and each conditional rate must use the same event `A`.

**Derivation:** because the pieces `A∩Bᵢ` are disjoint and cover `A`, additivity
gives the first equality; applying `P(A∩Bᵢ)=P(A|Bᵢ)P(Bᵢ)` gives the weighted
form. No independence assumption is used.

### Numerical and visual perspective

Draw a probability tree with group branches on the left and outcome branches on
the right. The width of a group branch is `P(Bᵢ)` and its shaded outcome part is
`P(A|Bᵢ)`. Summing the shaded terminal branch widths gives `P(A)`. A stacked bar
plot can show the same decomposition, but label whether segment widths are
population weights or conditional rates.

### An illustrative story

A dashboard’s global false-negative rate improved after a low-risk traffic
source doubled, while the high-risk source got worse. The weighted average
changed because the mixture changed. This is an illustrative monitoring pattern,
not a report about a particular company.

## Worked examples and variations

### Example A: two population groups

**Input:** group `B₁` is 70% of traffic with error 2%; group `B₂` is 30% with
error 8%. **Mechanism:** `P(error)=0.02(0.70)+0.08(0.30)`. **Output:**
`0.038`, or 3.8% overall error. **Inspect:** the weights are population shares,
not equal weights over groups. **Decision:** report both the total and the two
conditional rates.

### Example B: imbalanced-data pipeline

**Input:** 1% of eligible cases are positive; the model has `P(flag|positive)=0.90`
and `P(flag|negative)=0.05`. **Mechanism:** partition by true label:
`P(flag)=0.90(0.01)+0.05(0.99)`. **Output:** `0.0585`, so about 5.85% are
flagged. **Inspect:** most flags can still come from the much larger negative
group. **Decision:** compute precision with Bayes before allocating review work.

### Boundary case: a zero-weight group

**Input:** `P(B₁)=0`, while `P(B₂)=1`. **Mechanism:** the `B₁` term contributes
zero to the unconditional probability, even if a conditional rate was written
down. **Output:** `P(A)=P(A|B₂)`. **Inspect:** a rate for an unobserved group is
not evidence about its future behaviour. **Decision:** distinguish “currently
zero share” from “impossible group” and monitor for arrival.

### Example C: changing mixture

**Input:** group errors are 1% and 9%. The group weights move from 50/50 to
20/80. **Mechanism:** the overall error moves from 5% to `0.2(0.01)+0.8(0.09)=7.4%`
without any within-group change. **Output:** a 2.4-point regression caused by
composition. **Inspect:** compare conditional rates and weights separately.
**Decision:** choose whether the target metric is current-population or a fixed
reference mix.

### Counterexample: overlapping “partitions”

**Input:** count a request once in “mobile,” once in “paid,” and once in “review”
when those properties can overlap. **Mechanism:** the group events are not
disjoint, so adding their weighted terms can double-count. **Output:** a total
that need not equal one. **Inspect:** check pairwise intersections and an
“other/unknown” group. **Decision:** turn overlapping attributes into separate
conditional analyses or construct one true partition.

## Two ways to see it

### Builder view

Treat the formula as a data contract: a group key, its population weight, its
conditional rate, and a coverage check. Keep a fixed reference mix when you
need fair time-to-time comparisons.

### Systems or reviewer view

Decompose any surprising aggregate into “did subgroup behaviour change?” and
“did the subgroup mixture change?” This prevents aggregate metrics from hiding
selection, drift, or allocation effects.

## Hands-on

Create a table with columns `group`, `weight`, `error_rate` for the two-group
example. Implement a weighted sum and assert weights sum to one. Add a second
calculation using a fixed 50/50 reference mix.

**Deliberate failure:** use equal weights for groups whose observed shares are
70/30. **Test:** the expected overall error is 3.8%, not 5%. Also make the
weights sum to 1.1 and require that the test names the coverage failure.
**Reset:** restore 0.70/0.30 and rerun. **No-code route:** draw the tree and
shade the error branches, then compare current and reference mixtures.

## Checkpoint

- [ ] State the partition conditions required by the law.
- [ ] Recombine two conditional rates with unequal population weights.
- [ ] Explain how mixture shift can change an overall metric without subgroup drift.
- [ ] Identify why overlapping groups are not a valid partition.

## What this does not solve

The law recombines estimates; it does not make subgroup rates accurate, fair, or
causal. If a group is missing or selectively observed, the weighted sum may be
precise for the wrong target. Bayes’ rule uses the same decomposition to reverse
an observed event into a posterior about its source.

## Continue, go deeper, apply it

- Continue: Bayes’ rule and base rates
- Go deeper: Imbalanced data and metrics
- Apply it: Mathematics Foundations assignments
