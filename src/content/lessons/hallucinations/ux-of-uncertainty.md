---
title: "The UX of Uncertainty: Showing Sources and Hedges"
track: "hallucinations"
status: live
summary: "How confidence and sources actually reach a user — and why a good detector wired to a bad UI still ships false confidence."
duration: "6 min read"
---

A system can do everything right upstream — ground the answer, verify the claims, compute a real uncertainty score — and still mislead the user, because none of that machinery is visible if the interface presents every answer with the same flat, confident tone. Presentation isn't decoration on top of reliability. It's a stage of it.

## What it is

The UX of uncertainty is the design layer that translates internal signals — a confidence score, a citation, an escalation decision — into something a user actually sees and can act on differently depending on what it says. It's the last hop in the pipeline from the [architecture overview](/learn/hallucinations/reliability-architecture-overview): everything upstream can be correct, and this layer can still throw the value away by rendering a low-confidence, escalated answer identically to a well-grounded one.

## The mental model

There are two ways to fail here, and they pull in opposite directions:

- **False confidence** — presenting every answer with the same assured tone regardless of the underlying score, so a user has no way to tell a well-grounded claim from a shaky one without independently fact-checking everything.
- **Paralyzing over-hedging** — wrapping every sentence in "it's possible that," "I'm not entirely sure," "this may not be accurate" regardless of how solid the answer actually is, until the hedging becomes noise the user learns to ignore, which defeats the point just as thoroughly as false confidence does.

Good uncertainty UX sits between these: hedge language that's proportional to the actual signal, so when a real caveat appears it still carries weight.

## Why it works this way

Hedging that doesn't move with the underlying confidence score trains users to stop reading it. If an assistant appends "I might be wrong about this" to every single answer, including the ones a real detector scored as high-confidence and fully grounded, the phrase becomes decoration — and then the one time it's attached to a genuinely uncertain answer, nobody notices. The [confidence-gated router](/learn/hallucinations/confidence-gated-escalation-impl) already computed three distinct tiers — answer directly, answer with required citations, escalate — precisely so the UI has something real to differentiate on. Uncertainty UX means those tiers stay visibly distinct: only the citation-required tier shows citations prominently, only escalated cases show the "let me get you a person" framing, and the confident tier reads like a confident tool giving a confident answer.

## A concrete example

**Bad**: flat presentation regardless of tier.

```
Q: What's the maximum daily dose of this medication for a patient
   with reduced kidney function?
A: The maximum daily dose is 2000mg, adjusted for renal function.
```

No indication of whether this came from a verified source, a borderline resample, or pure model recall. A user has no signal to act on differently.

**Good**: presentation tracks the actual routing decision.

```
Q: What's the maximum daily dose of this medication for a patient
   with reduced kidney function?
A: Based on the current formulary [renal-dosing-guide-v2, §4.3]:
   maximum 1000mg/day for creatinine clearance under 30 mL/min.

   ⚠ This is a borderline case — the source doesn't specify a value
   for clearance between 30–40 mL/min. Recommend pharmacist review
   before charting.
```

The second version isn't just "more honest text" bolted onto the same answer — it's a direct rendering of the guard result and the confidence-gate decision from earlier stages: a citation because the tier required one, an explicit caveat because the specific value fell into a gap the source didn't cover, and a concrete next action (pharmacist review) rather than a vague "I'm not sure." That's the pattern from [escalation and human-in-the-loop design](/learn/hallucinations/escalation-human-in-the-loop) surfacing in the interface instead of staying invisible inside a backend routing decision.

## Where it shows up

Anywhere an answer's confidence varies meaningfully across requests — which is almost everywhere once you've built the detection layer in this track. It matters most in tools used by professionals who will act on the answer (clinical, legal, financial) and in consumer products where trust erodes fast the first time confident phrasing turns out to be wrong. It matters least in narrow, low-stakes utility tasks where every answer is roughly equally reliable and there's nothing for the UI to differentiate.

## Watch out for

- **Divorcing the UI tier from the actual routing decision.** If the confidence gate computed `answer_with_citations` but the frontend renders every response the same way, the backend work is wasted — wire the UI to the decision object, not a separate guess.
- **Hedging language that never varies with the score.** A boilerplate disclaimer on every response is noise, not honesty, and it costs you the one time the disclaimer actually mattered.
- **Treating "show a source" as sufficient.** A citation the user can't actually verify quickly (a vague "according to internal docs" with no pointer) doesn't function as a real check — see [citations and attribution](/learn/hallucinations/citations-and-attribution) for what makes a citation checkable rather than decorative.

## Where next

The UX layer is downstream of every routing decision this module builds — [confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl) is what it needs to render faithfully. The [production reliability cheatsheet](/learn/hallucinations/production-reliability-cheatsheet) includes a default recommendation for disclosure UI alongside every other stage.

**Related:** [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop), [Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl), [Citations: Making Every Claim Traceable to a Source](/learn/hallucinations/citations-and-attribution), [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals)
