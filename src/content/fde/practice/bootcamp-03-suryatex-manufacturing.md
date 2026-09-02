---
title: "Bootcamp 03: SuryaTex Manufacturing (quality and supply)"
phase: practice
module: simulated-customers
kind: bootcamp
summary: A fictional Indian knitwear exporter cannot tell which yarn and dye lots actually went into a defective shipment, and its largest EU buyer has scheduled a traceability audit in five weeks after a recall scare. Three days, two production units where the network cannot be trusted, and a demo that has to survive a formal audit call.
duration: 3 days
updated: "2026-09-02"
outcomes:
  - Reconcile production, dye and shipment records that disagree because of reused lot codes, delayed syncs and cartons packed across batch boundaries.
  - Produce a traceability lookup that answers, for a given defect or a given shipment, which batches are genuinely implicated and which are not.
  - Write a one-page decision memo that recommends one build, declines at least one tempting one, and states a falsifier.
artifact: A `bootcamps/03-suryatex/` folder with the generated pack, a traceability script, the working lookup tool, a recorded demo, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
---

SuryaTex Manufacturing is fictional. So is every person in this brief and every buyer named in it. The data pack you generate is synthetic. Say so in your repository README.

## The company and the situation

SuryaTex Manufacturing is a knitwear exporter with a head office in Coimbatore and two production units: Unit 1 in Tiruppur, Tamil Nadu, and Unit 2 in a rural district of Karnataka. Together they run about 2,200 workers and export finished garments to European and North American retailers. Its largest single account, roughly 30 percent of revenue, is a fictional Nordic apparel chain called Norvasta Retail Group.

Three months ago, a batch of garments with a dye-fastness defect reached Norvasta's stores. SuryaTex could not tell Norvasta which units of the shipment were affected, because the shipment's packing records tracked cartons, not the individual production batches that had gone into them. Norvasta pulled the entire shipment rather than the affected fraction, at SuryaTex's cost, and has scheduled a supply-chain traceability audit in five weeks: can SuryaTex, given a defect or a customer complaint, trace back to the specific yarn lot and dye lot within the audit window. A second failure of the same kind is a stated reason for termination in the account's contract renewal.

Unit 1's network is usable but unreliable. Unit 2's is worse: a mobile-data link that drops for hours some days, so its production data arrives at head office in delayed batches rather than in real time. Any fix has to work with that, not assume it away.

You have three days on site at the Coimbatore head office, with a video call scheduled to Unit 2 on Day 2 and the auditor's own call on Day 3.

## The cast

| Person | Role | Wants | Fears |
|---|---|---|---|
| Meenakshi Subramaniam | Head of Quality, project sponsor | The actual affected batch range for any defect, not the whole shipment | Norvasta terminating the contract over a second unresolved traceability failure |
| Devraj Gowda | Unit 2 Plant Manager, rural Karnataka | Nothing that requires his line supervisors to enter more data by hand | Head office second-guessing production numbers from people who have never visited the unit |
| Elina Kask | Norvasta's compliance auditor, joining by video call | A documented chain of custody from finished garment back to yarn lot, inside the audit window | Signing off on a supply chain she cannot actually trace |
| Ramesh Iyer | IT and ERP Administrator, head office | The production ERP left untouched; any new tool reads the nightly export only | The auditor asking to see the unpatched production-floor terminals directly |
| Lakshmi Pillai | Dye House Supervisor, Unit 1 | A dye-lot log she can fill correctly at 6 a.m. before the first batch, not a form nobody uses | Colour-match complaints pinned on her without the batch data to defend herself |
| Suresh Reddy | Managing Director | One answer: are we going to lose the Norvasta account | Systems talk that never resolves into a number he can say out loud to the buyer |

What each of them says, in the first meeting:

**Subramaniam:** "When a defect is reported, I need the batch range in an hour, not the whole shipment's worth of cartons pulled because we can't tell which ones are actually implicated."

**Gowda:** "My network goes down for half a day most weeks. If your tool needs a live connection to work, it will not work at my unit, and I am not adding another form for my supervisors to fill by hand."

**Kask, formal English, by video call:** "I need to see one finished garment traced to its yarn lot, on this call, from records you can show me are consistent, not records assembled for my benefit this week."

**Iyer:** "The ERP vendor's support terms say the same thing every vendor's terms say: no direct queries against the production database. Nightly export or nothing, and I am not opening a terminal to an outside auditor."

**Pillai:** "The dye house recycles lot numbers every financial year. Ask anyone why last year's D-14 and this year's D-14 are different dyes and you'll get a shrug. I've been saying this for two years."

**Reddy, tanglish, closing the first meeting:** "Mujhe systems ki kahani nahi chahiye. Bata do — Norvasta ka contract bachega ya nahi. Baaki sab baad mein."

Hold the conflict: Subramaniam wants precision that reduces her exposure, Gowda will reject anything assuming real-time connectivity, Kask will not accept a story assembled to look good for one call, Iyer will not open the production system, and Pillai's actual problem, the reused dye codes, is not the one anyone in head office has named yet. A build that satisfies four of the six is a failed bootcamp.

## What you are handed

Five exports and a folder, delivered on a shared drive on the morning of Day 1.

- `erp_production_batches.csv`, the nightly ERP export: batch, unit, line, yarn lot reference, dye lot reference, production date, quantity.
- `yarn_receipts.csv`, procurement's record of yarn lots received per unit.
- `qc_inspection.csv`, quality inspection results per batch, with defect codes.
- `shipment_manifest.csv`, which batches were packed into which containers and cartons.
- `ocr/`, thirty-five text files: Unit 2's paper batch cards, scanned and OCR'd, because production there does not always reach the ERP before the nightly export runs.

## How the data lies

Find these yourself on Day 1. This list is the answer key; read it on Day 2 to see what you missed.

- **Orphaned yarn lot references.** Unit 2's procurement entry lags the ERP sync by days. A batch produced on a Tuesday can reference a yarn lot that `yarn_receipts.csv` does not record as received until the following week. A naive join drops these batches as errors instead of recognising the lag.
- **Reused dye lot codes.** The dye house's numbering resets every financial year. `D25-014` and `D26-014` are unrelated dyes. Any join or lookup that ignores the year prefix silently merges two different colour runs.
- **Cartons that hide a split.** A production line that under-runs a batch tops up a carton from the next batch on the line. The manifest records only the first batch id per carton. The actual carton can contain units from two batches, and the manifest alone cannot tell you that.
- **A defect-code scheme change mid-year.** Inspection results before September used codes `A1`-`A5`; after, they use `DEF-01` through `DEF-06`. The mapping between the two schemes is incomplete for a six-month transition window, and some old codes have no clean equivalent.
- **Delayed arrival, not delayed production.** Unit 2 rows arrive at head office days after the work actually happened. The production date on the row is correct; the date you receive the row is not the same thing, and using the wrong one misorders the timeline you show the auditor.
- **OCR damage.** Zero and capital O, one and lowercase l, five and S are interchanged at random through the scanned Unit 2 batch cards, including inside lot codes.

## The constraints

- **The audit window is fixed.** Norvasta's traceability audit happens in five weeks regardless of what you build this week; the deliverable is a method that will still work then, not a one-time answer for this call.
- **Unreliable networks at both units.** Unit 2's is worse, but neither can be assumed live. The lookup has to work against periodically synced batch exports, not a real-time connection.
- **No direct ERP queries.** The vendor support clause mirrors a core-banking contract: nightly export or a change-requested read view, never a live query against the production ERP.
- **A lightweight security review.** Norvasta's auditor will also check that access to production data is controlled, not full-scope but real; have an answer for who can see what.
- **Code-switching register.** The MD's conversations run in Tanglish, the shop floor in a mix of Tamil and Kannada depending on the unit, and the auditor's call is formal English. Practise moving between them without losing precision in any of them.

## Generate the data pack

Save this as `suryatex_pack.py` and run it with `python suryatex_pack.py`. Standard library only, fixed seed, same output every time.

```python
"""SuryaTex Manufacturing: synthetic data pack. Fictional exporter, fake data."""
import csv, random
from datetime import datetime, timedelta
from pathlib import Path

rng = random.Random(20260115)
OUT = Path("suryatex_pack")
OUT.mkdir(exist_ok=True)

UNITS = ["UNIT1-TIRUPPUR", "UNIT2-KARNATAKA"]
LINES = ["L1", "L2", "L3"]

def a_dt(lo, hi):
    return datetime(2025, 4, 1) + timedelta(hours=rng.randint(lo, hi))

yarn_lots = []
for i in range(220):
    unit = rng.choice(UNITS)
    yarn_lots.append({
        "yarn_lot": f"Y{unit[:5]}-{2000+i}",
        "unit": unit,
        "received_at": a_dt(0, 4000).isoformat(sep=" "),
    })
with open(OUT / "yarn_receipts.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(yarn_lots[0]))
    w.writeheader()
    w.writerows(yarn_lots)

batches = []
for i in range(400):
    unit = rng.choice(UNITS)
    produced = a_dt(50, 4200)
    yl = rng.choice(yarn_lots)
    # Unit 2's procurement entry lags the ERP sync: pick a lot the ERP references
    # before yarn_receipts shows it as received
    if unit == "UNIT2-KARNATAKA" and rng.random() < 0.15:
        yl = rng.choice([y for y in yarn_lots if y["unit"] == unit])
    # dye lot numbers reset each financial year and are reused across years
    dye_year = produced.year % 100
    batches.append({
        "batch_id": f"B{600000+i:06d}",
        "unit": unit,
        "line": rng.choice(LINES),
        "yarn_lot": yl["yarn_lot"],
        "dye_lot": f"D{dye_year}-{rng.randint(1, 60):03d}",
        "production_date": produced.date().isoformat(),
        "qty_units": rng.randint(400, 1800),
    })
with open(OUT / "erp_production_batches.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(batches[0]))
    w.writeheader()
    w.writerows(batches)

OLD_CODES = ["A1", "A2", "A3", "A4", "A5"]
NEW_CODES = ["DEF-01", "DEF-02", "DEF-03", "DEF-04", "DEF-05", "DEF-06"]
with open(OUT / "qc_inspection.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["batch_id", "inspected_at", "defect_code", "defect_qty"])
    for b in rng.sample(batches, 340):
        insp = datetime.fromisoformat(b["production_date"]) + timedelta(days=rng.randint(1, 20))
        code = rng.choice(OLD_CODES) if insp.year == 2025 and insp.month < 9 else rng.choice(NEW_CODES)
        w.writerow([b["batch_id"], insp.date().isoformat(), code, rng.randint(0, 40)])

with open(OUT / "shipment_manifest.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["shipment_id", "container_no", "carton_no", "batch_id", "units_in_carton"])
    for s in range(30):
        shipment, container = f"SHP{7000+s}", f"CTR{9000+s}"
        # an under-run batch tops a carton up from the next one on the line, but the
        # manifest only ever records the first batch_id for that carton
        for c, b in enumerate(rng.sample(batches, rng.randint(4, 9))):
            w.writerow([shipment, container, f"{container}-{c:03d}", b["batch_id"],
                        rng.randint(20, 60)])

ocr = OUT / "ocr"
ocr.mkdir(exist_ok=True)
SUB = {"0": "O", "1": "l", "5": "S", "8": "B"}
unit2_batches = [x for x in batches if x["unit"] == "UNIT2-KARNATAKA"]
for n, b in enumerate(rng.sample(unit2_batches, 35)):
    text = (f"SURYATEX UNIT 2 - BATCH CARD\nBatch: {b['batch_id']}\nLine: {b['line']}\n"
            f"Yarn lot: {b['yarn_lot']}\nDye lot: {b['dye_lot']}\nQty: {b['qty_units']}\n")
    damaged = "".join(SUB.get(c, c) if rng.random() < 0.12 else c for c in text)
    (ocr / f"card_{n:03d}.txt").write_text(damaged, encoding="utf-8")

print("wrote", len(batches), "batches to", OUT.resolve())
```

## The plan, day by day

**Day 0, the evening before.** Read the cast. Write six index cards. Write down, before you see any data, how you would answer "which batches are in this shipment" today, by hand, and how long you think it would take.

**Day 1: connect the data and name the entities.** Load all four CSVs and the OCR folder. By end of day: a written ontology (Batch, YarnLot, DyeLot, Container, Carton, DefectCode), the orphaned-yarn-lot pattern and the dye-lot-reuse pattern found and documented, and Subramaniam's verbal sign-off on what counts as "implicated" for a shipment when the manifest cannot fully resolve a carton to one batch.

**Day 2: build the traceability lookup, with Unit 2 on the call.** Given a batch or a defect, return every carton it could be in, flagged by confidence: certain when the manifest is clean, uncertain when a carton was topped up across batches. Walk Gowda through what his line's exports actually produce, on the call, and confirm the lookup does not silently assume connectivity his unit does not have.

**Day 3: rehearse, demo, decide.** Given the short window, demo and memo happen the same day. Rehearse the audit call once with Pillai in the room, since the dye-lot-reuse fix depends on her confirming the year convention is right.

## The demo

Order matters more than content.

1. **Pillai and a line supervisor, twenty minutes.** They look up a defect from last week's inspection log and see the true batch range, including the confidence flag. Note where they hesitate or disagree with a flag.
2. **Kask, on the auditor's call, twenty-five minutes.** Trace one sample garment from a real shipment back to its yarn lot and dye lot, live, using only the pack's data. If the manifest cannot fully resolve a carton, say so and show the confidence flag rather than guessing.
3. **Reddy and Subramaniam, fifteen minutes.** One number: what fraction of past shipments could now be traced with certainty versus what fraction still carry unresolved cartons, and what closes that gap.

If the auditor call in step two produces an uncertain trace on the sample garment, do not proceed to step three claiming full traceability. Say so in the room.

## The decision memo

One page. Fill this in and put it in the repository.

```text
TO: M. Subramaniam (Head of Quality), S. Reddy (MD), R. Iyer (IT)
FROM: [you]
RE: Traceability for the Norvasta audit — recommendation after the three-day bootcamp
DATE:

1. THE NUMBER. Of past shipments checked, ___ percent can be traced to a batch
   with certainty; ___ percent carry at least one uncertain carton because of:
   (a) ... (b) ... (c) ...

2. RECOMMENDATION. Build ___. It closes the certainty gap to an estimated ___
   before the audit, on these assumptions: ...

3. WHAT I AM NOT BUILDING, AND WHY.
   - Real-time RFID carton tracking: rejected. Neither unit's network supports it
     and the audit window does not allow procuring and installing it.
   - ...

4. WHAT IT COSTS. Effort: ___. Runs on: ___. Owned after handover by: ___.

5. WHAT WOULD MAKE ME WRONG. If ___, this approach fails and the alternative
   is ___. We would know by [date] because [observable signal].

6. DEPENDENCIES ON YOU. Confirmed dye-lot year convention from Pillai by ___.
   Unit 2 export cadence confirmed with Gowda by ___. Access scoping signed off
   by Iyer by ___.
```

## Rubric

Score each out of 5. Under 21 out of 30, run it again with the same pack and different choices.

| Dimension | What a 5 looks like |
|---|---|
| Discovery | You found the orphaned yarn lots and the dye-lot reuse by asking Gowda and Pillai, not by reading the generator. |
| Ontology | Written before any transformation. Names the carton-splitting join that cannot be fully resolved, and what you did instead. |
| Reconciliation | You can state, in one sentence, what fraction of the shipment history is traceable with certainty and why the rest is not. |
| Constraint handling | Nothing you built assumes live connectivity at either unit or queries the production ERP directly. |
| Adoption | Pillai or a line supervisor used the lookup unaided and it matched what they already knew from the floor. |
| The memo | Recommends one thing, declines at least one thing explicitly, and states a falsifier with a date. |

## How this could go wrong

**You report full traceability.** The manifest genuinely cannot resolve every carton to one batch. Claiming certainty you do not have is the exact failure that triggered this audit in the first place.

**You collapse dye lots across years.** The reused code convention is the trap; a lookup that ignores the year prefix will confidently return the wrong dye's history.

**You wait for a live connection from Unit 2.** It is not coming this week or most weeks. Design for batch sync from the start.

**You never talk to the shop floor.** Pillai has been naming the dye-lot problem for two years and nobody in head office wrote it down. Go to the dye house on Day 1.
