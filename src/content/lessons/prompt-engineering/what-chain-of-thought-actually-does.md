---
title: "What Chain-of-Thought Actually Does"
track: "prompt-engineering"
status: live
summary: "Chain-of-thought isn't the model explaining itself - writing steps gives it more computation before it commits to an answer."
duration: "7 min read"
---

Ask a model to solve a multi-step problem and give you just the number, and it often gets it wrong. Ask the same model to work through the steps first, and it gets it right. Nothing about the weights changed between those two calls — what changed is how much computation the model got to spend before it had to commit.

## What it is

[Chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) is the practice of getting a model to produce intermediate reasoning steps before its final answer, instead of jumping straight to a conclusion. The framing people usually reach for — "the model shows its work" — makes it sound like the answer already exists somewhere inside the model and the reasoning trace is just a courtesy explanation bolted on afterward. That framing is backwards. The steps aren't a description of a pre-formed answer. They're part of how the answer gets computed.

## The mental model

A model generates one token at a time, and every token it has already written becomes part of the input for predicting the next one — that's the whole mechanism covered in [next-token prediction](/learn/llm-foundations/next-token-prediction). Each generated token gets one forward pass worth of computation. If you force the model to answer in a single token or a short phrase, you've capped the total computation it can spend on the problem to that one pass.

Writing reasoning steps changes that budget. Each new token's forward pass gets to condition on every reasoning token that came before it — including the intermediate results the model itself just wrote. That's effectively many forward passes chained together, with partial results threaded through the visible text instead of held in some hidden workspace. It's not that the model "thinks harder" in some vague sense; it's that it gets more total compute, spent across more steps, each one simpler than the whole problem.

## Why it works this way

Mapping a multi-step word problem directly from question to final number is a hard function to compute in one pass — it requires combining several intermediate facts that the model has to derive and hold simultaneously without writing any of them down. Writing an intermediate value — a subtotal, a count, a comparison — turns that one hard leap into a sequence of easier local computations, each of which only has to condition on the concrete, already-written result of the last one. This is the same idea as [why prompts steer next-token prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) applied recursively to the model's own output, not just your input: your prompt shapes what's probable next, and once the model starts writing, its own prior tokens do too.

## A concrete example (shown)

Take this problem: *"A parking garage starts with 80 cars. In one hour, 20 cars leave, then 30 more arrive, and finally half of all the cars currently in the garage leave for a lunch break. How many cars remain?"*

**With chain-of-thought:**

```text
Start: 80 cars.
20 leave: 80 - 20 = 60.
30 arrive: 60 + 30 = 90.
Half leave for lunch: 90 / 2 = 45.
Answer: 45 cars remain.
```

Each line is a genuine intermediate result the next line depends on — 90 has to exist as a written token before "half of 90" can be computed correctly.

**Without chain-of-thought** (prompted for just the number): a bare "give me the number" prompt commonly produces something like **90**. A plausible mechanism: the model tracks the arrivals and departures, arrives at a running count that looks like a clean answer, and commits to it as soon as the count stabilizes — without a written token forcing it to notice there's one more clause left to apply. There's no scratchpad token holding "and then halve this," so nothing in the generated sequence conditions the final answer on that last step.

## Where it shows up

Multi-step arithmetic and logic problems, multi-hop question answering (where an answer depends on combining facts from two different places), code that has to apply several transformations in sequence, and agentic planning where a later action depends on the result of an earlier one. Anywhere the correct answer is a function of intermediate values the model would otherwise have to hold invisibly.

## Watch out for

- **A trace is not a correctness guarantee.** A fluent, well-organized chain of steps can still contain one wrong step, and nothing about how confident or detailed it reads tells you that. See [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling-explained) for a technique that catches this by voting across multiple traces instead of trusting one.
- **Reasoning isn't free, and it isn't always warranted.** Forcing steps onto a task that doesn't have any — a lookup, a single-fact classification — burns tokens and latency without touching accuracy, and can occasionally make things worse. See [when chain-of-thought hurts](/learn/prompt-engineering/when-cot-hurts-accuracy).
- **Don't read the trace as introspection.** The steps are genuinely part of the computation, but that doesn't make them a transparent readout of "why" the model did something — a trace can still rationalize toward a direction it already leaned, especially under [answer-first ordering](/learn/prompt-engineering/answer-first-vs-reasoning-first).

## Where next

For the intuition behind *why* writing something down helps a token predictor, see [reasoning as a scratchpad](/learn/prompt-engineering/reasoning-as-scratchpad-intuition). For a full worked problem taken step by step, including where the reasoning itself can still go wrong, see [chain-of-thought on a multi-step problem](/learn/prompt-engineering/cot-on-a-word-problem).

**Related:** [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting), [Reasoning as a Scratchpad for a Token Predictor](/learn/prompt-engineering/reasoning-as-scratchpad-intuition), [Worked Example: Chain-of-Thought on a Multi-Step Problem](/learn/prompt-engineering/cot-on-a-word-problem), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [When Chain-of-Thought Hurts](/learn/prompt-engineering/when-cot-hurts-accuracy)
