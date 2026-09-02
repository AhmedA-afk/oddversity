---
title: "Bootcamp 05: Halden Logistics, EU (GDPR and exceptions)"
phase: practice
module: simulated-customers
kind: bootcamp
summary: A fictional European road-freight carrier drowns its dispatchers in shipment exceptions and needs a triage queue before a major contract renewal, but a prior attempt at a driver scoring tool was blocked by the works council and a repeat mistake could end the project outright. Four days, GDPR, a DPIA, and a demo that has to satisfy the works council and Compliance at the same time as Operations.
duration: 4 days
updated: "2026-09-02"
outcomes:
  - Reconcile exception, shipment and dispatcher-note records across three languages and three hubs whose clocks, ids and translations disagree.
  - Produce an exception triage queue, aggregated at hub and route level, that never surfaces a driver-identifying field.
  - Write a one-page decision memo that recommends one build, declines at least one tempting one, and states a falsifier.
artifact: A `bootcamps/05-halden/` folder with the generated pack, a triage script, the working queue, a recorded demo, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
---

Halden Logistics is fictional. So is every person and every customer named in this brief. The data pack you generate is synthetic. Say so in your repository README.

## The company and the situation

Halden Logistics is a European road-freight and last-mile carrier headquartered in Rotterdam, operating hubs in the Netherlands, Germany and Poland, moving freight for retail and manufacturing customers across the region with about 1,900 drivers, employed and contracted.

Shipment exceptions, delays, damage, misroutes, customs holds, arrive continuously into a shared queue, and dispatchers at each hub triage them by hand. Most resolve on their own within a few hours; a minority need a human call to the customer or the driver. Nobody can currently tell which is which without opening every ticket, and dispatchers at the Warsaw hub in particular are behind by hours most days.

Two things are forcing the conversation. Halden's largest customer, a Nordic retail chain, is renewing its contract in six weeks with a penalty clause tied to exception-resolution time. And eighteen months ago, Halden attempted a "driver performance score" intended to flag drivers with unusually high exception rates. The works council blocked it before deployment, on the grounds that it would be used for individual discipline without proper consultation, and the relationship has been tense since. Any fix built now that can be read as the same tool under a new name will not survive a second look.

You have four days, working across the Rotterdam, Hamburg and Warsaw hubs, with the works council joining the Day 4 demo directly.

## The cast

| Person | Role | Wants | Fears |
|---|---|---|---|
| Marieke de Groot | VP Operations, project sponsor | Exceptions triaged fast enough to hit the renewal's SLA clause | Missing the SLA number before the contract closes |
| Jonas Richter | Data Protection Officer | A documented lawful basis and a DPIA before anything touches personal data | A GDPR complaint that reopens the works council's original objection |
| Isabelle Faure | Works Council representative, drivers' side | Written proof the new tool cannot become an individual driver score | A repeat of the blocked project under a different name |
| Piotr Nowak | Dispatch Team Lead, Warsaw hub | A queue he can actually clear by the end of a shift | Another tool that adds fields to fill in rather than removing his backlog |
| Sven Bakker | Head of IT Infrastructure | Everything hosted inside EU-region cloud, no exceptions | A data residency breach flagged by a public-sector customer's own auditors |

What each of them says, in the first meeting:

**de Groot:** "I need to know, today, what fraction of exceptions resolve themselves and which ones actually need a dispatcher, because right now every one of them gets the same amount of attention."

**Richter:** "Before anything runs against driver or shipment data, I need the DPIA fields identified and a lawful basis written down. I am not signing off on a design after it is built."

**Faure:** "We blocked the last version of this because it scored individuals. If I see a driver name or a driver id anywhere in what you show me on Thursday, this conversation ends there."

**Nowak:** "I clear maybe sixty tickets a shift and forty more roll over. If your tool tells me which forty of the rollover actually need me, I will use it. If it just gives me more fields, I will not."

**Bakker:** "Nothing about this touches a US region, cached or otherwise, until Legal has a data processing addendum in place. That includes any hosted model call."

Hold the conflict: de Groot wants the SLA number, Richter wants the lawful basis settled before code is written, Faure will end the engagement over one driver-identifying field, Nowak wants his backlog cut without more data entry, and Bakker will block anything that leaves the EU region. A build that satisfies four of the five is a failed bootcamp.

## What you are handed

Five exports, delivered by secure transfer per hub on the morning of Day 1.

- `exception_events.csv`, a nightly export of shipment exceptions: id, shipment, hub, type, raised time, resolved time.
- `shipment_master.csv`, shipment, customer, origin and destination hub, contracted SLA hours.
- `dispatcher_notes.csv`, free-text resolution notes, in Dutch, German, Polish or English depending on the hub.
- `driver_assignment_log.csv`, which driver was assigned to which shipment leg. It is in the pack because it would be in the field. Using it to build anything that ranks or names individual drivers is the trap this bootcamp is built around.
- `ocr/`, twenty text files: scanned customs hold notices, multi-language, OCR'd.

## How the data lies

Find these yourself on Day 1. This list is the answer key; read it on Day 2 to see what you missed.

- **A resolved time that is not resolved.** A UI bug in the dispatch tool stamps `resolved_at` the moment a dispatcher opens a ticket, within minutes of it being raised, not when it is actually closed. The true resolution time is only in the dispatcher's free-text note.
- **No timezone offset.** Each hub logs `raised_at` in its own local time with no offset recorded. Rotterdam, Hamburg and Warsaw share a timezone most of the year but not always, and a naive read across hubs can misorder which exception happened first at a shift boundary.
- **Language drops a third of the notes.** Any keyword-based triage that only matches English text silently ignores roughly a third of dispatcher notes, because Warsaw writes in Polish, Hamburg mostly in German and Rotterdam mostly in Dutch. This systematically skews any English-only queue toward hubs whose dispatchers happen to write in English.
- **Reused shipment ids across interlined legs.** A shipment that changes carrier mid-route keeps the same shipment id for its second leg. Deduplicating naively by shipment id collapses two genuinely different exceptions, on two different legs, into one.
- **The driver join that should not be made.** `driver_assignment_log.csv` joins cleanly to `exception_events.csv` by shipment id. It is the shortest technical path to a per-driver exception rate, and it is exactly the artifact that ended the works council's tolerance for this kind of project once already.
- **OCR damage.** Zero and capital O, one and lowercase l, five and S are interchanged at random through the scanned customs hold notices.

## The constraints

- **GDPR and the DPIA.** Any processing that touches driver-linked data needs a documented lawful basis. You are not expected to produce a completed legal DPIA in four days, but you must identify, with Richter, exactly which fields are in scope and which are deliberately excluded, and get that in writing before Day 3.
- **The works council can block deployment.** Faure has to see, concretely, that the design's primary output path has no driver-identifying field anywhere in the query or the interface, not merely hidden in a later screen.
- **EU-only hosting.** No US-region cloud, and no hosted model call without a signed data processing addendum that does not currently exist. Treat that gap as a blocker to name on Day 1, not a detail to route around.
- **Three separate hub logins.** Dispatch tool access is per-hub, not unified, so the pack itself arrives as three local exports rather than one clean feed; reconciling that is part of the work, not a data-cleaning footnote.
- **Code-switching register.** You present to Piotr's Warsaw team in English but need to at least understand "poziom obsługi" in the dispatcher's own words before you can build a queue they will trust; the same discipline applies in Hamburg and Rotterdam in German and Dutch.

## Generate the data pack

Save this as `halden_pack.py` and run it with `python halden_pack.py`. Standard library only, fixed seed, same output every time.

```python
"""Halden Logistics: synthetic data pack. Fictional EU carrier, fake data."""
import csv, random
from datetime import datetime, timedelta
from pathlib import Path

rng = random.Random(20260305)
OUT = Path("halden_pack")
OUT.mkdir(exist_ok=True)

HUBS = ["ROTTERDAM", "HAMBURG", "WARSAW"]
TYPES = ["DELAY", "DAMAGE", "MISROUTE", "CUSTOMS-HOLD"]
NOTE_LANG = {
    "en": "Resolved after contacting the consignee.",
    "nl": "Opgelost na contact met de ontvanger.",
    "de": "Nach Kontakt mit dem Empfaenger geloest.",
    "pl": "Rozwiazane po kontakcie z odbiorca.",
}

def a_dt(lo, hi):
    return datetime(2026, 2, 1) + timedelta(hours=rng.randint(lo, hi))

shipments = []
for i in range(280):
    shipments.append({
        "shipment_id": f"SH{i:05d}",
        "customer": rng.choice(["Nordfarm Retail", "Delta Componenten", "Baltic Freshgoods"]),
        "origin_hub": rng.choice(HUBS),
        "dest_hub": rng.choice(HUBS),
        "sla_hours": rng.choice([24, 48, 72]),
    })
# interlined shipments change carrier leg mid-route but keep the same shipment id
interlined_ids = {s["shipment_id"] for s in rng.sample(shipments, 25)}
with open(OUT / "shipment_master.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(shipments[0]))
    w.writeheader()
    w.writerows(shipments)

events = []
for i in range(600):
    s = rng.choice(shipments)
    raised = a_dt(0, 3000)  # naive local time, no UTC offset recorded
    resolved_wrong = raised + timedelta(minutes=rng.randint(1, 5))  # the UI-bug stamp
    leg = "B" if s["shipment_id"] in interlined_ids and rng.random() < 0.5 else "A"
    events.append({
        "event_id": f"EX{700000+i:06d}",
        "shipment_id": s["shipment_id"],
        "leg": leg,
        "hub": s["origin_hub"],
        "type": rng.choice(TYPES),
        "raised_at": raised.isoformat(sep=" "),
        "resolved_at": resolved_wrong.isoformat(sep=" ") if rng.random() < 0.8 else "",
    })
with open(OUT / "exception_events.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(events[0]))
    w.writeheader()
    w.writerows(events)

with open(OUT / "dispatcher_notes.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["event_id", "lang", "note", "true_resolved_at"])
    hub_lang = {"WARSAW": "pl", "HAMBURG": "de", "ROTTERDAM": "nl"}
    for e in rng.sample(events, 420):
        lang = "en" if rng.random() < 0.25 else hub_lang[e["hub"]]
        true_resolved = datetime.fromisoformat(e["raised_at"]) + timedelta(hours=rng.randint(1, 30))
        w.writerow([e["event_id"], lang, NOTE_LANG[lang], true_resolved.isoformat(sep=" ")])

# present because it would be in the field; the join a DPO and works council do not
# want used to build anything driver-identifying
with open(OUT / "driver_assignment_log.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["shipment_id", "leg", "driver_id"])
    for s in shipments:
        w.writerow([s["shipment_id"], "A", f"DRV{rng.randint(1000, 1900)}"])
        if s["shipment_id"] in interlined_ids:
            w.writerow([s["shipment_id"], "B", f"DRV{rng.randint(1000, 1900)}"])

ocr = OUT / "ocr"
ocr.mkdir(exist_ok=True)
SUB = {"0": "O", "1": "l", "5": "S", "8": "B"}
customs = [x for x in events if x["type"] == "CUSTOMS-HOLD"]
for n, e in enumerate(rng.sample(customs, 20)):
    text = f"CUSTOMS HOLD NOTICE\nShipment: {e['shipment_id']}\nHub: {e['hub']}\nStatus: HELD\n"
    damaged = "".join(SUB.get(c, c) if rng.random() < 0.1 else c for c in text)
    (ocr / f"hold_{n:03d}.txt").write_text(damaged, encoding="utf-8")

print("wrote", len(events), "exception events to", OUT.resolve())
```

## The plan, day by day

**Day 0, the evening before.** Read the cast. Write five index cards. Write down, before you see any data, what fraction of exceptions you think resolve on their own, and why. Keep the page.

**Day 1: connect the data and scope it with Richter and Faure, before anything else.** Load the three hub exports, the shipment master, the notes, and the driver log. By end of day: a written ontology (Shipment, Leg, ExceptionEvent, Hub) that deliberately has no path from its primary output to a driver identity, and a signed-off scope note from Richter and Faure on exactly which fields are in and out of the DPIA. This is the Day 1 deliverable, not a diagram.

**Day 2: make the number real.** Correct the resolved-time bug using the dispatcher notes across all three languages, and compute the true share of exceptions that self-resolve versus need a dispatcher, at hub and route level.

**Day 3: build the walking skeleton.** A triage queue for Piotr's hub, aggregated to hub and route, with no driver name or id surfaced anywhere in the UI or in any query a curious dispatcher could inspect. Put it in front of Nowak's team and watch them clear a real shift's backlog with it.

**Day 4: demo and decide.** Works council and Compliance first, together; Operations and the commercial team last.

## The demo

Order matters more than content, and the order here is different from the other bootcamps on purpose.

1. **Richter and Faure together, twenty minutes, first.** They see the exact build Nowak's team will use, not a sanitised version. Walk the query itself, not just the screen, to show there is no driver field to find.
2. **Nowak and two dispatchers, thirty minutes.** They clear a real backlog live. You do not touch the keyboard.
3. **de Groot and the commercial lead, twenty minutes.** The SLA number and how it was derived, shown last.

If Faure raises a concern in step one, resolve it before step two runs, even if that means delaying the rest of the day. Deploying past an open works council objection is not a scoreable outcome in this bootcamp; it is a failed one.

## The decision memo

One page. Fill this in and put it in the repository.

```text
TO: M. de Groot (VP Operations), J. Richter (DPO), I. Faure (Works Council)
FROM: [you]
RE: Exception triage — recommendation after the four-day bootcamp
DATE:

1. THE NUMBER. ___ percent of exceptions self-resolve within the SLA window
   without a dispatcher; the rest need a human. This changes the resolved-time
   figure because: (a) ... (b) ... (c) ...

2. RECOMMENDATION. Build ___, aggregated at hub and route level only. It moves
   the SLA figure to an estimated ___ before the contract renewal.

3. WHAT I AM NOT BUILDING, AND WHY.
   - Any per-driver exception score: rejected outright. The works council
     blocked this design once; it is out of scope this engagement and every one
     after it unless they reopen the conversation themselves.
   - ...

4. WHAT IT COSTS. Effort: ___. Runs on: ___. Owned after handover by: ___.

5. WHAT WOULD MAKE ME WRONG. If ___, this approach fails and the alternative
   is ___. We would know by [date] because [observable signal].

6. DEPENDENCIES ON YOU. DPIA field scope signed off by ___. EU-region hosting
   confirmed by Bakker by ___. Works council sign-off in writing by ___.
```

## Rubric

Score each out of 5, and treat the marked line below as a hard fail regardless of the other five scores.

| Dimension | What a 5 looks like |
|---|---|
| Discovery | You found the resolved-time bug and the language gap by asking dispatchers in their own hub, not by reading the generator. |
| Ontology | Written before any transformation. Names the driver join explicitly and states, in writing, why it is out of scope. |
| Reconciliation | You can explain the self-resolve rate in three sentences to a non-technical sponsor, correctly handling all three languages. |
| Constraint handling | Nothing you built leaves the EU region, calls a hosted model without a DPA, or surfaces a driver-identifying field. **A driver name or id anywhere in the primary output is an automatic fail on this bootcamp, whatever the other scores are.** |
| Adoption | Nowak's team cleared a real backlog unaided using the build, and it worked in at least two of the three hub languages. |
| The memo | Recommends one thing, declines the per-driver score explicitly, and states a falsifier with a date. |

## How this could go wrong

**You rebuild the blocked tool with a different name.** The driver join is right there in the data, joins cleanly, and is the fastest way to look impressive on Day 3. It is also the one build that can end the engagement before Day 4.

**You triage in English only.** A third of the true resolution signal is in Polish, German and Dutch notes. Ignoring them does not remove the bias, it hides it.

**You demo Operations first.** Showing the SLA win before the works council has seen the build reads as presenting them with a fait accompli. They will treat it that way.

**You accept the resolved_at field at face value.** The UI bug makes it look instant. The dispatcher notes are the only honest record of when something actually closed.
