---
title: "Explain model behavior through errors and counterfactuals"
track: "machine-learning"
status: live
summary: "Interpretability is not one chart. Global summaries describe behavior across a dataset; local explanations inspect one case; counterfactuals ask what."
duration: "3 min read"
---

## The short answer

Interpretability is not one chart. Global summaries describe behavior across a dataset; local explanations inspect one case; counterfactuals ask what change would alter the output. Error analysis connects all three to real failures. Explanations should help a person test, correct, or contest a decision—not merely reassure them.

## The workflow

1. Find representative false positives and false negatives.
2. Slice by meaningful context, not only available demographics.
3. Form a hypothesis about features or process.
4. Test with ablation, counterfactual, or a simpler model.
5. Turn confirmed failures into data, policy, or evaluation changes.

## Four examples

### Example A: global feature summary

A tree often splits on account age. Check whether this reflects a valid process or
an access proxy before calling it an explanation.

### Example B: local counterfactual

“If the missing document were present, the route may change” can support a review
conversation. It should not suggest a person can change an immutable trait.

### Boundary case: correlated features

Credit history and income may share credit. Removing one can shift importance to
the other without changing the underlying shortcut.

### Counterexample: plausible story

A generated explanation can be fluent and false. Verify it against the actual
features, model path, and data available for that case.

## An illustrative story

A team showed users a confident sentence explaining each decision. Users trusted
it until a data bug revealed that the sentence was generated after the prediction,
not derived from the model. The review switched to evidence-linked diagnostics.

## Two ways to see it

### Debugging view

Explanations generate hypotheses about errors to test.

### Human-impact view

An explanation must support recourse, contestability, and appropriate uncertainty.

## Hands-on

Build an error gallery with eight cases across two slices. For each, record the
prediction, relevant inputs, suspected cause, one counterfactual test, and the
mitigation or data change. Include one explanation that you reject as unsupported.

## Checkpoint

- [ ] Global, local, and counterfactual explanations are distinct.
- [ ] Explanations are checked against actual model inputs.
- [ ] Error analysis leads to a test, data change, or policy decision.

## What this does not solve

An interpretable model can still learn a harmful target, and a complex-model
explanation can be incomplete. Transparency does not equal fairness or causality.

## Continue, go deeper, apply it

- Continue: Fairness and subgroup evaluation
- Go deeper: Causal questions versus predictive models
- Apply it: publish an error gallery with rejected explanations.
## Formal extension

Interpretability answers a question for an audience: debugging, explanation, audit, or recourse. Permutation importance, partial dependence, SHAP-style attributions, and counterfactuals have different assumptions and can fail under correlated or unsupported features.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
