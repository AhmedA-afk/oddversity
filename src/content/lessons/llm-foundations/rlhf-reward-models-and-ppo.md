---
title: "RLHF: Reward Models and PPO"
track: "llm-foundations"
status: live
summary: "How a reward model learns from human preference pairs, and how PPO raises reward while a KL penalty keeps the policy near the SFT model."
duration: "7 min read"
---

RLHF has three moving pieces that are easy to name and easy to conflate: a reference model, a reward model, and a reinforcement-learning loop that ties them together. Pulling them apart is most of the battle.

## What it is

1. The **SFT model** serves as the starting policy, and a frozen copy of it also serves as the **reference model** for the rest of training.
2. A **reward model** is trained on human preference comparisons: given a prompt and two candidate responses, predict which one a human preferred.
3. **PPO** (Proximal Policy Optimization), a reinforcement-learning algorithm, updates the policy so it generates responses the reward model scores highly — subject to a KL-divergence penalty that keeps the policy's output distribution close to the frozen reference model.

[Instruction Tuning and RLHF](/learn/llm-foundations/instruction-tuning-and-rlhf) covers this at a higher level; this lesson goes one level more mechanical.

## The mental model

**Reward model training:** give it pairs of responses (A, B) to the same prompt, with a human label of which is better. Train it — typically initialized from the SFT model itself, with the unembedding head swapped for a scalar output — so it assigns a higher score to the preferred response than the rejected one. This uses a loss built on the same sigmoid-of-difference idea used in DPO; see [Reading a DPO Loss and a Preference Pair](/learn/llm-foundations/reading-a-dpo-loss-and-preference-pair) for that math worked out in full, since DPO's loss uses an almost identical comparison term without a separate reward model.

**PPO loop:** sample a batch of prompts, generate responses with the current policy, score each response with the now-frozen reward model, compute an advantage from that reward, and update the policy to increase the probability of higher-reward responses — but only by a bounded amount per step (the "proximal" in PPO clips how far a single update can move the policy's probabilities), and with a KL penalty subtracted from the reward that grows the further the policy's output distribution drifts from the frozen reference.

```
   reference (frozen SFT model)
            |  KL(policy || reference)
            v
prompt -> [ policy ] -> response -> [ reward model ] -> reward
                                            |
                                            v
                             reward - beta * KL -> PPO update
                                            |
                                            v
                          policy nudged toward higher-reward,
                          reference-anchored responses
```

## Why it works this way

**Why a separate reward model** instead of asking humans to score every generation live: humans are far too slow and expensive to be in the loop for every one of the thousands of samples PPO needs per run. Training a reward model once, from a comparison dataset that's still expensive but sharply bounded, turns "get a human to judge this" into "run a fast forward pass," which is what makes reinforcement-learning-scale optimization tractable at all.

**Why the KL penalty:** PPO is, in principle, free to move the policy anywhere that increases reward-model score — but the reward model is only an approximation of what humans actually want, trained on a finite, imperfect comparison set. Without a leash back to the reference model, PPO will find and exploit gaps between what the reward model rewards and what humans actually prefer — this is reward hacking, covered in depth in [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy). The KL term is that leash: `reward_used_by_ppo = reward_model_score - beta * KL(policy || reference)`, so drifting far from the reference costs the objective even if the raw reward-model score would have gone up.

**Why "proximal":** naive policy-gradient updates on a full new batch can overcorrect on a noisy reward estimate and destabilize learning. PPO's clipped objective limits how much the ratio of new-to-old action probabilities can influence a single update, so one unusually rewarded (or punished) batch can't swing the policy too far in one step — the RL-training analogue of the gradient clipping covered in [Optimization Mechanics](/learn/llm-foundations/optimization-mechanics-adam-warmup).

## A concrete example (shown)

Take the "explain a linked list" prompt: the policy generates two plausible phrasings, and the reward model scores the more concrete, example-bearing one higher. PPO nudges the policy's parameters — a small step, bounded by the clip and the KL term — so that phrasing (and phrasings like it) become slightly more likely next time, without drifting so far that the policy stops sounding like a coherent, on-topic assistant at all.

## Where it shows up

This loop, or a close variant, is what "RLHF" means whenever it's named in a model's training description. The helpfulness-versus-harmlessness tension visible in some models' refusal behavior is usually the fingerprint of what the reward model was trained to reward — see [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy).

## Watch out for

1. PPO-based RLHF is expensive and fiddly relative to its alternatives — it needs a working reward model, a stable RL loop, and careful tuning of the KL coefficient. See [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods) for when a simpler method gets most of the benefit.
2. A reward model is only ever a proxy for human preference, trained on a finite pool of raters and prompts. Optimizing against it too hard, for too long, reliably finds its blind spots.
3. The KL coefficient is a real dial with a real tradeoff — too small and the policy drifts and reward-hacks, too large and it barely moves from the SFT model, wasting the stage.

## Where next

**Related:** [Instruction Tuning and RLHF](/learn/llm-foundations/instruction-tuning-and-rlhf), [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods), [Reading a DPO Loss and a Preference Pair](/learn/llm-foundations/reading-a-dpo-loss-and-preference-pair), [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy), [From Base Model to Assistant](/learn/llm-foundations/from-base-model-to-assistant-pipeline)
