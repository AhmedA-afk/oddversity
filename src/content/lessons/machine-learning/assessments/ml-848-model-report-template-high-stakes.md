---
title: "Model report template: high-stakes review and human oversight"
track: "machine-learning"
order: 848
status: live
summary: "A stricter review template for systems affecting access, safety, health, work, or essential services."
duration: "60–120 min"
updated: "2026-08-30"
---

## Gate 0: should this be built?

Document the affected people, legal/policy constraints, non-ML alternatives, human decision process, contestability, and the case for automation. If the system cannot provide a safe fallback, stop here.

## Evidence record

| Domain | Required evidence |
| --- | --- |
| Data | Consent/licence, population coverage, label validity, missingness, proxy-risk analysis, retention plan |
| Decision | Action pathway, error harms, operator authority, notice/appeal/recourse, emergency stop |
| Evaluation | Time/group holdouts, uncertainty, subgroup intervals, calibration, harm-weighted metrics |
| Robustness | Shift, adversarial/misuse scenarios, manual-review simulation, dependency failure |
| Governance | Named owner, independent reviewer, audit log, incident process, reapproval schedule |

## Decision memo fields

Write: **claim**, **supporting artefact**, **counterevidence**, **residual risk**, **mitigation**, **owner**, and **review date** for each material claim. Use plain language for the affected-person notice: what inputs matter, what the output does, what it cannot decide, and how someone can challenge it.

## Review rubric (50 points)

Award five points each for necessity, data legitimacy, target validity, split integrity, harm-aware metrics, subgroup uncertainty, human oversight, recourse, operational safeguards, and auditability. Any missing emergency-stop/appeal mechanism or unbounded subgroup harm is a no-launch finding, not a deduction to offset elsewhere.

## Self-check and failure modes

Ask an independent reviewer to reproduce one adverse decision from logs. Test a missing-record and service-outage path. Common failures: treating protected attributes as the only fairness concern, using parity metrics without a decision context, and assuming an explanation makes a harmful action acceptable.
