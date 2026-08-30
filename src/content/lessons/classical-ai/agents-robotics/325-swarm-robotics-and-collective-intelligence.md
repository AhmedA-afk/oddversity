---
title: "Swarm robotics and collective intelligence"
track: "classical-ai"
status: live
order: 325
summary: "Design collective robotic behaviour through local rules, communication limits, and global safety constraints."
duration: "38 min read"
---

## Learning objective

Swarm robotics studies how many relatively simple robots can produce useful collective behaviour without requiring a single omniscient controller. The attraction is resilience and scale: a warehouse count, crop survey, or environmental scan may continue after an individual unit fails. The danger is also collective. A local rule that appears harmless can amplify congestion, duplicate work, drain a fleet into the same charging bay, or make a hazardous pattern difficult for a human to interrupt.

The engineering goal is not vague emergence. It is a set of local interactions, communication assumptions, and global invariants that can be tested. Define what each robot can observe, what it broadcasts, how it resolves conflicts, and which conditions cause the swarm to slow, disperse, stop, or call for a human. A swarm is still a socio-technical system: ownership, safety authority, and evidence do not disappear because control is decentralized.

## Collective model and calculation

Let robot i have state x_i, local observation o_i, and control u_i. Its update is $x_i(t+1)=f(x_i(t),o_i(t),N_i(t),u_i(t))$, where $N_i$ is the current neighbourhood. A collective objective may reward coverage while penalizing overlap, collision risk, energy deficit, and communication loss. For a coverage task, a useful simplified score is $J=coverage-0.5\,overlap-10\,collisions-0.2\,energy$. The constants are not universal truths; they make the intended trade-off testable.

**Worked trace.** Five survey robots each cover 8 cells in a period. Their union covers 31 cells because nine observations overlap. With no collisions and a total energy cost of 20, the score is $31-0.5\times9-0.2\times20=22.5$. A proposed formation covers 34 cells but creates one close-contact safety violation. Its score becomes $34-10-0.2\times22=19.6$. The safer first formation is preferable despite covering fewer cells. More importantly, a hard separation rule should reject the second result before score comparison if the violation crosses its safety boundary.

A collective claim must be supported by individual evidence. “The region is covered” means every required cell has a time-stamped observation from an eligible sensor, or the system reports the unresolved cells. Do not replace missing evidence with average fleet confidence.

## Four worked scenarios

1. **Routine coverage.** Robots partition a field by local frontier selection. Each broadcasts claimed cells and expires the claim after a short lease. Verify coverage by merging signed observations, not by counting optimistic completion messages.

2. **Communication partition.** Two groups cannot exchange updates. They may duplicate low-risk observation work, but they must not independently command a shared door, charging station, or hazardous actuator. The partition policy defines which tasks are safe to continue.

3. **Robot failure.** One unit stops transmitting. Neighbours wait through a heartbeat grace period, mark its claims tentative, and reallocate only work whose reassignment cannot create a conflict. The goal is graceful degradation rather than instantaneous, unsafe reassignment.

4. **Human interruption.** An operator declares a no-go region. Every agent validates the signed command, updates its local geofence, acknowledges it, and transitions to a safe holding pattern if a route is invalid. The system records non-acknowledging robots for follow-up.

## Implementation blueprint

Implement a small, inspectable control stack:

```text
sense_local_state() -> validate sensor freshness
broadcast_claims() -> attach time, scope, confidence, and lease
receive_neighbour_updates() -> reject replayed or invalid messages
choose_local_action() -> maximize coverage subject to safety and energy
apply_swarm_constraints() -> separation, geofence, shared-resource rules
act_bounded() -> speed and acceleration limits
verify_local_effect() -> observe new position / completed evidence
publish_heartbeat_and_trace() -> support replay and recovery
```

Keep message schemas constrained. A coverage claim is not a movement command; an observation is not an authorization. Use sequence numbers, timestamps, sender identity, and expiry. When a task requires a shared resource, appoint an explicit lease owner or use a coordinator with a recoverable handoff protocol. For simulation, seed randomness and log each neighbourhood graph so a failed collective pattern can be reproduced.

Test at least four policies: random walk, simple repulsion, frontier allocation, and a safety-shielded frontier policy. Compare coverage, duplication, time-to-completion, energy, message volume, minimum separation, and recovery after failure. If a sophisticated policy wins only in a clean simulator, document that result rather than declaring it production-ready.

## Diagnostics and failure analysis

The most common swarm bug is confusing a local heuristic with a global guarantee. Repulsion rules can create oscillating rings around a target; attraction rules can collapse robots into the same narrow passage. Inaccurate positions can make a seemingly safe separation calculation dangerously optimistic. Diagnose with plots of minimum inter-robot distance, claim collisions, fleet connectivity, energy distribution, dropped-message rate, and the number of cells with independent evidence.

Use fault injection aggressively. Remove one robot, create a thirty-second network partition, replay an old geofence command, corrupt one position estimate, and make every robot discover the same high-value target. Expected behaviour is bounded: robots maintain separation, refuse destructive shared actions without current authority, surface coverage uncertainty, and accept the operator's stop command. A system that continues “intelligently” after losing essential coordination is not resilient; it is uncontrolled.

## Graded exercise

Design a five-robot survey swarm for a 10-by-10 grid with two no-go regions, finite battery, and intermittent communication. Submit: a state and message schema; the objective and one hand-worked score calculation; pseudocode for local allocation; deterministic simulation traces for routine operation, partition, failure, and human stop; and a one-page safety case.

**Rubric (20 points):** 5 for precise local state and communication contracts; 4 for correct collective calculation; 4 for a viable implementation plan; 4 for diagnostics, partition behaviour, and safe fallbacks; 3 for clear limits and operator controls. Full credit requires showing how the design prevents duplicate ownership of a high-consequence resource while still allowing low-risk coverage work during a partition.

## Mastery check

- Can you distinguish a global objective from a local rule that only approximates it?
- Does every collective claim have time-stamped source evidence?
- Which commands must stop during a communication partition?
- Can an operator interrupt the entire fleet and identify non-acknowledging units?
- Are safety constraints enforced locally even when coordination infrastructure fails?

