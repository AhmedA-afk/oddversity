---
title: Owning outcomes without authority
phase: field
module: stakeholders-and-saying-no
kind: lesson
summary: You are judged on whether the engagement succeeds, and you have no power to make anyone on the customer's side do anything. This page gives the specific move for getting action from people you cannot instruct, and when to escalate instead of push.
duration: 10 min
updated: "2026-09-02"
outcomes:
  - Make a request to someone who does not report to you in a form that gets acted on.
  - Distinguish a stall that needs a nudge from one that needs escalation, and act accordingly.
  - Write a status update that makes a blocked dependency visible without naming a villain.
artifact: A written escalation you actually sent (or would send) for a real stalled dependency, following the structure in this lesson.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

You are accountable for the engagement's outcome. The person sitting on the access request that is blocking week two is not accountable to you at all — they report to someone else, in a different department, with different priorities, and your engagement is a small fraction of their week. This gap between accountability and authority is close to the default condition of the job, not an edge case, and it is a skill Vinoo Ganesh's account of the traits that separate effective FDEs names directly: owning an outcome that depends on people outside your reporting line.

Engineers who have only worked inside their own company's org chart tend to reach for one of two failed moves here: escalate immediately, which burns a relationship you will need again, or wait politely, which lets the stall become the reason the whole engagement slips.

## The move: state the stake, not the request

A request that says "can you prioritise my access ticket" competes with every other ticket in that person's queue and usually loses, because it gives them no reason to care about your priority over their own. A request that states what depends on the ticket changes the calculation, because now the cost of not acting is visible to them, not just to you.

```text
"[Person], I need [specific thing] by [specific date] to hit
[specific milestone]. If it doesn't land by then, [specific
consequence — a demo slips, a milestone in the SOW is missed, a
renewal conversation happens without the number we promised].
I know this isn't your only priority — is there anything I can do
to make this faster on your end?"
```

The specificity is what makes this work, not the tone. "This might slow things down" is vague enough to ignore. "The sponsor's board update is on the 15th and this is the input for it" is a fact someone can act on, because it names a real date that exists whether or not they help you.

## Naming the stake without naming a villain

The version of this that goes wrong is the one that sounds like blame. "IT still hasn't given me access and it's costing us a week" said to the sponsor is technically accurate and will make the IT contact defensive the next time you need something from them — and you will need something from them again. The version that works describes the dependency, not the person:

> "Access to the CBS reporting database is the one open item for Milestone D1. It was requested on [date]; typical turnaround for this kind of request is [what you were told]. If it lands by [date] we're still on track for the Day 5 demo. I've followed up directly and wanted the sponsor aware in case there's a faster route."

This is a status update, not an accusation, and it is the kind of update a sponsor can act on without anyone losing face.

## Escalate versus nudge: the actual distinction

Not every stall needs a nudge, and not every stall needs escalation. The distinction is whether the person you are asking has the authority to unblock you at all.

| Signal | Move |
|---|---|
| They own the decision and have not gotten to it yet | Nudge, with the stake stated, directly to them |
| They own the decision and have said no, explicitly | Do not escalate around a stated no without understanding why first — see [IT, security, and the business owner: three conversations](/roles/forward-deployed-engineer/field/it-security-and-the-business-owner-three-conversations) |
| They do not have the authority to say yes, and are waiting on someone above them | Escalate, and frame it as helping them, not going around them: "want me to raise this with [their manager] directly, or would you rather do that?" |
| The delay is structural — a change window, an approval board that meets monthly | This is not a stall to push on. Build the schedule around it, and say so in your next status update |

The third row is the one people get wrong most often, because it looks like the same stall as the first row from the outside. The tell is a specific phrase: "I'd need my manager to sign off on that." Once you hear it, pushing the same person harder wastes time that escalation would spend well.

## Why "I know this isn't your only priority" belongs in the script

It costs you nothing and it does the actual work of the sentence. Most people who are sitting on your request are not being obstructive, they are triaging a queue you are not in. Acknowledging that, out loud, is what turns the request from "why haven't you done this" into "help me understand what would make this faster", which is a question people answer.

## The limit of this skill

None of this substitutes for authority you should actually have and do not — a named escalation path in the SOW, a defined response window for access requests, a sponsor who has agreed in writing to unblock dependencies within a stated number of days. Build those into the SOW's assumptions-and-dependencies table from the start, described in [Writing a statement of work](/roles/forward-deployed-engineer/field/writing-a-statement-of-work). Owning outcomes without authority is a skill for the gaps that remain even with a good SOW. It is not a substitute for writing one.
