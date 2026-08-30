---
title: "Counting, permutations, combinations, and inclusion–exclusion"
track: "maths-foundations"
status: live
summary: "Count outcomes by asking whether order matters, whether repetition is allowed, and whether cases overlap."
duration: "5 min read"
---

## The short answer

Count outcomes by asking whether order matters, whether repetition is allowed, and whether cases overlap. The product rule gives sequential choices; permutations count ordered selections; combinations count unordered selections; inclusion–exclusion subtracts overlap. In AI, these distinctions prevent wrong sample spaces, duplicate test cases, and inflated estimates of rare-event coverage.

## Why this matters

Before multiplying probabilities, you often need to know how many outcomes are
possible. A test generator that treats `{red,blue}` and `{blue,red}` as
different may report twice the coverage. A birthday-style calculation fails in a
similar way: the question is whether *any pair* collides, not whether one
preselected person matches someone else.

## How it works

If step one has `a` choices and step two has `b` choices for every first choice,
the product rule gives `ab` ordered outcomes. Choosing and arranging `k` of `n`
distinct objects gives

`P(n,k) = n!/(n-k)!`.

If order does not matter, divide by the `k!` arrangements of each chosen set:

`C(n,k) = n!/[k!(n-k)!]`.

For overlapping events, `|A∪B|=|A|+|B|-|A∩B|`. The same structure works for
probability. More generally, alternating sums handle three or more overlaps.
These formulas assume a finite, clearly defined population and distinct
objects unless repetition is explicitly modeled.

**Assumption check:** before applying a formula, state whether positions are
labeled, whether an item can repeat, and whether the counted outcomes are
equally likely. The same number of arrangements does not imply the same
probability when those weights differ.

### Numerical and visual perspective

Make a small tree for ordered choices, then collapse branches that differ only by
order when you want combinations. For the collision problem with `n` equally
likely days and `k` people, it is easier to draw the complement: the first
person has `n/n` choices, the second `(n-1)/n`, and so on. Then

`P(at least one match)=1-∏_{i=0}^{k-1}(n-i)/n`.

For `n=365`, `k=23`, this is about `0.507`, even though a fixed pair matches
with probability only `1/365`.

### An illustrative story

A benchmark generator promised “all pairwise combinations” but included the
same unordered pair twice in opposite order. The visible case count grew while
the distinct coverage did not. This is an illustrative story; inspect your own
identifiers rather than trusting a count.

## Worked examples and variations

### Example A: binary configuration space

**Input:** three independent feature flags, each on or off. **Mechanism:** the
product rule gives `2×2×2=8` ordered-by-position configurations. **Output:**
eight distinct test fixtures. **Inspect:** positions are labeled, so swapping
flag one and flag two can change the fixture. **Decision:** use a product count
when fields have different meanings.

### Example B: choose review cases

**Input:** choose two of five records for a manual audit, with no role for first
versus second. **Mechanism:** `C(5,2)=5!/(2!3!)=10`. **Output:** ten audit
pairs. **Inspect:** `{A,B}` and `{B,A}` are one pair. **Decision:** deduplicate
using a canonical sorted identifier tuple.

### Boundary case: choosing zero or all

**Input:** choose `k=0` or `k=n` items from `n`. **Mechanism:** the factorial
formula gives `C(n,0)=C(n,n)=1`. **Output:** exactly one empty set or full
set. **Inspect:** code must define `0!=1`; an empty selection is not “no
possible outcome.” **Decision:** include these cases in combinatorics tests.

### Example C: birthday-style collision

**Input:** 23 people and 365 equally likely birthdays, ignoring leap days.
**Mechanism:** calculate the no-collision product, then take its complement.
**Output:** approximately `0.507` for at least one shared birthday.
**Inspect:** the event is a union of many pair events; adding `C(23,2)/365`
overcounts multi-person collisions. **Decision:** use the complement or
inclusion–exclusion approximation with its error understood.

### Counterexample: inclusion without subtraction

**Input:** in a 100-record test set, 30 contain `image`, 20 contain `text`, and
10 contain both. **Mechanism:** naive addition gives 50, but
`|image∪text|=30+20-10=40`. **Output:** “at least one modality” is 40%.
**Inspect:** the overlap is a real set of records, not a rounding detail.
**Decision:** subtract overlap before converting to a rate.

## Two ways to see it

### Builder view

Name the unit being counted and choose a canonical representation. Tests should
compare the set of generated IDs, not merely the length of a list. If repetition
is allowed, state whether draws are ordered and whether they replace items.

### Systems or reviewer view

Treat a suspiciously large scenario count as a possible duplication bug. Ask
whether coverage is over outcomes, pairs, paths, or executions; those are not
interchangeable denominators.

## Hands-on

Build a small case-audit table for all two-item selections from `{"A","B","C","D"}`.
Implement both an ordered generator and an unordered generator, then assert that
the unordered set has `C(4,2)=6` members. Add an inclusion–exclusion check for
two tags.

**Deliberate failure:** leave both `(A,B)` and `(B,A)` in the claimed unordered
set, and report `len(list)` instead of `len(set(canonical_pairs))`. **Test:**
the expected count and duplicate-ID assertion must fail. **Reset:** sort each
pair, deduplicate, and rerun. **No-code route:** list the tree branches and
circle branches that represent the same unordered pair.

## Checkpoint

- [ ] Decide whether each of three scenarios needs a product, permutation, or combination count.
- [ ] Derive `C(n,k)` from the ordered count by explaining the `k!` division.
- [ ] Compute a union count when two sets overlap.
- [ ] Explain why the birthday-style trap is a union of many pair events.

## What this does not solve

Counting does not make outcomes equally likely. It also does not fix dependence,
sampling bias, or a changing population. Uniform counting is valid only when the
probability model says each counted outcome has the same mass, or when you weight
outcomes separately.

## Continue, go deeper, apply it

- Continue: Conditional probability
- Go deeper: Mathematics Foundations assignments
- Apply it: Problem framing and baselines
