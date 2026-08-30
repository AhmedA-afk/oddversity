---
title: "Problem Set 10: Comprehensive Classical ML Qualifying Exam"
track: "machine-learning"
order: 830
status: live
summary: "A cumulative, decision-focused examination across theory, practice, evaluation, and production ML."
duration: "180–240 min"
updated: "2026-08-30"
---

## Exam brief

You are building a model to prioritize follow-up for 50,000 customers each month. Capacity allows 2,000 contacts. The training table contains customer-month rows, a binary target `churn_next_30_days`, behavior features available at month end, and an account-manager note entered up to 14 days after month end.

## Questions

1. Identify the prediction time, label window, action, unit of analysis, and two plausible success metrics. State one non-ML baseline.
2. Is the account-manager note safe as described? Explain with a timeline and propose a point-in-time data contract.
3. Prevalence is 4%. At a threshold, validation TP=600, FP=1,400, FN=1,400, TN=46,600. Compute precision, recall, and number of contacts. Is this threshold capacity-feasible?
4. Write the logistic negative log-likelihood for one observation and derive its gradient contribution with respect to (\beta).
5. You compare a regularized logistic regression and gradient-boosted tree. Give a split/tuning/evaluation design that respects repeated customers and time. Include how model choice is made.
6. The tree has higher AUC, but logistic regression has better calibration near the top 2,000. Which model should you prefer? Give a conditional answer using decision value and explain what extra evidence is required.
7. A feature’s permutation importance is large, but it measures whether a customer logged into an account-management page. List three reasons this is not proof that increasing logins reduces churn.
8. An A/B test offers outreach to the top-ranked 2,000 customers. Define treatment/control, primary outcome, at least two guardrails, and one interference risk.
9. After deployment, mean predicted risk rises from .07 to .13 while contact uptake falls. Give a prioritized incident response: three checks before retraining, an action safeguard, and an owner/artifact to record.
10. A subgroup has lower recall but also substantially fewer observed churn labels because cancellations are logged differently. Explain why threshold change alone is inadequate and outline the audit.

---

## Fully worked solutions

1. Prediction time is month end; label window is the next 30 days; action is outreach prioritization; unit is a customer-month. Metrics could be realized prevented churn/net value per contact and recall/precision@2,000, with retention cost and consent as constraints. A baseline can contact the 2,000 highest-risk customers under an existing business rule or a transparent recency rule.
2. It is unsafe if written after the cutoff because it may contain signals from events in the label window or the action itself. Contract: record event timestamp, ingestion timestamp, availability SLA, and use only note content demonstrably available no later than the specified decision timestamp; audit late arrivals and versions.
3. Precision (=600/2000=.30); recall (=600/2000=.30); contacts (=TP+FP=2000), exactly capacity-feasible. It reaches only 30% of known churn events, and whether 30% precision is worthwhile needs an intervention-value calculation.
4. For score (s=x^T\beta), (\ell=-[y\log\sigma(s)+(1-y)\log(1-\sigma(s))]). Its gradient is ((\sigma(s)-y)x). Averaging sums those terms and divides by (n).
5. Use chronological outer evaluation blocks with customer-group isolation; within each outer training period, tune preprocessing and hyperparameters in earlier rolling folds. Select according to a predeclared capacity-aware metric plus calibration/guardrails, then report one locked later-period test assessment with uncertainty and slice analysis.
6. Prefer the model with higher expected decision value at the 2,000-contact operating point, subject to calibration, fairness, stability, and operational constraints—not automatically higher AUC. Estimate uplift/benefit from a valid intervention experiment, compare precision/recall/value curves at capacity, and inspect calibration and errors by relevant groups/time.
7. It may be a proxy for an unobserved problem, be caused by impending churn, be affected by prior outreach, or be correlated with other features. Permutation importance is predictive sensitivity under a particular data distribution, not a causal intervention estimate.
8. Randomize eligible top-ranked customers to outreach versus standard treatment, preserving a holdout sufficient for inference. Primary outcome: predeclared retained-customer value after a fixed window. Guardrails: complaint/opt-out rate, fairness/error impacts, contact-cost or service load. Interference: contacted customers may influence peers or account managers may alter treatment for controls.
9. First validate data freshness/schema/missingness and score pipeline versions; then inspect distribution shift and calibration/decision outcomes by time/slice; then examine outreach operational changes and delayed labels. Rate-limit or revert automated contact prioritization if harm/capacity guardrails trip. Record an incident ticket with owner, timestamps, model/data versions, decision, and recovery evidence.
10. Lower recall may reflect outcome-measurement bias rather than model behaviour. Audit label-generation process, missingness, denominator definition, feature availability, counts and uncertainty, and compare using a consistent adjudicated sample where possible. Engage domain/legal stakeholders before changing thresholds; document benefit/harm and appeal/recourse implications.

## Grading rubric

20 points: framing and data validity; 20 points: calculations/derivation; 25 points: valid evaluation and model choice; 20 points: causal/experimental reasoning; 15 points: monitoring, fairness, and clear conditional judgement. Answers that state unsupported causal claims cannot receive full credit even if their arithmetic is correct.

## Common misconceptions

- Capacity feasibility is not evidence of positive intervention value.
- Feature importance does not establish what action will change outcomes.
- A fair-looking aggregate metric can coexist with label-quality disparities.

## Extension problems

Produce a two-page model launch packet: data card, point-in-time feature specification, baseline comparison, capacity-aware evaluation table, experiment design, monitoring thresholds, rollback condition, and named decision owner. Defend one modelling choice and one deliberate non-use choice.
