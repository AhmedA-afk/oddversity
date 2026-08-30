---
title: "Floating-point arithmetic and computational notation"
track: "maths-foundations"
status: live
summary: "Floating-point numbers approximate real numbers with finite bits, so arithmetic."
duration: "5 min read"
---

## The short answer

Floating-point numbers approximate real numbers with finite bits, so arithmetic
rounds, can lose small terms, and can overflow or underflow. Treat displayed
values as measurements with error: use tolerances, stable algebra, finite-value
checks, and recorded random seeds. The decision is not “is this exactly equal?”
but “is the error within the tolerance that this model or test can afford?”

## Why this matters

Losses, probabilities, gradients, and normalisation all pass through numerical
operations. A computation can return a finite-looking answer after silently
discarding a term, or produce `NaN` only after the bad value has travelled through
many layers. Reproducibility also has layers: a seed can make a local experiment
repeatable while library versions, hardware, parallel reduction order, or
unrecorded preprocessing still differ.

The right habit is to expose numerical assumptions in smoke tests before a long
training run or a production decision.

## How it works

A floating-point result can be understood approximately as a rounded real value:

```text
fl(x) = x(1 + δ), with |δ| small for ordinary, non-overflowing operations
```

The bound is not a promise that every expression has small total error. Repeated
operations accumulate error; subtracting nearly equal values can cancel useful
digits; a result outside the representable range becomes infinity or zero.

Use `isfinite` checks, absolute and relative tolerances, and numerically stable
equivalent formulas. For example, compare `a` and `b` with a tolerance tied to
their scale instead of exact equality.

## Worked examples and variations

### Example A: decimal notation is not binary exactness

**Illustrative.** **Input:** in common binary floating-point, evaluate `0.1 + 0.2` and compare it
with `0.3`. **Mechanism:** the decimal fractions are approximated before the
addition. **Output:** a displayed result such as `0.30000000000000004`, so exact
equality can be false. **Inspect:** print the difference and compare with a
tolerance. **Decision:** use an absolute/relative tolerance for numerical tests;
use decimal or integer representations when exact decimal accounting is the
actual requirement.

### Example B: order changes a sum

**Illustrative.** **Input:** add a very large value, many small values, and then subtract the large
value. **Mechanism:** a small term can be rounded away when added to the large
partial sum. **Output:** a result that depends on accumulation order and may miss
part of the small total. **Inspect:** compare forward, reverse, and compensated
summation. **Decision:** choose a stable reduction when small contributions affect
the reported metric or gradient.

### Example C: stable probability computation

**Illustrative.** **Input:** a logit `z=1000`. **Mechanism:** the naive sigmoid evaluates
`exp(z)/(1+exp(z))`, which may overflow even though the mathematical answer is
near `1`. **Output:** `inf/inf`, `NaN`, or an exception depending on the runtime.
**Inspect:** check intermediate values, not only the final probability.
**Decision:** use a branch-stable sigmoid that evaluates a negative exponential
for positive `z`.

### Boundary case: underflow and the edge of representability

**Illustrative.** **Input:** a positive value smaller than the smallest representable normal range,
or a product of many tiny probabilities. **Mechanism:** rounding can turn it
into `0.0`; repeated multiplication can underflow long before the mathematical
product is conceptually zero. **Output:** zero and a lost distinction between
“very unlikely” and “impossible.” **Inspect:** switch to log-space and check
finiteness. **Decision:** use log probabilities for likelihood products and
define how zero is handled before it reaches a logarithm.

### Counterexample: exact comparison as a correctness proof

**Illustrative.** **Input:** an iterative solver stops only when `new_loss == old_loss`.
**Mechanism:** rounding may prevent equality even after useful progress, or may
make two values equal while the parameters are still wrong. **Output:** a loop
that never stops or stops for the wrong reason. **Inspect:** track a tolerance,
iteration cap, gradient norm, and finite values. **Decision:** use several
diagnostics; equality of two displayed floats is not convergence.

## Two ways to see it

### Builder view

Numerical code needs an error budget. For each assertion, state the scale of the
quantity, an absolute tolerance, a relative tolerance, and the failure action.
For each random experiment, record the seed, library versions, and the fixture
that was used.

### Numerical analyst view

Algebraically equivalent expressions can have different conditioning and
round-off behaviour. A well-conditioned problem can still be implemented badly;
an ill-conditioned problem can remain sensitive after a careful implementation.
Stability is a property of the problem and the algorithm together.

## Hands-on

Create a numerical smoke-test notebook or script with four checks:

```python
import math
import random

def stable_sigmoid(z):
    if z >= 0:
        return 1 / (1 + math.exp(-z))
    e = math.exp(z)
    return e / (1 + e)

assert math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-12, abs_tol=1e-12)
assert math.isfinite(stable_sigmoid(1000))
random.seed(17)
fixture = [random.random() for _ in range(3)]
```

**Failure fixture:** replace `stable_sigmoid(1000)` with the naive positive-logit
formula and assert finiteness; separately change the exact comparison to
`0.1 + 0.2 == 0.3`. **Test:** each failure must identify overflow or tolerance
misuse by name, and the seed must reproduce `fixture`. **Reset:** restore the
stable branch and tolerance comparison, rerun twice with seed `17`, and compare
the recorded fixture values.

## Checkpoint

- [ ] Explain why `0.1 + 0.2` may not equal `0.3` exactly in binary floating point.
- [ ] Give one reason summation order can change a result.
- [ ] State why log-space helps with a product of many tiny probabilities.
- [ ] Name two diagnostics besides exact loss equality that can signal convergence.

## What this does not solve

Stable arithmetic cannot repair a wrong formula, an ill-conditioned problem, bad
data, or nondeterministic hardware behaviour. A fixed seed is evidence about one
reproduction setup, not a universal guarantee that every platform will emit
bit-for-bit identical training results.

## Continue, go deeper, apply it

- Continue: Visual reasoning and diagnostic plots
- Go deeper: Algebra for model equations
- Apply it: Optimisation, loss, and gradient descent
