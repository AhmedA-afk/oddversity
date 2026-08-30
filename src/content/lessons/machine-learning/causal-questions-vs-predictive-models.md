---
title: "Do not confuse prediction with intervention"
track: "machine-learning"
status: live
summary: "Prediction asks what is likely; a causal question asks what would change if an intervention changed."
duration: "3 min read"
---

## The short answer

Prediction asks what is likely; a causal question asks what would change if an intervention changed. A feature can be highly predictive without being a useful lever, and adjusting a predictive model can make an intervention worse. State the intervention, comparison, timing, and assumptions before using ML for policy.

## The distinction

“Who is likely to churn?” is predictive. “What happens if we offer this person a
retention discount?” is causal. The second needs a credible comparison, treatment
assignment logic, confounder review, and outcome measurement.

## Four examples

### Example A: medical risk

A symptom predicts disease risk. Removing the symptom from a treatment rule does
not necessarily estimate what treatment would do; the symptom may be a marker, not
the intervention.

### Example B: marketing offer

Past recipients may have been targeted because they were already likely to buy.
Their conversion rate is not the incremental effect of the offer.

### Boundary case: treatment changes behavior

A risk score can alter who receives help, changing future labels. Re-evaluate the
policy rather than assuming a static prediction task.

### Counterexample: coefficient as effect

A regression coefficient can be interpreted causally only under strong design and
assumptions. Correlation and predictive value are not enough.

## An illustrative story

A team targeted discounts at users predicted to leave. Churn fell among recipients,
but a randomized holdout showed that most would have stayed anyway. Prediction
helped ranking; it did not measure lift.

## Two ways to see it

### Predictive view

Optimize out-of-sample accuracy for a defined target.

### Intervention view

Estimate a counterfactual outcome under a treatment and a comparison.

## Hands-on

Simulate confounding: let a hidden “urgency” variable affect both treatment and
outcome. Compare a naive model with a randomized experiment or a clearly stated
adjustment. Write which claims each design supports.

## Checkpoint

- [ ] Prediction and intervention questions are written separately.
- [ ] Treatment, comparison, timing, and outcome are explicit.
- [ ] Causal claims list assumptions or experimental design.

## What this does not solve

ML cannot turn observational correlation into causality without design, assumptions,
or domain knowledge that supports the counterfactual claim.

## Continue, go deeper, apply it

- Continue: Interpretability and error analysis
- Go deeper: Uncertainty and decision
- Apply it: rewrite one predictive requirement as a causal question and list the missing evidence.
## Formal extension

Prediction estimates an association useful for anticipation; causality asks what would change under an intervention. A causal diagram identifies whether a variable is a confounder, collider, mediator, or post-treatment measurement before an adjustment rule is chosen.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
