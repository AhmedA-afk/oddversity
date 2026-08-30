---
title: "Hidden Markov models, filtering, and decoding"
track: "maths-foundations"
status: live
summary: "A hidden Markov model (HMM) has a Markov latent state, an initial distribution, transition probabilities, and an observation/emission model."
duration: "4 min read"
---

## The short answer

A hidden Markov model (HMM) has a Markov latent state, an initial distribution, transition probabilities, and an observation/emission model. Filtering computes the posterior over the current hidden state given observations so far; Viterbi decoding finds the most likely whole state path. Keep transition and emission assumptions distinct, and test zero-probability and normalization failures explicitly.

## Why this matters

Many systems observe noisy symptoms rather than the state of interest: machine
health, speech units, user intent, or weather. An HMM gives a small, inspectable
model for combining current evidence with temporal continuity. It also makes a
useful warning: a plausible latent story is not the same as an identified truth.

## How it works

With latent state `z_t` and observation `o_t`,

```text
P(z_t | z_{0:t−1},o_{0:t−1}) = P(z_t | z_{t−1})
P(o_t | z_{0:t},o_{0:t−1}) = P(o_t | z_t).
```

The forward/filtering recursion is
`α_t(j)=P(o_t|z_t=j)Σ_i α_{t−1}(i)A_{ij}`, followed by normalization. Viterbi
replaces sums with maxima and stores backpointers:
`δ_t(j)=B_j(o_t)max_i δ_{t−1}(i)A_{ij}`. In long sequences, use log probabilities
or scaling to avoid underflow.

## Worked examples and variations

### Example A: weather and umbrella

**Input:** hidden weather `{sun,rain}`, observations `{umbrella,no}`. **Mechanism:**
transition persistence combines with emission likelihood. **Output:** posterior
rain probability after an umbrella observation. **Inspect:** compare prior and
posterior; the observation need not determine the state. **Decision:** report
uncertainty when actions depend on it.

### Example B: filtering versus decoding

**Input:** observations `umbrella, no, umbrella`. **Mechanism:** filtering asks
the distribution at the last time; Viterbi asks for the most likely entire path.
**Output:** they can disagree at earlier positions. **Inspect:** retain both
outputs. **Decision:** use filtering for current belief and Viterbi for a global
offline sequence label.

### Boundary case: impossible emission

**Input:** an observation with `P(o|z)=0` for every state. **Mechanism:** forward
probability becomes zero and normalization is undefined. **Output:** model cannot
explain the data. **Inspect:** surface an explicit unknown/noise state rather than
returning NaN. **Decision:** revise emissions or abstain.

### Counterexample: observed sequence is Markov

**Input:** observations are noisy sensor readings of a persistent hidden machine
state. **Mechanism:** marginalizing the latent state generally gives observation
dependencies across time. **Output:** treating observations as independent can
misestimate persistence. **Inspect:** compare conditional observation statistics.
**Decision:** retain the latent-state model or test the simpler assumption.

## An illustrative story

An illustrative fault detector smooths a noisy alarm stream with an HMM and finds
fewer alerts. If the transition probability is set too high, genuine rapid state
changes are suppressed. The posterior is only as credible as its transition and
emission calibration.

## Two ways to see it

### Probabilistic view

Filtering is repeated Bayes: predict through transitions, update with the new
likelihood, normalize. Viterbi is dynamic programming over path scores.

### Systems view

The HMM is a compact sensor-fusion contract. Its hidden variables are useful
hypotheses, not direct measurements; validate them against labeled events and
posterior predictive behavior.

## Hands-on

Implement a two-state forward pass and Viterbi decoder for the weather example.
Print normalized beliefs at each step and a backpointer table. Add a log-space
version for a 1,000-step sequence.

**Failure state:** forget normalization, transpose the transition matrix, or
allow an all-zero emission row. **Test:** every filtering vector must sum to one,
the short sequence must match a hand calculation, and the all-zero fixture must
return an explicit model-error/abstain result. **Reset:** restore orientation,
normalization, and the unknown-observation policy.

## Checkpoint

- [ ] Name the initial, transition, and emission components of an HMM.
- [ ] Explain filtering versus Viterbi decoding.
- [ ] Compute one forward update and normalize it.
- [ ] State one violated assumption that makes an HMM misleading.

## What this does not solve

An HMM does not prove that the latent states are real, uniquely identified, or
stationary. Simple emissions can be too weak, and a high posterior can reflect a
mis-specified model rather than strong evidence.

## Continue, go deeper, apply it

- Continue: Graph notation, adjacency, incidence, and degree matrices
- Go deeper: Bayesian posterior inference and predictive checks
- Apply it: Probabilistic modelling in ML
