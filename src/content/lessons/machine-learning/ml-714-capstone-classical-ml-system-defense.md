---
title: "Capstone: classical ML system defense"
track: "machine-learning"
order: 714
status: live
summary: "Defend an end-to-end classical ML system with evidence, limitations, and a live failure drill."
duration: "6–10 hour capstone"
updated: "2026-08-30"
---

## The short answer

Choose one bounded real-world decision-support problem and defend the entire system: framing, data availability, baseline, validation, errors, operational workflow, harms, monitoring, and rollback. The goal is a credible argument, not the highest leaderboard score.

## Why this matters

Advanced ML practice is the ability to reject attractive but invalid approaches, communicate uncertainty, and operate a model responsibly. A capstone tests integration across those skills.

## How it works

Use an open or organizationally authorized dataset. Start from a project brief, create a time-aware split where relevant, build a non-ML baseline and at least two model families, freeze a final evaluation, and make a decision policy. Include error analysis, subgroup or slice checks appropriate to the context, a reproducible run, and a production readiness packet. Invite reviewers to challenge assumptions rather than only presentation polish.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. House-price assistance focuses on residuals, rare properties, and abstention.
2. Churn outreach focuses on capacity, calibration, and experimental follow-up.
3. Demand forecasting focuses on rolling origin and stockout caveats.
4. Counterexample: a random-split model with an impressive score but unknown decision owner fails the capstone defense.

## Two ways to see it

As a portfolio artifact, this proves you can make and defend decisions. As an engineering review, it validates a chain of assumptions from raw data to action.

## Hands-on

Deliver a repository, project brief, model card, data dictionary, reproducible pipeline, baseline and model comparison, locked-test report, error gallery, readiness review, and a ten-minute defense deck. Perform an intentional failure drill: inject a missing or post-outcome feature, show the failed check or inflated metric, then reset by enforcing the contract and rerunning. Ask a reviewer to select one claim to challenge and record your evidence or revision.

## Checkpoint

You can answer: what decision changes, what data was available then, what baseline you beat, where you fail, who owns the system, and how it is stopped.

## What this does not solve

A capstone is not proof of production value, independent security audit, or permission to deploy in a regulated domain.

## Continue, go deeper, apply it

Turn the defense feedback into a revised release candidate, then run a shadow evaluation or controlled experiment with authorized stakeholders.
