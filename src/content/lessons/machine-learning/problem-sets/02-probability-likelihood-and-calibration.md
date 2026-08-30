---
title: "Problem Set 2: Probability, Likelihood, and Calibration"
track: "machine-learning"
order: 822
status: live
summary: "Assess probabilistic predictions with likelihood, Bayes’ rule, proper scoring rules, and calibration."
duration: "90–120 min"
updated: "2026-08-30"
---

## Questions

1. Disease prevalence is 1%, sensitivity is 90%, and specificity is 95%. Compute (P(\text{disease}\mid\text{positive})).
2. For Bernoulli observations (y=[1,0,1,1]) with a constant probability (p), write the likelihood and log likelihood. Find the MLE.
3. A classifier predicts (p=[.9,.8,.2,.1]) for labels (y=[1,0,1,0]). Compute mean log loss and Brier score (natural logarithms).
4. Two models have equal accuracy. Model A gives correct cases 0.51 and incorrect cases 0.49; Model B gives correct cases 0.99 and incorrect cases 0.01. Which is better under log loss, and why can neither claim calibrated probabilities from this statement alone?
5. In a bin of 100 examples, average predicted probability is 0.70 and 60 labels are positive. Compute the signed calibration gap. What intervention should you test before simply changing the decision threshold?
6. Derive the posterior odds identity (\frac{P(A\mid B)}{P(\bar A\mid B)}=\frac{P(B\mid A)}{P(B\mid\bar A)}\frac{P(A)}{P(\bar A)}).
7. A model’s predictions are perfectly calibrated overall but are underconfident in group G and overconfident elsewhere. Give a concrete two-group construction with identical overall calibration and explain why aggregate calibration is inadequate.
8. Debug: a notebook clips probabilities only after calculating `np.log(p)` and gets `-inf`. Give a safe expression and explain why clipping should be logged.

---

## Fully worked solutions

1. Bayes’ rule gives (.9\cdot.01/(.9\cdot.01+.05\cdot.99)=.009/.0585\approx0.1538). A positive result is not a 90% disease probability because false positives are numerous at low prevalence.
2. (L(p)=p^3(1-p)), (\log L=3\log p+\log(1-p)). Differentiating: (3/p-1/(1-p)=0), so (p=3/4). The second derivative is negative at (3/4).
3. Log losses are (-\log(.9),-\log(.2),-\log(.2),-\log(.9)); average (\approx0.8574). Squared errors are (.01,.64,.64,.01); Brier score (=0.325).
4. B is much better under log loss: confident correctness is rewarded and confident error is strongly penalized, while A is nearly uninformative. Calibration concerns the observed frequency conditional on predicted probabilities, not merely whether a probability happened to be on the correct side of 0.5.
5. Gap (=0.60-0.70=-0.10): the bin overpredicts risk by ten percentage points. Test a held-out calibration method such as Platt scaling or isotonic regression, with group and time-slice checks. A threshold changes actions, not the stated probability.
6. Divide Bayes expressions (P(A\mid B)=P(B\mid A)P(A)/P(B)) and its complement form; (P(B)) cancels.
7. Let each group contain 100 people. G predicts 0.8 and realizes 0.6; H predicts 0.2 and realizes 0.4. Across both, mean prediction and outcome are each 0.5, so the aggregate appears calibrated, but both groups have 0.2 absolute error in opposite directions.
8. Use `p_safe = np.clip(p, 1e-15, 1-1e-15); loss = -(y*np.log(p_safe)+(1-y)*np.log1p(-p_safe))`. Log clipping counts/rates because it can hide invalid model outputs or numerical overflow.

## Grading rubric

30 points: Bayes and likelihood; 30 points: scoring and calibration calculations; 25 points: derivation and subgroup reasoning; 15 points: debugging and operational interpretation.

## Common misconceptions

- A diagnostic’s sensitivity is not its positive predictive value.
- Calibration and discrimination are different properties.
- Clipping prevents numerical failure; it does not repair a broken probability model.

## Extension problems

Derive the expected Brier score decomposition into uncertainty, resolution, and reliability for binned forecasts. Design a calibration audit that handles class imbalance, temporal shift, and small protected-group sample sizes.
