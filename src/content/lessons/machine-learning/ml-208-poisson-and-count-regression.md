---
title: "Poisson and count regression"
track: "machine-learning"
order: 208
status: live
summary: "Predict event counts with exposure-aware models and diagnose when the Poisson story breaks."
duration: "22 min read"
updated: "2026-08-30"
---

## The short answer

Poisson regression models a nonnegative expected count, commonly as $\log E[Y|x]=X\beta+\log(\text{exposure})$. The exposure term lets a model compare rates fairly when rows represent different observation windows or population sizes.

## Why this matters

Calls, purchases, failures, and visits are counts. Comparing raw counts across stores open for different hours or cities with different populations quietly rewards opportunity rather than rate.

## How it works

The Poisson distribution has mean equal to variance. A log link ensures positive fitted means; an offset has known coefficient one and represents opportunity. Check whether observed variation is much larger than predicted (overdispersion), whether excess zeroes have a process explanation, and whether events are independent enough for the target question. Negative-binomial or two-stage models can be alternatives, not automatic upgrades.

## Worked examples and variations

1. Model incidents per machine-hour using `log(machine_hours)` as an offset.
2. Model emails per subscriber-day using active days as exposure.
3. A zero count during zero exposure is structurally different from zero incidents during a full shift.
4. If variance greatly exceeds mean because stores differ unmodelled, simple Poisson intervals are too narrow.
5. A negative count caused by a data adjustment is a counterexample: clean the target rather than force it into Poisson.

## Two ways to see it

The log link makes effects multiplicative on the rate: adding a feature can multiply expected events. The offset converts counts into a common-rate comparison without manually dividing away useful information.

## Hands-on

Fit count models with and without an exposure offset and compare two identical-rate stores with different open hours. Intentionally use raw count as the target without exposure and observe the spurious hours effect. Reset with the offset; calculate mean and variance by segment and document an overdispersion decision.

## Checkpoint

What is an offset, and why is its coefficient fixed? What observation would challenge the Poisson variance assumption?

## What this does not solve

Count regression does not establish event independence, capture queue dynamics, or explain why a zero occurred.

## Continue, go deeper, apply it

Use this with time-aware validation and uncertainty intervals. Apply it to operational rates, not only to conveniently available raw counts.
