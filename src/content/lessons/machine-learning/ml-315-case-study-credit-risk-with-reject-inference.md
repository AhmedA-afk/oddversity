---
title: "Case study: credit risk and reject inference"
track: "machine-learning"
order: 315
status: live
summary: "Credit-risk training labels are observed mainly for accepted applicants, so reject inference is a selection-bias problem that demands caution, governance, and policy-aware validation."
duration: "22 min read"
updated: "2026-08-30"
---

## The short answer

In lending, repayment outcomes are usually observed for accepted applicants, while rejected applicants have missing outcomes because the institution chose not to lend. Training only on accepted applicants can bias a default model toward an old policy. “Reject inference” methods attempt to address this missing-not-at-random problem, but none conjures ground truth for people who were never offered credit.

## Why this matters

This is a canonical example of feedback loops and selective labels. A technically strong model can still perpetuate historical access decisions, fail under policy change, or create unequal harms. It requires legal, risk, and fairness review in addition to ML work.

## How it works

Define the decision time, performance window, outcome, and eligibility population. Audit historical accept/reject policies and time changes. Compare accepted-only models with transparent sensitivity analyses. Techniques such as parceling, augmentation, or weighting rest on assumptions about reject outcomes; treat them as scenarios, not recovered facts. Validate prospectively where authorized and monitor approval, default, and fairness outcomes separately.

## Worked examples and variations

1. **Stable acceptance policy:** accepted-only performance may be locally useful but still does not represent all applicants.
2. **Policy expansion:** labels for newly accepted groups reveal whether the old model’s extrapolation was wrong.
3. **Manual-review channel:** reviewer discretion can introduce a second selection mechanism that must be logged.
4. **Boundary case:** an applicant outside an approved product population should be routed to a human or ineligible state, not scored as a typical row.
5. **Counterexample:** assigning all rejected applicants a bad outcome merely reproduces the old rejection rule under mathematical cover.

## Two ways to see it

**Missing-data view:** outcomes are missing not at random because acceptance depends on applicant features and policy.

**Decision-system view:** labels, thresholds, offers, and future data are produced by the institution’s own actions.

## Hands-on

Using a synthetic accepted/rejected dataset, map which labels are observed and compare accepted-only calibration across score bands. Deliberately label every reject as default and note the apparent uplift. Reset by removing invented labels, documenting assumptions, running sensitivity bands, and writing a human-review/escalation policy for unsupported populations.

## Checkpoint

- [ ] The accepted population, rejected population, and label window are explicit.
- [ ] Any inference method has named assumptions and sensitivity results.
- [ ] Fairness, adverse action, privacy, and regulatory review are owned by appropriate experts.

## What this does not solve

This lesson is not legal, compliance, or lending advice. A model cannot decide what lending policy is just or lawful.

## Continue, go deeper, apply it

Apply the same selective-label analysis to hiring, healthcare, moderation, and fraud interventions.
