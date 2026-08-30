---
title: "Common Myths: 'Bigger Models Don't Hallucinate' and Other Errors"
track: "hallucinations"
status: live
summary: "Five beliefs that quietly remove guardrails from real systems, each paired with why it's wrong and what to do instead."
duration: "6 min read"
---

Every one of these five beliefs sounds reasonable, gets repeated in planning meetings, and directly causes someone to skip a check they needed. None of them are true as stated.

### The mistake: "Bigger or newer models don't really hallucinate anymore"

**Why it's wrong:** Scale improves accuracy on facts that are well-represented in training data, but it doesn't remove the underlying mechanism - the model is still sampling the most plausible continuation, not consulting a verified fact store (see [next-token-mechanics-of-fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication)). Bigger models still have a long tail of thin training signal; it's just shifted, not eliminated. A more capable model can also produce *more* convincing fabrications, since fluency scales with capability too.

**Symptom:** A team upgrades to a newer model and quietly removes the verification step that used to catch fabricated answers, reasoning "the new model is better, we don't need that anymore." Nobody re-measures the actual hallucination rate before making the cut.

**Fix:** Treat model upgrades as something that *changes* the rate, which you measure, not something that eliminates the need to check at all. See [is-hallucination-fixable](/learn/hallucinations/is-hallucination-fixable).

### The mistake: "Setting temperature to 0 stops hallucination"

**Why it's wrong:** Temperature controls how much randomness is injected when sampling from the model's probability distribution over next tokens - it doesn't change the distribution itself. If the highest-probability token at some step happens to be the wrong one, temperature 0 (greedy decoding) picks it every single time, deterministically. You've removed variance, not error.

**Symptom:** A team sets temperature to 0 for "factual" endpoints and stops worrying about fabrication, then notices the exact same wrong fact reproduced identically on every run - which can look reassuring ("at least it's consistent") while actually being worse, since the error is now perfectly stable and easy to miss in spot-checks.

**Fix:** Understand temperature as a decoding-time knob over an already-fixed distribution, not a truth control. Reducing fabrication requires changing what's feeding the distribution - grounding, retrieval - not just how it's sampled. See [why-fluent-text-feels-confident](/learn/hallucinations/why-fluent-text-feels-confident).

### The mistake: "This only happens on obscure topics, so common questions are safe"

**Why it's wrong:** Obscurity is one risk factor among several, not the only one. Well-known topics still carry hallucination risk wherever *precision* outruns what the training signal actually supports: exact quotes attributed to famous people, exact version numbers of popular software, exact dates for well-known events, or multi-step reasoning about a familiar subject where one wrong intermediate step compounds.

**Symptom:** A team only fact-checks answers about niche or unfamiliar subjects and waves through anything about a famous person, company, or well-known technology - missing a misattributed quote or a wrong release date sitting right in a "safe" answer.

**Fix:** Score risk on multiple axes - obscurity, recency, specificity demanded, verifiability - rather than fame alone. See [hallucination-risk-factors](/learn/hallucinations/hallucination-risk-factors).

### The mistake: "We added RAG, so hallucination is solved"

**Why it's wrong:** Retrieval only helps if the right document gets retrieved, the model reads it faithfully instead of overriding it with a memorized prior (see [parametric-vs-contextual-knowledge](/learn/hallucinations/parametric-vs-contextual-knowledge)), and the final answer is actually checked against what was retrieved. Any one of those three steps can fail silently, and the model can still hallucinate on top of correctly retrieved content by misreading, over-generalizing, or blending it with unrelated memorized facts.

**Symptom:** A team ships a RAG-backed assistant, removes all other verification on the theory that "it's grounded now," and later finds fabricated answers whenever retrieval missed the right chunk or the model paraphrased the source unfaithfully.

**Fix:** Treat RAG as reducing the surface area for hallucination, not eliminating it, and pair it with a faithfulness check between the final answer and the retrieved text. See [why-rag-still-hallucinates](/learn/hallucinations/why-rag-still-hallucinates).

### The mistake: "Hallucination is just the model lying to us"

**Why it's wrong:** Lying requires knowing the truth and choosing to say something else. A model has no internal channel that knows the correct answer and is suppressing it - see [hallucination-as-confident-guessing](/learn/hallucinations/hallucination-as-confident-guessing). Framing it as lying pushes teams toward the wrong fixes: hunting for "why is it being dishonest" instead of addressing the structural cause, or concluding the system can't be trusted at all rather than treating hallucination as a rate that can be measured and driven down.

**Symptom:** Post-incident discussions anthropomorphize the failure ("it decided to make that up") and either propose fixes aimed at intent the model doesn't have, or overcorrect into distrusting the system wholesale instead of adding targeted grounding and abstention.

**Fix:** Reframe it as a systems and statistics problem - a mechanism that produces confident, unsupported output at a measurable rate, addressed with grounding, calibration, and abstention rather than an appeal to honesty. See [hallucination-vs-error-vs-bug](/learn/hallucinations/hallucination-vs-error-vs-bug).

## Pre-flight checklist

- [ ] Did you re-measure the hallucination rate after a model upgrade, rather than assuming "newer means fixed"?
- [ ] Does your pipeline rely on low temperature as a safety measure anywhere? It isn't one.
- [ ] Are you fact-checking based on topic obscurity alone, or on the full set of risk factors (recency, specificity, verifiability)?
- [ ] If you use RAG, do you verify the *final answer* against the retrieved text, not just confirm that retrieval ran?
- [ ] Does your team's language around failures ("it lied," "it hallucinated") point toward a fix, or toward blame?

**Related:** [Is Hallucination Fixable in Principle?](/learn/hallucinations/is-hallucination-fixable), [Why RAG Still Hallucinates](/learn/hallucinations/why-rag-still-hallucinates), [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [A Fluent Guess With No 'I'm Unsure' Signal](/learn/hallucinations/hallucination-as-confident-guessing)
