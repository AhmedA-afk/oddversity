---
title: "Lab: anomaly detection with investigation queues"
track: "machine-learning"
order: 709
status: live
summary: "Design anomaly detection around human investigation and changing normal behavior."
duration: "90 min lab"
updated: "2026-08-30"
---

## The short answer

Use anomaly scores to prioritize investigation, establish what “normal” means for a time and entity, test queue quality with reviewed cases, and make feedback capture part of the system.

## Why this matters

An anomaly is not necessarily an error, attack, or fraud. Seasonal peaks, new customers, and changed instrumentation can create alerts faster than people can review them.

## How it works

Specify the unit of review and investigator capacity. Train or fit only on a period judged sufficiently normal, then compare simple rules, robust z-scores, and an isolation/density method. Rank rather than hard-block. Backtest by replaying historical windows and measuring reviewed precision when labels exist; otherwise use structured expert dispositions. Monitor score distribution, alert volume, and feature availability.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A robust z-score catches a daily volume spike without assuming normality.
2. Per-customer baselines reduce false alerts for naturally high-volume accounts.
3. A new product launch shifts normal traffic and needs a baseline reset plan.
4. Counterexample: an isolated point in a sparse but legitimate region is unusual, not automatically harmful.

## Two ways to see it

Operations sees a queue whose false alerts consume attention. ML sees one-class or low-label distributional deviation under nonstationarity.

## Hands-on

Deliver an alert definition, capacity plan, three scoring baselines, historical replay, top-k review sheet, and disposition taxonomy. Intentionally fail by treating every alert as a positive label or training on a known incident period; show the effect, then reset with a vetted reference window and explicit “unknown” disposition. Add a weekly review of alert volume and false-alert reasons.

## Checkpoint

You can distinguish an anomaly score from a confirmed incident and explain how investigator feedback becomes training or evaluation evidence.

## What this does not solve

It does not establish malicious intent, replace incident response, or remain valid after unmonitored operational change.

## Continue, go deeper, apply it

Add multivariate seasonal baselines, change-point detection, active learning from reviews, and incident playbooks.
