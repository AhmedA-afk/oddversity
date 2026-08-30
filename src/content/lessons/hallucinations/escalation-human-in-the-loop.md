---
title: "Escalation and Human-in-the-Loop Design"
track: "hallucinations"
status: live
summary: "When to hand off to a human, what context to send with the handoff, and how to set a threshold without drowning reviewers in noise."
duration: "7 min read"
---

[Escalation design](/learn/hallucinations/escalation-design-for-uncertain-answers) covered the signal and the threshold as a business decision. This lesson goes one level deeper into the mechanics: what actually gets attached to an escalated case, how the threshold trades accuracy against coverage, and the failure mode that kills most escalation systems — reviewers who stop trusting the queue.

## What it is

Human-in-the-loop escalation is the behavioral guardrail from the [taxonomy](/learn/hallucinations/guardrails-taxonomy): a policy decision to route a request to a person instead of answering it automatically, triggered by a confidence signal crossing a threshold. It's the third stage of the confidence gate in the [architecture overview](/learn/hallucinations/reliability-architecture-overview) — after detection produces an uncertainty score, escalation is what happens when that score says "don't ship this."

## The mental model

Escalation is a routing decision with a tradeoff baked into every threshold choice, and it's worth making that tradeoff explicit rather than picking a number and moving on. Say a system's uncertainty score can rank answers from most to least confident. Setting the escalation threshold at different points changes both how many answers ship automatically (coverage) and how accurate those shipped answers are (answered-set accuracy):

| Threshold (escalate below this confidence) | Illustrative coverage | Illustrative answered-set accuracy |
|---|---|---|
| Very low (rarely escalate) | ~95% answered automatically | Lower — some wrong answers slip through |
| Moderate | ~75% answered automatically | Higher — most of the shakiest cases are pulled out |
| Very high (escalate often) | ~40% answered automatically | Highest on what ships — but most volume now needs a human |

These numbers are illustrative, not measured — the actual curve for your system only exists once you have calibration data, which is exactly the point: you don't choose a threshold by intuition, you choose it by looking at where your system's real curve bends, using the [calibration and reliability](/learn/hallucinations/calibration-error-reliability-diagrams) data from Module 4. A system with well-calibrated confidence scores has a curve where a small threshold change buys a large accuracy gain for a small coverage loss — that inflection point is usually your actual operating threshold, not the extremes.

## Why it works this way

The threshold isn't a model property, it's a statement about which of two costs your organization would rather pay: a human reviewing a case the model actually had right, or a wrong answer reaching a user unreviewed. Those costs are almost never symmetric. In a support chatbot, an unnecessary escalation costs a reviewer a few minutes; a hallucinated refund policy costs a chargeback and a support ticket to fix. In a clinical assistant, the asymmetry is much sharper — see the [high-stakes case study](/learn/hallucinations/high-stakes-case-study) for what that looks like end to end. The threshold should be set by whoever owns that cost, not buried in a config file nobody revisits.

## A concrete example

The handoff itself needs more than a flag. A well-formed escalation carries:

- **The original question**, verbatim — reviewers waste time reconstructing intent from a paraphrase.
- **The draft answer the system almost shipped**, so the reviewer is editing, not starting from a blank page.
- **The specific signal that triggered escalation** — "semantic entropy 0.81, three samples disagreed on the date" is actionable; "low confidence" is not.
- **Any retrieved sources**, so the reviewer can check them directly instead of re-searching.
- **A deadline or SLA**, so the case doesn't sit in a queue nobody owns — the same failure the source lesson calls out for un-routed flags.

```json
{
  "question": "What's the early termination fee on the enterprise plan?",
  "draft_answer": "The early termination fee is $2,400.",
  "trigger": "grounding_check_failed: no source mentions a specific fee",
  "sources_checked": ["pricing-page-v3.md", "contract-template-2024.md"],
  "risk_tier": "billing_claim",
  "sla_minutes": 30
}
```

## Avoiding alert fatigue

A threshold set too aggressively doesn't fail loudly — it fails by training your reviewers to stop reading escalations carefully, because most of what lands in the queue turns out to be fine. That's the real cost of over-escalation, and it's worse than it sounds: once reviewers start rubber-stamping, the queue's actual signal-catching power drops toward zero even though the dashboard still shows every case "reviewed." Two concrete defenses:

- **Track reviewer overturn rate**, not just escalation volume. If reviewers agree with the draft answer on 95% of escalations, your threshold is too aggressive and is spending human attention on cases that didn't need it.
- **Route by trigger type, not into one undifferentiated queue.** A grounding failure and a low-semantic-entropy flag call for different reviewer expertise; a single mixed queue makes every case take longer to triage.

## Where it shows up

Support and billing systems, clinical documentation, legal drafting, and any pipeline feeding an automated downstream action (an approval, a payment, a record update) where a wrong automated answer is expensive to undo. It shows up less in exploratory or creative tools, where escalation overhead isn't worth paying and a lighter [UX disclosure](/learn/hallucinations/ux-of-uncertainty) of uncertainty is often enough.

## Watch out for

- **Setting the threshold once and never revisiting it.** Real escalation volume and overturn rate are the data that should retune it — see the antipattern of an [untuned threshold](/learn/hallucinations/production-antipatterns).
- **Escalating without enough context to resolve quickly.** A bare flag creates a queue nobody can act on without redoing the work from scratch.
- **One queue for every trigger type.** Mixing high-confidence-but-policy-flagged cases with genuinely low-confidence cases erodes reviewer trust in the whole system.

## Where next

[Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl) builds the router that turns a semantic-entropy score and guard results into exactly this ship/cite/escalate decision, with thresholds set from calibration data.

**Related:** [Escalation Design: Handing Off to a Human When Confidence Drops](/learn/hallucinations/escalation-design-for-uncertain-answers), [Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [A Taxonomy of Guardrails](/learn/hallucinations/guardrails-taxonomy), [Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl), [Worked Example: A High-Stakes Medical/Legal Deployment](/learn/hallucinations/high-stakes-case-study)
