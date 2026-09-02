---
title: "How a language model actually answers, in the words you need"
phase: ai
module: prompts-and-structure
kind: lesson
summary: "A language model predicts the next token from everything sitting in its context window, nothing more. That one mechanic explains most of what looks like magic in a demo and most of what looks like a bug in production."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Explain, without hand-waving, why a model's answer depends entirely on what is in its context window at the moment it answers.
  - Diagnose a wrong or missing answer by asking what was in context, before assuming the model is broken.
  - Explain temperature and sampling well enough to decide when to turn them down.
  - "Tell a domain expert the difference between what the model learned during training and what you gave it at request time."
artifact: A one-paragraph script for the first time a customer stakeholder asks "why did it say that", written into your journal.
---

A demo goes well and then someone in the room, usually the person who actually knows the domain, asks the only question that matters: "does it really know our policy, or is it guessing?" The honest answer requires understanding one mechanic, and once you have it, most of what looks like magic and most of what looks like a bug are the same explanation.

## What the model is actually doing

A language model is a function that takes a sequence of tokens and predicts the most likely next token. It emits that token, appends it to the sequence, and repeats. That is the entire mechanism. It does not pause mid-answer to look something up unless you have built a system around it that does that — that is retrieval, covered later in this module, and it is bolted on, not built in. Everything the model uses to produce the next token comes from one of two places: patterns baked into its weights during training, or tokens sitting in front of it right now, in the context window.

## The context window is the whole world

For the duration of one call, the model's world is the context window: the system prompt, the conversation history, any documents or tool results you placed there, and the tokens it has generated so far in this response. If a fact is not in the weights and not in the context window, the model cannot know it — but it will still answer, because producing a plausible next token is the only thing it knows how to do. "It doesn't know the answer" and "it will confidently give you one anyway" are not in tension. That is hallucination, and it is a category, not an exception.

This reframes a whole class of objections you will hear on-site. "It got our numbers wrong" is rarely a model-quality problem. It is a "the correct numbers were not in the context window" problem, and the fix is a retrieval or tool-calling change, not a newer, "smarter" model.

## Training-time knowledge versus request-time context

Two different sources feed every answer. Training-time knowledge is compressed, general, and frozen at some cutoff — useful for language itself, reasoning patterns, common code idioms, broad world knowledge. Request-time context is specific, current, and yours — the customer's actual policy document, this ticket, this account's history. Most of an FDE's technical work is closing the gap between what a model knows in general and what a specific customer needs it to reason over precisely, and the lever for that is what you put in the context window, not a hope that the model already knows a private company's HR policy.

Say this to a stakeholder plainly, in these words: "The model has read most of the public internet up to some date. It has never read your internal wiki unless we put it there for this conversation." That sentence resolves a surprising share of week-one trust conversations, in a bank in Mumbai as readily as a hospital chain in Ohio.

## Tokens, not words

Models operate on tokens, not words or characters. A token is roughly a word-piece; unusual names, numbers, and non-English text often split into more tokens than their length suggests. This matters for two field-relevant reasons. First, context windows have a token budget, not a word-count budget — a page of Hindi, a table of SKU codes, or a block of transliterated Hinglish can consume that budget faster than the visible text length implies. Second, character-level tasks — count the vowels, reverse this string, get the fourth digit — are unreliable, because the model is reasoning over token boundaries that rarely line up with individual characters. If a customer needs exact character-level manipulation, do it in code, not in the prompt.

## Sampling and temperature

After computing a probability distribution over the next token, the model does not always pick the single most likely one. A temperature parameter controls how much randomness gets introduced into that choice. Near zero, the model behaves close to deterministically, picking the highest-probability token almost every time — repeatable, and the right setting for extraction, classification, or anything you plan to score against a fixed eval answer. Higher temperature samples more broadly across plausible tokens — useful for brainstorming or varied phrasing, wrong for a claims-routing decision you will need to reproduce in an audit eighteen months from now.

The rule of thumb: if the eval you built in the previous lesson expects a specific correct answer, temperature is not a creativity dial, it is a reliability dial. Turn it down for anything that feeds a decision.

## Three failure patterns this explains

You will meet these on-site. All three come back to the same mechanic.

**"It contradicted itself across two turns."** Something earlier in the conversation — a tool result, a prior instruction, a system-prompt edit — is no longer effectively present, or a new instruction is competing with an old one still sitting in context. Read the transcript before you suspect the model.

**"It made up a policy number."** No document containing that number was in context at the time. The model produced a plausible-looking one because producing plausible tokens is what it does when the real answer is absent. This is the argument for retrieval, and for an eval that specifically checks for this failure mode.

**"It worked yesterday and not today."** Check first whether the context changed — a longer conversation pushed an early instruction further back, a document got re-chunked differently, a tool started returning a slightly different shape. Providers do occasionally change what a stable model name points to; that is a real cause, but it is the third thing to check, not the first.

## What you should be able to do now

An interviewer, or a customer's own engineer, can ask "why is it hallucinating here" and a weak answer starts talking about model quality. A strong answer asks what was actually in the context window for that specific call, and whether the eval set from the previous lesson already has a labelled example that looks like this failure.

Write the one-paragraph script now: exactly what you will say, in plain words, the first time a business stakeholder in the room asks why the system got something wrong. It is usually some version of "the model didn't have the right document in front of it when it answered, here is how we fix that" — never "the AI made a mistake".
