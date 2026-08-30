---
title: "Implementation: Confidence-Gated Escalation"
track: "hallucinations"
status: live
summary: "Build a router that answers, answers with required citations, or escalates, using thresholds set from calibration data."
duration: "8 min read"
---

Detection produces a number. Guardrails produce a pass or fail. Neither one is a decision by itself. This lesson builds the router that combines them into exactly one of three actions, and shows a low-confidence medical question taking the escalate branch instead of shipping a guess.

## What we're building

A `route(question, uncertainty_score, guard_result)` function implementing the confidence gate from the [architecture overview](/learn/hallucinations/reliability-architecture-overview): three outcomes — `answer_directly`, `answer_with_citations`, `escalate` — chosen by two thresholds calibrated on real data, not guessed.

## Setup

We assume two upstream signals already exist per request, both covered earlier in the track:

- `uncertainty_score`: a 0–1 semantic-entropy-style score from resampling (see [semantic entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification)), where higher means more disagreement across samples.
- `guard_result`: the output of the [claim-check guard](/learn/hallucinations/input-output-guardrail-impl), with `all_supported: bool`.

```python
from dataclasses import dataclass

@dataclass
class GuardResult:
    all_supported: bool
    flagged: list

@dataclass
class RouteDecision:
    action: str          # "answer_directly" | "answer_with_citations" | "escalate"
    reason: str
```

## Build it

### Step 1: pick thresholds from calibration data, not intuition

Suppose a calibration run — scoring a labeled eval set at a range of thresholds — produced this (illustrative) curve:

```text
uncertainty threshold | answered-set accuracy | coverage
0.20                  | 0.98                   | 0.55
0.35                  | 0.94                   | 0.72
0.50                  | 0.87                   | 0.86
0.65                  | 0.79                   | 0.94
```

For a domain where a wrong answer is costly, you'd pick the threshold where accuracy is still high and coverage hasn't yet collapsed — here, 0.35 trades a large coverage gain over 0.20 for a small accuracy cost, while 0.50 starts trading accuracy away faster than coverage improves. That inflection point, not a round number, is the actual threshold — see [escalation and human-in-the-loop design](/learn/hallucinations/escalation-human-in-the-loop) for the cost reasoning behind picking a point on this curve.

```python
ESCALATE_ABOVE = 0.50   # above this uncertainty, always escalate
CITE_ABOVE = 0.20       # between here and ESCALATE_ABOVE, require citations
```

### Step 2: fold in guard results, not just the uncertainty score

A low uncertainty score with a failed grounding check should still escalate — the two signals catch different failures, and neither should override the other.

```python
def route(uncertainty_score: float, guard_result: GuardResult) -> RouteDecision:
    if not guard_result.all_supported:
        return RouteDecision(
            action="escalate",
            reason=f"guard failed: unsupported claims {guard_result.flagged}",
        )

    if uncertainty_score >= ESCALATE_ABOVE:
        return RouteDecision(
            action="escalate",
            reason=f"uncertainty {uncertainty_score:.2f} >= {ESCALATE_ABOVE}",
        )

    if uncertainty_score >= CITE_ABOVE:
        return RouteDecision(
            action="answer_with_citations",
            reason=f"uncertainty {uncertainty_score:.2f} in cite band",
        )

    return RouteDecision(action="answer_directly", reason="low uncertainty, grounded")
```

> **Why this order?** The guard check runs first because a failed grounding check is a harder signal than a soft uncertainty score — it's not "the model seems unsure," it's "the model asserted something with no source," which should never be allowed to slip through just because resampled answers happened to agree.

### Step 3: wire it into the full pipeline

```python
def answer_request(question: str, retrieve_fn, generate_fn, resample_fn) -> dict:
    sources = retrieve_fn(question)
    draft = generate_fn(question, sources)

    samples = resample_fn(question, sources, n=5)
    uncertainty_score = semantic_entropy(samples)  # from Module 4's implementation
    guard_result = check_output(draft, sources)     # from the guardrail lesson

    decision = route(uncertainty_score, guard_result)

    if decision.action == "escalate":
        return {"status": "escalated", "reason": decision.reason, "draft": draft}
    if decision.action == "answer_with_citations":
        return {"status": "shipped", "answer": draft, "citations_required": True}
    return {"status": "shipped", "answer": draft, "citations_required": False}
```

## Run it

A low-confidence medical question:

```python
result = answer_request(
    "What's the recommended dosage adjustment for this drug in patients "
    "with a rare genetic variant affecting its metabolism?",
    retrieve_fn=my_retriever,
    generate_fn=my_generator,
    resample_fn=my_resampler,
)
# samples disagree on the number across resamples -> uncertainty_score ~0.61
# result: {"status": "escalated",
#          "reason": "uncertainty 0.61 >= 0.50",
#          "draft": "..."}
```

Instead of shipping whichever number happened to come out of one generation, the system routes to a human with the draft attached as a starting point — exactly the handoff shape from the [escalation lesson](/learn/hallucinations/escalation-human-in-the-loop).

## Harden it

- **Log every decision, not just escalations.** You need the full distribution of scores and actions to re-derive the calibration curve later — see [monitoring hallucination in production](/learn/hallucinations/monitoring-hallucination-in-prod).
- **Re-run calibration after any model or prompt change.** A threshold tuned for one model's uncertainty distribution doesn't transfer to another — this is the single most common cause of a monitored spike (see [monitoring](/learn/hallucinations/monitoring-hallucination-in-prod)) after a routine upgrade.
- **Never let `answer_with_citations` silently degrade to `answer_directly`** if citation generation fails — that band exists specifically because confidence is borderline; a missing citation there should escalate, not ship uncited.

## Extend it

- Add a fourth action, `answer_with_hedge`, for domains where an explicit uncertainty caveat in the UI is an acceptable middle ground short of a full human escalation — see [the UX of uncertainty](/learn/hallucinations/ux-of-uncertainty) for how to phrase it honestly.
- Make thresholds risk-tier-specific rather than global: a medical tier's `ESCALATE_ABOVE` should sit well below a general-knowledge tier's, following the risk scoring stage from the architecture overview.
- Feed `answered-set accuracy` and `escalation rate`, computed on a rolling window, into your dashboards — this is the measurable outcome that tells you whether the calibration you set is holding up in production.

**Related:** [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop), [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl), [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview)
