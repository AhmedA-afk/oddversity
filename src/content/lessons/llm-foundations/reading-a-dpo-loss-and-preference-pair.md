---
title: "Reading a DPO Loss and a Preference Pair"
track: "llm-foundations"
status: live
summary: "Take one chosen/rejected pair, compute the policy-vs-reference log-prob gap, and trace what a single DPO gradient step actually does."
duration: "7 min read"
---

DPO's reputation is "RLHF without the reinforcement learning," which is true but easy to take on faith. This lesson computes an actual DPO loss from an actual (illustrative) preference pair, so the mechanism stops being a slogan.

## The setup

Prompt: "What's the capital of France?"

- Chosen response `y_w`: "Paris."
- Rejected response `y_l`: "I think it might be Paris, but don't quote me on that — geography isn't really my strong suit."

DPO needs, for each response, the total log-probability the sequence gets under the current **policy** model and under the frozen **reference** model (the SFT checkpoint DPO started from), summed over that response's tokens. Illustrative numbers, in nats — not measured from a real run:

| | policy log-prob | reference log-prob |
|---|---|---|
| chosen (`y_w`) | −12.0 | −14.0 |
| rejected (`y_l`) | −9.0 | −8.0 |

It's worth noticing why the rejected response starts with a *less* negative raw log-prob under both models: it's the longer, hedgier, more generically-assistant-sounding continuation — often exactly the statistically safe completion an under-tuned model favors — while "Paris." is short and specific, which a comparably-sized model may assign somewhat lower raw probability to purely for being less hedged. This is part of why preference tuning is needed at all: raw likelihood doesn't automatically track what a human would actually prefer.

## Step by step

### 1. Compute each response's implicit reward margin

DPO treats `beta * (log pi_theta(y|x) - log pi_ref(y|x))` as an implicit reward:

```python
beta = 0.1

logp_policy_chosen   = -12.0
logp_ref_chosen      = -14.0
logp_policy_rejected = -9.0
logp_ref_rejected    = -8.0

r_chosen   = beta * (logp_policy_chosen - logp_ref_chosen)      # 0.1 * 2.0  = 0.2
r_rejected = beta * (logp_policy_rejected - logp_ref_rejected)  # 0.1 * -1.0 = -0.1
```

> **Why this step?** This is DPO's central trick: instead of training a separate reward model, it defines the "reward" of a response as how much more, or less, likely the current policy makes it relative to the frozen reference model. A positive value means the policy has moved toward that response since the reference checkpoint; negative means it's moved away.

### 2. Compute the margin and the loss

```python
import math

margin = r_chosen - r_rejected          # 0.2 - (-0.1) = 0.3

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

loss = -math.log(sigmoid(margin))       # -log(sigmoid(0.3))
# sigmoid(0.3) ~= 0.5744
# loss ~= 0.5539
```

> **Why this step?** The margin is the gap between how much the policy prefers the chosen response over the rejected one, relative to what the reference model would say. Passing it through `-log(sigmoid(...))` gives a loss that's high when the margin is very negative (the policy prefers the rejected response more than the reference did) and low when it's strongly positive. At margin = 0 (no separation yet), the loss is exactly `-log(0.5) ~= 0.693`; our 0.554 shows the policy already has a bit of the right separation baked in from these numbers.

### 3. See what the gradient actually pushes on

DPO's gradient with respect to the policy's log-probabilities has this form:

```
d(loss)/d(logp_policy_chosen)   = -beta * (1 - sigmoid(margin))
d(loss)/d(logp_policy_rejected) =  beta * (1 - sigmoid(margin))
```

With `1 - sigmoid(0.3) ~= 0.4256`:

```
d(loss)/d(logp_policy_chosen)   ~= -0.1 * 0.4256 ~= -0.0426
d(loss)/d(logp_policy_rejected) ~=  0.1 * 0.4256 ~=  0.0426
```

> **Why this step?** Gradient descent moves parameters opposite the gradient. A negative gradient on the chosen response's log-probability means the step *increases* it; a positive gradient on the rejected response's means the step *decreases* it. One gradient step nudges the policy to say "Paris." a little more confidently and the hedgy non-answer a little less. Note that the step size, `beta * (1 - sigmoid(margin))`, automatically shrinks as the model already separates the pair well — as `sigmoid(margin)` approaches 1 — so DPO naturally stops pushing hard on pairs it has already learned.

## Where it breaks (+fix)

**Beta set too high.** Small log-prob differences produce large margins and the sigmoid saturates almost immediately, so the model makes large, potentially destabilizing jumps on individual examples. Beta is the single most important DPO hyperparameter to sweep — too high overfits fast to whichever pairs are in a batch, too low barely moves the policy.

**Stale reference log-probs.** If the reference model's log-probs are computed once and cached against a checkpoint that no longer matches what's being trained against (a bug, or a reference-model swap mid-run), the margin is comparing the policy to the wrong baseline, and the "implicit reward" numbers become meaningless. The reference model must stay frozen and exactly match the checkpoint the policy started from for the whole run.

**A dataset of very easy pairs.** If chosen and rejected are trivially different in quality, the margin climbs fast and then, since `1 - sigmoid(margin)` shrinks toward zero, contributes almost no further gradient. Training saturates on easy pairs while harder, more informative pairs may need heavier representation in the dataset to keep contributing signal.

## Takeaways

- DPO needs only the log-probabilities of the same two responses under two models — no reward model, no sampling loop, no RL algorithm.
- The loss is a log-sigmoid over the difference of the two responses' policy/reference log-prob gaps, implementable in a few lines on top of any model that can compute log-probabilities.
- The gradient's magnitude is self-limiting: largest when the model hasn't yet separated the pair, shrinking automatically as separation improves.

**Related:** [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods), [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [Logits to Probabilities by Hand](/learn/llm-foundations/logits-to-probabilities-by-hand)
