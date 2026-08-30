---
title: "Capstone: defend a complete ML system decision"
track: "machine-learning"
status: live
summary: "The capstone is a decision defense, not a leaderboard exercise."
duration: "3 min read"
---

## The short answer

The capstone is a decision defense, not a leaderboard exercise. Choose a bounded prediction or ranking task, establish a baseline, build at least two model families, evaluate honestly, inspect errors and subgroups, and propose a deployable boundary with monitoring and rollback. The final answer may be “do not ship.”

## Required deliverables

1. problem brief and non-goals;
2. data contract, provenance, and availability timeline;
3. baseline and model comparison;
4. split, metric, uncertainty, and slice rationale;
5. error gallery with boundary and counterexample cases;
6. interpretability, fairness, and residual-risk note;
7. experiment manifest and release or rollback plan;
8. model card or system card with a clear ship / do-not-ship decision.

## Four examples

### Example A: tabular triage

Compare a rule, logistic model, and tree ensemble. Focus on thresholds, calibration,
review capacity, and subgroup error.

### Example B: temporal forecast

Compare a seasonal baseline with a learned model. Focus on as-of features,
walk-forward validation, delayed labels, and drift response.

### Boundary case: missing evidence

Require the system to abstain when a required field or source is missing. Score
appropriate escalation, not only completed predictions.

### Counterexample: best score wins

A higher score with poor latency, opaque failure, or unacceptable subgroup harm
should lose to a simpler model—or stop the project entirely.

## An illustrative story

A learner’s final model was not the winner. Their strongest defense showed that a
leaked feature had inflated the competitor and that the remaining gain did not
justify review cost. That is the judgment the course is designed to teach.

## Two ways to see it

### Research view

Make a falsifiable claim about a model under a defined evaluation protocol.

### Responsible-systems view

Decide whether the entire data, model, workflow, and operations deserve authority.

## Hands-on

Choose a synthetic or permissioned dataset and complete the eight deliverables.
Ask a peer or reviewer to attack the split, metric, and risk note. Revise once,
then record what changed and what remains uncertain.

## Checkpoint

- [ ] The final decision is supported by reproducible evidence.
- [ ] At least one failure changes the design or deployment boundary.
- [ ] The learner can defend a no-ship or limited-ship decision.

## What this does not solve

A capstone cannot prove long-term safety or performance. It proves that the learner
can frame, test, communicate, and operate an ML decision honestly.

## Continue, go deeper, apply it

- Continue: Governance artifacts
- Go deeper: ML systems and reproducibility
- Apply it: submit the complete model/system card and release review.
## Formal extension

A capstone is a decision defence, not a leaderboard result. It must include a proposal, data card, baseline, split and metric rationale, error analysis, risk register, release boundary, monitoring plan, incident simulation, and a written or oral defence.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
