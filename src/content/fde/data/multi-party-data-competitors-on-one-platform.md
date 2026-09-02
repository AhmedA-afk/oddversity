---
title: "Multi-party data: competitors on one platform"
phase: data
module: identity-permissions-residency
kind: lesson
summary: "Some deployments ask direct rivals to trust the same platform with their operational data. Airbus got competing airlines onto Skywise; the NHS Federated Data Platform is still fighting the trust question in public. Here is the isolation pattern that makes multi-party data sharing possible, and where it breaks down into politics."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Explain why a multi-tenant platform for competitors needs a stronger isolation guarantee than ordinary SaaS multi-tenancy.
  - Design an aggregate-sharing pattern that lets tenants benefit from shared insight without seeing each other's raw data.
  - Recognise when a multi-party data problem is a governance and trust problem that no architecture alone will solve.
artifact: A written isolation design for a hypothetical multi-tenant platform, naming exactly what is shared, what is isolated, and who decided the line.
sources:
  - "https://www.theforwarddeployed.io/engagements/airbus"
  - "https://www.computerweekly.com/news/366645878/Palantir-Can-anyone-else-do-what-it-does"
---

Most multi-tenant software separates customers who have no reason to distrust each other — two unrelated retailers on the same SaaS platform do not particularly care whether the vendor could, in principle, compare their data, because they are not competing for the same customers. A smaller set of deployments asks something much harder: get direct competitors to put real operational data on one shared platform, and get them to trust it. This lesson is about that second, harder case, because it comes up more than you would expect once you are looking for it — an industry consortium, a shared logistics network, a sector-wide fraud database, a healthcare data platform spanning independent hospital trusts.

## The case that proves it can work: Skywise

Airbus built Skywise with Palantir, starting inside A350 production from late 2015 and launching publicly in 2017 as an open aviation data platform for predictive maintenance and fleet health, reporting close to 12,000 connected aircraft as of a 2026 company statement. The hard part was never the data pipeline. It was earning enough data-governance trust that competing airlines — carriers who compete directly for the same passengers and routes — would agree to put their operational data on a platform run by their aircraft manufacturer, whose commercial interests are not neutral with respect to any one of them.

That trust was earned, not assumed, and it was earned through architecture as much as through negotiation: an airline's flight data, maintenance logs, and reliability records stay isolated to that airline, while the platform can still surface fleet-wide reliability insight — a part failing more often than expected across the whole fleet, a maintenance interval that could safely be extended based on aggregate evidence — without any one airline being able to see another's raw operational data.

## The case that shows how hard it stays: the NHS Federated Data Platform

The NHS Federated Data Platform, also Foundry-based, connects data across NHS Trusts — independent organisational units, not competitors in a commercial sense, but each protective of its own data and its own patients' privacy — for patient flow, bed occupancy, and related operational questions, under a roughly £480m, seven-year contract. It has faced sustained public and political scrutiny, including freedom-of-information requests probing aspects of the rollout. The point worth taking from this, deliberately without overstating what the public record shows: even a technically sound isolation architecture does not by itself settle a multi-party data question when the stakeholders include the public, elected officials, and clinicians with professional duties to their own patients. The politics is a separate, real layer on top of the architecture, not a detail the architecture can absorb.

## The isolation patterns, from weakest to strongest guarantee

**Shared schema, row-level filtering.** Every tenant's data lives in the same tables, distinguished by a `tenant_id` column, with row-level security (from the earlier lesson in this module) enforcing that a query only returns rows for the caller's tenant. Cheapest to build and operate, and the pattern most SaaS multi-tenancy uses — but it asks every tenant to trust that a single RLS policy, a single bug, a single admin query, never leaks across the boundary. For unrelated customers this risk is often acceptable. For direct competitors, it is rarely enough on its own, because the consequence of a leak is not inconvenience, it is a competitor seeing your operational data.

**Separate schema or separate database, shared infrastructure.** Each tenant's data lives in its own schema or database, on shared compute and shared application code. This raises the bar — a bug in one query cannot accidentally join across schemas the way it could across rows in one table — while keeping operational cost close to the shared-schema model. This is a reasonable middle ground for tenants who compete but are not asking for the strongest possible guarantee.

**Fully separate deployments, aggregate-only sharing.** Each tenant's raw data never leaves an isolated environment — physically or logically separate infrastructure, sometimes literally a separate instance of the platform per tenant. What crosses the boundary is not raw data at all, but pre-aggregated, statistically safe summaries: "components of this type failed at this rate across the fleet," not "airline X's aircraft Y failed on this date." This is the pattern Skywise's fleet-wide reliability insight depends on, and it is the strongest guarantee, at the highest engineering and operating cost.

The design decision that matters is not which pattern is "best" in the abstract. It is matching the isolation level to what the specific stakeholders will actually accept, which is a negotiated answer, not an architectural one — the architecture just has to be capable of enforcing whatever level was agreed.

## What "aggregate-only" actually requires to be safe

A naive aggregate — "average failure rate across all tenants" — can still leak individual tenant data if the aggregate group is small enough. Three specific disciplines make an aggregate genuinely safe rather than safe-looking:

- **Minimum group size.** Never surface an aggregate computed over fewer than some stated minimum number of contributing tenants — a common practical floor is somewhere around five, chosen so that no single tenant's number can be reverse-engineered by comparing the aggregate before and after they join or leave the group. The exact number is a decision to make with the customer's legal and governance team, not a default to assume.
- **No re-identification by subtraction.** If a tenant can see both the aggregate and their own contribution, they can compute everyone else's combined figure by subtraction. If there are only two or three other contributors, that combined figure is close enough to identifying to defeat the point of aggregating at all. This is exactly the same minimum-group-size problem from a different angle, and it is why the floor needs to be set deliberately rather than assumed to be "more than one."
- **A named data-governance owner, on the customer or consortium side, who approves what gets aggregated.** Aggregation logic is a business rule with real consequences, the same as the transformation rules in the ETL lesson, and it deserves the same discipline: written down, attributed, and revisited when a new tenant joins or the aggregate's definition changes.

## When it is a trust problem, not an architecture problem

Sometimes the honest answer to "can we build this" is that the architecture is straightforward and the trust is not there yet, and no amount of additional engineering substitutes for a governance structure the stakeholders actually believe in — a steering committee with real authority, an audit right the tenants can exercise, a contractual commitment that survives a change of platform vendor. Airbus earned Skywise's trust over years, with an architecture that made the trust defensible once it existed, not an architecture that manufactured the trust on its own. Recognising which side of that line you are on — do the stakeholders not yet believe the isolation works, or do they not yet believe the platform's owner has the right incentives — is itself an FDE judgment call, and it decides whether the next conversation is about your Postgres schema or about the governance committee's charter.

## What you can now do

You can name the three levels of multi-tenant isolation, from row-level filtering to fully separate deployments with aggregate-only sharing, and match the level to what competing stakeholders will actually accept rather than what is cheapest to build. You can also recognise, and say out loud to the account team, when a multi-party data problem has stalled on trust rather than on architecture — because building the isolation layer better will not fix that, and correctly identifying which problem you have is worth more than another week of engineering on the wrong one.
