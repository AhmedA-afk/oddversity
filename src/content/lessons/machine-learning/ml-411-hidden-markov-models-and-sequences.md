---
title: "Model sequential state with hidden Markov models"
track: "machine-learning"
order: 411
status: live
summary: "Use latent-state transition and emission models for interpretable sequence structure, while testing their Markov and stationarity assumptions."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

A hidden Markov model (HMM) assumes an unobserved state changes according to a Markov transition matrix and emits each observed event. It supports sequence likelihood, state decoding, and next-step predictions when its conditional-independence assumptions are reasonable.

## Why this matters

Independent rows erase order. HMMs offer an interpretable classical baseline for behaviour, speech, operations, and biological sequences before using larger neural sequence models.

## How it works

Specify initial-state probabilities, state transitions, and emission distributions. The forward algorithm computes likelihood; forward-backward computes state posteriors; Viterbi finds the most likely state sequence. Baum-Welch is EM for unknown parameters. Validate by future sequences, not shuffled rows, and constrain state count using interpretation plus held-out likelihood.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Machine operation:** latent idle, warm-up, and fault states emit sensor ranges.
2. **Customer journeys:** states summarise browsing modes before a purchase event.
3. **Weather observations:** rainy and dry latent regimes emit noisy measurements.
4. **Boundary:** a first-order HMM remembers only the previous state, not a long season.
5. **Counterexample:** independently emitted events fail when the exact duration in a state drives behaviour.

## Two ways to see it

An HMM is a probabilistic finite-state machine. It is also a compression of an event history into an uncertainty distribution over a small set of modes.

## Hands-on

Simulate two-state sequences with known transitions, fit HMMs with two through five states, and compare held-out log likelihood and decoded paths. Deliberately shuffle timestamps before fitting and observe artificial confidence. Reset sequence order, inspect posterior uncertainty, and name states only after viewing multiple emissions.

## Checkpoint

- [ ] The state, event timing, and emission distribution are defined.
- [ ] Train/test splits preserve whole future sequences.
- [ ] State labels are presented as hypotheses, with uncertainty.

## What this does not solve

An HMM does not handle arbitrary long memory, changing transition dynamics, or causal interventions without extension.

## Continue, go deeper, apply it

Study temporal features and forecasting backtests next. Apply HMMs where latent modes are useful summaries for human investigation.

