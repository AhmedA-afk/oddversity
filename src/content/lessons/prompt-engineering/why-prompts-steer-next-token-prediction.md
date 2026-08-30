---
title: "Why Prompting Works: Steering a Next-Token Predictor"
track: "prompt-engineering"
status: live
summary: "A prompt works by reshaping the model's next-token probabilities, not by being understood or obeyed."
duration: "6 min read"
---

Underneath every clever prompt is the same mechanical fact: you are not talking to something that understands your request. You are shaping the numbers that decide its next word.

## What it is

At each generation step, a language model computes a probability distribution over every possible next token, conditioned on everything currently in its context window, and then a token gets sampled from that distribution. As covered in [next-token prediction](/learn/llm-foundations/next-token-prediction), this is the entire generative mechanism — there is no separate "understand the request" step that runs before it. A prompt is simply the portion of that context you get to write before generation starts. Prompting works because the tokens you place there change the distribution the model computes at every step that follows.

## The mental model

Picture the model holding, at every single step, a ranked list of "what plausibly comes next" over its entire vocabulary. Generation is that list collapsing to one token, over and over, with each new token appended to the context and folded into the next list. Your prompt doesn't get consulted once and then set aside — it stays in the context, still exerting pressure on the distribution, for as long as it's in the window. This is also why generated text tends to stay "in character" with your prompt: each new token was chosen because it was likely given everything before it, prompt included.

## Why it works this way

The model learned its next-token distributions from a training process that was, itself, next-token prediction over an enormous body of text — including text where questions are followed by answers, instructions are followed by compliant continuations, and category prompts are followed by single-word labels. Those patterns are now baked into the distribution the model computes for any context that resembles them. A prompt that looks like "Task: ... Ticket: ... Label:" pulls probability mass toward a short label token, not because the model decided to comply, but because contexts shaped like that were followed by short labels far more often than not in what it learned from. This is the same mechanism that lets a handful of examples in the prompt itself change behavior — see [in-context learning](/learn/llm-foundations/in-context-learning) for how that generalizes beyond single examples.

## A concrete example (shown)

Compare two prompts as raw continuations, ignoring instructions entirely:

```text
Prompt A: "Paris is"
Plausible next tokens (illustrative, not exhaustive):
  "the capital of France"
  "a city in Europe"
  "known for the Eiffel Tower"
  "where I spent my honeymoon"
  "a district in Texas"

Prompt B: "The capital of France is"
Plausible next tokens (illustrative):
  "Paris" — overwhelmingly dominant
```

Adding "The capital of" and "France" didn't make the model "know more" than it did with prompt A — it already knew all of it. What changed is which of the things it knows became the likely continuation. Now do the same comparison for a task, not a fact:

```text
Prompt C: "I was charged twice this month"
Plausible continuation: more sentence, e.g. "and I'd like a refund" — the
model keeps writing the customer's message, because nothing in the context
signals that a classification pattern is in play.

Prompt D:
  Classify the ticket below as billing, technical, or account.
  Ticket: "I was charged twice this month"
  Label:
Plausible continuation: a single short token, e.g. "billing" — the context
now matches the "Task / Ticket / Label:" pattern, so the distribution
collapses toward a one-word answer instead of more prose.
```

Nothing about the customer's sentence changed between C and D. What changed is the conditioning around it — and that's the whole lever prompting gives you.

## Where it shows up

Every structural choice you'll make later in this course is really a choice about conditioning: where you put an instruction relative to the data ([instructions, context, examples](/learn/prompt-engineering/instructions-context-examples)), how you mark the boundary between them ([delimiters and formatting](/learn/prompt-engineering/delimiters-and-formatting)), and where in the prompt an instruction sits relative to the end of the context, since recency affects how strongly it conditions the final tokens ([instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency)). Temperature, covered next in this module, is the other half of the story — it controls how the model samples from the distribution you've shaped, not the distribution itself ([temperature for prompt engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters)).

## Watch out for

- **Treating "it didn't listen" as defiance.** There's no separate compliance module to defy. If your context doesn't establish the pattern you want strongly enough, the distribution simply doesn't collapse the way you hoped — the fix is more or clearer conditioning, not a firmer tone.
- **Assuming more words always help.** Every token you add is also conditioning, including the irrelevant or contradictory ones. A paragraph of caveats can pull probability mass away from your actual instruction just as easily as toward it.
- **Forgetting that context keeps exerting pressure only while it's in the window.** A constraint stated once at the very top of a long prompt conditions every step, but its relative influence competes with everything generated after it — which is exactly why instruction placement is its own skill, not an afterthought.

## Where next

The next lesson turns this into a working intuition you can apply without doing the mechanics in your head every time: [A Prompt Is a Set of Constraints on Likely Continuations](/learn/prompt-engineering/prompt-as-conditioning-intuition).

**Related:** [Prompting Is Not Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) · [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters) · [Instructions, Context, Examples](/learn/prompt-engineering/instructions-context-examples) · [sampling: temperature and top-p](/learn/llm-foundations/sampling-temperature-top-p)
