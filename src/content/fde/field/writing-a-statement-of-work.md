---
title: Writing a statement of work that protects both sides
phase: field
module: scoping-sows-and-bootcamps
kind: lesson
summary: A statement of work is not a legal formality, it is the document that stops the customer expanding scope for free and stops you promising something the data cannot support. This page gives the structure, a filled template, and a worked example for a fictional Indian co-operative bank.
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Write every section of an SOW from a blank page, in order, without a lawyer in the room.
  - Turn a decomposition worksheet directly into scope, deliverables and acceptance criteria.
  - Draft a change-control clause that lets both sides add work without a fight.
  - Spot the three sentences that most SOWs are missing, and that cause the disputes.
artifact: A filled statement of work for one engagement, built from your own decomposition worksheet, with a change-control clause you would actually sign.
sources:
  - https://www.krishnaik.in/liveclass2/Forward_Deployed_Engineer?id=14
  - https://fde.academy/blog/the-forward-deployed-engineer-roadmap
---

Most engineers write their first SOW by copying one from procurement and filling in the blanks. That produces a document nobody reads until something goes wrong, at which point both sides discover it does not say what they thought it said.

An SOW has one job: to make the boundary of the engagement visible to someone who was not in the discovery conversation. Not the sponsor who commissioned it, who already knows what you agreed. The branch manager promoted into the project in month two. The new CTO. The auditor. If the document cannot answer "what did the vendor actually commit to" without a phone call, it has failed at the only thing it is for.

An FDE curriculum that gets asked for in interviews for exactly this reason lists it among the four things a candidate should be able to produce cold: discovery, SOWs, ROI presentations, UAT. Nobody teaches it in a computer science degree, and almost nobody teaches it anywhere else either. What follows is a method, not a legal template — get an actual lawyer or your company's standard paper for the commercial and liability clauses. This is for the engineering content, which you own.

## The nine sections, and what each one is actually for

| Section | What it is for | The sentence it must contain |
|---|---|---|
| Background | Frames the problem in the customer's words, so a reader outside the room understands why this exists | The one-sentence restated problem from your decomposition |
| Objectives and success criteria | The measurable outcome, not the feature list | A number, a unit, and a date |
| In scope | The components you are building, named as verbs on nouns | Each one traceable to a decomposition component |
| Out of scope | What you are explicitly not doing, and why | At minimum, the thing the customer is most likely to assume is included |
| Deliverables and milestones | What ships, when, and what "done" means for each | A date or week number per deliverable |
| Assumptions and dependencies | What you are relying on the customer to provide or confirm | Named owner per dependency, not "the bank" |
| Data and access requirements | What systems, exports, and accounts you need, and by when | The access route agreed in discovery — read-only account, nightly file, export |
| Acceptance criteria | How the customer signs off each deliverable | Who signs, and what "reject" looks like |
| Change control | How new work gets added without renegotiating the whole document | A fixed process, not "by mutual agreement" |

Two of these are usually missing from templates copied off the internet: out-of-scope, and change control. They are also the two that prevent the two most common disputes.

## The template

```text
STATEMENT OF WORK
Engagement: [name]
Vendor: [you / your company]
Customer: [customer, department]
Prepared by: [you]           Date: [date]           Version: [n]

1. BACKGROUND
   [2-4 sentences: the problem in the customer's words, why it matters now,
   who asked for this. Pull directly from your decomposition Stage 1 restate.]

2. OBJECTIVES AND SUCCESS CRITERIA
   Primary objective: [one sentence, one metric, one target, one date]
   Secondary objectives (if any): [...]

3. IN SCOPE
   [List each component as verb-on-noun, tagged with the decomposition stage
   it came from. Example: "Extract address and ID fields from DMS scans
   (component B)."]

4. OUT OF SCOPE
   [Explicit. Name the thing a reasonable person would assume is included
   and say it is not, and why — cost, risk, or a dependency not yet resolved.]

5. DELIVERABLES AND MILESTONES
   | Deliverable | Description | Target date | Definition of done |
   |---|---|---|---|

6. ASSUMPTIONS AND DEPENDENCIES
   | # | Assumption/dependency | Owner | Needed by | If not met |
   |---|---|---|---|---|

7. DATA AND ACCESS REQUIREMENTS
   | System | Access route | Owner | Needed by |
   |---|---|---|---|

8. ACCEPTANCE CRITERIA
   [Per deliverable: who reviews, what evidence is presented, how many days
   to respond, what happens on silence — accepted or rejected by default.]

9. CHANGE CONTROL
   [Any request outside sections 3-4 is logged as a change request within
   2 business days, estimated within 5, and requires written sign-off from
   [sponsor] before work starts. No verbal scope changes.]

Signed: _________________ (Vendor)      _________________ (Customer)
```

## Worked example: Meridian Co-operative Bank

Meridian is fictional. The re-KYC backlog it describes is the same case used in [The decomposition method](/roles/forward-deployed-engineer/field/the-decomposition-method) — this SOW is what you would write after running that session.

```text
STATEMENT OF WORK
Engagement: Re-KYC Backlog — Phase 1 (Walking Skeleton)
Vendor: [you]
Customer: Meridian Co-operative Bank, Retail Operations
Prepared by: [you]           Date: 3 Mar 2027           Version: 1

1. BACKGROUND
   Meridian's branch officers process 60-110 re-KYC cases a day by hand,
   retyping fields from scanned documents into the core banking system
   (CBS). About 9 cases a day fail an 18:00 validation batch and are
   reworked the next morning. Cases older than 90 days are flagged in
   Meridian's annual audit; the bank does not currently know how many
   there are. A prior vendor attempt (2025) required a CBS login that was
   never provisioned and the project was abandoned.

2. OBJECTIVES AND SUCCESS CRITERIA
   Primary: reduce same-day processing failures on Meridian's Fort branch
   re-KYC queue from ~9/day to under 3/day, measured over 20 working days,
   by 30 Apr 2027.
   Secondary: produce an accurate count of cases aged over 90 days,
   refreshed daily, for the compliance team.

3. IN SCOPE
   - Ingest nightly DMS export (component A, exists)
   - Extract address and ID fields from scanned documents (component B)
   - Match extracted record to CBS customer (component C)
   - Confidence-based routing: auto-pass vs officer review (component D,
     threshold owned by Head of Branch Operations)
   - Officer review interface, spreadsheet-based for Phase 1 (component E)
   - Write approved outcome back to CBS via existing file-drop route
     (component F)
   - Daily aged-case report for compliance (component G)

4. OUT OF SCOPE
   - Any change to the CBS application or its database. IT will not permit
     inbound API calls; this SOW assumes file-drop only.
   - Pre-2019 accounts with no scanned document on file. These require a
     phone call to the customer and are excluded from Phase 1's success
     metric, though they are counted in the Phase 1 report.
   - A dedicated officer-facing UI. Phase 1 delivers a working spreadsheet;
     a proper UI is a Phase 2 decision, made after the skeleton is proven.

5. DELIVERABLES AND MILESTONES
   | Deliverable | Description | Target date | Definition of done |
   |---|---|---|---|
   | D1 | Working skeleton on 50 real cases from Feb 2027 | Day 5 | Sponsor reviews 5 cases live and confirms output matches CBS |
   | D2 | Deployed to Fort branch, 20-day pilot | Day 25 | Daily failure count logged and shared |
   | D3 | Aged-case report, daily | Day 10 | Compliance confirms count matches a manual sample of 30 cases |

6. ASSUMPTIONS AND DEPENDENCIES
   | # | Assumption/dependency | Owner | Needed by | If not met |
   |---|---|---|---|---|
   | 1 | Read-only export access to CBS customer table | Meridian IT | Day 1 | Milestone D1 slips one day per day of delay |
   | 2 | 200 sample DMS scans for extractor testing | Branch Ops | Day 2 | Extraction accuracy cannot be validated before D1 |
   | 3 | Confirmation that file-drop write-back is the only available route | Meridian IT | Day 1 | Scope reopens; API access would change components E-F |

7. DATA AND ACCESS REQUIREMENTS
   | System | Access route | Owner | Needed by |
   |---|---|---|---|
   | DMS scan archive | Nightly export, existing job | IT Ops | Day 1 |
   | CBS customer table | Read-only export or reporting DB account | IT Ops | Day 1 |
   | CBS write-back | Existing file-drop directory | IT Ops | Day 1 |

8. ACCEPTANCE CRITERIA
   D1 is accepted when the Head of Branch Operations reviews 5 cases live
   against CBS and confirms the output is correct, or rejected in writing
   within 2 business days with specific defects. Silence after 2 days is
   treated as acceptance.

9. CHANGE CONTROL
   Any request outside sections 3-4 (for example, an officer-facing UI
   before Phase 2, or extending to a second branch) is logged as a change
   request within 2 business days, estimated within 5, and requires
   written sign-off from the Head of Branch Operations before work starts.
```

## Why the out-of-scope section is the one that saves you

The dispute that ends engagements badly is never "you didn't build what was in scope". It is "I assumed this was included". Every enterprise SOW has an implicit list of things a reasonable customer would expect, and if you do not name them and exclude them explicitly, you own them by default. In the Meridian example, the officer-facing UI is the obvious one: nobody who has watched a demo assumes the interface will still be a spreadsheet. Say so, in the document, before the demo.

## Why change control is the clause both sides actually want

New requirements will surface in week two. That is not scope creep, it is discovery continuing after the document was signed — which is normal and which the decomposition method predicts. The clause is not there to stop the customer asking for more. It is there so that when they do, both sides have a fixed process instead of a negotiation that reopens the whole SOW. A customer who has been burned by a vendor that quietly absorbed unpaid scope will trust a vendor that names the process for adding it back more than one who claims never to need it.

## What the SOW is not

It is not the commercial terms — pricing, payment schedule, liability, IP ownership, indemnity. Those belong in a master services agreement or an order form your legal team owns, and you should never draft that language yourself. The SOW is the engineering contract: what gets built, in what order, against what evidence of success. Keep it that way and it stays a document people actually read.
