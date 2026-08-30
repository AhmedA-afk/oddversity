---
title: "Intelligent Agents: Observations and Action Loops"
track: "ai-foundations"
status: live
order: 102
---

# Intelligent Agents: Observations and Action Loops

## Why this matters

Design an agent as a closed loop: perceive, update a belief, deliberate, act, observe the consequence, and revise. A serious AI system is not defined by a model name. It is defined by a decision boundary, the information available at the moment of action, the cost of being wrong, and the evidence that lets another person audit the result. This lesson treats the method as both a mathematical object and an operational commitment. The aim is to let you calculate a small example, implement a minimal version, inspect its failure modes, and decide when it should not be deployed.

Start by separating four things that are often conflated: the world state, an agent's representation of that state, an action, and an outcome. A representation can be incomplete or wrong; an action can be legal but unwise; and an outcome can be good by luck. That separation makes debugging possible. It also prevents a common pattern in introductory AI: demonstrating a successful toy trace and assuming the same rule will survive noise, ambiguity, distribution shift, or an adversary.

## Core model and worked trace

Represent a decision episode as \(x_t \rightarrow b_t \rightarrow a_t \rightarrow x_{t+1}\), where \(x_t\) is the latent state, \(b_t\) is the agent's belief or internal representation, and \(a_t\) is an action. Give each action a cost \(c\) and each terminal outcome a utility \(U\). The method should make a claim you can test: for a search procedure, it may be path optimality under stated assumptions; for an inference procedure, calibrated posterior estimates under a specified data-generating model; for a controller, bounded error under a disturbance model.

Consider this compact trace. An agent is at state S. It can take action Left with immediate cost 2 and then reaches a goal after cost 6, or Right with immediate cost 4 and then reaches a goal after cost 1. The total costs are \(2+6=8\) and \(4+1=5\). A procedure that picks the smallest immediate cost chooses Left and is wrong for the stated objective; a procedure that compares accumulated path cost chooses Right. Now add uncertain success: Right succeeds with probability 0.8 and failed recovery costs 10. Its expected cost is \(5 + 0.2(10)=7\), so the preferred choice can reverse. The calculation is small, but it shows why assumptions and objectives must be written down.

A second trace tests information. If an observation reports “safe” with sensitivity 0.9 and specificity 0.8, but only 10% of situations are actually safe, then the posterior is not 0.9. Bayes' rule gives \(P(safe|report)=0.9\times0.1/(0.9\times0.1+0.2\times0.9)=1/3\). An agent that treats a sensor score as a probability will make systematically poor choices. A third trace tests constraints: an action with highest utility is forbidden if it violates safety, law, resource, or authority constraints. Optimisation happens inside the feasible set.

## Three applied scenarios

**Scenario 1 — A thermostat reacts to a temperature reading but must account for a delayed heater.** Define the decision owner, a measurable objective, the action set, and a no-action or escalation option. Write the hidden assumptions about data freshness, observation reliability, and who bears the error cost. Then identify the smallest counterexample that would break the proposed method.

**Scenario 2 — A warehouse robot observes partial aisle occupancy before selecting a motion.** Build a table with at least three actions. For every row, record expected benefit, direct cost, uncertainty, and a hard constraint. Compare the action selected by a greedy shortcut with the action selected by the full objective. Explain the practical consequence of the difference.

**Scenario 3 — A support agent sees an incomplete ticket and must decide whether to reply or ask for evidence.** Assume that one input becomes unavailable or misleading. Describe the degraded policy: what evidence remains, which actions are disabled, when a human is notified, and which logs preserve enough context for later review.

## Implementation blueprint

```text
function decide(observation, belief, constraints):
    belief = update_belief(belief, observation)
    candidates = generate_actions(belief)
    feasible = [a for a in candidates if satisfies(a, constraints)]
    if feasible is empty:
        return escalate("no safe feasible action")
    scored = [(a, estimate_value(belief, a)) for a in feasible]
    action = argmax_or_argmin(scored, objective_direction)
    return action, {belief, scored, assumptions, timestamp}

loop:
    observation = perceive()
    action, trace = decide(observation, belief, constraints)
    execute_or_escalate(action)
    log(trace, observed_outcome())
```

The important design choice is not the syntax: it is that the code exposes its belief update, feasibility checks, scoring rule, uncertainty estimate, and decision trace. Unit-test these independently. Use deterministic miniature worlds before noisy data. Record seeds, versions, and data provenance. If the procedure uses a heuristic or learned prediction, run an ablation that compares it with a simple baseline and an abstain policy.

## Pitfalls and diagnostics

- **Objective substitution:** accuracy, depth, or average reward becomes a proxy for the real outcome. Recompute the decision under the stakeholder utility and inspect the cases where the proxy disagrees.
- **Illegal-state bugs:** successor generation, rule firing, or actuator commands permit an action that the real system cannot take. Assert invariants at the boundary, not only in documentation.
- **Silent uncertainty:** missing, correlated, delayed, or adversarial observations are treated as clean independent facts. Log confidence and provenance; test sensor dropout and contradictory evidence.
- **Evaluation leakage:** the algorithm is tested on future information, repeated environments, or labels created after the decision. Freeze a time-respecting evaluation protocol before tuning.
- **No recovery path:** a method produces an answer even when confidence, feasibility, or authority is absent. Include abstention, escalation, timeout, and rollback as actions with explicit semantics.

## Assignment and rubric

Implement a simulated agent loop with an explicit belief state, action log, and a safe abstention action. Submit a concise technical notebook or report containing: (1) a formal problem statement; (2) one fully shown trace or calculation; (3) executable pseudocode or code; (4) three scenario analyses; (5) a failure test; and (6) a decision log or assurance argument.

| Criterion | Points | Evidence |
| --- | ---: | --- |
| Formal model and assumptions | 25 | State, observations, actions, objective, constraints, and assumptions are explicit. |
| Correct trace or calculation | 20 | Intermediate values and conclusion can be independently checked. |
| Implementation quality | 20 | Logic separates perception, reasoning, feasibility, and action; tests cover an edge case. |
| Scenario judgement | 20 | The submission handles uncertainty, trade-offs, and an appropriate abstention or escalation. |
| Communication and provenance | 15 | Claims, data, limitations, and decision record are clear and auditable. |

To reach mastery, do not merely produce a result. Explain which guarantee you rely on, what evidence would falsify it, and what a responsible system does when the guarantee no longer applies.
