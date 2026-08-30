---
title: "Rank, pivots, and identifiability"
track: "maths-foundations"
status: live
summary: "The rank of a matrix is the number of independent pivot directions it contains."
duration: "5 min read"
---

## The short answer

The rank of a matrix is the number of independent pivot directions it contains.
It tells you how many independent constraints or distinguishable output
directions a linear map has. In an AI model, rank reveals redundant features and
whether parameters are identifiable: if two parameter settings produce the same
outputs, the data cannot choose between them without another constraint.

## Why this matters

A model can have ten named features but only three independent directions of
information. Fitting all ten coefficients then creates ambiguity, unstable
estimates, or arbitrary values selected by a library. Rank is not a score of data
quality; it is a structural diagnostic for a particular matrix and precision.

## How it works

Row-reduce `A` to echelon form. The number of nonzero rows, equivalently the
number of pivot columns, is `rank(A)`. The pivot columns of the original matrix
are independent; non-pivot columns are combinations of them. For
`A ∈ R^(m×n)`,

```text
rank(A) ≤ min(m,n).
```

For a linear model `y=Xw`, parameters are identifiable when
`Xw₁=Xw₂ ⇒ w₁=w₂`. Subtracting gives `X(w₁-w₂)=0`. Therefore uniqueness requires
the null space of `X` to contain only zero, which for `n` features means
`rank(X)=n` (full column rank). If `v≠0` and `Xv=0`, then `w` and `w+tv` make
the same predictions for every scalar `t`.

> **Illustrative story (not measured evidence).** An analyst sees three fitted
> coefficients and assumes the data identified three effects. A column comparison
> finds that two features are duplicates, so only their sum is observable. The
> model can predict while the individual coefficient story remains unsupported.

## Worked examples and variations

### Case A: full rank, two independent features

**Input:** `A=[[1,0],[0,1],[1,1]]`. **Mechanism:** the first two columns are
independent, so elimination has two pivots. **Output:** `rank(A)=2`; a vector
`x∈R²` is distinguishable through `Ax`. **Inspect:** no nonzero combination of
the columns gives zero. **Decision:** a two-parameter exact model can be
identified from these directions, subject to measurement quality.

### Case B: a duplicated feature

**Input:** `X=[[1,2,2],[1,3,3],[1,4,4]]`, with intercept, `x`, and a duplicate
of `x`. **Mechanism:** the third column equals the second, so `rank(X)=2` not
3. **Output:** coefficients `(b,w₁,w₂)` are not unique; only `w₁+w₂` affects
predictions. **Inspect:** the null direction `v=[0,1,-1]` satisfies `Xv=0`.
**Decision:** remove the duplicate, constrain the coefficients, or use a method
whose convention for selecting one solution is explicit.

### Case C: rank describes outputs too

**Input:** `A=[[1,2,3],[2,4,6]]`. **Mechanism:** row two is twice row one and
the columns all lie on one direction. **Output:** `rank(A)=1`; the map from
`R³` to `R²` produces outputs on a line, not all of `R²`. **Inspect:** every
output pair has second coordinate twice the first. **Decision:** do not promise
two independent signals merely because the output has two slots.

### Case D: apparent full rank in finite precision

**Input:** `A=[[1,1],[1,1+1e-12]]`. **Mechanism:** exact arithmetic gives rank 2,
but the columns are nearly dependent. A tolerance-based numerical rank may call
it rank 1. **Output:** the structural answer and practical answer can differ.
**Inspect:** singular values or pivot ratios, not only an exact zero test.
**Decision:** report the tolerance/scale used and examine conditioning before
trusting coefficient estimates.

### Boundary/counterexample: more rows do not guarantee more information

**Input:** one constraint repeated a thousand times. **Mechanism:** repeated
rows increase sample count but not the span of constraints, so rank stays 1.
**Output:** more records, same independent direction. **Inspect:** compare rank
with row count. **Decision:** distinguish repeated evidence from a new feature or
constraint direction.

## Two ways to see it

### Builder view

Rank is the count of pivots after elimination. For a feature matrix, pair it with
column names and a null vector so the abstract diagnosis becomes “these two
columns trade off without changing predictions.”

### Systems view

Rank is an information budget. It bounds how many independent questions the
system can answer and how many independent outputs it can express. Regularising
or choosing a minimum-norm solution can make a result reproducible, but it does
not recover information absent from the data.

## Hands-on

Create three matrices: full-column-rank features, a duplicated-feature design,
and a nearly dependent design. Row-reduce them or use a library rank routine,
then find a candidate null vector for the duplicated case and verify `Xv=0`.

**Designed failure:** add a duplicate feature and force code to invert `XᵀX`, or
classify numerical rank with one hard-coded absolute tolerance. **Test:** the
duplicate must be reported as non-identifiable, and scaling the whole matrix
must not change the rank classification solely due to units. **Reset:** remove
the duplicate or state a constraint, choose a scale-aware tolerance, and rerun
the null-vector and prediction checks.

## Checkpoint

- [ ] Find the rank and pivot columns of `[[1,2],[2,4]]`.
- [ ] Explain why a nonzero `v` with `Xv=0` makes model parameters non-identifiable.
- [ ] Give a feature example where the number of rows exceeds rank.
- [ ] Distinguish exact rank deficiency from near-dependence in floating-point data.

## What this does not solve

Rank does not measure predictive usefulness, causal relevance, noise level, or
fairness. Full column rank is necessary for unique linear coefficients in an
exact model, but it does not guarantee stable estimates or good generalisation.

## Continue, go deeper, apply it

- Continue: Null spaces, column spaces, row spaces, and the fundamental picture
- Go deeper: Gaussian elimination and row-echelon form
- Apply it: Linear regression
