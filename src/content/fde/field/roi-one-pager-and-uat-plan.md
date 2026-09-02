---
title: The ROI one-pager and the UAT plan
phase: field
module: scoping-sows-and-bootcamps
kind: lesson
summary: The ROI one-pager gets you the budget; the UAT plan gets you the sign-off. Neither is optional and neither takes more than an hour to draft once you have a decomposition. This page gives templates for both and a filled example.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Draft a one-page ROI case a sponsor can forward to their boss without editing it.
  - Write a UAT plan with named testers, real cases, and an explicit sign-off threshold.
  - Tell the difference between a benefit you can cost and one you are guessing at, and say which is which.
artifact: An ROI one-pager and a UAT plan for the same engagement, both filled with numbers from your decomposition worksheet or clearly marked as illustrative.
sources:
  - https://www.krishnaik.in/liveclass2/Forward_Deployed_Engineer?id=14
  - https://finance.biggo.com/podcast/25bf3c9c39d661d1
  - https://a16z.com/the-palantirization-of-everything/
---

Two documents get an engagement funded and then get it accepted. The ROI one-pager is what the sponsor uses to defend the spend upward, usually to someone who was never in the discovery conversation. The UAT plan is what turns "it works in the demo" into "we agree it is done". Both are short. Neither should be skipped, and both are on the list of documents an FDE curriculum explicitly names as things a candidate should be able to produce: discovery, SOWs, ROI presentations, UAT.

## The ROI one-pager

It has one audience: someone who will spend thirty seconds on it before deciding whether to protect the budget line. That means one page, one number the whole document supports, and no jargon the sponsor would have to translate before forwarding it.

### Structure

| Section | Length | Content |
|---|---|---|
| The problem, in one line | 1 sentence | What it costs today, in the customer's unit — hours, cases, rupees, incidents |
| The proposed change | 2-3 sentences | What you are building, at the level a non-engineer reads |
| The cost side | A short table | Build cost, run cost, the customer's own time cost of using it |
| The benefit side | A short table | What improves, by how much, over what period, and how confident you are in the number |
| Payback | 1 line | When the benefit exceeds the cost, stated as a date or a number of months |
| Risks to the case | 3-5 bullets | What would make this number wrong, named plainly |

The risks section is not optional and it is what separates a credible one-pager from a sales deck. A sponsor who has seen vendor ROI slides before will trust the one that says "this assumes the write-back API ships on time; if it does not, payback moves from month 3 to month 5" over the one with no risks at all.

### A note on numbers you do not have yet

Rekhi's account of scoping at Decagon frames this as narrowing to the highest-ROI intents and proving value in weeks, not building a business case from a full year of data you have not collected. In week one you rarely have the customer's real cost-per-case number. Say so. A one-pager that states "illustrative, based on a rate the customer will confirm in week one" and gets the mechanics right is more credible than one with a precise-looking number nobody checked.

### Template

```text
ROI ONE-PAGER
[Engagement name]                                    [Date]

THE PROBLEM
[One sentence, customer's unit: "X takes Y time/cost today, Z times a
week/month."]

THE PROPOSED CHANGE
[2-3 sentences, no jargon.]

COST
| Item | One-time | Ongoing (annual) |
|---|---|---|
| Build (this engagement) | [amount] | — |
| Run (hosting, licences) | — | [amount] |
| Customer time (training, review) | [hours] | [hours/period] |

BENEFIT
| Metric | Today | Target | Confidence |
|---|---|---|---|
| [metric, in customer's unit] | [baseline] | [target] | [high/medium — state why] |

PAYBACK: [date or month count]

RISKS TO THIS CASE
- [risk 1, plainly stated]
- [risk 2]
- [risk 3]
```

### Worked example: Meridian Co-operative Bank

Numbers below extend the re-KYC case from [Writing a statement of work](/roles/forward-deployed-engineer/field/writing-a-statement-of-work). Meridian is fictional; the figures are illustrative, built the way a real one-pager would be in week one, and marked as such rather than presented as verified.

```text
ROI ONE-PAGER
Re-KYC Backlog — Phase 1                              3 Mar 2027

THE PROBLEM
Branch officers spend ~13 minutes per re-KYC case (4 min classifying a
scan, 9 min retyping into CBS), plus rework on ~9 cases/day that fail the
overnight validation batch at ~15 min each. Illustrative: at 85 cases/day
average across the two branches piloted, that is roughly 20 officer-hours
a day, or 2.5 FTE, on data entry and rework alone.

THE PROPOSED CHANGE
Automate extraction and CBS matching for the majority of cases, route
low-confidence cases to an officer review queue instead of full manual
entry, and produce a daily aged-case count for compliance.

COST
| Item | One-time | Ongoing (annual) |
|---|---|---|
| Build (Phase 1, 5 working days + 20-day pilot) | [vendor rate x days] | — |
| Run (extraction service hosting) | — | [illustrative, to be confirmed with IT] |
| Customer time (officer review, unchanged per case, fewer cases) | — | reduces from current baseline |

BENEFIT
| Metric | Today | Target | Confidence |
|---|---|---|---|
| Officer minutes per case | ~13 | ~5 (review only, on flagged cases) | Medium — depends on extraction accuracy, confirmed in Phase 1 |
| Overnight rework cases/day | ~9 | <3 | Medium — same dependency |
| Aged-case count (>90 days) | Unknown, "a few hundred" | Known daily, refreshed automatically | High — this is a reporting change, not a model |

PAYBACK: To be confirmed after the Phase 1 pilot produces a real
extraction-accuracy number; do not commit a payback date before then.

RISKS TO THIS CASE
- Extraction accuracy on pre-2019 scans is unknown; if low, officer
  review time does not fall as much as projected.
- CBS write-back is file-drop only, once daily, which caps same-day
  benefit regardless of extraction quality.
- Officers may keep their personal spreadsheet out of habit; benefit
  depends on adoption, not just accuracy.
```

## The UAT plan

Where the ROI one-pager sells the engagement, the UAT plan closes it. It exists to answer one question in writing before go-live: who tests what, against which real cases, and what result counts as pass.

### Structure

| Section | Content |
|---|---|
| Scope of testing | Which deliverables from the SOW are being tested, explicitly, not "the system" |
| Test cases | Real cases, not synthetic ones, with the expected outcome the customer already knows |
| Testers | Named people, not roles — the branch officer who will actually use it, not "a representative" |
| Pass/fail threshold | A number, agreed before testing starts, not after seeing the results |
| Defect handling | What happens when a test fails: logged, triaged, re-tested, and by when |
| Sign-off | Who signs, by what date, and what silence means |

### Template

```text
UAT PLAN
[Engagement name]                                     [Date]

SCOPE
Testing covers: [list deliverables from the SOW, e.g. "D1: walking
skeleton on 50 cases"]. Not covered: [anything explicitly out of scope].

TEST CASES
| # | Case (real, from production) | Expected outcome | Source of truth |
|---|---|---|---|
| 1 | [case ID, from real data] | [what the officer already knows happened] | [who confirms it] |

TESTERS
| Name | Role | Cases assigned |
|---|---|---|

PASS/FAIL THRESHOLD
Agreed before testing: [e.g. "45 of 50 cases match CBS exactly; the
remaining 5 are reviewed individually with the sponsor before go/no-go."]

DEFECT HANDLING
Each failed case is logged with the expected and actual output. Vendor
re-tests within [N business days]. A defect that changes the pass
threshold pauses go-live; a cosmetic defect does not.

SIGN-OFF
Signed by: [sponsor name], by [date]. No response within [N] business
days of the final test session is treated as [accepted/escalated — pick
one and say which in the SOW].
```

## Why real cases beat synthetic ones

A synthetic test set proves the code runs. It does not prove the extraction handles the scan quality Meridian's actual branches produce, or that the match logic survives the dirty join key discovery already flagged as a risk. Pull the 50 cases for D1's UAT from the same February 2027 sample used to build the skeleton, and have the branch officer who processed them originally confirm the expected outcome. That is the only version of "it passed UAT" that means anything to the person who has to use it on Monday.

## What both documents have in common

Neither is written for you. The ROI one-pager is written for a sponsor's boss who will never read the SOW. The UAT plan is written for the person doing the testing, who will never read the ROI case. Match the reader, keep each to what its reader needs, and resist folding one into the other — a combined document serves neither audience well.
