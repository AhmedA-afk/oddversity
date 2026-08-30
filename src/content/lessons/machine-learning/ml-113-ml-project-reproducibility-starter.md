---
title: "ML project reproducibility starter"
track: "machine-learning"
order: 113
status: live
summary: "Create the minimal evidence trail needed to rebuild a result, inspect a decision, and detect a changed input."
duration: "25 min read"
updated: "2026-08-30"
---

## The short answer

A reproducible ML result records code, data version or query snapshot, environment, split, random seeds, feature pipeline, model configuration, metrics, and decision policy. Start small: a deterministic training command and a run record are more valuable than an elaborate platform nobody uses.

## Why this matters

“It worked on my machine” becomes costly when a result must be explained, compared, or rebuilt after upstream data changes. Reproducibility is not only academic rigor; it is incident response, collaboration, and safe iteration.

## How it works

Separate immutable inputs from generated outputs. Use a configuration file, deterministic split identifiers, and saved artifacts. Record both data schema and data selection query; a file name alone is not provenance. Treat random seeds as controls for repeatability, not proof of robustness.

```text
run/
  config.yaml          data version, split, parameters
  environment.lock     package/runtime versions
  metrics.json         metric, interval, threshold
  model-artifact/      serialized pipeline and model
  report.md            question, findings, known limits
```

## Worked examples and variations

1. A notebook result is made reproducible by extracting a command-line training entry point and saving its config.
2. A warehouse dataset is versioned through a timestamped query plus source-table snapshot identifiers.
3. A stochastic forest is rerun with fixed seeds, then with several seeds to measure sensitivity.
4. Boundary case: a manual spreadsheet source may be unavoidable; record its checksum, owner, date, and transformation steps.
5. Counterexample: committing a trained binary alone does not reproduce the feature definitions, data, or serving behavior.

## Two ways to see it

Reproducibility is an experimental protocol. It is also a supply chain: inputs enter, transformations run, an artifact exits, and every handoff needs provenance.

## Hands-on

Turn one notebook into `train --config config.yaml`. Intentionally rerun it after changing an unrecorded preprocessing option. Reset by putting that option in versioned config and writing the resolved config into the run directory. Have another person rebuild the run from the record.

## Checkpoint

- Could you reconstruct the exact train/validation rows?
- Is the fitted preprocessing pipeline saved with the model?
- Can you explain a metric’s split, threshold, and code revision?

## What this does not solve

Reproducibility does not guarantee correctness, privacy compliance, or stable production data. It makes investigation possible when those questions arise.

## Continue, go deeper, apply it

Use this starter in the lab: a question-to-evaluation plan should produce an artifact another learner can review without guessing.
