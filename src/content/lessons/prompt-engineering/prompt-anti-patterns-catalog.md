---
title: "The Anti-Patterns Catalog: Habits to Drop"
track: "prompt-engineering"
status: live
summary: "Five costly prompt habits gathered from across the course into one table, each with a one-line fix and a pointer to the full lesson."
duration: "6 min read"
---

By the time you've built a handful of real prompts, you've probably run into every habit on this list at least once — usually one at a time, in a different lesson. This is the consolidated version: one table, five habits, the one-line fix for each.

## What it is

This lesson extends [Prompt Anti-Patterns to Stop Doing](/learn/prompt-engineering/prompt-anti-patterns) into a single reference: five specific habits, gathered from across the whole course, that show up in real prompts far more often than any of them should. It's not a new idea — it's a lookup table you can run a prompt against before you ship it, or hand to a teammate reviewing yours.

## The mental model

Every habit below spends something you didn't mean to spend, for a return you almost never measured. Three currencies cover all five:

- **Token currency** — padding and unnecessary content that competes for space with the constraints that actually matter.
- **Attention currency** — instructions and rules stacked in a way that dilutes which ones the model actually weighs.
- **Verification currency** — confidence borrowed from a single good-looking run, never actually tested.

## Why it works this way

A model reads one linear stream of tokens and allocates a finite, unevenly-distributed amount of attention across it. Every token spent on something other than the task — a greeting, a redundant example, an untested trick — is a token that isn't spent constraining the output, and because generation is stochastic, one good-looking sample tells you about that sample, not about the prompt. That's the throughline for all five habits: each one either wastes budget the model could have spent on your actual constraints, or substitutes a feeling for a measurement.

## A concrete example (shown)

Here's a prompt stacking three of the five habits at once — polite, doing several jobs at once, and never run against more than the one example the author wrote it against:

```text
Hi! I hope you're having a great day. Could you please, if it's not too
much trouble, kindly help me out with the following task? I would really
appreciate it.

Please read this customer review, classify the sentiment, extract the
product name, summarize the complaint if there is one, and also suggest a
reply, and format it all nicely. Thanks so much in advance!

Review: {{review_text}}
```

And the rewrite, after applying the fixes in the table below:

```text
Given the review in <review> tags, return JSON with these fields:
- sentiment: "positive" | "neutral" | "negative"
- product: the product name mentioned, or null
- complaint_summary: one sentence, or null if sentiment is not negative
- suggested_reply: two sentences, plain language, no jargon

<review>
{{review_text}}
</review>
```

The rewrite is shorter, not longer — every sentence in the original that wasn't a constraint is gone, and the one line that was actually five jobs stapled together ("classify... extract... summarize... suggest... format") became a schema instead of a run-on sentence.

## Where it shows up

| Habit | Where it shows up | One-line fix | Full treatment |
|---|---|---|---|
| Politeness padding | Prompts written the way you'd ask a coworker a favor | Cut greetings and thanks; spend the tokens on constraints instead | this lesson |
| Negative-only rules | Style and tone constraints stacked as a wall of "don't"s | Say what you want instead of what to avoid | [Why "Don't Do X" Backfires](/learn/prompt-engineering/negative-instructions-pitfall) |
| Kitchen-sink prompts | One "do everything" prompt that classifies, extracts, summarizes, and formats in a single call | Split into a pipeline — one job per prompt | [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt) |
| Untested clever tricks | A phrasing trick copied from a thread and kept because it felt better once | Validate against a fixed eval set before keeping it | [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) |
| Single-run confidence | "I tried it, looks good, shipping" after one or two manual checks | Run a fixed input set and read the failures, not just the wins | [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics) |

## Watch out for

- **Treating this table as exhaustive.** New habits keep showing up, especially ones specific to your own team's prompts — this is a floor, not a ceiling.
- **Using the one-liner as a substitute for reading the linked lesson.** The fix column is a reminder of the shape of the solution, not the whole argument for why it works.
- **Assuming a prompt with none of these five is therefore safe.** This catalog is about quality and reliability habits in prompts *you* write. The rest of this module is about a different class of problem: input you didn't write, that's actively trying to redirect the task.

## Where next

The next lesson turns from habits in your own prompts to habits in the input itself: [Prompt Injection: When the Input Fights Your Instructions](/learn/prompt-engineering/prompt-injection-basics).

**Related:** [Prompt Anti-Patterns to Stop Doing](/learn/prompt-engineering/prompt-anti-patterns) · [Why "Don't Do X" Backfires](/learn/prompt-engineering/negative-instructions-pitfall) · [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt) · [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) · [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics) · [Prompt Injection: When the Input Fights Your Instructions](/learn/prompt-engineering/prompt-injection-basics)
