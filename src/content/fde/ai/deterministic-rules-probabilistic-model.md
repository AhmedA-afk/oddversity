---
title: "Deterministic rules, probabilistic model: where the line goes"
phase: ai
module: guardrails-cost-and-choice
kind: lesson
summary: "A model should never be the thing computing a number that has one correct answer defined by policy. It should reason, propose, and explain. Code should enforce every hard constraint that a wrong answer would actually cost someone money or safety over."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Identify which parts of a workflow have a single correct answer defined by policy or physics, and which have genuine judgment involved.
  - Design a system where the model proposes and code validates, rather than trusting the model's own arithmetic or rule-following.
  - Explain this split to a stakeholder who wants to know why the "AI" doesn't just make the final call.
artifact: A short design note for one workflow from a lab in this path, marking which decisions are enforced in code and which are left to the model, with a reason for each.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
---

A model can read a supply disruption, reason about which suppliers could plausibly cover the shortfall, and draft a persuasive reallocation plan. It should not be the thing that decides whether that plan violates a supplier's minimum order quantity, because that is not a judgment call — it is a fact, sitting in a database, that either is or is not violated. Ask the model to check it and it will usually get it right and occasionally, confidently, get it wrong. Ask code to check it and it will get it right every time, because that is what code is for.

## The test: does this have one correct answer

The line is not "important versus unimportant" or "hard versus easy". It is whether the decision has a single correct answer determined by policy, contract, or physical fact, independent of interpretation. A supplier's minimum order quantity is a number in a contract. A material's lead time is a fact about how long shipping takes. A regulatory reporting deadline is a date. None of these are things to reason about — they are things to look up and enforce, and a model reasoning its way to "approximately correct" on a fact that has one exact correct value is strictly worse than a database query.

Contrast that with genuine judgment: which of three plausible reallocation plans best balances cost against delivery risk given a customer's stated priorities this quarter, or how to phrase a rejection so a frustrated customer stays a customer. These have no single correct answer, they depend on context and values, and this is exactly where a model earns its place — reasoning over ambiguous, weighable factors is what it is comparatively good at, in a way rule-based code is not.

## A worked example: disruption orchestration

In a supply-chain disruption scenario — a tariff shock forcing a reallocation across manufacturing, logistics, and procurement — the architecture that field engineers built kept every hard constraint in code: supplier minimum order quantities, material coverage requirements, contractual lead times. The model's role was to reason about which reallocation options were worth considering, explain tradeoffs in language a procurement manager could act on, and call a simulator to test a proposed plan's downstream effects before anyone committed to it. The model never directly wrote a number into a system of record; it proposed, the simulator and the deterministic constraint checks validated, and only a validated plan reached a human for approval.

```python
def validate_reallocation(plan: ReallocationPlan, constraints: SupplierConstraints) -> ValidationResult:
    violations = []
    for line in plan.lines:
        moq = constraints.minimum_order_quantity(line.supplier_id, line.part_number)
        if line.quantity < moq:
            violations.append(f"{line.part_number}: {line.quantity} below MOQ of {moq}")

        lead_time = constraints.contractual_lead_time(line.supplier_id, line.part_number)
        if line.required_by < today() + timedelta(days=lead_time):
            violations.append(f"{line.part_number}: required date violates {lead_time}-day lead time")

    return ValidationResult(valid=not violations, violations=violations)
```

This function has nothing to do with a model. It is a lookup and a comparison, and it runs on every plan the model proposes before that plan reaches a human, regardless of how confident the model's own explanation sounded.

## The pattern, generalised

For any workflow you are building, sort every decision point into one of two buckets before writing a prompt:

- **Enforced in code:** anything with a defined correct answer — hard business rules, contractual terms, regulatory thresholds, arithmetic on structured data, anything you would write a unit test for with a single expected output.
- **Left to the model:** anything requiring synthesis across ambiguous or conflicting signals, natural-language reasoning, drafting, summarisation, or weighing genuinely competing priorities where a domain expert would say "it depends".

When you are unsure which bucket a decision belongs in, ask the domain expert whether two competent people doing this job would always agree on the answer. If yes, it belongs in code — you are looking for the rule they are both applying, even if neither of them has written it down. If no, it is a judgment call, and the model's job is to reason about it well and show its reasoning, not to be trusted as the final authority regardless.

## The FDE angle

Stakeholders sometimes want the opposite of this split — they want the model to make the final call because it feels more impressive, or they distrust "hardcoded rules" as inflexible. The answer that lands is practical, not philosophical: code enforces the constraints because code is the only thing you can prove behaves the same way every time, and that provability is what an auditor, a regulator, or your own eval suite from the earlier module in this phase actually checks. A model that occasionally gets a minimum order quantity wrong is not a rare edge case worth tolerating — it is a predictable failure mode you are choosing not to prevent, and the choice not to enforce it in code is the thing you will have to explain when it happens.

This split also directly determines what your eval needs to cover. The eval for the deterministic layer is ordinary unit testing — the answer is known, you assert equality. The eval for the model's proposals is the harder, domain-expert-labelled kind from earlier in this phase, because there the correct answer is a matter of judgment, not fact.

## What you should be able to do now

Given a workflow description, you should be able to sort its decision points into "enforced in code" and "left to the model" within a few minutes, and defend each placement with the "would two competent people always agree" test rather than intuition.

Write the design note now: take one workflow from a lab you have already built in this path, list its decision points, mark each one, and give a one-sentence reason for the split.
