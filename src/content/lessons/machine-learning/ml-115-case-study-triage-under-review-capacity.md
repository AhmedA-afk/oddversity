---
title: "Case study: triage under limited review capacity"
track: "machine-learning"
order: 115
status: live
summary: "Design an end-to-end review-prioritization system when a model ranks cases but people make the final decision."
duration: "50 min case study"
updated: "2026-08-30"
---

## The short answer

For triage, the model’s job is usually ranking, not automated judgment. Define the reviewable unit and decision time, score only information available then, send a capacity-constrained set of cases to reviewers, and evaluate incremental outcomes, reviewer burden, and subgroup effects—not only classification accuracy.

## Why this matters

Many real ML systems support scarce expert attention: safety inspection, fraud investigation, quality review, and support escalation. A high score is useless if it overwhelms reviewers, displaces important low-score cases, or creates a feedback loop in which only reviewed cases receive labels.

## How it works

Suppose each morning there are cases `i` with estimated priority `p_i` and capacity `K`. The simplest policy reviews the top `K` after eligibility checks. Evaluate precision/recall at `K`, workload, time to decision, and the outcome of reviewed versus existing policy. Preserve a sample of low-score cases for quality assurance and label coverage.

```text
intake at t0 -> availability audit -> score/rank -> eligibility guardrails
            -> top K review queue -> human decision -> delayed adjudicated label
```

## Worked examples and variations

1. Fraud: rank transactions for analyst review; a false positive costs analyst time, while a false negative can cause loss.
2. Product safety: prioritize reports for specialist review; duplicate reports must be grouped so one incident does not fill the queue.
3. Customer support: surface likely urgent tickets while preserving a random audit sample from below the cutoff.
4. Boundary case: if capacity covers every eligible case, ranking adds no allocation value; focus on decision support or process improvement.
5. Counterexample: training only on historically reviewed cases then ranking everyone assumes unreviewed cases are negative and reproduces past attention patterns.

## Two ways to see it

As a classifier, triage estimates a risk or relevance score. As a queueing problem, it allocates a fixed resource over time. The latter view makes capacity, arrival spikes, service time, and escalation rules first-class evaluation concerns.

## Hands-on

Using a small dataset, simulate daily queues with capacities `K=10`, `K=25`, and `K=50`. Report precision at `K`, recall at `K`, queue utilization, and errors by a meaningful subgroup when appropriate. Intentionally choose `K` from the test set’s best result. Reset by setting `K` from operational capacity before evaluation, then lock it. Add a random low-score audit sample and state why it matters.

## Checkpoint

- Who makes the final decision, and what evidence do they receive beyond the score?
- How is capacity set independently of test performance?
- How will labels arrive for cases the system does not prioritize?

## What this does not solve

This design does not establish that the intervention improves outcomes; ranked review may only find more recorded issues. It also cannot replace due process, expert accountability, or governance for high-impact decisions.

## Continue, go deeper, apply it

Turn the simulation into a monitored pilot: log availability, score, queue position, reviewer decision, delayed outcome, and overrides. Revisit the data-generating process after launch because triage changes which cases are observed.
