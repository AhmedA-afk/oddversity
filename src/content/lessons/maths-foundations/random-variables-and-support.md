---
title: "Random variables and support"
track: "maths-foundations"
status: live
summary: "A random variable is a function that maps an outcome ω∈Ω to a value, usually a number or vector."
duration: "5 min read"
---

## The short answer

A random variable is a function that maps an outcome `ω∈Ω` to a value, usually a number or vector. Its realised value is what one trial produced; its distribution describes probabilities across possible values. The support is the set of values allowed or carrying probability. Keep these three objects separate when building AI features and targets.

## Why this matters

“The random variable is 3” confuses a rule with one observation. A loss,
latency, label, or embedding coordinate can be modeled as a random variable,
but its valid range and units still matter. Support errors—such as negative
latency or an impossible class ID—often reveal a data or simulation bug before a
model metric does.

## How it works

Let `X: Ω→S` be a measurable mapping from outcomes to a value space `S`. For an
event such as `{X≤x}`, the distribution of `X` assigns
`P_X(B)=P({ω:X(ω)∈B})` to subsets `B` of values. A realised value is written
`X(ω)=x`; the symbol `X` still denotes the mapping.

The support is the set of possible values in a discrete model, or more formally
the smallest closed set outside which the distribution has no mass. In practice,
state the operational support: a Bernoulli label lies in `{0,1}`, a count in
`{0,1,2,…}`, and a bounded score may be in `[0,1]`. Support follows from the
data-generating story; it is not always the observed minimum and maximum.

**Derivation:** the distribution of `X` is the probability of the preimage of a
value set: collect every outcome that maps into that set, then apply `P` to the
collection. This push-forward step is why multiple outcomes can share one
random-variable value.

### Numerical and visual perspective

Draw arrows from outcome rows to values, then aggregate rows with the same value.
The resulting bar chart is the PMF. For a continuous variable, draw a density
over an interval instead; a single exact value may have probability zero even
though nearby intervals have positive probability.

### An illustrative story

A latency monitor received a negative duration after a timestamp subtraction was
performed in the wrong order. The histogram looked like a legitimate variable,
but its support contradicted the measurement definition. The story is
illustrative; the support check is the reusable lesson.

## Worked examples and variations

### Example A: a Bernoulli label

**Input:** `Ω={request accepted, request rejected}` and `X=1` for rejection,
`0` otherwise. **Mechanism:** map each outcome to a value and aggregate its
mass. **Output:** `X` has support `{0,1}` and `P(X=1)` is the rejection rate.
**Inspect:** `X=1` is one realised value, not the whole variable. **Decision:**
use a Bernoulli variable for one binary trial.

### Example B: a count from a sequence

**Input:** ten independent message outcomes, and `X` counts failures.
**Mechanism:** many outcome sequences map to the same count; for example, any
sequence with two failures maps to `X=2`. **Output:** support `{0,…,10}`.
**Inspect:** order matters in the underlying space but not in the count value.
**Decision:** choose a count model only after stating the trial assumptions.

### Boundary case: an unobserved but possible value

**Input:** a log contains counts 0 through 4, but the process can produce 5.
**Mechanism:** observed range is `{0,…,4}` while operational support includes
5. **Output:** seeing no 5 is not proof that 5 is impossible. **Inspect:**
separate sample coverage from support. **Decision:** retain a valid “other/high”
case or use a model with unbounded count support.

### Example C: vector-valued output

**Input:** `X(ω)` is a three-dimensional embedding. **Mechanism:** each outcome
maps to a point in `R³`; the distribution is over points or regions, not one
scalar list. **Output:** a realised embedding `x=(0.2,-0.1,0.8)` is one value.
**Inspect:** dimension and coordinate meaning are part of the variable contract.
**Decision:** check shape and domain before distance or density calculations.

### Counterexample: confusing value and probability

**Input:** a model outputs `0.7` for one case. **Mechanism:** that number could
be a realised score, while `P(X≤0.7)` is a distributional quantity. **Output:**
the two are not interchangeable. **Inspect:** identify the variable and the event
before reading the number. **Decision:** do not call every model output a
probability.

## Two ways to see it

### Builder view

Write a variable contract: mapping, units, support, shape, and whether the value
is observed, simulated, or predicted. Assert support before fitting a distribution.

### Systems or reviewer view

Support is a fast plausibility filter. A model can have an excellent average
while producing impossible values in a tail; those cases need a domain rule or a
different output parameterisation.

## Hands-on

Make a table of eight binary outcome sequences and map each to (1) number of
failures and (2) whether the first trial failed. Compute the distinct support of
each variable and histogram the values.

**Deliberate failure:** map a sequence with three trials into a count variable
declared to have support `{0,…,2}`. **Test:** the support assertion must identify
the out-of-support value `3`. **Reset:** restore the three-trial support or remove
the extra sequence, then rerun. **No-code route:** draw arrows from sequence
cards to labeled bins and circle the bin that violates the contract.

## Checkpoint

- [ ] Distinguish `X`, a realised `x`, and the distribution of `X`.
- [ ] State the operational support of a binary label and a bounded count.
- [ ] Explain why observed range can be narrower than possible support.
- [ ] Name one support check for an AI feature or target.

## What this does not solve

Defining a random variable does not identify its distribution, estimate its
parameters, or justify independence. Support can also be conditional on a
population or data-collection rule. PMFs, CDFs, and PDFs give different ways to
represent the distribution once the variable is defined.

## Continue, go deeper, apply it

- Continue: PMFs, CDFs, PDFs, and mass versus density
- Go deeper: Probability and statistics for ML
- Apply it: Mathematics Foundations assignments
