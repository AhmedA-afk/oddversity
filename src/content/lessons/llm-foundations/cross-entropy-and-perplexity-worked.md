---
title: "Computing Cross-Entropy and Perplexity by Hand"
track: "llm-foundations"
status: live
summary: "Walk through computing per-token loss, sequence loss, and perplexity for five predicted tokens, then interpret what the number means."
duration: "7 min read"
---

Loss curves are everywhere in pretraining logs, but "1.32 nats" doesn't mean much on its own. This lesson turns five predicted probabilities into a loss, then a perplexity, and interprets what that final number is actually telling you.

## The setup

Say a model has processed the prefix "the cat sat on the" and, via [teacher forcing](/learn/llm-foundations/the-pretraining-objective-and-loss), is being scored on the next five true tokens of a slightly longer continuation: "mat," "and," "began," "to," "purr." At each position the model outputs a full probability distribution over the vocabulary; suppose (illustrative numbers, not measured from any real model) the probability it assigned specifically to the correct next token at each position is:

| position | true next token | model's probability for that token |
|---|---|---|
| 1 | mat | 0.50 |
| 2 | and | 0.20 |
| 3 | began | 0.90 |
| 4 | to | 0.30 |
| 5 | purr | 0.05 |

These five numbers are all we need. Cross-entropy loss only cares about the probability mass the model put on the token that actually occurred — see [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss) for why.

## Step by step

### 1. Per-token cross-entropy

```python
import math

p = [0.50, 0.20, 0.90, 0.30, 0.05]
losses = [-math.log(pi) for pi in p]
losses
# [0.6931, 1.6094, 0.1054, 1.2040, 2.9957]
```

> **Why this step?** Cross-entropy loss is the negative log-probability the model assigned to the token that actually occurred. A confident, correct-leaning prediction (0.90) gives a tiny loss (0.105); a prediction that nearly missed (0.05) gives a large loss (2.996) — the logarithm makes the penalty grow sharply as the model's confidence points the wrong way.

### 2. Sequence loss (the average)

```python
sequence_loss = sum(losses) / len(losses)
sequence_loss
# 1.3215
```

> **Why this step?** Pretraining doesn't optimize any one token's loss — it optimizes the average over every position in every sequence in the batch. Averaging, rather than summing, keeps the loss comparable across sequences of different lengths, which matters once batches mix documents of wildly different sizes.

### 3. Convert to perplexity

```python
perplexity = math.exp(sequence_loss)
perplexity
# 3.749
```

> **Why this step?** Cross-entropy is measured in nats (or bits, with log base 2), which isn't an intuitive unit. Exponentiating converts "average surprise per token" back into something you can picture: a perplexity of 3.75 means the model's uncertainty at each position was, on average, comparable to picking uniformly among about 3.75 equally likely options — even though the real distribution at each position wasn't uniform at all.

## Where it breaks (+fix)

**Comparing perplexity across tokenizers is meaningless.** A model with a larger vocabulary and longer effective tokens can show a different perplexity for reasons that have nothing to do with how "good" it is — see [Vocab Size vs Sequence Length Tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff). Fix: only compare perplexity between models sharing the same tokenizer and evaluation set.

**A handful of tokens is a noisy sample.** Our toy example shows this directly: the single 0.05-probability token contributes almost half the total loss. One lucky or unlucky sequence can swing perplexity a lot. Fix: perplexity is only meaningful as an average over a large held-out set, not a handful of tokens.

### Interpreting perplexity 3 vs. perplexity 20

A perplexity around **3** (like our worked example) means the model is, on average, about as uncertain as choosing among three or four options — typical of a well-trained model on in-distribution text such as fluent prose or common code patterns, where structure heavily constrains what can come next.

A perplexity around **20** means the model's average uncertainty is more like choosing among twenty roughly-equally-likely options. You'd see numbers in that range on harder, more open-ended, or out-of-distribution text — a domain the model saw little of during pretraining, or text with genuinely unpredictable content like random identifiers. Neither number is "bad" in isolation: perplexity is domain-relative, so the corpus, the model, and the tokenizer all have to be fixed before a specific number means anything.

## Takeaways

- Cross-entropy loss is the negative log-probability of the actual next token, averaged over positions.
- Perplexity is `e^(average loss)` — the same information as loss, reshaped into an "effective number of choices" that's easier to reason about.
- Only compare perplexity within a fixed tokenizer and evaluation set; it has no fixed absolute meaning otherwise.

**Related:** [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss), [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty), [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai), [Vocab Size vs Sequence Length Tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff), [Logits to Probabilities by Hand](/learn/llm-foundations/logits-to-probabilities-by-hand)
