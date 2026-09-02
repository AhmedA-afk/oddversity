---
title: The "what I learned from customers" document
phase: product
module: the-feedback-loop-in-practice
kind: lesson
summary: The weekly document that turns a customer conversation into something an engineer who has never met that customer can act on. Format, tagging, the specificity rule, and what to do when nobody reads it.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Write a weekly customer-learning entry that a product engineer can act on without calling you.
  - Tag every request by customer origin so the fifth identical ask is visible as a pattern.
  - Convert a vague complaint into a reproducible, labelled failure case.
artifact: A running "What I learned from customers" document with at least one entry per engagement week, tagged by origin and by whether the ask is a bug, a gap, or a model failure.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
  - https://pascalsnotes.substack.com/p/build-your-own-fde-playbook
  - https://newsletter.eng-leadership.com/p/inside-openais-forward-deployed-engineer
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://openai.com/careers/forward-deployed-engineer-(fde)-sf-san-francisco/
---

You will hear more true things about your product in one week on site than the product team hears in a quarter. Almost none of it will survive the trip home, because it arrives as offhand remarks in corridors, sighs during a demo, and workarounds people are slightly embarrassed to show you. If you do not write it down the same day, it becomes "the bank had some issues with permissions", which is not a bug report, a requirement, or anything anyone can act on.

The remedy is a boring one. Keep a document. Write in it weekly. Send it to people who can change the software.

Vinoo Ganesh, who ran Palantir's Project Frontline, puts a "What I've Learned From Customers" document in the middle months of an FDE's ramp. Anthropic's Forward Deployed Engineer posting states the same obligation in employer language: "identify and codify repeatable deployment patterns and contribute insights back to our Product and Engineering teams". OpenAI's posting says FDEs "share field feedback that helps Research and Product understand where the models succeed". Every one of those sentences describes an artifact. This page is about how to make that artifact good enough that someone reads it twice.

## Why weekly, and why written

Not quarterly, because the pattern you are trying to catch is *repetition across customers*, and repetition is only visible if the entries are dated and cheap to scan. Not verbal, because a hallway summary is a lossy compression of a lossy compression, and because your replacement on this account needs the record.

Weekly also protects you from the failure mode where the loop becomes a performance. If you only write when you have something impressive, you will write four times a year and all four entries will be victory laps. Entries about things that did not work are the valuable ones.

## The shape of an entry

Each entry is one observation. Five fields, and none of them optional.

**Origin.** Which customer, which team, which person's role. Pascal Unger's write-up of HappyRobot's FDE playbook describes logging and tagging every feature request by customer origin. That tag is the entire mechanism. Without it, five customers asking for the same thing look like five unrelated tickets. With it, the fifth one closes an argument.

**What they said, in their words.** Verbatim, in quotes, including the parts that are wrong. "We can't use this for the co-operative branches because their KYC files live in the old core banking system and nobody there has a laptop" tells product something that your paraphrase ("integration gap") does not.

**What they actually do today.** The manual workaround, with its real cost. Two clerks, four hours a day, a shared Excel file on a network drive. This is the number that later becomes an ROI line, and it is only available while you are standing there.

**What broke, precisely.** This is where most field feedback dies. Colin Jarvis, who runs OpenAI's FDE function, describes the expectation as providing "specific problem details rather than vague customer issues". The difference in practice:

> Weak: the model is bad at reading their invoices.
>
> Strong: on 20 scanned GST invoices from this supplier, the extractor puts the IGST amount in the CGST field whenever the tax table header wraps to two lines. Sample IDs 3, 7, 11, 14, 19. Files attached. Reproduces on the current prompt at temperature 0.

The strong version is a ticket. The weak version is a mood.

**Your classification.** One of three: *bug* (the product claims to do this and does not), *gap* (the product does not claim to do this and this customer needs it), *model or research signal* (the failure is in the model's behaviour, not the application code). The third bucket routes differently, and it gets its own page in [Feeding research, not just product](/roles/forward-deployed-engineer/product/feeding-research-not-just-product).

## A worked entry

```markdown
## 2026-08-14 — Meridian Co-operative Bank, branch operations

Origin: Meridian Co-op, branch ops lead (Sunita R.), 2nd site visit.
Bucket: gap.

Said: "Your reviewer screen is fine in Bengaluru. In the district
branches the staff read the file in Kannada and type the summary in
English, and now they have to do both in your tool instead of one."

Today: branch officer opens the scanned KYC bundle, reads it, writes a
2-line English summary into the core banking free-text field. About 60
files a day per branch, 40 branches. Roughly 25 minutes per officer
per day is transliteration, not judgement.

Broke: nothing broke. The workflow assumes the reviewer reads and
writes the same language. Our summary field is English-only because
the downstream core banking field is ASCII-limited.

Ask: render the source snippet in the original script beside an English
draft summary, and let the officer edit the English. Not translation
as a feature — bilingual review as a layout.

Pattern check: third customer to describe a two-language review step
(also Halden Logistics, Arogya). Tag: bilingual-review.
```

The last line is the one that changes a roadmap. Two customers is an anecdote. Three with dates and quotes is a case.

## Who it goes to, and in what form

Send the document. Do not store it. Ramp's forward deployed team lists "generalise work" as a core principle and warns that the alternative is product engineering scoping out mega-projects that take months to deliver; that only works if the field's raw material reaches product weekly rather than as a quarterly wish list.

Three audiences, three cuts of the same file:

- **The engineer who owns that surface.** Send the single entry, with the reproduction, in their channel. Do not send them the whole document.
- **The product manager.** Send the pattern-tag rollup: which tags recurred, from how many distinct customers, with the sharpest quote for each.
- **Your own team.** Send everything, including the entries where you were wrong about what the customer wanted. Those are how the next FDE avoids your week.

## The failure modes

**Editorialising.** If you write "the customer is asking for X" when the customer described a problem, you have thrown away the problem and kept your guess at a solution. Record the problem. Put your proposed solution in a separate, clearly labelled field.

**Advocacy inflation.** If every entry ends with "this is blocking the renewal", none of them do. Say what is actually blocked and by when, and say "not blocking, but they mention it every visit", which is also useful.

**Solving it yourself in silence.** The tempting move is to write a small script for the co-operative bank, fix their day, and never write the entry. You have then converted a product insight into an undocumented one-off that only you can maintain. That is the exact behaviour the role exists to prevent.

**Waiting for permission.** Nobody will ask you for this document in your first month. Start it anyway. It is the single cheapest thing you can do that distinguishes the role from implementation consulting, and it is the artifact you will point at in an interview when someone asks how you fed product.

## Do this now

Open a file called `customer-learnings.md` in whatever repository holds your current project. Write today's entry, even if today's entry is "spoke to nobody; here is the thing the pilot user said on Tuesday that I have not thought about since". Keep it for the length of your next capstone. You will use it as the input to the generalise-or-one-off memo, and later as evidence.
