---
title: "The decomposition method: clarify, stakeholders, inputs, break down, skeleton"
phase: field
module: discovery-and-decomposition
kind: lesson
summary: A repeatable 45-minute method for taking a vague enterprise problem to a staged plan with a walking-skeleton first slice. This is the highest-weighted round in most FDE interview loops and the thing you will do in the first week of every engagement.
duration: 18 min
updated: "2026-09-02"
outcomes:
  - Run the six-stage decomposition on a cold problem inside 45 minutes, on a timer.
  - Name the stakeholders and the metric each one is judged on before proposing anything.
  - Produce a walking-skeleton first slice that touches every layer of the system and can be demoed.
  - Say out loud what you decided not to build, and why.
artifact: A filled decomposition worksheet for one problem, timed, with the skeleton slice and the risk list. This becomes the template you reuse for every drill in the practice phase.
sources:
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
  - https://www.tryexponent.com/guides/palantir-forward-deployed-engineer-interview
  - https://www.tryexponent.com/guides/databricks-forward-deployed-engineer-interview
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://fde.academy/blog/forward-deployed-engineer-eligibility
---

This page is the spine of the path. Everything in the practice phase is a repetition of what is described here, and every FDE interview loop worth taking tests it directly.

Exponent's guide calls the decomposition round the single most important filter in the FDE process, and names jumping to a solution before scoping as a top rejection pattern. Palantir runs decomposition as one of three virtual-onsite rounds. Databricks, which launched FDE roles in 2026, runs a 60-minute decomposition round described as five to fifteen minutes of clarifying questions followed by design. Futurense's FDE academy sets "decompose a live problem in under 15 minutes" as a milestone.

None of them publish the method. Here is one that works, in six stages, on a clock.

## The clock

Forty-five minutes, because that is roughly what the interview gives you and roughly what a customer's calendar gives you. Set a timer. The budget:

| Stage | Minutes | You leave with |
|---|---|---|
| 1. Clarify | 8 | The problem restated in one sentence the customer would sign |
| 2. Stakeholders and metrics | 7 | Three to five named roles, each with the number they are judged on |
| 3. Inputs and data | 8 | What exists, where, in what state, who owns access |
| 4. Decompose | 10 | The workflow as five to nine components with dependencies |
| 5. Walking skeleton | 8 | The thinnest slice that touches every layer, and its demo |
| 6. Risks and staging | 4 | What kills this, and what you deliberately did not build |

The stage order is not decoration. Skipping stage 2 is how you build something correct for nobody. Skipping stage 3 is how you promise a join that the data cannot support.

## Stage 1: Clarify (8 min)

Do not ask what they want. Ask what happens now, what "good" would look like, and what the boundaries are.

Four questions that earn their place:

- "When you say this is slow, slow compared to what? What is the number today and what would be acceptable?"
- "Who is complaining? Is it the people doing the work, their manager, or a customer?"
- "Is this every case or a subset? What fraction?"
- "What is definitely out of scope? What would I be mad to touch?"

Then restate. Out loud, in one sentence, in their vocabulary, and wait for the correction:

> "So: branch officers process about 60 re-KYC cases a day, door-to-door turnaround is two days against an internal target of same-day, the pain is concentrated in month-end weeks, and the core banking system is not something we are allowed to modify. Is that right?"

The correction you get is the most valuable thing in the first ten minutes. In the example above, the answer that comes back is usually something like "same-day for 80 percent of them is fine, but the aged ones past 90 days are what audit asks about". The problem just changed shape.

## Stage 2: Stakeholders and metrics (7 min)

For each role, write three things: what they want, what they are measured on, and what they can veto.

| Role | Wants | Measured on | Can veto |
|---|---|---|---|
| Head of branch operations (sponsor) | Backlog cleared before audit | Aged cases over 90 days | Scope, budget |
| Branch officer (user) | Fewer keystrokes, no blame | Cases closed per day | Adoption, silently |
| IT / core banking team | No change to CBS, no new inbound ports | Uptime, change-window incidents | Deployment entirely |
| Compliance officer | Auditable decision trail | Regulator findings | Go-live |
| Vendor account manager | Renewal | Contract value | Nothing, but shapes the story |

Two rules. The person who signs is rarely the person who uses. And the user's veto is invisible: they do not block the project, they just keep the spreadsheet.

Vinoo Ganesh's guide to the role frames the senior version of this as cross-audience communication: the same problem stated as business impact to the executive and as implementation detail to the engineer. You cannot do that until you have this table.

## Stage 3: Inputs and data (8 min)

Ask about existence, access, shape, and truth, in that order.

- **Existence.** "Does a record of this exist at all, or is it in someone's head?"
- **Access.** "Who owns that system? Do I get a read-only account, an export, or a nightly file?"
- **Shape.** "One row per what? How far back? What is the key?"
- **Truth.** "What field in there do people not trust? What do you fix by hand?"

The truth question is the one that saves you. Every enterprise dataset has a column that is technically populated and semantically garbage. Vinoo Ganesh's account of the job includes the case of an empty date column that, once used as part of a key, generated 2.3 million Cassandra keyspaces and consumed 14 TB of RAM. Data quality is not a tidiness concern in this job, it is a design input.

Write down, explicitly: what you will *not* have. "No per-record reason code from the nightly batch" is a constraint that will shape the whole design, and it is better discovered in minute 20 than in week three.

## Stage 4: Decompose (10 min)

Now break the workflow into components. Not into services and not into a database schema. Into steps of the *business* process, each of which either happens or does not.

Rules that keep this honest:

1. **Name components as verbs on nouns.** "Ingest DMS scans", "Extract address fields", "Match to CBS customer", "Queue for officer review", "Write outcome back", "Report aged cases". Not "the ingestion layer".
2. **Five to nine components.** Fewer means you have not decomposed. More means you have started designing.
3. **Mark each one: exists / needs building / needs a decision.** The "needs a decision" ones are the ones you talk about, not the ones you can already code.
4. **Draw the dependencies as a list, not a picture.** "Match depends on Extract and on a CBS read." If two components have no dependency between them, say so; that is where parallel work and staging come from.
5. **Mark where a human stays in the loop.** In regulated work this is not a fallback, it is the design.

For the re-KYC case:

```text
A. Ingest DMS scans (exists: nightly export, PDF, no OCR)
B. Extract address + ID fields             [build] [decision: OCR vendor vs model]
C. Match record to CBS customer            [build] [decision: match key — no clean one]
D. Confidence split: auto vs review queue  [build] [decision: threshold owner]
E. Officer review UI                       [build]
F. Write outcome back to CBS               [decision: no write API; file drop only]
G. Aged-case report for compliance         [build, cheap]

Dependencies: B needs A. C needs B. D needs C. E needs D. F needs E. G needs C only.
Human in loop: D and E, permanently. Compliance will not accept full auto.
```

Notice what fell out. G depends only on C, so the compliance report — the thing the sponsor is actually judged on — can ship long before the review UI. That is the kind of finding decomposition exists to produce.

## Stage 5: The walking skeleton (8 min)

A walking skeleton is the thinnest possible slice that goes through *every* layer end to end and produces one real output on real data. Not a prototype of the hardest component. Not a mock UI. One case, all the way through, plumbed.

Specify it in five lines:

- **Scope:** one branch, one document type, 50 real cases from last month.
- **Path:** A to G, with B done crudely and D's threshold hard-coded.
- **Output:** a file the officer opens, and one row written back through the file-drop route in F.
- **Demo:** the sponsor picks a case number from last month; you show what the system says and what actually happened.
- **Timebox:** five working days.

Why the skeleton and not the hard part first. Because F, the write-back, is the component most likely to be impossible, and you will not find out by improving the extractor. Because the demo needs an end-to-end story on day three or five, not a good model in week six. And because touching every layer early is how you discover which team has not given you access yet.

State the two things you are deliberately deferring, and why:

> "I am not building the review UI this week. I will hand the officer a spreadsheet, because the point of week one is to find out whether the CBS write-back works at all. If it does not, the UI is wasted work."

## Stage 6: Risks and staging (4 min)

Four to six risks, each with a probability word, an impact, and the cheapest thing that would tell you early.

| Risk | Impact | Cheapest early signal |
|---|---|---|
| No usable match key between DMS and CBS | Fatal to C, D, E | Ask for 200 rows of each today; try the join tonight |
| Write-back is file-drop only, once daily | Caps benefit at T+1 | Confirm with the CBS vendor in week one |
| Pre-2019 scans missing | Excludes the aged cases audit cares about | Count them in the export |
| Compliance requires named-reviewer trail | Adds an audit table | One conversation, not an integration |
| Officers keep the spreadsheet | Adoption failure, invisible | Instrument usage from day one |

Then the stage plan, in three lines: what ships in week one, what in weeks two to four, and what is explicitly a phase two you are not committing to.

## What to say out loud

The round is scored on reasoning, not on the answer. Narrate:

- "I am asking about the previous attempt because if this has been tried, the reason it died is a constraint I need."
- "I am going to assume the join key is dirty until someone shows me otherwise, and I have put that first in the risk list."
- "I am not proposing a model here. The elapsed time is in an overnight batch, and a better model does not move that."

That last one is the highest-scoring sentence available to you, and it is also just true. Ramp's team principle "always be scoping — question all requirements" is the same instruction.

## The worksheet

Keep this in a file and fill a fresh copy for every drill.

```text
PROBLEM (their words):
RESTATED (one sentence, corrected by them):
OUT OF SCOPE:

STAKEHOLDERS
  role | wants | measured on | can veto

DATA
  exists / access route / grain / trusted? / what I will NOT have

COMPONENTS (5-9, verb-on-noun, tagged exists|build|decision)
DEPENDENCIES:
HUMAN IN LOOP AT:

WALKING SKELETON
  scope | path | output | demo moment | timebox
  deliberately deferred, and why:

RISKS (risk | impact | cheapest early signal)
STAGING: week 1 | weeks 2-4 | phase two (not committed)
```

Run it cold, on a timer, once a week from week eight of this path. The drill bank in the practice phase exists to give you twelve problems to run it against, each with a rubric. The first three times you will overrun stage 4 and never reach the skeleton. That is the normal failure and the timer is what fixes it.
