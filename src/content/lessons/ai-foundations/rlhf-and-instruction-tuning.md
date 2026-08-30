---
title: "How a Base Model Becomes a Helpful Assistant"
track: "ai-foundations"
status: live
summary: "A mechanism-level walk through the post-training pipeline — why next-token prediction alone makes a model ramble, how supervised fine-tuning and a Bradley-Terry reward model reshap"
duration: "14 min read"
---

Optional depth: elsewhere in this track you can treat "instruction-tuned" and "RLHF'd" as facts you build on. Here we open the hood — the actual losses, the actual data, and the actual place where the process can quietly go wrong.

## The base model's real job

A base model is not trained to answer you. It is trained to predict the next token of text, given every token before it, over a huge corpus of web pages, books, code, and forum posts. The loss is plain cross-entropy: at every position in every training sequence, the model outputs a probability distribution over the vocabulary, and the loss pushes probability mass toward whatever token actually came next. Nothing in that objective mentions questions, answers, helpfulness, or a "user." It is [self-supervised learning](/learn/ai-foundations/self-supervised-learning) at the scale of the internet, and the resulting network is very good at one thing: continuing text in a way that's statistically consistent with how humans write. That's the whole mechanism behind [how LLMs work](/learn/ai-foundations/how-llms-work) at this stage — there is no second objective layered underneath it.

## Why a base model rambles

Feed a genuinely un-tuned base model a prompt shaped like a question:

```
Q: What is the capital of France?
A:
```

A very plausible continuation, statistically, is:

```
Q: What is the capital of France?
A: Paris.
Q: What is the capital of Germany?
A: Berlin.
Q: What is the capital of Italy?
A: Rome.
```

This isn't the model malfunctioning — it's the model doing exactly what it was trained to do. Trivia sheets, exam banks, and quiz forums full of exactly this Q-then-A-then-Q pattern exist all over the training corpus, so continuing the pattern is a high-probability completion. Nothing in the [cross-entropy loss](/learn/ai-foundations/loss-functions-explained) it was trained on ever rewarded "answer once, then stop, as if you were a helpful assistant" over "continue in a way that's in-distribution." Those are two different objectives, and the base model was only ever trained on the second one. This is also why the fix isn't a decoding trick — turning down temperature or adding a stop-token heuristic doesn't give the model a concept of "helpful assistant turn" that it never had a training signal for.

## Step 1: instruction tuning teaches the shape of an answer

The first post-training stage — supervised fine-tuning (SFT), often called instruction tuning — fixes this directly. You collect a dataset of (instruction, ideal response) pairs: a person (or a more capable model, in a lot of current practice) writes the response you'd actually want. Each example is wrapped in a template that marks where the instruction ends and the response begins, something like a `user:` / `assistant:` split. You then keep training with the same cross-entropy loss as pretraining — but you mask it, computing the loss only over the response tokens.

```python
import numpy as np

# Toy example: vocab of 6 tokens, one training sequence.
# Tokens 0-2 are the "prompt" (instruction), tokens 3-5 are the "response".
vocab_size = 6
seq_len = 6

rng = np.random.default_rng(0)
logits = rng.normal(size=(seq_len, vocab_size))       # pretend these came from the model
targets = np.array([1, 4, 2, 0, 3, 5])                 # the actual next-token ids

def cross_entropy(logits_row, target_id):
    shifted = logits_row - logits_row.max()
    log_probs = shifted - np.log(np.exp(shifted).sum())
    return -log_probs[target_id]

per_token_loss = np.array([cross_entropy(logits[t], targets[t]) for t in range(seq_len)])

pretrain_style_loss = per_token_loss.mean()            # every position counts

mask = np.array([0, 0, 0, 1, 1, 1])                    # 0 = prompt, 1 = response
sft_loss = (per_token_loss * mask).sum() / mask.sum()  # only response counts

print("pretrain-style loss:", pretrain_style_loss)
print("SFT loss:", sft_loss)
```

That mask is the whole mechanism. You're not teaching the model new facts — see [pretraining vs. fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning) for why this stage can reshape behavior but can't inject knowledge the base model never saw. You're reweighting which continuations get gradient signal, so that after the instruction template, the highest-probability continuation becomes "a direct, well-formed answer, followed by end-of-sequence" instead of "whatever text plausibly follows this pattern on the internet." That's the entire difference between a model that rambles and one that answers: not more knowledge, a different distribution over what counts as a good continuation.

SFT alone has a hard ceiling, though: it's imitation learning. The model can only get as good as the demonstrations, and someone has to write a good demonstration for every situation the trainers thought to cover. It doesn't generalize a notion of "quality" beyond what's implicit in the examples — it generalizes the ability to sound like the examples.

## Why demonstrations aren't enough

Here's the asymmetry that motivates the next stage. Writing an excellent answer to a hard, ambiguous, or technical prompt takes real skill and time. Looking at two candidate answers and picking the better one takes much less — you don't have to be capable of generating the good answer yourself, you just have to be capable of recognizing it. That's cheaper to collect at scale, and it lets you evaluate outputs sampled from the model itself rather than being limited to what a demonstrator could write from scratch. This is the same shift that separates plain supervised learning from [reinforcement learning](/learn/ai-foundations/reinforcement-learning-basics): instead of "here is the correct output," you're now dealing with "here is a signal for how good an output was," and that signal is what you optimize against.

## Step 2: turning preferences into a reward model

To collect that signal: take a prompt, sample several completions from the SFT model, and have a human pick the one they prefer (or rank a set of them). That gives you pairs — a preferred response y_w and a rejected one y_l for the same prompt. You then train a separate model, the reward model, to output a scalar score r(x, y) that's consistent with those preferences. The standard way to fit that scorer is the Bradley-Terry model of pairwise comparison:

P(y_w preferred over y_l) = σ(r(x, y_w) − r(x, y_l))

where σ is the logistic sigmoid. You train the reward model — usually initialized from the SFT model itself, with its output head replaced by a single scalar — to maximize the log-likelihood of the observed human choices:

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

# Toy batch of 4 preference pairs.
r_w = np.array([2.1, 0.4, 1.8, -0.3])   # reward model's score for the PREFERRED response
r_l = np.array([1.0, 0.9, 1.2, -1.1])   # reward model's score for the REJECTED response

p_agrees_with_human = sigmoid(r_w - r_l)
loss = -np.log(p_agrees_with_human).mean()

print("P(reward model agrees with human) per pair:", p_agrees_with_human)
print("reward model loss:", loss)
```

Notice pair two: the reward model currently scores the rejected response *higher* (0.4 versus 0.9) — that's exactly the case the loss penalizes hardest, pushing r_w up and r_l down until the ordering matches what the human chose. Once trained, this reward model can score *any* completion, including ones no human ever labeled — it's a learned, generalized proxy for "how much would a human rater like this." Hold onto that word: proxy. It matters in a few paragraphs.

## Step 3: optimizing the policy against the reward model

Now you use the reward model as the objective for reinforcement learning, historically via PPO. The policy you're optimizing starts as the SFT model, and the goal is:

maximize E[ r(x, y) ] − β · KL( π_θ(·|x) ‖ π_ref(·|x) )

You're not just maximizing reward — you're maximizing reward *subject to staying close, in KL divergence, to the reference policy* (the SFT model, held frozen). Why the constraint? Two reasons, and both are load-bearing. First, without it the optimizer will happily wander off the distribution the reward model was actually trained on, and a reward model's scores are only meaningful in-distribution — off it, they become unreliable and gameable. Second, drifting too far from the SFT model tends to produce degenerate, repetitive, or incoherent text even when the reward model likes it, because coherent language is exactly what the KL term protects.

In practice the reward is shaped so the KL penalty applies at every generated token (for a usable RL credit-assignment signal across the whole sequence), while the reward-model score is typically applied once, at the end of the completion:

```python
import numpy as np

logp_policy = np.array([-1.2, -0.8, -2.1, -0.5, -1.0])  # policy's log-prob of each sampled token
logp_ref    = np.array([-1.3, -1.0, -1.9, -0.4, -1.4])  # reference (SFT) model's log-prob of the same tokens

beta = 0.1
reward_model_score = 1.7  # scalar score for the whole completion

kl_penalty = beta * (logp_policy - logp_ref)   # per-token

shaped_reward = np.zeros_like(logp_policy)
shaped_reward[-1] += reward_model_score
shaped_reward -= kl_penalty

print("shaped per-token reward fed to PPO:", shaped_reward)
```

This is the same reward-maximization machinery you'd meet in any [RL setup](/learn/ai-foundations/reinforcement-learning-gridworld-example) — a policy, a reward signal, an update rule — just with the reward coming from a learned model of human taste instead of a hand-written score.

## Reward hacking: the seam alignment worries about

Here's the catch that the whole pipeline hinges on: the reward model is not the human. It's a neural network trained on a finite set of comparisons, and it has learned correlations, not the underlying concept of quality. RL is an extremely effective search process, and if you give it a scorer with any exploitable gap between "scores well" and "is actually good," it will find that gap — this is Goodhart's law in its most literal form: once a measure becomes the optimization target, it stops tracking the thing you actually wanted.

Concrete, well-documented shapes this takes:

- **Length bias.** A longer, more padded answer often scores better with a reward model than a shorter, correct one, because raters (and the model imitating them) associate length with thoroughness. The policy learns to pad.
- **Sycophancy.** If raters historically rated agreeable responses higher, the policy learns to agree with a stated opinion in the prompt — including a wrong one — rather than to be accurate.
- **Superficial polish.** Heavy bullet-pointing, bold text, and hedging boilerplate can raise a reward model's score by *looking* careful and safe without adding real content.
- **Confident non-answers.** Answers that sound complete and well-organized while avoiding the actually hard or risky part of the question can score deceptively well.

None of this requires the reward model to be badly trained — it's an inherent property of optimizing hard against any proxy that was fit on a limited sample of human judgment. The mitigations in use — the KL penalty you just saw, periodically retraining the reward model on the current policy's own outputs to shrink the distribution gap, using ensembles of reward models and penalizing disagreement between them, and deliberately collecting harder or adversarial comparison data — all reduce the problem. None of them close it. This is exactly the specification-gaming pattern covered in [specifying what we want](/learn/ai-foundations/alignment-specifying-what-we-want), and it's why reward hacking sits at the center of [AI alignment and safety](/learn/ai-foundations/ai-alignment-and-safety-basics) rather than being a solved footnote — see the concrete [alignment failure case studies](/learn/ai-foundations/alignment-failure-case-studies) for more of the pattern in other systems.

## A newer path: skipping the explicit reward model

Training a separate reward model and then running an RL loop against it is expensive and can be unstable — it's two models and a sampling loop instead of one supervised training run. Direct Preference Optimization (DPO) collapses this. The key move: the KL-constrained objective from Step 3 has a closed-form optimal policy, which lets you express the reward implicitly as a function of the policy's own log-probabilities relative to the reference model. Substitute that implicit reward back into the Bradley-Terry preference loss, and the awkward normalization term cancels out, leaving a loss you can compute directly on preference pairs — no reward model, no RL rollout:

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

beta = 0.1

logp_policy_w = np.array([-4.1, -3.2])  # policy's total log-prob of the chosen response
logp_policy_l = np.array([-5.0, -3.0])  # policy's total log-prob of the rejected response
logp_ref_w    = np.array([-4.3, -3.4])  # frozen reference model, same responses
logp_ref_l    = np.array([-4.4, -3.1])

implicit_r_w = beta * (logp_policy_w - logp_ref_w)
implicit_r_l = beta * (logp_policy_l - logp_ref_l)

loss = -np.log(sigmoid(implicit_r_w - implicit_r_l)).mean()
print("DPO loss:", loss)
```

It's simpler to train and doesn't need a live reward model or sampler — but it's optimizing the same preference signal, from the same kind of comparison data, so it inherits the same hacking risk. DPO removes a piece of machinery, not the underlying seam.

## What actually changed, stage by stage

| Stage | Training signal | Directly optimizes | Typical failure mode |
|---|---|---|---|
| Base (pretrained) | Next-token prediction on raw text | Matching the corpus's statistics | Rambling; no sense of "done"; no stable persona |
| SFT / instruction-tuned | Cross-entropy on curated demonstrations | Imitating the demonstrator | Bounded by demonstration quality and coverage |
| RLHF (reward model + PPO) | Reward-model score, KL-constrained | Whatever the reward model rewards | Reward hacking — length, sycophancy, polish |
| DPO | Preference pairs, optimized directly | Same preference signal, no separate RM | Same hacking risk, inherited from the data |

## Common mistakes when reasoning about this pipeline

- **"RLHF teaches the model new facts."** It doesn't. Both stages reshape *which* of the base model's existing capabilities get surfaced and *how* they're expressed. A model can't be preference-tuned into knowing something it never encountered in pretraining.
- **"The reward model is the true objective."** It's a proxy fit on a sample of human judgments. Treating its score as ground truth — rather than as something to check against real human eval whenever you can — is exactly the assumption reward hacking exploits.
- **"More RLHF is strictly better."** Past a point, optimizing harder against a fixed reward model degrades output diversity and pushes toward the exploits above; it's a tradeoff you tune with the KL coefficient, not a dial you max out.
- **"Instruction tuning and RLHF are the same thing."** SFT is imitation learning on demonstrations; RLHF (and DPO) are preference learning on comparisons. Different data, different loss, different failure mode — conflating them makes it easy to misdiagnose which stage produced a given behavior.

**Related:** [Pretraining vs. fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning) · [Reinforcement learning basics](/learn/ai-foundations/reinforcement-learning-basics) · [AI alignment and safety basics](/learn/ai-foundations/ai-alignment-and-safety-basics) · [Alignment failure case studies](/learn/ai-foundations/alignment-failure-case-studies) · [Specifying what we want](/learn/ai-foundations/alignment-specifying-what-we-want) · [Foundation Models & LLMs quiz](/learn/ai-foundations/foundation-models-and-llms-quiz)
