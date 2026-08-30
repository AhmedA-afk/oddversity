---
title: "Deep Dive: Detect-Then-Regenerate vs. Prevent-at-Source"
track: "hallucinations"
status: live
summary: "Working through the latency, cost, and recall math of catching hallucinations after generation versus constraining them before it."
duration: "8 min read"
---

You can spend your engineering effort in two places: stopping a hallucination before it's generated, or catching it after. This is optional depth on a question every reliability architecture eventually has to answer explicitly — where the two approaches actually trade off, and why most systems end up needing both rather than picking one.

## Optional depth: the two architectures, precisely

**Prevent-at-source** constrains generation itself so a class of hallucination structurally can't happen, or happens far less often — [RAG grounding](/learn/hallucinations/retrieval-augmented-mitigation), [constrained generation](/learn/hallucinations/constrained-generation-concept), and sharper prompting patterns all live here, in Module 5. The cost is paid once, upfront, on every single request, regardless of whether that particular request would have hallucinated anyway.

**Detect-then-regenerate** lets generation run freely, scores the output with a technique from this module, and on a flag, retries, escalates, or blocks. The cost is paid conditionally — only on the requests a detector actually flags — but it's paid *after* the fact, adding a full detection pass (and possibly a full regeneration) to the request's critical path.

These aren't really competing designs so much as two different places to spend a fixed amount of effort, and the right split depends on the shape of your specific failure.

## The two-stage retry loop, worked through

Call the fraction of ungrounded requests that would hallucinate without any intervention `h₀` — purely illustrative, say 10% for a task with no grounding at all. A detector has a **recall** `r`: the probability it catches a hallucination that's actually there. It also has a false-positive rate, but set that aside for a moment and focus on recall, since recall is what determines how much residual risk survives.

Run one retry round: generate, detect, and on a flag, regenerate and detect again. Assuming the regeneration has roughly the same base hallucination rate as the first attempt (a rough approximation — real systems can do better by varying the regeneration prompt, but the arithmetic below is illustrative, not exact):

- After the first pass: `h₀` of requests hallucinate, and the detector catches `r · h₀` of them, leaving `h₀ · (1 − r)` undetected plus `h₀ · r` correctly flagged.
- The flagged fraction regenerates. Of *those*, `h₀` again hallucinate on the retry, and again `r` of those get caught.
- After one full retry round, the fraction of requests that hallucinated on both attempts *and* slipped past detection both times is roughly `h₀ · (1 − r) + h₀ · r · h₀ · (1 − r)` — which simplifies to something close to `h₀ · (1 − r) · (1 + h₀ · r)`, dominated by the first term for small `h₀`.

The takeaway that survives the approximation: each retry round shrinks the residual risk by roughly a factor of `(1 − r)`, but it never reaches zero, because `r` is never 1. There's always some hallucination shape the detector structurally can't see — the same shared-belief blind spot from [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails) is exactly this: no amount of retrying with the same kind of detector closes a gap the detector was never able to see in the first place.

## The cost side of the same loop

Prevention pays a flat tax: every request pays the retrieval or constraint-checking cost, whether or not that specific request needed it. Detect-then-regenerate pays a variable tax: the base detection pass runs on every request, but the expensive part — a full regeneration plus a second detection pass — only fires on the fraction that actually gets flagged. If your flag rate is low, detect-then-regenerate can be cheaper in expectation than paying prevention's flat cost on every request. If your flag rate is high (a genuinely hard task, or a detector tuned aggressively), the retry loop's variable cost can exceed what prevention would have cost outright, and it does so while adding latency directly to the user-facing request instead of amortizing it into pipeline design.

Bounding the number of retries (most production systems cap it at one or two) keeps worst-case latency predictable, but it also caps how much the loop can shrink the residual risk — an unbounded number of retries would asymptotically approach the detector's recall ceiling, but no live request can afford to wait for that.

## Why recall has a ceiling that prevention doesn't share

This is the structural asymmetry worth internalizing: a detector's recall `r` is bounded by what signal sources it actually has access to — the [four signal sources](/learn/hallucinations/detection-landscape-overview) this module maps out. No retry loop can catch more than its detector's ceiling allows, no matter how many rounds you run. Prevention works differently — it doesn't try to catch a hallucination after the fact, it lowers `h₀` itself, shrinking the thing the detector would otherwise have to catch in the first place.

That's why combining both compounds rather than substitutes: grounding a generation in real source material (prevention) might cut `h₀` from 10% to something meaningfully lower, and *then* a detection pass with recall `r` catches a fraction of whatever's left. Prevention alone leaves the detector's imperfect recall unexercised on a smaller problem; detection alone is stuck applying an imperfect `r` to the full, unreduced `h₀`.

## Where the handoff actually sits

In a layered system, prevention lives before and during generation — grounding, constrained decoding, prompt design — and detection lives after a candidate output exists, which is everything in this module. The two meet at a specific point: the decision of what to do when a detector fires. That decision is itself a production guardrail choice — retry, escalate to a human, or block outright — covered in [Guardrails: A Taxonomy](/learn/hallucinations/guardrails-taxonomy) and [Escalation: Handing Off to a Human in the Loop](/learn/hallucinations/escalation-human-in-the-loop).

The honest recommendation: prevent what's cheap and structural to prevent — grounding factual answers, enforcing citations, constraining output format — because that reduces `h₀` for every request at a cost you pay once in design rather than repeatedly in retries. Detect what prevention can't structurally guarantee — open-ended claims, edge cases outside your retrieval corpus, agent tool-call arguments — because that's where a detection pass earns its cost. And route what detection can't resolve, meaning anything that stays flagged after your retry budget is exhausted, to a human rather than shipping a guess. [Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) works through this same layering with real production numbers attached.

**Related:** [Mitigation Tradeoffs, In Depth](/learn/hallucinations/mitigation-tradeoffs-deep-dive), [Guardrails: A Taxonomy](/learn/hallucinations/guardrails-taxonomy), [Escalation: Handing Off to a Human in the Loop](/learn/hallucinations/escalation-human-in-the-loop), [The Detection Landscape: What We Can and Can't Observe](/learn/hallucinations/detection-landscape-overview), [Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs)
