---
title: "RLHF vs DPO vs Other Preference Methods"
track: "llm-foundations"
status: live
summary: "PPO-based RLHF, DPO's closed-form shortcut, and lighter cousins IPO, KTO, and RLAIF, compared on what each actually needs."
duration: "8 min read"
---

Once you know RLHF's reward-model-plus-PPO loop, the natural next question is: does all of that machinery earn its keep? For most teams today, the honest answer is "not always" — which is why this space has five distinct answers to "how do I turn preference data into a better model."

## PPO-based RLHF

**How it works:** train a reward model from pairwise human preferences, then run online reinforcement learning where the policy generates fresh samples every round, gets scored by the reward model, and updates with a KL penalty back to the SFT reference. See [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo) for the full mechanics.

**When it wins:** when the reward model needs to generalize beyond the exact pairs it saw. Because PPO samples on-policy — from the model as it currently is — it can optimize against reward for responses the model is actually producing *now*, not just the fixed set of responses in the original preference dataset.

**Failure mode:** unstable and finicky to tune (KL coefficient, reward scale, RL hyperparameters), and most exposed to reward hacking, since it actively searches for whatever maximizes reward-model score, including exploits the reward model never anticipated.

**Relative cost:** highest — a separately trained and hosted reward model, an online sampling loop generating fresh rollouts every step, and a full RL training stack, all layered on top of SFT infrastructure.

## DPO (Direct Preference Optimization)

**How it works:** skips the reward model and the RL loop entirely. Reformulates the same underlying objective so a closed-form loss can be computed directly from a fixed dataset of (prompt, chosen, rejected) triples, comparing the policy's and a frozen reference model's log-probabilities on the two responses. See [Reading a DPO Loss and a Preference Pair](/learn/llm-foundations/reading-a-dpo-loss-and-preference-pair) for the full worked arithmetic.

**When it wins:** when you have a solid static preference dataset and want most of RLHF's effect with plain supervised-style training — no reward model to maintain, no online sampling, no RL stability issues.

**Failure mode:** because it trains only on the fixed pairs it was given (off-policy), it can't correct for preferences about responses the current policy wouldn't have generated in the first place, and it can be more sensitive to how clean that fixed dataset is than PPO, which keeps exploring around it.

**Relative cost:** low — one training run, standard supervised-style infrastructure, no separate reward model to train or serve.

## IPO (Identity Preference Optimization)

**How it works:** keeps DPO's reward-model-free, closed-form shape, but changes the loss to regularize the gap between chosen and rejected log-probabilities toward a fixed target, rather than pushing it toward infinity through DPO's log-sigmoid term.

**When it wins:** DPO's objective can, in principle, keep increasing the chosen/rejected gap without bound as training continues, especially on data with limited diversity, which risks overfitting to the specific pairs given. IPO's regularized target is designed to be more robust on smaller or less diverse preference sets.

**Failure mode:** an extra regularization-strength hyperparameter to tune, and a newer, less battle-tested recipe than DPO — less prior art to lean on when something goes wrong.

**Relative cost:** essentially the same as DPO — identical infrastructure, a different loss function.

## KTO (Kahneman-Tversky Optimization)

**How it works:** drops the requirement for paired comparisons entirely. Instead of needing (chosen, rejected) pairs for the same prompt, it only needs a binary "good" or "bad" label per individual (prompt, response) example, drawing on prospect-theory-style ideas about how people weigh gains and losses asymmetrically.

**When it wins:** when available feedback is naturally unpaired — thumbs-up/thumbs-down logs from a deployed product, where you rarely have two responses to the exact same prompt to compare, only isolated judgments.

**Failure mode:** unpaired binary labels carry less information per example than a direct comparison (a comparison directly says "A is better than B"; a thumbs-down alone doesn't say what a better response would have looked like), so it can need more data to reach comparable results.

**Relative cost:** similar to DPO computationally, but often cheaper to source data for, since it fits around already-collected product feedback rather than requiring a dedicated side-by-side annotation process.

## RLAIF (feedback from an AI judge)

**How it works:** replaces human preference labels with judgments from another, usually stronger or specifically-prompted, model, which ranks or labels response pairs. That data then feeds into either a PPO-style reward model or directly into a DPO-style loss — RLAIF is a data-sourcing choice layered on top of one of the other methods, not a fully separate objective.

**When it wins:** when human preference annotation is the bottleneck — cost or speed — and a capable-enough judge model exists to produce reasonably reliable preference labels at far higher volume.

**Failure mode:** inherits and can amplify whatever biases or blind spots the judge model has. You're now aligning your policy toward another model's preferences, which are themselves a learned, imperfect proxy — a second layer of proxy-of-a-proxy risk stacked on top of the usual reward-model gap (see [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy)).

**Relative cost:** lowest per preference label collected — no human annotation pipeline — but the cost shifts to judge-model inference, plus the added risk of compounding another model's blind spots into yours.

## Decision table

| Method | Needs a reward model | Needs on-policy sampling | Preference data format | Relative cost |
|---|---|---|---|---|
| PPO-based RLHF | Yes | Yes | Pairwise comparisons | Highest |
| DPO | No | No | Pairwise (chosen/rejected) | Low |
| IPO | No | No | Pairwise (chosen/rejected) | Low |
| KTO | No | No | Unpaired binary good/bad | Low–medium (data often cheaper to source) |
| RLAIF | Depends (pairs with PPO or DPO) | Depends on base method | Pairwise or binary, AI-generated | Varies; annotation cost shifts to judge-model inference |

## How to choose

Start with **DPO** if you have, or can collect, a solid pairwise preference dataset and want the simplest path to most of RLHF's benefit — it's become the default first move for good reason: fewer moving parts, easier to debug, no RL stack. Reach for full **PPO-based RLHF** when you have the infrastructure for it and need on-policy correction, typically at the largest scale or when DPO's static dataset visibly can't keep up with how much the policy is changing. Reach for **KTO** when your actual data source is unpaired feedback and collecting paired comparisons isn't practical. Consider **IPO** if DPO is visibly overfitting on a small or narrow preference set. Layer **RLAIF** onto any of the above only once you've validated that your judge model's preferences are trustworthy enough to align a policy toward, since every downstream failure mode is now filtered through that judge.

**Related:** [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [Reading a DPO Loss and a Preference Pair](/learn/llm-foundations/reading-a-dpo-loss-and-preference-pair), [Instruction Tuning and RLHF](/learn/llm-foundations/instruction-tuning-and-rlhf), [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy)
