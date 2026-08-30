---
title: "Implementation: Eliciting Abstention Without Retraining"
track: "hallucinations"
status: live
summary: "Combine explicit permission to abstain with a hard semantic-entropy gate so a hosted model actually declines unanswerable questions."
duration: "7 min read"
---

[Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill) makes the case that "I don't know" needs a designed trigger, not just a hopeful prompt. This lesson builds that trigger for a hosted model you can't retrain: prompt-level permission as a soft nudge, backed by a hard external gate that actually enforces the decision.

## What we're building

A wrapper function that answers a question with a real model, but forces an "I don't know" response whenever an external uncertainty check — reusing the semantic entropy pipeline from [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl) — says the model is guessing, regardless of how confident the generated text sounds.

## Setup

Two prior pieces come together here: a system prompt that gives explicit permission to abstain and a rubric for what counts as sufficient evidence, and the `semantic_entropy` function already built:

```python
from semantic_entropy import semantic_entropy, bidirectional_entails_llm  # from the prior lesson

ABSTENTION_SYSTEM_PROMPT = """
You may say you don't know. If the provided context doesn't contain the
answer, or you are not confident based on well-established knowledge,
respond exactly with: INSUFFICIENT_EVIDENCE
Do not guess a specific-sounding answer (a number, name, date, or
citation) unless you can trace it to the provided context or to
knowledge you're confident is well-established. A vague but honest
answer beats a specific but unsupported one.
"""
```

## Build it

### Step 1: Give explicit permission, with a rubric

The prompt above does two things at once: it grants permission ("you may say you don't know") and it defines the bar for what counts as sufficient evidence, rather than leaving "confident enough" to the model's own unreliable introspection.

> **Why this step?** Permission alone measurably reduces fabrication (see [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know)), but it competes against a strongly trained habit of always producing an answer — it needs a backstop, not just an ask.

### Step 2: Sample and compute the external gate

```python
def confidence_gate(client, judge_client, question: str, n: int = 6, threshold_bits: float = 0.7) -> dict:
    samples = []
    for _ in range(n):
        resp = client.chat.completions.create(
            model="your-model",
            messages=[
                {"role": "system", "content": ABSTENTION_SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0.8,
        )
        samples.append(resp.choices[0].message.content.strip())

    entails = lambda a, b: bidirectional_entails_llm(judge_client, a, b)
    result = semantic_entropy(samples, entails)
    result["self_flagged"] = any(s.strip() == "INSUFFICIENT_EVIDENCE" for s in samples)
    result["gate_triggered"] = (
        result["self_flagged"] or result["entropy_bits"] > threshold_bits
    )
    result["samples"] = samples
    return result
```

> **Why this step?** This is the actual enforcement. The prompt's self-declared flag is one input; the semantic entropy over independently sampled answers is the other. Either one tripping is enough — the model doesn't get to talk itself out of a genuinely high-disagreement case.

### Step 3: Force the final answer

```python
def answer_with_abstention_gate(client, judge_client, question: str) -> str:
    gate = confidence_gate(client, judge_client, question)
    if gate["gate_triggered"]:
        return "I don't have reliable information to answer this confidently."
    # Otherwise, return the majority-cluster answer, not just the last sample.
    clusters = {}
    for s in gate["samples"]:
        clusters.setdefault(s, 0)
        clusters[s] += 1
    return max(clusters, key=clusters.get)
```

> **Why this step?** The gate decides *whether* to answer; it shouldn't also decide *which* sample to return by accident of ordering. Once the gate passes, return the most representative answer, not an arbitrary one.

## Run it

Before the gate, a single-shot call to an unanswerable long-tail question — an obscure regulatory detail the model has no reliable signal on — fabricates a specific-sounding answer, confidently, every time you ask it once. With the gate:

```python
result = confidence_gate(client, judge_client, "What was the exact attendance at [an obscure, undocumented local event]?")
print(result["entropy_bits"], result["gate_triggered"])
# entropy_bits: ~1.5+   gate_triggered: True

print(answer_with_abstention_gate(client, judge_client, "What was the exact attendance at [an obscure, undocumented local event]?"))
# "I don't have reliable information to answer this confidently."
```

Where previously a single generation would have picked one fabricated number and stated it plainly, the resampled set disagrees enough that the gate fires — the same mechanism worked numerically in [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive).

## Measure the coverage/accuracy shift

Run the gated version against a small labeled batch and compare to the ungated baseline — illustrative shape, not measured data:

| | Coverage | Accuracy on answered |
|---|---|---|
| No gate (answer everything) | 100% | ~65% |
| With abstention gate | ~70% | ~88% |

This is the accuracy/coverage tradeoff from [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill) made concrete: the gate trades away the roughly 30% of questions it can't confidently answer in exchange for a meaningfully higher accuracy rate on the rest.

## Harden it

- **Calibrate the threshold before locking it in.** `threshold_bits = 0.7` here is a starting point, not a validated cutoff — run [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl) against a labeled set to find where entropy actually predicts wrongness before shipping a specific number.
- **Don't let the abstention message sound useless.** "I don't have reliable information to answer this confidently" is a designed response, not an apology — pair it with a next step (search suggestion, escalation path) rather than a dead end, per the UX point in [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know).
- **Treat the prompt as a nudge, the gate as the enforcement.** At higher temperatures or under adversarial phrasing, the model may ignore the `INSUFFICIENT_EVIDENCE` instruction. The external entropy check is what actually holds the line — that's why `gate_triggered` doesn't depend solely on `self_flagged`.

## Extend it

Swap in the full NLI-based clustering from [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl) if the toy overlap-based entailment isn't precise enough for your domain. Wire this gate into the routing logic built in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage), where "abstain" becomes one of three lanes rather than the only alternative to answering.

**Related:** [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill), [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl), [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents)
