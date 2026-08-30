---
title: "Implementation: Deriving Confidence from Token Logprobs"
track: "hallucinations"
status: live
summary: "Pull per-token logprobs from the API and turn them into sequence- and span-level confidence scores that catch a fabricated detail."
duration: "7 min read"
---

[Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals) names token logprobs as the closer-to-real signal. This lesson builds the actual pipeline: pull them from the API, turn them into numbers you can threshold, and see where they mislead you.

## What we're building

A small toolkit that takes a model response with per-token log-probabilities and produces three things: a length-normalized sequence confidence, a per-span confidence for flagging specific claims, and a worked example showing a fabricated detail standing out numerically inside an otherwise-solid answer.

## Setup

Most hosted chat APIs that expose logprobs return, per generated token, the token string and its log-probability under the model's own distribution (and optionally the top-k alternatives it didn't pick). The shape looks like this:

```python
response = client.chat.completions.create(
    model="your-model",
    messages=[{"role": "user", "content": prompt}],
    logprobs=True,
    top_logprobs=3,
)

tokens = response.choices[0].logprobs.content
token_strings = [t.token for t in tokens]
token_logprobs = [t.logprob for t in tokens]     # natural log, always <= 0
top_alts = [t.top_logprobs for t in tokens]      # runner-up tokens, if you asked for them
```

Everything below works on `token_strings` and `token_logprobs` alone; `top_alts` comes back in Harden It.

## Build it

### Step 1: Sequence-level confidence, length-normalized

A raw joint probability — multiply every token's probability together — collapses toward zero as an answer gets longer, even if every single token was highly confident. That's the same reason [perplexity](/learn/maths-foundations/entropy-and-uncertainty) is defined as a *per-token* average rather than a running product: length shouldn't be punished as if it were uncertainty.

```python
import math
from statistics import mean

def sequence_confidence(token_logprobs: list[float]) -> float:
    """Geometric mean of per-token probabilities — length-normalized."""
    if not token_logprobs:
        raise ValueError("no tokens to score")
    return math.exp(mean(token_logprobs))
```

> **Why this step?** Without normalization, a correct 40-word answer can score "less confident" than a wrong 5-word answer purely because it has more tokens to multiply through. The geometric mean fixes that by asking "how confident was the model *on average, per token*," not "what's the probability of this exact sequence."

### Step 2: Span-level confidence, for flagging a specific claim

A single low-probability token buried in an otherwise-fluent answer is a real signal — but it only tells you something if you can point to *where*. Segment the answer (by sentence, or by a named span you already know matters — a date, a name, a number) and score each span with its minimum, not its mean.

```python
def span_confidence(token_logprobs: list[float], start: int, end: int) -> dict:
    span = token_logprobs[start:end]
    return {
        "mean_prob": math.exp(mean(span)),
        "min_prob": math.exp(min(span)),
    }
```

> **Why this step?** The mean smooths a single bad token away into a long run of confident ones. The minimum doesn't — it surfaces the single weakest link, which is usually exactly where a fabrication would show up.

### Step 3: See it separate a fact from a fabrication

Take an answer with a true core and one invented detail tacked on — a fictitious biographical aside, clearly labeled here as invented for the example, not a real claim:

> "Pale Fire was written by Vladimir Nabokov and published in 1962. He reportedly drew inspiration from a trip to Reykjavik."

Illustrative per-token logprobs (not from a real API call — chosen to show the shape you'd expect):

| Token | logprob | probability |
|---|---|---|
| ` Vladimir` | -0.04 | 0.961 |
| ` Nabokov` | -0.02 | 0.980 |
| ` published` | -0.03 | 0.970 |
| ` in` | -0.02 | 0.980 |
| ` 1962` | -0.06 | 0.942 |
| ` He` | -0.50 | 0.607 |
| ` reportedly` | -1.80 | 0.165 |
| ` drew` | -2.10 | 0.122 |
| ` inspiration` | -1.40 | 0.247 |
| ` a` | -0.20 | 0.819 |
| ` trip` | -2.60 | 0.074 |
| ` to` | -0.10 | 0.905 |
| ` Reykjavik` | -3.20 | 0.041 |

Run `span_confidence` on the factual span (first five rows) versus the invented span (last eight):

```python
factual = [-0.04, -0.02, -0.03, -0.02, -0.06]
invented = [-0.50, -1.80, -2.10, -1.40, -0.20, -2.60, -0.10, -3.20]

print(span_confidence(factual, 0, len(factual)))
# {'mean_prob': ~0.966, 'min_prob': ~0.942}
print(span_confidence(invented, 0, len(invented)))
# {'mean_prob': ~0.226, 'min_prob': ~0.041}
```

The minimum probability inside the invented span (0.041) is over 20x lower than the minimum in the factual span (0.942). That's the signal worth flagging — not the sentence's tone, which stayed perfectly smooth the whole way through, exactly as [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident) predicts.

## Run it

Wire a threshold onto `min_prob`: anything below, say, 0.15 in a span gets flagged for citation-checking or escalation before it ships.

```python
def flag_low_confidence_spans(spans: dict[str, list[float]], threshold: float = 0.15) -> list[str]:
    return [name for name, lps in spans.items() if math.exp(min(lps)) < threshold]

flag_low_confidence_spans({"factual_span": factual, "invented_span": invented})
# ['invented_span']
```

## Harden it

- **Tokenization noise.** A rare or non-English word (like "Reykjavik") can split into unusual subword pieces and score low probability purely because the tokenizer, not the fact, finds it unusual. Check the *margin* between the chosen token and the runner-up in `top_alts`, not just the raw probability — a token with low absolute probability but no strong competing alternative is a weaker uncertainty signal than one where a completely different token was nearly as likely.
- **Confident-but-wrong.** Logprob confidence measures how expected a token was under the model's training distribution — not whether the claim is true. A widely-repeated misconception can score just as high as a correct fact, because the model has seen it stated just as confidently, just as often. This is the sharpest limitation of this whole technique: it catches guessing, not memorized error. Pair it with grounding (see [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents)) rather than trusting it alone.
- **Phrasing vs. fact confusion.** A model can be low-probability on a token purely because of word choice ("drew" vs. "took"), not because the underlying fact is shaky. Token logprobs conflate these two kinds of uncertainty — [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive) is the fix for exactly this confusion.

## Extend it

Logprob confidence is one signal among several, cheapest to compute since it needs no extra generations — just API access that exposes logprobs. Combine it with resampling-based signals (semantic entropy, self-consistency) when you can afford the extra calls, and never treat a single signal's threshold as final without measuring it against labeled data first — see [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl).

**Related:** [Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals), [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident), [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive), [Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence), [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl)
