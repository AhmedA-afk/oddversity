---
title: "Deep Dive: Why the Training Objective Rewards Guessing Over Abstention"
track: "hallucinations"
status: live
summary: "The expected-score math showing why a binary-graded objective makes guessing strictly better than saying I do not know."
duration: "7 min read"
---

*This is the deferred rigor behind [why models hallucinate](/learn/hallucinations/why-models-hallucinate) - optional depth, worth working through slowly once, since the later calibration and abstention modules build directly on this result.*

Here's the claim in one sentence: if a scoring rule gives zero credit for "I don't know" and zero credit for a wrong answer, then abstaining is never better than guessing, and is usually worse. That's not a design flaw someone could easily patch - it's a property of the arithmetic itself, and a version of this arithmetic sits underneath a large share of how language models are trained and evaluated.

## The setup

Consider a benchmark question graded by exact match: the model gets **+1** if its answer matches the reference answer, and **0** otherwise - and critically, "otherwise" includes both a wrong answer *and* an explicit abstention like "I don't know." This scoring shape is extremely common: it's how most multiple-choice and short-answer benchmarks are graded, and it's implicit in a lot of RLHF and RLVR (reinforcement learning from verifiable rewards) setups where a binary correct/incorrect signal drives the reward.

Let `p` be the model's true probability of producing the exactly correct answer if it commits to answering (this can be small - it's whatever the model's actual competence on this question is), and assume abstaining always scores 0.

## The expected-value comparison

**Strategy A: always abstain.**

```text
E[score | abstain] = 0
```

No variance, no risk, and no reward, because the grading rule doesn't distinguish "I don't know" from "I was wrong."

**Strategy B: always guess.**

```text
E[score | guess] = p * 1 + (1 - p) * 0 = p
```

As long as `p > 0` - as long as there is *any* chance at all of landing on the right answer, even by loosely pattern-matching toward something plausible - guessing has strictly higher expected score than abstaining. You don't need `p` to be large. On a four-option multiple-choice question where the model has literally no relevant knowledge and picks at random, `p = 0.25`, and:

```text
E[score | guess] = 0.25  >  E[score | abstain] = 0
```

Guessing wins by construction, not because the model is especially good at the question. The scoring rule makes "I don't know" and "confidently wrong" cost exactly the same, so there's no incentive gradient pushing toward honesty about uncertainty - only a gradient pushing toward attempting an answer, any answer, every time.

## Why this generalizes past toy benchmarks

Two things push this same shape from evaluation into the training signal itself:

**Pretraining reflects what confident text looks like.** The training corpus is mostly written by people asserting things, not hedging them - reference books, articles, documentation. Predicting the next token well on this distribution means learning to produce assertive continuations, since that's the shape of the text being predicted. There's very little training signal that says "and here is what appropriately calibrated uncertainty sounds like in this exact spot," because most human-written text doesn't hedge nearly as often as an honest epistemic state would call for.

**RLHF compounds it through comparative human preference.** A common RLHF setup shows a rater two candidate responses and asks which is better. Faced with a fluent, specific, confident-sounding answer next to a hedged "I'm not fully sure, but possibly...", raters who can't independently verify the fact - which is most raters, most of the time, since verifying is exactly the hard part - tend to prefer the more helpful-*sounding* response. The wrong-but-confident answer often wins that comparison, and the reward model trained on those comparisons learns confidence as a proxy for quality. That's the same `E[guess] > E[abstain]` inequality, just moved from a hand-computed benchmark score into a learned reward signal.

## The precise limits of this argument

Be careful about what this does and doesn't prove. It doesn't say every model is trained under exactly this reward shape - a reward model that specifically penalizes unsupported confidence, or a benchmark that gives partial credit for calibrated hedging, breaks the inequality above and is exactly the kind of fix later modules cover ([calibration-training-vs-prompting](/learn/hallucinations/calibration-training-vs-prompting), [why-rlhf-hurts-calibration](/learn/hallucinations/why-rlhf-hurts-calibration)). It also doesn't say abstention is impossible to train into a model - it says abstention has to be *actively rewarded*, because it is not the default outcome of the most common training objectives, which reward it identically to being wrong. That's the argument this whole module is building toward: hallucination-by-guessing isn't a bug introduced by careless training, it's the equilibrium that a "score = correct/incorrect, no partial credit for honesty" objective converges to, whether or not anyone intended it.

This is also why [teaching a model to say "I don't know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) has to be a deliberate intervention rather than something that emerges on its own, and why [abstention is treated as a skill to be trained](/learn/hallucinations/abstention-as-a-skill) later in this track rather than a natural byproduct of better pretraining.

**Related:** [Why Models Hallucinate](/learn/hallucinations/why-models-hallucinate), [Why RLHF Hurts Calibration](/learn/hallucinations/why-rlhf-hurts-calibration), [Teaching a Model to Say 'I Don't Know'](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Abstention as a Skill](/learn/hallucinations/abstention-as-a-skill)
