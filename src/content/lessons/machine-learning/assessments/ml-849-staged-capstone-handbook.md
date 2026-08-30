---
title: "Staged capstone handbook: from proposal to production review"
track: "machine-learning"
order: 849
status: live
summary: "A gated end-to-end Classical ML capstone with evidence requirements at every stage."
duration: "40–70 hours"
updated: "2026-08-30"
---

## Capstone rule

You may not advance by presenting a better model. Advance by showing that the next decision is justified. Use a public, synthetic, or properly authorised dataset. Maintain a dated decision log from day one.

## Stage gates

| Gate | Deliverable | Pass condition |
| --- | --- | --- |
| 1. Proposal | One-page decision brief and non-ML alternative | Clear action, harms, owner, scope, and safe default. |
| 2. Data review | Data card, availability timeline, privacy/licence review | Target and split are defensible; no unresolved access violation. |
| 3. Baseline | Reproducible naive/transparent baseline | Clean rerun and decision-linked metric. |
| 4. Experiment | Registered comparison plan and run ledger | No test-set tuning; controlled ablations. |
| 5. Evaluation | Held-out/slice/error/uncertainty report | Claims match evidence and limitations. |
| 6. Release review | Model report, monitoring and rollback plan | Named ownership and safe intervention path. |
| 7. Defense | Demo plus oral examination | Learner can explain and challenge their choices. |

## Minimum technical requirements

Use versioned code and data references; deterministic seeds; a lock file; a one-command reproduction path; at least one baseline and two credible model families; justified validation; error analysis; uncertainty; risk register; and a documented no-launch condition. The project must include one deliberately injected defect (leakage, shift, broken feature, or wrong threshold), its detection, and repair.

## Required portfolio

Repository, README, data card, experiment registry, model report, diagrams, results tables, decision log, risk register, monitoring specification, incident simulation, 10-minute demo, and final memo. Keep raw result files where a reviewer can inspect them.

## Capstone rubric (100 points)

| Area | Points |
| --- | ---: |
| Decision framing, data legitimacy, and risk | 20 |
| Reproducible engineering and experimental discipline | 20 |
| Model/baseline comparison and mathematical understanding | 20 |
| Evaluation, uncertainty, slices, and error analysis | 20 |
| Release judgement, monitoring, and communication | 20 |

## Self-check before the defense

- Can a reviewer recreate the headline result from the README without manual edits?
- Does the decision log record a rejected alternative and why it was rejected?
- Is each release claim tied to a metric, uncertainty estimate, and named owner?
- Can you demonstrate the injected failure, detection signal, repair, and residual limitation?

## Common failure modes

Do not substitute a dashboard for evidence, a leaderboard metric for a decision, or an attractive notebook for reproducibility. A capstone may earn a strong score for a well-supported no-launch recommendation.
