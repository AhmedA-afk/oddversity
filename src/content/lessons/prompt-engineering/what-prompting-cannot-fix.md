---
title: "What Prompting Cannot Fix"
track: "prompt-engineering"
status: live
summary: "Some failures are prompt problems and some need retrieval, tools, or better data — telling them apart saves days."
duration: "7 min read"
---

The most expensive mistake in this entire discipline is spending three days rewording a prompt to fix a problem that no wording could ever fix.

## What it is

Prompting reshapes which of a model's existing capabilities and knowledge get surfaced, in what order, in what format, and with what emphasis. It cannot add a fact the model was never trained on and doesn't have in context. It cannot make a probabilistic process behave like exact arithmetic at scale. It cannot see past its training cutoff or into your private systems unless you put that information in the prompt yourself. It cannot guarantee truth. Draw the line early: prompt-solvable problems are about *shape* — formatting, focus, tone, structure, which of several known things to emphasize. Non-prompt problems are about *substance the model doesn't have* — missing knowledge, true recency, exact large-scale computation, or guaranteed reliability against the model's own uncertainty.

## The mental model

Split every failure into one of two buckets before you touch the wording:

| Prompt-solvable | Not prompt-solvable |
|---|---|
| Wrong format | Model was never given the fact |
| Wrong tone or audience | Information postdates training and isn't in context |
| Missing or unclear structure | Exact arithmetic over large numbers |
| Model focuses on the wrong part of the input | Needs to call an external system to act or verify |
| Inconsistent across runs at high temperature | Model is confidently wrong about something it half-knows |

If your failure is in the left column, keep iterating on the prompt — that's what the rest of this course is for. If it's in the right column, iterating on the prompt will produce more confident-sounding wrong answers, not correct ones, no matter how many hours you spend on it.

## Why it works this way

A prompt only ever conditions the model's next-token distribution over what it already represents — see [why prompts steer next-token prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction). If a fact was never in training data and isn't sitting in the context window right now, there is no distribution to steer toward it; the model will pattern-match to the closest thing it does know and produce something fluent and wrong. And a phrase like "please be extremely accurate" or "double-check your math" is itself just more conditioning tokens — it can nudge the model toward patterns associated with careful-sounding text, but it can't grant it information or exact computation it structurally doesn't have. See [what LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) for the fuller picture of this boundary.

## A concrete example (shown)

```text
Attempt 1: "What is today's date?"
Attempt 2: "What is today's date? Please be precise and don't guess."
Attempt 3: "You have access to real-time information. What is today's date?"
```

None of these rewordings can work — the model has no clock and no live feed, and telling it that it does doesn't create one. Compare that to what actually fixes it:

```text
Today's date is 2026-08-30. Given that, how many days remain until the end
of the month?
```

The moment the fact is in the context, the model handles it fine — because now it's a prompt-solvable problem (extracting and reasoning over a given fact), not a knowledge problem. This is the same reason a support-bot prompt that keeps getting corrected for "not knowing" a customer's account status needs retrieval — pulling the actual account record into context — rather than a cleverer instruction. See [what is RAG and when to use it](/learn/rag/what-is-rag-and-when-to-use-it). The same logic applies to a prompt asked to multiply two twelve-digit numbers reliably: no phrasing makes token-by-token generation as exact as a calculator at that scale, and the fix is handing the computation to an actual tool, not a better-worded instruction.

## Where it shows up

Watch for it specifically in tasks that feel like they should be "just prompting" problems: a support assistant that "doesn't know" internal policy (needs retrieval, not persuasion), a data-extraction prompt that "gets the math wrong" on large sums (needs a calculator tool, not a stricter tone), and a chatbot that confidently states stale information (needs either fresh context or an explicit instruction to say when it doesn't know, which is a different, prompt-solvable problem from actually knowing).

## Watch out for

- **Confusing a refusal with a knowledge gap.** Sometimes the model won't answer for safety reasons, not because it lacks the information — that's a different problem with a different fix; see [handling refusals and safety boundaries](/learn/prompt-engineering/handling-refusals-and-safety-boundaries).
- **Assuming a longer, more detailed prompt injects facts.** Detail narrows *how* the model answers; it doesn't add to *what* the model knows unless the detail itself contains the missing fact.
- **Spending days iterating wording instead of an hour confirming the category.** Before rewriting a failing prompt for the fifth time, ask directly: is this missing information, an exact-computation task, or a shape problem? The answer tells you whether to keep iterating or to reach for retrieval or a tool instead.

## Where next

Once you've confirmed a failure actually is prompt-solvable, [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure) walks through tracing it to the specific fix. If you're not sure yet, [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) covers why "it worked once" isn't evidence either way.

**Related:** [Why Prompting Works](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) · [what LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) · [what is RAG and when to use it](/learn/rag/what-is-rag-and-when-to-use-it) · [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure)
