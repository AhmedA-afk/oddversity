---
title: "Worked Example: Knowledge-Cutoff and Temporal Fabrication"
track: "hallucinations"
status: live
summary: "Three cases — a stale CEO, a vague this-year claim, and a future match result — showing how relative-time phrasing amplifies temporal hallucination."
duration: "6 min read"
---

Three questions about the same fictional company, all asked without any retrieval, all answered with total confidence, all wrong for a slightly different reason.

## The setup

The company throughout: **Northwind Robotics**, invented for this walkthrough. Assume the model's training data runs through a cutoff date, and everything below is asked with no search tool and no retrieved context — pure parametric recall.

## Step by step

**Case 1 — the stale-current-fact problem.**

Prompt: *"Who is the CEO of Northwind Robotics?"*

Model: *"The CEO of Northwind Robotics is Priya Deshmukh."*

> **Why this step?** Priya Deshmukh was accurate as of the model's training data. Leadership changed after the cutoff — a routine, unremarkable event that happens to every company eventually. Nothing about the question or the answer signals staleness: the model doesn't retrieve "current CEO," it predicts the most likely continuation of "the CEO of Northwind Robotics is," and that continuation was true once, which is all the model has any way of knowing.

**Case 2 — relative phrasing hides the real question.**

Prompt: *"What did Northwind Robotics launch this year?"*

Model: *"This year, Northwind Robotics launched its second-generation warehouse picking arm, the NR-2."*

> **Why this step?** "This year" doesn't resolve to anything inside the model's weights — it has no built-in sense of *now*. What it has is a training-data association between "Northwind Robotics" and "the NR-2 launch," anchored to whatever year that was near the cutoff. The word "this" makes the claim sound anchored to the actual present, which is exactly the part the model cannot know. Relative-time phrasing doesn't just risk a wrong date — it actively launders an old fact into present tense, which is worse than a flat factual error because it reads as freshly verified.

**Case 3 — confidently resolving something unresolved.**

Prompt: *"Who won the Northwind Cup final?"* (a fictional industry robotics competition scheduled for a date after the model's cutoff)

Model: *"Northwind Robotics' own team, the Ironclads, won the Northwind Cup final."*

> **Why this step?** This is the sharpest version of the failure: the event hasn't happened yet relative to the model's knowledge, so there is no fact to recall at all, correct or stale. The model isn't misremembering — it's completing the statistical shape of "who won X" with the most plausible-sounding name available (the home team, a name it's seen associated with the competition), because "I don't know, this hasn't happened yet in what I was trained on" is a much less common completion for a "who won" question than a confident name.

## Where it breaks (and the fix)

All three cases share one root cause and one aggravating factor. The root cause: the model has no internal marker for "now" — its cutoff is a property of the training run, not something it consults at inference time. The aggravating factor is exactly the phrasing: "current," "this year," and "who won" all presuppose that an answer exists and is knowable, so the model completes accordingly rather than surfacing the gap. See [knowledge cutoff and temporal hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination) for why static facts don't have this problem and dynamic ones always will.

Passing the model today's actual date in the system prompt does not fix this on its own — it tells the model what day it is, not that its knowledge might be stale relative to that day, and a model with no explicit instruction to treat the gap between "training cutoff" and "today" as a reason to doubt itself will still answer from memory. The fix has to be structural:

- **Force retrieval on recency-flavored language.** Any prompt containing "current," "latest," "this year," "who won," or similar should route to a search or database tool before generation, not after a first guess.
- **Make the cutoff-to-today gap an explicit instruction, not an assumption.** Tell the model directly: today's date is provided so you can recognize when a question needs verification, not because your training data extends to it.
- **Default to abstention over completion for anything future-tensed or superlative.** A "who won" question about an event with no confirmed result should produce "that hasn't been decided yet, as far as I can verify" far more often than a name — see [teaching a model to say 'I don't know'](/learn/hallucinations/teaching-models-to-say-i-dont-know).

## Takeaways

- Relative-time phrasing ("current," "this year," "the latest") is not neutral — it's a request in disguise for a lookup, and treating it as an ordinary question is what turns a knowledge gap into a confident, wrong, present-tense claim.
- A future event with no result yet isn't a hard recall problem the model got wrong — it's a nonexistent fact the model treated as existing, which routes to abstention, not to "try a better prompt."
- Passing the current date helps only if it's paired with an explicit instruction to use it for doubt, not just for context — otherwise it's decoration.

**Related:** [Knowledge Cutoff and Temporal Hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination), [RAG as Hallucination Mitigation](/learn/hallucinations/retrieval-augmented-mitigation), [Teaching a Model to Say 'I Don't Know'](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Escalation Design for Uncertain Answers](/learn/hallucinations/escalation-design-for-uncertain-answers)
