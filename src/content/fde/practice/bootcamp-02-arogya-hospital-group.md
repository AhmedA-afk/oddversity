---
title: "Bootcamp 02: Arogya Hospital Group (bed flow)"
phase: practice
module: simulated-customers
kind: bootcamp
summary: A fictional Indian hospital chain cannot tell how long a bed sits vacant after a patient is medically fit to leave, and an insurer contract renewal and an accreditation audit both land in the same eight weeks. Five days, patient data that never leaves the building, and a demo to the nursing station that has to actually use the thing.
duration: 5 days
updated: "2026-09-02"
outcomes:
  - Reconcile four hospital exports whose bed numbers, timestamps and "medically fit" definitions disagree, and write down which source is authoritative for what.
  - Produce a discharge-readiness queue a nursing station and a pharmacy team will both use without being told to.
  - Write a one-page decision memo that recommends one build, declines at least one tempting one, and states a falsifier.
artifact: A `bootcamps/02-arogya/` folder with the generated pack, a reconciliation script, the working discharge queue, a recorded demo, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
---

Arogya Hospital Group is fictional. So is every person in this brief. The data pack you generate is synthetic. Say so in your repository README.

## The company and the situation

Arogya Hospital Group runs six multi-specialty hospitals across Maharashtra. This bootcamp is set at the flagship, Arogya Central Hospital in Pune: 620 beds, roughly 340 patients on an average day, general medicine, surgery, cardiology and orthopaedics.

Bed occupancy has run near 96 percent through the monsoon dengue season. Ambulances have been diverted twice in the last month because no bed was free at the moment one was needed, even though a chart audit later showed several patients were medically fit to leave hours earlier and simply had not left. The gap between "a doctor decided this patient can go home" and "the bed is clean and free" is the whole problem, and nobody in the building can currently say how long that gap runs, on average or on any given day.

Two dates are forcing the conversation. The hospital's largest insurer TPA (third-party administrator) renews its contract in eight weeks, and the new draft ties the reimbursement rate to median discharge turnaround time. Two weeks after that, the hospital group's NABH accreditation surveillance visit is scheduled, and "time from medical fitness to bed release" is one of the metrics the surveyors ask for by name.

You have five days on site, an on-prem VM IT will provision on Day 1, and a whiteboard the nursing station is tired of you standing in front of.

## The cast

| Person | Role | Wants | Fears |
|---|---|---|---|
| Dr. Ananya Kulkarni | Medical Superintendent, project sponsor | Median fit-to-discharge time under four hours, from today's roughly nine | An adverse finding in the NABH report that reaches the trust board |
| Sister Grace Fernandes | Nursing Superintendent, owns the bed board | A bed status she can trust without walking the ward | More data entry pushed onto an already short-staffed night shift |
| Mahesh Iyer | IT Head | Nothing querying the HIS production database directly | The HIS vendor voiding support, and patient data reaching a cloud model |
| Dr. Ravi Deshmukh | Billing and TPA liaison | Insurance pre-authorisation delays visible so his team stops being blamed for them | Being shown to be the bottleneck when the real one is pharmacy |
| Farida Sheikh | Pharmacy in-charge, discharge medication | An orderable discharge queue instead of a scrum at eleven every morning | Two hundred pending discharge scripts landing on her desk at once, unranked |
| Suresh Rane | Trust board chairperson | One number for the insurer negotiation, no drama | The insurer numbers looking worse than the accreditation numbers, or vice versa |

What each of them says, in the first meeting:

**Kulkarni:** "I do not need a heat map of the wards. I need to know, today, how many hours a bed sits empty after my registrar has already signed the patient off, and why."

**Fernandes:** "My night shift has three nurses for eighty beds. If your system asks them to log one more field, they will stop logging it by the second week, and then you will have a system that lies faster than the one you replaced."

**Iyer:** "MediCore's contract is explicit: no direct queries against the production HIS. You get the nightly extract or you get nothing, and no patient record leaves this network for any model, cloud or otherwise."

**Deshmukh:** "Every time discharge is late, the ward blames my preauth desk. Half the time the patient is cash-pay and there was never a preauth to wait for. Show that, and stop showing a red flag on my desk for something I didn't cause."

**Sheikh:** "Doctors sign fitness in the morning round, but I don't see the medication order until whenever the clerk gets to typing it. By the time I dispense, the family has been waiting since nine."

**Rane, hinglish, opening the steering committee:** "Bas ek number chahiye jo TPA ko dikha sakoon aur NABH walon ko bhi. Do alag number mat lana mere paas — ek hi honi chahiye, aur wo defend hone wali honi chahiye."

Hold the conflict: Kulkarni wants a number that falls, Fernandes will reject anything that adds her staff's workload, Iyer will not let you near the live system, Deshmukh wants his desk cleared of blame that belongs elsewhere, and Sheikh needs the queue to arrive earlier than the doctor's clerk currently sends it. A build that satisfies four of the six is a failed bootcamp.

## What you are handed

Four exports, delivered on the hospital's own encrypted drive on the morning of Day 1.

- `his_admissions.csv`, the nightly HIS extract: patient, admission, ward, bed, attending doctor, the time a clerk flagged the patient medically fit, payer type.
- `bed_board_log.csv`, the nursing station's shift log of bed status changes.
- `pharmacy_discharge_queue.csv`, medication order and dispensing timestamps against a bed number.
- `tpa_preauth.csv`, insurance pre-authorisation request and clearance timestamps, present only for TPA patients.
- `ocr/`, forty-five text files: handwritten discharge notes, scanned and OCR'd, because the physical note is often the true record of when a doctor called a patient fit, ahead of the HIS entry.

## How the data lies

Find these yourself on Day 1. This list is the answer key; read it on Day 2 to see what you missed.

- **The backdated fitness flag.** The clerk who enters `medically_fit_flag_at` does it after morning rounds are over, and the field is stamped to when the round started, not when your specific patient was actually seen. The gap between the flag and the truth runs from twenty minutes to several hours, and the only corroborating record is the handwritten note.
- **A crosswalk the pharmacy never got.** Three wards were renumbered after a 2022 renovation. The HIS uses the new bed numbers. Pharmacy's system, on an older interface, still emits the old numbers for those same three wards on a meaningful share of rows. Join on bed number without the crosswalk and you silently mismatch a fifth of the discharge queue.
- **A placeholder patient.** Emergency admissions before registration completes use a shared `WALKIN-EMERGENCY` identifier. It appears on roughly one admission in fourteen, and those are not the same person. A naive join by patient id collapses them.
- **Two timestamp formats in one file.** The bed board is logged by three shifts on two different terminal configurations; some entries are day-month-year with a twelve-hour clock, others are ISO. A parser that assumes one format silently misorders a fraction of every shift's log.
- **Missing preauth that is not missing data.** Cash-pay patients have no row in `tpa_preauth.csv` at all, correctly. Treating an absent preauth as a stalled one produces a false bottleneck that will make Deshmukh's team look guilty of a delay it never caused.
- **OCR damage.** Zero and capital O, one and lowercase l, five and S are interchanged at random through the scanned discharge notes, including inside admission ids.

## The constraints

- **Patient data does not leave the network.** No hosted model call touches an admission id, a name, or a clinical note. The hospital's own policy applies the same minimum-necessary logic HIPAA encodes for US hospitals, because the group also treats patients under contracts that reference it, and the Digital Personal Data Protection Act, 2023 applies regardless.
- **No direct HIS queries.** The MediCore support contract is identical in shape to a core-banking vendor clause: nightly extract or a change-requested read replica, never a live query against production.
- **On-prem identity.** Clinical systems sit behind the hospital's own Active Directory and SSO gateway. Your dev VM is not on that network by default; getting it there is a Day 1 ticket, not a Day 3 surprise.
- **Security review.** The hospital's information-security officer signs off before anything that persists a patient identifier keeps running after you leave. Ask for the questionnaire on Day 1.
- **The steering committee runs in Hinglish.** English slides, Hinglish explanation. Practise saying "hum discharge ko automatic nahi kar rahe, sirf queue ko sahi order de rahe hain" in the register the room actually uses.
- **The deadline is external.** Neither the insurer's renewal date nor the accreditation visit moves because your build slipped.

## Generate the data pack

Save this as `arogya_pack.py` and run it with `python arogya_pack.py`. Standard library only, fixed seed, same output every time.

```python
"""Arogya Hospital Group: synthetic data pack. Fictional hospital chain, fake data."""
import csv, random
from datetime import date, datetime, timedelta
from pathlib import Path

rng = random.Random(20260601)
OUT = Path("arogya_pack")
OUT.mkdir(exist_ok=True)

WARDS = ["MED-A", "MED-B", "SURG-1", "SURG-2", "CARD", "ORTHO"]
OLD_BED = {"MED-A": "W1", "SURG-1": "W3", "CARD": "W5"}  # pharmacy still emits these for 3 wards
FIRST = ["Ananya", "Ravi", "Farida", "Suresh", "Grace", "Mahesh", "Priya", "Sandeep"]
LAST = ["Kulkarni", "Deshmukh", "Sheikh", "Rane", "Fernandes", "Iyer", "Joshi", "Pawar"]

def a_dt(lo_h, hi_h):
    return datetime(2026, 6, 1) + timedelta(hours=rng.randint(lo_h, hi_h))

admissions = []
for i in range(500):
    ward = rng.choice(WARDS)
    admit = a_dt(0, 3000)
    # the clerk backdates the "fit" flag to the start of rounds, hours before it is true
    fit_flag_time = admit + timedelta(hours=rng.randint(20, 200))
    admissions.append({
        "patient_id": "WALKIN-EMERGENCY" if rng.random() < 0.07 else f"PT{200000+i:06d}",
        "admission_id": f"ADM{500000+i:06d}",
        "ward": ward,
        "bed_no": f"{ward}-{rng.randint(1, 40):02d}",
        "admitted_at": admit.isoformat(sep=" "),
        "medically_fit_flag_at": fit_flag_time.isoformat(sep=" "),
        "attending": f"Dr. {rng.choice(FIRST)} {rng.choice(LAST)}",
        "payer": rng.choice(["CASH"] * 3 + ["TPA"] * 7),
    })

with open(OUT / "his_admissions.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(admissions[0]))
    w.writeheader()
    w.writerows(admissions)

SHIFT_FMT = ["%d-%m-%Y %I:%M %p", "%Y-%m-%d %H:%M"]
with open(OUT / "bed_board_log.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["admission_id", "bed_no", "status", "logged_at"])
    for r in rng.sample(admissions, 380):
        t = a_dt(0, 3200)
        w.writerow([r["admission_id"], r["bed_no"],
                    rng.choice(["OCCUPIED", "VACATED", "CLEANING"]),
                    t.strftime(rng.choice(SHIFT_FMT))])

with open(OUT / "pharmacy_discharge_queue.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["admission_id", "bed_no_pharmacy", "med_order_at", "dispensed_at"])
    for r in rng.sample(admissions, 300):
        old = OLD_BED.get(r["ward"])
        bed_pharm = r["bed_no"].replace(r["ward"], old) if old and rng.random() < 0.4 else r["bed_no"]
        order = a_dt(0, 3200)
        dispensed = order + timedelta(hours=rng.randint(1, 14)) if rng.random() < 0.85 else None
        w.writerow([r["admission_id"], bed_pharm, order.isoformat(sep=" "),
                    dispensed.isoformat(sep=" ") if dispensed else ""])

with open(OUT / "tpa_preauth.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["admission_id", "preauth_requested_at", "cleared_at"])
    for r in admissions:
        if r["payer"] != "TPA":
            continue  # cash-pay patients legitimately have no row here
        req = a_dt(0, 3200)
        cleared = req + timedelta(hours=rng.randint(1, 30)) if rng.random() < 0.9 else None
        w.writerow([r["admission_id"], req.isoformat(sep=" "),
                    cleared.isoformat(sep=" ") if cleared else ""])

ocr = OUT / "ocr"
ocr.mkdir(exist_ok=True)
SUB = {"0": "O", "1": "l", "5": "S", "8": "B"}
for n, r in enumerate(rng.sample(admissions, 45)):
    text = (f"AROGYA CENTRAL HOSPITAL\nDISCHARGE NOTE\n"
            f"Admission: {r['admission_id']}\nWard: {r['ward']}\n"
            f"Medically fit for discharge. Attending: {r['attending']}\nBed: {r['bed_no']}\n")
    damaged = "".join(SUB.get(c, c) if rng.random() < 0.1 else c for c in text)
    (ocr / f"note_{n:03d}.txt").write_text(damaged, encoding="utf-8")

print("wrote", len(admissions), "admissions to", OUT.resolve())
```

## The plan, day by day

**Day 0, the evening before.** Read the cast. Write six index cards. Write down, before you see any data, what you think the median fit-to-discharge gap is, in hours, and how you would measure it. Keep the page.

**Day 1: connect the data and name the entities.** Load all four sources plus the OCR folder. By end of day: a written ontology (Admission, Bed, Ward, MedicationOrder, PreauthRequest), the bed-numbering crosswalk found and documented, and Kulkarni's verbal sign-off on what "fit-to-discharge time" means when the flag and the physical note disagree. That definition is the deliverable.

**Day 2: make the number real.** Compute the true fit-to-discharge duration using the corrected fitness time where the OCR note and the flag disagree, and show the reconciliation: here is what the flag alone says, here is what changes once the backdating is corrected, here is what changes once cash-pay patients stop being counted as stalled on preauth. Take the gap to Kulkarni privately before the steering committee.

**Day 3: build the walking skeleton.** A ranked discharge-readiness queue: patient, true fitness time, what is still pending (medication, preauth, nothing), and how long it has been pending. It reads only the nightly extract and the crosswalked pharmacy feed. Put it in front of Sheikh on Day 3 afternoon and watch her use it without help.

**Day 4: close the audit loop, then rehearse.** Every "still pending" reason has to be traceable to a specific source row, not an inference. Show Deshmukh the preauth breakdown before anyone else sees it, so he can correct you if it is wrong. Rehearse the demo twice, once assuming the on-prem VM's network hiccups.

**Day 5: demo and decide.** Demo in the morning, memo in the afternoon, handover note before you leave.

## The demo

Order matters more than content.

1. **Fernandes and two nurses, at the station, thirty minutes.** They drive the queue. You do not touch the keyboard. Note every hesitation.
2. **Sheikh and a pharmacy assistant, twenty minutes.** Show that a medication order appearing at 7 a.m. surfaces on the queue before the 11 a.m. rush, not after it.
3. **The steering committee, forty minutes.** Kulkarni, Iyer, Rane. Open with the reconciled number and how it was derived. Show the audit trail behind "still pending" before the ranking. Show the queue last, running on the internal VM with the wifi disconnected.

If the nurses in step one would not use it, do not proceed to step three with the same build. Say so in the room.

## The decision memo

One page. Fill this in and put it in the repository.

```text
TO: Dr. A. Kulkarni (Medical Superintendent), M. Iyer (IT), Trust Board
FROM: [you]
RE: Bed flow and discharge turnaround — recommendation after the five-day bootcamp
DATE:

1. THE NUMBER. Under the definition agreed on Day 1, median fit-to-discharge time
   is ___ hours, against the flag-only figure of ___. The difference is because:
   (a) ... (b) ... (c) ...

2. RECOMMENDATION. Build ___. It moves the median to an estimated ___ by
   [accreditation date], on these assumptions: ...

3. WHAT I AM NOT BUILDING, AND WHY.
   - Automated OCR-based fitness detection: rejected. A doctor's sign-off has to
     stay a doctor's action; the note is corroboration, not a trigger.
   - ...

4. WHAT IT COSTS. Effort: ___. Runs on: ___. Owned after handover by: ___.

5. WHAT WOULD MAKE ME WRONG. If ___, this approach fails and the alternative
   is ___. We would know by [date] because [observable signal].

6. DEPENDENCIES ON YOU. VM network access by ___. Security review slot by ___.
   Sign-off on the fit-to-discharge definition, in writing, by ___.
```

## Rubric

Score each out of 5. Under 21 out of 30, run it again with the same pack and different choices.

| Dimension | What a 5 looks like |
|---|---|
| Discovery | You found the backdated fitness flag and the bed-numbering crosswalk by asking and cross-checking against the OCR notes, not by reading the generator. |
| Ontology | Written before any transformation. Names the join that does not work between HIS and pharmacy bed numbers, and what you did instead. |
| Reconciliation | You can explain the gap between the raw flag number and your number in three sentences to a non-technical sponsor. |
| Constraint handling | Nothing you built queries the production HIS or calls a hosted model with patient data. You asked for the security questionnaire on Day 1. |
| Adoption | A nurse and a pharmacy assistant both used the queue unaided by Day 3 and again on Day 5. |
| The memo | Recommends one thing, declines at least one thing explicitly, and states a falsifier with a date. |

## How this could go wrong

**You build a ward occupancy dashboard.** Kulkarni asked for hours, not a heat map, and said so in the first meeting.

**You trust the fitness flag.** It is backdated by design and disagrees with the physical record on a meaningful share of admissions. Recomputing it honestly is most of the value of the week.

**You auto-detect fitness from the OCR notes.** The OCR is damaged and a doctor's sign-off is a clinical act, not a text-classification output. Building anything that infers fitness without a human confirming it is the one build that can end the engagement.

**You never go to the ward.** The nurses and the pharmacy are on different floors from the steering committee room. Go there on Day 1.
