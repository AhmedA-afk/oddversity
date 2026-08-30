---
title: "Reliability Architecture: Wiring the Pieces Together"
track: "hallucinations"
status: live
summary: "The full production pipeline that turns detection, grounding, and escalation from separate techniques into one system."
duration: "7 min read"
---

Every earlier lesson in this track hands you one piece: a way to ground an answer, a way to detect when the model is guessing, a way to escalate when it is. None of them tell you how those pieces fit into one request. This lesson does — it's the blueprint the capstone builds.

## What it is

A reliability architecture is the wiring diagram that turns a bare model call into a production QA system. It's not a new technique — every box in it is something you've already seen in this track. What's new is the order, the branch points, and the rule for when each box even runs. Six stages, in sequence:

1. **Risk scoring** — before anything expensive happens, classify how dangerous this request is. A question about a recipe substitution and a question about drug interactions don't deserve the same amount of machinery.
2. **Retrieval and grounding** — pull relevant source material and constrain generation to it, per [grounding with source documents](/learn/hallucinations/grounding-with-source-documents).
3. **Generation** — the model produces a draft answer, ideally with citations baked in rather than bolted on after.
4. **Detection** — run the appropriate uncertainty or verification check for this risk tier: [semantic entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [self-verification](/learn/hallucinations/self-verification-techniques), or a fact-checking pass.
5. **Confidence gate** — combine the detection signal with guardrail results into one decision: ship, ship-with-citations-required, or escalate.
6. **Escalation** — for anything that doesn't clear the gate, route to a human with enough context to resolve it fast, per [escalation design](/learn/hallucinations/escalation-design-for-uncertain-answers).

## The mental model

Think of it as a series of increasingly expensive filters, each one only running if the previous one didn't already resolve the request cheaply. Risk scoring is nearly free — a classifier or a rule set that runs in milliseconds. Grounding and generation are the cost you're paying anyway to produce an answer. Detection is where cost starts to vary a lot, from a single self-check to ten resampled generations. Escalation is the most expensive per-case (a human's time) but the rarest, if the earlier stages are doing their job.

The architecture only works if risk scoring actually gates what happens downstream — every request paying for the full detection stack regardless of risk is the single most common way teams burn their reliability budget on the wrong requests. See [latency, cost, and reliability tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) for how to actually spend that budget.

## Why it works this way

Each stage exists to catch a failure the stage before it can't. Grounding reduces how often the model has to rely on parametric memory, but it doesn't eliminate [misreading a source](/learn/hallucinations/why-rag-still-hallucinates) or dropping a citation under load — detection catches that. Detection tells you a claim is shaky, but a raw uncertainty score isn't a decision — the confidence gate turns a number into ship-or-hold using thresholds set from real [calibration data](/learn/hallucinations/calibration-error-reliability-diagrams), not intuition. And escalation exists because some fraction of requests are genuinely outside what the system can safely answer — pretending otherwise is how a hallucination reaches a user instead of a reviewer.

Pulling any one stage out doesn't just weaken the system proportionally — it tends to fail silently, because the stages after it were built assuming it ran. Skip grounding and your detector is now trying to catch pure parametric guessing, a much harder job than catching a misread citation.

## A concrete example

A user asks a clinical-documentation assistant: "What's the max daily dose of metformin for a patient with reduced kidney function?"

```
1. Risk score: high (medical, dosage, numeric claim) -> full stack required
2. Retrieval: pull the relevant dosing guideline section (renal adjustment table)
3. Generation: draft answer with inline citation to the retrieved table
4. Detection: resample 3x -> answers agree on the number and the citation (low semantic entropy)
   AND a claim-level grounding check confirms the number appears in the cited source
5. Confidence gate: low uncertainty + grounded citation + high-risk tier
   -> still requires citation display, does NOT auto-escalate
6. Escalation: not triggered; answer ships with the citation visible and a note
   to confirm against the patient's full chart
```

Change one input — the retrieved table doesn't cover this patient's specific renal stage — and detection now flags an ungrounded claim. The confidence gate routes to escalation instead of shipping a plausible-sounding number. That branch is the entire point of the architecture: the same request, with one fact missing, takes a different path instead of the same confident answer.

## Where it shows up

This shape applies anywhere the cost of a wrong answer is higher than the cost of a slower one: clinical and legal assistants (see the [worked case study](/learn/hallucinations/high-stakes-case-study)), financial summarization, customer-facing support bots handling account or billing claims, and internal tools that feed into downstream automated decisions. It applies less to low-stakes creative or brainstorming tasks, where the escalation and detection overhead isn't worth paying — one reason risk scoring is stage one, not an afterthought.

## Watch out for

- **Treating detection and guardrails as the same thing.** Detection estimates uncertainty; guardrails enforce hard rules. You need both — see the [guardrails taxonomy](/learn/hallucinations/guardrails-taxonomy) for where each one sits.
- **Building the escalation path last.** A flagged answer with nowhere to go is worse than no flag — the [escalation lesson](/learn/hallucinations/escalation-human-in-the-loop) covers the handoff, not just the trigger.
- **No feedback loop.** An architecture with no monitoring can silently degrade after a prompt or model change — see [monitoring in production](/learn/hallucinations/monitoring-hallucination-in-prod).

## Where next

The rest of this module fills in each box: [guardrail types](/learn/hallucinations/guardrails-taxonomy) and their [implementation](/learn/hallucinations/input-output-guardrail-impl), the [fact-checking pipeline](/learn/hallucinations/fact-checking-pipeline-impl), [escalation design](/learn/hallucinations/escalation-human-in-the-loop) and its [confidence-gated router](/learn/hallucinations/confidence-gated-escalation-impl), and the operational layer of [monitoring](/learn/hallucinations/monitoring-hallucination-in-prod) and [incident response](/learn/hallucinations/incident-response-for-hallucination). The [capstone](/learn/hallucinations/capstone-trustworthy-qa-system) asks you to build this whole diagram as one working system.

**Related:** [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Escalation Design: Handing Off to a Human When Confidence Drops](/learn/hallucinations/escalation-design-for-uncertain-answers), [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output), [Capstone: Build a Reliability-Hardened QA System](/learn/hallucinations/capstone-trustworthy-qa-system)
