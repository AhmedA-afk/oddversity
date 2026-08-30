---
title: "Quiz: The Training Pipeline"
track: "llm-foundations"
status: live
summary: "Eight questions across the pretraining loss, perplexity, SFT masking, the RLHF loop, DPO vs PPO, and model families."
duration: "8 min read"
---

Eight questions spanning the whole pipeline, from the loss function under pretraining to why a model might suddenly start agreeing with everything you say. None depends on a later one — work through them in order, or jump to what you're unsure about.

### Question 1

A model is being pretrained with the standard next-token objective. Which of these best describes what a single pretraining loss value at a given position actually measures?

A. How semantically similar the model's guess is to the correct next token.
B. The negative log-probability the model assigned to the token that actually came next at that position.
C. The number of tokens the model got exactly right in the sequence so far.
D. How many candidate continuations the model considered before choosing one.

<details><summary>Answer</summary>

**Correct: B.** Cross-entropy loss is defined exactly this way — see [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss).

- A: incorrect — cross-entropy loss doesn't measure semantic similarity, only the probability mass assigned to the literal correct token; a semantically close but different token gets no partial credit from the loss itself.
- B: correct — teacher forcing lets this be computed at every position in parallel, which is why pretraining on a huge corpus is tractable.
- C: incorrect — that would be an accuracy-style metric, a hard right/wrong count, not the continuous cross-entropy loss actually optimized.
- D: incorrect — the model doesn't "consider candidates" in any explicit search sense during training; it emits one probability distribution per position, and the loss reads off that distribution's value at the true token.

</details>

### Question 2

A model assigns probability 0.25 to the correct next token at every one of 4 consecutive positions in a short sequence (illustrative, uniform for simplicity). What is the resulting perplexity for this stretch?

A. 0.25
B. 1
C. 4
D. 16

<details><summary>Answer</summary>

**Correct: C.** Per-token cross-entropy is `-ln(0.25) = ln(4)`; averaged over four identical positions it's still `ln(4)`; `e^(ln 4) = 4`. See [Computing Cross-Entropy and Perplexity by Hand](/learn/llm-foundations/cross-entropy-and-perplexity-worked) for the general procedure with non-uniform probabilities.

- A: incorrect — that's just the per-token probability itself, not perplexity, which is the exponentiated average loss.
- B: incorrect — a perplexity of 1 would mean the model was certain (probability 1) at every position; here it assigned only 0.25.
- C: correct — a perplexity of 4 means the model's uncertainty here is like choosing uniformly among 4 options, which lines up neatly with the 0.25 probability it actually gave the right one.
- D: incorrect — 16 would come from squaring 4, which isn't part of the perplexity formula; perplexity is `e^(average loss)`, not `e^(loss)^2`.

</details>

### Question 3

A pretraining corpus contains one passage duplicated exactly 40 times across mirrored websites, with no deduplication applied. What's the main mechanical problem this causes?

A. The tokenizer will fail to encode the duplicated passage correctly.
B. Training steps get spent driving loss toward zero on an already-easy, repeated passage instead of on text the model hasn't seen, which doesn't help generalization.
C. The model's context window shrinks for every sequence containing the passage.
D. It has no real effect, since more tokens always help scaling.

<details><summary>Answer</summary>

**Correct: B.** This is the mechanism described in [Inside the Pretraining Data Pipeline](/learn/llm-foundations/pretraining-data-pipeline).

- A: incorrect — duplication is a data-composition issue, not a tokenization failure; the tokenizer encodes duplicated text exactly the same as unique text.
- B: correct — repeated exact or near-duplicate text lets the model drive loss down on that one passage far faster than on novel text, without teaching it anything new, wasting gradient steps relative to a deduplicated corpus of the same token count.
- C: incorrect — duplication doesn't change the context window length; that's a fixed architectural setting, unrelated to corpus composition.
- D: incorrect — more tokens help only when they're informative; heavily duplicated tokens carry much less new information per token than unique ones.

</details>

### Question 4

A team removes the learning-rate warmup phase from a large pretraining run, keeping everything else the same, and applies the full peak learning rate from step 0. What's the most likely consequence?

A. Training converges faster since the model reaches peak learning rate sooner.
B. No meaningful difference, since warmup is a minor stylistic choice.
C. Early instability or a loss spike, since large updates hit randomly-initialized weights before Adam's moment estimates have stabilized.
D. The final model becomes strictly more accurate, since it trains at a higher effective learning rate for longer.

<details><summary>Answer</summary>

**Correct: C.** See [Optimization Mechanics: AdamW, Warmup, and Schedules](/learn/llm-foundations/optimization-mechanics-adam-warmup) for the full mechanism.

- A: incorrect — reaching peak learning rate sooner isn't free; on a random initialization it risks large, unstable updates rather than faster genuine convergence.
- B: incorrect — warmup is load-bearing specifically because early gradients are large and Adam's bias-corrected moment estimates are unreliable in the first steps.
- C: correct — large early updates on immature moment estimates and randomly-initialized weights are a well-understood source of early loss spikes or divergence.
- D: incorrect — more training time at a higher learning rate doesn't straightforwardly mean better accuracy; instability early on can derail the whole run rather than simply speeding it up.

</details>

### Question 5

In a supervised fine-tuning example formatted with a chat template, the loss mask zeroes out the user's turn and keeps the assistant's turn unmasked. Why mask the user's turn at all?

A. Because the tokenizer can't process user-turn tokens.
B. Because at inference time the model never has to generate the user's words, so training it to predict them would waste capacity on a task it will never perform.
C. Because user turns are always shorter and would bias the average loss.
D. Because masking is required to make causal masking work correctly.

<details><summary>Answer</summary>

**Correct: B.** See [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics).

- A: incorrect — the tokenizer handles user-turn tokens the same as any other tokens; masking is a loss-computation choice, not a tokenization limitation.
- B: correct — the point of loss-masking is to spend every gradient update on the exact thing the model needs to do at deployment (generate a response), not on predicting text it will never be asked to produce.
- C: incorrect — length isn't the reason; even a long user turn would still be masked, because the issue is what the model needs to learn, not how many tokens are involved.
- D: incorrect — causal masking (which positions can attend to which) is a separate, always-on architectural mechanism; loss-masking is an additional, independent choice about which positions contribute to the loss.

</details>

### Question 6

In PPO-based RLHF, what specifically does the KL-divergence penalty against the frozen reference (SFT) model do?

A. It trains the reward model to be more accurate.
B. It limits how far the policy can drift from the SFT model in order to chase reward-model score, discouraging reward hacking.
C. It increases the learning rate whenever the policy's outputs get too similar to the reference model.
D. It replaces the need for a reward model entirely.

<details><summary>Answer</summary>

**Correct: B.** See [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo).

- A: incorrect — the KL term operates during policy optimization, not reward model training; it doesn't touch how the reward model itself was fit to preference data.
- B: correct — subtracting a KL penalty from the reward used by PPO keeps the policy anchored near the reference model, directly limiting the reward-hacking failure mode described in [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy).
- C: incorrect — the KL term is subtracted from the effective reward, not used to adjust the learning rate; it changes what's being optimized, not the step size.
- D: incorrect — PPO-based RLHF still needs a reward model to produce the base reward signal; the KL term only regularizes how the policy uses that signal.

</details>

### Question 7

Which statement correctly distinguishes DPO from PPO-based RLHF?

A. DPO requires online sampling from the current policy at every training step, while PPO trains only on a fixed static dataset.
B. DPO computes a closed-form loss directly from a fixed set of (chosen, rejected) pairs and the policy/reference log-probabilities, with no separate reward model or RL loop; PPO trains a reward model and runs on-policy reinforcement learning against it.
C. PPO and DPO are the same algorithm under different names, with no practical difference in what data or infrastructure each needs.
D. DPO can only be used when no reference model is available, while PPO requires one.

<details><summary>Answer</summary>

**Correct: B.** See [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods) and [Reading a DPO Loss and a Preference Pair](/learn/llm-foundations/reading-a-dpo-loss-and-preference-pair).

- A: incorrect — this reverses the relationship; DPO trains on a fixed, static preference dataset, while PPO is the on-policy method generating and scoring fresh rollouts every step.
- B: correct — DPO reformulates the same underlying preference objective into a supervised-style closed-form loss, entirely skipping the reward model and RL machinery PPO-based RLHF needs.
- C: incorrect — they target a mathematically related objective but differ substantially in infrastructure, stability, and required data format.
- D: incorrect — DPO explicitly requires a frozen reference model too, since it's central to computing the log-probability gap in the loss; the difference from PPO is the absence of a separate reward model and RL sampling loop, not the absence of a reference model.

</details>

### Question 8

You're evaluating a model and notice: it answers direct instructions competently in a single turn, but when you refer back to something you said two messages earlier in the same conversation, it seems to have lost track of it entirely, and it never proactively asks a clarifying question. Which stage of post-training is most likely missing or under-done, and what family does this profile match?

A. It's likely a base model that never went through SFT at all.
B. It's likely an instruct-tuned model that received single-turn instruction/response SFT but not multi-turn conversational tuning or preference optimization — matching the "instruct" rather than "chat" family.
C. It's likely a reasoning model whose long chain-of-thought is being hidden from you.
D. It's likely a fully chat-and-preference-tuned model that has simply reward-hacked its way to ignoring context.

<details><summary>Answer</summary>

**Correct: B.** See [Base vs Instruct vs Chat vs Reasoning Models](/learn/llm-foundations/base-instruct-chat-reasoning-families).

- A: incorrect — a base model wouldn't reliably follow direct single-turn instructions at all; the described model clearly can, which requires at least SFT.
- B: correct — competent single-instruction handling plus poor multi-turn memory and no clarifying-question behavior is exactly the profile of an instruct-tuned model that stopped short of chat-level multi-turn training and preference optimization; holding context across turns and asking instead of guessing are specifically what the chat stage adds on top of instruct.
- C: incorrect — reasoning models are identified by visibly extended deliberation before an answer, not by conversational memory; the two are separate axes.
- D: incorrect — reward hacking describes a policy gaming a reward model it was optimized against, not a straightforward absence of a training stage; losing multi-turn context is a capability gap from a missing stage, not a side effect of over-optimizing an existing one.

</details>

**Related:** [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss), [Computing Cross-Entropy and Perplexity by Hand](/learn/llm-foundations/cross-entropy-and-perplexity-worked), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods), [Base vs Instruct vs Chat vs Reasoning Models](/learn/llm-foundations/base-instruct-chat-reasoning-families)
