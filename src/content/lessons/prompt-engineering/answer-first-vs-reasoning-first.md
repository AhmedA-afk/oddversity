---
title: "Answer-First vs Reasoning-First Ordering"
track: "prompt-engineering"
status: live
summary: "Whichever the model writes first is decided with the least information - why that matters for accuracy, latency, and truncation."
duration: "6 min read"
---

[Answer-first prompting](/learn/prompt-engineering/answer-first-prompting) is good advice for structuring *your* prompt — state the output contract before the context. It says nothing about the order of the *model's own* response when that response contains real reasoning. That's a separate decision, and getting it backwards on a task that actually needs reasoning quietly breaks the thing chain-of-thought is supposed to fix.

## What it is

Two orderings for a response that contains both a conclusion and a justification:

- **Answer-first:** the model states its label, number, or decision immediately, then explains it.
- **Reasoning-first:** the model works through steps, then states the conclusion at the end — this is what [chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) produces.

## The mental model

Generation is strictly left to right, and every token conditions only on what came before it — including the model's own prior output, as covered in [next-token prediction](/learn/llm-foundations/next-token-prediction). That means whichever piece the model writes *first* is decided with strictly less information than whichever it writes *second*.

An answer written first is committed before a single reasoning token exists to inform it. Whatever "explanation" follows can only be built on top of a conclusion already locked in — it can rationalize the decision, but by construction it cannot have *caused* it. Reasoning written first is the opposite: every step exists in context before the conclusion is generated, so the conclusion genuinely gets to condition on the steps. This is the same conditioning fact from [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does) — it just tells you *where* the reasoning needs to sit relative to the answer for the effect to apply at all.

## Why it works this way

Reasoning-first gets you the real benefit: an answer that's actually a function of the steps. Answer-first gives that up, but buys two things that are sometimes worth more:

1. **Lower perceived latency.** In a streaming interface, the user sees the decision the instant it's generated, rather than waiting through a full reasoning trace before the field they actually wanted appears.
2. **Resilience to truncation.** If a token limit or timeout cuts generation short, an answer-first response has already delivered the field that matters. A reasoning-first response cut short mid-trace can lose the answer entirely — there's nothing usable in a transcript that stops three lines before its `FINAL_ANSWER:` line.

## A concrete example (shown)

A support-ticket urgency classifier, prompted two ways.

**Reasoning-first:** `"Think through the ticket, then output: Urgency: <urgent/normal>."` If the response gets cut off by a `max_tokens` limit mid-trace — `"...the customer mentions a billing error but also says there's no immediate deadline, and comparing this to typical..."` — generation stops there. No `Urgency:` line was ever reached. The pipeline gets nothing.

**Answer-first:** `"Output Urgency: <urgent/normal> first, then explain in one sentence."` For most tickets this is safe and fast. But on a genuinely ambiguous ticket, the model locks in a snap label — say `Urgency: normal` — before any deliberation happens, and the "explanation" that follows describes only the surface features consistent with *that* label. A countervailing signal that a moment of real consideration would have caught never gets surfaced, because the conclusion was already written before there was anywhere for it to go.

## Where it shows up

Answer-first suits real-time chat or triage UIs where perceived latency matters, and any pipeline stage whose downstream step can truncate, time out, or retry — you want the useful field to survive a cut response. Reasoning-first is worth the latency and truncation risk for high-stakes, single-shot judgment calls — moderation decisions, complex classification, anything where a wrong answer costs more than a slow one — especially paired with the delimiter convention from [extracting the final answer after reasoning](/learn/prompt-engineering/extracting-final-answer-from-reasoning), which keeps the answer easy to pull out even after a long trace.

## Watch out for

- Don't mistake an answer-first "explanation" for genuine reasoning evidence. It's necessarily post-hoc, so treating it as proof of a considered decision is the same mistake covered in [cargo-cult reasoning](/learn/prompt-engineering/cargo-cult-reasoning).
- If latency forces answer-first but accuracy still matters, validate the shortcut offline — run the same cases reasoning-first with [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling-explained) to see how often the snap answer would have differed from the considered one.
- If you use reasoning-first, always leave token budget margin and use a delimited final-answer convention, so a truncated trace fails loudly (missing delimiter) instead of silently returning nothing useful.

## Where next

**Related:** [Answer-First Prompting](/learn/prompt-engineering/answer-first-prompting), [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Reliably Extracting the Final Answer After Reasoning](/learn/prompt-engineering/extracting-final-answer-from-reasoning), [Which Reasoning Technique When](/learn/prompt-engineering/reasoning-technique-decision-guide), [Cargo-Cult Reasoning](/learn/prompt-engineering/cargo-cult-reasoning)
