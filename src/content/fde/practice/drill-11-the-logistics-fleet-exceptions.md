---
title: "Drill 11: the logistics fleet exceptions"
phase: practice
module: decomposition-drills
kind: drill
summary: A European road-freight operator wants a system that detects breakdowns and delays automatically from its transport management system. Forty-five minutes to discover that the real signal arrives by phone call and WhatsApp long before anything reaches that system.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Find where the real signal already lives, distinct from where the official system claims it does.
  - Design for users who will not adopt a new tool, instead of assuming they will.
  - Structure an existing informal channel before building detection on top of a lagging one.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Nordwell Logistics runs a road-freight network across Germany, Poland, and the Benelux, roughly 340 trucks, about a third owned, the rest subcontracted to independent owner-operators. You're the FDE embedded with the network operations team. The VP of Operations opens the kickoff:

> "We have a transport management system that tracks every load and every truck. When something goes wrong — a breakdown, a border hold, a driver running out of hours — I want a system that picks it up automatically from the data and suggests a reroute or a replacement truck before the customer even notices a delay. Right now my dispatchers find out from a phone call and scramble. I want the system to see it first."

You're given read access to the transport management system: load status, planned route, GPS ping history, and an "exception" field that dispatchers can flag manually.

## The room

**Ingrid Vermeer, VP of Operations.** Owns the on-time delivery number and the customer escalation calls.

> "My biggest customers grade us on delivery windows. Every time we're late because of something we should have seen coming, that's a scorecard hit. I want to stop being surprised."

**Tomasz Wójcik, Control Tower Lead**, runs the dispatch floor.

> "The system shows me where a truck is. It does not tell me why it stopped. That comes from a phone call, or more often now, a WhatsApp message from the driver, sometimes in Polish, sometimes in German, sometimes just a photo of a warning light with no text at all. My dispatchers know within ten minutes of a real problem. The system finds out when someone finally logs it, which can be hours later, if at all."

**Elena Draganescu, Driver Relations Coordinator**, manages the owner-operator relationships.

> "Our subcontracted drivers are not employees. They use their own phones, their own WhatsApp, and they call the number they've always called, which is Tomasz's team directly. If you build something that expects them to log into a new system to report a breakdown, they won't use it, they'll just keep calling."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The transport management system's GPS ping history can show that a truck has stopped moving. It cannot show why. A truck stationary for forty minutes could be a scheduled rest break, a loading delay, a flat tyre, or a genuine breakdown, and the GPS data alone does not distinguish between them. The actual signal that tells Tomasz's team which one it is arrives as a phone call or a WhatsApp message from the driver, in whichever of three languages the driver prefers, sometimes as a photo with no text, and it arrives well before anyone manually enters an "exception" flag into the system, if anyone ever does — flagging is inconsistent, done when a dispatcher has a spare minute, and often skipped for exceptions that resolved themselves quickly.

This means the system Ingrid is describing, one that "sees it first" from the transport management system's data, is trying to detect an event from a data source that structurally lags the real signal by design. The real system of record for "what actually happened" is Tomasz's team's phones, not the software. Elena's point sharpens this further: the subcontracted drivers, roughly two-thirds of the fleet, have no employment relationship compelling them to use a new reporting tool, and will keep calling the number they know regardless of what gets built.

The honest starting point is not "detect exceptions from GPS data automatically." It is "capture the information that already exists, in the channel drivers already use, faster and more consistently than a dispatcher typing it into the system during a busy shift."

## What a strong decomposition covers

- **Where the truth actually lives**, distinct from where the system of record claims it lives: WhatsApp and phone calls to the control tower, not the exception field.
- **The two-thirds of the fleet that will not adopt a new reporting channel**, because they are subcontractors with no obligation to, and any design that assumes universal tool adoption fails for them by default.
- **What GPS data alone can and cannot tell you**: a stopped truck, not a reason, and the false-positive rate of treating "stopped" as "exception" without a driver's confirmation.
- **A design that meets drivers in WhatsApp rather than asking them to leave it** — a structured way to capture what's already an unstructured message, without adding a step to the driver's existing habit.
- **The decomposition**: a WhatsApp-based intake that structures a driver's existing message (location, a short reason, a photo) into something the system can log automatically, before any GPS-only anomaly detection; only after that channel is reliably capturing real exceptions does a "detect from GPS alone, before the driver calls" layer become worth building, as an early-warning supplement, not a replacement.
- **The walking skeleton**: for one lane, capture driver WhatsApp messages into a structured exception log in real time, visible to dispatch, with no change to what the driver actually does.

## A model 45 minutes

- **0 to 8.** Walk through what happens, right now, in the ten minutes after a driver has a real problem on the road. Who does he contact, how, and what does the dispatcher do with that information.
- **8 to 15.** Ingrid's on-time scorecard, Tomasz's real-time knowledge that the transport management system doesn't have, Elena's non-employee drivers who won't adopt a new tool.
- **15 to 23.** The exception field's actual fill rate and lag, versus the WhatsApp channel that's already carrying the real signal.
- **23 to 33.** Structuring the existing WhatsApp channel first; GPS-based anomaly detection as a later supplement, not the starting point.
- **33 to 40.** One lane, WhatsApp intake structured into a live exception log, no new driver behaviour required.
- **40 to 45.** Risk: designing for the transport management system as if it were the system of record when it structurally lags the real one. What you refuse: a reporting tool that requires subcontracted drivers to change how they communicate.

## The trap in this one

**Assuming the truth lives in a system, when it lives in a phone call.** The brief is written from inside the transport management system: it describes a database with a status field and asks for detection logic on top of it. That framing is seductive because the software is exactly the kind of structured, queryable thing an engineer knows how to build against, and a phone call is not. The trap is treating the absence of structure as an obstacle to work around later, rather than as the actual location of the information you need.

Building anomaly detection on GPS pings first produces a system that flags a stopped truck as an exception whether it's a breakdown or a scheduled break, generates false alarms Tomasz's team quickly learns to ignore, and still arrives, on the real exceptions, after the phone call already did. The FDE move is to go where the signal already is — the driver's WhatsApp message to dispatch — and build the structuring layer there first.

## The rubric, applied

A weak attempt designs a GPS-ping anomaly detector against the transport management system, demos it against historical stop events, and never asks how dispatch actually finds out about a real breakdown today. That is 1/1/1/1/1.

A pass identifies within the first ten minutes that the WhatsApp channel, not the software, is the real-time source of truth, names the subcontractor adoption problem explicitly, and proposes structuring the existing channel before building any detection layer on top of GPS data. That is 3/2/1/3/2.

Criterion 4 carries this one: the zero assumes the transport management system is where the data lives because that's what "access" was granted to; the three asks Tomasz, specifically, "when a truck breaks down, what's the first thing that happens, and where does that information go" before touching the system at all.
