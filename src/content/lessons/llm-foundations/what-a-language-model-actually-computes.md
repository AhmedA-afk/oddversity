---
title: "What a Language Model Actually Computes"
track: "llm-foundations"
status: live
summary: "An LLM is a function from token ids to a probability distribution over the vocabulary — nothing more mystical than that."
duration: "6 min read"
---

Ask someone what a language model does and you'll hear "it answers questions." That's true the way "a car goes places" is true — accurate, and useless for understanding what's under the hood.

## What it is

Precisely: an LLM is a function. It takes a sequence of token ids and returns a probability distribution over every token in its vocabulary — its guess at what comes next.

```text
f(token_ids) → probability distribution over vocab_size tokens
```

Feed it `[464, 3139, 286, 4881, 318]` ("The capital of France is") and it hands back one number for every one of its ~50,000 possible next tokens — how likely each one is to follow. Nothing about "answering," "understanding," or "knowing" appears in that description, because none of it is necessary to describe what the function does.

## The mental model

Picture a single giant lookup-and-compute machine: it never sees "a question," only a list of integers. It has no concept of "conversation," "task," or "answer" — the training process just optimizes this one function to be very good at predicting the next integer in text written by people who ask questions, hold conversations, and write code. Everything you associate with "talking to an AI" is a *behavior that falls out of running this one function repeatedly*, not a separate capability bolted on.

## Why it works this way

Framing it as a function to a distribution — not to a single answer — is what makes generation possible at all. A distribution can be sampled from, which is what lets the same model produce a different, still-reasonable continuation each time; a single fixed answer couldn't. It's also what makes the model trainable with plain supervised learning: at training time you compare the predicted distribution against the one real next token that appeared in the text, and push the distribution toward it. One clean mathematical object — a distribution — does both jobs.

## A concrete example (shown)

"Chat," "code completion," and "translation" all reduce to the identical operation:

```text
Chat:        f(["User: what's 9*8?", "Assistant:"])      → distribution over next token
Code:        f(["def add(a, b):", "    return"])          → distribution over next token
Translation: f(["Traduire en français:", "cat", "→"])     → distribution over next token
```

There is no separate "chat mode" function or "translation mode" function inside the model. It's the same `f`, called on different token sequences, run in [a loop](/learn/llm-foundations/the-autoregressive-generation-loop) until a stop condition is hit. The "modes" are a property of what text you feed in, not a property of the model switching internal gears.

## Where it shows up

This framing is why prompting works the way it does: you're not "instructing" a separate reasoning module, you're choosing which token sequence `f` gets called on, to bias the distribution it returns. It's also why [in-context learning](/learn/llm-foundations/in-context-learning) is possible without any weight update — a few examples in the prompt just change the input to the *same* frozen function.

## Watch out for

- **Treating "it answers questions" as a mechanism, not a description.** It's a true summary of the behavior, but if you use it to predict what the model will do in an edge case, you'll guess wrong — reason from the function definition instead.
- **Assuming there's a hidden "answer" the model retrieves and then phrases.** There's one function, one distribution, one sampled token at a time — see [the myths lesson](/learn/llm-foundations/myths-about-how-llms-work) for the "it looks it up" misconception specifically.
- **Forgetting the distribution is over the *whole* vocabulary, every single time** — even for the 400th token of a long answer, the model is still choosing from all ~50,000 candidates, not from some narrowed-down "remaining words in this sentence."

## Where next

The next lesson makes this framing pay off: [why predicting the next word is enough](/learn/llm-foundations/why-next-word-prediction-is-enough) to produce grammar, facts, arithmetic, and translation, all from the one function defined here. If you want the numeric mechanics of turning `f`'s raw output into that distribution, jump to [logits to probabilities, by hand](/learn/llm-foundations/logits-to-probabilities-by-hand).

**Related:** [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [In-Context Learning](/learn/llm-foundations/in-context-learning), [The Whole Game: One Token, End to End](/learn/llm-foundations/whole-game-one-token-end-to-end)
