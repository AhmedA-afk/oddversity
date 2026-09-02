---
title: "Drill 08: the airline operations reschedule"
phase: practice
module: decomposition-drills
kind: drill
summary: An airline's operations centre wants a system to automatically reschedule flights around weather delays. Forty-five minutes to discover that the requested metric, on-time performance, trades off against crew legality and passenger connections that nobody is currently measuring.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Name a metric's hidden trade-offs before building a system to optimise it.
  - Turn an invisible cost into a measured one before an automated system can be evaluated against it.
  - Design decision support that respects a hard constraint instead of an optimiser that might violate it.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Cardinal Air is a regional US carrier running about 210 daily departures out of three hub airports. You're the FDE embedded with Network Operations Control during a slow week, three days after a snowstorm cascaded into two days of delays and cancellations across the network. The VP of Operations opens the engagement:

> "Every time weather hits, my duty managers are moving flights around on gut feel and a whiteboard. I want a system that looks at a disruption — say a ground stop at our hub — and automatically figures out the best way to reschedule the rest of the day: which flights to delay, which to cancel, how to protect the schedule. Our on-time performance took an eleven-point hit last month and the board wants it fixed before winter."

You're given access to the day's flight schedule, aircraft tail assignments, and a log of decisions duty managers made during the storm, with no explanation attached to any of them.

## The room

**Grace Odumosu, VP of Operations.** Owns the on-time performance number the board reviews monthly.

> "On-time performance is the number everyone outside this building understands. If I walk in with a system that improves it, that's a win I can explain in one sentence."

**Marcus Renn, Crew Scheduling Manager.**

> "There are duty-time limits on how long a crew can be on the clock, and once a crew times out, that flight does not go, full stop, no matter what the schedule says. Every reschedule your system proposes has to check against crew legality before it touches anything else, or you'll design something that looks great on a spreadsheet and generates an illegal crew pairing in the field."

**Dana Whitfield, Director of Customer Experience.**

> "Nobody upstairs tracks what happens to a passenger with a connection at our hub when we protect the on-time departure of their first flight by two minutes and they miss the second one by three. That passenger's trip just failed and it won't show up anywhere in the number Grace reports."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

On-time performance, the number Grace's board watches, measures whether a flight leaves the gate within fifteen minutes of schedule. It says nothing about whether the passengers on that flight actually reach their destination on their itinerary, and nothing about whether the crew operating the next leg is still legal to fly it. During the storm, several duty-manager decisions in the log improved the on-time performance of an early departure while breaking a downstream connection for dozens of passengers, or pushed a crew close enough to its duty limit that the following flight had to be cancelled outright hours later for a reserve crew that didn't exist.

Three real constraints are in tension and nobody at Cardinal Air owns the trade-off between them. Crew legality is non-negotiable and Marcus's team already enforces it, but only by hand, reactively, often after a reschedule has already been proposed. Passenger misconnects are real cost — rebooking, hotels, goodwill compensation — but they are invisible in the metric Grace reports upward, so a system built to maximise on-time performance has every incentive to sacrifice them. And a system that optimises for on-time performance alone will, predictably, learn to protect early short-haul flights at the expense of connections and crew legality on the flights behind them, because that is what the metric rewards.

Grace's request for "the best way to reschedule" assumes a single objective. There are at least three, they conflict, and building against the one she named first without surfacing the other two produces a system that makes the board's number look better while making the operation worse in ways nobody is currently measuring.

## What a strong decomposition covers

- **Naming all three objectives before designing anything**: on-time performance, crew legality, passenger connection integrity — and stating plainly that they trade off against each other.
- **Crew legality as a hard constraint, not an objective to balance.** Marcus's rule is not "minimise crew legality violations," it is "zero, always." Any reschedule proposal has to pass this check before it is a candidate at all.
- **Making the invisible cost visible.** Passenger misconnects have to become a tracked number before any system can be evaluated against it, because right now nothing measures what Dana is describing, so a system that harms it would report as a success.
- **Who owns the trade-off between on-time performance and misconnects**, once both are visible — probably not the FDE's decision, and probably not Grace's alone, but a question the engagement needs answered explicitly rather than defaulted by whichever metric was easiest to build against.
- **The decomposition**: a crew-legality checker as the first, hard-gating component; a misconnect-impact estimate as a new metric to compute and report, even before any automation touches decisions; then a reschedule-suggestion tool, gated by both, that duty managers approve rather than a fully automated re-planner.
- **The walking skeleton**: for one disruption type — a single-aircraft mechanical delay at the hub — a tool that proposes two or three legal reschedule options, each annotated with its on-time performance impact and its passenger-misconnect impact, for a duty manager to choose between. Not an autonomous scheduler.

## A model 45 minutes

- **0 to 8.** Walk through how a duty manager actually rescheduled flights during the storm, decision by decision, and what information they had in front of them at the time.
- **8 to 15.** Grace's on-time performance number, Marcus's non-negotiable legality constraint, Dana's invisible misconnect cost — and which of the three currently gets measured at all.
- **15 to 23.** The schedule data, the tail assignments, and whether crew duty-time data and passenger connection itineraries are even joined to the same system today.
- **23 to 33.** Crew-legality gate first, misconnect-impact measurement second, reschedule-suggestion tool third.
- **33 to 40.** One disruption type, a small set of legal options with both metrics shown, duty manager decides.
- **40 to 45.** Risk: a system optimised for on-time performance alone quietly breaks crew legality or passenger connections. What you refuse: full autonomy over rescheduling decisions.

## The trap in this one

**Chasing the wrong metric.** Grace names on-time performance because it is the number her board understands and the one she is measured on, and it is genuinely tempting to build straight at it: a system that reduces gate delays is easy to demo and easy to explain. The trap is that on-time performance is a proxy, not the goal, and it is a proxy that can be improved in ways that make the actual operation — legal crews, connected passengers — worse. A system that hits Grace's number by sacrificing what Marcus and Dana are responsible for will look like a win in the boardroom and a disaster in the operations centre, and nobody will connect the two until months later.

The FDE move is to surface all three objectives in week one, make the currently invisible one, misconnects, measurable before building anything, and design the crew-legality constraint as something the system cannot violate rather than something it is graded on. Improving on-time performance is still a fine outcome. It cannot be the only thing the system is built to do.

## The rubric, applied

A weak attempt designs an optimiser that reschedules flights to maximise on-time departures, treats crew legality as a check to add later, and never asks what happens to passenger connections. That is 1/1/1/1/1.

A pass names all three objectives and their conflict in the first fifteen minutes, treats crew legality as a hard gate from the start, proposes measuring misconnects before building anything, and designs a decision-support tool rather than an autonomous scheduler. That is 2/3/3/2/3.

Criterion 3 is the tell: a zero is a candidate who accepts on-time performance as the metric without asking what it trades against; a three names the trade-off, names who is currently unaccountable for the losing side of it, and asks the room who should own that call.
