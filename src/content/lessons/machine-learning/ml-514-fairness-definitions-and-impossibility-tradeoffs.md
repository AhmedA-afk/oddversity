---
title: "Fairness definitions and impossibility tradeoffs"
track: "machine-learning"
order: 514
status: live
summary: "Fairness is a decision and governance question informed by metrics; incompatible statistical criteria cannot be solved by choosing the most convenient dashboard."
duration: "20 min read"
updated: "2026-08-30"
---

## The short answer

Fairness metrics measure different properties: demographic parity concerns selection rates, equalized odds concerns error rates conditional on truth, predictive parity concerns outcome rates conditional on a prediction, and calibration concerns the meaning of predicted risk. When base rates differ and prediction is imperfect, several of these conditions generally cannot all hold at once. Choose objectives with affected people, legal and domain experts, and operational owners; document the tradeoff and monitor its consequences.

## Why this matters

An algorithm can distribute errors unevenly, encode historical barriers, or create new burdens through thresholds and review workflows. A metric can reveal a disparity but cannot decide whether it is justified, lawful, remediable, or outweighed by another harm. Calling a system fair because one number improved is an overclaim.

## How it works

Start with the decision, affected groups, benefit and burden pathways, data-generating process, and available remedies. Then select metrics that match the concern. Equal opportunity focuses on true-positive rates; equalized odds considers both true and false positive rates. Calibration asks whether a score of a given value means the same observed risk across groups. Thresholds, label quality, access differences, and group definitions all influence the measurements.

Use counts and uncertainty, inspect intersectional and operationally relevant groups, and review errors with stakeholders. Consider interventions beyond model constraints: improve measurement, alter eligibility rules, add human appeal, change resource allocation, or decline automation. Sensitive attributes may be necessary for auditing but require justified collection, access control, and legal review.

## Worked examples and variations

### Example 1: lending decision

Selection-rate parity may conflict with calibrated risk thresholds when outcome prevalence differs. The responsible question includes credit access, error burden, legal obligations, and the validity of repayment labels.

### Example 2: diagnostic prioritization

Equal sensitivity may be vital if missed disease causes harm, but capacity limits and false positives must be considered with clinicians and patients rather than set solely by an optimizer.

### Example 3: content enforcement

False-positive burden can differ by dialect or context. Measure both automated actions and appeal outcomes, because an equal upstream score may still yield unequal practical burden.

### Example 4: public-service allocation

Historical service usage may proxy access rather than need. A calibrated prediction of recorded use can still reinforce under-service in communities with fewer recorded interactions.

### Boundary case: small protected subgroup

Sparse data yields wide uncertainty but does not excuse non-evaluation. Use targeted research, safeguards, and transparent limits rather than a false declaration of parity.

### Counterexample: threshold tuning as a universal fix

Different thresholds can improve one rate parity while worsen calibration, perceived legitimacy, or legal risk. It is a policy change that needs governance, not a neutral technical adjustment.

## Two ways to see it

The mathematical view exposes which error-rate and calibration properties can coexist. The socio-technical view asks who bears errors, how labels were produced, and who has standing to decide acceptable tradeoffs.

## Hands-on

For a fictional eligibility system, calculate selection rate, true-positive rate, false-positive rate, precision, and calibration by group with counts and intervals. Deliberately optimize only the overall metric and observe hidden gaps, then reset by writing a decision memo that names a priority harm, a metric, a limitation, and a non-model remedy. Include an appeal and monitoring plan.

## Checkpoint

- [ ] The fairness objective is tied to a concrete benefit, burden, and decision.
- [ ] Metric tradeoffs, data limits, and uncertainty are communicated plainly.
- [ ] Affected stakeholders and governance owners participate in the decision.

## What this does not solve

No collection of fairness metrics proves justice, legality, or legitimacy. It cannot erase structural inequity or make an inappropriate automated decision appropriate.

## Continue, go deeper, apply it

Continue with the evaluation-protocol adversarial review lab. Go deeper with fairness-through-awareness, counterfactual approaches, and domain-specific regulation. Apply this by requiring an impact and appeal design before deployment.
