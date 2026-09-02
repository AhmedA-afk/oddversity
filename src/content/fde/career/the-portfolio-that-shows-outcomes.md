---
title: The portfolio that shows outcomes, not features
phase: career
module: proof-of-work
kind: lesson
summary: A features list says what a system does. An outcomes portfolio says what changed because you shipped it, measured against a baseline, with the trade-offs you made left visible instead of edited out.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Explain the specific difference between a features list and an outcomes portfolio, and why hiring managers say only one of them signals FDE readiness.
  - Structure one project write-up around discovery, baseline, build, and adoption rather than a stack list.
  - Select which of your capstones and bootcamps belong in a three-project portfolio, and why the other five do not.
artifact: A three-project portfolio index, one page, linking to your strongest capstone, bootcamp, and decomposition drill write-ups, each framed by outcome rather than by tech stack.
sources:
  - https://vinvashishta.substack.com/p/what-skills-do-you-need-to-get-a
  - https://www.iit.edu/blog/forward-deployed-engineer
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
  - https://andrewcodesmith.substack.com/p/the-hottest-job-in-tech-right-now
---

"Built a RAG pipeline with LangChain and Postgres pgvector" is a features list. It tells a reader what tools you touched. It does not tell them whether the system worked, what it replaced, or what you learned when it did not. This page is about building the version that does.

## What "outcomes, not features" actually means

Vin Vashishta, who has hired FDEs for years, states the standard directly: a portfolio should demonstrate "outcomes from discovery through adoption," and should show that you "generalised bespoke solutions into scalable tools." Read that sentence again. It names four stages, discovery, build, adoption, generalisation, and none of them is "the tech stack." A features list skips straight to the build stage and stops there. An outcomes portfolio covers all four, because all four are stages of the actual job, and a reader who has hired FDEs before knows the difference immediately.

The IIT career blog's summary is a compact test you can apply to any project you are deciding whether to include: "the highest-signal proof is a deployed, well-documented portfolio project with explicit trade-offs and, for AI systems, rigorous evaluations." Three requirements in one sentence: it has to be deployed somewhere real, not just running on your laptop; it has to state its own trade-offs rather than presenting itself as flawless; and if it involves a model, it needs a real evaluation attached, not a screenshot of one good output.

## The four-part structure

Write every portfolio entry, whether it is a capstone, a bootcamp, or independent work, in this order. Do not lead with the stack.

**1. Discovery.** What was the stated problem, and what did you find when you asked how the customer, real or simulated, does it today. This is the same discovery discipline this path teaches in the field phase, and it belongs in the write-up even when the customer is a bootcamp's fictional company, because the skill being demonstrated is the habit of asking, not the realism of the answer.

**2. Baseline.** The number, or the honest qualitative state, before you touched anything. "Four hours per case, measured across a week of ticket logs" or "no existing process, entirely manual, tracked in a shared spreadsheet." Without a baseline, any later number is unfalsifiable.

**3. Build, with the trade-off named.** What you shipped, and the one decision inside it a reasonable person could have made differently. State what you rejected and why, not just what you chose. This is the same discipline as the generalise-or-one-off memo from the product phase of this path: an outcome write-up that only lists what worked reads as marketing, not evidence.

**4. Adoption, or its honest absence.** What changed after the build, measured the same way as the baseline. If the project is a simulated bootcamp and true adoption is not measurable, say so directly rather than implying a result you cannot back up: "in a live deployment this would be measured by X; in this simulation, the demo was accepted by the stakeholder panel against the stated rubric" is honest and still useful.

## Choosing what goes in

This path will leave you with a decomposition-drill archive, six bootcamp artifacts, and five capstones by the end. A portfolio is not a folder of everything you built; it is a curated set of three to five entries that each demonstrate a different part of the job. A reasonable selection:

- **One capstone** with a real eval harness and a deployment story, to show you can ship and evaluate a system end to end.
- **One bootcamp** where the demo did not go as planned and you can narrate what you changed, to show judgement under a live stakeholder rather than a polished result.
- **One decomposition drill or discovery exercise**, written up in full, to show the scoping skill directly rather than only its downstream product.

Andrew Codesmith's advice for building toward this role, aimed at engineers starting from a solid mid-level baseline, is to start saying yes to every customer call, demo, and cross-functional meeting available to you, because the material for an outcomes-shaped portfolio comes from being in the room where discovery and adoption actually happen, not from a side project built alone. If you have any real customer-facing experience already, even informal, it likely outranks a fourth polished capstone for this purpose.

Resist the instinct to add a sixth or seventh entry to look more prolific. A reviewer with limited time reads the first two or three entries closely and skims the rest; a portfolio padded with weaker projects dilutes the strong ones instead of adding to them. If you are unsure whether a project belongs, apply the same test the IIT blog's standard implies: does this entry have a real deployment, a stated trade-off, and, if it involves a model, a real evaluation. A project missing any of the three is not ready to represent you yet, no matter how much time went into building it.

## The frame that ties it together

Deep Engineering's proof-of-work frame, covered fully in the next module's page on your first ninety days, doubles as a template for a single portfolio entry: a baseline and a success metric established early, a shipped improvement with evaluation, observability and rollback attached, and a field lesson converted into a reusable asset. Any capstone or bootcamp write-up that hits those three beats, in that order, is already shaped like the portfolio this page is describing. The work is not building more projects. It is writing up the ones you already have so the outcome, not the stack, is the first thing a reader sees.
