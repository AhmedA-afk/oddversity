---
title: "Constrained optimisation, Lagrange multipliers, and KKT intuition"
track: "maths-foundations"
status: live
summary: "Constrained optimisation searches only feasible points."
duration: "3 min read"
---

## The short answer

Constrained optimisation searches only feasible points. For an equality `g(x)=0`, a regular optimum satisfies `∇f=λ∇g`: objective and constraint normals align, so no feasible tangent move improves the objective. KKT conditions extend this intuition to inequalities by adding nonnegative multipliers and complementary slackness. Constraints express feasibility; they do not automatically make an objective safe or fair.

## Why this matters

ML objectives often include norm budgets, positivity, resource limits, or policy constraints. An unconstrained gradient step can leave the allowed set. Lagrange and KKT conditions explain whether a boundary is active and what certificate to inspect.

## How it works

For `min f(x)` subject to `g(x)=0`, form `𝓛(x,λ)=f(x)+λg(x)`. Stationarity is `∇ₓ𝓛=0`; feasibility is `g(x)=0`. For inequalities written `h(x)≤0`, KKT adds `μ≥0`, stationarity, feasibility, and complementary slackness `μh(x)=0`: an inactive constraint has zero multiplier, while an active one may push back.

## Worked examples and variations

### Example A: closest point on a line

**Input:** minimise `f(x,y)=x²+y²` subject to `x+y=1`. **Mechanism:** `∇f=(2x,2y)`, `∇g=(1,1)`, so stationarity gives `x=y`; feasibility gives `x=y=1/2`. **Output:** closest point `(1/2,1/2)`, objective `1/2`. **Inspect:** objective gradient is normal to the line. **Decision:** verify both stationarity and feasibility.

### Example B: active inequality

**Input:** minimise `(x−3)²` subject to `x≤1`, written `h=x−1≤0`. **Mechanism:** unconstrained optimum 3 is infeasible; constrained optimum is boundary x=1 with a nonnegative multiplier balancing the gradient. **Output:** feasible boundary solution. **Inspect:** `h=0` and multiplier may be positive. **Decision:** distinguish active constraints from an interior optimum.

### Boundary case: inactive constraint

**Input:** minimise `(x−0.2)²` subject to `x≤1`. **Mechanism:** optimum x=0.2 already satisfies `h<0`; complementary slackness sets multiplier to zero. **Output:** the constraint does not alter the solution. **Inspect:** do not force a nonzero multiplier just because a constraint exists. **Decision:** report activity status.

### Counterexample: penalty is not exact feasibility

**Input:** minimise `f(x)=(x−3)²+ρ·max(0,x−1)²` with finite ρ. **Mechanism:** the soft penalty discourages violation but can leave `x>1`. **Output:** a low penalised objective need not satisfy the hard constraint. **Inspect:** measure the raw constraint residual separately. **Decision:** use a true constrained solver or a sufficiently justified penalty scheme.

## Two ways to see it

### Builder view

Log objective, constraint values, active set, multipliers, stationarity residual, and feasibility residual. Never report only the penalised loss.

### Systems or adversary view

Constraints can encode safety or policy but may be incomplete, gamed, or infeasible. A solver can satisfy a formal constraint while violating the real-world intent if the proxy is wrong.

## Hands-on

Solve the line and inequality examples numerically, then compare a projected or constrained update with a soft-penalty update.

**Failure state:** accept an infeasible unconstrained optimum and declare a penalty solution valid without checking residuals. **Test:** assert feasibility tolerance, stationarity residual, and active-set status. **Reset:** restore the constraint or reload the last feasible point before continuing.

## Checkpoint

- [ ] Solve the closest-point equality problem by stationarity and feasibility.
- [ ] Explain complementary slackness in words.
- [ ] Distinguish an active and inactive inequality.
- [ ] Explain why a soft penalty does not automatically enforce a hard constraint.

## What this does not solve

KKT conditions may be necessary rather than sufficient without suitable constraint qualifications and objective structure. They also cannot repair an incomplete or ethically inadequate constraint specification.

## Continue, go deeper, apply it

- Continue: Regularisation and bias–variance
- Go deeper: Non-smooth optimisation and subgradients
- Apply it: Risk before model
