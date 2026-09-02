---
title: Success criteria before scope
phase: field
module: scoping-sows-and-bootcamps
kind: lesson
summary: Scope written before success criteria produces a deliverable nobody can judge. This is how to get a measurable, owned, dated success criterion out of a customer who wants to talk about features, and the six tests a good criterion passes.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Convert a feature request into a success criterion with a baseline, a target, a measurement method and an owner.
  - Apply the six tests and reject a criterion that fails any of them.
  - Write the "what would make us stop" line that most engagements lack.
artifact: A success-criteria block for one engagement, with baseline, target, method, owner, date and stop condition, ready to paste into an SOW.
sources:
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://www.aol.com/articles/openai-exec-explains-growing-team-080035434.html
  - https://decagon.ai/blog/how-decagon-is-redefining-forward-deployment
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
  - https://vinvashishta.substack.com/p/what-skills-do-you-need-to-get-a
---

Most engagements are scoped in the wrong order. Someone writes a list of deliverables, everyone agrees the list is reasonable, the list gets built, and then at the end there is an uncomfortable meeting where the customer says it did not really help and you say but it is all here in the scope.

Both of you are right, which is what makes the meeting so bad.

The fix is boring and it works: **write the success criterion first, then write the scope that serves it, and delete anything in the scope that does not.** Cohere's forward deployed posting asks for exactly this, phrased as translating business problems into agentic workflows with clear success metrics. Vin Vashishta, who has hired for the role, puts end-to-end ownership as "the job is over when the customer renews, not when the demo works". A renewal is a judgement about outcome, and outcomes need a number agreed in advance.

## What a success criterion is

Five parts. Anything missing one of them is a wish.

```text
BASELINE     what the number is today, measured, with the date it was measured
TARGET       what it must be, and by when
METHOD       exactly how it will be computed, from which source
OWNER        the named person who will run the measurement and agrees it is fair
STOP         the result that would mean we should stop, not continue
```

A worked pair, from the same customer:

**Bad.** "Reduce the re-KYC backlog using AI-based document processing."

**Good.**

```text
BASELINE  Cases aged over 90 days on 2026-09-01: 412 (query CBS-RPT-114, run by
          M. Iyer, Compliance)
TARGET    Under 100 by 2026-12-15, with no increase in cases reopened by audit
METHOD    Same query, same day of month, run by M. Iyer, results mailed to the
          project group. Reopened-by-audit count from the quarterly audit log.
OWNER     M. Iyer (measurement), S. Deshpande, Head of Branch Ops (accountable)
STOP      If, at 2026-10-31, aged cases are above 350 and officers report the
          review queue is slower than their spreadsheet, we stop and rescope.
```

Note what changed. There is a query name. There is a person who runs it. There is a second metric guarding against gaming the first (you can always clear a backlog by closing cases badly). And there is a date at which somebody is allowed to say this is not working.

## The six tests

Run every proposed criterion through these. A criterion that fails any of them will produce an argument at the end of the engagement.

**1. Is there a baseline, measured, not remembered?** "It takes about two days" is a memory. Go and measure it, or agree a proxy and write down that it is a proxy. If the baseline cannot be measured before you start, that is the first thing you build.

**2. Can it be computed by someone other than you?** If the only way to produce the number is a script you wrote, the customer cannot verify it and will not trust it in month six. Prefer a query in their system, run by their person.

**3. Does the sponsor's own manager care about it?** Ask: "if this number moves, does it show up in anything you report upward?" If not, you have picked a metric that is real but politically weightless, and the project will lose its budget to something with a louder number.

**4. Is it gameable, and is the guard written down?** Every throughput metric is gameable by dropping quality. Every quality metric is gameable by dropping throughput. Pair them. One primary, one guard.

**5. Does it survive the honest question "and if the tool did nothing"?** Backlogs shrink for seasonal reasons. Ticket volumes fall when a different team fixes something upstream. Agree in advance either a control group, a comparable prior period, or an explicit acknowledgement that attribution will be argued and here is how you will argue it.

**6. Is there a stop condition?** This is the one nobody writes and it is the one that protects you. An engagement with no defined failure is an engagement that ends in blame.

## Getting the number out of a customer who does not want to give one

They resist for three reasons: they do not know it, they are afraid of being held to it, or the number is embarrassing. All three are handled the same way, by making the first measurement joint and low-stakes.

**Script, when they say "we can't really put a number on it":**

> "Fair. Can we do this: I will not ask you to commit to a target today. What I want is the baseline, so that in three months we can both see what changed. Who could run a query for the count today? If it turns out to be far worse than anyone thought, that is useful information for you, not a problem for me."

**Script, when they offer a vanity metric:**

> "Adoption percentage is a good thing to watch, but if fifty people log in and the backlog does not move, would you call that a success? What is the number your board asks about?"

**Script, when the sponsor wants an unachievable target:**

> "I would rather commit to under 100 and beat it than commit to zero and explain 40. If we hit under 100 by December, do you want to set the next target then, with real data behind it?"

**Script, when they will not accept a stop condition:**

> "I am not proposing this because I expect to fail. I am proposing it because if it is not working in eight weeks, you will want to spend the rest of the budget elsewhere, and I would rather that decision be a scheduled one than an argument."

## Success criteria for AI work specifically

Two additions when the deliverable involves a model.

**The quality bar is a domain-expert judgement, not a benchmark.** Agree, before building, a set of labelled examples produced by the people who actually make the decision today. Twenty is often enough to find out whether the thing is feasible at all. The criterion is then "agrees with the expert panel on at least X of the labelled set, with the disagreements reviewed", not "high accuracy".

**The unit economics are part of the criterion.** Cost per query, latency at the ninety-fifth percentile, and what happens under the month-end volume spike. A system that is correct and costs more per case than the officer does is not a success; write the ceiling down.

Colin Jarvis of OpenAI describes the pattern of building a core solution in roughly six to eight weeks and then spending four or more months on pilots and evaluation refinement before a regulated workflow is trusted. Your success criterion has to be phrased so that the four months are visible in the plan, not a surprise.

## Then, and only then, the scope

With the criterion fixed, scope becomes a filtering exercise rather than a negotiation. For each proposed deliverable, ask one question: **which part of the criterion does this move?**

Applied to the re-KYC case:

| Proposed deliverable | Moves the criterion? | Verdict |
|---|---|---|
| Document classifier | Saves 4 min of 30 min per case | Yes, small. Keep, but not first |
| Field extraction and CBS pre-fill | Removes the 9-min retype and its error rate | Yes, large. First |
| Per-record failure reasons from the nightly batch | Removes a 24-hour loop and 15 min of rework | Yes, largest. First |
| Aged-case report for compliance | Is the criterion's measurement | Yes. Week one |
| Mobile app for officers | Nothing in the criterion | Cut. Log as phase two |
| Dashboard for the CEO | Nothing measurable | Cut, or ten minutes of work, not a workstream |

Ramp's engineering team calls this "always be scoping" and defines it as questioning all requirements. This table is what questioning all requirements looks like on paper, and it is much easier to hold in a room than an opinion.

## The line that changes the conversation

When a customer adds something late, you now have a sentence that is not a refusal:

> "Happy to look at it. Which part of the December target does it move? If it does not move that one, I would rather put it in phase two than take a week out of the thing that does."

That is not politics. It is the same filter you applied to your own proposals, applied evenly. Customers notice that it is even.

Write the block for whichever engagement or simulated bootcamp you are on next. Five lines, one guard metric, one stop condition. If you cannot fill the baseline, your first week's work just chose itself.
