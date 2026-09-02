---
title: "Bootcamp 06: a district administration (grievances, on-prem)"
phase: practice
module: simulated-customers
kind: bootcamp
summary: A fictional Indian district administration has the worst grievance closure record in its division, a divisional review in three weeks, and a data centre with no internet access at all. Three days, an air-gapped VM, RTI exposure on every record you touch, and a demo that has to work without a single external call.
duration: 3 days
updated: "2026-09-02"
outcomes:
  - Reconcile grievance records across a state portal, a call centre log and paper registers from twelve taluka offices whose ids and categories disagree.
  - Produce a prioritised grievance queue, built entirely offline, that adds a flag without ever mutating a source record.
  - Write a one-page decision memo that recommends one build, declines at least one tempting one, and states a falsifier.
artifact: A `bootcamps/06-bhairavgarh/` folder with the generated pack, a reconciliation script, the working queue, a recorded demo, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
---

The Bhairavgarh district administration is fictional. So is every person named in this brief. The data pack you generate is synthetic. Say so in your repository README.

## The company and the situation

Bhairavgarh is a fictional district administration in India, handling citizen grievances across the revenue, water-supply, public distribution and land-records departments, filed through a state grievance portal, a helpline, and paper applications submitted at the collectorate window and at twelve taluka offices.

The state's grievance monitoring cell has flagged Bhairavgarh for the worst "closed without resolution" rate in its division: grievances marked "Closed" in the portal at a high rate, but a spot check found many were closed with no actual outcome recorded for the applicant. The District Collector faces a review in front of the divisional commissioner in three weeks. Separately, Right to Information applications about grievance handling have spiked in the district this year, which makes closure records themselves a matter of public accountability: whatever you build must never quietly close a grievance or overwrite the record of how it was actually resolved, because that record is disclosable under RTI and an altered one is a worse problem than a slow one.

The state data centre where citizen data lives is air-gapped: no internet access from the VM you work on, at all, not a restricted allowlist, none. Any tool, library or model weight has to be pre-staged and brought in through an approved offline transfer, logged and scanned by the state IT cadre.

You have three days on site at the collectorate, with a call to a taluka office on Day 2.

## The cast

| Person | Role | Wants | Fears |
|---|---|---|---|
| Ramesh Chaudhary | District Collector, project sponsor | The closed-without-resolution rate down and defensible before the divisional review | A media story about grievances being closed without being resolved |
| Sunita Yadav | Grievance Cell in-charge | A prioritised queue by department and age that she can explain to a citizen who calls back | Being handed a "smart" system that reclassifies grievances in ways she cannot justify |
| Anil Kumar Meena | Taluka-level revenue officer, representing the twelve field offices | Fewer duplicate follow-ups for the same grievance filed at both the portal and his window | More paperwork pushed onto an office that already has none to spare |
| Deepa Solanki | IT Nodal Officer, state cadre | Nothing that needs internet access, ever, inside the state data centre | Being the one who has to explain a security lapse to the state cell |
| Prakash Divekar | Divisional Commissioner's office liaison | A report he can present upward that shows real improvement, not a relabelled number | Having championed the tech fix and having Bhairavgarh's numbers not move |

What each of them says, in the first meeting:

**Chaudhary:** "Main divisional review mein number nahi, ek sach batana chahta hoon — kitne grievance sach mein resolve hue hain, kitne sirf close kiye gaye hain."

**Yadav:** "If your system tells me a grievance is 'resolved' and I call the applicant and they say nobody ever contacted them, I am the one who looks like a liar on that call, not your system."

**Meena:** "Same complaint, filed at my window and again on the portal by the same person two weeks later because they never heard back. Head office counts that as two grievances and blames my office for both."

**Solanki:** "Yeh VM se ek bhi packet bahar nahi jaayega, internet toh door ki baat hai. Jo bhi chahiye, USB se laao, mujhe check karne do, tab install hoga."

**Divekar:** "I put my name behind pushing for a tech solution here. If the divisional commissioner sees the same 'closed' number dressed up differently, that is worse for me than if we had done nothing."

Hold the conflict: Chaudhary wants the honest number even if it looks worse first, Yadav will reject anything she cannot defend to a citizen on the phone, Meena's real problem is duplicate grievances nobody in head office has named, Solanki will block anything that assumes network access, and Divekar needs genuine improvement, not a relabelled dashboard. A build that satisfies four of the five is a failed bootcamp.

## What you are handed

Three exports and a folder, transferred to the air-gapped VM by approved USB on the morning of Day 1.

- `portal_grievances.csv`, the state portal's grievance register: id, department, category, filed date, channel, status, closure remark, closure date.
- `department_sla.csv`, the state-mandated resolution window in days per category.
- `callcentre_log.csv`, helpline call records that reference a grievance, often imprecisely.
- `ocr/`, thirty text files: scanned taluka paper register entries, digitised weekly.

## How the data lies

Find these yourself on Day 1. This list is the answer key; read it on Day 2 to see what you missed.

- **Status hides the truth, the remark holds it.** The portal's `status` field has only two values, Open and Closed. The real disposition, resolved, referred elsewhere, closed for no contact, closed as a duplicate, lives only in the free-text `closure_remark`. Reading "Closed" as "resolved" is exactly the error the divisional monitoring cell caught Bhairavgarh making.
- **Taluka ids that never reach the portal.** A grievance filed on paper at a taluka window gets a local taluka-prefixed id first. It only receives a portal id when a clerk re-keys it, sometimes days later, sometimes not at all if it was resolved locally before re-keying. Any count based on the portal alone undercounts what actually happened at the windows.
- **The same grievance, keyed twice.** Two different taluka clerks, each unaware the other had already entered a paper grievance, occasionally re-key the same one under two different ids. A naive count treats them as two open matters.
- **A category crosswalk with a hole in it.** A mid-year state circular renamed several grievance categories. About a fifth of historical rows still carry an old category code, and `department_sla.csv` has no row for it: the honest answer for those rows is "cannot compute an SLA," not a guess.
- **Misheard taluka names on the helpline.** Callers describe where they filed a grievance, and the call operator transcribes what they heard, which is not always what was said. Fuzzy-matching taluka names against the register carries a real risk of matching the wrong grievance, not just missing the right one.
- **OCR damage, and a column you should not try to solve this week.** The scanned taluka registers carry the usual character-level damage in their English fields. The applicant-name field in the regional script is present in the physical registers but is deliberately out of scope for this bootcamp's synthetic pack: know what you are not going to solve, and say so, rather than mangling it with an untested pipeline.

## The constraints

- **Fully air-gapped, no exceptions.** Nothing on the VM reaches the internet, at any point, for any reason. Every dependency has to already be on the VM or arrive by the offline transfer process before you can use it.
- **No auto-closure, ever.** Whatever queue you build prioritises and flags; it must never change a grievance's status or overwrite its closure remark. The source record is the record; your output is an addition, never a mutation.
- **RTI exposure.** Closure records, once created, can be requested under the Right to Information Act. A field you derive has to be clearly labelled as derived, separate from the original record, so an RTI response is never ambiguous about which is which.
- **State identity gates access.** The state's own single sign-on directory controls who can use anything on the VM; Solanki's office approves accounts, which adds lead time you should ask for on Day 1.
- **Register.** Conversations with the Collector's office and the taluka officers run in Hinglish; the written report for the divisional commissioner's office is in formal English.

## Generate the data pack

Save this as `bhairavgarh_pack.py` and run it with `python bhairavgarh_pack.py` on the air-gapped VM itself, or anywhere, since it needs no network. Standard library only, fixed seed, same output every time.

```python
"""Bhairavgarh district administration: synthetic data pack. Fictional, fake data."""
import csv, random
from datetime import date, timedelta
from pathlib import Path

rng = random.Random(20260420)
OUT = Path("bhairavgarh_pack")
OUT.mkdir(exist_ok=True)

DEPTS = ["REVENUE", "WATER-SUPPLY", "PDS-RATION", "LAND-RECORDS"]
TALUKAS = ["Ambegaon", "Junnar", "Khed", "Shirur", "Velhe"]
OLD_CATS = {"REVENUE": "REV-GEN", "LAND-RECORDS": "LR-GEN"}
NEW_CATS = {"REVENUE": ["REV-MUTATION", "REV-CASTE-CERT"],
            "LAND-RECORDS": ["LR-SURVEY", "LR-RECORD-COPY"]}
REMARKS = {
    "resolved": "Grievance resolved, applicant informed.",
    "referred": "Referred to concerned department.",
    "no_contact": "Closed - could not contact applicant.",
    "duplicate": "Closed - duplicate of an earlier grievance.",
}

def a_date(lo, hi):
    return date(2026, 1, 1) + timedelta(days=rng.randint(lo, hi))

grievances = []
for i in range(700):
    dept = rng.choice(DEPTS)
    taluka = rng.choice(TALUKAS)
    filed = a_date(0, 200)
    filed_paper = rng.random() < 0.4
    if dept in OLD_CATS and rng.random() < 0.2:
        category = OLD_CATS[dept]  # renamed category, no crosswalk row will exist
    elif dept in NEW_CATS:
        category = rng.choice(NEW_CATS[dept])
    else:
        category = dept
    closed = rng.random() < 0.6
    outcome = rng.choice(list(REMARKS)) if closed else None
    grievances.append({
        # paper grievances not yet re-keyed carry a taluka-prefixed id instead of a portal one
        "grievance_id": (f"{taluka[:3].upper()}-{2000+i}" if filed_paper and rng.random() < 0.3
                          else f"GRV{300000+i:06d}"),
        "department": dept,
        "category": category,
        "filed_at": filed.isoformat(),
        "filed_via": "TALUKA-WINDOW" if filed_paper else "PORTAL",
        "status": "Closed" if closed else "Open",
        "closure_remark": REMARKS[outcome] if outcome else "",
        "closed_at": (filed + timedelta(days=rng.randint(1, 60))).isoformat() if closed else "",
    })

# two clerks occasionally re-key the same paper grievance under two different ids
paper = [g for g in grievances if g["filed_via"] == "TALUKA-WINDOW"]
for g in rng.sample(paper, 15):
    dup = dict(g)
    dup["grievance_id"] = g["grievance_id"] + "-DUP"
    grievances.append(dup)

with open(OUT / "portal_grievances.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(grievances[0]))
    w.writeheader()
    w.writerows(grievances)

with open(OUT / "department_sla.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["category", "sla_days"])
    for dept in DEPTS:
        for c in NEW_CATS.get(dept, [dept]):
            w.writerow([c, rng.choice([15, 21, 30])])
    # OLD_CATS rows are deliberately absent here: no crosswalk exists for them

MISHEAR = {"Ambegaon": "Ambegao", "Junnar": "Junner", "Khed": "Khedh",
           "Shirur": "Shirurr", "Velhe": "Velha"}
with open(OUT / "callcentre_log.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["call_id", "mentioned_taluka", "mentioned_id_fragment", "logged_at"])
    for i, g in enumerate(rng.sample(grievances, 220)):
        taluka_guess = rng.choice(list(MISHEAR.values())) if rng.random() < 0.3 else g["grievance_id"][:3]
        frag = g["grievance_id"][-4:] if rng.random() < 0.6 else g["grievance_id"][:5]
        w.writerow([f"CALL{i:05d}", taluka_guess, frag, a_date(0, 210).isoformat()])

ocr = OUT / "ocr"
ocr.mkdir(exist_ok=True)
SUB = {"0": "O", "1": "l", "5": "S", "8": "B"}
for n, g in enumerate(rng.sample(paper, 30)):
    text = (f"TALUKA REGISTER ENTRY\nID: {g['grievance_id']}\nDept: {g['department']}\n"
            f"Filed: {g['filed_at']}\nApplicant name: [regional-script, not transcribed]\n")
    damaged = "".join(SUB.get(c, c) if rng.random() < 0.1 else c for c in text)
    (ocr / f"register_{n:03d}.txt").write_text(damaged, encoding="utf-8")

print("wrote", len(grievances), "grievances to", OUT.resolve())
```

## The plan, day by day

**Day 0, the evening before.** Read the cast. Write five index cards. Write down, before you see any data, what fraction of "Closed" grievances you think were actually resolved, and why.

**Day 1: connect the data and scope it, entirely offline.** Load all three sources plus the OCR folder on the air-gapped VM; nothing you use can require a fetch. By end of day: a written ontology (Grievance, Taluka, Department, SLAWindow), the status-versus-remark gap named and documented, and Yadav's sign-off on what "genuinely resolved" means when the two disagree.

**Day 2: make the number real, with a taluka office on the call.** Compute the true resolved rate using the closure remark rather than the status field, and quantify the duplicate and taluka-id-lag problems using department counts. Confirm with Meena, on the call, that the duplicate pattern matches what he sees at his window.

**Day 3: build the queue, demo, and decide.** Given the short window, the build, demo and memo happen the same day. The queue prioritises by department, category and true age, flags anything with an uncomputable SLA due to the crosswalk gap rather than guessing, and never writes back to a source record.

## The demo

Order matters more than content.

1. **Yadav and the grievance cell team, twenty minutes.** They triage a real day's queue live, and you show them exactly why each item is ranked where it is.
2. **Meena, by phone, fifteen minutes.** Show the deduplicated view of grievances filed at both his window and the portal, and confirm it matches what he already knows.
3. **Chaudhary and Divekar, twenty-five minutes.** Open with the honest resolved-versus-closed number, even though it is worse than the portal's headline figure, and show that nothing in the build alters a source record.

If the honest number in step three is worse than what Divekar hoped to present upward, do not soften it for the room. That number, delivered straight, is the actual deliverable of the week.

## The decision memo

One page. Fill this in and put it in the repository.

```text
TO: R. Chaudhary (District Collector), P. Divekar (Divisional Liaison), D. Solanki (IT Nodal)
FROM: [you]
RE: Grievance closure and resolution — recommendation after the three-day bootcamp
DATE:

1. THE NUMBER. Of grievances marked Closed, ___ percent show a resolved outcome
   in the closure remark; the rest are referred, unresolved contact attempts, or
   duplicates. This differs from the portal's headline rate because: (a) ...
   (b) ... (c) ...

2. RECOMMENDATION. Build ___. It surfaces the true backlog without altering a
   single source record, on these assumptions: ...

3. WHAT I AM NOT BUILDING, AND WHY.
   - Automatic closure or reclassification of any grievance: rejected. The tool
     flags and prioritises only; changing a record is a human, auditable act.
   - ...

4. WHAT IT COSTS. Effort: ___. Runs on: ___. Owned after handover by: ___.

5. WHAT WOULD MAKE ME WRONG. If ___, this approach fails and the alternative
   is ___. We would know by [date] because [observable signal].

6. DEPENDENCIES ON YOU. Offline package transfer approved by Solanki by ___.
   Category crosswalk for the renamed codes supplied by state cell by ___.
   Sign-off on the "genuinely resolved" definition by Yadav by ___.
```

## Rubric

Score each out of 5, and treat the marked line below as a hard fail regardless of the other five scores.

| Dimension | What a 5 looks like |
|---|---|
| Discovery | You found the status-versus-remark gap and the taluka-id lag by reading closure remarks and asking Meena, not by reading the generator. |
| Ontology | Written before any transformation. Names the category crosswalk gap and states, for those rows, that no SLA can be computed rather than guessing one. |
| Reconciliation | You can explain the gap between the portal's Closed rate and the true resolved rate in three sentences to a non-technical sponsor. |
| Constraint handling | Everything you built runs with zero network access and was tested that way. **Any write path that mutates or overwrites a source record, including a status change, is an automatic fail on this bootcamp, whatever the other scores are.** |
| Adoption | Yadav's team triaged a real day's backlog unaided using the queue, and it matched what they already knew from the phones. |
| The memo | Recommends one thing, declines auto-closure explicitly, and states a falsifier with a date. |

## How this could go wrong

**You trust the status field.** It is exactly what the divisional monitoring cell already caught the district doing. Reading Closed as resolved reproduces the problem you were sent to fix.

**You auto-close stale grievances to improve the number.** It looks like progress and is the single fastest way to turn this into the RTI story everyone is trying to avoid.

**You assume a network you do not have.** Any library, model or lookup that expects to fetch something will simply fail on the actual VM. Test offline from Day 1, not Day 3.

**You soften the number for the room.** Divekar's fear is a relabelled dashboard, not a hard truth. Bring the hard truth.
