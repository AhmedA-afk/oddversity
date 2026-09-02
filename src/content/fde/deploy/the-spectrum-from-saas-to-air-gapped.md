---
title: "The spectrum: SaaS, VPC, BYOC, on-prem, air-gapped"
phase: deploy
module: vpc-byoc-and-customer-kubernetes
kind: lesson
summary: Enterprise customers do not buy "the cloud version" or "the on-prem version". They buy a point on a spectrum, and each point moves a different boundary — where data sits, who holds the keys, who can page you, and who patches the box. This page gives you the five points, what changes at each, and the questions that place a customer on it in one call.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Name the five common deployment models and state, for each, who owns the data plane, the control plane, the keys and the upgrade.
  - Place a new customer on the spectrum from three questions asked in a first technical call.
  - Predict which parts of your architecture break when a deal moves one step down the spectrum.
artifact: A one-page deployment-model matrix for a product you have built, with a "what breaks" column filled in for each tier.
sources:
  - https://omnistrate.com/blog/byoc-anywhere-the-spectrum-of-bring-your-own-cloud-deployments
  - https://www.getmaxim.ai/bifrost/resources/enterprise-deployment
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
  - https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires
  - https://jobs.accel.com/companies/scale-ai/jobs/85127893-forward-deployed-software-engineer-public-sector
  - https://www.theforwarddeployed.io/engagements/airbus
---

A generic engineer deploys to their own company's cloud. They own the account, the pipeline, the on-call rota and the observability stack. They can push a fix and see it live in eleven minutes.

An FDE deploys to a stranger's cloud. Sometimes to a rack in a stranger's basement. Sometimes to a room with a guard on the door and no cable leaving it.

The mistake beginners make is treating this as a binary: "SaaS or on-prem". It is not a binary. It is a spectrum, and every step down it moves a specific boundary. If you know which boundary moved, you know what just broke in your architecture and what you now have to write down.

## The five points

### 1. Multi-tenant SaaS

Your cloud, your account, your Kubernetes cluster. The customer's data lives in a database you administer, logically separated from other customers' data by a tenant column, a schema, or a row-level security policy.

Who owns what: everything is yours. Data plane, control plane, keys, upgrades, on-call.

What the customer is trusting: your access controls, and your word that tenant isolation holds.

This is where every deal starts and where most stay. It is also the model the customer's security team will try hardest to kill, because a shared database holding their data and their competitor's data is a single sentence in a questionnaire that is hard to answer well.

### 2. Single-tenant SaaS (dedicated instance)

Still your cloud, still your account, but the customer gets their own database, their own namespace, sometimes their own VPC and their own encryption key. You run N copies of the stack instead of one.

What moved: the isolation boundary. "Your data is in a database no other customer touches" is a sentence a CISO can accept.

What broke: your migration story. You now have N schemas at N versions, and one of them is three releases behind because that customer's change-approval board meets monthly. Every schema change you write has to be backwards compatible for longer than you would like.

### 3. VPC deployment / BYOC (bring your own cloud)

The customer's cloud account. Their AWS organisation, their Azure subscription, their GCP project. You deploy the software into infrastructure they own and pay for; their data never leaves their account.

This is the model that dominates enterprise AI deals right now, and vendor writeups on the BYOC pattern describe it as a spectrum in its own right rather than a single design: how much of the control plane the vendor keeps varies deal to deal.

The important sub-distinction, and the one people get wrong:

- **Data plane in their account, control plane in yours.** The workloads, the database, the vector index, the logs run in their VPC. Your service still orchestrates upgrades, holds the deployment metadata, and can trigger a rollout. This is the common BYOC shape, and it needs a cross-account role or an agent that dials out from their network to yours.
- **Both planes in their account.** You hand over a Helm chart or a Terraform module and they run it. You get no dial-home, no telemetry you did not explicitly ask for, and no ability to fix anything without a screenshare.

The Sierra "Forward Deployed Infrastructure Engineer" posting is the cleanest public description of what this tier is as a job: owning the end-to-end lifecycle of customer deployments in customer-owned cloud environments — VPC configuration and infrastructure provisioning, upgrades, rollbacks, incident support — and working with everyone from platform engineers to CISOs.

What broke: your observability. Your logs are now in their CloudWatch, which you may not be able to read. Your incident response now depends on a person at the customer being awake. Your "just SSH in" reflex is gone permanently.

### 4. On-premises

Their data centre. Physical or virtualised servers they own, in a building they own. Often no Kubernetes at all — a few VMs, systemd units, a Postgres someone's DBA has run since 2014, and a change window on the second Saturday of the month.

You still have network egress, usually through a proxy that requires authentication and only allows an approved list of destinations. You can still, in principle, pull a container image, if you first get the registry hostname added to the allowlist, which takes three weeks.

What broke: your assumption that `apt-get`, `pip install`, and `docker pull` are free operations. Every one of them is now a ticket.

### 5. Air-gapped

No route to the public internet at all. Not "restricted", not "proxied". No route. Software arrives on removable media or through a one-way data diode, after a scan, after a signature check, after a human approves the transfer.

Decagon has written publicly about what this tier actually demands, framing it as no public internet connectivity beyond the bare minimum the customer explicitly deems necessary. Scale AI's public-sector FDSE role describes deploying at customer sites in secure environments under TS/SCI clearance. Palantir's FDEs worked air-gapped environments on the Airbus final assembly line in Toulouse. This tier is real, it is where a lot of the defence, intelligence, banking-core and pharma-manufacturing money is, and it is the single capability one vendor survey names as the thing the frontier labs still lack relative to Palantir.

What broke: everything that resolves a hostname you do not control. Package managers. Model APIs. Licence servers. Certificate revocation checks. Telemetry. Automatic updates. Your `latest` tags. Your Sentry DSN.

## The table

| | Multi-tenant SaaS | Single-tenant | VPC / BYOC | On-prem | Air-gapped |
|---|---|---|---|---|---|
| Data at rest | Your account | Your account | Their account | Their DC | Their DC |
| Compute | Yours | Yours | Theirs | Theirs | Theirs |
| Encryption keys | Yours | Theirs, optionally (BYOK) | Theirs, usually | Theirs | Theirs |
| Who upgrades | You, continuously | You, per tenant | You, in their change window | Them, with your runbook | Them, quarterly at best |
| Your log access | Full | Full | Negotiated | Screenshare | None |
| Internet egress | Free | Free | Restricted | Proxied | None |
| Time to ship a hotfix | Minutes | Hours | Days | Weeks | Next release |
| Model inference | Vendor API | Vendor API | Vendor API or private endpoint | Private endpoint or self-hosted | Self-hosted only |

Read the last row twice. It is the row that decides whether the AI product you are deploying is even possible in the environment. A retrieval-augmented assistant that calls a hosted frontier model is a different system in an air-gapped enclave than it is in SaaS; it is not the same system with a config flag.

## Three questions that place a customer in one call

You will be on a first technical call with a platform lead and, if you are lucky, someone from security. You have maybe five minutes of infrastructure discussion before the conversation goes back to the use case. Spend it on these.

1. **"Where does the data have to live, and who told you that?"** The answer is a place and an authority. "In our Mumbai region, because RBI" is a completely different constraint from "in our AWS account, because our CISO prefers it". The first is not negotiable by anyone in the room. The second sometimes is.
2. **"What have you deployed from a vendor before, and what shape was it?"** If they have run a vendor's Helm chart in their cluster before, you have a template, a precedent and probably a security review you can inherit. If the answer is "we've only ever bought SaaS", you are about to be their first, and the timeline doubles.
3. **"Who patches it, and in what window?"** This tells you the upgrade model, and the upgrade model tells you whether you can ship weekly or must batch three months of work into a quarterly release. It also, indirectly, tells you how much of your roadmap the customer will ever actually see.

Ask a fourth if the room allows: **"Does anything in this environment reach the public internet, and through what?"** Ask it plainly. "Restricted egress" from a platform engineer can mean a transparent proxy that lets everything out, or it can mean a deny-by-default firewall where every destination is a change request. Those are different projects.

## What moving one step costs you

Deals move down the spectrum, never up. A customer who signed for SaaS and then, in security review, demands VPC has not made a small request. Here is roughly what each step down costs an unprepared product.

- **SaaS to single-tenant:** provisioning automation, per-tenant migrations, a version matrix you have to support.
- **Single-tenant to VPC:** cross-account identity, a customer-supplied registry, network egress rules, an observability story that works without your log stack, and a first security review.
- **VPC to on-prem:** no managed services. Your managed Postgres, your managed queue, your managed object store all become things someone installs. Your Terraform is worthless; you need an installer.
- **On-prem to air-gapped:** a full offline distribution: every image, every wheel, every model weight, signed, versioned, and reproducible, plus an install procedure a stranger can run from a printed page. This is a distinct engineering project measured in weeks, not a packaging change.

The FDE's job in the deal is to see the step coming before it is a surprise, price it honestly, and say which capabilities do not survive the move. That last part is the one people avoid, and it is the one that saves the engagement. Write the sentence now, in the first call, rather than in month three: *"In an air-gapped install, semantic search runs on a local embedding model and the answer quality will be lower than the demo you just saw. Here is what I propose we measure to decide if it is good enough."*

## Do this now

Take a service you have built. Fill in the table above for it, one column per tier, with a fifth row of your own: "what specifically breaks". Be concrete. Not "observability is harder" but "the Sentry SDK will retry forever against a hostname that does not resolve and block shutdown". That level of specificity is what the rest of this phase teaches you to produce, and it is what an interviewer is listening for when they ask whether you have deployed outside your own cloud.
