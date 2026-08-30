---
title: "Supervised Fine-Tuning Mechanics"
track: "llm-foundations"
status: live
summary: "SFT reuses the pretraining loss but masks it to only the response tokens, plus chat templates and role tokens that structure the input."
duration: "6 min read"
---

SFT doesn't invent a new loss function. It takes the exact same next-token cross-entropy from pretraining and points it at a much smaller, much more deliberately shaped dataset — with one small change that does most of the work.

## What it is

An SFT dataset is made of (instruction, response) pairs, formatted through a **chat template** into a single token sequence with special role tokens marking where a user turn ends and an assistant turn begins (often with a system turn too). Training loss is the same next-token cross-entropy as [pretraining](/learn/llm-foundations/the-pretraining-objective-and-loss) — but computed with a **loss mask** that zeroes out the loss contribution from the prompt and user tokens. Only the assistant's response tokens contribute gradient.

## The mental model

The sequence is still next-token prediction over the whole thing, but only part of it gets "graded." The user turn and any system prompt are given to the model as context — exactly like a document prefix, with [causal masking](/learn/llm-foundations/causal-masking-mechanics) still letting each response token see everything before it — but the model gets no credit or penalty for how well it predicts the user's own words. At inference, the user's words are never something the model has to generate. Masking them out keeps training aligned with what the model actually has to do at deployment.

## Why it works this way

If prompt tokens weren't masked, the model would spend part of every gradient step learning to predict user text — a task it never performs at inference, and one that could subtly bias generation toward "sounding like a user" in some contexts. Masking is a small implementation detail with an outsized effect: it's the mechanism that keeps SFT's small dataset (thousands to low millions of examples, vastly smaller than the pretraining corpus) efficient, by directing every bit of gradient signal at the exact behavior being taught.

## A concrete example (shown)

A formatted training example, with role tokens:

```
<|system|>
You are a helpful assistant.
<|user|>
What's the boiling point of water at sea level?
<|assistant|>
100°C (212°F) at standard atmospheric pressure.
<|end|>
```

Annotated by masked vs. unmasked span:

```
<|system|> You are a helpful assistant.
<|user|> What's the boiling point of water at sea level?
<|assistant|>                                                <- LOSS MASKED (context only)
100°C (212°F) at standard atmospheric pressure. <|end|>      <- LOSS COMPUTED HERE
```

Role tokens like `<|system|>`, `<|user|>`, and `<|assistant|>` are just additional entries in the [tokenizer's](/learn/llm-foundations/tokenization-explained) vocabulary — the model has to learn their meaning from training data, same as any word. There's nothing architecturally special about them beyond being reserved strings the template always inserts in the same place.

## Where it shows up

Every "chat template" referenced in model documentation or tokenizer configs is defining exactly this: where role tokens go, and which spans get masked. It's also why a base model often can't reproduce assistant-style output even when prompted with the same template text — it was never trained with any of it masked or emphasized, so it just sees the template tokens as more text to continue.

## Watch out for

1. Loss-masking bugs are silent. If the mask boundary is off by one token, the model either loses a trivial amount of signal (usually harmless) or picks up gradient on user text (subtly degrading behavior in ways that are hard to catch without careful evals).
2. A tiny or narrow SFT set teaches format fast, but the model can overfit to that format's surface patterns rather than the underlying skill. See [Fine-Tuning Mistakes and Catastrophic Forgetting](/learn/llm-foundations/fine-tuning-mistakes-forgetting) for the overfitting and format-leakage failure modes in detail.
3. A mismatch between the template used at training time and the one used at inference time — even a subtly different tokenizer or template version with shifted role-token IDs — silently breaks a fine-tuned model. The template at inference must exactly match what was used during training.

## Where next

**Related:** [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss), [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), [From Base Model to Assistant](/learn/llm-foundations/from-base-model-to-assistant-pipeline), [Tokenization Explained](/learn/llm-foundations/tokenization-explained), [Fine-Tuning Mistakes and Catastrophic Forgetting](/learn/llm-foundations/fine-tuning-mistakes-forgetting)
