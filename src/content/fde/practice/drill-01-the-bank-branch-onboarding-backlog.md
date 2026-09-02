---
title: "Drill 01: the bank branch onboarding backlog"
phase: practice
module: decomposition-drills
kind: drill
summary: A co-operative bank wants an AI engine to open accounts automatically. Forty-five minutes to find out that the delay is a rework loop, that the core banking screen belongs to a vendor, and that compliance can veto everything.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Separate a stated solution ("an AI KYC engine") from the problem behind it.
  - Locate the step in a process where the time is actually lost, using only questions about failure.
  - Propose a week-one slice that does not require changing a system you do not control.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Nandini Co-operative Bank has 140 branches across Maharashtra and about 2.6 million customers, mostly small traders, salaried staff and farmers. You are the FDE on the account, three days into the engagement. The COO opens the kickoff with this:

> "Account opening takes us eleven days. HDFC does it in ten minutes on a phone. We want an AI KYC engine that reads the documents, does the checks and opens the account automatically. Our board has asked for this to be live before the March quarter. Can you show us something in four weeks?"

You have been given read access to a sample export: 4,000 rows from the onboarding tracker, one row per application, with columns for branch code, application date, current status, status-changed date, and a free-text `remarks` field that branch staff fill in Marathi, Hindi and English, often all three in one cell.

## The room

**Suhas Vaidya, Chief Operating Officer.** Your sponsor. Owns the budget.

> "I don't need it perfect. I need a number I can take to the board in March. Eleven days to one day would be a story."

**Meenal Rao, Head of Branch Banking.** Runs the 140 branches.

> "My branch managers are not data entry operators. Central operations sends files back for nonsense, a signature slightly outside the box, and my staff redo them. If your system means more work at the counter, they will simply stop using it and open accounts the old way."

**Anand Kulkarni, Head of Compliance, and the bank's Principal Officer under the PMLA.**

> "I am personally accountable to the regulator for every one of these files. I am not going to sign off on a machine deciding a customer's identity. If you want to do something in this area, tell me exactly what a human still checks."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The eleven days are not eleven days of work. They are two days of work and nine days of waiting inside a rework loop.

Roughly a third of applications are rejected by central operations and sent back to the branch. The top reasons, if you count them out of the `remarks` field, are a handful of mechanical defects: the photograph is not on the correct page, the address on the utility bill does not match the address typed into the form, the signature crosses the box, the PAN image is unreadable, the second identity proof is missing, and the guardian details are blank on a minor's account. Four of those six are checkable without any model at all.

The loop costs two days each time, because branches only re-submit in the evening batch to central ops, and central ops only picks up the next morning. About one file in eight goes round the loop twice.

Two structural facts nobody said out loud. First, the account-opening screen belongs to the core banking vendor. The bank cannot change that screen; any change is a paid change request with a queue measured in quarters. Second, identity verification runs through the central KYC registry, and both the process and the audit trail are regulated. Kulkarni's veto is not obstruction, it is his statutory exposure.

The COO's "four weeks" is a board date, not an engineering estimate. Nobody has costed it.

## What a strong decomposition covers

- **The current process, timed at each hop.** Counter, branch checker, evening batch, central ops queue, defect, return, redo. The delay is in the hops, not the steps.
- **The rework rate as the metric**, not the eleven days. "Percentage of applications rejected on first submission, today about a third, target under ten percent" is measurable next week and moves the eleven days as a consequence.
- **Who owns the decision.** Vaidya funds it. Kulkarni can kill it. Rao's branch managers decide whether it gets used at all. Three different people, three different objections, three different conversations.
- **The data.** The tracker export is a status log, not a work log, so you can measure waiting but not effort. The `remarks` field is multilingual free text and is the only record of why files come back. The document images are in the vendor's system and you have not been told whether you can read them programmatically. Ask on day one; the answer determines the architecture.
- **The decomposition.** Defect taxonomy from the remarks field. A pre-submission check at the counter. Image quality and legibility checks. Field-to-document matching, which is the only part that needs a model. The submission batching schedule, which is a configuration change, not code. The audit record compliance needs.
- **The walking skeleton.** One branch. A page the officer opens before submitting, which takes the scanned set, runs the four mechanical checks, and shows a red or green list. It writes nothing to the core banking system. Real staff, real files, in week one.
- **Restraint.** Do not touch the identity decision. Say so to Kulkarni explicitly, in his words: the system checks completeness and legibility, a human still checks identity, and every check is logged with who overrode it.

## A model 45 minutes

- **0 to 8.** How is an account opened today, from the customer walking in to the account number being issued? Who touches it? What happens when it comes back? How often?
- **8 to 15.** Vaidya's board number, Rao's counter workload, Kulkarni's audit exposure. Name the March date as a constraint you have not accepted yet.
- **15 to 23.** The tracker export, the remarks field, the image store, and the question you must ask about programmatic access to the vendor's document system.
- **23 to 33.** Components in dependency order, with the four non-model checks first.
- **33 to 40.** One branch, one screen, ten days, no writes.
- **40 to 45.** Risks: vendor change request, image access, staff adoption at the counter, and the March date. What you will not build: an automated identity decision.

## The trap in this one

**Over-building.** The brief hands you an "AI KYC engine", a board deadline and a hero's welcome. Take it and you spend four weeks building a document-understanding pipeline for a problem where four of the six defect types are a length check, a null check, a string comparison and an image resolution threshold. Then you discover in week five that you cannot write to the core banking system anyway.

The FDE version of the answer is smaller and lands harder: a checklist screen at the counter that catches most rework, running in one branch inside two weeks, with the rework rate measured before and after. That is a board number too, and it is one you can actually produce by March.

A second, quieter trap sits underneath: the eleven days are a *queue*, and queues are usually fixed by changing when work moves, not by making each item faster. If the evening batch became hourly, the same rework loop would cost hours instead of days. Notice when the cheapest fix is a schedule.

## The rubric, applied

A weak attempt designs a document-extraction pipeline in minute six, promises the March date, and never asks who can write to the core banking system. That is 1/1/0/1/0.

A pass names the three stakeholders and their conflicting incentives, converts eleven days into a rework rate, asks about image access before designing, stages a non-model check first, and refuses the identity decision out loud. That is 2/3/2/2/3.

The point worth three marks on criterion 1 is the question that finds the loop, and it is not a question about technology. It is "what happens when a file comes back?"
