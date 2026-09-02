---
title: "Continuous delivery into many customer sites"
phase: deploy
module: compliance-security-procurement
kind: lesson
summary: "The first install is the interesting part; the fiftieth upgrade, across fifty sites at fifty different versions with fifty different change windows, is the actual job. This page covers the release-train pattern that makes that tractable, using Palantir's Apollo as the reference model."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Explain why a single "latest version" mental model breaks once you have more than a handful of customer deployments.
  - Design a version-skew matrix and a staged rollout plan that a customer's change-approval process can actually work with.
  - Describe the Apollo pattern of continuous delivery into disconnected environments and where it applies to a smaller team's own release process.
sources:
  - https://www.palantir.com/docs/foundry/architecture-center/platforms
---

One customer deployment is a project. Ten is a portfolio, and the moment you cross from one to ten, a mental model that worked fine for one — "we deploy the latest version" — stops being true anywhere. Site three is two releases behind because their change board meets monthly. Site seven is on an old version because they are mid-way through their own SOC 2 audit and froze changes for the quarter. Site nine wants the newest feature immediately because their pilot depends on it. All of them are "the current customer," and none of them are running the same code.

Palantir built Apollo specifically for this problem: a continuous-delivery system whose job is orchestrating releases across many customer environments, including disconnected and air-gapped ones, on each customer's own schedule rather than a single global one. You will not build Apollo. The pattern behind it is worth understanding at whatever scale you operate, because the underlying problem — many customers, many versions, many independent approval cycles — appears the moment a second deployment exists, not just at Palantir's scale.

## The core problem: a matrix, not a line

Stop thinking of releases as a line (v1, v2, v3, always moving forward together) and start thinking of them as a matrix: customer sites on one axis, versions on the other, and a cell for where each site currently sits.

| Site | Current version | Approved to upgrade to | Change window | Notes |
|---|---|---|---|---|
| Meridian Co-operative Bank | 2.3.1 | 2.4.1 | Second Tuesday, 6–8 a.m. | Board-approved change freeze during quarterly audit, next window in 3 weeks |
| SuryaTex Manufacturing | 2.4.0 | 2.4.1 | Any weekday, low-traffic hours | Fast-moving; usually adopts within a week of release |
| Northlake Wealth | 2.2.4 | 2.3.1 (not 2.4.x yet) | Monthly, first Monday | Compliance sign-off required per version bump; skips minor releases deliberately |
| A district administration | 2.1.0 | — (frozen) | Manual, coordinated on-site visit | On-prem, no CI/CD reachable; upgrades are a scheduled visit, not a pipeline event |

This table is the actual artifact. Maintaining it, and being honest in it about who is behind and why, is most of what "continuous delivery into many customer sites" means in practice. Nobody upgrades on your schedule; everybody upgrades on theirs, and your job is knowing precisely where each of them stands at any moment.

## The release-train pattern

Rather than shipping to every site the day a change merges, batch changes into a numbered release, and roll that release out in waves:

1. **Canary sites first.** One or two low-risk, fast-moving customers (SuryaTex in the table above) get the release first, with close monitoring for a defined bake period — a few days is typical.
2. **General availability wave.** Once the canary period passes cleanly, the release becomes available to any site whose change window falls after this point, on their own cadence.
3. **Regulated and slow-moving sites, deliberately last.** A bank or a government customer often wants to be behind the wave, not ahead of it — they are relying on other customers' production usage as informal validation before they take the change themselves. Do not push urgency onto a site that has explicitly asked to lag.

This means your own release notes need to say, honestly, what changed and what the risk profile is, because a customer three versions behind is going to read the notes for versions N, N+1, and N+2 before deciding whether to jump straight to the latest or take them one at a time.

## What has to be true for this to work at all

**Every release is backwards compatible with the client one major version back, minimum.** If site four is on 2.2 and site nine is on 2.4, your API and your data schema both have to tolerate that gap gracefully, which is the same expand-then-contract migration discipline described in the earlier Helm lesson, now multiplied across every site instead of one.

**Feature flags separate "the code shipped" from "the feature is on."** A capability can go out in the release train to every site while remaining dark until that specific customer's pilot is ready for it. This decouples your deployment cadence from any single customer's approval cadence, which is the single highest-leverage change a small team can make to this problem.

**Telemetry tells you what version is actually running, everywhere, without you having to ask.** A dashboard keyed by site and version number, fed by each deployment's own health check reporting its build hash, replaces the alternative — a spreadsheet someone updates by memory and gets wrong within a month.

**Rollback per site is a first-class operation**, not an emergency improvisation. A site that took a bad release needs to be able to go back to its previous version independently of every other site's state, which is exactly why in-place, forward-only migrations are dangerous at this scale: a schema change that cannot be reverted for one site blocks rollback for that site alone, but you need that capability to exist for every site, every time.

## Disconnected sites need a different mechanism, not an exception to the plan

A site with no route to your deployment pipeline — the air-gapped and on-prem customers from earlier in this phase — cannot receive a push. The release-train model still applies to how you sequence and validate releases; the delivery mechanism for that last mile is the frozen, signed bundle from the earlier lesson, carried across the boundary on the customer's own schedule. Treat "how does an air-gapped site get release 2.5.0" as an instance of the same matrix, with a manual delivery step instead of an automated one, rather than as a separate process you invent under pressure the first time it comes up.

## The FDE point

A generic engineering team ships to one environment they fully control and calls the deployment "done" when the pipeline goes green. An FDE managing several customer sites never gets to say the deployment is done, because there is no single state that is true everywhere at once — only a matrix that is honestly tracked, a release cadence that respects each customer's own change process, and a rollback story that works per site when, not if, one of them needs it.
