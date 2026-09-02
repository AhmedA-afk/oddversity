---
title: "Modelling a hospital, a bank, a factory"
phase: data
module: domain-modelling
kind: lesson
summary: "The entity-property-link idea only proves itself against real domains. Here it is applied to a hospital network, a co-operative bank, and an aircraft manufacturer, using two real deployments as evidence for what a working model looks like at scale."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Sketch a working ontology for a hospital, a bank, and a manufacturing operation, each in under ten minutes.
  - Point to two real, large-scale deployments that were built on exactly this pattern.
  - Recognise the domain-specific link that each of the three industries gets wrong on a first pass.
artifact: An ontology sketch for a fourth domain of your choosing, reviewed against the three worked examples in this lesson.
sources:
  - "https://www.computerweekly.com/news/366645878/Palantir-Can-anyone-else-do-what-it-does"
  - "https://www.theforwarddeployed.io/engagements/airbus"
  - "https://www.palantir.com/docs/foundry/architecture-center/platforms"
---

The previous lesson gave you entities, properties, and links as concepts. This one applies them to three domains you will plausibly meet in the field, and grounds the pattern in two deployments where it ran at real scale: England's National Health Service, and Airbus's aircraft fleet.

## A hospital

England's NHS Federated Data Platform, a Foundry-based system built to connect data across NHS Trusts for patient flow, bed occupancy, theatre utilisation, waiting lists, and discharge, is modelled around an ontology of patients, beds, appointments, clinicians, and Trusts as linked objects. It runs under a seven-year, roughly £480m contract, and it has also been the subject of sustained political and public scrutiny, including freedom-of-information requests probing the rollout — worth knowing before you assume a well-modelled system is automatically an uncontested one. Public-sector health data carries stakeholder politics that a private-sector deployment often does not, and the model itself does not resolve that; it only makes the underlying questions askable.

A hospital-shaped ontology, sketched at the same grain:

**Entities:** Patient, Bed, Ward, Appointment, Clinician, Admission.

**Links worth naming explicitly:**

| From | Link | To | The judgment call |
|---|---|---|---|
| Patient | admitted_via | Admission | one admission event can span multiple beds over a stay |
| Admission | occupies | Bed | time-bounded — a bed link needs a start and end, not just "current" |
| Admission | attended_by | Clinician | many clinicians touch one admission; who is "the" treating clinician is itself a business rule |
| Bed | located_in | Ward | wards have specialty and infection-control implications a bed alone does not carry |

The link that trips up a first pass is `occupies`. Modelling "current bed" as a property on Patient (`patient.current_bed_id`) looks simpler and breaks the moment anyone asks "which beds were occupied last Tuesday at 3pm," a question every bed-occupancy dashboard eventually gets asked. The link needs its own time window, which means it is a link with properties (`occupied_from`, `occupied_to`), not a foreign key on Patient.

## A bank

Take a fictional example close to home: a co-operative bank running savings accounts, loans, and a member-shareholder structure that is different from a commercial bank's pure customer relationship.

**Entities:** Member, Account, Transaction, Branch, Loan.

**Links worth naming explicitly:**

| From | Link | To | The judgment call |
|---|---|---|---|
| Member | holds | Account | a member can hold several accounts, and co-operative banks often add joint holdings, which makes this a many-to-many, not a simple one-to-many |
| Account | posts | Transaction | append-only; a transaction is never edited, only reversed by a new transaction, the same append-only discipline as the bronze layer from the earlier module |
| Member | services_at | Branch | "home branch" is a property that changes rarely but does change, and old reports referencing a member's branch as of a past date need the historical value, not today's |
| Loan | secured_against | Account | a loan can be secured against a fixed deposit account, and that link is exactly what a fraud or risk query needs to traverse |

The link that trips up a first pass here is `holds`. Treating account ownership as one member per account is the assumption that breaks first, because joint accounts, nominee structures, and business accounts held by a member's proprietorship firm are all common in Indian retail and co-operative banking, and a model that cannot represent "two members hold one account" will need a rebuild the first time a joint-account report is requested.

## A factory (and a fleet)

Airbus's Skywise platform, built with Palantir starting inside A350 production in 2015 and launched publicly in 2017 as an open aviation data platform for predictive maintenance and fleet health, is the clearest real-world case of this pattern applied to a manufacturing and operations domain, and it reports close to 12,000 connected aircraft as of a 2026 company statement. The Forward Deployed Engineers on that account worked the final assembly line in Toulouse, including air-gapped environments, which is its own lesson for later in this path — but the modelling problem underneath it is the same three concepts as the hospital and the bank.

**Entities:** Aircraft, Component, MaintenanceEvent, WorkOrder, Operator.

**Links worth naming explicitly:**

| From | Link | To | The judgment call |
|---|---|---|---|
| Aircraft | composed_of | Component | components are swapped over an aircraft's life, so this link needs history, not a static bill of materials |
| Component | underwent | MaintenanceEvent | the same physical part can move between aircraft after a repair, which means maintenance history belongs to the component, not just the aircraft it happens to sit in today |
| MaintenanceEvent | generated | WorkOrder | one inspection can generate several work orders across different systems |
| Aircraft | operated_by | Operator | this is the link Skywise had to get right for the platform to work at all: competing airlines needed confidence that their operational data was isolated from each other while still contributing to shared fleet-wide reliability insight |

That last link is the one worth sitting with. A part-tracking model that ties a component permanently to the aircraft it was first installed on will silently corrupt maintenance history the first time a part is removed, repaired, and reinstalled on a different tail number — which happens constantly in fleet maintenance. The fix is modelling `Component` as an entity independent of any one `Aircraft`, with its own maintenance history, linked to whichever aircraft it currently sits in.

## What the three domains have in common

Across all three, the mistake that recurs is the same one: collapsing a link that needs history or shared ownership into a simple property, because a property is faster to write on day one. A `current_bed_id`, a single `owner_member_id`, a fixed `aircraft_id` on a component: each one works in a demo and breaks against a real question three weeks later. The fix is always the same — ask "can this relationship change over time, or be shared by more than one," before you decide whether it is a property or a link, because that one question is what the rebuild avoids.

## What you can now do

You can sketch a working ontology for a hospital, a bank, or a manufacturing operation in the time it takes to have the conversation with the right domain expert, and you can point to two deployments — one public-sector, one industrial, both built on this exact pattern at real scale — as evidence that the discipline is worth the morning it costs. The lab that follows this lesson asks you to do this from exports alone, with no domain expert in the room, which is closer to what the first week of a real engagement actually feels like.
