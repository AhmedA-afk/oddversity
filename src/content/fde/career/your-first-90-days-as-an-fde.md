---
title: Your first 90 days as an FDE
phase: career
module: india-routes-and-the-first-90-days
kind: lesson
summary: Thirty days to a measured baseline, sixty to a shipped improvement with evaluation, observability and rollback, ninety to a reusable asset pulled out of what you learned. This is the frame this path has been building toward, applied to the actual seat.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Lay out a 30/60/90 plan for a new FDE seat using the baseline, ship, generalise frame from this page.
  - State what "reusable asset" means concretely by day 90, and why it is the target rather than a finished platform.
  - Connect your first 90 days back to the career ladder this role sits on, so you know what the seat is a step toward.
artifact: A written 30/60/90 plan for your actual or hypothetical first FDE seat, with a named baseline metric, a named ship target, and a named reusable asset for day 90.
sources:
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
  - https://newsletter.eng-leadership.com/p/inside-openais-forward-deployed-engineer
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://fde.academy/blog/forward-deployed-engineer-career-after-fde
  - https://finance.yahoo.com/news/9-startups-palantir-alumni-know-110000540.html
---

Everything else in this career module is about getting the seat. This page is about the first ninety days after you have it, because the habits you establish in that window are the ones that decide whether you become the kind of FDE this whole path has been arguing for, or a very expensive contractor who never gets around to the second half of the job.

## The frame

Deep Engineering's guide to how FDE hiring and the work itself actually go states a proof-of-work frame that doubles, almost exactly, as a plan for the job once you have it: establish a baseline and a success metric in the first thirty days, ship an improvement against that baseline "with evaluation, observability, and rollback," and convert what you learned in the field into a reusable asset by day ninety. Structured as a 30/60/90, that becomes:

**Days 1-30: baseline.** Do not ship anything meaningful yet. Find out, precisely, what the customer's process looks like today, and attach a number to it. This is the discovery discipline this path has trained from the field phase onward, applied for real: how long does the task take now, how often does it fail, what does "wrong" currently cost, who does it, and how would they know if it got better. Leave day 30 with a written baseline and a stated success metric, not a prototype.

**Days 31-60: ship, with evaluation, observability, and rollback attached.** Build the thing that moves the metric. The three attachments in Deep Engineering's phrasing are not optional extras: an evaluation that proves the change actually works against real or representative cases, observability so you and the customer can see it working after you leave the room, and a rollback plan so a failure in production is a known, rehearsed event rather than a crisis. A shipped improvement without any one of the three is not finished by this frame's standard, whatever the demo looked like.

**Days 61-90: convert field lessons into a reusable asset.** This is the step most new FDEs skip, because it is the least urgent-feeling of the three and the customer will not ask for it. Look back over what you built and what you learned doing it, and pull out the one piece, a component, a pattern, a written playbook, that the next customer or the next engagement will need. This does not have to be large. OpenAI's own stated target for a first engagement is roughly twenty percent of components being reusable, rising to around fifty percent by a third engagement; a single well-chosen reusable piece from your first ninety days is a reasonable, honest match for that first-engagement number, not a shortfall.

## Why the order matters

Each phase depends on the one before it, and skipping ahead breaks the frame. Shipping before you have a baseline means you cannot prove the improvement happened, only that something changed. Trying to generalise before you have shipped one real thing means you are abstracting from imagination rather than from evidence, the exact "generalising too early" failure this path's product phase warns against. The order is baseline, then ship, then generalise, in that sequence, because each step is the evidence the next one needs.

## What "reusable asset" concretely looks like

Do not aim for a platform in your first ninety days. Aim for one of these, chosen because it was actually needed twice, not because it seemed impressive to build:

- A configuration option extracted from something you hard-coded for the first customer, because a second named customer needs the same behaviour with a different value.
- A written playbook: the discovery questions that worked, the data-quality problems you hit and how you found them, the stakeholder objections you heard and how you answered them.
- An eval harness or a labelled example set that the next engagement, on a related but different problem, can start from instead of building from zero.

Ramp's engineering team, describing how it scaled its own FDE group, lists "generalise work" as a core operating principle precisely because the alternative, as they put it, is "product engineering scoping out mega-projects that took months to deliver" once the pattern finally becomes undeniable and expensive to have ignored. Your ninety-day asset does not need to be that ambitious. It needs to exist and be true.

## What this seat is a step toward

Ninety days in, it is worth knowing what ladder you are on. The common progression from an FDE seat runs FDE to Senior FDE to Principal FDE to Director or VP of the function, with lateral exits into product management, engineering management, solutions architecture leadership, or independent consulting. The most consistently cited exit, though, is founding: Palantir alumni alone had founded more than 111 companies that had collectively raised over $11.6 billion by 2024, and a large share of those founders held FDE or deployment-strategist titles. None of that is a reason to treat your first ninety days as a résumé line for something else; it is a reason to take the discipline in this page seriously even when no one on the customer's side is asking for it, because the baseline-ship-generalise habit is exactly what shows up, later, in a founder's own instinct for what to build first.

The version of this page that matters most is not the one you read now. It is the one you write for yourself, with a real customer's name and a real number, in the first week of the actual job. Come back and reread it then.
