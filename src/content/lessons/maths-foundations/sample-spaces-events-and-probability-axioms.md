---
title: "Sample spaces, events, and probability axioms"
track: "maths-foundations"
status: live
summary: "A sample space is the set of possible outcomes; an event is a set of those outcomes; a probability assignment gives each event a number from 0 to 1."
duration: "5 min read"
---

## The short answer

A sample space is the set of possible outcomes; an event is a set of those outcomes; a probability assignment gives each event a number from 0 to 1. The axioms are non-negativity, certainty of the whole space, and additivity for disjoint events. In AI, define these objects before interpreting a score as uncertainty.

## Why this matters

“The model is 80% likely to be right” is incomplete until we know what the
outcomes are, which population generated them, and what event “right” denotes.
For a classifier, the outcomes might be the true label and prediction pair. For
a sampler, they might be all possible records. A precise event makes a claim
testable and exposes impossible or double-counted cases.

## How it works

Let `Ω` be a sample space. An event `A` is a subset of `Ω`; `Aᶜ` contains the
outcomes where `A` does not occur. A probability measure `P` obeys:

1. `P(A) ≥ 0` for every event `A`.
2. `P(Ω) = 1`.
3. If `A₁, A₂, ...` are pairwise disjoint, then
   `P(∪ᵢ Aᵢ) = Σᵢ P(Aᵢ)`.

For a finite space, this means assigning non-negative masses to individual
outcomes that sum to one, then adding masses over an event. It also gives
`P(∅)=0` and `P(Aᶜ)=1-P(A)`: the empty and full events are disjoint and cover
`Ω`. The axioms do not tell you which assignment describes reality; that is a
modeling and data question.

**Derivation and assumption check:** the axioms are the definition of a
probability measure, so they are not derived from a more basic probability
rule. For a finite table, the observable proof obligation is exactly the three
checks above: non-negative masses, total mass one, and addition over disjoint
rows.

### Numerical and visual perspective

Draw one bar per mutually exclusive outcome. Event probability is the total
height of the bars it selects. A useful plot has the outcome labels and a bar
sum of exactly one; a pie chart with overlapping categories is a warning sign.
For large or continuous spaces, the same idea becomes area or volume under a
measure, not a list of every possible outcome.

### An illustrative story

A review queue was reported as “20% high risk,” but the dashboard counted a
case in both “high risk” and “needs manual review.” The percentage was not a
probability assignment over disjoint outcomes. Treat this as an illustrative
failure pattern, not a measured incident.

## Worked examples and variations

### Example A: a fair die

**Input:** `Ω={1,2,3,4,5,6}`, with each outcome mass `1/6`. **Mechanism:** the
event `A={2,4,6}` selects three disjoint outcome bars. **Output:**
`P(A)=3/6=1/2`. **Inspect:** `P(Ω)=1`, and the event is a subset of `Ω`.
**Decision:** “even” is a valid event; “7” is not an outcome in this model.

### Example B: an AI prediction event

**Input:** each request has true label `spam` or `ham`, and the model predicts
one of those labels. **Mechanism:** define `Ω` as the four pairs `(true,
prediction)`. The event “correct” is `{(spam,spam),(ham,ham)}`. **Output:** its
probability is the accuracy only if the pair distribution is the population of
interest. **Inspect:** the denominator is all evaluated requests, not only
flagged requests. **Decision:** name the population before comparing accuracy.

### Boundary case: empty and full events

**Input:** `A=∅` and `B=Ω`. **Mechanism:** no outcome belongs to `A`, while every
outcome belongs to `B`. **Output:** `P(A)=0` and `P(B)=1`. **Inspect:** a test
suite with no cases can make “all cases passed” vacuously true. **Decision:**
require both a universal assertion and a minimum non-empty sample.

### Counterexample: invalid masses

**Input:** proposed masses `{good: 0.7, bad: 0.5, unknown: -0.2}`.
**Mechanism:** additivity gives total `1.0`, but non-negativity fails.
**Output:** this is not a probability distribution despite summing to one.
**Inspect:** check each mass as well as the total. **Decision:** reject the
assignment and repair the data-generating model; do not silently clip values.

### Production-shaped example: overlapping labels

**Input:** records are tagged `fraud`, `chargeback`, and `review`, where
`review` is an action that can apply to either of the first two. **Mechanism:**
these are not one partition of `Ω`; `review` overlaps the outcome categories.
**Output:** their displayed percentages need not sum to one. **Inspect:**
separate event rates from action rates. **Decision:** use a partition for a
probability table and a separate action table for workflow counts.

## Two ways to see it

### Builder view

Write `Ω`, the event predicates, and the population unit beside every metric.
Then assert that masses are non-negative, sum to one within tolerance, and use
the same outcome definition across training, evaluation, and monitoring.

### Systems or reviewer view

Ask what has been omitted, duplicated, or made impossible by the sample space.
A neat probability can still answer the wrong question if the population, label,
or observation process is wrong.

## Hands-on

Create a deterministic Python fixture for four outcomes of a routing model:
`{"allow": 0.55, "review": 0.25, "block": 0.20, "unknown": 0.0}`. Write tests
for non-negativity, total mass, complement arithmetic, and the event
`{"review", "block"}`.

**Deliberate failure:** change `block` to `0.30` and `unknown` to `-0.10`.
**Test:** report both the negative mass and the total-mass violation by name.
**Reset:** restore the fixture, rerun the calculations and assertions, and
record the event probability `0.45`. **No-code route:** draw the four bars on paper and shade
the event; annotate the denominator and the complement.

## Checkpoint

- [ ] State a sample space and event for “the next model response is rejected.”
- [ ] Explain why pairwise disjoint events add without subtracting overlap.
- [ ] Verify whether a proposed finite mass table is a probability distribution.
- [ ] Give one reason an event rate may differ from an action rate.

## What this does not solve

The axioms do not estimate probabilities from data, validate that the sample
space matches reality, or establish causality. A valid measure can describe a
biased sample or a badly specified event. Data collection, conditional
reasoning, and model checking come next.

## Continue, go deeper, apply it

- Continue: Counting, permutations, combinations, and inclusion–exclusion
- Go deeper: Mathematics Foundations checklist
- Apply it: Use probability to describe uncertainty and data variation
