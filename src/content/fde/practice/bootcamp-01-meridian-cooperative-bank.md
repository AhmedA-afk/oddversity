---
title: "Bootcamp 01: Meridian Co-operative Bank (KYC backlog)"
phase: practice
module: simulated-customers
kind: bootcamp
summary: A fictional urban co-operative bank has forty thousand accounts overdue for periodic KYC updation and an inspection in nine weeks. Five days, an on-prem core banking system nobody will let you query, three exports that disagree with each other, and a demo to the branch staff who actually make the calls.
duration: 5 days
updated: "2026-09-02"
outcomes:
  - Reconcile three exports whose identifiers, date formats and clocks disagree, and write down which one is authoritative for what.
  - Produce a prioritised, deduplicated, reachable call list that a branch officer will use without being told to.
  - Write a one-page decision memo that recommends one thing and names what you are declining to build.
artifact: A `bootcamps/01-meridian/` folder with the generated pack, a reconciliation notebook or script, the working call-list app, a recorded demo, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
---

Meridian Co-operative Bank is fictional. So is every person in this brief. The data pack you generate is synthetic. Say so in your repository README.

## The company and the situation

Meridian is an urban co-operative bank with 41 branches across two states, about 1.1 million accounts, and roughly 2,400 staff. It is member-owned, which matters more than it sounds: the board is elected by depositors, and depositors read the local newspaper.

The regulator requires periodic KYC updation on existing accounts on a risk-based cycle. Meridian is behind. The compliance team's own count, which nobody fully trusts, is that about 40,000 accounts are overdue, of which around 6,800 have already been moved to a restricted status that stops outward transactions. Each restricted account generates roughly one branch visit and two phone calls, and a subset generate a written complaint.

The forcing function is an inspection scheduled in nine weeks. The chief operating officer wants the restricted-account number below 4,000 before the inspectors arrive. Nobody has agreed on what "overdue" means in the data, and three systems each hold a different answer.

You have five days on site. There is a projector, a whiteboard, a guest wifi network that drops every twenty minutes, and a laptop-sized VM on the internal network that IT will grant you on Day 1 if the paperwork clears.

## The cast

| Person | Role | Wants | Fears |
|---|---|---|---|
| Rukmini Deshpande | Chief Operating Officer, project sponsor | The restricted-account count under 4,000 before the inspection | An adverse note in the inspection report that reaches the board |
| Vivek Raghunathan | Head of Compliance | A defensible audit trail for every KYC decision | Being asked, two years from now, who signed off on an automated verification |
| Priyanka Nair | IT Manager, core banking | Nothing new touching the production core banking instance | The vendor voiding support and her being the reason |
| Aslam Sheikh | Branch Manager, Chandanwadi branch | Fewer pointless phone calls; a list that is actually callable | Head office using the new numbers to rank branches |
| Meena Bhosale | Tele-calling team lead, head office | A daily list her six callers can finish | Being handed 40,000 rows and told to start |

What each of them says, in the first meeting:

**Deshpande:** "I do not need a dashboard. I need the restricted-account number below four thousand before the inspection, and I need to be able to say how it got there."

**Raghunathan:** "If a machine marks a document as verified, tell me who signs for it. Not the model. A person, with an employee code."

**Nair:** "Read replica, refreshed nightly, or nothing. Our contract with the core banking vendor says any direct query against the production instance ends support, and I am not testing that."

**Sheikh:** "Every list you send me is the same list from last month with the dead numbers still in it. My officer called forty people yesterday. Eleven picked up. Four had already submitted documents at the branch."

**Bhosale:** "Give me two hundred names a day that are worth calling and I will call them. Give me forty thousand and I will call the ones at the top of the sheet forever."

Note the conflict you have to hold: Deshpande wants a number to move, Raghunathan wants nobody to move it automatically, Nair will not let you near the system where the number lives, and Sheikh and Bhosale will simply not use anything that wastes their calls. A solution that satisfies four of the five is a failed bootcamp.

## What you are handed

Three exports and a folder, delivered on a USB drive on the morning of Day 1.

- `cbs_accounts.csv`, a nightly extract from the core banking system. Account, customer, branch, dates, risk category, status.
- `branch_tracker.csv`, the consolidated version of the spreadsheets branches keep on their own machines. Contact attempts and free-text notes.
- `doc_store_index.csv`, the index of the scanned-document repository. Which document images exist against which account.
- `ocr/`, forty text files. The bank scanned a sample of address proofs and ran OCR so you would not need the image viewer. The scans themselves are on a share you do not have access to yet.

## How the data lies

Find these yourself on Day 1. This list is the answer key; read it on Day 2 to see what you missed.

- **The placeholder customer.** Branches that could not find an existing customer record used `CUST000000` at account opening. It appears on roughly one account in twelve, and those accounts are not the same person. Any naive deduplication by customer id collapses hundreds of unrelated depositors into one.
- **Two date formats.** Two branches export `kyc_last_done` as day-month-year; the rest use ISO. A parser that guesses will silently read the fifth of March as the third of May for part of the year.
- **A column that means two things.** In some branches `kyc_last_done` is the date the customer's document was uploaded. In others it is the date the branch officer signed the verification. Those can be six weeks apart. The only way to tell which convention a branch uses is to compare against the document store's upload timestamps, and the difference changes who is genuinely overdue.
- **Two clocks.** The core banking extract carries naive local dates with no offset. The document store writes UTC with a trailing Z. Documents uploaded after half past six in the evening local time appear to belong to the next day, or the previous one, depending on which direction you convert.
- **An encoding that breaks a naive read.** `branch_tracker.csv` came out of a desktop spreadsheet and is encoded in Windows-1252, with curly apostrophes and dashes. Reading it as UTF-8 raises a decode error partway through. Reading it with errors ignored quietly corrupts the notes you were going to mine.
- **Free-text status.** `risk_category` holds seven spellings of three values. `status` has a trailing space on some rows.
- **Phone numbers in three shapes.** Bare ten digits, a country code, and a leading zero with a space. Deduplicating call attempts by number fails until you normalise.
- **OCR damage.** Zero and capital O, one and lowercase l, five and S are interchanged at random through the scanned address proofs, including inside account numbers.

## The constraints

- **Residency and on-prem.** Customer data does not leave the bank's network or the country. The Digital Personal Data Protection Act, 2023 governs the personal data, and the bank's own board policy is stricter than the law. No hosted model API unless the board approves a data-sharing note, which will not happen this week.
- **The vendor clause.** No queries against the production core banking instance. You get nightly extracts or a read replica, and the replica needs a change request.
- **Identity.** Anything with a login uses the bank's on-prem directory over LDAP. There is no cloud identity provider. Branch staff share a workstation in practice, which affects what "who signed off" means.
- **Security review.** Anything that will still be running after you leave goes through an internal information-security review. Ask for the questionnaire on Day 1, not Day 5.
- **Language.** The steering committee runs in Hinglish. Your slides can be in English; your explanations will not be. Practise saying "we are not automating the approval, we are only ordering the queue" in the register the room actually uses.
- **The deadline is external.** The inspection date does not move because your build slipped.

## Generate the data pack

Save this as `meridian_pack.py` and run it with `python meridian_pack.py`. Standard library only, fixed seed, same output every time.

```python
"""Meridian Co-operative Bank: synthetic data pack. Fictional bank, fake data."""
import csv, random
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

rng = random.Random(20260401)
OUT = Path("meridian_pack")
OUT.mkdir(exist_ok=True)

BRANCH = ["MCB001", "MCB004", "MCB011", "MCB017", "MCB023"]
FIRST = ["Aslam", "Meena", "Rukmini", "Vivek", "Priyanka", "Farida", "Ganesh", "Sandeep"]
LAST = ["Sheikh", "Bhosale", "Deshpande", "Nair", "Pathan", "Jadhav", "Kulkarni"]
EPOCH = date(2019, 1, 1)

def a_date(lo, hi):
    return EPOCH + timedelta(days=rng.randint(lo, hi))

rows = []
for i in range(600):
    br = rng.choice(BRANCH)
    kyc = a_date(400, 2400)
    rows.append({
        "account_id": f"AC{700000 + i}",
        # branches that could not find the customer used a placeholder id
        "customer_id": "CUST000000" if rng.random() < 0.08 else f"CUST{100000 + i:06d}",
        "customer_name": f"{rng.choice(FIRST)} {rng.choice(LAST)}",
        "branch_code": br,
        "opened_on": a_date(0, 1800).isoformat(),
        # two branches export day-month-year; the rest export ISO
        "kyc_last_done": kyc.strftime("%d-%m-%Y") if br in ("MCB011", "MCB023") else kyc.isoformat(),
        "risk_category": rng.choice(["H", "HIGH", "High", "M", "Medium", "L", "LOW"]),
        "status": rng.choice(["ACTIVE"] * 6 + ["FROZEN", "Frozen ", "DORMANT"]),
        "mobile": rng.choice(["9", "+919", "0 9"]) + str(rng.randint(10**8, 10**9 - 1)),
    })

with open(OUT / "cbs_accounts.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)

# the branch spreadsheet came out of a desktop editor in Windows-1252
NOTES = ["Customer’s number not reachable", "Told to visit branch – did not come",
         "Documents given, officer’s sign pending", "Wrong number — relative picked up"]
with open(OUT / "branch_tracker.csv", "w", encoding="cp1252", newline="") as f:
    w = csv.writer(f)
    w.writerow(["branch_code", "account_id", "last_contact", "note"])
    for r in rng.sample(rows, 180):
        w.writerow([r["branch_code"], r["account_id"],
                    a_date(2300, 2450).strftime("%d/%m/%Y"), rng.choice(NOTES)])

# the document store stamps UTC; the core banking extract has no offset at all
with open(OUT / "doc_store_index.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["doc_id", "account_id", "doc_type", "uploaded_at_utc"])
    for n, r in enumerate(rng.sample(rows, 320)):
        ts = datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(minutes=rng.randint(0, 200000))
        w.writerow([f"DOC{n:05d}", r["account_id"],
                    rng.choice(["ADDR_PROOF", "ID_PROOF", "PHOTO", "FORM60"]),
                    ts.strftime("%Y-%m-%dT%H:%M:%SZ")])

ocr = OUT / "ocr"
ocr.mkdir(exist_ok=True)
SUB = {"0": "O", "1": "l", "5": "S", "8": "B"}
for n, r in enumerate(rng.sample(rows, 40)):
    text = ("MERIDIAN CO-OPERATIVE BANK\nADDRESS PROOF (SELF ATTESTED)\n"
            f"Account: {r['account_id']}\nName: {r['customer_name']}\n"
            f"Plot {rng.randint(1, 90)}, {rng.choice(['Chandanwadi', 'Nehru Marg', 'Station Road'])}\n"
            f"PIN: {rng.randint(400001, 440000)}\nVerified by: ____________\n")
    damaged = "".join(SUB.get(c, c) if rng.random() < 0.12 else c for c in text)
    (ocr / f"scan_{n:03d}.txt").write_text(damaged, encoding="utf-8")

print("wrote", len(rows), "accounts to", OUT.resolve())
```

## The plan, day by day

**Day 0, the evening before.** Read the cast. Write the five index cards. Write down, before you see any data, the three numbers you think matter and how you would compute each. Keep that page; compare it on Day 5.

**Day 1: connect the data and name the entities.** Load all four sources. Break on the encoding, fix it properly rather than by ignoring errors. By the end of the day you should have a written ontology: Customer, Account, Branch, Document, ContactAttempt, with the key you will join on and a one-line note on why each join is unreliable. Also by the end of Day 1: the security questionnaire in your hands, and an agreed definition of "overdue" signed off verbally by Raghunathan. That definition is the deliverable, not the code.

**Day 2: make the number real.** Produce the count of genuinely overdue and genuinely restricted accounts under the agreed definition, with the reconciliation shown: here is the compliance team's 40,000, here is what falls out when the placeholder customer id is handled, here is the effect of the two date formats. Expect the real number to differ from every number in the room. Take the difference to Deshpande privately, before the steering committee, not during it.

**Day 3: build the walking skeleton.** A daily call list. Two hundred rows, ranked, with a reason for the rank, the normalised phone number, what document is missing, and whether the branch already has it. It runs against the nightly extract. It writes a call outcome back to a small table you own, not to the core banking system. Put it in front of Bhosale on Day 3 afternoon, in draft, and watch her use it without helping her.

**Day 4: close the audit loop, then rehearse.** Every entry the officer marks as verified records an employee code, a timestamp and the document id. Nothing is auto-verified. Show Raghunathan the audit table before you show anyone the app. Then rehearse the demo twice, once with the wifi off.

**Day 5: demo and decide.** Demo in the morning, memo in the afternoon, handover note before you leave the building.

## The demo

Order matters more than content.

1. **Bhosale and two callers, at their desks, thirty minutes.** They drive. You do not touch the keyboard. Write down every place they hesitate.
2. **Sheikh and two branch managers, by phone, twenty minutes.** Show them the branch view and the fact that documents already collected at the branch drop off the list within a day.
3. **The steering committee, forty minutes.** Deshpande, Raghunathan, Nair. Open with the reconciled number and how it was derived, not with the app. Show the audit trail before the ranking. Show the app last, running on the internal VM.

If the callers in step one would not use it, do not proceed to step three with the same build. Say that out loud in the room. Declining to demo a thing you know is not ready is a scoreable behaviour.

## The decision memo

One page. Fill this in and put it in the repository.

```text
TO: R. Deshpande (COO), V. Raghunathan (Compliance), P. Nair (IT)
FROM: [you]
RE: KYC updation backlog — recommendation after the five-day bootcamp
DATE:

1. THE NUMBER. Under the definition agreed on Day 1, ___ accounts are overdue
   and ___ are restricted. This differs from the ___ previously reported
   because: (a) ... (b) ... (c) ...

2. RECOMMENDATION. Build ___. It moves the restricted count to an estimated
   ___ by [inspection date], on these assumptions: ...

3. WHAT I AM NOT BUILDING, AND WHY.
   - Automated document verification: rejected. Compliance requires a named
     signer; the OCR error rate on account numbers alone is ___ per cent.
   - ...

4. WHAT IT COSTS. Effort: ___. Runs on: ___. Owned after handover by: ___.

5. WHAT WOULD MAKE ME WRONG. If ___, this approach fails and the alternative
   is ___. We would know by [date] because [observable signal].

6. DEPENDENCIES ON YOU. Read replica change request by ___. Security review
   slot by ___. Employee codes for the audit table by ___.
```

## Rubric

Score each out of 5. Under 21 out of 30, run it again with the same pack and different choices.

| Dimension | What a 5 looks like |
|---|---|
| Discovery | You found the placeholder customer id and the two meanings of `kyc_last_done` by asking, not by reading the generator. Your log shows the question and who answered it. |
| Ontology | Written before any transformation. Names the join that does not work and says what you did instead. |
| Reconciliation | You can explain the gap between 40,000 and your number in three sentences to a non-technical sponsor, with the arithmetic on one slide. |
| Constraint handling | Nothing you built violates the vendor clause, residency, or the audit requirement. You asked for the security questionnaire on Day 1. |
| Adoption | A caller used the list unaided on Day 3 and again on Day 5. You recorded where they hesitated and changed something. |
| The memo | Recommends one thing, declines at least one thing explicitly, and states a falsifier with a date. |

## How this could go wrong

**You build the dashboard.** Deshpande asked for a number, not a chart, and said so. A dashboard is what you build when you have not decided anything.

**You accept 40,000 as the number.** Every one of these bootcamps has a number that everyone repeats and nobody has recomputed. Recomputing it is often the entire value of week one.

**You auto-verify.** The OCR is bad, the placeholder ids collapse identities, and the compliance officer told you the rule in the first meeting. A model that reads an address proof and marks it verified is the one build that can end the engagement.

**You never leave the meeting room.** The callers are on a different floor. Go there on Day 1.
