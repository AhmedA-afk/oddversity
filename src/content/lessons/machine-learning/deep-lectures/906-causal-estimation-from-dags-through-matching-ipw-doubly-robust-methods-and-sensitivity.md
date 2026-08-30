---
title: "Deep lecture: Causal estimation—from DAGs through matching, IPW, doubly robust methods, and sensitivity"
track: "machine-learning"
order: 906
status: live
summary: "Use causal assumptions, diagnostics, and sensitivity analysis to estimate interventions rather than mistake predictive associations for effects."
duration: "120 min lecture + 5 hr lab"
updated: "2026-08-30"
---

# Causal estimation: modelling the consequence of an action

Predictive ML estimates patterns in observed labels. Causal estimation asks a different question: what would change if we intervened? A retention model can predict who will leave; it cannot by itself tell us whom to discount. High-risk customers may be those least responsive to an offer, and historical offers may have targeted exactly those people. Causal work starts by defining an intervention, population, outcome horizon, and counterfactual estimand before choosing an algorithm.

For each unit `i`, let `Y_i(1)` be its outcome if treated and `Y_i(0)` if untreated. Only one is observed: `Y_i= A_iY_i(1)+(1-A_i)Y_i(0)`, where `A` is treatment. Individual treatment effects `Y_i(1)-Y_i(0)` are generally unobserved. Common estimands are average treatment effect `ATE=E[Y(1)-Y(0)]`, average treatment effect on treated `ATT=E[Y(1)-Y(0)|A=1]`, and a conditional effect `CATE(x)=E[Y(1)-Y(0)|X=x]`. Do not claim a CATE when the data only support an average effect.

## DAGs force assumptions into view

A directed acyclic graph (DAG) encodes hypothesised data-generating relationships. A confounder `X` causes both treatment `A` and outcome `Y`; conditioning on a sufficient set of pre-treatment confounders can close the backdoor path `A <- X -> Y`. A mediator `M` lies on `A -> M -> Y`; adjusting for it removes part of the total effect. A collider `C` has arrows `A -> C <- Y`; conditioning on it opens a spurious association. The diagram is not proof, but it exposes assumptions that a regression formula can hide.

Identification through observed covariates typically needs: (1) consistency—observed outcome equals the relevant potential outcome; (2) exchangeability—`(Y(1),Y(0)) independent of A | X`; and (3) positivity—each relevant `X` has nonzero chance of both treatments. No statistical test proves unmeasured exchangeability. Positivity failures are visible as treatment propensities near zero or one and demand a change of target population, intervention, or data collection.

### Worked example 1: confounding reverses a crude comparison

Suppose a support call is given to 80 high-risk customers and 20 low-risk customers. In high-risk customers, renewal is 40% with calls and 20% without; in low-risk customers, it is 90% with calls and 80% without. If calls are disproportionately sent to high-risk people, an unstratified treated group could renew 50% while untreated renew 70%, suggesting calls harm renewal. Within each risk stratum, calls improve renewal by 20 and 10 percentage points. The crude contrast mixes intervention effect with baseline risk; stratification on the pre-treatment risk variable changes the question back toward a causal comparison.

### Worked example 2: matching and a common-support failure

Five treated units have propensity scores `.15,.20,.40,.82,.95`; controls have `.12,.18,.38,.42,.45`. Nearest-neighbour matching can reasonably compare the first three treated units to nearby controls. The `.82` and `.95` treated units have no comparable controls. Forcing a match at `.45 extrapolates across a large unobserved region and creates model-driven rather than data-supported estimates. Trim treated units outside control support, report the changed target population, and ask why the policy was nearly deterministic there.

### Worked example 3: inverse-probability weighting by hand

For four units, `(A,Y,e(X))` are `(1,1,.8),(1,0,.4),(0,1,.3),(0,0,.6)`. A simple IPW mean for treated potential outcome uses `sum A_iY_i/e_i / n = (1/.8)/4=.3125`; the untreated potential-outcome mean uses `sum(1-A_i)Y_i/(1-e_i)/n = (1/.7)/4=.3571`, giving estimated ATE `-.0446`. The small sample makes this unstable, but it demonstrates that rare treatment assignments receive larger weights. Stabilised/normalised estimators are often preferable; an `.01` propensity would create a weight near 100 and warn of a positivity problem.

### Worked example 4: doubly robust intuition

Let `m_a(x)=E[Y|A=a,X=x]` and `e(x)=P(A=1|X=x)`. An augmented IPW score is

```text
m_1(X)-m_0(X) + A/e(X) [Y-m_1(X)]
             - (1-A)/(1-e(X)) [Y-m_0(X)].
```

If the outcome model is correct, residual corrections average to zero even if the propensity model is wrong; if the propensity model is correct, weighting corrects an imperfect outcome model. “Doubly robust” does not mean robust to both models being wrong, unmeasured confounding, poor overlap, or adaptive treatment assignment. Cross-fitting—training nuisance models on other folds before scoring a fold—reduces overfitting bias when flexible ML estimates `m` and `e`.

## Matching, weighting, and outcome modelling

Matching aims to construct comparable treated/control sets. Check balance *after matching* with standardised mean differences, not just the classifier’s propensity AUC. An extremely accurate propensity model may signal little overlap. IPW reweights toward a target population but is sensitive to extreme propensities. Outcome regression predicts potential outcomes from covariates. Doubly robust estimators combine both. The selection is not a tournament; choose based on overlap, estimand, sample size, treatment mechanism, and ability to diagnose assumptions.

For continuous treatments, interventions and positivity require density modelling; for time-varying treatments, time-dependent confounding can require marginal structural models, g-methods, or target-trial emulation. Censoring and missing outcomes have their own causal mechanisms. A black-box uplift model does not remove these requirements; it can amplify them by producing granular effect claims where data are thin.

```text
cross_fit_dr(data, folds):
    scores <- []
    for held_out in folds:
        train <- data excluding held_out
        e_hat <- fit_propensity(train.X, train.A)
        m1_hat, m0_hat <- fit_outcome_models(train.X, train.A, train.Y)
        for row in held_out:
            e <- clip(e_hat(row.X), .02, .98)  # clip only with a reported rationale
            score <- m1_hat(row.X) - m0_hat(row.X) \
                   + row.A/e * (row.Y-m1_hat(row.X)) \
                   - (1-row.A)/(1-e) * (row.Y-m0_hat(row.X))
            scores.append(score)
    return mean(scores), bootstrap_interval(scores)
```

Clipping changes the estimand by limiting influence from low-overlap regions. Report how many observations were clipped, compare several bounds, and prefer restricting to a support region when the original question cannot be identified credibly.

## Sensitivity analysis is not optional fine print

Because unmeasured confounding cannot be ruled out from observed data, quantify how strong it would need to be to overturn a conclusion. One approach posits a binary unmeasured confounder with specified effects on treatment and outcome, then recomputes a bias-adjusted estimate over plausible ranges. Rosenbaum-style sensitivity analyses bound hidden bias in matched studies. Negative-control outcomes or exposures can reveal some confounding patterns if they are chosen before analysis. None proves absence of bias; the purpose is to replace “we controlled for everything important” with a transparent robustness statement.

### Worked example 5: a simple sensitivity statement

An estimated offer effect is +3 percentage points (95% interval +1 to +5). A domain review concludes an unrecorded account-manager judgement could make high-intent customers twice as likely to receive the offer and independently raise renewal by 4 points. Simulating that confounder may shrink the effect toward zero. The responsible conclusion is not “the offer works”; it is “under measured confounding assumptions, evidence supports a small positive effect; a plausible unmeasured process could change the decision, so run a randomised pilot.”

## Real-world decision context: outreach allocation

A public-benefit organisation wants to prioritise reminder calls. Treating people who are most likely to miss an appointment is not equivalent to treating people for whom a call most increases attendance. The target must exclude protected variables only after thinking through whether they are confounders, mediators of access barriers, or fairness-relevant outcomes. A low predicted benefit should never deny a legally entitled service. Use causal estimates to design assistance, conduct a pilot where possible, and co-design metrics with frontline staff rather than optimising historical administrative labels alone.

## Debugging workshop: how causal analyses go wrong

1. **Post-treatment control.** Adjusting for “opened email” after email assignment blocks a mechanism and can introduce collider bias. Draw time arrows before constructing features.
2. **Propensity score as a magic scalar.** Good propensity classification does not establish balance. Inspect covariate balance and overlap after weighting/matching.
3. **Extreme weights hidden by averages.** One unit with weight 300 can dominate an ATE. Plot weight distributions; investigate design and sensitivity to trimming.
4. **Outcome leakage.** A model predicting treatment from variables recorded after assignment invalidates the adjustment set. Enforce timestamps.

## Code exercise: target-trial emulator with diagnostics

Given observational data with treatment, outcome, timestamps, and covariates, write code to: declare eligibility and time zero; exclude post-treatment variables; estimate propensity scores with cross-fitting; construct normalised IPW and a doubly robust ATE; calculate pre/post-weighting standardised mean differences; plot propensity and weight distributions; and bootstrap a confidence interval. Add tests that fail if treatment occurs before eligibility, a post-treatment feature is included, or any group has no support. Repeat after trimming and describe the new target population.

## Assignment: intervention evidence dossier

**Part A — causal question and DAG (15 points).** Define intervention versions, time zero, eligibility, potential outcomes, target estimand, and a DAG. Label confounders, mediators, colliders, and variables deliberately excluded.

**Part B — identification reasoning (20 points).** State consistency, exchangeability, positivity, and censoring assumptions in the domain’s language. Demonstrate overlap and balance with calculations, not only prose.

**Part C — estimation (25 points).** Implement and compare outcome regression, matching or IPW, and cross-fitted doubly robust estimation. Show a hand calculation of IPW and the DR score for supplied rows.

**Part D — robustness (20 points).** Conduct sensitivity to trimming, model choices, and a specified unmeasured-confounding scenario. Explain which conclusion changes and why.

**Part E — decision and ethics (20 points).** Recommend experiment, limited deployment, or no action. Define protected use boundaries, monitoring, human review, and how affected people can contest an adverse decision.

| Rubric criterion | Full-credit evidence |
| --- | --- |
| Causal clarity | Estimand, time zero, intervention, and DAG make a testable causal claim. |
| Assumption discipline | Adjustment avoids post-treatment/collider bias and reports overlap limitations. |
| Estimation quality | Methods are correctly implemented with balance, weights, and uncertainty diagnostics. |
| Robustness | Sensitivity analyses change assumptions quantitatively rather than offering generic caveats. |
| Responsible use | Recommendation respects rights, uncertainty, and the distinction between help and denial. |

Causal ML is valuable because it makes action conditional on assumptions that can be challenged. When the assumptions are too weak, the correct technical result is often a better experiment—not a more elaborate estimator.
