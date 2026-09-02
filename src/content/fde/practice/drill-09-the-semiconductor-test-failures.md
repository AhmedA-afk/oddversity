---
title: "Drill 09: the semiconductor overnight test failures"
phase: practice
module: decomposition-drills
kind: drill
summary: A semiconductor test floor's overnight yield swings between five and twenty percent and the test engineering manager wants a predictive model. Forty-five minutes to discover that the swing is very likely explained by a join across three systems nobody has ever connected, not by a model.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Treat an unexplained pattern as the primary clue instead of jumping straight to a model.
  - Identify a cheap join across disconnected systems before committing to a multi-week build.
  - Frame a predictive model as conditional on a simpler explanation being ruled out first.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Novara Semiconductor runs a final-test facility outside Austin, testing analog and mixed-signal chips for automotive customers. Test yield has been unstable for six weeks: some nights, the overnight batch fails at 4 to 6 percent, other nights it spikes to 18 to 22 percent, with no obvious pattern by product line. You're the FDE brought in by the test engineering team. The Test Engineering Manager opens the meeting:

> "We're wasting hours re-testing parts that should have passed the first time, and the automotive customers are asking questions about our yield stability. I want a machine learning model that looks at the wafer-level test data and predicts which die are going to fail final test, so we can catch it earlier and stop burning test time on parts we already know are bad. Give me a model in three weeks."

You're given a folder of exported test logs: about 40 nights of final-test results, one row per die, pass/fail, and a set of parametric measurements.

## The room

**Wendell Achebe, Test Engineering Manager.** Owns the test-time budget and the customer-facing yield number.

> "I don't need to know why. I need to catch the bad ones earlier, before they burn a test cycle we can't get back."

**Lin Fenghua, Yield and Process Engineer, eleven years on the floor.**

> "A yield swing from five percent to twenty percent between two nights on the same product is not a die-level problem. Die-level defects don't come and go by the calendar. Something about how we're testing changed on the bad nights, and I'd bet on the equipment before I'd bet on the silicon."

**Priya Ramaswamy, Manufacturing Operations Manager.** Owns floor output and cannot afford downtime for investigation.

> "I have three lines running around the clock for a customer with penalty clauses on late shipments. I can give you data. I cannot give you a tester offline for a week so you can go poke around it."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The 4-to-22-percent nightly swing is the strongest clue in the brief, and Wendell's request skips past it. A defect rate that varies that much night to night, on the same products, is far more consistent with something changing about the measurement than with the underlying silicon quality changing — Lin's instinct is the right one, and it points at a join nobody has run yet, not a model.

Novara runs test on four probers from two different vendors, and each prober's control software writes its own log format: pass/fail and parametrics in one export, tool ID and timestamp in a separate maintenance-scheduling system that test engineering does not normally look at, and a third log, from the fab's environmental monitoring system, tracking cleanroom humidity and temperature by zone. Nobody has ever joined these three logs to the die-level test results by timestamp and tool ID, because they live in different systems maintained by different teams, in different formats, and doing it by hand once took a summer intern most of a week for a single month of data.

A straightforward join, done first, would very likely show whether the bad nights cluster on one specific prober, one calibration interval, or one environmental condition — any of which is a testable, fixable, mechanical cause that an ML classifier trained on wafer data alone would never surface, because the wafer data has nothing wrong with it. If the bad nights instead spread evenly across all four probers and all conditions, that is real evidence the swing is upstream in the wafer process, and a predictive model becomes a reasonable next step. Either way, the join is the cheaper and faster experiment, and it has to happen before the three-week model commitment Wendell is asking for.

## What a strong decomposition covers

- **Treating the night-to-night variance itself as the primary signal**, before touching die-level parametrics, since a swing this large in this short a time window is unlikely to be explained by die quality alone.
- **The three data sources that have never been joined**: test results, tool and calibration logs, and environmental monitoring — where each lives, who owns it, and in what format.
- **A cheap, fast experiment first**: join test outcome to tool ID, calibration date, and environmental reading by timestamp for the 40 nights already exported, and look for correlation, before committing to a three-week model build.
- **Priya's real constraint**: any investigation has to work from logs and history, not from taking a tester offline, at least in the first pass.
- **What the ML model would and would not explain.** A predictive model trained only on wafer parametrics assumes the cause is in the wafer. If the real cause is equipment or environment, such a model will either fail to predict well, or worse, learn a spurious correlation that happens to track the bad nights without explaining them, and stop working the moment conditions shift again.
- **The decomposition, in order**: pull and join the three logs; test the tool, calibration, and environment hypothesis against the 40 nights of data already in hand; only if that comes back clean, scope the parametric predictive model Wendell originally asked for.

## A model 45 minutes

- **0 to 8.** What does the test floor's nightly routine look like? How many probers, how are they scheduled, when is calibration run, what changes night to night that a die-level dataset wouldn't capture?
- **8 to 15.** Wendell's test-time budget, Lin's equipment hypothesis, Priya's no-downtime constraint.
- **15 to 23.** Three log sources, three owners, three formats, never joined. Confirm what's exportable without taking anything offline.
- **23 to 33.** Join and correlate first; model second, conditional on what the join shows.
- **33 to 40.** Week-one slice: the 40 nights already exported, joined to tool ID, calibration date, and environmental reading, with a chart of failure rate against each.
- **40 to 45.** Risk: a three-week model commitment that turns out to fit noise if the real cause is mechanical. What you refuse: promising a predictive model before the cheap join has ruled out the simpler explanation.

## The trap in this one

**Reaching for a model before ruling out the trivial cause.** "Give me a model" is a request engineers are especially prone to accept at face value from other engineers, because it sounds technically serious and matches the tools everyone in the room is comfortable with. The trap is subtle here specifically because the requester is also technical: Wendell is not naive about AI, he is under time pressure and has reached for the solution that sounds most modern, and it is easy for an FDE to mirror that instinct rather than question it.

The actual highest-value first move on this drill is not a model at all. It is a join across three systems that have never been connected, run against data that already exists, costing a day or two instead of three weeks. If it finds the mechanical cause, Novara fixes a tester or a calibration schedule and the yield swing disappears without a model ever being trained. If it doesn't, the model Wendell asked for is now justified by evidence instead of a hunch, and it will be a better model for having ruled out the confound first.

## The rubric, applied

A weak attempt starts scoping feature engineering on the wafer parametrics for a three-week predictive model and never looks at which prober tested which die on which night. That is 1/1/0/1/1.

A pass treats the night-to-night variance as the primary clue, proposes the three-log join as the week-one deliverable before any model work, and explicitly frames the ML build as conditional on what that join shows. That is 2/2/1/3/3.

Criterion 4 is doing the work here: the pass is the candidate who asks "where do the tool ID, calibration date, and environmental readings live, and has anyone ever joined them to the test results" — a question about data plumbing that sounds unglamorous next to "build a classifier," and is worth far more.
