---
title: "SOC 2, HIPAA, FedRAMP, RBI, DPDP: what each changes for you"
phase: deploy
module: compliance-security-procurement
kind: lesson
summary: "Five compliance regimes, five different sets of architectural constraints. This page is not legal advice and none of it substitutes for reading the current text: it is the level an FDE needs to walk into a scoping call and know which questions the customer's security and legal teams are about to ask."
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Name the architectural change each regime forces, not just its acronym.
  - Predict, from a customer's industry and geography, which one or two regimes will drive the security review.
  - State clearly, without inventing a clause number, why RBI-regulated and DPDP-covered engagements need a compliance specialist and not just an FDE's general knowledge.
sources:
  - https://vinvashishta.substack.com/p/what-skills-do-you-need-to-get-a
---

None of these regimes are software features. They are constraints a customer's legal and security teams impose on your architecture before you write a line of code, and the mistake that costs the most time in a compliance-heavy engagement is treating them as a checklist to satisfy after the build rather than a set of decisions that shape the build. Vin Vashishta, who has hired FDEs for years, lists "domain and enterprise fluency" — naming SOC 2, HIPAA and FedRAMP specifically — as one of six core competencies the role requires. This page gives you that fluency at the level an FDE needs it: what each regime changes architecturally, not the legal text itself.

**Standing caveat, true of every section below: this is a working-knowledge summary, not a legal opinion, and every regime here changes over time. Before an engagement, read the current text or bring in someone whose job that is. Do not answer a compliance question from memory when the current published text is one search away.**

## SOC 2

SOC 2 is an audit report, not a law. An independent auditor examines a vendor's controls against the AICPA's Trust Service Criteria and issues an opinion. **Security** is the only mandatory criterion; **Availability, Processing Integrity, Confidentiality,** and **Privacy** are added at the vendor's discretion depending on what it sells.

A **Type I** report says the controls existed and were designed correctly on a single date. A **Type II** report says the controls operated effectively over a period, typically several months. Customers doing real diligence ask for Type II; a Type I report is a starting point, not proof of anything ongoing.

What it changes architecturally:

- **Audit logging with defined retention.** Every privileged action needs a durable, tamper-evident log, not a log that rolls off after a week.
- **Formal change management.** A pull request merged by one person with no review is a control gap. The auditor wants evidence of a second set of eyes on production changes.
- **Access reviews on a cadence.** Someone has to periodically confirm that the list of people with production access still matches the list of people who should have it, and that this review actually happened, with evidence.
- **A written incident response plan**, exercised, not just filed.
- **Vendor risk management.** If your product calls a third-party model API, that provider becomes part of your own SOC 2 boundary story, and the customer's reviewer will ask what due diligence you did on it.

## HIPAA

A US federal law covering **Protected Health Information (PHI)** held by covered entities and their business associates. If your product touches PHI on behalf of a healthcare customer, you almost certainly need a signed **Business Associate Agreement (BAA)** before any PHI reaches your system, and every subprocessor that touches that data — your cloud provider, your model API, your logging vendor — needs one too, or needs to be kept structurally away from PHI entirely.

What it changes architecturally:

- **Minimum necessary.** Access and even data collection should be scoped to what a given workflow actually needs, not everything the source system has.
- **Encryption in transit and at rest**, expected in practice even where the rule text treats it as an "addressable" rather than strictly mandatory specification.
- **Unique user identification and audit controls.** Every access to PHI needs to be attributable to a specific person, logged, and reviewable.
- **Automatic logoff and session controls** on anything a clinician or staff member is logged into.
- **Breach notification obligations** with defined timelines if PHI is exposed.
- **De-identification, if you can get away with it.** A system built on de-identified data under HIPAA's safe-harbor or expert-determination standards sidesteps most of the above, and is worth pushing for in scoping if the workflow allows it.

## FedRAMP

A US federal government authorization framework for cloud services, built on the NIST 800-53 control catalogue, with baselines scaled to risk level (Low, Moderate, High). Getting a product to a FedRAMP-authorized state is a long, expensive process involving a defined **authorization boundary**, a sponsoring agency or the FedRAMP program office, continuous monitoring after authorization, and typically FIPS-validated cryptography.

What it changes architecturally, from an FDE's seat:

- **You will almost certainly deploy inside infrastructure that is already authorized** — a GovCloud region, an already-authorized platform — rather than seeking new authorization for one engagement. Check what the contract actually requires before assuming otherwise.
- **The authorization boundary constrains what you can add.** A new third-party service, including a model API, may need its own review before it enters that boundary.
- **Continuous monitoring is not a one-time audit.** Expect recurring scans, recurring evidence submission, and a POA&M (plan of action and milestones) process for any finding.
- Most FDEs never personally drive a FedRAMP authorization; the practical skill is recognizing when a requirement is FedRAMP-shaped and routing it to the people who own that process.

## RBI outsourcing and IT guidance (Indian banks and NBFCs)

The Reserve Bank of India regulates how banks and NBFCs may outsource IT and other functions, including to a technology vendor deploying inside their environment. This section stays at the level of what changes architecturally and organisationally, because the specific master directions and circulars are updated by RBI over time. **Check the current RBI master direction on outsourcing of IT services before an engagement, not this page.**

What tends to be true, at the principle level, in a scoping call with an Indian bank or NBFC:

- **A board-approved outsourcing policy governs the engagement**, and material outsourcing typically requires internal risk assessment and sign-off before the vendor is engaged, not after.
- **The regulator retains a right to access and inspect** the outsourced arrangement, including systems and records held by the vendor, so your architecture needs to support that inspection, not just the customer's own review.
- **Business continuity and an exit plan are expected artifacts.** The bank has to be able to show it could move away from your system without an unmanaged gap, which shapes decisions like data portability and avoiding lock-in.
- **Data handling expectations are stricter than a typical enterprise's**, and this is an area where the specific rules move; confirm current requirements rather than assuming last year's understanding still holds.

Take one thing from this section: an RBI-regulated engagement is not something an FDE navigates from general knowledge. Bring in the customer's compliance team early, ask them to state the requirement in their own words, and treat their answer as authoritative over your assumptions.

## DPDP (India's Digital Personal Data Protection Act, 2023)

India's cross-sector personal data protection law, structured around **consent** as the primary lawful basis for processing, with the customer or vendor holding data as a **data fiduciary** and the individual as a **data principal**. Enacted in 2023; its detailed rules and implementation timeline have continued to develop since, so verify any specific compliance deadline against current published rules rather than assuming it.

What it tends to change architecturally, at the principle level:

- **Purpose limitation.** Data collected for one stated purpose should not silently get reused for another inside your pipeline — a common failure when a retrieval system built for one workflow gets pointed at a second without re-checking consent scope.
- **Data principal rights**, including access to what is held and correction or erasure, which means your data model needs some way to locate and act on all records tied to one individual, not just query them for a report.
- **Significant Data Fiduciary obligations.** Entities the government designates as handling data at scale or sensitivity face extra obligations — a data protection officer, audits, impact assessments — so ask early whether this designation applies.
- **Breach notification** to the regulatory board and to affected individuals.
- **Constraints on cross-border data transfer**, still being clarified in implementing rules as of this writing — confirm the current position for any engagement moving data outside India.

## The quick-reference table

| Regime | Who it covers | What it forces architecturally | Typical artifact you produce |
|---|---|---|---|
| SOC 2 | Any vendor being diligenced by an enterprise buyer | Audit logging, change management, access review cadence, incident response plan | A completed questionnaire mapped to your own controls, sometimes your own SOC 2 report |
| HIPAA | US healthcare PHI | BAAs on every subprocessor, minimum necessary access, encryption, audit trails, breach notification | A signed BAA, a data flow diagram showing where PHI lives and does not |
| FedRAMP | US federal government cloud services | Authorization boundary, NIST 800-53 controls at a risk baseline, continuous monitoring | Usually: deployment inside already-authorized infrastructure, not a new authorization |
| RBI outsourcing/IT guidance | Indian banks and NBFCs | Board-approved outsourcing policy, right-to-audit access, business continuity and exit plan | An outsourcing risk assessment, a BCP/exit plan document |
| DPDP | Any processor of Indian residents' personal data | Consent-scoped purpose limitation, data principal rights (access/correct/erase), breach notification | A consent and purpose map, a data principal request-handling process |

## The FDE point

You are not the compliance officer, and pretending to be one in front of a customer's actual compliance officer is how trust gets lost in the first meeting. What you owe the room is architectural literacy: hearing "we're a co-operative bank, this needs to go through our outsourcing committee" and understanding immediately that means a board-level sign-off cycle, not a delay you can route around with a good demo. The next lesson turns this literacy into the specific questions a security questionnaire will actually ask.
