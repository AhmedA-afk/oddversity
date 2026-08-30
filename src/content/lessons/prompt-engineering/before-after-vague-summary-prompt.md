---
title: "Before/After: Turning 'Summarize This' Into a Specification"
track: "prompt-engineering"
status: live
summary: "Rewriting a one-line summarization prompt into a full spec turns three different outputs into one consistent shape."
duration: "7 min read"
---

"Summarize this" is one of the most common prompts in the world, and one of the least specified. Watch what happens when you actually run it more than once.

## The setup

Here's the source text — a short, generic product update, invented for this exercise:

```text
Nimbus Cloud is rolling out a new billing dashboard next month. The dashboard
consolidates invoices, usage charts, and payment history into a single view
that was previously spread across three separate pages. Early access users
reported that finding a specific past invoice used to take several clicks
through account settings; the new view surfaces the last twelve months of
invoices directly on load. The rollout will happen gradually over three
weeks, region by region, starting with North America. Support has prepared
a short internal FAQ for handling questions during the transition, and the
existing billing API endpoints are unaffected — this is a front-end change
only.
```

And here's the prompt everyone starts with:

```text
Summarize this article: {{article}}
```

## Step by step

**Step 1 — run it three times and just record what comes back.**

```text
Run 1 (prose paragraph):
"Nimbus Cloud is launching a new billing dashboard that combines invoices,
usage, and payment history into one page, making past invoices much easier
to find. It will roll out gradually over three weeks starting in North
America, and the billing API itself isn't changing."

Run 2 (bulleted list):
- New billing dashboard combines invoices, usage, and payment history
- Rolling out over 3 weeks, region by region, starting with North America
- Front-end only, API unaffected

Run 3 (bullets, plus unrequested opinion):
- Consolidates three pages into one dashboard view
- Big usability win for finding old invoices
- Gradual regional rollout, North America first
This should meaningfully reduce support tickets about "where's my invoice."
```

> **Why this step?** You need to see the actual variance before you can claim you fixed anything. Three formats came back for three identical calls: a paragraph, a clean bullet list, and a bullet list with an editorial claim nobody asked for. Zero of the three runs match each other's structure.

**Step 2 — name what "summarize" left unspecified.**

The prompt never said who's reading this, how long the result should be, what shape it should take, or what's out of bounds. "Summarize" is a vague verb standing in for a real specification — see [the five beginner mistakes](/learn/prompt-engineering/beginner-prompting-mistakes) for how common this exact gap is. Without an audience, length, format, and exclusion list, the model has to guess all four, and a guess on four independent dimensions produces a different combination almost every time.

> **Why this step?** You can't fix what you haven't named. Each of the four gaps above maps to one clause you're about to add — this is the diagnostic pass before the rewrite, not an afterthought.

**Step 3 — rewrite with all four gaps closed.**

```text
Summarize the article in <article> for a busy executive skimming for ten
seconds. Return exactly 3 bullets, each 25 words or fewer. Each bullet must
state one concrete fact from the article (a number, date, or named change).
Do not add opinions, predictions, or claims that aren't stated in the text.
Do not include a title or introduction — output only the 3 bullets.

<article>{{article}}</article>
```

> **Why this step?** Every clause here closes exactly one of the gaps from Step 2: audience and length ("busy executive," "ten seconds," "3 bullets," "25 words"), format ("bullets," "no title or introduction"), and exclusion ("do not add opinions, predictions, or claims not in the text"). This also puts the article inside a clear delimiter, separating instructions from data — see [delimiters and formatting](/learn/prompt-engineering/delimiters-and-formatting).

**Step 4 — run the new prompt three times and compare.**

```text
Run 1:
- New billing dashboard merges invoices, usage, and payment history into one view
- Rollout is gradual over three weeks, starting with North America
- Front-end only change; existing billing API endpoints are unaffected

Run 2:
- Billing dashboard now shows invoices, usage charts, and payment history in one place
- Three-week phased rollout, region by region, beginning with North America
- No changes to the billing API — this is a front-end update only

Run 3:
- Invoices, usage, and payment history now consolidated into a single dashboard
- Rollout phased over three weeks, North America first
- Billing API unchanged; the update is front-end only
```

> **Why this step?** This is the actual test. All three runs return exactly 3 bullets, all three cover the same three facts (the consolidation, the phased rollout, the API being unaffected), and none of them add an opinion. Compare that to Step 1: 3 runs, 3 different formats, 0 of them structurally alike. Here: 3 runs, 3 bullets each, same 3 facts each time — the wording still varies a little, but the shape and content are locked. That's the entire measurable improvement, and it came from specification, not from a better model or a lucky roll.

## Where it breaks (and the fix)

Three fixed-length bullets work for a short product update. They break down on a longer or denser source — a technical incident report with five distinct root causes doesn't fit into 3 bullets of 25 words without dropping something that mattered. The fix isn't to abandon the constraint, it's to make the escape hatch explicit: "Return exactly 3 bullets, plus a 4th only if a specific number, date, or dollar figure would otherwise be lost." This keeps the format predictable while giving the model a controlled way to say "this one didn't fit in 3." It also breaks if the source text is long enough to compete with the instructions for space in context — at that point the fix is architectural, not a wording tweak; see [context window mechanics](/learn/llm-foundations/context-window-mechanics).

## Takeaways

- A vague verb like "summarize" isn't one instruction, it's four unspecified decisions (audience, length, format, exclusions) that the model has to guess independently each run.
- You can't see the variance in a vague prompt from a single run — you have to run it more than once before you can claim to have fixed anything.
- The fix is naming each gap explicitly, not asking harder or adding urgency to the same underspecified request.
- "Consistent" doesn't mean word-for-word identical — it means the same shape and the same facts every time, with wording as the only thing left to vary.

**Related:** [The Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt) · [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting) · [Prompting Is Not Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) · [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters)
