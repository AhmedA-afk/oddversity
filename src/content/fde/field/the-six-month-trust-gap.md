---
title: "The six-month trust gap: pilots, training, and adoption"
phase: field
module: communication-and-adoption
kind: lesson
summary: A system that works and a system people use are separated by months, not days, and the gap is closed by training and pilots, not by better code. This page walks the Morgan Stanley advisor-research case as the concrete shape of that arc and gives a plan for running it.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain why "it works in the demo" and "advisors use it daily" are separated by months, with a real case as evidence.
  - Structure a pilot-to-rollout plan with named checkpoints instead of one big launch date.
  - Recognise the specific signals that predict a stalled pilot before adoption numbers confirm it.
artifact: A pilot plan for one engagement with named cohorts, a training session outline, and the adoption metric you will track weekly.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://www.everestgrp.com/palantir-inside-the-category-of-one-forward-deployed-software-engineers-blog/
---

The build is the fast part. Accounts of OpenAI's work with Morgan Stanley describe roughly six to eight weeks of engineering to get an internal research tool for financial advisors working, followed by roughly four months of pilots and trust-building before it reached 98% advisor adoption. Add the two together and the arc from first line of code to a tool the organisation actually relies on runs close to six months — a build that is over in under two, and an adoption process nearly three times as long.

That ratio is the thing to plan for. A common mistake is scoping the SOW and the sponsor's expectations around the build, and treating adoption as something that happens automatically once the build is done. It does not. Palantir's own organisational structure makes this explicit: alongside its Forward Deployed Software Engineers, it staffs Deployment Strategists whose entire job is the relationship, politics, and adoption work, separate from the code. If a company that invented the FDE title still needed a dedicated non-engineering role for this, it is not a side task an engineer picks up in spare time at the end of a build.

## Why the gap exists

A working system removes the mechanical barrier to use. It does nothing about the trust barrier, which is different and slower:

- **The tool has to survive contact with a case the pilot users actually care about**, not just the cases it was tested on. The first time it gets something wrong on a real, high-stakes case, trust resets to close to zero for that user, regardless of how well it performed before.
- **The old process still exists as a safety net**, and using it feels lower-risk to an individual than trusting the new one, even when the new one is measurably better on average. Nobody gets blamed for using the process that has always been used.
- **Adoption is not one decision, it is many small ones**, repeated daily, by people who were not in the room for the demo and have no reason yet to trust your claims about it.

## The arc, in checkpoints instead of one launch date

| Phase | Roughly | What it produces | What "done" looks like |
|---|---|---|---|
| Build | Weeks 1-8 | A working system on real data | The walking skeleton demo, per [Demoing to the people who will use it](/roles/forward-deployed-engineer/field/demoing-to-the-people-who-will-use-it) |
| Narrow pilot | Weeks 9-14 | Real usage by a small, willing cohort | The champion identified in [Finding the champion and the blocker](/roles/forward-deployed-engineer/field/finding-the-champion-and-the-blocker) is using it unprompted |
| Structured training | Weeks 12-18, overlapping the pilot | The rest of the target group can use it without you in the room | A person who was not part of the pilot can complete a real task solo |
| Broad rollout | Weeks 16-24 | Adoption across the full target group | The metric agreed in the ROI one-pager is being hit, not just possible |

The phases overlap deliberately. Training the broader group before the narrow pilot has surfaced the real failure modes wastes the training session on a version of the tool that is about to change.

## Training that survives you leaving the room

A training session that is a feature walkthrough teaches people what the buttons do and nothing about when to trust the output over their own judgement. The session that actually moves adoption covers three things, in this order:

1. **When to trust it.** Show the cases where it is reliably right, with evidence, not just an assertion.
2. **When to check it.** Show the cases — like the pre-2019 scans in the Meridian example — where it is known to be weaker, and what checking looks like in practice.
3. **What to do when it's wrong.** A clear, low-friction way to flag an error and fall back to the old process for that one case, without that becoming the user's default.

Skipping step 3 is the most common training gap. A user who does not know what to do when the tool is wrong learns, the first time it happens, to distrust the whole system rather than the one case.

## Signals a pilot is stalling, before the numbers confirm it

Waiting for the adoption metric to show a stall means finding out weeks after the actual problem started. Watch for these instead:

- **Usage concentrates in one or two people** instead of spreading across the pilot cohort. This usually means the champion is compensating for friction the rest of the cohort has quietly decided not to deal with.
- **The old workaround is still visible.** If the personal spreadsheet from discovery is still being updated three weeks into the pilot, the new tool has not actually replaced it yet, whatever the login logs say.
- **Feedback goes quiet.** A pilot user who stops reporting bugs has not necessarily stopped finding them. More often they have decided reporting is not worth the effort, which is a worse sign than an active bug report.
- **The champion starts hedging in meetings.** "It's mostly working" from someone who was previously specific and enthusiastic is a signal to have a direct, private conversation before the next status update, not after.

## What this means for the SOW and the sponsor conversation

Set the adoption timeline explicitly, separate from the build timeline, in the same conversation where you write [Writing a statement of work](/roles/forward-deployed-engineer/field/writing-a-statement-of-work) and the ROI one-pager. A sponsor who expects full adoption at the Day 5 demo, because that is the only date anyone gave them, will read a normal four-month trust-building period as a failure. A sponsor who was told "build is five days, full adoption is closer to four months, and here are the checkpoints in between" reads the same timeline as the plan working.
