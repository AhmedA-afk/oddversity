---
title: "Oral-defense rubric: defend an ML decision under scrutiny"
track: "machine-learning"
order: 850
status: live
summary: "A structured oral examination for testing genuine technical understanding and responsible judgement."
duration: "30–45 min"
updated: "2026-08-30"
---

## Format

The learner gives a 10-minute capstone briefing, then answers 20 minutes of examiner questions and 5 minutes of reflection. Examiners may ask the learner to trace one metric to raw data, change an assumption, or explain a failed run. The learner may consult their repository but not prepared answers.

## Question bank

Ask at least one question from each area: Why this decision and not a non-ML process? When could each feature exist? Why is the split valid? What does the baseline teach? Derive or explain one chosen objective/metric. Which uncertainty would reverse the recommendation? Show one harmful error and its mitigation. What changes under prevalence/shift? Who owns a rollback? What claim in your report is weakest?

## Rubric (100 points)

| Dimension | Points | Distinguished performance |
| --- | ---: | --- |
| Problem and data reasoning | 20 | States boundaries, target validity, provenance, and leakage risks precisely. |
| Technical and mathematical command | 20 | Explains objective, trade-offs, diagnostics, and alternative methods without hand-waving. |
| Evidence and reproducibility | 20 | Navigates artefacts, traces results, and distinguishes result from interpretation. |
| Risk, fairness, and operations | 20 | Identifies harms, uncertainty, ownership, monitoring, and safe failure. |
| Communication and intellectual honesty | 20 | Answers directly, revises claims under challenge, and names unknowns. |

## Scoring rules

Score each dimension 0–20. A total of 70 passes; 85 demonstrates advanced readiness. A learner cannot pass if they cannot explain the split, reproduce the reported result, or identify a credible no-launch/rollback condition. Award credit for correcting an earlier statement when new evidence is supplied.

## Examiner protocol

Request evidence, not confidence. Use follow-ups such as “what would falsify that?”, “show me where that enters the pipeline,” and “whose risk changes?” Record both the question and the learner’s evidence source. Do not reward jargon or punish a defensible decision to abstain.

## Self-check for learners

Practice a defense with a peer who is assigned to challenge leakage, causality, fairness, and deployment assumptions. If you cannot find an artefact in 60 seconds, improve the README and decision log. Prepare to say what your model cannot do.
