---
title: "What an air-gapped deployment actually requires"
phase: deploy
module: on-prem-and-air-gapped
kind: lesson
summary: "Air-gapped does not mean a harder VPC deployment: it means no route to the internet at all, so every dependency, update, and byte of telemetry has to be planned for before you arrive on site. This page gives you the real checklist and the questions that reveal how air-gapped a customer's air gap actually is."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Distinguish a true air gap from the four things customers usually mean when they say "air-gapped".
  - List every category of dependency a service needs and where each one has to come from inside a perimeter with no outbound route.
  - Ask the three questions in a scoping call that tell you how the update, monitoring, and support path will actually work.
artifact: An air-gap readiness checklist for one of your own services, with a "how does this get in" answer for every dependency category.
sources:
  - https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
  - https://jobs.accel.com/companies/scale-ai/jobs/85127893-forward-deployed-software-engineer-public-sector
  - https://www.theforwarddeployed.io/engagements/airbus
---

A customer says "we need this air-gapped" in a first call more often than they mean it. Sometimes they mean no internet at all, ever, on a network with a guard at the door. Sometimes they mean "our production VPC has no NAT gateway but our jump box does." Those are different projects with different timelines, and confusing them is how a six-week build becomes a six-month one you did not budget for.

Decagon's own engineering writeup on the subject gives the useful, narrow definition: an air-gapped deployment has "no public internet connectivity beyond the bare-minimum deemed necessary by the customer". Read that phrase twice. The bare minimum is set by the customer, not by you, and it is usually smaller than you assumed. Scale AI's public-sector postings describe deploying and maintaining software "at customer sites" under a security clearance; Sierra's infrastructure role talks about owning a deployment's lifecycle inside a customer-owned cloud. Neither of those is automatically an air gap. Air-gapped is the point past VPC and BYOC where there is no cloud API to call at all, because there is no route out.

## The four things customers say instead of "air-gapped"

Place the customer before you build anything.

1. **Restricted egress.** Outbound traffic goes through a proxy and an allowlist. You can reach specific hosts on specific ports if security approves them. This is a hard VPC deployment, not an air gap. Most "we're air-gapped" customers are here.
2. **Physically isolated, logically connected by exception.** A network with no default route to the internet, but a documented, monitored, one-way or reviewed channel for updates: a jump host, a file-transfer diode, a quarterly patch cycle carried in on approved media. This is what Decagon and most enterprise vendors actually mean by "air-gapped" in practice.
3. **True air gap.** No connection, no exception channel, no telemetry, ever. Updates arrive on physical media, inspected and signed before they cross. Airbus ran Palantir's Foundry inside air-gapped segments of its Toulouse final assembly line under exactly this model; Palantir's own case material describes FDEs working the floor there for over a year, embedded rather than remote, because there was no other way to iterate.
4. **Classified or cleared.** True air gap plus a clearance requirement on every person who touches the system. Scale AI's public-sector FDSE role requires TS/SCI clearance, obtainable or held, for exactly this tier. You will not be assigned here without the clearance; know that it exists so you do not promise a customer something you cannot staff.

Ask three questions on the first call and you will know which of the four you are in:

- "Is there any outbound connectivity from the box this will run on, to anything, ever?"
- "How does a patch get from your vendor's build to this environment today, for any other software you run here?"
- "Who has to physically touch the media that carries an update in?"

The third question is the one people forget to ask and the one that determines your release cadence more than any other answer.

## What "no route out" actually breaks

Every assumption a modern service makes is an internet assumption. Go through your stack and ask where it phones home.

- **Package managers.** `pip install`, `npm install`, `apt install`, `helm repo add` all assume a reachable index. Every one of them needs a local mirror or a pre-built bundle. The next lesson covers exactly how.
- **Container registries.** `docker pull` from a public registry fails closed. Images must be pulled, scanned, signed and pushed to a registry that lives inside the perimeter before day one.
- **DNS.** Public DNS resolution for anything outside the enclave will hang or fail slowly, which is worse than failing fast. Internal DNS has to resolve everything your service needs, including the registry and any internal API you call.
- **NTP.** Clock drift breaks TLS certificate validation and anything with a signed, time-bound token. The enclave needs its own time source; do not assume `pool.ntp.org` is reachable.
- **Certificate authority.** Public CAs cannot issue or revoke inside a network with no path to their infrastructure. The customer runs an internal CA, and your service has to trust its root, not the public trust store your laptop uses.
- **The model.** If your product calls a hosted LLM API, that call has nowhere to go. Either a model runs inside the perimeter, or a narrow, audited, one-directional channel exists to a model endpoint outside it. The next lesson but one covers the shape that pattern actually takes.
- **Telemetry and logging.** Your APM agent, your error tracker, your product-analytics SDK: all of them try to phone a SaaS endpoint by default, and in a true air gap that call is either blocked (safe, but you fly blind) or, worse, silently succeeds because someone left a narrower egress rule than they meant to (a finding, and an incident). Every telemetry destination must be enumerated and pointed inside the perimeter or explicitly disabled.
- **License checks.** If anything in your stack phones a licensing server, that check needs an offline mode. Vendors that do not support one get vetoed at this stage of the review, sometimes after you have already built on top of them.

## Signing and provenance matter more here, not less

A tempting shortcut inside an air gap is to relax controls, on the logic that nothing can reach out to be attacked. The opposite is true: because nothing can be patched quickly and nothing can be observed from outside, everything that goes in has to be verified going in. Every bundle you carry across the boundary should be signed, and the signature verified on the receiving side before install, not trusted because it arrived on the right USB drive. Build this into the procedure now; retrofitting it after the first incident review is a much worse conversation.

## The FDE point

Nobody outside this tier of the job builds this instinct, because nobody outside it needs it. A generic engineer's mental model of "deploy" ends at `git push` and a pipeline they can watch. Yours has to include a version of the same question for a room with no pipeline, no dashboard, and someone standing next to a rack with a laptop that has never touched the internet. Scoping that correctly, in the first call, before a single line of Terraform is written, is what separates an FDE who delivers on a six-month air-gapped engagement from one who discovers the real constraint in week four.
