---
title: "Drill 10: the insurer claims triage"
phase: practice
module: decomposition-drills
kind: drill
summary: An Indian insurer and its claims TPA want a joint system to auto-approve straightforward cashless hospital claims. Forty-five minutes to discover that the two companies paying for the system want opposite things from it, and neither is the hospital's patient.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Name the separate, conflicting incentives inside what looks like one joint request.
  - Identify whose risk a threshold actually is, and keep that decision with them.
  - Report a trade-off with separate metrics instead of one blended number that hides who it favours.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Suraksha General Insurance underwrites health cover for around 2.1 million policyholders and outsources claims processing to MedAssist TPA Services for its network hospitals. You are the FDE brought in jointly by both companies to speed up cashless claim approvals. The kickoff is a three-way call, and MedAssist's Operations Director opens it:

> "We're processing about 6,000 cashless pre-authorisation requests a day and turnaround has slipped past our target. I want an AI system that reads the treatment estimate and the policy terms and auto-approves the straightforward ones, so my team only touches the complicated cases. We can have this live in two months if everyone agrees on the approach today."

You're given a sample export of 15,000 resolved pre-authorisation requests: diagnosis, requested amount, approved amount, approval or rejection, and processing time.

## The room

**Kavita Bhatt, Head of Claims, Suraksha General Insurance.** Accountable to the regulator and to Suraksha's own board for the claims-to-premium ratio.

> "Every rupee this system approves that shouldn't have been approved comes straight out of our loss ratio, and I am the one who answers for it at the quarterly board review. I would rather a claim take an extra day of manual review than see leakage creep up because a model auto-approved something it shouldn't have."

**Rajiv Suresh, Operations Director, MedAssist TPA Services.** MedAssist is paid per claim processed under its contract with Suraksha.

> "Our contract pays us per case closed, not per rupee saved for the insurer. Every case that sits in manual review past our turnaround target is a case we're contractually exposed on. I need volume moving, and honestly, from where I sit, a slightly higher approval rate is not a problem I'm paid to solve."

**Dr. Meenakshi Iyer, insurance desk manager at Ashirwad Multispecialty Hospital, a network hospital.** Not on the call, but quoted from a stakeholder interview the week before.

> "When a pre-auth is stuck, my patient is sitting in a bed we could use for the next admission, and the family is asking me why the 'cashless' scheme isn't cashless. I don't care whose system is slow. I care that it's slow."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The three parties on this engagement are not asking for the same thing, and the brief's framing — "auto-approve the straightforward ones" — hides the fact that "straightforward" means something different to each of them.

Kavita's job is to keep the claims-to-premium ratio inside a regulatory and board-mandated band; every false approval is a specific, attributable cost against a number she personally defends. Her acceptable error rate on auto-approval is close to zero, and she would trade speed for accuracy every time if forced to choose.

Rajiv's contract pays MedAssist per case closed within a turnaround window, with no financial exposure to the accuracy of the decision — leakage is Suraksha's cost, not his. His incentive, entirely rationally given his contract, is to push the auto-approval threshold as wide as it will go, because every case that clears automatically is throughput with no cost to him.

Dr. Iyer, and behind her every patient in a bed waiting on a pre-authorisation, experiences neither party's incentive directly. She experiences delay, and she will call it a system failure regardless of which of the two companies' priorities caused it.

There is no version of "auto-approve the straightforward ones" that both Kavita and Rajiv would draw the same line on, because the line is not a technical question, it is a risk-appetite question, and the two organisations paying for this system have structurally opposite risk appetites. A design that treats "the customer" as one voice and asks "how accurate does the model need to be" will get a different, self-interested answer depending on who's in the room when it's asked.

## What a strong decomposition covers

- **Naming the three parties' incentives explicitly, and where they conflict**, before any threshold or accuracy target is discussed — Kavita's loss-ratio exposure, Rajiv's volume incentive, and the hospital's exposure to delay regardless of cause.
- **Whose decision the auto-approval threshold actually is.** It is Suraksha's risk to carry, so it should be Suraksha's threshold to set, with MedAssist implementing against it, not negotiating it upward through the engagement.
- **A metric each party can see honestly**, not one blended number: leakage rate (Kavita's), turnaround time (Rajiv's), and time-to-decision as experienced at the hospital desk (Dr. Iyer's) — reported separately, because averaging them hides exactly the trade-off that matters.
- **The claims that are genuinely low-risk to automate**: small-value, clearly in-policy, high historical approval-rate diagnosis categories, where the cost of an occasional wrong auto-approval is small and bounded — as distinct from claims where a wrong auto-approval is large or where the diagnosis category has a wide historical range of outcomes.
- **The decomposition**: segment historical claims by value and diagnosis-category consistency first; set the auto-approval threshold as Suraksha's explicit, written risk decision; build the auto-approval path only for the segment inside that threshold; route everything else to a faster manual queue rather than promising to eliminate it.
- **The walking skeleton**: auto-approval live for one narrow, low-value, high-consistency claim category, with every auto-approved case logged and sample-audited weekly by Kavita's team, before any expansion.

## A model 45 minutes

- **0 to 8.** Walk one pre-authorisation from hospital submission to decision, and ask each party, separately, what "too slow" and "too risky" mean to them in their own numbers.
- **8 to 15.** Kavita's loss-ratio exposure, Rajiv's per-case contract incentive, Dr. Iyer's bed-turnover pressure — named as three different, unshared goals, not one shared goal of "faster claims".
- **15 to 23.** The 15,000-claim export: which diagnosis categories have a tight, consistent approval pattern, and which vary widely.
- **23 to 33.** Segment by risk first; set the threshold as Suraksha's decision; build the narrow auto-approval path; speed up the manual queue for everything else.
- **33 to 40.** One low-value, high-consistency category, live, fully audited weekly.
- **40 to 45.** Risk: MedAssist pushing the threshold wider than Suraksha's risk appetite once the system works. What you refuse: a single blended "efficiency" metric that hides whose interest it serves.

## The trap in this one

**Treating conflicting incentives as one voice.** A three-way kickoff call with everyone nodding along to "auto-approve the straightforward ones" feels like alignment, and it is tempting to take the room's apparent agreement at face value and start scoping a single system that "does what everyone wants." The trap is that MedAssist and Suraksha are not actually aligned, they are both individually rational and mutually opposed on exactly the variable the system has to be built around, and the hospital, who has no seat in the room deciding the threshold, bears the cost of whichever way it's set wrong.

Left undiscovered, this produces a system where the threshold quietly drifts toward whoever is louder in the weekly status meeting, usually the party with the volume incentive, until Suraksha's loss ratio moves enough that Kavita shuts the whole thing down months later and blames the model rather than the incentive structure it was built inside.

## The rubric, applied

A weak attempt hears "auto-approve the straightforward ones", designs a single classifier with one accuracy target, and never asks Kavita and Rajiv separately what error rate they'd each accept. That is 1/0/1/2/1.

A pass names all three parties' incentives and their conflict explicitly, establishes that the threshold is Suraksha's risk decision rather than a jointly negotiated one, reports three separate metrics instead of one blended figure, and starts with a narrow, audited, low-risk segment. That is 2/3/3/2/3.

Criterion 2 is the whole drill: a zero treats the three-way call as one customer; a three names who benefits from a wider threshold, who bears the cost of it, and who has neither benefit nor cost but suffers the delay regardless.
