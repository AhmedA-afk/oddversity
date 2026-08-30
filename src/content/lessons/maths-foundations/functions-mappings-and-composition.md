---
title: "Functions, mappings, and composition"
track: "maths-foundations"
status: live
summary: "A function is a rule that assigns one output to each allowed input."
duration: "5 min read"
---

## The short answer

A function is a rule that assigns one output to each allowed input. In AI, the
rule may be preprocessing, a model, a loss, or a decision policy. Write its
domain, output space, and composition explicitly: it prevents a common mistake—
treating a plausible output as valid when the input, units, shape, or intended
meaning were never allowed by the system.

## Why this matters

`prediction = model(data)` is useful shorthand, but it hides most failure
conditions. A classifier may accept a 20-feature vector, while a production
file has 19 columns; a log transform may require a positive value; a probability
score is not automatically an approval decision. Functions make each boundary
visible before a library turns a bad assumption into a number.

For this course, use `f: X → Y` to mean “`f` accepts inputs in `X` and returns
outputs in `Y`.” A domain is not paperwork. It tells you where the rule has a
defined interpretation.

## How it works

Consider a small regression pipeline:

```text
raw spend x ∈ [0, ∞)
  └─ scale: s(x) = x / 1000
       └─ model: m(z) = 2z + 1
            └─ decision: d(y) = "review" if y > 5, else "standard"
```

The composed system is `d(m(s(x)))`. Composition means the output of one
function becomes the input to the next. It only works when the intermediate
spaces match. Here `s` returns a number in “thousands of currency units,” which
is exactly what `m` expects.

Three distinctions matter:

| Term | Question | AI example |
|---|---|---|
| Domain | Which inputs are meaningful? | non-negative transaction amount |
| Codomain | What kind of output can this rule produce? | a real-valued score |
| Range | Which outputs actually occur? | scores between 0.2 and 0.9 on a dataset |

The codomain can be broader than the observed range. A sigmoid model has
codomain `(0, 1)`, even when its observed scores happen to lie between 0.3 and
0.8.

## Worked examples and variations

### Example A: a valid scalar feature

**Input:** `x = 3000` currency units. **Mechanism:** `s(3000)=3`, then
`m(3)=7`. **Output:** score `7`; `d(7)` returns `review`. **Inspect:** both
intermediate values have a stated unit. **Decision:** the pipeline is valid for
this input.

### Example B: the same rule, a different unit

**Input:** `x = 3` but the upstream service now sends thousands of currency
units. **Mechanism:** applying `s` again gives `0.003`, then `m` gives `1.006`.
**Output:** `standard`. **Inspect:** code ran, but the unit contract changed.
**Decision:** attach units to the interface or make scaling a named data
contract; a function can be syntactically defined and semantically wrong.

### Example C: vector-to-vector embedding map

Let `e: text → R³` map a product description to three numbers. The domain is
text in the supported language/format; the codomain is all triples of real
numbers. A second function `r: R³ → {A, B, C}` assigns a route. **Inspect:**
`r(e(text))` is valid only if `e` always returns exactly three coordinates.
**Decision:** validate embedding dimension before indexing or routing.

### Boundary case: a logarithm at zero

For `g(x)=log(x)`, the real-number domain is `x>0`. `g(0)` is not a very
negative finite number; it is undefined. Replacing zero with a small constant
can be sensible, but it creates a new function `gε(x)=log(max(x, ε))` with a
new bias near zero. **Decision:** document that transformation rather than
pretending the original function accepted zeros.

### Counterexample: output type is not decision authority

`p: applicant → [0,1]` may return an estimated probability. It does not itself
mean “approve when `p>0.5`.” The decision function also needs costs, policy,
review rules, and perhaps missing facts. **Inspect:** separate `p` from
`approve(p, policy, evidence)`. **Decision:** never hide a consequential policy
threshold inside a model function.

## Two ways to see it

### Builder view

Write each boundary as a typed function: input schema, shape, units, allowed
values, output schema, and error state. Then test composition at each boundary.
This is the mathematical version of a reliable API contract.

### Systems view

Every composition imports the assumptions of every earlier stage. A model can
have correct weights and still fail because preprocessing changed, a unit was
wrong, or an unsupported input passed through. Monitoring only the final score
cannot reveal every boundary failure.

## Hands-on

Create a one-page “function ledger” for a small AI workflow—recommendation,
spam triage, or text classification. List at least four functions in order.

| Function | Domain and units/shape | Codomain | Invalid input | Test |
|---|---|---|---|---|
| `clean` | raw record | validated feature row | missing field | reject fixture |
| `model` | feature row | score | wrong dimension | shape assertion |
| `decide` | score + policy | action/review | missing policy | explicit fallback |

**Failure state:** deliberately feed the model a vector with one missing feature
or a value in the wrong unit. **Test:** the workflow must stop at the named
boundary rather than emit a confident-looking action. **Reset:** restore the
valid fixture and verify the expected output.

## Checkpoint

- [ ] For `f(x)=3x−2`, state a sensible domain, codomain, and range over
  `x∈{0,1,2}`.
- [ ] Compose `h(x)=sqrt(x)` and `k(y)=y+1`, then state why `k(h(x))` and
  `h(k(x))` do not have the same domain.
- [ ] Draw a four-step model pipeline and label the input/output shape or unit
  at every arrow.
- [ ] Explain why a probability prediction and an approval decision are two
  different functions.

## What this does not solve

A clear function contract does not prove that a model is accurate, fair, causal,
or safe. It only makes the rule and its valid inputs inspectable. Evaluation,
data quality, and decision policy remain separate work.

## Continue, go deeper, apply it

- Continue: Algebra for model equations
- Go deeper: Mathematics Foundations checklist
- Apply it: Problem framing and baselines
