---
title: "Span, linear independence, basis, and dimension"
track: "maths-foundations"
status: live
summary: "The span of vectors is every linear combination they can make."
duration: "4 min read"
---

## The short answer

The span of vectors is every linear combination they can make. Vectors are
linearly independent when no nontrivial combination equals zero. A basis is an
independent spanning set, and dimension is the number of vectors in a basis.
These ideas tell an AI builder whether a representation has redundant directions,
how to express a point in chosen coordinates, and why adding columns may add no
information.

## Why this matters

Feature engineering often adds candidates faster than it adds independent
information. A basis gives a compact coordinate system; independence makes those
coordinates unique. Confusing “more columns” with “more dimensions” leads to
redundant parameters, unstable fits, and inflated confidence about model
capacity.

## How it works

For vectors `v₁,…,v_k`,

```text
span{v₁,…,v_k} = {c₁v₁+...+c_kv_k : c_i∈R}.
```

They are independent if
`c₁v₁+...+c_kv_k=0` implies every `c_i=0`. A set is a basis of a space when it
both spans the space and is independent. If `B=[b₁ ... b_n]` is a basis matrix,
the coordinate vector `c` of `x` solves `Bc=x`. Independence gives uniqueness:
if `Bc=Bd`, then `B(c-d)=0`, and no nonzero null vector exists.

> **Illustrative story (not measured evidence).** A feature catalogue grows from
> three columns to ten, and a dashboard calls this a ten-dimensional model. Row
> reduction finds that several columns are combinations of the first three. The
> catalogue is larger; the represented space is not.

## Worked examples and variations

### Case A: standard coordinates

**Input:** `e₁=[1,0]`, `e₂=[0,1]`, target `x=[3,-2]`. **Mechanism:**
`x=3e₁-2e₂`. **Output:** coordinates `(3,-2)` in the standard basis.
**Inspect:** neither basis vector is a combination of the other. **Decision:**
use the basis coordinates as the representation only when the basis meaning and
units are documented.

### Case B: a non-standard basis

**Input:** `b₁=[1,1]`, `b₂=[1,-1]`, target `x=[4,2]`. **Mechanism:** solve
`c₁+c₂=4`, `c₁-c₂=2`, giving `c₁=3,c₂=1`. **Output:** `x=3b₁+1b₂`.
**Inspect:** reconstruct `[4,2]` before accepting the coordinates. **Decision:**
use the new basis when it exposes task structure, but keep the conversion matrix.

### Case C: dependent feature candidates

**Input:** `v₁=[1,2]`, `v₂=[2,4]`. **Mechanism:** `v₂=2v₁`, so their span is
one-dimensional and the set is dependent. **Output:** two stored vectors but one
independent direction. **Inspect:** `1v₁-0.5v₂=0`. **Decision:** remove one,
or record the dependence before fitting a model.

### Case D: a larger set that still spans a small space

**Input:** five vectors in `R³`, including `e₁,e₂,e₃` and two combinations.
**Mechanism:** the set spans `R³`, but dimension cannot exceed 3; the extra
vectors are dependent. **Output:** a basis still has only three vectors.
**Inspect:** row-reduce the vector matrix to select pivot columns. **Decision:**
do not infer five independent signals from five columns.

### Boundary/counterexample: the zero vector and empty span

**Input:** `{0}`. **Mechanism:** its span is `{0}`, but the set is dependent
because `1·0=0` is a nontrivial relation. The empty set also spans `{0}` by the
empty linear combination. **Output:** neither is a basis for a nonzero space.
**Inspect:** test the definitions rather than relying on a count. **Decision:**
check the target space before calling a set a basis.

## Two ways to see it

### Builder view

Put candidate vectors in columns, row-reduce, and keep pivot columns as a basis.
For a coordinate conversion, multiply the basis matrix by the proposed
coordinates and check reconstruction exactly or within a declared tolerance.

### Systems view

A basis is a minimal interface: every supported representation can be built, and
no coordinate is redundant. A larger generator set may be useful for search or
regularisation, but it is not automatically a larger information space.

## Hands-on

Write a basis inspector that accepts a list of vectors, reports span dimension,
independent pivot vectors, and solves coordinates for one target. Include the
non-standard basis and a dependent set.

**Designed failure:** include the zero vector or a duplicate and assume the
number of inputs equals the dimension; accept coordinates without reconstructing
the target. **Test:** the inspector must flag dependence and reject a bad
reconstruction. **Reset:** remove the redundant vector, recompute the basis, and
rerun the coordinate round trip.

## Checkpoint

- [ ] Decide whether `[1,2]` and `[2,4]` are independent, with a relation if not.
- [ ] Find coordinates of `[4,2]` in the basis `([1,1],[1,-1])`.
- [ ] State why a basis needs both spanning and independence.
- [ ] Explain why five vectors in `R³` cannot create five dimensions.

## What this does not solve

A basis change preserves the represented vector space but may change numerical
conditioning, interpretability, or the task-relevant geometry. Independence also
does not make features predictive or causally meaningful.

## Continue, go deeper, apply it

- Continue: Invertibility, determinants, and volume intuition
- Go deeper: Null spaces, column spaces, row spaces, and the fundamental picture
- Apply it: Linear algebra for ML
