---
title: "Ship AI systems with versioning, rollback, and incident paths"
track: "production"
status: live
summary: "Deploy the complete behavior—not just a model: prompt, model version, retrieval index, tool schemas, policies, parser, configuration, and evaluation."
duration: "3 min read"
---

## The short answer

Deploy the complete behavior—not just a model: prompt, model version, retrieval index, tool schemas, policies, parser, configuration, and evaluation report. Release gradually, observe the result, and keep a tested rollback or containment path. An incident plan must say who can stop the system and how users are informed.

## Version the behavior bundle

Use a release identifier that resolves every material dependency. Keep old indexes
and prompts long enough to investigate, but apply privacy and retention rules.
Separate reversible configuration changes from migrations that need a plan.

## Four examples

### Example A: canary release

Send a small, bounded slice to a new prompt/model bundle. Compare quality,
latency, cost, and escalations before widening.

### Example B: index refresh

An index update can alter answers without a model change. Record corpus version,
parser version, and freshness checks with the release.

### Boundary case: unsafe output spike

Disable a write-capable tool or route to a read-only fallback before debating the
perfect fix. Containment is a legitimate release action.

### Counterexample: rollback only the model

Restoring a model while leaving a new prompt or tool schema can preserve the
failure. Roll back the behavior bundle or isolate the changed component.

## An illustrative story

A team rolled back a model and saw no improvement because a new retrieval index
was still serving the same unsupported passages. The incident review changed the
release artifact from “model version” to “system behavior bundle.”

## Two ways to see it

### Release view

Make behavior changes small, attributable, and reversible.

### Incident view

Stop impact first, preserve evidence safely, communicate clearly, then fix and
turn the failure into a regression test.

## Hands-on

Write a release manifest for a mock AI service. Simulate a bad prompt and a bad
index, detect each from a test or signal, roll back the full bundle, and create a
post-incident record with owner and follow-up test.

## Checkpoint

- [ ] All material dependencies have versions.
- [ ] Rollback and containment are tested, not theoretical.
- [ ] Incident ownership, communication, and evidence handling are explicit.

## What this does not solve

Rollback cannot undo every external action or user impact. Design approval,
idempotency, least privilege, and communication before release.

## Continue, go deeper, apply it

- Continue: Governance artifacts
- Go deeper: Regression gates and online signals
- Apply it: produce a release manifest and a one-page incident runbook.
