---
title: "Qualifying problem set: proof, computation, and statistical judgement"
track: "machine-learning"
order: 831
status: live
summary: "A multi-part qualifying assessment spanning conditioning, optimization, generalisation, inference, and algorithmic trade-offs."
duration: "8–12 hours"
updated: "2026-08-30"
---

This is a qualifying-style assessment, not a vocabulary check. For every claim, state
the assumptions that make it true; for every numerical answer, show the arithmetic or
code that produced it; and for every recommendation, name the decision it changes.
You may use NumPy, but not a fitted estimator for Questions 1–4.

## Rules and submission

Submit one short technical report, one reproducible notebook or Python module, a
requirements file, and a seed log. A result without a valid time/split protocol
receives no credit for model comparison. Round only at presentation time. The total is
100 marks; 55 is the minimum qualifying mark, and at least 40% is required in each of
the mathematical and empirical sections.

## Question 1 — conditioning, identifiability, and ridge (16 marks)

Let

$$
X = \begin{bmatrix}
1&1\\
1&1.001\\
1&0.999\\
1&1.002
\end{bmatrix}, \qquad
y = \begin{bmatrix}2\\2.01\\1.99\\2.02\end{bmatrix}.
$$

1. Compute $X^\top X$, its determinant, and its eigenvalues to a sensible precision.
   What does the small eigenvalue say geometrically?
2. Derive the normal equations and explain why invertibility is an *identifiability*
   condition for this parameterisation, not proof that estimated coefficients are
   useful.
3. Derive the ridge solution
   $\hat\beta_\lambda=(X^\top X+\lambda I)^{-1}X^\top y$ from a penalised
   objective. Do not penalise the intercept in the implementation; explain how
   centering provides the equivalent convention.
4. Fit OLS and ridge over ten log-spaced values of $\lambda$. Plot coefficient norm,
   residual norm, and held-out error for a fixed, declared split. Which value would
   you operationally choose and what uncertainty remains?

**Worked checkpoint.** A nearly zero determinant does not mean that a package has
“failed”; it means small perturbations in $y$ can cause large moves in the coefficient
direction associated with the narrow eigenvector. A correct answer distinguishes
prediction stability from coefficient stability.

## Question 2 — convergence is conditional (14 marks)

For $f(w)=\frac12 w^\top A w-b^\top w$, where $A$ is symmetric positive definite:

1. Derive $\nabla f(w)$ and the gradient-descent error recurrence
   $e_{t+1}=(I-\eta A)e_t$.
2. Prove that fixed-step gradient descent converges whenever
   $0<\eta<2/\lambda_{\max}(A)$ by diagonalising $A$. State why the strict
   inequality matters.
3. Let the eigenvalues be $1$ and $100$. Compare the contraction factors for
   $\eta=0.01$, $0.019$, and $0.03$. Give a two-dimensional numerical example that
   exhibits slow zig-zagging and one that diverges.
4. Explain, with an equation, why standardising features can improve the conditioning
   of a least-squares Hessian but cannot rescue a leakage-contaminated evaluation.

**Debugging trap.** A monotonically decreasing training loss is not a convergence
certificate if the objective was coded with an inconsistent average/sum convention or
if the reported metric is measured on the training set.

## Question 3 — bias, variance, and selection bias (14 marks)

Assume $Y=f(X)+\varepsilon$, where $E[\varepsilon\mid X]=0$ and
$\mathrm{Var}(\varepsilon\mid X)=\sigma^2$.

1. Derive the pointwise squared-error decomposition into irreducible noise, squared
   bias, and variance. Identify exactly where independence assumptions are used.
2. Simulate 200 training sets from a one-dimensional nonlinear function. Compare a
   constant predictor, a linear model, a degree-12 polynomial, and ridge-regularised
   polynomial regression. Estimate each decomposition term on a large fixed test grid.
3. You tried 40 pipelines and report the lowest validation loss. Explain why that
   number is optimistically biased even if every individual validation estimate is
   unbiased. Design a nested-validation or locked-test remedy.
4. Give one example where accepting higher prediction bias reduces harmful operational
   variance: name the decision, the instability, and the cost.

## Question 4 — constrained classification decisions (14 marks)

A triage model produces calibrated probabilities for 10,000 cases. Investigating a
case costs $20$, a missed positive costs $1,000$, and capacity is 300 investigations.

1. Derive the expected cost of acting versus not acting for a case with probability
   $p$. Find the unconstrained threshold.
2. Under the capacity constraint, show that selecting the 300 highest *valid*
   risk scores is optimal only when investigation cost and benefit are homogeneous.
3. Construct a two-group counterexample in which one global threshold produces
   materially different false-negative burdens. Describe what must be measured before
   changing thresholds; do not assume demographic parity is automatically correct.
4. Produce a calibration curve, precision-recall curve, capacity curve, and
   threshold table. State which split each comes from and why AUROC alone cannot
   defend the policy.

## Question 5 — inference after modelling (14 marks)

You compare a baseline and a boosted tree on the same 12 chronological folds.

1. Why is an iid two-sample t test on the 12 fold scores generally indefensible?
   Discuss shared observations, hyperparameter selection, and temporal dependence.
2. Implement a paired block bootstrap for the difference in a declared metric. Report
   a percentile interval and a decision-relevant probability such as
   $P(\Delta > 0.01)$; clearly label it as a bootstrap estimate, not a posterior.
3. Run a permutation test appropriate to your declared exchangeability assumption.
   What observable data process would make the permutation invalid?
4. Suppose you compared 25 models. Explain familywise error and false-discovery rate,
   then propose a transparent reporting rule that does not hide the explored space.

## Question 6 — algorithms and resources (12 marks)

For $n$ rows, $d$ features, $T$ trees, $k$ neighbours, and $r$ retained principal
components:

1. Give training and prediction-time complexity, plus dominant memory use, for exact
   k-nearest neighbours, a depth-$h$ decision tree, random forest, full SVD, truncated
   SVD, and one EM iteration for a $K$-component diagonal Gaussian mixture.
2. Name one regime where asymptotic complexity misleads because of sparsity, cache
   behaviour, data transfer, or approximate indexing.
3. A recommender must serve in 30 ms and retrain nightly. Compare a nearest-neighbour
   baseline, matrix factorisation, and a two-stage retrieval/ranking architecture.
   Include cold start and feedback-loop risks—not only latency.

## Question 7 — causal claim audit (8 marks)

A retailer claims: “customers who received a coupon spent $12 more, so coupons caused
the increase.” Draw a DAG containing prior spending, predicted churn, coupon receipt,
and future spend. State one backdoor set, explain why conditioning on a post-treatment
click can create bias, and propose a randomized or quasi-experimental design. Give a
sensitivity analysis you would show before making a budget decision.

## Question 8 — oral defense (8 marks)

Defend one result from this set in six minutes. The examiner may ask: What did you
know at decision time? What breaks if prevalence shifts? Which assumption is most
fragile? Why does your interval not justify a causal claim? What artifact permits
another person to reproduce your figure?

## Marking rubric and solution guide

| Criterion | Marks | Evidence required |
| --- | ---: | --- |
| Derivation and assumptions | 30 | Correct algebra, stated domains, and a counterexample or limitation |
| Numerical work | 20 | Deterministic code, units, sanity checks, and interpretable plots |
| Statistical judgement | 20 | Valid split/interval/test plus limits on what it supports |
| Decision reasoning | 15 | Costs, capacity, harms, and an action contingent on evidence |
| Reproducibility and communication | 15 | Runnable command, fixed seeds, artifacts, and concise defense |

**Solution guide.** Full credit in Question 1 recognises that ridge changes the
estimand while stabilising an ill-conditioned direction. In Question 2, diagonalising
$A=Q\Lambda Q^\top$ gives
$e_t=Q(I-\eta\Lambda)^tQ^\top e_0$; convergence requires every
$|1-\eta\lambda_i|<1$. In Question 3, a selected minimum validation score cannot
retain its nominal unbiasedness after selection. In Question 4, calibrated
probabilities and explicit utilities are prerequisites for a defensible intervention
threshold. In Questions 5–7, credit goes to a design that matches its claim boundary:
resampling does not manufacture independence, and observational prediction does not
establish treatment effect.

Before submitting, ask: could a reviewer rerun this from a clean environment; have I
separated a measured result from an interpretation; and have I written down the action
I would take if the result reverses next month?
