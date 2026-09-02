---
title: "Bootcamp 04: Northlake Wealth, US (advisor research)"
phase: practice
module: simulated-customers
kind: bootcamp
summary: A fictional US wealth management firm cannot get its financial advisors to cite current, approved research in client conversations, because nobody can tell a current note from a superseded one fast enough, and a supervisory audit is ten weeks out. Five days, strict entitlements, a security review, and a demo that has to survive Compliance watching the same screen as the advisor.
duration: 5 days
updated: "2026-09-02"
outcomes:
  - Reconcile a research-note catalogue, an advisor directory and a citation log whose approval history, entitlement codes and coverage all disagree with each other.
  - Produce a citation tool, scoped to one advisor's actual entitlements, that always resolves to the currently approved version of a note.
  - Write a one-page decision memo that recommends one build, declines at least one tempting one, and states a falsifier.
artifact: A `bootcamps/04-northlake/` folder with the generated pack, a reconciliation script, the working citation tool, a recorded demo, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
---

Northlake Wealth Management is fictional. So is every person in this brief. The data pack you generate is synthetic. Say so in your repository README.

## The company and the situation

Northlake Wealth Management is a mid-size US registered investment advisor and broker-dealer serving high-net-worth clients, with about 450 financial advisors across four regions and a research desk at its Chicago home office. Advisors are supposed to bring the firm's own research into client conversations: sector outlooks, model portfolios, single-name notes. In practice, most don't, because finding the current version of anything and knowing it is safe to cite takes longer than the three minutes an advisor has before a call.

The compliance rule that makes this expensive to get wrong: any research an advisor cites to a client has to be a currently approved, supervised version. Citing a draft, a superseded note, or a retracted one is a reportable supervisory failure. The firm's Office of Supervisory Jurisdiction audit is scheduled in ten weeks, and separately the Chief Investment Officer has set a target for advisors to triple how often they cite current research in client meetings this quarter. A previous attempt at an internal research search tool was built and quietly abandoned; nobody trusted its "current" flag, so nobody used it.

You have five days, working from Northlake's Chicago office with a branch visit call to a regional office on Day 3.

## The cast

| Person | Role | Wants | Fears |
|---|---|---|---|
| Karen Whitfield | Head of Advisor Enablement, project sponsor | Advisors measurably using research in client conversations | Shipping a second tool nobody opens, like the last one |
| Daniel Ferris | Chief Compliance Officer | Every citation traceable to a currently approved version, with an audit trail | A supervisory finding that an advisor cited a retracted note |
| Priya Chandrasekaran | Director of Research | Approved notes surfaced ahead of drafts, and visibility into what advisors actually read | Advisors citing an early draft that was pulled after review |
| Tom Reyes | Regional Branch Manager, representing advisors | Something usable inside the three minutes before a client call, on a locked-down laptop | Another "resource centre" that adds a step instead of removing one |
| Susan Okafor | IT Security Lead | Entitlements enforced at the data layer, behind the firm's existing SSO | Cross-account leakage between advisor teams' client data |

What each of them says, in the first meeting:

**Whitfield:** "I don't need another search bar. I need an advisor to open this thirty seconds before a call and trust what it shows them, every time."

**Ferris:** "If it shows an advisor a note that has since been superseded, and they cite it, that is a supervisory event with my name on the sign-off. Show me the audit trail before you show me the interface."

**Chandrasekaran:** "My team corrects notes constantly. If your tool can't tell a correction from the original, it will show advisors the wrong one and they will never know."

**Reyes:** "My laptop doesn't let me install anything, and I don't have three minutes to search. If it isn't faster than not using it, I won't use it, and neither will my team."

**Okafor:** "This goes through the security review like everything else that touches a client household, and it authenticates through Okta like everything else. No separate login, no local credential cache."

Hold the conflict: Whitfield wants adoption, Ferris wants an audit trail that will survive an examiner, Chandrasekaran wants her corrections respected, Reyes wants speed above all else, and Okafor wants entitlements enforced somewhere a determined advisor cannot route around. A build that satisfies four of the five is a failed bootcamp.

## What you are handed

Four exports and a folder, delivered through the firm's secure file transfer on the morning of Day 1.

- `research_notes_export.csv`, metadata for every research note: id, title, sector, status, who approved it and when, and which note it supersedes.
- `advisor_directory.csv`, advisor id, team, branch and entitlement code.
- `client_household_index.csv`, which client households are assigned to which advisor, used to scope entitlements.
- `citation_log.csv`, a partial log from the old intranet tool of which notes advisors opened.
- `ocr/`, thirty text files: scanned approval cover sheets for notes written before the metadata system existed.

## How the data lies

Find these yourself on Day 1. This list is the answer key; read it on Day 2 to see what you missed.

- **A backdated correction.** When Research corrects a note, the old content-management system sometimes stamps the correction's `approved_at` earlier than the original note's own approval time, a known bug nobody fixed. "Most recent `approved_at`" is not the same as "the current version," and a naive lookup returns the superseded one.
- **Dual entitlement codes.** After a 2025 team reorganisation, some advisors carry both their old and new entitlement codes, and the new code has not propagated to every household record. Trusting only the new code under-entitles some advisors; trusting only the old one over-entitles them into households that moved to someone else.
- **Opens counted as citations.** The old tool's log records when a note was opened, not when it was shown to a client. An advisor who opened a note in a background tab and never mentioned it shows up identically to one who cited it live. The log also has a clean six-week gap where the tool was down, which will look like a research desert in any chart that does not flag it.
- **Reused household ids.** When an account closes and reopens under a new advisor, the household id is recycled rather than retired. A naive join attributes a household's historical citations to whoever currently owns the id, not to who actually generated them.
- **Two id spaces.** Notes written before the CMS migration exist only as scanned cover sheets, and their numbering restarted from the beginning after the migration, colliding with ids the modern system later reused.
- **OCR damage.** Zero and capital O, one and lowercase l, five and S are interchanged at random through the scanned cover sheets.

## The constraints

- **Supervision.** Every note the tool resolves as "current" has to actually be the currently approved version, correctly handling the backdating bug, and every time a note is shown to be cited, that has to be recorded for Compliance to pull.
- **Entitlements enforced at the data layer.** An advisor should only ever see notes and household linkage for accounts assigned to them, checked in the query itself, not hidden by the interface and recoverable by editing a URL.
- **SSO, no exceptions.** The tool authenticates through Northlake's existing Okta directory. No separate login, no locally cached credentials; Okafor's review fails anything that adds either.
- **A formal security review.** Nothing reaches a real advisor's laptop, even as a pilot, before Okafor's team signs off on a security questionnaire.
- **No hosted model on real research content.** Northlake has no data-processing agreement in place for sending client-adjacent content to an external model API. Treat any plan that relies on one as a blocker to flag on Day 1, not something to quietly build around this week.

## Generate the data pack

Save this as `northlake_pack.py` and run it with `python northlake_pack.py`. Standard library only, fixed seed, same output every time.

```python
"""Northlake Wealth: synthetic data pack. Fictional advisory firm, fake data."""
import csv, random
from datetime import datetime, timedelta
from pathlib import Path

rng = random.Random(20260210)
OUT = Path("northlake_pack")
OUT.mkdir(exist_ok=True)

SECTORS = ["EQUITY-TECH", "EQUITY-HEALTH", "FIXED-INCOME", "MACRO", "MODEL-PORTFOLIO"]
TEAMS = ["MIDWEST-1", "MIDWEST-2", "NORTHEAST-1", "WEST-1"]
OLD_TEAMS = {"MIDWEST-1": "CENTRAL-A", "MIDWEST-2": "CENTRAL-B"}  # pre-reorg codes

def a_dt(lo, hi):
    return datetime(2026, 1, 1) + timedelta(hours=rng.randint(lo, hi))

notes = []
for i in range(260):
    sector = rng.choice(SECTORS)
    approved = a_dt(0, 5000)
    note = {
        "note_id": f"RN{4000+i:05d}",
        "title": f"{sector.title()} Outlook {rng.choice(['Q1', 'Q2', 'Q3'])}",
        "sector": sector,
        "status": "approved",
        "approved_by": rng.choice(["P. Chandrasekaran", "Research Desk"]),
        "approved_at": approved.isoformat(sep=" "),
        "supersedes_id": "",
    }
    notes.append(note)
    if rng.random() < 0.2:
        # the CMS backdating bug: a correction's own approved_at can predate
        # the original note's approval time
        corrected_at = approved - timedelta(hours=rng.randint(1, 48))
        notes.append({
            "note_id": f"RN{4000+i:05d}-R",
            "title": note["title"] + " (revised)",
            "sector": sector,
            "status": "approved",
            "approved_by": "P. Chandrasekaran",
            "approved_at": corrected_at.isoformat(sep=" "),
            "supersedes_id": note["note_id"],
        })
        note["status"] = "superseded"
    if rng.random() < 0.04:
        note["status"] = "retracted"

with open(OUT / "research_notes_export.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(notes[0]))
    w.writeheader()
    w.writerows(notes)

advisors = []
for i in range(180):
    team = rng.choice(TEAMS)
    dual = team in OLD_TEAMS and rng.random() < 0.3
    advisors.append({
        "advisor_id": f"ADV{5000+i:05d}",
        "name": f"Advisor {i:04d}",
        "team": team,
        "legacy_team": OLD_TEAMS.get(team, "") if dual else "",
        "branch": rng.choice(["CHI", "BOS", "NYC", "SFO"]),
    })
with open(OUT / "advisor_directory.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(advisors[0]))
    w.writeheader()
    w.writerows(advisors)

households = []
for i in range(300):
    households.append({
        "household_id": f"HH{9000 + (i % 260):05d}",  # deliberate id reuse on reopen
        "advisor_id": rng.choice(advisors)["advisor_id"],
        "assigned_at": a_dt(0, 5000).isoformat(sep=" "),
    })
with open(OUT / "client_household_index.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(households[0]))
    w.writeheader()
    w.writerows(households)

OUTAGE_START = datetime(2026, 3, 1)
OUTAGE_END = OUTAGE_START + timedelta(weeks=6)
with open(OUT / "citation_log.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["advisor_id", "note_id", "opened_at"])
    for _ in range(900):
        t = a_dt(0, 5000)
        if OUTAGE_START <= t <= OUTAGE_END:
            continue  # the old tool was down; absence here is not absence of interest
        w.writerow([rng.choice(advisors)["advisor_id"], rng.choice(notes)["note_id"],
                    t.isoformat(sep=" ")])

ocr = OUT / "ocr"
ocr.mkdir(exist_ok=True)
SUB = {"0": "O", "1": "l", "5": "S", "8": "B"}
for n in range(30):
    text = (f"NORTHLAKE WEALTH RESEARCH - APPROVAL COVER SHEET\n"
            f"Note ID: RN{n:05d}\nStatus: APPROVED\nApproved by: P. Chandrasekaran\n")
    damaged = "".join(SUB.get(c, c) if rng.random() < 0.1 else c for c in text)
    (ocr / f"cover_{n:03d}.txt").write_text(damaged, encoding="utf-8")

print("wrote", len(notes), "research notes to", OUT.resolve())
```

## The plan, day by day

**Day 0, the evening before.** Read the cast. Write five index cards. Write down, before you see any data, how you would define "the current approved version of a note" in one sentence, and why the obvious definition ("most recent approval timestamp") might be wrong. Keep the page.

**Day 1: connect the data and name the entities.** Load all four sources plus the OCR folder. By end of day: a written ontology (Note, ApprovalEvent, Advisor, EntitlementGroup, Household, CitationEvent), the backdated-correction bug found and documented, and Ferris's sign-off, in writing, on the correct resolution rule for "current."

**Day 2: quantify the current failure.** Using the corrected resolution rule, compute how many entries in the old citation log actually point to a note that was, at the time, already superseded, and how many entitlement lookups disagree between the old and new team codes. Take both numbers to Whitfield before the steering meeting.

**Day 3: build the walking skeleton, with a branch on the call.** A citation tool scoped to Reyes's entitlement group, correctly excluding households that moved to another advisor, resolving to the current version even where the backdating bug would mislead a naive query, and writing a citation record on every "show to client" action. Put it in front of Reyes and one advisor, live, on the call.

**Day 4: close the audit loop, then rehearse the security review.** Every citation event has to be pullable by note, by advisor, by date range. Walk through Okafor's questionnaire with the actual build in hand, not a description of it.

**Day 5: demo and decide.** Demo in the morning, memo in the afternoon, handover note before you leave.

## The demo

Order matters more than content.

1. **Reyes and two advisors, on the branch call, twenty-five minutes.** They search and cite live, inside a simulated three-minute window before a client call. You do not touch the keyboard.
2. **Chandrasekaran and the research desk, twenty minutes.** Confirm the tool never surfaces a superseded note as current, including one they corrected that week.
3. **Ferris and Okafor together, thirty minutes.** Compliance and Security see the same screen at the same time: the citation audit trail first, the entitlement scoping second, the interface last.

If the advisors in step one found it slower than not using it, do not proceed to step three claiming it is ready. Say so in the room.

## The decision memo

One page. Fill this in and put it in the repository.

```text
TO: K. Whitfield (Advisor Enablement), D. Ferris (Compliance), S. Okafor (IT Security)
FROM: [you]
RE: Advisor research access — recommendation after the five-day bootcamp
DATE:

1. THE NUMBER. Of the old tool's logged citations, ___ percent actually point to
   a version that was, at the time, already superseded. This happened because:
   (a) ... (b) ... (c) ...

2. RECOMMENDATION. Build ___. It resolves the current-version problem and the
   entitlement gap, on these assumptions: ...

3. WHAT I AM NOT BUILDING, AND WHY.
   - A hosted-model summariser over research content: rejected. No data-processing
     agreement exists yet for sending client-adjacent content to an external API.
   - ...

4. WHAT IT COSTS. Effort: ___. Runs on: ___. Owned after handover by: ___.

5. WHAT WOULD MAKE ME WRONG. If ___, this approach fails and the alternative
   is ___. We would know by [date] because [observable signal].

6. DEPENDENCIES ON YOU. Okta app registration by ___. Security review slot by
   ___. Written sign-off on the "current version" resolution rule by ___.
```

## Rubric

Score each out of 5. Under 21 out of 30, run it again with the same pack and different choices.

| Dimension | What a 5 looks like |
|---|---|
| Discovery | You found the backdating bug and the dual entitlement codes by asking, not by reading the generator. |
| Ontology | Written before any transformation. Names the entitlement join that can silently over- or under-scope an advisor, and what you did instead. |
| Reconciliation | You can explain, in three sentences to Ferris, why "most recent approval" is the wrong resolution rule and what the right one is. |
| Constraint handling | Nothing you built bypasses SSO, leaves entitlement checks to the interface alone, or sends research content to an external model without an agreement in place. |
| Adoption | An advisor used the tool live, inside a simulated three-minute window, without help. |
| The memo | Recommends one thing, declines at least one thing explicitly, and states a falsifier with a date. |

## How this could go wrong

**You resolve "current" by timestamp alone.** The backdating bug makes that wrong on a meaningful share of notes, and it is exactly the failure a supervisory audit is designed to catch.

**You hide entitlements in the UI.** Okafor's review will fail anything a determined advisor could route around by editing a request. Entitlement checks belong in the query.

**You build for the research desk, not the advisor.** A tool Priya's team loves and Reyes's team ignores solves the wrong half of the problem; adoption was the stated goal from the first meeting.

**You treat the missing DPA as an implementation detail.** Sending real research content to an external model without one is not a shortcut, it is the blocker Whitfield needs raised on Day 1, not discovered on Day 5.
