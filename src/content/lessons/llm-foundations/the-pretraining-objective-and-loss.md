---
title: "The Pretraining Objective and Its Loss"
track: "llm-foundations"
status: live
summary: "Pretraining minimizes one number — average next-token cross-entropy — computed at every position in a corpus at once via teacher forcing."
duration: "6 min read"
---

Everything a base model "knows" comes from optimizing a single scalar, over and over, across a corpus too large for any person to read. Pinning down exactly what that scalar measures — and what it doesn't — explains a lot about what training a model can and can't do.

## What it is

Pretraining minimizes the average cross-entropy loss between the model's predicted next-token distribution and the actual next token, across every position in every document in the corpus. In code-shaped terms:

```
loss = -(1 / N) * sum_{i=1}^{N} log P(token_i | token_1, ..., token_{i-1})
```

where `N` is the total number of tokens processed. This is the same [next-token prediction](/learn/llm-foundations/next-token-prediction) mechanism from Module 1, just stated as the thing being minimized rather than the thing being computed at inference. See [Pretraining Explained](/learn/llm-foundations/pretraining-explained) for the higher-altitude view of the stage this loss drives.

Crucially, this loss is computed with **teacher forcing**: the model is fed the actual preceding tokens from the training document — not its own guesses — when predicting each next one. That's what makes it possible to compute the loss at every position of a sequence in a single parallel forward pass, rather than one token at a time.

## The mental model

Picture one training document run through the model once. Causal masking ensures position `i`'s prediction can only see tokens `1..i`, so every position in the sequence produces an independent training signal within that same forward pass. A 2,048-token document gives you up to 2,048 loss terms per pass, not one. That parallelism — not any cleverness about "understanding" — is why pretraining on trillions of tokens is tractable at all.

## Why it works this way

If you trained by having the model generate its own next token and continue from there, an early wrong guess would corrupt every later position's input — an error-compounding problem you'd fight for the whole sequence. Teacher forcing sidesteps that during training by always supplying the ground-truth prefix, at the cost of a mismatch: the model never practices, during training, the exact thing it has to do at inference — recover from its own mistakes. That gap is one root of the drift you sometimes see in long generations, and it's a large part of why *training-time* behavior and *inference-time* behavior aren't the same thing.

## A concrete example (shown)

Take "the cat sat on the mat." At each position the model sees the true prefix and produces a distribution over the vocabulary; the loss at that position is just the negative log of whatever probability it assigned to the actual next word:

| position | context (prefix) | true next token | loss = −log(P(true token)) |
|---|---|---|---|
| 1 | "the" | "cat" | small if confident, large if not |
| 2 | "the cat" | "sat" | — |
| 3 | "the cat sat" | "on" | — |
| 4 | "the cat sat on" | "the" | — |
| 5 | "the cat sat on the" | "mat" | — |

Average those five numbers and you have the sequence's contribution to the batch loss. [Computing Cross-Entropy and Perplexity by Hand](/learn/llm-foundations/cross-entropy-and-perplexity-worked) works through the actual arithmetic for a similar five-token stretch, including converting the loss to perplexity.

## Where it shows up

- Every training run's logged "loss" curve is exactly this number plotted against training step; a healthy pretraining run shows it falling smoothly, then flattening.
- The identical computation, with a mask applied to the prompt tokens, becomes the loss in [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics) — SFT doesn't invent a new objective, it reuses this one on a narrower slice of tokens.
- Held-out validation loss (computed on text the model never trained on) is the standard signal for whether a model is generalizing rather than memorizing — a widening gap between train and validation loss is the classic overfitting signature.

## Watch out for

1. A falling loss number is not the same as "understanding" or "correctness." It only means the model's predicted distribution is putting more mass on whatever token actually came next — which can be gamed by memorizing near-duplicate passages in the corpus.
2. You can't compare raw loss values across models with different tokenizers or vocabulary sizes. A larger vocabulary changes the baseline difficulty of the prediction problem, so match tokenizers (or use a normalized metric) before comparing.
3. Low pretraining loss says nothing about whether the resulting model will be a good assistant. That behavior comes from what happens *after* pretraining, not from squeezing this one number lower — see [From Base Model to Assistant](/learn/llm-foundations/from-base-model-to-assistant-pipeline).

## Where next

The loss defines what's optimized; the next lessons in this module cover what actually gets fed into it ([What the Internet Actually Teaches a Model](/learn/llm-foundations/what-the-internet-teaches-a-model)) and how the corpus behind it gets built ([Inside the Pretraining Data Pipeline](/learn/llm-foundations/pretraining-data-pipeline)).

**Related:** [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [Pretraining Explained](/learn/llm-foundations/pretraining-explained), [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), [Computing Cross-Entropy and Perplexity by Hand](/learn/llm-foundations/cross-entropy-and-perplexity-worked), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [From Base Model to Assistant](/learn/llm-foundations/from-base-model-to-assistant-pipeline)
