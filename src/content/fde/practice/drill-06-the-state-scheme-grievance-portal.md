---
title: "Drill 06: the state scheme grievance portal"
phase: practice
module: decomposition-drills
kind: drill
summary: A district administration wants an AI chatbot to clear a growing backlog of welfare-scheme grievances. Forty-five minutes to discover that the backlog is stuck on field-verification capacity and an eligibility rule, neither of which a portal can fix.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Split a backlog by its real causes instead of treating it as one queue.
  - Recognise when a software request is standing in for a staffing or policy decision nobody can make.
  - Produce a decision-support artifact that is honest about what software can and cannot fix.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

The Bhairavgad district administration runs the Grameen Suraksha Pension Yojana, a state welfare scheme paying a monthly pension to elderly residents below a land-holding threshold. About 340,000 pending grievances sit in the district's portal — applications rejected, delayed, or stuck — and the number keeps growing faster than it clears. You are the FDE brought in by the district's e-governance cell. The Additional District Collector opens the meeting:

> "The Chief Minister's office reviews our grievance-disposal numbers every month and we are near the bottom of the state ranking. I want an AI chatbot on the portal that can read a grievance, understand what the applicant needs, and either resolve it automatically or route it to the right officer immediately. We have a state IT grant that expires this financial year; I need something live in six weeks."

You are given a database export of grievances: category, submitted date, status, and a free-text applicant description in Hindi and Marathi.

## The room

**Ravindra Deshmukh, Additional District Collector.** Owns the disposal metric and the state ranking.

> "Every month I explain the pendency to the Collector, and every month the answer is the same: not enough staff to process applications. I cannot get more staff. I can get software."

**Sunanda Pawar, Block Development Officer for the district's largest block.**

> "Ninety percent of what sits 'pending' in that portal is waiting on one thing: someone from my office has to physically visit the applicant's house and verify the land record matches what they've submitted. I have four field verification officers for eleven thousand pending cases in my block alone. No chatbot visits a house."

**Ajay Solanki, District Informatics Officer, runs the portal.**

> "The applications that get rejected outright, again and again, are almost all the same reason: the scheme rules require an updated land-record extract in the applicant's own name, and a huge number of our elderly applicants' land is still recorded in a deceased parent's name because the family never completed a mutation. That's not a portal bug. That's the eligibility rule itself excluding people the scheme was written for."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

Two different things are stuck inside one "pendency" number, and neither is a software problem.

The first is capacity. Most pending grievances are not waiting for a decision; they are waiting for a physical field verification visit that only a handful of block-level officers can perform, and the ratio of pending cases to available officers guarantees a multi-month queue no matter how the portal routes the ticket. A chatbot that "understands the grievance" and routes it faster only makes the queue in front of Sunanda's four officers visible sooner. It does not add officers.

The second is a policy design defect, not a data problem an AI can resolve: the eligibility rule requiring a land-record extract in the applicant's own name systematically excludes a category of genuine beneficiaries whose land record was never formally mutated after inheritance, which in rural Maharashtra can be a majority of small landholders. Every one of those applications generates a "grievance" that will be rejected again on reapplication, because the underlying rule, not the applicant's paperwork, is the obstacle. No amount of natural-language routing changes the outcome of an application that the rule itself disqualifies.

Ravindra's request for a chatbot addresses neither. It would very plausibly reduce average first-response time — a metric the state dashboard might reward — while doing nothing to the actual disposal count, because disposal requires either a field visit that doesn't exist or a rule change that is not the district's to make.

## What a strong decomposition covers

- **Splitting the pendency number by real cause**, not treating it as one queue: field-verification-bound cases, rule-ineligible cases, and the probably small remainder that is genuinely a routing or information problem.
- **Naming what is and is not in the district administration's authority.** Adding field staff and changing the eligibility rule are both state-level or budget decisions Ravindra cannot make unilaterally; a chatbot is the one lever he can pull without asking anyone. That is worth saying out loud, because it explains why the brief arrived shaped as a software request.
- **A measurable split of the backlog** as the actual week-one deliverable: what fraction of the 340,000 is stuck on field verification capacity, what fraction is stuck on the land-record mutation issue, and what fraction is a genuine information or routing gap.
- **What software can honestly move**: prioritising the field-verification queue so officers visit the cases most likely to be approved first, not visiting in application order; and producing, from the applicant free-text, a clean count of how many rejections trace to the mutation issue — a number Ravindra can actually take to the state to argue for a rule change, which is a real and useful artifact even though it isn't the AI chatbot he asked for.
- **What it does not do**: resolve a case without a field visit where a field visit is legally required, or reverse a rejection the eligibility rule mandates.

## A model 45 minutes

- **0 to 8.** Walk one grievance from submission to resolution or rejection. At what step does it actually stop moving, and how often.
- **8 to 15.** Ravindra's ranking pressure, Sunanda's staffing ceiling, Ajay's rule-mismatch observation — and which of the three can actually change the rule or the staffing.
- **15 to 23.** The grievance database, the free-text field in two languages, and whether rejection reasons are captured in any structured way at all.
- **23 to 33.** Split the backlog by cause first; only then decompose the "genuine routing gap" slice into components.
- **33 to 40.** Week-one slice: a report that splits the 340,000 by cause, plus a prioritisation ordering for Sunanda's four field officers based on approval likelihood.
- **40 to 45.** Risk: the ADC's chatbot ask, if built, would look busy and move nothing. What you refuse: promising the field-verification or rule problems will be solved by the portal.

## The trap in this one

**Mistaking a policy problem for a software problem.** The brief is shaped like a software request because software is the one lever the person asking for it can actually pull. Ravindra cannot hire field officers and cannot change the eligibility rule, so "build me a chatbot" is the request that fits inside his authority, even though it does not fit the actual cause of the backlog. Take the request at face value and you spend six weeks building a routing layer for a queue that was never blocked on routing.

The FDE move is not to refuse the request. It is to build the smaller thing that is actually true — a backlog broken down by real cause, and a prioritisation tool for the field officers who exist — and hand back, alongside it, a clear statement of the two problems software cannot touch: staffing and the eligibility rule. That statement, addressed to someone above Ravindra who can act on it, is worth more to the scheme's actual beneficiaries than a chatbot that answers questions faster about applications that were never going anywhere.

## The rubric, applied

A weak attempt designs an NLP triage chatbot for the free-text field, demos intent classification, and never asks why cases are actually stuck. That is 1/1/0/1/1.

A pass splits the backlog by cause in the first pass, correctly identifies that field capacity and the eligibility rule sit outside the district administration's authority, proposes the prioritisation tool and the cause-report as the real week-one artifacts, and states plainly what the chatbot would and would not fix. That is 3/2/3/2/3.

Criterion 1 carries the weight: the question that finds this trap is "who has the authority to change the thing that's actually stuck," asked before any design begins.
