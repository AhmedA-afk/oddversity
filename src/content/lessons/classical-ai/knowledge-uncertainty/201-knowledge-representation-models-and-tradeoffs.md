---
title: "Knowledge representation: models, commitments, and trade-offs"
track: "classical-ai"
order: 201
status: live
summary: "Choose a representation that makes the questions, assumptions, and failure modes of an AI system explicit."
duration: "32 min read"
tags: ["classical AI", "knowledge and uncertainty", "reasoning"]
---

## Why this lesson matters

Choose a representation that makes the questions, assumptions, and failure modes of an AI system explicit. Knowledge-based AI is strongest when it makes its representation and uncertainty explicit: a reader can inspect what the system was told, which inference step it took, and which assumption would change the recommendation. That is a different promise from a system that only produces a score. It is especially valuable where a decision must be reviewed, justified, or revised as new evidence arrives.

This lesson treats the formal machinery as a practical instrument. The aim is not to memorize notation. The aim is to decide what claims a system may make, what it must keep uncertain, and what a human needs to see before trusting a result. Begin by writing the question, the available evidence, the permitted actions, and the cost of a wrong conclusion. Only then choose a representation or inference procedure.

## Core model and worked calculation

A hospital triage assistant must distinguish a fact such as `has_fever(lee)` from a rule such as `has_fever(x) ∧ cough(x) → possible_infection(x)`. The representation determines what can be queried, revised, and explained.

Read the expression as an executable claim with boundaries. Name the population or objects it covers, the time interval in which evidence is valid, and the condition under which the calculation no longer applies. When a quantity is estimated rather than known, record its source and the uncertainty around it. A clean calculation is useful because another practitioner can change one assumption and observe whether the recommendation changes.

A useful discipline is to keep three layers separate: **facts or observations**, **rules or model assumptions**, and **decisions**. A conclusion is only warranted when its trace connects these layers. If a layer is missing, the responsible answer is often “unknown; obtain evidence” rather than a forced label.

## Three worked scenarios

### Scenario 1: operational safety

Compare a database schema, a graph, and a rule set for a maintenance assistant; encode only what each structure can honestly support. Start with a small, inspectable case. List the observable signals, distinguish a direct measurement from a report, and state what action is safe while the conclusion remains uncertain. A safety-critical system should make escalation a first-class output, not a failure of automation.

### Scenario 2: public-facing service

Imagine a service that must respond to a request using incomplete records. Encode the facts that are actually present, then ask which premise the desired conclusion would need. Compare two policies: one that silently assumes missing information is negative and one that asks for clarification or sends the case to review. The difference is a governance choice that should be visible in the trace.

### Scenario 3: model integration

A statistical model produces a confidence-like score while a rule base expresses hard constraints. Treat them differently. A score can prioritize investigation; it should not override a documented constraint without an explicit authority rule. Record the score's calibration conditions, the rule's owner, and the review path if they disagree.

## Implementation blueprint

Use the smallest representation that can support the required query, then keep provenance with every assertion.

```text
INPUT: query q, evidence E, model or rule base K
validate entities, timestamps, and permissions in E
separate asserted facts from inferred statements
build a traceable inference plan for q
compute or search only under K's declared assumptions
measure confidence, ambiguity, or unmet premises
choose action using the approved decision policy
return conclusion, trace, assumptions, alternatives, and escalation rule
```

A production implementation should store source identifiers, rule or model version, input timestamp, and the exact decision policy. Test not only the happy-path answer but also contradictory evidence, missing prerequisites, stale information, and changes to a high-impact assumption. The test suite should prove that a new rule cannot quietly remove an appeal route or expand authority.

## Failure and debugging gallery

- **Hidden assumption:** a conclusion depends on an unstated default. Put the default in the representation and expose it in the explanation.
- **Evidence conflation:** correlated signals are counted as independent support. Model their relationship or downweight the duplicate channel.
- **Semantic drift:** the same label means different things across data sources. Add a definition, owner, and validity interval.
- **False certainty:** the system reports a single answer when several explanations remain plausible. Return alternatives and a request for discriminating evidence.
- **Policy leakage:** a threshold or priority rule is presented as a technical fact. Name the policy owner and document the trade-off.

A notation is not intelligence by itself. Its value is in the inferences it licenses and the errors it makes visible.

## Practice assignment — 20 points

Choose a small decision domain such as fault triage, eligibility review, or inventory inspection. Do not use sensitive personal data.

1. **Representation (5 points):** define at least six facts or variables, their meaning, and the boundary between known and unknown.
2. **Reasoning trace (5 points):** work through two cases step by step, including the calculation, substitution, proof step, or update relevant to this lesson.
3. **Decision and sensitivity (4 points):** state an action rule and show how one changed assumption changes the recommendation.
4. **Failure tests (3 points):** provide one missing-data, one contradictory-evidence, and one stale-data case.
5. **Explanation and governance (3 points):** write the explanation a reviewer receives, name the owner of the policy, and define the escalation or appeal route.

**Rubric:** full credit requires correct mechanics, explicit assumptions, reproducible intermediate steps, and a decision that does not exceed the evidence. Elegant notation without a traceable interpretation earns only partial credit.

## Mastery check

You are ready to continue when you can explain which parts of a result are observed, inferred, estimated, and chosen by policy. You should be able to reproduce the worked calculation, identify one assumption whose failure would invalidate it, and design a safe fallback when the system cannot justify a conclusion.

