---
title: "How Reasoning Models Are Trained"
track: "llm-foundations"
status: live
summary: "RL on checkable rewards, not human preference, is what makes a model actually improve from thinking longer instead of just sounding thoughtful."
duration: "8 min read"
---

Prompting a regular chat model to "think step by step" gets you reasoning-shaped text. Getting a model that reliably gets *better* answers from thinking longer takes an entirely different training loop — one built around rewards a program can check, not a human's opinion of the writing.

> **Optional depth.** [Chain of thought and test-time compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute) covers why emitting reasoning tokens helps at all. This page covers the training recipe that turns "can emit reasoning tokens" into "reliably improves from them."

## The reasoning-training recipe

The publicly documented version of this recipe — most concretely laid out in DeepSeek's R1 paper (2025), with OpenAI's o1 following a broadly similar public description without full technical disclosure — has a few consistent pieces:

1. **A capable base or lightly-instruction-tuned model** as the starting point, sometimes with a small amount of curated "cold start" supervised data showing well-formed long reasoning traces, to give the reinforcement learning stage something reasonable to begin from rather than starting from scratch.
2. **Reinforcement learning on tasks with a checkable answer** — math problems with a known final value, code that either passes or fails unit tests, logic puzzles with one correct solution. The model generates a full reasoning trace plus a final answer; the answer gets checked programmatically; the reward is essentially binary (or a graded score, for tasks like partial test-case passage).
3. **Policy optimization against that reward** (variants of PPO, or newer methods like GRPO that avoid needing a separate learned value network) to increase the probability of generating traces that lead to correct final answers.
4. **Iteration**, often with rejection sampling — keep the best self-generated reasoning traces from the RL process, distill them back into supervised fine-tuning data, and repeat — which compounds improvements without needing more human-labeled data at each round.

## Verifiable rewards: what makes this different from RLHF

This is the real structural break from [ordinary RLHF](/learn/llm-foundations/rlhf-reward-models-and-ppo). Standard RLHF trains a reward model on human preference judgments — which of two responses a rater liked better — and that reward model is a *learned approximation* of human preference, with all the same failure modes any learned model has: it can be fooled, it has blind spots, and optimizing hard against it can drift the policy toward whatever the reward model over-rewards rather than what's actually good (see [alignment tax, reward hacking, and sycophancy](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy)). A reward model has no independent way to check "is this math answer actually correct" — it's judging plausibility and human appeal, not verifying ground truth.

Reasoning-model RL sidesteps that specific failure mode for the tasks it targets: if the reward is "does this code pass these unit tests" or "does this final number match the known answer," there's no learned approximator to fool — the check is exact and external to the model. That changes what the optimization pressure actually selects for. The model isn't being pushed toward reasoning text that *looks* convincing to a rater; it's being pushed toward reasoning strategies that *actually produce correct answers* more often, whatever those strategies turn out to be. This is also why reasoning-model outputs sometimes look unusual by RLHF-chat standards — trying an approach, hitting a wall, explicitly backtracking ("wait, that's not right because...") — none of that is optimized for reading well to a human rater, only for raising the odds the final answer checks out. See [RLHF vs. DPO vs. preference methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods) for how the ordinary preference-based pipeline compares mechanically.

## Why long chains of thought emerge rather than get imitated

A model prompted to "think step by step" without this training is imitating the *surface form* of reasoning text it saw during pretraining — plausible-looking steps that may or may not be load-bearing for the answer. A model trained with verifiable-reward RL discovers long chains of thought as an *instrumental strategy*: across enough RL steps, generating more exploration and self-checking before committing measurably raises the correct-answer rate, so the policy is pushed toward longer, more exploratory traces because they pay off on the actual reward, not because anyone specified a target length or scripted a "checking" behavior into the training data. The chain-of-thought length and style that emerges is a consequence of what the reward signal favors, not a template the model was shown to copy.

## Inference-time search and self-consistency

Training produces a model that's good at generating one strong reasoning trace. A separate, complementary technique operates purely at inference time: **self-consistency** (Wang et al., 2022) samples several independent reasoning traces for the same question at nonzero temperature and takes the answer that shows up most often across them, on the logic that a systematically wrong reasoning path is less likely to be reproduced by chance across multiple independent samples than the correct path is. This is a test-time search strategy layered on top of whatever the model already does per-trace — it costs proportionally more inference compute (`k` full generations instead of one) for a further accuracy gain, independent of anything done during training.

## What "thinking longer" actually buys

Put the training and inference-time pieces together and "thinking longer" means two distinct things that are easy to conflate: a model *trained* with verifiable-reward RL to reason well, and a model *run* multiple times at inference for self-consistency, or with a longer per-response reasoning budget. Both spend more compute per answer than a standard single-pass chat response, and both target the same class of problem — one with real sequential structure and a checkable outcome — where [chain of thought helps at all](/learn/llm-foundations/chain-of-thought-and-test-time-compute). Neither buys anything on tasks that are fundamentally about retrieval, style, or judgment calls with no checkable ground truth, which is exactly where the reward signal this whole recipe depends on doesn't exist.

**Related:** [Chain of Thought and Test-Time Compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute), [Reasoning Models and Test-Time Compute](/learn/llm-foundations/reasoning-models-test-time-compute), [RLHF, Reward Models, and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [RLHF vs. DPO vs. Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods), [Alignment Tax, Reward Hacking, and Sycophancy](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy)
