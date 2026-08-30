---
title: "Planning Graphs and Heuristic Extraction"
track: "classical-ai"
order: 123
status: live
summary: "Use reachability layers and mutex relations to detect impossibility and guide search."
duration: "35 min read"
tags: ["classical ai", "search", "planning", "planning graphs"]
---

## Why this lesson matters

Use reachability layers and mutex relations to detect impossibility and guide search. In classical AI, a solution is more than an answer: it is a representation, an algorithm, a set of assumptions, and an argument about what the algorithm guarantees. That discipline is useful whenever an AI system must choose actions that can be inspected, simulated, constrained, or explained. The central question of this lesson is not “which named algorithm is fashionable?” It is “what information must be represented so that a correct decision can be made, checked, and revised?”

Treat the representation as a contract. It tells an implementer what counts as a distinct situation, which moves are legal, how progress is measured, and what evidence is needed before execution. If this contract is vague, even a mathematically correct procedure can repeatedly produce unsafe or unusable output. If it is explicit, the procedure can be unit tested on traces, compared against a baseline, and defended to a reviewer.

## Formal model and calculation

For planning graphs, begin by writing a finite operational model. Let a node or configuration be $s$, a legal decision be $a$, and the transition rule be $T(s,a)$. Let $G(s)$ state whether a goal has been reached. When choices have unequal consequences, attach a cost $c(s,a,s')$ and require an objective such as minimizing total path cost $\sum_t c_t$. The smallest useful model is rarely the smallest code object: it must include every fact that changes legality, cost, observability, or completion.

Worked trace: A planning graph reveals that two actions cannot coexist because their effects interfere. Suppose a candidate sequence has cumulative costs $g=[0,2,5,6]$. An uninformed depth measure sees four positions, but a cost-aware procedure must compare $6$ against alternatives by total cost, not by number of arrows. When an estimate of remaining work $h$ is used, record $f(s)=g(s)+h(s)$ separately. A lower bound is valuable because it can order work; it is not permission to claim that an action will succeed.

Before implementation, calculate three quantities on a toy instance: the branching factor $b$, the maximum depth or horizon $d$, and the number of states expanded. A tree with $b=3$ and depth $d=5$ can contain $1+3+9+27+81+243=364$ nodes. This simple calculation explains why apparently small modelling omissions, duplicate states, or bad action generators can dominate runtime.

## Algorithm blueprint

```text
initialize frontier with the initial configuration
initialize explored evidence according to the algorithm’s invariant
while frontier is not empty:
    choose the next candidate using the stated priority rule
    if candidate satisfies the goal test:
        reconstruct the decision trace and validate each transition
        return trace, cost, diagnostics
    record the candidate only when the invariant permits it
    for each legal successor:
        compute transition evidence, cost, and any bound
        reject invalid, dominated, or policy-forbidden successors
        otherwise add or update the frontier
return unreachable with the explored-state summary
```

The highlighted phrase is “stated priority rule.” A queue, a stack, a heap, a bound, a random draw, or a decomposition method each makes a different promise. Name the rule in the interface and test it. Preserve parent pointers, costs, and the reason a branch was pruned. Those records make it possible to distinguish a genuine no-solution result from an incomplete model, an exhausted budget, or an implementation defect.

## Three worked scenarios

### Scenario 1: constrained operations

A logistics planner extracts a relaxed plan as a lower bound. Define the states and actions in plain language first. Then write one transition table containing preconditions, changed facts, cost, and a reason an action may be rejected. This catches the common error of encoding a desired outcome without encoding what makes it legal. Measure success with an operational metric—for example total time, missed requests, violations, or human review load—not merely whether the search returned a nonempty trace.

### Scenario 2: a decision-support system

An optimistic graph can still miss resource limits that require later checking. Here, distinguish an internal proposal from an authorized action. A reliable system tracks evidence availability, uncertainty, and escalation. It should return “need more information” when its state model cannot justify a recommendation. This is often a superior result to selecting the cheapest-looking action from an incomplete graph.

### Scenario 3: a safety or fairness boundary

undefined Add protected constraints directly to the model instead of treating them as post-processing. Test an adversarial case where a tempting route, assignment, or plan violates a rule. A trace should show the violation being detected before execution. If the rule is probabilistic or disputed, record its provenance and route the decision to review rather than laundering uncertainty into a deterministic answer.

## Failure modes and diagnostics

- **Wrong identity:** two meaningfully different situations share a state key. Symptom: invalid shortcuts or loops. Inspect the state serializer and add the omitted facts.
- **Wrong objective:** the implementation minimizes hops while the business rule cares about cost, risk, or lateness. Symptom: a “successful” but unacceptable answer. Reproduce with a tiny counterexample.
- **Illegal successor generation:** actions are emitted without checked preconditions. Symptom: the reconstructed trace cannot be executed. Validate every edge, not only the final state.
- **Lost invariant:** a node is marked explored too early, a bound is updated incorrectly, or a random seed is unrecorded. Symptom: inconsistent answers on equivalent instances. Log selection order and key values.
- **Unbounded confidence:** a heuristic, simulation, or learned proposal is treated as ground truth. Symptom: confident failure under distribution shift. Keep estimates distinct from verified facts.

## Implementation and evaluation protocol

Build a small reference instance with at least eight named states or variables and two deliberately bad cases. Unit-test state identity, legal action generation, goal testing, cost accumulation, and trace validation independently. Then compare your method with a simple baseline: exhaustive search on a small input, a greedy policy, or a hand-built feasible plan. Report runtime, nodes generated, nodes expanded, solution cost or utility, and every constraint violation. Use a fixed seed for stochastic choices and save the exact instance with the report.

Do not silently coerce missing data into a convenient default. Surface unknown values in the state, include a budget for expansion or computation, and define what “unreachable,” “timeout,” and “requires human approval” mean. In production, the planner’s output should be an auditable proposal with inputs, versioned rules, a trace, and a final execution check.

## Graded exercise

Design and implement a planning graphs solver or planner for one of the scenarios above. Your submission must include: (1) a precise representation; (2) pseudocode or runnable code; (3) three hand-traced decisions or expansions; (4) a baseline comparison; (5) two counterexamples or failure tests; and (6) a one-page operating note explaining what the system may not decide autonomously.

### Rubric — 20 points

- **4 points:** States, actions, constraints, goals, and objective are complete and unambiguous.
- **4 points:** Algorithm implementation preserves its claimed invariant and returns validated traces.
- **4 points:** Calculations and three traces are correct, legible, and tied to the representation.
- **4 points:** Evaluation compares a baseline and reports both quality and resource use.
- **4 points:** Failure, safety, and uncertainty boundaries are concrete; at least two tests demonstrate them.

## Mastery checkpoint

You can move on when you can explain the model before naming the algorithm, derive one decision trace by hand, and state exactly what guarantee depends on which assumption. You should also be able to say what the system does when those assumptions fail. That is the difference between invoking planning graphs and engineering a classical AI component that another person can inspect and trust.

