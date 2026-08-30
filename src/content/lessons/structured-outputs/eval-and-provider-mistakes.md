---
title: "Evaluation and Portability Mistakes"
track: "structured-outputs"
status: live
summary: "Five ways an eval or a multi-provider setup quietly stops measuring what you think it measures, and the fix for each."
duration: "8 min read"
---

Every mistake below produces a system that looks fine on its own dashboard. That's what makes them worth cataloging separately from an ordinary bug — nothing crashes, nothing errors, the numbers just stop meaning what you think they mean.

### The mistake: gold-set examples leak into the prompt

**Why it's wrong:** the moment a gold document (or something close enough to count) shows up as a few-shot example, a prompt-debugging snippet, or a "here's a tricky case, handle it like this" instruction, your eval is no longer measuring generalization. It's measuring whether the model can reproduce an answer it was effectively handed.

**Symptom:** field accuracy and exact-match look strong and stable, but production accuracy on genuinely new documents runs meaningfully behind what the eval reported — and nobody can explain the gap because the eval "passed."

**Fix:** keep the gold set and the prompt-development set physically and procedurally separate. If a document is useful enough to want in a prompt example, retire it from gold permanently rather than using it in both roles — see [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) for the exam-versus-study-guide framing this comes from.

### The mistake: shipping on valid-rate alone

**Why it's wrong:** valid-rate answers "did it parse," which modern constrained decoding makes close to a given. Reporting it as "success rate" implies a claim about correctness that it never measured — a JSON object with a confidently wrong `total` is a valid-rate pass and a field-accuracy failure at the same time.

**Symptom:** a dashboard showing 99%+ "success," while support tickets or downstream data-quality reports keep surfacing specific wrong values in fields that were never individually checked.

**Fix:** report all four metrics from [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics) together, always — never valid-rate in isolation on anything that reaches a stakeholder or a launch decision.

### The mistake: hard-coupling code to one provider's quirks

**Why it's wrong:** logic like "optional fields are just absent" (true on some tool-calling APIs, false under another provider's strict mode) or "the response is always already-parsed JSON" gets written once, works fine against the provider in front of you, and becomes load-bearing without anyone noticing it's provider-specific.

**Symptom:** a provider swap, an eval comparing two models, or a fallback path during an outage breaks in a way that has nothing to do with model quality — it breaks because normalization code assumed one provider's response shape everywhere.

**Fix:** push every provider-specific assumption into an adapter's `request`/`normalize` pair, as in [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code), and treat any provider-specific `if` statement found outside that boundary as a bug to relocate, not a convenience to keep.

### The mistake: chasing accuracy with no eye on cost

**Why it's wrong:** field accuracy and cost are two different axes, and a change that improves one can quietly move the other in a direction nobody signed off on — a longer, more detailed prompt, a stronger (and pricier) model, or extra repair-loop retries can each buy a percentage point of accuracy while multiplying token spend well past what that point was worth.

**Symptom:** accuracy dashboards trend upward release over release while nobody notices the per-extraction cost climbed alongside it, until a monthly bill or a latency complaint forces the question.

**Fix:** log cost and latency next to every accuracy number in the eval report, and treat an accuracy gain as a decision made against a cost budget, not a free win — the same way [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) should log both, not just pass/fail.

### The mistake: treating a single eval run as ground truth

**Why it's wrong:** an eval computed once, at nonzero sampling temperature, on a gold set small enough for a handful of flips to move the headline number, is itself a noisy measurement — not the fixed reference point it gets treated as.

**Symptom:** a regression gate that flags a change as "worse" (or "better") on one run, only to look unremarkable when re-run — flaky enough that engineers start ignoring gate failures altogether, which defeats the point of having one.

**Fix:** run more than once and report the spread, and size margins around real sampling noise rather than a single point estimate — the derivation in [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts) works through exactly this.

### The mistake: letting the gold set go stale

**Why it's wrong:** a gold set frozen at launch reflects the document distribution of that moment. Real inputs drift — new vendors, new formats, a locale you didn't have coverage for — and a static gold set stops being representative of what the pipeline actually sees, silently, with nothing in the eval report to flag it.

**Symptom:** eval scores stay flat and reassuring release over release while [production monitoring](/learn/structured-outputs/monitoring-structured-output-in-production) shows real field-value drift or a rising invalid-rate on live traffic that the eval never picks up.

**Fix:** refresh the gold set on a real cadence, feeding in edge cases discovered in production monitoring — the eval and the live signals should inform each other, not run as two disconnected systems.

## Pre-flight checklist

- No gold-set document, or a close paraphrase of one, appears anywhere in a prompt, a few-shot example, or debugging notes.
- Every reported eval number includes all four metrics — valid-rate, schema-conformance, field accuracy, exact-match — never valid-rate alone.
- Every provider-specific assumption lives inside an adapter's `request`/`normalize` methods, never in shared extraction or validation code.
- Cost and latency are logged next to every accuracy number, on every eval run.
- Regression comparisons account for sampling noise — multiple runs or a margin sized to real variance, not a bare "any decrease fails."
- The gold set has a refresh cadence and a path for production-discovered edge cases to enter it.

**Related:** [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset), [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code), [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts), [Monitoring Structured Output in Production](/learn/structured-outputs/monitoring-structured-output-in-production)
