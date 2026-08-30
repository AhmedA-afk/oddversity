---
title: "Linear systems and augmented matrices"
track: "maths-foundations"
status: live
summary: "A linear system collects equations into Ax=b. Its augmented matrix A|b."
duration: "4 min read"
---

## The short answer

A linear system collects equations into `Ax=b`. Its augmented matrix `[A|b]`
keeps coefficients and targets side by side so elimination can reveal whether
there is one solution, no solution, or infinitely many. In AI, this is a compact
way to express calibration constraints, resource allocations, and exact model
requirements before deciding whether an approximate fit is needed.

## Why this matters

“Solve for the parameters” is meaningful only after checking consistency and
identifiability. Three equations may repeat the same information, conflict, or
leave a free choice. Treating every system as uniquely solvable encourages
arbitrary defaults and hides constraints that the data cannot determine.

> **Illustrative story (not measured evidence).** A planning tool reports one
> staffing plan for three constraints. Row reduction reveals that two constraints
> conflict, while a different scenario leaves a free allocation. The solver did
> not fail in either case; the specification had to distinguish impossible from
> underdetermined.

## How it works

For unknown vector `x ∈ R^n`, a system is

```text
a_11 x_1 + ... + a_1n x_n = b_1
...
a_m1 x_1 + ... + a_mn x_n = b_m,
```

or `Ax=b`. The augmented matrix is `[A|b]`. Elementary row operations—swapping
rows, multiplying a row by a nonzero scalar, and adding a multiple of one row to
another—preserve the solution set because they replace equations by equivalent
ones. A row `[0 0 ... 0 | c]` with `c≠0` says `0=c`, proving inconsistency. A
free variable signals multiple solutions unless another constraint fixes it.

## Worked examples and variations

### Case A: one unique solution

**Input:** `x+y=5`, `x-y=1`, so `[A|b]=[[1,1|5],[1,-1|1]]`.
**Mechanism:** add equations to get `2x=6`, then `x=3`, `y=2`.
**Output:** one solution `(3,2)`. **Inspect:** substitute into both original
equations. **Decision:** use the solution only after residuals are zero (or below
a stated tolerance for numerical data).

### Case B: no solution in a calibration constraint

**Input:** `x+y=2` and `2x+2y=5`. **Mechanism:** doubling the first left side
would require `2x+2y=4`, but the target says 5. Elimination yields
`[0 0 | 1]`. **Output:** no solution. **Inspect:** the constraints conflict,
not the solver. **Decision:** resolve the specification or move to a least-squares
or soft-constraint formulation; do not silently pick a parameter pair.

### Case C: infinitely many allocations

**Input:** `x+y+z=10` with nonnegative allocations. **Mechanism:** choose any
`x,y≥0` with `x+y≤10`, then `z=10-x-y`. **Output:** infinitely many solutions.
**Inspect:** one equation leaves two degrees of freedom. **Decision:** add an
objective or more constraints if the system must select one allocation.

### Case D: an AI-relevant exact fit

**Input:** two measurements and a line `y=wx+b`: `(0,1)` and `(2,5)`.
**Mechanism:** `b=1` and `2w+b=5`, giving `w=2`; with unknown order `(b,w)`,
`[A|y]=[[1,0|1],[1,2|5]]`. **Output:** exact parameters `[b,w]ᵀ=[1,2]`.
**Inspect:** the order of unknowns matters as much as the coefficients.
**Decision:** label parameter columns before constructing `A`.

### Boundary case: an empty or zero-target system

**Input:** `0x=0` versus `0x=3`. **Mechanism:** the first is true for every
`x`; the second is impossible. **Output:** infinite solutions in the first,
none in the second. **Inspect:** do not infer uniqueness from a solver returning
one default vector. **Decision:** report solution dimension and consistency.

## Two ways to see it

### Builder view

Write a constraint table first, then translate one row at a time to `[A|b]`.
Keep a named parameter order and calculate the residual `Ax-b` after solving.
The residual is a direct test of the original equations.

### Systems view

Rows are requirements; row dependence says some requirements repeat information,
while a conflicting row makes the requested state unreachable. A solver can
expose a contradiction but cannot decide which business or scientific constraint
should win.

## Hands-on

Build a tiny constraint solver for two scenarios: a unique two-variable system
and a resource allocation with a free variable. Store `[A|b]`, solve or classify
the system, and report residuals plus free variables.

**Designed failure:** change one target so elimination creates `[0 0|1]`, then
feed a zero-row system to code that assumes a unique solution. **Test:** classify
`unique`, `none`, and `infinite` explicitly and never return a confident vector
for the inconsistent fixture. **Reset:** restore the original target and add a
constraint or objective before requesting a single allocation.

## Checkpoint

- [ ] Translate three named equations into `Ax=b` with a stated variable order.
- [ ] Give the row pattern that proves a system has no solution.
- [ ] Explain why one equation in three unknowns leaves infinitely many solutions.
- [ ] Verify a proposed solution by computing `Ax-b`, not by trusting the solver status.

## What this does not solve

An exact solution may not exist, may not be unique, or may be physically invalid
(for example, negative allocation). A linear system also says nothing about
noise, measurement error, or whether the chosen variables explain the world.

## Continue, go deeper, apply it

- Continue: Gaussian elimination and row-echelon form
- Go deeper: Matrix–matrix multiplication and batching
- Apply it: Linear regression
