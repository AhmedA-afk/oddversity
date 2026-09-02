---
title: "Drill 02: the hospital discharge delays"
phase: practice
module: decomposition-drills
kind: drill
summary: A hospital group wants a model that predicts tomorrow's discharges so it can plan beds. Forty-five minutes to discover that the prediction already exists in a consultant's head and that nobody owns the decision it would feed.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Ask who owns a decision before designing anything that produces an input to it.
  - Distinguish a prediction problem from a coordination problem.
  - Name the handoff that no single stakeholder is measured on.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Sanjeevani Health Network runs six hospitals in and around Coimbatore, about 1,400 beds in total, a mix of cash, insurance and state scheme patients. You are two days into the engagement. The Group COO frames it:

> "Our occupancy looks like 92 percent but we turn away admissions every single day, and then at 6pm half the ward empties. We need a model that predicts which patients will be discharged tomorrow. Give the bed manager a list every morning and we can schedule admissions against it. Everyone we spoke to says this is a machine learning problem."

You are handed a CSV extract from the hospital information system: 90,000 admission records with admit datetime, discharge datetime, ward, consultant code, primary diagnosis code, payer type and a `discharge_type` field that is null in about 40 percent of rows.

## The room

**Rajiv Menon, Group COO.** Sponsor.

> "Every bed-day I lose is revenue I do not get back. If you can tell me at 8am how many beds free up today, my admissions desk can fill them."

**Dr. Latha Subramanian, Group Medical Director.** Speaks for the consultants.

> "I want to be very clear. A consultant decides when a patient goes home, on clinical grounds, after seeing the patient. I am not going to have a screen telling my doctors they are late. If this becomes a scoreboard, my consultants will stop entering anything into the system, and then you will have no data at all."

**Sister Anjali Thomas, Nursing Superintendent, flagship hospital.** She was not on the invitation; she came anyway.

> "The doctor tells me at nine in the morning that the patient is going home. Then we wait. The insurance desk sends the final bill to the TPA and we wait for approval. Pharmacy takes back the unused medicines. Housekeeping comes when they come. The patient leaves at seven in the evening. Nobody is waiting for a prediction. We already know."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The prediction is not missing. The treating consultant knows by mid-morning, and the nursing station usually knows within an hour of that. What is missing is anyone who owns the interval between "the doctor said yes" and "the bed is available".

That interval contains four handoffs, each owned by a different function, none of them measured on it. The insurance desk sends a final claim to the third-party administrator and waits for cashless approval, which typically comes back in the afternoon because the desk batches submissions after the morning consultant rounds finish. Pharmacy reconciles and takes back unused medicines. Billing produces a final bill only after pharmacy closes the file. Housekeeping turns the bed around on its own rota. The bed manager finds out a bed is free when a nurse phones her.

The `discharge_type` nulls are not random. They are the rows where the discharge was recorded from the ward terminal instead of the billing terminal, which means your one apparent label is entangled with which system entered the row.

The COO's occupancy figure and the actual availability figure are different measurements. Occupancy counts a bed as occupied until the discharge is recorded in the system, which happens after billing, which is hours after the patient physically left.

And Dr. Subramanian's objection is the load-bearing one. Any product that appears to grade consultants on discharge timing will lose the data source it depends on.

## What a strong decomposition covers

- **Who owns the decision, asked explicitly and early.** The clinical decision belongs to the consultant and is not yours to influence. The bed-release decision belongs to nobody, which is the finding.
- **The re-framing.** This is not a prediction problem, it is a coordination and instrumentation problem. You will get pushback for saying so; say it anyway, with the interval measured.
- **A metric that is not occupancy.** Median minutes from "discharge advised" to "bed available for the next patient", broken down by the four handoffs. Nobody currently has this number, which is why nobody is accountable for it.
- **The measurement problem before the fix.** "Discharge advised" is not a timestamped event anywhere today. Your first component creates it, cheaply, without adding work: one tap on the ward tablet by the nurse who is already at the bedside.
- **The data, and how it lies.** Discharge timestamps are billing events, not physical events. The null pattern in `discharge_type` is a system artifact. Payer type predicts delay far more than diagnosis does, and that fact points at the TPA queue rather than at medicine.
- **The decomposition.** Event capture at the ward. Handoff timing dashboard. TPA submission batching. Housekeeping dispatch triggered by an event rather than a phone call. Only then, if at all, anything predictive.
- **The walking skeleton.** One ward, two weeks, a tablet tap and a shared board that shows the four handoffs for the twelve patients discharging today. No model.
- **The political design.** The board shows the process, never the doctor. Aggregate by ward, never by consultant code. Tell Dr. Subramanian that in her own terms and let her check the screen before it ships.

## A model 45 minutes

- **0 to 8.** Walk me through one patient going home yesterday, minute by minute, from the ward round. Who tells whom? What happens when the TPA approval is slow?
- **8 to 15.** Menon's revenue per bed-day, Subramanian's consultant autonomy, Thomas's ward reality, and the insurance desk and housekeeping who are not in the room and should be.
- **15 to 23.** What the timestamps actually mean, the null pattern, and the absence of a "discharge advised" event.
- **23 to 33.** Instrument, then coordinate, then predict, in that order, with the reason for the order.
- **33 to 40.** One ward, one tap, one board.
- **40 to 45.** Risks: the consultants disengage, the TPA is outside your control, housekeeping is on a contract you cannot change. What you will not build: anything that scores a named clinician.

## The trap in this one

**Not asking who owns the decision.** The brief asks for a prediction, and a prediction is a satisfying thing to build. You can build it. It will be reasonably accurate, because length of stay by diagnosis and payer is not a hard problem. It will then produce a list every morning that lands on a bed manager who cannot make any of the four downstream owners move faster, and within a month nobody opens it.

An output with no owner is a report, and reports die quietly. Before you design anything that produces information, ask the question in its blunt form: **when this system says something, who is expected to do what, and what happens to them if they do not?** If there is no answer, the first component of your build is creating the owner, not creating the output.

The related failure is treating a coordination problem as a modelling problem because modelling is the part you know how to do.

## The rubric, applied

A weak attempt spends the session on features, label leakage and a target accuracy, and produces a plan for a discharge-prediction model with a morning report. It scores 1/1/1/2/0, and the zero on criterion 5 is because the plan has no route to anyone acting on the output.

A pass finds the interval, names the four unowned handoffs, proposes measuring before predicting, protects the consultant relationship deliberately, and says out loud that the model in the brief may never be needed. That is 3/3/3/2/3.

The three-mark move on criterion 1 is Sister Thomas's sentence. If your questions are good, someone in the room gives it to you in the first ten minutes. If your questions are about data schemas, nobody does.
