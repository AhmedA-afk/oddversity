---
title: "Cheatsheet: Production Reliability Checklist"
track: "hallucinations"
status: live
summary: "A one-page go-live checklist spanning risk scoring through incident response, with a recommended default for each stage."
duration: "6 min read"
---

Keep this open while you're deciding whether a system is actually ready to ship. Every row links back to the lesson that explains the reasoning — this page is the reference card, not the argument.

## The eight-stage checklist

Each default is a starting point, explicitly labeled — measure against your own traffic and calibration data before trusting it long-term.

| Stage | Start here, then measure | Lesson |
|---|---|---|
| **Risk scoring** | A cheap classifier or rule set on 100% of traffic, gating everything downstream | [Reliability Architecture](/learn/hallucinations/reliability-architecture-overview) |
| **Grounding** | Mandatory retrieval for any factual/numeric claim; empty retrieval is a hard escalation trigger, never a fallback to parametric answering | [Grounding with Source Documents](/learn/hallucinations/grounding-with-source-documents) |
| **Guardrails** | Input guard for false premises + output guard for claim-level grounding, on medium-risk and above | [A Taxonomy of Guardrails](/learn/hallucinations/guardrails-taxonomy), [Implementation](/learn/hallucinations/input-output-guardrail-impl) |
| **Detection** | Single self-verification on medium risk; semantic entropy (N=5) + full fact-checking on high risk only | [Semantic Entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Fact-Checking Pipeline](/learn/hallucinations/fact-checking-pipeline-impl) |
| **Confidence gate** | Two thresholds (cite-above, escalate-above) set from a real calibration curve, tiered per risk level | [Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl) |
| **UX disclosure** | Citations visible only when the tier required them; hedge language proportional to the actual score, never boilerplate | [The UX of Uncertainty](/learn/hallucinations/ux-of-uncertainty) |
| **Monitoring** | Escalation rate, guard-block rate, and a sampled faithfulness score, tracked daily with drift alerting against a rolling baseline | [Monitoring in Production](/learn/hallucinations/monitoring-hallucination-in-prod) |
| **Incident response** | A written playbook: contain narrowly, classify with the taxonomy, fix the classified cause, add a regression test | [Incident Response](/learn/hallucinations/incident-response-for-hallucination) |

## Risk tiering, quick reference

| Signal in the request | Tier | Default detection |
|---|---|---|
| Casual, no checkable claims, low stakes if wrong | Low | Lightweight output guard only |
| Factual but general-knowledge, moderate stakes | Medium | Single self-verification pass |
| Numeric, medical/legal/financial, feeds an automated decision | High | Semantic entropy + full fact-check + lowered escalation threshold |

See [hallucination risk factors](/learn/hallucinations/hallucination-risk-factors) for the full signal list this tiering is built from, and [latency, cost, and reliability tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) for why tiering — not a uniform policy — is what keeps the expensive checks affordable.

## The confidence gate, quick reference

```
guard failed                  -> escalate, always, regardless of uncertainty score
uncertainty >= escalate_above -> escalate
uncertainty >= cite_above     -> answer, citations required and displayed
uncertainty <  cite_above     -> answer directly
```

Thresholds come from a calibration curve (accuracy vs. coverage), not a guess — see [confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl) for how to read that curve and [calibration error and reliability diagrams](/learn/hallucinations/calibration-error-reliability-diagrams) for how to build it.

## Incident response, in five steps

1. **Contain** — narrow scope (a query pattern, a feature path), not a broad kill switch.
2. **Classify** — use [the taxonomy](/learn/hallucinations/what-is-a-hallucination) and [the decision tree](/learn/hallucinations/taxonomy-decision-tree): intrinsic or extrinsic, generation failure or enforcement gap.
3. **Fix** — target the classified cause, not the surface symptom.
4. **Regress** — add the exact case (and near variants) to the golden eval set.
5. **Close the loop** — confirm the fix shows up in the next CI run and in production monitoring.

Full playbook: [Incident Response When a Hallucination Ships](/learn/hallucinations/incident-response-for-hallucination).

## Go-live readiness, yes/no

- [ ] Risk scoring runs on every request and actually changes what happens downstream.
- [ ] No high-risk answer can ship on empty or thin retrieval.
- [ ] Input and output guardrails are independent code paths from generation, not baked into the same prompt.
- [ ] Escalation thresholds trace to a specific, recent calibration run.
- [ ] The UI renders the actual routing decision (citations, hedges, escalation framing) rather than a fixed template.
- [ ] Dashboards for escalation rate, guard-block rate, and sampled faithfulness are live, with drift alerting.
- [ ] A written incident response playbook exists and someone owns it.
- [ ] The reliability budget (latency, cost) is tiered by risk, not flat across all traffic.

## Related module cheatsheets

This module's checklist assumes you can already reach for the earlier reference cards when a stage needs more depth: the [foundations cheatsheet](/learn/hallucinations/foundations-cheatsheet) for the taxonomy itself, the [detection cheatsheet](/learn/hallucinations/detection-cheatsheet) for choosing a detector, the [uncertainty cheatsheet](/learn/hallucinations/uncertainty-cheatsheet) for calibration and confidence signals, the [mitigation cheatsheet](/learn/hallucinations/mitigation-cheatsheet) for grounding and prompting patterns, and the [evaluation cheatsheet](/learn/hallucinations/evaluation-cheatsheet) for building the golden set this whole checklist depends on.

**Related:** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview), [Common Mistakes: Production Reliability Antipatterns](/learn/hallucinations/production-antipatterns), [Capstone: Build a Reliability-Hardened QA System](/learn/hallucinations/capstone-trustworthy-qa-system), [Detection Cheatsheet](/learn/hallucinations/detection-cheatsheet), [Mitigation Cheatsheet](/learn/hallucinations/mitigation-cheatsheet)
