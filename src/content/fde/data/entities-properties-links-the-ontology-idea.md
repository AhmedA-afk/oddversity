---
title: "Entities, properties, links: the ontology idea"
phase: data
module: domain-modelling
kind: lesson
summary: "Before you build an app, you model the business: what the things are, what is true about them, and how they connect. This is the ontology idea behind Palantir's Foundry and the NHS Federated Data Platform, stripped of the platform, so you can do it with a whiteboard and three tables."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Define an ontology in one sentence a customer's business owner would understand.
  - Decompose a business process into entities, properties, and links without reaching for a tool.
  - Explain why modelling the domain before writing code prevents the single most common rebuild in enterprise deployments.
artifact: An entity-relationship sketch (in Markdown tables, no diagramming tool required) for one process at your current or most recent employer.
sources:
  - "https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying"
  - "https://www.computerweekly.com/news/366645878/Palantir-Can-anyone-else-do-what-it-does"
---

Palantir's own account of its first days on a new deployment describes Day 0 and Day 1 as connecting the customer's data and building an ontology: entities such as Customer, Claim, or Asset, with properties on each and link types between them. That happens before any workflow, any dashboard, any agent. The reasoning is not aesthetic. It is that every later piece of the build — a query, a permission rule, a report, a prompt that needs to reference "the customer's open claims" — is easier, safer, and more reusable if it is written against a model of the business rather than against whatever table happened to be easiest to query on day one.

You do not need Palantir's Foundry, or any ontology platform, to get this benefit. The idea is three concepts, and you can apply them with a whiteboard, a spreadsheet, or a handful of tables in Postgres.

## The three concepts

**Entities** are the nouns of the business: the things worth naming and tracking on their own. A Customer. A Claim. An Aircraft. A Bed. Not every table in a database is an entity — a join table that only exists to connect two other tables usually is not — but every entity in your model will usually become a table, or a well-defined view, somewhere.

**Properties** are what is true about one entity. A Customer has a name, a segment, a signup date. A Claim has an amount, a status, a filing date. Properties are the columns, and the discipline that matters is keeping them on the entity they actually describe — a claim's `assigned_adjuster` is a property of the claim, not a property duplicated onto every claim line item, because duplicating it is how two copies of the same fact start disagreeing.

**Links** are the verbs: how entities relate. A Customer *files* a Claim. An Adjuster *is assigned to* a Claim. An Aircraft *undergoes* a Maintenance Event. A link has a direction, sometimes a cardinality (one customer to many claims; one claim to one adjuster at a time, many over its life), and sometimes properties of its own — the *date* a link was established, which matters when the assignment changes and someone asks who owned a claim on a specific day.

That is the whole idea. Everything else is applying it carefully.

## Why this precedes the app, not follows it

The alternative to modelling first is building against whatever export you were handed, which usually means building against one system's schema, with that system's compromises baked in. The CRM's Opportunity object is not the business's real notion of "a deal" — it is Salesforce's notion, shaped by validation rules a sales ops team wrote years ago, as the CRM lesson in this module describes. If your application code reaches directly into `Opportunity.StageName`, every place that logic appears has to be rewritten the day the customer's business definition of a deal changes, or the day the customer switches CRMs.

A model of the domain — Customer, Deal, Stage, with the mapping from Salesforce's `Opportunity` object to your `Deal` entity written once, in one place — means that rewrite happens in one file instead of scattered across a dashboard, an agent's system prompt, and a report someone built by hand. This is the same argument as the medallion-layers lesson's silver layer: a layer that encodes what things mean, separate from where they came from, is what makes a rule change cheap instead of a renegotiation.

## A worked example: an insurance claim

Take a health insurance claim, the kind of process a claims-triage assistant would need to reason about.

**Entities:** Member, Policy, Claim, Provider, Adjuster.

**Properties**, a sample per entity:

| Entity | Properties |
|---|---|
| Member | member_id, name, date_of_birth, policy_id |
| Policy | policy_id, product_type, inception_date, sum_insured |
| Claim | claim_id, filed_date, amount, status, diagnosis_code |
| Provider | provider_id, name, network_status, specialty |
| Adjuster | adjuster_id, name, team |

**Links:**

| From | Link | To | Notes |
|---|---|---|---|
| Member | holds | Policy | one member, one active policy per product |
| Member | files | Claim | one member, many claims |
| Claim | treated_by | Provider | usually one, occasionally more for a multi-visit claim |
| Claim | assigned_to | Adjuster | changes over the claim's life; the link itself carries an `assigned_date` |
| Claim | references | Policy | for eligibility checks against sum_insured and inception_date |

Written this way, a question like "which of this adjuster's currently assigned claims are against providers outside the network" is a sentence you can turn directly into a query, because every word in the question is either an entity, a property, or a link in the model. Before the model existed, the same question required someone to already know which three tables held the answer and how they joined.

## The link is often where the real business rule hides

The properties draw attention because they look like the data. The links are where the interesting judgment calls live. Is a Claim linked to exactly one Provider, or can it be linked to several? The honest answer, once you ask a claims processor, is usually "several, and the split of which provider gets what share of the payout is itself a business rule with exceptions." That single link's cardinality is a design decision with real consequences for every downstream report, and it is worth a direct conversation with a domain expert before you commit to it in a schema, not an assumption you make alone at a keyboard.

## What you can now do

You can decompose a business process into entities, properties, and links, in a conversation with a customer, without opening a tool. You can explain to a non-technical stakeholder why you are spending a morning on a whiteboard before writing a query, in language they will recognise: "I want to make sure I understand what a claim actually is to you before I build anything that assumes I already know." The next lesson applies this to three concrete domains — a hospital, a bank, a factory — where the model looks different enough in each to make the general idea concrete.
