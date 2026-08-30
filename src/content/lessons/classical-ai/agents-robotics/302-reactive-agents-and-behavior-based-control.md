---
title: "Reactive agents and behavior-based control"
track: "classical-ai"
status: live
order: 302
summary: "Use behaviour arbitration for low-latency local control, with safety behaviours able to subsume performance behaviours."
duration: "38 min read"
---

## Learning objective

Use behaviour arbitration for low-latency local control, with safety behaviours able to subsume performance behaviours. The objective is to turn a promising idea into a system whose assumptions and limits can be inspected. In classical AI, a decision is only as good as the state representation, action model, and evidence that support it. In robotics, an incorrect assumption can turn into wasted energy, blocked operations, damaged equipment, or harm. The engineering standard is therefore stronger than “the demo worked”: the agent must operate within declared authority, detect when its evidence is inadequate, and leave a trace that an operator can reconstruct.

This lesson uses the same disciplined loop throughout: observe, validate, estimate state, generate bounded candidates, filter constraints, choose, authorize, act, verify the effect, and report. It is useful for physical robots, workflow agents, multi-agent services, and simulation because all are systems that change state under uncertainty.

## Model, trace, and calculation

Each behaviour emits score s_i(o) and action a_i(o); safety shield permits a only if g_j(x,a)<=0 for all j. Before writing code, declare state variables, observations, permitted actions, objectives, hard constraints, and termination conditions. Preserve uncertainty instead of inventing certainty: a measurement has a source, age, coordinate frame, confidence, and failure mode. A soft objective ranks feasible choices; it must never waive a hard constraint.

**Worked trace.** A delivery robot follows a corridor, stops for people, and returns to charge before its reserve is exhausted. Suppose action A saves 4 minutes, while action B costs 1 extra minute but keeps the agent in a safer operating region. If A has a 0.03 chance of a loss measured as 500 safety units, its expected risk cost is $0.03 \times 500 = 15$. If time is worth 1 unit per minute, the apparent gain of 4 is dominated by risk. The correct response is B, a new observation, or escalation—not an unqualified “optimal” action. This small calculation is valuable because reviewers can change the inputs and challenge the decision.

Now make the trace explicit: at t0 record the validated observation; at t1 record estimated state and uncertainty; at t2 list candidate actions and rejected constraints; at t3 record authorization; at t4 independently observe the postcondition. If the postcondition is not observed, the system does not get to claim completion.

## Four worked scenarios

1. **Routine operation.** Inputs agree, the selected action passes every constraint, and independent verification confirms the expected effect. Log the normal case because it is the reference for diagnosing later drift.

2. **Ambiguity.** Two sources disagree. Keep both claims, identify their provenance and freshness, lower confidence, and ask for an observation that can distinguish them. Do not average incompatible semantics into a fabricated fact.

3. **Degradation.** A sensor, network link, actuator, or tool is stale. Enter a bounded mode: reduce speed, stop, use an approved fallback, or hand control to an operator. A stale value is not a current observation.

4. **High consequence.** An action affects a person, protected record, expensive asset, or safety envelope. Require explicit authority, a confirmation step, and an independent completion signal. The ability to act is not permission to act.

## Implementation blueprint

Implement stop, avoid, follow, and recharge behaviours with priorities, hysteresis, and expiry. Build the following interfaces even in a small prototype:

```text
observe() -> validate schema, source, and freshness
update_state() -> retain uncertainty and provenance
generate_candidates() -> include no-op and escalation
filter_constraints() -> reject forbidden actions
select() -> record objective, assumptions, alternatives
authorize() -> enforce consequence and role policy
act() -> use bounded commands and idempotency keys
verify() -> query an independent postcondition
report() -> append replayable trace and metrics
```

Keep validation, authorization, execution, and verification separate. It prevents the planner from grading its own homework, and it permits component-level tests. In simulation, save deterministic scenarios. In a physical system, version the configuration, calibration, maps, policies, and deployment environment alongside the logs.

## Diagnostics and failure analysis

Oscillation at thresholds, stale range data, and priorities that let pursuit outrank emergency stop. Instrument state age, confidence, action rate, rejected constraints, retries, expected-versus-observed outcome, and escalation count. Use replay to determine whether the fault originated in sensing, estimation, planning, communication, control, or an operator interface. Test fault paths deliberately: drop a message, delay an acknowledgement, saturate a sensor, return a malformed tool result, make a command partially succeed, and state an impossible goal.

The desired outcome of a fault test is not heroic completion. It is a bounded and legible response: stop safely, retry idempotently, replan from verified state, or escalate. Be especially alert to oscillation, duplicate side effects, silently stale state, overconfident learned outputs, and shared dependencies that make the safety monitor fail with the planner. A robust agent reports uncertainty as a first-class result.

## Graded exercise

Implement a simulated controller and report traces for normal, blocked, low-battery, and sensor-failure cases. Submit a one-page model, a hand-worked trace with numbers, implementation pseudocode, and tests for routine, ambiguous, degraded, and high-consequence inputs. **Rubric (20 points):** 5 for precise state/action/constraint definitions; 4 for correct calculation or trace; 4 for a complete implementation design; 4 for diagnostics and safe fallback; 3 for a clear limitation and mitigation. Full credit requires naming one assumption that would make the design unsafe if false and showing exactly where the implementation detects or contains it.

## Mastery check

- Can you distinguish an observation from a verified state claim?
- Can you show the numerical trade-off behind a decision?
- Does a hard constraint override the preferred objective?
- Is an effect checked independently after action?
- Can another engineer replay the trace and understand the safe fallback?

