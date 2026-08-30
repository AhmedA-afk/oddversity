---
title: "LLM-as-Judge for Faithfulness and Factuality"
track: "hallucinations"
status: live
summary: "Using a second model call to score an answer against a source or the world, decomposed into atomic claims with forced verdicts."
duration: "7 min read"
---

The cheapest way to check an answer is to ask another model whether it's any good. That sounds circular, and in some ways it is — but done with a specific rubric and forced claim-by-claim verdicts instead of a vague "does this look right," it's one of the most flexible detection tools available, because unlike self-consistency or NLI, a judge can apply real judgment to nuanced cases.

## What it is

LLM-as-judge means a separate model call that scores or labels an answer, rather than generating one. Two related but distinct jobs get lumped under this name, and it's worth keeping them apart:

- **Faithfulness** asks: does this answer only say what the source material actually supports? This is the [factual vs. faithfulness](/learn/hallucinations/factual-vs-faithfulness-distinction) question applied to detection — a judge checking faithfulness needs the source in front of it.
- **Factuality** asks: is this claim true in the world? No source is required; the judge is drawing on its own knowledge (or, better, a retrieval step) to evaluate the claim directly.

Conflating the two produces a judge that scores an unsupported-but-true claim as a failure, or a supported-but-false claim as a pass — know which question you're actually asking before you write the rubric.

## The mental model

The reliable version of this pattern doesn't ask for one holistic score. It decomposes the answer into atomic claims first, then forces a verdict on each one independently:

1. **Decompose.** Split the answer into individual, checkable statements — the same atomic-claim discipline used in [chain-of-verification](/learn/hallucinations/self-verification-chain-impl) and [retrieval-based fact checking](/learn/hallucinations/retrieval-based-factuality-check).
2. **Judge each claim against the rubric.** For faithfulness: supported / unsupported / contradicted, relative to the source. For factuality: true / false / uncertain.
3. **Force an explicit verdict per claim**, not a single 1–10 score for the whole answer. A single score hides which specific sentence is the problem and invites the judge to average away one bad claim against several good ones.

## Why it works this way

A holistic score is easy to get and hard to trust — "7/10, mostly accurate" tells you nothing actionable. Per-claim verdicts are harder to produce but map directly onto what happens next: an unsupported claim gets flagged or removed, a contradicted one gets corrected, and the ones marked supported ship as-is. This is the same reasoning behind [enforcing citations](/learn/hallucinations/citations-and-attribution) — a checkable unit is worth more than a confident summary judgment.

## A concrete example (shown)

Source paragraph (from a product FAQ):

```text
Returns are accepted within 30 days of delivery for a full refund.
Items must be unworn and in original packaging.
```

Answer being judged:

```text
You can return this item within 30 days for a full refund, and we'll
cover the return shipping cost.
```

A judge prompt forces claim-by-claim decomposition:

```text
Source:
{source}

Answer to evaluate:
{answer}

List each factual claim in the answer as a separate line, then for each
one output SUPPORTED, UNSUPPORTED, or CONTRADICTED based only on the
source above. Do not use outside knowledge.

Format:
Claim: <claim>
Verdict: <verdict>
Reason: <one sentence>
```

Output:

```text
Claim: Returns are accepted within 30 days for a full refund.
Verdict: SUPPORTED
Reason: Matches the source directly.

Claim: Return shipping cost is covered.
Verdict: UNSUPPORTED
Reason: The source says nothing about who pays for return shipping.
```

The unsupported claim is exactly the kind of confident, plausible-sounding addition a faithfulness check exists to catch — the answer isn't contradicting the source, it's adding something the source never said, which [NLI grounding](/learn/hallucinations/nli-entailment-grounding-check-impl) would label "neutral" rather than "entailed."

## Where it shows up

LLM-as-judge is the flexible middle ground in this module's toolkit: cheaper and more nuanced than a retrieval pipeline, more capable of handling genuinely ambiguous or context-dependent claims than a small NLI model, which is why it shows up again as the polling target in [Implementation: ChainPoll-Style Ensemble Judging](/learn/hallucinations/chainpoll-detector-impl) and as the scoring mechanism behind several benchmarks in Module 6's evaluation harnesses.

## Watch out for

- **Judge self-bias.** A judge from the same model family as the generator can share its blind spots and stylistic preferences, sometimes literally favoring answers that read like its own outputs. This gets quantified directly when you build an eval harness — see the bias measurements in Module 6.
- **Position bias.** When a judge compares two candidate answers side by side, the order they're presented in can shift the verdict independent of quality. Randomize order or judge one answer at a time against a fixed rubric rather than pairwise, where practical.
- **Fluency mistaken for correctness.** A judge is still a language model, and a smoothly-written wrong claim can read as more credible to it than an awkwardly-phrased correct one — the same effect covered in [why fluent text feels confident](/learn/hallucinations/why-fluent-text-feels-confident), just applied to the checker instead of the generator.

## Where next

For a cheaper, blunter first-pass faithfulness check that doesn't spend LLM tokens at all, see [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl). For turning a single judge call into a graded, more stable score, see [Implementation: ChainPoll-Style Ensemble Judging](/learn/hallucinations/chainpoll-detector-impl). For where this sits against every other technique on cost and coverage, see [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared).

**Related:** [Factual vs. Faithfulness: Two Different Failures](/learn/hallucinations/factual-vs-faithfulness-distinction), [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl), [Implementation: ChainPoll-Style Ensemble Judging](/learn/hallucinations/chainpoll-detector-impl), [Why Fluent Text Feels Confident](/learn/hallucinations/why-fluent-text-feels-confident), [Citations: Making Every Claim Traceable to a Source](/learn/hallucinations/citations-and-attribution)
