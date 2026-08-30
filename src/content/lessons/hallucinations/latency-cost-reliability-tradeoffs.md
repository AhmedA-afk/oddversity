---
title: "Deep Dive: Latency, Cost, and Reliability Tradeoffs"
track: "hallucinations"
status: live
summary: "Every reliability technique in this track has a real latency and token cost — this works through the arithmetic and where to spend the budget."
duration: "9 min read"
---

*This is a deep dive — optional depth for anyone tuning a production system's cost model, not required to follow the rest of the module.*

Every technique in this module adds real cost: extra model calls, extra retrieval round-trips, extra latency the user waits through. None of that is optional overhead you can wish away — it's the actual price of not shipping a hallucination. The question isn't whether to pay it, it's where.

## Why this needs its own arithmetic

It's tempting to reason about reliability techniques qualitatively — "verification is more expensive than a single pass" — and stop there. But the actual multiplier matters for a real budgeting decision, and the multipliers for different techniques aren't close to each other. Consider a single baseline generation call as your unit cost, call it 1×. Layered on top:

- **A single self-verification pass** ([self-verification techniques](/learn/hallucinations/self-verification-techniques)): one extra full generation call, reading the draft and producing a revision. Roughly **2×** the base cost and close to double the latency if run sequentially.
- **Semantic entropy via resampling** ([semantic entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification)): N extra generations (commonly 3–10) plus a clustering/entailment pass. At N=5, that's roughly **6×** the base generation cost, though the N generations can run in parallel so wall-clock latency doesn't multiply by 6 — it's closer to the slowest single generation plus the clustering pass.
- **The full claim-level fact-checking pipeline** ([fact-checking pipeline implementation](/learn/hallucinations/fact-checking-pipeline-impl)): one extraction call, then one retrieval and one judge call *per claim*. A five-claim answer is roughly **6–11×** the base cost, and this one is largely sequential per claim unless you batch it.

None of these numbers are universal — they depend on your specific prompts, model, and batching setup — but the relative ordering (single-pass guard < resampled detection < full fact-checking) holds across most stacks, and it's the ordering that should drive the budgeting decision below.

## The core move: spend the budget where the risk score says to

The single highest-leverage decision in this whole deep dive is: **don't run the same detection stack on every request.** The risk-scoring stage from the [architecture overview](/learn/hallucinations/reliability-architecture-overview) is nearly free (a classifier or rule set, sub-second, a small fraction of a generation call's cost) and its entire job is to decide how much of the expensive machinery below it actually needs to run.

A worked comparison across three risk tiers, using the multipliers above:

| Tier | Detection applied | Approx. cost multiplier vs. base | When |
|---|---|---|---|
| Low risk | None, or a lightweight output guard only | ~1.2× | Casual chat, brainstorming, low-stakes summarization |
| Medium risk | Single self-verification pass | ~2× | General factual Q&A, internal tools |
| High risk | Semantic entropy (N=5) + claim-level fact-check | ~10-15× | Medical, legal, financial, anything feeding an automated decision |

If your traffic is, illustratively, 70% low-risk, 20% medium-risk, and 10% high-risk, the blended cost multiplier across your whole system is:

```
0.70 × 1.2  = 0.84
0.20 × 2.0  = 0.40
0.10 × 12.5 = 1.25
                ----
blended ≈ 2.49× base cost across all traffic
```

Compare that to running the full high-risk stack on every request regardless of tier: a flat 12.5× across 100% of traffic — roughly five times more expensive for a system that, per the [architecture overview](/learn/hallucinations/reliability-architecture-overview), doesn't actually need that scrutiny on the 90% of requests where nothing is at stake. This is the arithmetic behind the [antipattern](/learn/hallucinations/production-antipatterns) of running expensive checks on every request regardless of risk — it isn't just wasteful, it's often literally an order of magnitude more expensive for no accuracy gain on the bulk of traffic.

## Latency has its own shape, separate from cost

Cost and latency don't move together. Resampling for semantic entropy is expensive in tokens but, run in parallel, adds roughly one generation's worth of wall-clock time, not five. The fact-checking pipeline is cheaper in raw multiplier but often more expensive in latency, because claim-by-claim retrieval-then-judge is naturally sequential unless you explicitly parallelize across claims. If your product has a hard latency budget (a chat UI where users won't wait more than a couple seconds), that constraint — not raw token cost — may be what rules out the fact-checking pipeline for anything but an async, non-blocking path (verify after shipping, then retroactively flag).

This is why the [escalation](/learn/hallucinations/escalation-human-in-the-loop) branch matters as a release valve: instead of forcing every high-risk request through the full synchronous stack, a system can ship a fast provisional answer to a queue for async verification and let escalation catch the cases where that verification disagrees — trading a small amount of after-the-fact correction risk for a latency budget that doesn't blow up on every request.

## Where to spend the budget, concretely

Given a fixed reliability budget (a token cap, a latency SLA, an infra cost target), the ordering that tends to pay off:

1. **Cheap risk scoring on 100% of traffic** — the classifier that decides everything downstream. This is non-negotiable overhead, and it's small.
2. **A lightweight output guard on medium-and-above risk** — the single-pass claim check from [input/output guardrails](/learn/hallucinations/input-output-guardrail-impl), cheap enough to run broadly.
3. **Resampled detection on high-risk only** — semantic entropy's cost is worth paying exactly where a wrong answer is expensive, not as a blanket default.
4. **The full fact-checking pipeline on the highest-risk tier, or async** — reserve the most expensive, most sequential technique for the smallest slice of traffic, or move it off the request path entirely.

Spending in the wrong order — say, running semantic entropy on every request but skipping the cheap risk classifier that would have told you 70% of that traffic didn't need it — is the single most common way teams overspend their reliability budget without buying proportional safety.

## The honest tradeoff you can't optimize away

There's a floor here: reliability techniques cost something, always, and there's no version of this system that's both maximally safe and free. What you're optimizing is where the marginal dollar or millisecond buys the most risk reduction — which is exactly why risk tiering, not a single global policy, is the right shape for this decision.

**Related:** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview), [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Implementation: An Automated Fact-Checking Pipeline](/learn/hallucinations/fact-checking-pipeline-impl), [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop), [Common Mistakes: Production Reliability Antipatterns](/learn/hallucinations/production-antipatterns)
