---
title: "Algebra for model equations"
track: "maths-foundations"
status: live
summary: "Algebra lets you preserve an equation’s meaning while solving for an unknown."
duration: "4 min read"
---

## The short answer

Algebra lets you preserve an equation’s meaning while solving for an unknown,
changing units, or exposing a model parameter. In AI, that is how a product loss
becomes a sum of log losses, how a sigmoid score becomes log-odds, and how you
spot an illegal division, an inconsistent unit, or a transformation that changes
the problem instead of merely rewriting it.

## Why this matters

Most ML formulas are short; the errors are often algebraic. Averaging a batch
when the loss already averages it changes gradient scale. Taking `log(a+b)` as
`log(a)+log(b)` silently creates a different objective. Dividing by a feature
standard deviation of zero turns a data-quality problem into `NaN` values.

The goal is not speed at symbolic manipulation. It is the habit of stating the
allowed values and checking whether a transformation preserves the quantity you
intend to optimise or interpret.

## How it works

An equality stays true only when you apply an allowed operation to **both**
sides. For `y = 2x + 1`, solve for `x`:

```text
y - 1 = 2x
(y - 1)/2 = x
```

The division requires the coefficient to be nonzero. More generally, do not
“cancel” a term unless it is a nonzero common factor.

Two identities recur in AI:

```text
exp(a + b) = exp(a) exp(b)
log(ab)     = log(a) + log(b),  when a>0 and b>0
```

The second turns a product of independent likelihood terms into a sum. It does
**not** say `log(a+b)=log(a)+log(b)`.

## Worked examples and variations

### Example A: isolate a linear-model coefficient

**Input:** `ŷ = wx + b`, with `x=4`, `b=1`, `ŷ=13`. **Mechanism:**
`w=(ŷ-b)/x=12/4=3`. **Output:** `w=3`. **Inspect:** division is safe because
`x≠0`. **Decision:** use this rearrangement only for this single observation;
with noisy data, fit `w` over many observations rather than solving each row.

### Example B: product likelihood to log-likelihood

**Input:** independent event probabilities `0.8`, `0.5`, `0.25`.
**Mechanism:** product likelihood `0.1`; log-likelihood is
`log(0.8)+log(0.5)+log(0.25)=log(0.1)`. **Output:** the same ordering of
candidate models, expressed as a sum. **Inspect:** sums are easier to optimise
and less prone to multiplying many tiny values. **Decision:** use log-likelihood
when the original likelihood is positive.

### Example C: odds and log-odds

For a probability `p=0.8`, odds are `p/(1-p)=4`; log-odds are `log(4)`.
Reversing gives `p=exp(z)/(1+exp(z))`. **Inspect:** this is why a linear score
can be converted to a probability by a sigmoid. **Decision:** do not call the
raw score itself a probability unless that conversion/calibration is present.

### Boundary case: standardising a constant feature

`z=(x-μ)/σ` requires `σ>0`. If every row has `x=7`, then `σ=0` and `z` is
undefined. **Inspect:** adding an arbitrary tiny denominator may avoid a crash
but does not create information. **Decision:** remove or specially handle the
constant feature and record the choice.

### Counterexample: a false logarithm rule

Take `a=b=1`. `log(a+b)=log(2)`, while `log(a)+log(b)=0`. They differ.
**Inspect:** a derivation using the false identity changes the loss. **Decision:**
keep a small identity sheet and test symbolic transformations with numbers.

## Two ways to see it

### Builder view

Algebra is executable documentation. Each rearranged formula should preserve
shape and units: if a rate is multiplied by time, the result should be a count;
if a score is averaged, say over which axis. Substitute a small value to check
the code matches the equation.

### Numerical view

Equivalent real-number formulas need not behave equivalently on a computer.
`log(exp(a)+exp(b))` can overflow for large `a`; the stable `log-sum-exp` form
will appear in optimisation. Algebra gives the equivalence; numerical analysis
decides which form to run.

## Hands-on

Make a “formula audit” notebook with three cells:

1. Implement `ŷ=wx+b` and solve a one-row fixture for `w`.
2. Compute a three-event likelihood as both a product and a sum of logs.
3. Standardise a varying feature and a constant feature.

**Failure state:** include `x=0` in the first rearrangement and a constant
feature in the third. **Tests:** assert that the notebook raises or returns a
named invalid-state result instead of silently using infinity/`NaN`. **Reset:**
restore a nonzero `x` and a feature with variance, then compare to hand values.

## Checkpoint

- [ ] Solve `5=2x−3` and verify by substitution.
- [ ] State the domain conditions for `log(x)`, `sqrt(x)`, and `1/x` over real
  numbers.
- [ ] Explain why minimising negative log-likelihood is equivalent to maximising
  likelihood only when the likelihood is positive.
- [ ] Find and correct the error in `log(a+b)=log(a)+log(b)` using numbers.

## What this does not solve

Algebra does not decide whether a model’s independence assumption is valid, a
score is calibrated, or an optimiser will converge. It lets you see the stated
assumption and derive a testable implementation.

## Continue, go deeper, apply it

- Continue: Notation, indices, sums, and products
- Go deeper: Mathematics Foundations checklist
- Apply it: Linear regression from scratch
