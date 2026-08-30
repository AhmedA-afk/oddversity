---
title: "Make an ML experiment reproducible enough to trust"
track: "machine-learning"
status: live
summary: "Reproducibility means another person can identify the data, code, features, random seeds, environment, model, metrics, and decisions behind a result."
duration: "3 min read"
---

## The short answer

Reproducibility means another person can identify the data, code, features, random seeds, environment, model, metrics, and decisions behind a result. Exact bit-for-bit replay may be impractical; the minimum is enough lineage to reproduce the claim, investigate a failure, and compare a new release without guessing.

## The experiment record

Record dataset and label versions, split strategy, preprocessing, model code,
hyperparameters, random seeds, environment, metrics by slice, artifacts, and
reviewer decision. Separate exploratory runs from the candidate release.

## Four examples

### Example A: same code, new data

A rerun can change because the source table was updated. Pin the snapshot or record
the query result and extraction time.

### Example B: same score, different errors

Two runs can have identical accuracy and opposite safety behavior. Preserve error
cases and slice metrics, not only the headline number.

### Boundary case: nondeterminism

Parallel kernels or provider changes may prevent identical outputs. Record ranges,
versions, and tolerances; do not claim exact replay if you cannot provide it.

### Counterexample: notebook as lineage

A notebook can hide execution order and stale cells. Make the pipeline and inputs
explicit, then export the final report from a clean run.

## An illustrative story

A model could not be reproduced for a review meeting. The missing variable was a
manually edited CSV. The team moved the edit into a versioned transformation and
added a data checksum to the experiment record.

## Two ways to see it

### Research view

Reproducibility makes a claim testable and comparison fair.

### Operations view

Lineage makes deployment, rollback, incident analysis, and retraining possible.

## Hands-on

Create an experiment manifest with data hash, split, code revision, environment,
seed, model, metrics, and artifacts. Run it twice, change one input deliberately,
and show that the report identifies the cause.

## Checkpoint

- [ ] The result resolves to a data and code version.
- [ ] Metrics include slices and error artifacts.
- [ ] A clean rerun distinguishes intended from accidental changes.

## What this does not solve

Reproducible measurement does not make the target valid, the data fair, or the
production environment identical to a notebook.

## Continue, go deeper, apply it

- Continue: Serving, batch, and online inference
- Go deeper: Regression gates and online signals
- Apply it: add a machine-readable experiment manifest to a project.
## Formal extension

A reproducible experiment records code version, data snapshot, split manifest, feature definition, environment, seed, configuration, metrics, and output artefacts. Re-running only the training command without those dependencies does not reproduce a conclusion.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
