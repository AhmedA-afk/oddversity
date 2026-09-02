---
title: "Drill 07: the US clinic prior authorisations"
phase: practice
module: decomposition-drills
kind: drill
summary: A US clinic group wants an AI system to submit and predict outcomes for prior authorisations across fourteen insurers. Forty-five minutes to discover that the vendor's API generates a form rather than submits one, and that most payers still run on a portal or a fax.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Verify a claimed integration before designing around it.
  - Map a multi-channel process by its real submission paths instead of assuming a single API.
  - Keep a professionally accountable decision under human control while automating what supports it.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Meridian Health Partners is a 40-physician multi-specialty group in central Ohio, primary care and cardiology mostly. You are the FDE assigned by the group's health-tech vendor, three days into the engagement. The COO opens with this:

> "Our prior authorization staff are drowning. We're submitting around 900 authorization requests a month across fourteen different insurance payers, and every denial that gets appealed costs us a week and a phone call we didn't budget for. I want an AI system that pulls the clinical documentation from the EHR, fills out the prior auth, submits it to the payer automatically, and flags the ones likely to get denied before we even send them. Our EHR vendor says they have an API for this. Let's start there."

You are given read access to the EHR's documentation and a spreadsheet of the last six months of authorization outcomes: payer, procedure code, approved or denied, and days to decision.

## The room

**Trish Faldo, Chief Operating Officer.** Owns staffing costs and the group's cash flow, since delayed authorizations delay billing.

> "Every day an authorization sits unresolved is a day we can't schedule the procedure and a day further from getting paid. I need this to move faster and I need fewer of my staff's hours going into it."

**Dr. Sanjay Iyer, Medical Director, cardiology.**

> "If your system writes the clinical justification and it's wrong, that's my name and my licence on the submission. I will not have a model deciding what counts as medically necessary. I will have it save my staff time finding the right documentation."

**Carla Jimenez, prior authorization specialist, eleven years doing this job.**

> "Fourteen payers means fourteen different processes. Three of them have a real API you can hit. Four have a web portal where I log in and type everything by hand, and it times out if I take too long. The other seven still want a fax, and two of those want a phone call afterward to confirm the fax was received. Nobody's ever mapped that out, because it's just what I do all day."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The COO's plan assumes a plumbing problem: pull from the EHR, push to the payer, done. The EHR vendor's "API for this" turns out, on inspection, to be an API for generating a standard prior-authorization form as a PDF — it does not submit anything anywhere. Submission is still Carla's job, and it splits three ways: three payers with a genuine API (different for each, different authentication schemes, different required fields), four with a web portal that must be filled by a human because the portals are not built for programmatic access and several actively block automated form-filling, and seven that take fax only, some of which require a follow-up phone call because fax delivery is not confirmed automatically.

Underneath the submission-channel problem sits a harder one: each payer's medical-necessity criteria — the rules that determine whether a given procedure will be approved for a given diagnosis — are largely proprietary, unpublished in any structured form, and inferred by Carla and her colleagues from years of pattern recognition across denials and appeals. "Flag the ones likely to get denied" is a real and valuable ask, but it requires learning fourteen different, mostly undocumented rule sets from historical outcomes, not integrating with a system that has the rules written down anywhere.

Sanjay's constraint compounds this: even where the pattern is well understood, the actual medical-necessity judgment and the clinical language justifying it has to remain his, both because he is professionally and legally accountable for it and because payers scrutinise justification language written in a formulaic or clearly automated way more, not less.

## What a strong decomposition covers

- **Mapping the fourteen payers by actual submission channel** — API, portal, fax — before proposing any single "automatic submission" solution, because these are three different engineering problems with three different feasible timelines.
- **Distinguishing form generation from submission.** The EHR vendor's API solves the first, not the second; confirming this in week one prevents building a demo against a capability that does not do what the brief assumes.
- **The denial-prediction model as a per-payer learning problem**, built from the six months of outcome data, not a general prior-auth intelligence, and explicitly framed as a decision-support flag for Carla, not an auto-decision.
- **Sanjay's non-negotiable**: the clinical justification text is drafted or reviewed by the physician, always; the tool's job is finding and assembling the supporting documentation, not writing the medical argument.
- **The decomposition**: payer channel mapping first (a week of Carla's tribal knowledge, written down, is itself a deliverable), then documentation-assembly automation for the API-and-portal payers, then a denial-likelihood flag trained per payer on the outcome data, and only after that, submission automation limited to the three payers with a genuine API.
- **The walking skeleton**: for the three API payers, an end-to-end path from EHR documentation to submitted authorization, with Sanjay reviewing every justification before it goes out, running on real cases in week one.

## A model 45 minutes

- **0 to 8.** Walk one authorization from the physician's order to the payer's decision, for each of the three channel types, if time allows just one of each.
- **8 to 15.** Trish's staffing cost, Sanjay's licence exposure, Carla's undocumented channel knowledge as the actual system of record.
- **15 to 23.** Confirm what the EHR vendor's API actually does versus what the brief assumes it does. Map all fourteen payers by channel.
- **23 to 33.** Channel mapping, then documentation assembly, then denial-likelihood flagging, then submission automation limited to true API payers.
- **33 to 40.** One channel, API-based, end to end, physician-reviewed justification, real cases.
- **40 to 45.** Risk: assuming portal and fax payers can be automated the same way as API payers. What you refuse: an AI-drafted medical necessity justification without physician review.

## The trap in this one

**Assuming an integration exists that doesn't.** "Our EHR vendor says they have an API for this" is the kind of sentence that ends decomposition rounds early, because it sounds like the hard part is solved and all that's left is wiring. The FDE who takes it at face value spends the first two weeks building a submission pipeline against an API that turns out to generate a form, not submit one, and discovers the fax-only payers only when Carla mentions, in passing, that she's still doing those by hand.

The correct first move is to verify the integration claim directly, against documentation or a live call, before it becomes an assumption baked into an architecture. On this drill specifically, that means asking Carla, not the EHR vendor's sales page, how each of the fourteen payers actually receives a submission today — because she is the only accurate source of truth on a process that has never been written down anywhere else.

## The rubric, applied

A weak attempt takes "the EHR vendor has an API" at face value, designs a single automated submission pipeline for all fourteen payers, and never asks Carla how submission actually happens today. That is 1/1/1/0/1.

A pass confirms what the EHR API actually does, maps all fourteen payers by real channel before designing anything, treats the denial-flag model as decision support rather than an auto-decision, and keeps clinical justification under physician control. That is 2/3/2/3/3.

Criterion 4 is the sharp one here: the zero belongs to the candidate who designs against an assumed integration; the three belongs to the one who asks to see the actual API documentation, or better, asks Carla to walk through one submission of each type, before writing anything down.
