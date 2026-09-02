---
title: "Drill 04: the payments merchant dispute queue"
phase: practice
module: decomposition-drills
kind: drill
summary: A UPI payment aggregator's dispute queue is drowning and operations wants an AI to auto-resolve chargebacks. Forty-five minutes to discover that the queue is two different problems wearing one name, and that nobody has ever checked whether two human reviewers agree with each other.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Separate a queue that looks like one automation problem into a mechanical half and a judgment half.
  - Test whether a "correct" answer exists before scoping a model against it.
  - Design a week-one slice that only touches the cases with an unambiguous answer.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Tarang Payments is a Bengaluru-based payment aggregator that settles UPI and card transactions for roughly 40,000 small and mid-size merchants — kirana chains, D2C brands, ride-hailing add-ons. You are the FDE embedded with the operations team, two weeks in. The Head of Operations opens the session:

> "We're sitting on 3,000 open disputes a day and it's growing every festival season. A customer says 'goods not received', or the bank says a UPI debit never credited the merchant, or a cardholder disputes a charge outright, and every one of them sits in a queue until an analyst reads the evidence and decides who's right. I want an AI that reads the screenshots, the chat transcripts, the UPI reference numbers, whatever evidence comes in, and auto-resolves the straightforward ones. We have a network-mandated turnaround window on these and we're missing it more weeks than not."

You are given a database export: 90 days of resolved disputes, about 210,000 rows, with dispute type, evidence attachments (mostly images and PDFs), analyst decision, and days-to-resolve.

## The room

**Divya Shenoy, Head of Operations.** Owns the queue and the missed-turnaround numbers that go to the board.

> "I don't need it to be perfect, I need it to clear the backlog. If it gets eighty percent right, that's eighty percent my analysts don't have to touch."

**Farhan Aziz, Head of Risk and Compliance.**

> "Every resolution we issue is auditable by the card networks and by our banking partners. If a regulator or a partner bank asks why we ruled a certain way on a case, I need an answer that isn't 'the model said so'. And our turnaround windows aren't optional — miss too many and the networks can restrict our licence to operate."

**Reema Krishnan, senior dispute analyst, twelve years on the desk.**

> "People think this is one queue. It isn't. Half of it is: did the reference number clear or didn't it, which I can tell from the switch file in under a minute. The other half is someone telling me a story and me deciding who I believe. Nobody has ever asked me how often I'd disagree with the analyst next to me on that second half. I can tell you: often."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The 3,000-a-day queue is really two queues wearing one name.

The first is mechanical. A meaningful share of disputes — Reema puts it near half — are resolvable from data that already exists: the UPI switch reconciliation file records whether a reference number actually settled, cleared, or reversed. "Customer says debited but merchant says no order" is not a judgment call if the switch file has the answer. Nobody currently joins the dispute queue to the reconciliation file automatically; each analyst does it by hand, per ticket, and that hand-join is most of what makes the "simple" cases slow.

The second queue is judgment. "Goods not received," "not as described," "unauthorised" without a clear technical trail: these turn on believing one party's account over another's, weighing photo evidence, matching delivery timestamps against complaint timestamps, reading tone in a chat transcript. Nobody at Tarang has ever measured whether two experienced analysts resolve the same judgment case the same way. Divya assumes there is a ground truth an AI could learn to reproduce. Reema, who has done the job for twelve years, does not believe that ground truth exists — she believes analysts differ, quietly, and the queue's throughput number has always absorbed that disagreement without anyone noticing.

Farhan's constraint is real and structural: any automated ruling has to survive a network or partner-bank audit, which means it needs a legible reason, not a confidence score.

## What a strong decomposition covers

- **Splitting the queue before touching it.** Mechanical disputes (switch-file lookup) and judgment disputes (evidence weighing) are different problems with different feasible solutions. Treating them as one "AI resolves disputes" project is the mistake baked into the brief.
- **The eval question asked before the build question.** For the judgment half: pull a sample of, say, 100 already-closed cases and have two senior analysts re-decide them blind, independently. If they agree with each other on 60 percent of cases, there is no ground truth for a model to learn, and the honest project is a decision-support tool for the analyst, not an auto-resolver.
- **Who owns the audit trail.** Farhan needs every automated ruling to produce a reason a network auditor would accept, which rules out an opaque score for anything Farhan has to defend.
- **The metric Divya actually cares about**, missed-turnaround count, and how much of it the mechanical half alone would fix without touching the judgment half at all.
- **The data**, specifically that "evidence" is a folder of screenshots and PDFs of wildly inconsistent quality, and that the switch reconciliation file is the one dataset in this whole picture that is already structured and already true.
- **The decomposition.** Switch-file auto-match for the mechanical half. An inter-rater study before anything is built for the judgment half. Only after that study, a decision-support view that surfaces the switch-file answer, the chat transcript, and the delivery timestamp side by side for the analyst — not a ruling.

## A model 45 minutes

- **0 to 8.** Walk one dispute end to end, both kinds: what does the analyst look at, in what order, and how do they decide.
- **8 to 15.** Divya's missed-turnaround number, Farhan's audit obligation, Reema's disagreement claim as a testable hypothesis, not an opinion.
- **15 to 23.** The switch reconciliation file versus the evidence folder: one is structured and true, the other is not.
- **23 to 33.** Two components in dependency order: the auto-match for mechanical cases, and the inter-rater study before any judgment-case model is scoped.
- **33 to 40.** Week-one slice: auto-match against the switch file for one dispute type, shadow-running next to the human queue, with results not yet trusted for auto-resolution.
- **40 to 45.** Risk: building the judgment-side model before knowing if it's learnable. What you refuse: an auto-resolver with no reason a bank auditor could read.

## The trap in this one

**Skipping the eval.** Divya's request sounds like a build problem — read the evidence, output a decision — and the fastest way to look productive in week one is to start labelling data and training or prompting a classifier. The trap is that nobody has established that the label exists. If two of Tarang's own senior analysts, working independently on the same case, land on different answers a third of the time, then there is no target for a model to hit, and the "we're at 80% accuracy" number Divya wants to report is meaningless — accurate against what?

The FDE move is to run the cheapest possible test of that assumption before writing a line of the actual system: a same-day, low-cost inter-rater exercise on a sample of closed cases. If agreement is high, there is a real eval to build against and the judgment-side project is fundable. If it is not, the honest project is a tool that makes Reema faster and more consistent, not one that replaces her judgment — and that is still a real win, just a different one than the brief asked for.

## The rubric, applied

A weak attempt hears "AI that resolves disputes," starts scoping a classifier trained on 90 days of historical decisions, and never asks whether those historical decisions agree with each other. That is 1/1/1/2/1.

A pass splits the mechanical and judgment queues in the first ten minutes, proposes the inter-rater study as the very first deliverable, ties the switch file to the mechanical half immediately, and names the audit-trail constraint as a hard requirement on any judgment-side design. That is 3/2/2/3/3.

The three points on criterion 1 go to the candidate who asks Reema, specifically, "how often do you and another analyst disagree on the same case" — a clarifying question that most candidates never think to ask because it sounds like it's questioning the premise of the whole project, which is exactly why it matters.
