---
title: "From Base Model to Assistant: The Pipeline Map"
track: "llm-foundations"
status: live
summary: "The three-stage map from pretraining to a usable assistant: base model, then instruction tuning, then preference optimization."
duration: "6 min read"
---

Ask a raw pretrained model a question and it might answer it, continue it with more questions, or ignore it entirely — because nothing in pretraining ever told it "this is a question addressed to you." Turning that into a model that reliably behaves like an assistant takes two more stages, laid out here as a map before the rest of this module goes deep on each one.

## What it is

The pipeline has three stages, each building on the last:

1. **Pretraining** produces a **base model** — see [Pretraining Explained](/learn/llm-foundations/pretraining-explained) and [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss).
2. **Supervised fine-tuning (SFT)** turns it into an instruction follower — see [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics).
3. **Preference optimization** (RLHF, DPO, or a related method) shapes it toward helpfulness and safety — see [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo).

[Instruction Tuning and RLHF](/learn/llm-foundations/instruction-tuning-and-rlhf) covers stages two and three together at a higher level; this lesson is the map connecting all three, and everything after it in this module goes one level more mechanical on each stage.

## The mental model

Think of it as three increasingly narrow, increasingly expensive-per-example funnels applied to the same underlying weights. Pretraining touches essentially the whole model's behavior across almost every domain of text, using the most compute and the least manually-curated data — trillions of tokens, no per-example annotation beyond corpus construction. SFT touches behavior more narrowly, teaching one thing (respond like an assistant to an instruction), with far less data but every example hand-picked or hand-checked. Preference optimization touches behavior in the narrowest, most surgical way — nudging which of several already-plausible responses the model prefers — using the least data of all but arguably the most consequential per example, since it directly shapes personality and safety behavior.

## Why it works this way

You can't skip straight from a base model to preference optimization. Both PPO and DPO operate over comparisons between responses the model itself generates, and a base model's responses to an "instruction" aren't reliably assistant-shaped in the first place — you'd be comparing two different flavors of wrong. SFT anchors the model into producing assistant-shaped output first, so the comparisons preference optimization works on are actually meaningful — two good-faith answers being ranked, not two random completions. Each stage narrows the space of behaviors so the next stage's optimization signal has something coherent to work with.

## A concrete example (shown)

Take the prompt "Explain what a linked list is" through all three stages:

- **Base model:** might continue with "...and how it differs from an array. In this chapter we will..." — treating the prompt as the opening of a textbook section rather than a question addressed to it.
- **After SFT:** produces a direct, addressed-to-the-user explanation in a few sentences, because it has seen many (instruction, direct-answer) pairs and learned that shape.
- **After preference optimization:** the same direct explanation, but tuned toward whichever qualities the preference signal favored — for example, more likely to check the apparent level of the question and add a short example, less likely to pad with irrelevant caveats, because those are the traits the preference data rewarded.

## Where it shows up

Model cards and API docs describing a checkpoint as "base," "instruct," or "chat" are telling you exactly where in this pipeline it sits — see [Base vs Instruct vs Chat vs Reasoning Models](/learn/llm-foundations/base-instruct-chat-reasoning-families). Any open-weight release that ships both a "base" and an "instruct" checkpoint is showing you stage one's output and stage three's output side by side.

## Watch out for

1. Assuming preference optimization adds knowledge. It doesn't add facts the pretraining corpus didn't contain — it reshapes which already-learned response gets surfaced. See [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy) for what goes wrong when this is pushed too far.
2. Treating SFT and preference optimization as interchangeable. SFT teaches a fixed target response; preference optimization teaches a relative ranking. Reaching for the wrong one is a common failure covered in [Fine-Tuning Mistakes](/learn/llm-foundations/fine-tuning-mistakes-forgetting).
3. Treating the pipeline as strictly sequential and one-shot. Real training pipelines often iterate — new SFT data informed by preference-tuning failures, multiple rounds of preference collection — even though the conceptual map is a clean three stages.

## Where next

**Related:** [Pretraining Explained](/learn/llm-foundations/pretraining-explained), [Instruction Tuning and RLHF](/learn/llm-foundations/instruction-tuning-and-rlhf), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [Base vs Instruct vs Chat vs Reasoning Models](/learn/llm-foundations/base-instruct-chat-reasoning-families)
