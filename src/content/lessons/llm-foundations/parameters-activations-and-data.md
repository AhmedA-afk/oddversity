---
title: "Parameters, Activations, and Data: Three Things People Confuse"
track: "llm-foundations"
status: live
summary: "Why weights, activations, and training data are three different things with three different lifespans."
duration: "6 min read"
---

"Does the model still have access to its training data?" is one of the most common questions asked about LLMs, and the honest answer — no, not in any form — only makes sense once you separate three things that get casually lumped together as "what the model knows."

## What it is

Three distinct things live at three different points in an LLM's life, and mixing them up is where most confusion about "what the model knows" or "what it remembers" comes from:

- **Parameters (weights):** the numbers learned during training — every embedding row, every attention and FFN matrix. Fixed once training ends; identical on every single call to the model until it's retrained or fine-tuned.
- **Activations:** the intermediate tensors computed *during* one forward pass — the `(seq_len, 768)` hidden states at each block boundary from [the forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks), the attention scores, the FFN's expanded hidden layer. Computed fresh for every input, discarded the moment that call finishes.
- **Training data:** the raw text corpus the model was trained on. Present only during training; gone — not stored anywhere in the deployed model — by the time you're using it.

## The mental model

Think of parameters as a recipe, activations as the ingredients being actively mixed in a bowl right now, and training data as the cookbook the recipe was distilled from years ago and since thrown away. You can cook the same recipe a thousand times (a thousand forward passes, same weights every time); each time produces its own fresh bowl of ingredients-in-progress (new activations, discarded after that one meal); and none of those thousand meals require the original cookbook to still exist, because the recipe already captured what mattered from it.

## Why it works this way

Separating these three is what makes inference cheap and repeatable. If the model had to consult its training data on every call, inference cost would scale with corpus size, not model size — completely impractical. Instead, training does the (very expensive, one-time) work of compressing patterns from the corpus into a fixed-size set of weights; every later call is just arithmetic over those fixed numbers plus whatever input you supply, which is exactly what makes the same deployed model equally fast whether it's user number 1 or user number one million.

## A concrete example (shown)

Take a GPT-2-small-shaped model (the exact arithmetic is in [reading a real model's config](/learn/llm-foundations/reading-a-real-model-config)):

| Thing | What it is | Rough size | Present at inference? |
|---|---|---|---|
| Parameters | ~124M learned numbers (embeddings, attention, FFN weights) | ~250MB stored as 16-bit floats | Yes — loaded once, reused for every request |
| Activations for one 5-token input | hidden states, attention scores, FFN intermediates at each of 12 blocks | a few megabytes, freed right after the forward pass | Yes, but transient — recomputed from scratch on the next request |
| Training data | the text corpus used to learn the weights | commonly hundreds of billions of tokens — many orders of magnitude larger than the model itself | No — nothing from it is retrievable verbatim from the deployed weights |

The size gap in that last row is the point: a training corpus vastly larger than the model gets compressed down into a few hundred megabytes of weights, and once that compression happens, the original text is gone. The model does not contain a hidden copy of the internet.

## Where it shows up

This is the entire distinction behind [training time vs. inference time](/learn/llm-foundations/training-time-vs-inference-time): training is the (rare, expensive) phase where parameters change; every other interaction with the model only ever produces and discards activations. It's also why a longer [context window](/learn/llm-foundations/context-window-mechanics) doesn't mean "more training data got included" — a bigger context just means more room for activations from the current input, nothing about the corpus the weights were trained on.

## Watch out for

- **Thinking the model "remembers" earlier things you said in a *different* conversation.** Only activations exist per-call, and they vanish when the call ends — anything that looks like memory across sessions is a separate system re-inserting old text into a new prompt.
- **Confusing parameter count with file size.** The same 124M parameters take up roughly 500MB at 32-bit precision, 250MB at 16-bit, or far less under [quantization](/learn/llm-foundations/quantization-and-inference-serving) — "parameters" and "megabytes on disk" are related but not the same number.
- **Assuming the model can quote its training data verbatim on demand.** Overwhelmingly, what's stored is statistical structure distilled from the data, not the data itself — verbatim recall of specific passages is the exception (usually from heavily repeated text), not the rule.

## Where next

[Training time vs. inference time](/learn/llm-foundations/training-time-vs-inference-time), next in this module, is the direct sequel: it's the same three-way split, viewed as two different *regimes* the same weights operate under.

**Related:** [Training Time vs Inference Time](/learn/llm-foundations/training-time-vs-inference-time), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics), [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving)
