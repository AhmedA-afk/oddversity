---
title: "Prefilling: Starting the Assistant's Answer for It"
track: "prompt-engineering"
status: live
summary: "Asking for a format is a request the model can decline to fully honor. Prefilling the opening tokens makes the alternative unreachable."
duration: "6 min read"
---

[Prefilling Responses to Steer Output Format](/learn/prompt-engineering/prefilling-responses) covers the mechanism and several uses — forcing JSON, skipping hedging, resuming a cut-off answer. This lesson zooms into one specific comparison worth understanding precisely: why seeding the first tokens is *structurally* more reliable than asking politely for the same format, not just a little more reliable.

## What it is

Prefilling means you write the literal opening tokens of the assistant's turn yourself, and the model's generation starts from a position already inside your intended shape — after your `{`, after your `1.`, after your `<answer>`. It's not a setting or a flag; it's content, indistinguishable to the model from anything else already in context.

## The mental model

A chat model generates one token at a time, each conditioned on everything before it. An instruction like "respond with JSON only, no commentary" is itself just tokens the model reads at generation time — it shifts the *probability* the model assigns to opening with `{` versus opening with "Sure, here's the JSON you asked for:", but it doesn't remove the second option from the space of things the model could still say. Under a long prompt, an unusual request, or just ordinary sampling variance, the less-desired option still has non-zero probability and sometimes wins.

A prefill doesn't compete for probability at all — it removes the decision. If the assistant's turn already begins with `{`, there is no token sequence starting from `{` that reads as "Sure, here's the JSON you asked for." That string doesn't start with a brace. The model's first free choice happens one token *after* your prefill, already inside the structure you wanted, and every previously-possible preamble is now a completion the model literally cannot produce at that position, because it would first require producing your prefill's tokens differently — which have already happened.

## Why it works this way

This falls directly out of how the API represents a conversation: whatever text sits in the assistant-role slot before generation starts, prefill included, becomes part of the fixed input for the very next forward pass. The model doesn't distinguish "tokens I wrote" from "tokens the caller pre-supplied" — it just conditions on everything present and predicts what comes next. Reliability, in other words, isn't a property of how firmly you phrase the instruction. It's a property of what continuations are even reachable from where generation actually starts.

## A concrete example (shown)

Forcing JSON and forcing a numbered list, contrasted against just asking:

```python
# Asking politely — a probability, not a guarantee
messages = [
    {"role": "user", "content": (
        "List three prime numbers greater than 100. "
        "Respond with a numbered list only, no preamble."
    )}
]
```

A perfectly reasonable model response to this can still be:

```
Sure! Here are three prime numbers greater than 100:

1. 101
2. 103
3. 107
```

— which satisfies the instruction's *spirit* while breaking a parser that assumes line one is the first list item.

```python
# Prefilling — a structural guarantee on the opening
messages = [
    {"role": "user", "content": "List three prime numbers greater than 100."},
    {"role": "assistant", "content": "1."},
]
```

There is no token sequence continuing from `1.` that reads as "Sure! Here are three prime numbers:" — the model's completion is grammatically forced to continue the list format from that exact position: `1. 101\n2. 103\n3. 107`.

## Where it shows up

Structured-extraction pipelines that feed a completion straight into `json.loads` (see [Worked Example: Prefilling to Guarantee JSON](/learn/prompt-engineering/prefill-to-force-json-worked) for this end to end), enumerated output a downstream system indexes by position, forcing an opening tag like `<answer>` ahead of an XML-flavored [structured output](/learn/prompt-engineering/structured-output) contract, and resuming a generation that hit a token limit mid-sentence by prefilling the truncated tail.

## Watch out for

- **A prefill guarantees shape, not content.** A prefilled `{` still needs a real JSON parser and a repair path on the other end for a structurally invalid or truncated object — see [the validation and repair loop](/learn/prompt-engineering/validation-and-repair-loop).
- **Not every API surface supports assistant-turn prefill identically.** Confirm the behavior against the specific provider and endpoint you're using rather than assuming it's universal across every chat interface.
- **A prefill can't override a genuine refusal.** If a model has real reason to decline a request, seeding its opening tokens doesn't change that decision — it only removes ambiguity about *format* on requests it was already going to fulfill.

## Where next

[Worked Example: Prefilling to Guarantee JSON](/learn/prompt-engineering/prefill-to-force-json-worked) walks this exact mechanism through a real extraction task, before and after. [The Steering Levers: Role, Prefill, Format, Examples](/learn/prompt-engineering/steering-levers-overview) places prefilling next to the other tools available and helps decide which one a given failure actually calls for.

**Related:** [Prefilling Responses to Steer Output Format](/learn/prompt-engineering/prefilling-responses), [Worked Example: Prefilling to Guarantee JSON](/learn/prompt-engineering/prefill-to-force-json-worked), [Structured Output](/learn/prompt-engineering/structured-output), [Validation and Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [The Steering Levers: Role, Prefill, Format, Examples](/learn/prompt-engineering/steering-levers-overview)
