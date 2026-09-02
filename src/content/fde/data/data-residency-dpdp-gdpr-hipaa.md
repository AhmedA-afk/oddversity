---
title: "Data residency: DPDP Act, GDPR, HIPAA, and what each changes"
phase: data
module: identity-permissions-residency
kind: lesson
summary: "Three different legal regimes shape where data can live and how it must be handled: India's DPDP Act, the EU's GDPR, and US healthcare's HIPAA. This lesson gives you the principles each rests on and the design questions they force, not the fines or deadlines, which change and must be checked at the time you need them."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Explain, in plain language, what consent, purpose limitation, and a data fiduciary's duties mean under India's DPDP Act.
  - State how GDPR and HIPAA differ from DPDP in scope and mechanism, at the level of principle.
  - Ask the right question of a customer's legal or compliance team before designing a data flow, instead of guessing at a rule.
artifact: A one-page data flow diagram (in Markdown, not an image) for your current project, annotated with which regime applies to each hop and what it requires.
---

Read this lesson as a map of the concepts, not a citation of current rules. Data protection law is one of the fastest-moving areas you will touch as an FDE, and specific obligations, deadlines, and penalty amounts change as rules are notified, amended, and litigated. Anything you need to state as a hard fact to a customer — a deadline, a penalty figure, whether a rule is currently in force — you check against the regulator's own current publication, not against this lesson or your memory. What follows is the level this lesson can responsibly promise: the principles each regime rests on, and the design questions that follow.

## Why this belongs in the data phase and not later

Every connector, every ontology, every permission model you have built in this module moves or exposes personal data. The residency and privacy rules do not sit on top of that work as a final compliance check — they shape decisions you make on day one, like whether a pipeline can run in a customer's on-prem environment versus a cloud region, whether a labelled eval set (like the one you will build in the AI phase) can leave the customer's network, and whether an OCR pipeline processing scanned documents needs to keep its output inside a specific jurisdiction. Ask about the applicable regime before you design the flow, not after you have already built it one way.

## India: the Digital Personal Data Protection Act, 2023

The DPDP Act is India's first comprehensive personal data protection statute, enacted in 2023. Its rules and their notification and implementation timeline have continued to develop since — check the Ministry of Electronics and Information Technology's current publications for what is actually in force when you need to know, not this lesson.

The principles worth carrying into design work:

- **Consent is the primary lawful basis for processing personal data**, and it must be free, specific, informed, and given for a stated purpose, with the ability to withdraw it. A "consent manager" concept exists in the Act's framework for handling this at scale. A data flow you build should be able to point to what consent basis covers each piece of personal data it touches, and should not assume that data collected for one purpose is fair game for a new one.
- **Purpose limitation** follows directly: personal data collected for a specified purpose should be processed only for that purpose, or one the person would reasonably expect. An eval set built from support tickets, repurposed to train a model for an unrelated feature, is exactly the kind of reuse this principle puts a question mark over — the question to ask is who approved that specific purpose.
- **Data fiduciaries** (the Act's term for whoever determines the purpose and means of processing, roughly analogous to a "data controller" elsewhere) carry duties: reasonable security safeguards, breach notification, and accountability for data processed on their behalf, including by a processor like you or the platform you are deploying.
- **Cross-border transfer is governed by government notification, not a blanket localisation requirement.** The Act's general approach permits transfer of personal data outside India except to countries the government specifically restricts by notification, rather than requiring all data to stay within India by default or requiring a case-by-case adequacy assessment for every destination. This is a materially different mechanism from GDPR's: the default is permissive, subject to a specific, government-maintained restriction list — and that list, like everything else here, is checked at the time, not assumed.
- **Sensitive categories and children's data get extra weight** in the Act's framework, though the specific mechanics are the kind of implementation detail worth confirming currently rather than assumed.

The practical design question this lesson leaves you with: for any personal data your pipeline touches, can you name the purpose it was collected for, the consent basis, and whether it is leaving India — and if so, whether that destination is one the current framework restricts?

## The European Union: GDPR

The General Data Protection Regulation predates DPDP by several years and has shaped how most global privacy frameworks, DPDP included, are structured. Its core mechanism differs from DPDP's in a way worth knowing precisely: GDPR requires that any transfer of personal data outside the EU/EEA rely on a specific legal mechanism — an adequacy decision (the European Commission has formally decided a destination country's protections are equivalent), Standard Contractual Clauses (standard contractual data-protection commitments between exporter and importer), or Binding Corporate Rules (an approved internal framework for one corporate group) — rather than a general notification-based restriction list. GDPR's default posture toward cross-border transfer is closer to "restricted unless a specific mechanism applies," where DPDP's is closer to "permitted unless specifically restricted."

GDPR's other principles will look familiar from the DPDP summary above, because DPDP was built with awareness of it: lawful basis for processing (consent is one of several, not the only one — legitimate interest and contractual necessity are others GDPR recognises), purpose limitation, data minimisation, a right to erasure, and accountability obligations including, for many organisations, a designated Data Protection Officer. GDPR also carries a well-known reputation for large penalties; this lesson deliberately does not state a figure, because getting it wrong in either direction is worse than pointing a customer to the regulation's current text.

If a deployment touches any EU resident's personal data, treat GDPR as in scope regardless of where your customer or infrastructure sits physically — this extraterritorial reach is one of GDPR's defining, stable features, and it is why an Indian company serving European customers can be subject to both DPDP and GDPR at once.

## The United States: HIPAA

The Health Insurance Portability and Accountability Act governs a narrower slice than DPDP or GDPR — protected health information (PHI) handled by "covered entities" (health plans, healthcare providers, healthcare clearinghouses) and their "business associates" (any vendor, including an FDE's employer, that handles PHI on a covered entity's behalf under a signed Business Associate Agreement). If you are building a system that touches PHI for a US healthcare customer, you are very likely operating as, or on behalf of, a business associate, and the BAA is the document that defines what you may do with the data before you touch a single record.

The principle worth carrying forward: HIPAA's Privacy Rule constrains use and disclosure of PHI around a **minimum necessary** standard — access and disclosure limited to what the specific purpose needs — the same discipline as the row-level security lesson earlier in this module, applied by regulation rather than architectural choice. Its Security Rule requires administrative, physical, and technical safeguards: encryption, access logging, and the permission-aware retrieval patterns covered elsewhere in this phase and the next.

Unlike DPDP and GDPR, HIPAA is not primarily a residency or cross-border transfer statute — it does not itself dictate that PHI must stay within the US — but the BAA and the covered entity's own risk posture very often impose residency and vendor-location requirements as a matter of contract, even where the statute itself is silent. Ask the customer's compliance team, specifically, whether their BAA restricts where PHI may be processed or stored; the answer is a contractual fact, not a HIPAA fact, and conflating the two is a common, avoidable mistake.

## The design questions that follow from all three

Regardless of which regime applies, the questions a data flow needs to answer are the same shape:

1. What personal or sensitive data does this flow touch, and under what stated purpose was it originally collected?
2. What is the lawful basis (consent, contract, legitimate interest, statutory duty) for this specific use?
3. Does any hop in this flow cross a jurisdictional boundary, and if so, what mechanism — a notification-based permission, an adequacy decision, a contractual clause, a BAA term — covers that specific transfer?
4. Who, by name and role, on the customer's side owns the answer to the first three questions, so that the answer is confirmed rather than assumed?

That fourth question is the one FDEs skip under deadline pressure, and it is the one that protects you. "I assumed it was fine to send the eval set to the model provider's API" is not a defensible position in a regulated account. "I confirmed with the customer's DPO that this specific transfer is covered under X, in writing, on this date" is.

## What you can now do

You can explain the principle each of DPDP, GDPR, and HIPAA rests on, without confusing DPDP's notification-based transfer model with GDPR's mechanism-based one, and without treating HIPAA as a residency statute it is not. More importantly, you know what you cannot responsibly claim from a lesson like this one — a current fine, a current deadline, whether a specific rule is currently in force — and you know whose job it is, on every engagement, to confirm those facts before you build around them.
