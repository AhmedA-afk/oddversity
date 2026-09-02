---
title: "Lab: model a business from its exports alone"
phase: data
module: domain-modelling
kind: lab
summary: "No domain expert is in the room for this one. You are handed three raw exports from a fictional hospital group and asked to reverse-engineer the ontology, the way an FDE often has to before the first stakeholder meeting is even scheduled."
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Infer entities, properties, and links from raw exports with no domain expert available yet.
  - Write down every inference as an assumption to be confirmed, rather than presenting it as fact.
  - Produce an ontology a domain expert can correct in a single 30-minute review, instead of a blank page.
artifact: An ontology.yaml file plus a one-page list of assumptions to confirm, for a domain modelled without a live domain expert.
---

**The customer.** Arogya Hospital Group is a fictional chain of five hospitals in south India. Before the engagement's first stakeholder meeting — which is two weeks out, because the CMO's calendar is what it is — the operations team sent over three exports "so you can start looking." No domain expert is available yet. This is a common and unglamorous state of an engagement: you often start modelling before anyone is in the room to ask.

Your job is to arrive at that first meeting with a draft ontology already sketched, so the thirty minutes with the CMO is spent correcting your assumptions rather than starting from nothing.

## Step 1: Read the exports as given

Three CSV excerpts, provided below exactly as a hospital operations team would hand them over: undocumented, inconsistently cased, with abbreviations nobody explained.

`admissions_export.csv`:

```csv
adm_id,pt_id,ward_cd,adm_dt,disch_dt,attending_doc,dx_code
A-10041,P-3390,ICU-2,2026-08-01,2026-08-06,DR.RAO,I21.0
A-10042,P-2287,GEN-1,2026-08-02,,DR.MEHTA,J18.9
A-10043,P-3390,GEN-3,2026-08-09,2026-08-11,DR.RAO,I21.0
```

`bed_master.csv`:

```csv
bed_id,ward_cd,bed_type,status
B-201,ICU-2,ICU,occupied
B-202,ICU-2,ICU,vacant
B-310,GEN-1,GENERAL,occupied
B-330,GEN-3,GENERAL,maintenance
```

`billing_export.csv`:

```csv
inv_no,adm_id,item_desc,qty,rate,amt
INV-77012,A-10041,ICU Bed Charge,5,8500,42500
INV-77012,A-10041,Cardiologist Consult,2,1500,3000
INV-77013,A-10042,General Bed Charge,3,2200,6600
```

## Step 2: List every entity candidate, with a reason for including or excluding it

Go column by column, source by source, and decide whether each distinct thing is an entity, a property, or noise (a code that will resolve to a property of something else).

Work through it out loud, in writing, before you touch a schema:

- `adm_id` — a distinct admission event, reused across multiple billing lines. Entity: **Admission**.
- `pt_id` — a patient, appearing on more than one admission (`P-3390` twice). Entity: **Patient**.
- `ward_cd` — appears in both admissions and bed_master, consistent values. Entity: **Ward**, or possibly just a property, pending Step 3.
- `attending_doc` — a name, not an id. Possible entity **Clinician**, with the caveat that a name-only key is fragile — two doctors could share a surname format like `DR.RAO`.
- `dx_code` — an ICD-10 diagnosis code, a coded reference value, not an entity of its own. Property of Admission.
- `bed_id`, `bed_type`, `status` — Entity: **Bed**, with `status` looking like a property but worth checking whether it should instead be derived from current admissions (see Step 4).
- `inv_no`, `item_desc`, `qty`, `rate`, `amt` — Entity: **Invoice**, with **InvoiceLine** as the true grain, since one invoice number covers multiple billed items.

## Step 3: Decide entity versus property for the ambiguous ones

Two calls need a stated reason, because a domain expert will ask why you made them.

**Ward: entity or property of Bed?** Ward appears independently in `bed_master` (several beds share a ward) and could carry its own properties later (a ward's specialty, its infection-control class) that no single bed captures. Model it as an entity, linked from Bed, rather than a string property repeated on every bed row — the same "does this need its own identity" test as the ontology lesson's aircraft-component example.

**Clinician: entity keyed on a name string?** This is the assumption most likely to be wrong and worth flagging rather than silently accepting. `DR.RAO` is not a stable key — a real clinician table almost certainly has an employee id or registration number this export does not surface. Model Clinician as an entity, but flag its key as provisional.

## Step 4: Draft the links, and let the exports argue with each other

```yaml
# ontology.yaml — Arogya Hospital Group, draft from exports, unconfirmed
entities:
  Patient:
    properties: [pt_id]
  Admission:
    properties: [adm_id, adm_dt, disch_dt, dx_code]
  Ward:
    properties: [ward_cd]
  Bed:
    properties: [bed_id, bed_type, status]
  Clinician:
    properties: [name]           # PROVISIONAL — no stable id in any export seen so far
  Invoice:
    properties: [inv_no]
  InvoiceLine:
    properties: [item_desc, qty, rate, amt]

links:
  - {from: Patient, name: admitted_via, to: Admission}
  - {from: Admission, name: took_place_in, to: Ward}        # via ward_cd, not directly to a Bed
  - {from: Ward, name: contains, to: Bed}
  - {from: Admission, name: attended_by, to: Clinician}
  - {from: Admission, name: billed_via, to: Invoice}
  - {from: Invoice, name: itemised_as, to: InvoiceLine}
```

Notice what the exports themselves reveal: `admissions_export.csv` links an Admission to a `ward_cd`, not to a specific `bed_id`. There is no column anywhere connecting an admission to the actual bed a patient occupied. That is not a modelling choice, it is a genuine gap in the data you were given, and it belongs on the assumptions list, not silently patched over by assuming the first vacant bed in that ward was the one used.

Also notice the second admission for `P-3390` (`A-10043`) starts the day after the first one's discharge, in a different ward. Two admissions, same patient, four days apart, different wards. That could be a planned readmission, a transfer recorded as a new admission by the hospital's own convention, or a data artefact. It is exactly the kind of thing that a thirty-minute conversation resolves in one sentence and that guessing wrong on costs a rebuild.

## Step 5: Write the assumptions list

One page, for the CMO meeting. Every entry names the assumption, why you made it, and the one question that resolves it.

```
1. Ward is modelled as an entity separate from Bed. Confirm: does a ward carry
   its own attributes (specialty, infection class) that matter to this project?
2. Clinician is keyed on a display name (e.g. "DR.RAO"). This will collide if
   two attending physicians share a name. Confirm: is there an employee or
   registration id we should use instead?
3. No export links an Admission to a specific Bed, only to a Ward. Confirm:
   does another system track bed-level assignment, or is ward-level the
   correct grain for this project?
4. Two admissions for patient P-3390 four days apart, different wards.
   Confirm: is this a transfer, a readmission, or worth flagging as a
   data-quality issue?
5. bed_master.status ("occupied"/"vacant"/"maintenance") looks like a
   snapshot, not a history. Confirm: is there a system of record for bed
   status over time, or does this file only ever show "right now"?
```

## Definition of done

- `ontology.yaml` lists every entity found across all three exports, with each ambiguous entity-versus-property call resolved and briefly justified in a comment.
- Every link in the file is one you can point to a specific column or pair of columns in the source exports that supports it.
- The assumptions list has at least four items, each phrased as a single, answerable question — not a paragraph of hedging.
- You can explain, out loud, in under two minutes, why Ward is an entity and Clinician's key is provisional.

## How this could go wrong

**Presenting an inference as a fact.** The single biggest failure mode in this exercise is writing `attending_doc: employee_id` in the schema as if it were confirmed, when the export only gave you a name string. Everything you were not told directly belongs on the assumptions list, in the interrogative, not folded quietly into the model as though it were established.

**Modelling the export instead of the business.** `billing_export.csv` has one row per invoice line, which is real, but a hospital's actual billing entity model likely includes payers, insurance claims, and co-pay logic that this export never surfaces at all. State plainly, in the assumptions list, what the exports could not tell you anything about — an absence is itself a finding.

**Skipping the meeting because the model looks done.** A clean `ontology.yaml` with no open questions is a sign you stopped asking, not a sign you finished. The point of this exercise is to walk into the CMO's thirty minutes with sharp, specific questions that a domain expert can answer fast — not a finished artifact that turns out to be wrong in ways nobody catches until week six.
