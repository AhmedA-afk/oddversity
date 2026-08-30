---
title: "Differentiation rules"
track: "maths-foundations"
status: live
summary: "Differentiation rules turn familiar combinations into reliable local sensitivities: powers use nxⁿ⁻¹, products use uv'+vu', quotients use."
duration: "3 min read"
---

## The short answer

Differentiation rules turn familiar combinations into reliable local sensitivities: powers use `nxⁿ⁻¹`, products use `uv'+vu'`, quotients use `(u'v−uv')/v²`, `exp(x)` stays itself, and `log(x)` becomes `1/x`. Use the rule only on its domain, then check the result numerically at a small fixture.

## Why this matters

Losses and model components are composed from products, ratios, powers, exponentials, and logs. A missing product term or denominator square changes the direction of learning. The rules are compressed derivations, not decoration.

## How it works

The product rule follows directly from adding and subtracting `u(x)v(x+h)`:

```text
[u(x+h)v(x+h)-u(x)v(x)]/h
= u(x+h)[v(x+h)-v(x)]/h + v(x)[u(x+h)-u(x)]/h.
```

Taking the limit gives `u v' + v u'`. The other rules follow from the same difference-quotient idea plus inverse-function relationships. Keep a domain note beside every rule: `log(x)` needs `x>0`, and a quotient needs a nonzero denominator.

## Worked examples and variations

### Example A: power and exponential

**Input:** `f(x)=3x⁴+2exp(x)`. **Mechanism:** `f'(x)=12x³+2exp(x)`. **Output:** at `x=0`, the derivative is 2. **Inspect:** the power term is flat at zero while the exponential term is active. **Decision:** evaluate term by term before combining.

### Example B: product in a gated score

**Input:** `f(x)=x·sigmoid(x)` and `s'(x)=s(x)(1−s(x))`. **Mechanism:** `f'=s+x s'`. **Output:** both the gate's value and its changing gate contribute. **Inspect:** dropping `s` or `x s'` gives different sensitivity. **Decision:** write the product rule before substituting numbers.

### Boundary case: a ratio near zero

**Input:** `q(x)=1/(x+1)` at `x=−0.99`. **Mechanism:** `q'=-1/(x+1)²=-10,000`. **Output:** a tiny input movement can cause a huge output movement. **Inspect:** the denominator is nonzero but small. **Decision:** treat this as an instability risk, not as an ordinary large feature importance.

### Counterexample: false log differentiation

**Input:** `f(x)=log(x²+1)`. **Mechanism:** chain rule gives `f'=2x/(x²+1)`. **Output:** at `x=1`, derivative is 1. **Inspect:** the tempting answer `1/(x²+1)` omits the inner derivative `2x`. **Decision:** mark every inner expression before differentiating the outer function.

## Two ways to see it

### Builder view

Annotate each expression as a tree: leaves, operators, and domains. Differentiate one node at a time, preserving shapes and units, then compare one or two values against a central finite difference.

### Systems or numerical view

Algebraically correct derivatives can still overflow (`exp(1000)`), divide by a near-zero term, or amplify noisy measurements. Stable implementations and domain guards are part of differentiation work.

## Hands-on

Implement the four rules for scalar functions and compare them with finite differences on randomly selected valid inputs.

**Failure state:** deliberately omit the second product term and use a zero denominator fixture. **Test:** assert the product case fails its relative-error threshold and the quotient case returns a named domain error. **Reset:** restore both terms and choose a nonzero denominator, then rerun.

## Checkpoint

- [ ] Derive the product rule from the difference quotient outline above.
- [ ] Differentiate `x²exp(x)` and identify the two product terms.
- [ ] State the domain conditions for a quotient and a logarithm.
- [ ] Find the missing factor in the derivative of `log(3x+1)`.

## What this does not solve

Rules do not remove the need for the chain rule, domain analysis, or numerical checks. They also do not make a non-smooth function differentiable at every point.

## Continue, go deeper, apply it

- Continue: The chain rule
- Go deeper: Derivatives of affine layers and elementwise activations
- Apply it: Logistic regression
