---
title: "Gaussian elimination and row-echelon form"
track: "maths-foundations"
status: live
summary: "Gaussian elimination solves a linear system by using valid row operations to make."
duration: "4 min read"
---

## The short answer

Gaussian elimination solves a linear system by using valid row operations to make
each equation reveal one more unknown. The resulting row-echelon form exposes
pivots, free variables, and contradictions. In exact arithmetic the operations
preserve solutions; in floating-point arithmetic, pivot choice and tolerance
matter, so verify the answer against the original equations.

## Why this matters

Elimination is the mechanism behind many “solve” routines and the clearest way
to see rank and identifiability. It also demonstrates a production lesson:
small numbers created by a bad pivot can magnify rounding error. A solver that
returns a vector is not enough; inspect pivots and residuals.

## How it works

For `[A|b]`, choose a nonzero pivot in the current column, eliminate entries below
it, and recurse on the remaining submatrix. Back-substitution then recovers the
unknowns from the bottom row upward. If the candidate pivot is zero, swap with a
lower row when possible. Partial pivoting usually selects the available entry
with largest absolute value in that column to limit avoidable amplification.

Each operation preserves the solution set. For example, replacing row `R₂` with
`R₂-cR₁` subtracts `c` times one equation from another; any `x` satisfying both
old equations satisfies the new pair, and the reverse follows by adding back
`cR₁`.

> **Illustrative story (not measured evidence).** A hand-written solver works on
> textbook fixtures and fails on a live matrix whose first pivot is zero. A row
> swap repairs the algebra; a second fixture with a tiny pivot shows why the
> numerical policy must be tested separately from the symbolic derivation.

## Worked examples and variations

### Case A: ordinary elimination

**Input:** `x+y=5`, `2x+3y=12`.
**Mechanism:** `[1,1|5; 2,3|12]`; replace `R₂` by `R₂-2R₁` to get
`[1,1|5; 0,1|2]`; back-substitute `y=2`, `x=3`. **Output:** `(3,2)`.
**Inspect:** calculate both original residuals. **Decision:** keep the row
operations or an audit trail when debugging a hand-built solver.

### Case B: a free variable appears

**Input:** `x+2y+z=4`, `2x+4y+2z=8`. **Mechanism:** the second row becomes
zero after `R₂-2R₁`; choose `y=s,z=t`, so `x=4-2s-t`. **Output:** a two-
parameter solution family. **Inspect:** two free columns mean infinitely many
solutions. **Decision:** report the family or add a selection criterion.

### Case C: a zero pivot that needs swapping

**Input:** `0x+y=2`, `x+y=3`. **Mechanism:** swap the rows, then pivot on `x`;
the solution is `x=1,y=2`. **Output:** correct solution after row exchange.
**Inspect:** a naive implementation that divides by the first entry fails even
though the system is solvable. **Decision:** implement pivot search and a clear
“singular or underdetermined” result.

### Case D: floating-point pivot danger

**Input:**

```text
[1e-20, 1 | 1]
[1,     1 | 2]
```

**Mechanism:** using `1e-20` as the first pivot creates a huge multiplier and can
lose digits; swapping to pivot on `1` is numerically safer. **Output:** exact
algebra says the same solution set, but finite precision may produce different
answers. **Inspect:** compare residuals and pivot magnitudes, not only `x`.
**Decision:** use pivoting and a tolerance appropriate to the scale.

### Boundary/counterexample: rounding a valid pivot to zero

**Input:** a computed pivot `8e-17` in data whose meaningful scale is `1e-16`.
**Mechanism:** an absolute test such as `abs(pivot)<1e-12` declares it zero;
another dataset with scale 1 may legitimately treat `1e-13` as negligible.
**Output:** inconsistent classifications from one fixed tolerance. **Inspect:**
scale rows/columns and use relative criteria. **Decision:** make tolerance a
documented numerical policy, then validate on scaled fixtures.

## Two ways to see it

### Builder view

Elimination is a sequence of reversible row transformations followed by
back-substitution. Store each pivot, row swap, multiplier, and residual. That
turns a black-box solver into an inspectable computation.

### Systems view

Pivoting chooses which constraint currently carries the most reliable numerical
signal. It does not change the mathematical problem; it changes the route used
to compute an answer. In noisy or ill-conditioned problems, a tiny residual can
still coexist with a large parameter error.

## Hands-on

Implement elimination for augmented matrices with partial pivoting. Return the
solution type (`unique`, `none`, or `infinite`), pivot columns, and residual for a
candidate solution. Include a hand-solved `2×2` fixture and a rank-deficient one.

**Designed failure:** disable row swapping and round small pivots to zero using a
fixed absolute threshold. **Test:** the zero-first-pivot case must still solve,
and the scaled pivot fixture must not change classification merely because all
values were multiplied by `1e-6`. **Reset:** restore partial pivoting, rescale
the tolerance, and rerun the original residual checks.

## Checkpoint

- [ ] Name the three elementary row operations and why they preserve solutions.
- [ ] Eliminate `x+y=5`, `2x+3y=12` and back-substitute.
- [ ] Identify the pivot and free columns in a row with one zero pivot.
- [ ] Explain why a residual check is necessary after floating-point elimination.

## What this does not solve

Elimination does not make an inconsistent system consistent, choose among free
solutions, or guarantee stability for an ill-conditioned matrix. For noisy,
overdetermined data, least squares and numerically stable factorizations are the
next tools.

## Continue, go deeper, apply it

- Continue: Rank, pivots, and identifiability
- Go deeper: Linear systems and augmented matrices
- Apply it: Linear regression
