---
title: "Executive communication: the pyramid, then the detail"
phase: field
module: communication-and-adoption
kind: lesson
summary: The same fact set explained to a CEO and to an engineer should share every number and disagree about almost everything else — order, depth, and what counts as the headline. The Pyramid Principle is the structure that makes that translation repeatable.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Structure any update using answer-first, then grouped reasons, then supporting detail.
  - Rewrite the same finding as a two-line executive summary and a full engineering explanation from one set of facts.
  - Recognise the tell that an update is still in engineer order, not executive order.
artifact: One finding from your own work, written twice — as a three-sentence executive update and as the full technical explanation underneath it — using the same facts in a different order.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://elevenlabs.io/careers/ce9909a8-b837-443f-a6fc-18ac50269b4e/forward-deployed-engineer-strategist
  - https://abhijayvuyyuru.substack.com/p/the-free-8-week-roadmap-to-become
---

An FDE explains the same problem as business impact to a CEO and as implementation detail to an engineer, in the same week, sometimes in the same hour — a form of cross-audience communication named directly in accounts of the traits the role requires. ElevenLabs' own posting for the title states it as a hard requirement: presenting "to audiences ranging from technical teams to C-suite." One roadmap for the role recommends a specific tool for doing this without rewriting the content from scratch each time: the Pyramid Principle.

## What the Pyramid Principle actually says

Most engineers write updates in the order they discovered the information: here is what I found, here is what I found next, and therefore here is the conclusion. That order is efficient for the person writing it and expensive for everyone reading it, because the reader has to hold every intermediate fact in mind to understand why the conclusion matters.

The Pyramid Principle inverts it. State the answer first. Then the two or three reasons that support it, grouped. Then, only for whoever wants it, the detail behind each reason.

```text
LEVEL 1 — THE ANSWER (one or two sentences)
  What you want the reader to know if they read nothing else.

LEVEL 2 — THE REASONS (three, at most four, each one sentence)
  The grouped arguments that support the answer. Each should be able
  to stand alone as a headline.

LEVEL 3 — THE DETAIL (as much as the reader wants)
  Numbers, methodology, caveats — organised under whichever Level 2
  reason it supports, not in discovery order.
```

The structure is recursive: a CEO reads Level 1 and stops. A sponsor reads Levels 1 and 2. An engineer reviewing your work reads all three. You write it once, and each reader chooses their own depth by how far down the page they go — you are not maintaining two documents.

## Worked example: the same finding, two ways

The finding: extraction accuracy on the Meridian re-KYC pilot came in lower than hoped on pre-2019 scans, but well within target on everything after 2019, and pre-2019 scans are a known, countable, shrinking slice of the backlog.

**Written in discovery order (what most first drafts look like):**

> "We tested the extractor against 50 real cases. Post-2019 scans, which have a consistent format, extracted correctly in 47 of 48 cases. Pre-2019 scans are handwritten, inconsistently formatted, and only 2 of 2 in this sample extracted correctly, though the sample is too small to trust. We counted the full pre-2019 population in the export and found it is 6% of the total backlog and declining as those accounts close or get re-verified. Given all this, we think the system is ready to pilot on the post-2019 majority now, with pre-2019 cases routed to manual review as they already are."

Technically complete, and a CEO or sponsor has to read to the end to find out whether this is good news.

**Written as a pyramid:**

> **The extractor is ready to pilot on 94% of the backlog now; the remaining 6% keeps going to manual review, unchanged from today.**
>
> - Accuracy on standard-format scans (post-2019, 94% of cases) is 47 of 48 in testing — comfortably above the target we set.
> - Accuracy on handwritten pre-2019 scans is not yet reliable enough to trust, and the sample so far is too small to draw a conclusion from.
> - Pre-2019 cases are a shrinking share of the backlog, so this gap does not block the pilot and does not need to be solved before Phase 1 goes live.
>
> *Detail: [full accuracy tables, sample sizes, and the extraction method by document era go here, for whoever wants them.]*

Same facts, same honesty about the weak spot. The second version tells a time-pressed reader everything they need in the first sentence and lets an engineer or auditor go deeper without either group waiting on the other.

## The tell that you are still in engineer order

If the sentence that would matter most to a CEO is not the first sentence, you are in engineer order. Read your own draft and ask: if the reader stopped after sentence one, would they know the answer? If the honest response is "no, they'd need to keep reading to find out if this is good or bad news", restructure before you send it.

A second tell: if removing your Level 3 detail would also remove your conclusion, you have not actually separated the levels. The conclusion has to survive on its own, in Level 1, with the detail purely as backup.

## Why the order is not spin

Putting the answer first is sometimes mistaken for hiding bad news in the detail. It does the opposite. In the worked example above, "94% ready, 6% unchanged" is the honest headline — it is not softer than "the extractor isn't perfect on old scans", it is more precise. Burying that same fact in paragraph three, after two paragraphs of methodology, does not make the news more honest. It makes the reader do the analysis you should have done for them. The pyramid is a discipline about the reader's time, not about the content's honesty — the content stays exactly as accurate either way.

## Using this for a live update, not just a document

The structure works spoken as well as written. In a status meeting, the same order applies: state the answer, then the two or three reasons, and stop there unless someone asks for more. Most executives will ask exactly one follow-up question if the answer was clear. If they ask five, the Level 1 sentence was not actually an answer — go back and sharpen it before the next update.
