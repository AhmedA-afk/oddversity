---
title: "Survival analysis and censored outcomes"
track: "machine-learning"
order: 211
status: live
summary: "Model time until an event without pretending unfinished observations have no event time."
duration: "26 min read"
updated: "2026-08-30"
---

## The short answer

Survival analysis models time to an event while accounting for censoring: some subjects leave observation before the event occurs. Treating their observed time as an event time or discarding them wastes information and biases estimates.

## Why this matters

Churn, equipment failure, recovery, and subscription renewal are time-to-event questions. At any data cutoff, many customers are still active; their final outcome is unknown, not negative.

## How it works

The survival function $S(t)$ is probability of surviving beyond time $t$; the hazard describes instantaneous event rate among those still event-free. Kaplan–Meier estimates survival without covariates. Cox proportional hazards relates covariates to relative hazard while leaving baseline hazard unspecified. Check the proportional-hazards assumption and define the time origin carefully. Censoring must be plausibly non-informative conditional on modelled information for standard interpretations.

## Worked examples and variations

1. Customers acquired recently are right-censored at the reporting date.
2. A machine removed for a planned upgrade is censored, not necessarily a failure.
3. Competing events such as death versus discharge need a competing-risks design, not one combined label.
4. If high-risk users disappear from measurement for the same reason they churn, censoring may be informative.
5. A zero follow-up duration is a valid boundary case requiring precise timestamp handling.

## Two ways to see it

Survival methods keep each still-observed subject in the risk set until its last known time. A hazard ratio is relative event rate, not a probability difference or a guaranteed causal effect.

## Hands-on

Build an event indicator and duration from dated records, then plot Kaplan–Meier curves by cohort. Intentionally label all censored rows as no-event zeros in an ordinary classifier; compare the distorted target. Reset with a survival-aware split and report survival probability at a decision horizon.

## Checkpoint

What does right censoring mean? Why can a hazard ratio not be read as “twice the probability”?

## What this does not solve

Survival analysis cannot repair ambiguous event definitions, unmeasured informative dropout, or competing events hidden in one label.

## Continue, go deeper, apply it

Apply it to retention and reliability decisions. Pair it with time-aware validation and uncertainty communication.
