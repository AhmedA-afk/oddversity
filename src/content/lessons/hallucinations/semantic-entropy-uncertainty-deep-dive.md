---
title: "Deep Dive: Semantic Entropy, Uncertainty Over Meanings"
track: "hallucinations"
status: live
summary: "The rigorous version of semantic entropy: why token-string entropy overcounts paraphrases, and the maths of fixing it by clustering meaning."
duration: "8 min read"
---

*Optional depth. [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification) gives you the working idea; this lesson derives why it's built the way it is and states its guarantees and limits precisely.*

## The mechanism problem: entropy over strings overcounts paraphrase

[Entropy](/learn/maths-foundations/entropy-and-uncertainty) is defined over a distribution: `H(P) = -Σ p(x) log p(x)`, maximized when probability mass spreads evenly across outcomes. The natural way to apply it to a set of sampled answers is to treat each distinct string as an outcome and compute entropy over the string distribution. This is wrong for language, and it's wrong in a specific, correctable way: a model can be highly confident about a fact and still produce five distinct strings for it, because natural language has enormous surface freedom for saying the same thing. "Canberra is Australia's capital," "The capital of Australia is Canberra," and "Australia's capital city is Canberra" are three outcomes under naive string entropy and one outcome under any reasonable notion of *what was claimed*. Naive token-string entropy therefore systematically overstates uncertainty on exactly the cases where the model is most sure — the ones fluent enough to be phrased several different ways.

## The fix: cluster before you count

Semantic entropy (Kuhn et al.; published in *Nature* as Farquhar et al., 2024) replaces "outcome = string" with "outcome = meaning class," recovering the entropy calculation's original intent:

1. Sample the model N times at the same prompt, temperature > 0.
2. Partition the N samples into clusters `C_1 ... C_K` such that every pair of samples within a cluster is **bidirectionally entailed** — each implies the other, checked with a natural-language-inference model or an LLM-as-judge prompt. Two samples that say the same thing in different words land in the same cluster; two samples making different claims do not, no matter how similar the wording looks on the surface.
3. Estimate each cluster's probability. The simplest estimator is the sample proportion, `p(C_k) = count(C_k) / N`; the more precise formulation from the original paper instead sums the actual sequence probabilities (from the model's own logprobs) of the members of each cluster, which converges faster with fewer samples but requires logprob access that a black-box API might not expose.
4. Compute entropy over the cluster distribution: `H_semantic = -Σ p(C_k) log p(C_k)`.

## Worked numeric example

Five samples to the same prompt, entailment-clustered into two groups — three phrasings of one answer, two phrasings of a different one:

```text
Samples: A1, A2, A3  →  cluster A (mutually entailing), p(A) = 3/5 = 0.6
         B1, B2      →  cluster B (mutually entailing, not entailing A), p(B) = 2/5 = 0.4
```

```python
import math

def entropy_bits(probs: list[float]) -> float:
    return -sum(p * math.log2(p) for p in probs if p > 0)

entropy_bits([0.6, 0.4])   # ≈ 0.971 bits
```

`0.971` bits is close to the maximum possible for two outcomes (`1.0` bit, at an exact 50/50 split) — this is a model that is genuinely torn between two different claims, not one that's confidently varying its wording. Compare that to the confident case: five phrasings, one meaning.

```python
entropy_bits([1.0])        # 0.0 bits — one cluster, zero uncertainty
```

Naive token-string entropy on that same confident case would see five distinct strings and report something far from zero — the exact overcounting this method exists to remove. This is the numeric version of the "fabricated answer, high semantic entropy" claim made throughout this module: a genuinely unsure model produces samples that don't entail each other, and the entropy over *that* partition is high regardless of how fluent each individual sample sounds.

## Tradeoffs, stated precisely

- **Cost scales with N and with clustering.** N extra generations, plus up to O(N²) pairwise entailment checks if you cluster naively (greedy clustering against one representative per existing cluster brings this down to roughly O(NK), K = number of clusters found — see [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl) for the actual algorithm).
- **The entailment model is a dependency, not a ground truth.** Its own errors propagate directly into the entropy estimate — a lenient entailment check merges genuinely different claims into one cluster and understates uncertainty; an overly strict one splits true synonyms apart and overstates it. The choice of entailment model is itself a calibration decision, not a solved detail.
- **Cluster-count estimation from small N is noisy.** With only 5–10 samples, the empirical cluster proportions are a rough estimate of the true underlying distribution over meanings — enough to separate "clearly one answer" from "clearly several," weaker for fine distinctions in between.
- **It measures disagreement the model has, not error it doesn't know about.** Semantic entropy is zero whenever the model reliably reproduces the same wrong claim every time — sampling variance can only detect uncertainty that's actually present in the model's distribution. A confidently, consistently wrong model looks identical to a confidently, consistently right one under this metric. That failure mode needs external grounding, not resampling — see [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents).

## Why it earns the "state of the art, black-box" label

It requires nothing beyond a sampling API — no access to weights, no fine-tuning, no logprobs if you use the sample-proportion estimator — and it is the only signal in this module that directly targets uncertainty over *what was claimed* rather than over *how it was phrased* or *how expected each token was*. Token logprobs ([Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)) and plain [self-consistency](/learn/prompt-engineering/self-consistency-sampling) both conflate phrasing variance with meaning variance to some degree; semantic entropy is built specifically to not.

**Related:** [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty), [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl), [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs), [Self-Consistency: Voting Across Multiple Reasoning Paths](/learn/prompt-engineering/self-consistency-sampling)
