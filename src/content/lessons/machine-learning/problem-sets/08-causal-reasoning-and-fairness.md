---
title: "Problem Set 8: Causal Reasoning and Fairness"
track: "machine-learning"
order: 828
status: live
summary: "Distinguish prediction from intervention and audit competing fairness constraints."
duration: "100–130 min"
updated: "2026-08-30"
---

## Questions

1. A tutoring app is used by 70% of motivated students and 30% of others. Users score 8 points higher on average. Why is this not an estimate of the effect of app use? Name a confounder and a valid design.
2. In a randomized experiment, treated mean outcome is 74 and control mean is 70. Compute the intention-to-treat estimate. What does it not identify if 20% of treated people never use the intervention?
3. Group A confusion matrix is TP=80, FP=20, FN=20, TN=80; group B is TP=45, FP=5, FN=5, TN=45. Compute TPR and FPR for both. Which equalized-odds component fails?
4. Using question 3, compute positive predictive value (PPV) for each group. Can threshold adjustment generally make equalized odds and predictive parity both hold when base rates differ? Explain.
5. Give a DAG description (nodes and arrows in words) in which a post-treatment variable becomes an invalid control when estimating treatment effect.
6. A hiring model excludes gender but uses college, location, and career gaps. Why does exclusion not establish fairness? State two tests and one governance measure.
7. Debug a fairness report that averages false-negative rate across all applicants and never reports uncertainty for a subgroup of 27 people. Identify two failures.
8. A pricing model raises prices for people predicted less likely to leave. Is this discrimination, causal identification, both, or neither by itself? Formulate the missing questions required for a responsible answer.

---

## Fully worked solutions

1. Motivation affects both adoption and scores, so selection confounds the comparison. Randomize access/encouragement where ethical, or use a defensible quasi-experimental design with explicit assumptions; regression alone cannot guarantee removal of unmeasured motivation.
2. ITT is (74-70=4) points. With noncompliance it estimates assignment’s effect, not necessarily the effect of receiving/using tutoring; an instrumental-variable estimand needs additional assumptions such as exclusion and monotonicity.
3. A: TPR (=80/100=.8), FPR (=20/100=.2). B: TPR (=45/50=.9), FPR (=5/50=.1). Both TPR equality and FPR equality fail.
4. A PPV (=80/100=.8); B PPV (=45/50=.9). With unequal base rates and imperfect prediction, standard incompatibility results mean equalized odds and predictive parity cannot generally both be satisfied. Check definitions and decision context rather than searching for a universally fair scalar.
5. Example: treatment (T\rightarrow\) therapy attendance (M\rightarrow Y), with baseline severity (S\rightarrow M,Y). If estimating total effect of assigning (T), controlling for attendance (M) blocks part of the causal pathway and can introduce bias through (S\).
6. Proxies can reproduce structural inequity and model performance may differ by group. Test outcome/error/calibration metrics by relevant groups and intersectional slices; test feature/proxy influence and data quality. Add human review, appeal/recourse, documentation, and periodic governance review.
7. An overall average can conceal a severe subgroup disparity, and a sample of 27 has high uncertainty. Report disaggregated counts, intervals/uncertainty, decision impact, and data-quality limitations; do not overinterpret noisy estimates.
8. By itself it is neither a settled legal/moral conclusion nor a causal effect estimate. Ask whether protected groups bear disparate harm, whether differences are justified and lawful, whether price changes cause retention/revenue as assumed, what alternatives/recourse exist, and which causal estimand governs policy.

## Grading rubric

25 points: causal estimands/design; 30 points: fairness calculations and incompatibility; 25 points: DAG/proxy reasoning; 20 points: responsible audit and uncertainty.

## Common misconceptions

- Removing a protected attribute does not remove proxy pathways.
- Fairness metrics are not interchangeable moral proofs.
- A predictive association does not answer an intervention question.

## Extension problems

Write a model-card fairness section for a high-stakes classifier, including intended use, non-use, subgroup reporting, uncertainty, appeals, monitoring, and escalation ownership.
