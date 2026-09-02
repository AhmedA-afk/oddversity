---
title: "Capstone 05: the hospital operations ontology (after the NHS platform)"
phase: practice
module: capstones
kind: capstone
summary: "Rebuild the shape of Palantir's NHS Federated Data Platform: an ontology of patients, beds, appointments and clinicians as linked objects, with role-based views so a ward nurse, a bed manager and a trust executive see different slices of the same model. This capstone has no language model in it. The eval is whether the ontology answers questions faster and more accurately than the spreadsheet it replaces, and the guardrail is who is allowed to see what."
duration: "3 weeks"
updated: "2026-09-02"
outcomes:
  - Model a multi-site hospital operation as entities, properties and links, and explain the model back to a clinician who has never heard the word ontology.
  - Build role-based views over the same underlying model so a nurse, a bed manager and an executive each see only what their role permits.
  - Score the ontology against the spreadsheet baseline it replaces, using real operational questions and a stopwatch, not a language-model eval.
artifact: A repository containing the ontology schema, the loaders, the three role-based views, the deployed service, a first-person write-up, a recorded walkthrough, and a generalise-vs-one-off memo.
sources:
  - "https://www.computerweekly.com/news/366645878/Palantir-Can-anyone-else-do-what-it-does"
  - "https://corporatewatch.org/foi-requests-reveal-palantirs-nhs-fdp-rollout-failures/"
---

## Read this before you start: what this capstone is not

The other four capstones in this module build something with a language model in it and an eval that scores model output. This one does not. Palantir's NHS Federated Data Platform build is, at its core, a data-modelling and access-control problem: connect operational data across hospital trusts so that patient flow, bed occupancy, theatre utilisation and discharge status are visible as one linked model instead of as separate exports nobody can join. Nothing in the public description of the platform requires a model to generate text. If you find yourself reaching for an LLM to "summarise the ontology" or "answer questions about beds," you have wandered off this capstone; put it back for a later project and build the ontology and the views instead.

## The public case, and what is actually known about it

Palantir's NHS Federated Data Platform is a Foundry-based system connecting data across NHS trusts in England for patient flow, bed occupancy, theatre utilisation, waiting lists and discharge. The contract is publicly reported as £480 million over seven years. The underlying model is an ontology: patients, beds, appointments, clinicians and Trusts represented as linked objects rather than as rows in separate systems that have to be joined by hand each time someone asks a cross-cutting question.

What is solid: the contract value and duration, and the shape of the model — entities and links, not a single monolithic database. What is contested, and worth reading before you build anything modelled on it: the rollout has drawn criticism grounded in Freedom of Information requests, covering both the pace of adoption across trusts and public concern about a single vendor holding a federated view of NHS operational data. This is not a detail to skip past. A platform that connects sensitive data across previously separate organisations creates governance questions before it creates value, and those questions are part of what an FDE on a project like this has to be able to speak to, not just the engineering.

## The customer stand-in

**Nilgiri Health Network.** A fictional chain of six mid-sized hospitals across three Indian states, run as separate operational units that each keep their own bed and admissions spreadsheet, updated by hand at shift changes. No one at the network level can currently answer "how many ICU beds are free across all six sites right now" without phoning each site.

Three roles you build views for, each with a different stakeholder in mind. **Ward nurses** need their own ward's bed status and their own patients, nothing more. **Site bed managers**, one per hospital, need their site's full bed and admissions picture, plus a read-only view of aggregate (not patient-level) occupancy at the other five sites, so they know where to route a transfer. **Priyanka Deshmukh**, the network's chief operating officer, needs cross-site aggregate metrics — occupancy, average length of stay, discharge delays — with no patient-level detail at all, because her job is capacity planning, not clinical care, and she should not be able to see a named patient's diagnosis even by accident.

Nilgiri's constraint, which stands in for the governance question the NHS case raises: no data leaves a site's own database. The ontology is a query layer over each site's existing system, not a copy of six hospitals' patient records into one warehouse. That constraint should shape your design from the start, not get bolted on afterward.

## The data pack

Six sites, each with its own export format, deliberately inconsistent, because that is what "six spreadsheets kept by six different people" actually looks like.

```python
import json, random, csv

random.seed(9)
SITES = ["ngr-a", "ngr-b", "ngr-c", "ngr-d", "ngr-e", "ngr-f"]
WARDS = ["ICU", "General", "Maternity", "Paediatrics", "Surgical"]

def bed(site, i):
    return {
        "bed_id": f"{site}-B{i:03d}",
        "ward": random.choice(WARDS),
        "status": random.choices(["occupied", "free", "cleaning"], weights=[7, 2, 1])[0],
        "site": site,
    }

def patient(site, i):
    return {
        "patient_id": f"{site}-P{i:04d}",
        "bed_id": f"{site}-B{random.randint(0, 39):03d}",
        "admitted": f"2026-08-{random.randint(1,28):02d}",
        "expected_discharge": f"2026-09-{random.randint(1,20):02d}",
        "clinician_id": f"{site}-C{random.randint(1,12):02d}",
    }

for site in SITES:
    beds = [bed(site, i) for i in range(40)]
    with open(f"{site}_beds.json", "w") as f:
        json.dump(beds, f, indent=2)
    # one site exports CSV instead of JSON, on purpose
    if site == "ngr-c":
        with open(f"{site}_patients.csv", "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["patient_id", "bed_id", "admitted", "expected_discharge", "clinician_id"])
            w.writeheader()
            for i in range(30):
                w.writerow(patient(site, i))
    else:
        patients = [patient(site, i) for i in range(30)]
        with open(f"{site}_patients.json", "w") as f:
            json.dump(patients, f, indent=2)
```

Six sites, one of them exporting CSV where the rest export JSON, and no shared ID scheme across sites beyond the site prefix. That mismatch is the actual content of the capstone; a clean, uniform dataset would teach nothing about what this job is.

## The eval, before anything else

This capstone still has a hard gate on this line, exactly as the other four do. The eval here has two parts and neither involves a language model.

**Part one: the question set, scored against a baseline.** Fifteen real operational questions Priyanka or a bed manager would actually ask: "how many ICU beds are free right now, across all sites," "which patients at site ngr-c are past their expected discharge date," "what is average length of stay this month at ngr-b, ICU ward only." For each, write the gold answer by hand against the raw exports — this is tedious on purpose, because it is also the baseline. Time yourself doing it by hand, the way a Nilgiri analyst does today. That time is your baseline number.

**Part two: the access-control set.** For each of the three roles, a list of questions that role should be able to answer and a list it should not — a ward nurse asking for another ward's patient list, a bed manager asking for a named patient's diagnosis at another site, the COO asking for anything patient-level anywhere. This is the leak-rate gate from Capstone 01, restated for an ontology instead of a retrieval system: it must be zero.

**The scorer.**

- **Answer correctness**, against your hand-computed gold answers, for the question set run through the ontology's query layer.
- **Time-to-answer**, ontology versus your own by-hand baseline, on the same fifteen questions.
- **Cross-role leak rate.** Any question from the access-control set that returns data outside its role's permitted scope. Gate: must be zero.

## The build, in stages

**Stage 1: the ontology schema.** Define entities — `Patient`, `Bed`, `Ward`, `Site`, `Clinician` — with their properties, and the links between them: a `Patient` occupies a `Bed`, a `Bed` belongs to a `Ward`, a `Ward` belongs to a `Site`, a `Patient` is treated by a `Clinician`. Write this down as a diagram and a short prose description before you write a line of loader code, and rehearse explaining it out loud in under two minutes — you will need to give this exact explanation to a clinician who has never heard the word ontology, and if it takes you ten minutes to say, it is not ready.

**Stage 2: the loaders, one per site's export shape.** Each site's loader normalises its own format — JSON here, CSV at `ngr-c` — into the common entity schema. This is where the empty-date-column, mismatched-ID-scheme reality of enterprise data actually bites; expect at least one loader to fail on a malformed row and handle it by logging and skipping, not by crashing the whole load.

**Stage 3: the query layer.** A thin API over the linked model that answers the fifteen questions by traversing entities and links — a bed's ward, a ward's site, a patient's bed — rather than by re-joining six raw exports by hand each time. This is the actual value of the ontology: the join logic is written once, here, instead of by every analyst who asks a question.

**Stage 4: the three role-based views.** Three API surfaces (or three simple internal pages) reading from the same underlying model: the nurse's view scoped to one ward's patients, the bed manager's view scoped to their own site's patient-level data plus every site's aggregate occupancy, and the COO's view scoped to aggregate metrics across all sites with no patient-level field ever present in the response, enforced in the query, not filtered out after the fact in the UI.

```python
def coo_occupancy(conn):
    # aggregate only — no patient_id, no clinician_id, no bed-level detail
    return conn.execute("""
        SELECT site, ward, COUNT(*) FILTER (WHERE status = 'occupied') AS occupied,
               COUNT(*) AS total
        FROM beds GROUP BY site, ward
    """).fetchall()
```

## The deployment target

A container behind a private subnet, one query API and three role-scoped endpoints, backed by a database that holds the normalised ontology, not the raw per-site exports. No cross-site patient data leaves its originating site's schema boundary inside the database — the query layer, not a shared table, is what makes it look unified. OIDC login binding the authenticated user to a role, checked at the query layer for every request.

**Rollback.** `ONTOLOGY_API_ENABLED=false`, reverting every role to the manual per-site export process Nilgiri runs today. Because nothing here writes back to a source system — this is a read model — rollback has no in-flight-work problem the other capstones have to solve, and that is worth stating plainly in your write-up as a real difference from an agent that takes actions.

## Guardrails, and where they live

One module, `access.py`, containing the three role-scope predicates as pure functions, and nothing else. Test it directly: construct a bed-manager query for another site's patient-level data and assert it is rejected before it reaches the database, not filtered out of the response afterward. Construct a COO query and assert no code path can return a `patient_id` field, by checking the response schema itself rather than trusting the query author remembered to leave it out.

## The adoption plan

- **Weeks 1 to 2, shadow.** Bed managers at two sites use the ontology's query layer alongside their spreadsheet, and log every case where the two disagree.
- **Week 3, one metric.** Time-to-answer on the fifteen-question set, self-timed by an actual bed manager, against their own baseline from week one.
- **The governance conversation, in week one, not week three.** Before any site's data is connected, Priyanka and each site's medical records officer get the access-control test suite and the answer to the question the NHS case raises in public: exactly what can a person in each role see, and can you point at the file that enforces it. Do this the way Dale's compliance review works in Capstone 01 — a live demonstration, not a slide.
- **The kill date.** End of week 3. If bed managers are not faster than their own spreadsheet baseline, the honest conclusion is that the ontology did not earn its complexity for this use case, and you write that down.

## The memo

**Specific to Nilgiri:** the six sites' mismatched export formats, the specific ward taxonomy, the CSV loader for `ngr-c`.

**Any three customers would need:** the entities-properties-links schema pattern, the role-scoped query-layer design, the by-hand-baseline eval method, the "no cross-site copy, query federates instead" architecture.

**Should be configuration, not code:** which fields each role can see, the specific entity properties tracked, the aggregation window for the COO view.

Recommend, with a cost: the schema pattern and the role-scoping approach generalise cleanly to a second hospital network or, with different entities, to a bank's branch network or a logistics fleet — the ontology idea is domain-general by design. What does not generalise is the specific governance answer you gave Priyanka's medical records officer, which has to be renegotiated with every new customer's own data-protection posture, DPDP Act obligations included.

## Grading applied

| Line | Weight | What the grader opens |
|---|---|---|
| Eval before build (baseline questions + access-control set) | 20 | `eval/questions.md` with your hand-computed gold answers and timings, `eval/access-control.jsonl`, predating the query layer in the git log |
| Deployed off your laptop | 20 | Deploy script, private-subnet database, OIDC login binding user to role, health endpoint |
| Measured result | 15 | Correctness against gold answers, time-to-answer versus your by-hand baseline, cross-role leak rate at zero |
| Guardrails and rollback | 15 | `access.py`, the rejected-query test, the schema-level check for patient fields in the COO view, rollback recording |
| Adoption plan | 10 | The three-week plan, the governance conversation held in week one, the metric, the kill date |
| Write-up | 10 | First person, your own timings, the loader failure you actually hit, NHS FDP contract figures cited as publicly reported, not treated as your own result |
| Walkthrough | 5 | Six minutes: a cross-role query being rejected, then a same-role query answered correctly |
| Memo | 5 | Three columns and a costed recommendation |

Time yourself answering the fifteen questions by hand before you write a line of the schema. That number is the only reason anyone would pay for what you are about to build.
