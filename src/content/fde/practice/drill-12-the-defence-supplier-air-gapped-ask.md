---
title: "Drill 12: the defence supplier air-gapped ask"
phase: practice
module: decomposition-drills
kind: drill
summary: A defence supplier wants an AI assistant for engineers debugging test failures, built in a month. Forty-five minutes to discover that the facility's engineering network cannot reach the outside world at all, and that most AI tooling assumes it can.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Identify hidden connectivity assumptions built into ordinary software tooling.
  - Treat a security accreditation process as a project dependency with its own timeline.
  - Design a fully offline system with every dependency named and bundled in advance.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Ashcroft Dynamics builds guidance subsystems for a defence prime under a classified government contract, at a facility outside Huntsville. You're the FDE brought in by the engineering director to speed up test-failure diagnosis for embedded systems engineers. The engineering director opens the meeting over an unclassified line, before you've been badged in:

> "Our engineers spend hours digging through test logs and old failure reports to figure out why a build failed. I want something like an AI assistant, point it at our documentation and past failure reports, let engineers ask it questions in plain language. I've seen what these coding assistants can do, I want that here. Can we have something running in a month?"

Once badged in, you learn the actual environment: the facility's engineering network has no connection to the public internet, by design, and every system on it is accredited separately before it can be connected.

## The room

**Colonel (Ret.) Priya Bannerjee, Engineering Director.** Owns the schedule and the program's technical debt.

> "Every week we lose to slow diagnosis is a week against a delivery milestone the government contract has real penalties for. I don't care how the tool works, I care that engineers stop spending Tuesday afternoons grepping through five years of PDF failure reports."

**Mark Halloran, Facility Security Officer and ISSO.**

> "Nothing on this network talks to the outside world, in either direction, and that is not a policy I can waive for a productivity tool. Any software, any model, any dependency it needs, comes in through an accredited one-way transfer process, gets scanned, and gets accredited before it touches this network. If your tool tries to phone home for anything — a licence check, a telemetry ping, an update — it fails our review and it does not go live."

**Renata Okafor, senior systems engineer, twenty years on classified programs.**

> "I want this tool badly, I've used things like it on unclassified work before and it's genuinely useful. But every time I've seen someone bring in a slick commercial demo, it turns out to need something we don't have here: a live API key, a package installer that reaches out to the internet, an auto-updater. It works beautifully on their laptop in the sales meeting and then it's dead on arrival the first week it's actually here."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The engineering director's mental model of "something like an AI assistant" is built from tools that assume connectivity at every layer, almost invisibly: the model itself is usually called over an API to a cloud provider, the software that runs it is typically installed by pulling packages from a public package index, containers are usually pulled from a public registry, and even self-hosted software commonly phones home for licence checks or telemetry by default, often without the vendor mentioning it because on every other customer's network it just works.

None of that is available on Ashcroft's engineering network, and Mark's constraint is not negotiable or a matter of getting an exception approved faster — it is the accreditation boundary the facility's authority to operate depends on. Any software that reaches this network arrives once, through an approved one-way transfer, after every dependency it needs has been identified in advance, bundled, and scanned, because there is no way to fetch a missing dependency later. A model that needs periodic fine-tuning against new data, or a tool that checks a licence server, or a package manager that tries to resolve a dependency online, does not fail gracefully in this environment: it fails silently on day one and Renata's team stops trusting it by day two.

The one-month timeline the director wants is achievable for the actual engineering work — indexing failure reports, building a retrieval layer, running a small local model — but not for the accreditation process itself, which Mark's office controls and which was not mentioned in the original brief because Priya, focused on the schedule, did not think to frame the request as one that needs security sign-off before it needs code.

## What a strong decomposition covers

- **Confirming the network's actual connectivity constraint before selecting any tool or architecture** — not assuming a workaround exists, because in an accredited air-gapped environment, none does by policy.
- **Every dependency identified and bundled up front**, since nothing can be fetched later: the model weights, the runtime, every library, delivered once through the approved transfer process, with no auto-update mechanism designed into the system at all.
- **The accreditation process as a project dependency with its own timeline**, owned by Mark's office, and likely the longest pole in the month the director wants — surfaced explicitly rather than discovered in week three.
- **What "self-hosted" actually requires here**: not a hosted-model API with a firewall in front of it, but a fully offline model, running entirely on hardware already inside the boundary, with no code path that assumes it can reach outside even for something as minor as a version check.
- **The decomposition**: inventory every dependency and produce a single frozen bundle; submit that bundle to Mark's transfer and scanning process; build the retrieval and assistant layer against local failure-report documents already on the network; deploy inside the boundary with manual, physical-media updates as the only update path.
- **The walking skeleton**: a small local model, answering questions against a handful of already-indexed failure reports, running entirely on one accredited workstation, with every dependency it needed listed and verifiable, before anything is scaled to the wider engineering team.

## A model 45 minutes

- **0 to 8.** What does an engineer actually do today when a test fails: which documents, which systems, in what order, and are any of those systems already isolated the way the target network is.
- **8 to 15.** Priya's schedule pressure, Mark's non-negotiable air-gap boundary, Renata's history of tools that die on arrival because of a hidden connectivity assumption.
- **15 to 23.** What data and documents already exist on the isolated network versus what has to be transferred in, and through what accredited process.
- **23 to 33.** Dependency inventory and bundling first; accreditation submission second; the assistant build third, in parallel with accreditation review where possible.
- **33 to 40.** One accredited workstation, a small offline model, a handful of indexed documents, zero outbound calls anywhere in the design.
- **40 to 45.** Risk: a hidden connectivity assumption in a chosen library or model-serving framework that isn't discovered until the accreditation scan fails it. What you refuse: a one-month promise that does not include Mark's accreditation timeline.

## The trap in this one

**Assuming a call you cannot make.** Nearly every modern AI tool, and a great deal of ordinary software tooling underneath it, assumes it can reach the internet for something: a model API, a package index, a container registry, a licence check, a telemetry beacon. These assumptions are so deeply embedded in default tooling that an engineer can build an entire working prototype on a laptop with internet access and never notice how many outbound calls it silently makes, because on that laptop, every one of them just succeeds.

Bring that same build into an air-gapped, accredited facility and it does not degrade gracefully, it stops working entirely and unpredictably, at whichever dependency happens to be first in line to reach outward, and Mark's review will catch what the design missed regardless, at the cost of weeks the schedule did not have. The FDE move is to design for zero outbound connectivity from the first line of code, treat every dependency as something that must be named, bundled, and justified before it is used, and treat the accreditation process as the actual critical path rather than a formality to handle at the end.

## The rubric, applied

A weak attempt proposes a retrieval-augmented assistant calling a hosted model API, promises a one-month delivery, and never asks Mark what "no connection to the outside world" actually rules out. That is 1/1/1/0/0.

A pass confirms the connectivity boundary before any tool choice, treats dependency bundling and the accreditation submission as first-week deliverables, designs a fully offline architecture with no auto-update path, and states plainly that the one-month estimate depends on a security review timeline the engineering director does not control. That is 2/2/2/3/3.

Criterion 4 carries the outcome: the zero is the candidate who assumes "self-hosted" solves the air-gap problem without checking what the model-serving stack itself still tries to reach outward for; the three is the one who asks Mark, before writing anything, exactly what the accredited transfer process requires and how long it takes.
