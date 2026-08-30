---
title: "Compare discriminative and generative modeling"
track: "machine-learning"
status: live
summary: "Discriminative models focus on predicting a target from inputs; generative models describe how inputs and targets might arise."
duration: "3 min read"
---

## The short answer

Discriminative models focus on predicting a target from inputs; generative models describe how inputs and targets might arise. Maximum likelihood estimates parameters that make observed data probable; MAP adds a prior preference. The distinction guides missing-data handling, uncertainty, sampling, and what the model can answer.

## The mechanism

Model `P(y | x)` when the decision is classification, or model a joint or
conditional distribution when you need to reason about data generation. Priors can
stabilize estimates, but they are assumptions and should be disclosed.

## Four examples

### Example A: spam classifier

A discriminative model can learn the boundary between spam and not-spam. It need
not generate realistic emails to classify them.

### Example B: missing values

A generative model of related variables may represent plausible completions, but a
completion is an estimate, not a recovered fact.

### Boundary case: prior dominates

With little data, a strong prior can drive the posterior. This may be useful or
misleading; compare sensitivity to plausible priors.

### Counterexample: generative means truthful

A model that can sample fluent data can still produce unlikely or false content.
Generation ability is not evidence of factuality.

## An illustrative story

A team filled missing records with the most likely completion and later treated
them as observed facts. The model had done its probabilistic job; the data process
had failed to preserve uncertainty.

## Two ways to see it

### Probabilistic view

Likelihood, prior, and posterior encode different sources of uncertainty.

### Product view

The choice determines whether the system predicts, samples, imputes, or supports
what-if reasoning—and how uncertainty is shown to users.

## Hands-on

Fit a simple discriminative classifier and a small generative model on a toy
dataset. Compare classification, sampling, and missing-value behavior under two
priors. Record which claims each model can support.

## Checkpoint

- [ ] `P(y|x)`, likelihood, prior, and posterior are distinguished.
- [ ] Imputed values remain marked as estimates.
- [ ] Prior sensitivity is inspected when data is sparse.

## What this does not solve

Probabilistic formalisms cannot make an incorrect model of the world correct or
turn a posterior into a moral or policy decision.

## Continue, go deeper, apply it

- Continue: Reinforcement learning and reward
- Go deeper: Probability and statistics for ML
- Apply it: write a model-choice note for a prediction versus generation task.
## Formal extension

For hypotheses h and data D, posterior mass is proportional to likelihood times prior. With a Beta(2,2) prior and seven heads in ten trials, the posterior is Beta(9,5). This makes modelling assumptions visible rather than treating a score as self-explanatory.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
