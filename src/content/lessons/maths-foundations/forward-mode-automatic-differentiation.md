---
title: "Forward-mode automatic differentiation"
track: "maths-foundations"
status: live
summary: "Forward-mode autodiff propagates a value and a tangent together through each operation."
duration: "3 min read"
---

## The short answer

Forward-mode autodiff propagates a value and a tangent together through each operation. For input direction `v`, it computes the Jacobian–vector product `Jv` in one graph pass. It is economical when there are few input directions or many outputs, and it avoids symbolic expansion while remaining exact up to floating-point arithmetic.

## Why this matters

Forward mode is a small, understandable implementation of autodiff. It is useful for sensitivity along a chosen input direction, Jacobian columns, and models with small input dimension but many outputs.

## How it works

Represent a variable as a dual pair `(x, ẋ)`, where `ẋ` is the derivative along a chosen direction. Arithmetic follows:

```text
(a,ȧ)+(b,ḃ)=(a+b,ȧ+ḃ)
(a,ȧ)(b,ḃ)=(ab,ȧb+aḃ)
```

For `sin(a,ȧ)`, the tangent is `(cos a)ȧ`. Starting with `ẋ=v` propagates `Jv`.

## Worked examples and variations

### Example A: scalar composition

**Input:** `f(x)=(x+1)²`, pair `(x,ẋ)=(2,1)`. **Mechanism:** `u=(3,1)`, then `u²=(9,6)`. **Output:** value 9 and derivative 6. **Inspect:** tangent matches analytic `2(x+1)`. **Decision:** use a dual pair to test primitive rules.

### Example B: vector output

**Input:** `F(x,y)=(x+y,xy)` at `(2,3)` with direction `v=(0.1,−0.2)`. **Mechanism:** propagate one tangent pair per input; output tangent is `(−0.1,−0.1)`. **Output:** this is `Jv`, not the full Jacobian. **Inspect:** compare to the Jacobian lesson's hand calculation. **Decision:** choose directions deliberately.

### Boundary case: zero or unused tangent

**Input:** `F(x,y)=x²` with `v=(0,1)`. **Mechanism:** all propagated y tangents are zero because y is unused. **Output:** `Jv=0`. **Inspect:** a zero result can mean direction or connectivity, not a broken engine. **Decision:** test a basis direction too.

### Counterexample: mixing tangent and value

**Input:** product pairs `(a,ȧ)=(2,3)` and `(b,ḃ)=(5,7)`. **Mechanism:** correct tangent is `3·5+2·7=29`; multiplying tangents gives 21. **Output:** value 10, derivative 29. **Inspect:** product rule is required. **Decision:** unit-test every primitive's pair rule.

## Two ways to see it

### Builder view

Implement a tiny `Dual(value, tangent)` type and a direction parameter. Assert values match ordinary evaluation and tangents match hand derivatives on small graphs.

### Systems or numerical view

One forward pass gives one tangent direction. Many input directions may require many passes, while memory use is often lower than reverse mode. The best mode follows the input/output shape and requested derivative product.

## Hands-on

Create dual-number primitives for addition, multiplication, `exp`, and `sin`; compute a Jacobian column by seeding one basis direction at a time.

**Failure state:** implement product tangent as `ȧḃ` and seed a direction with the wrong length. **Test:** product and shape fixtures must fail with explicit messages. **Reset:** restore the product rule and a correctly sized direction.

## Checkpoint

- [ ] Define a dual pair and its product rule.
- [ ] Compute the value and tangent of `(x+1)²` at `(2,1)`.
- [ ] Explain what `Jv` contains and what it omits.
- [ ] Choose when forward mode is economical.

## What this does not solve

Forward mode does not produce every derivative in one pass and does not remove floating-point or non-smoothness issues. It computes the derivative of the graph you provide.

## Continue, go deeper, apply it

- Continue: Reverse-mode autodiff and backpropagation
- Go deeper: Jacobians for vector-valued functions
- Apply it: Gradient checking and debugging
