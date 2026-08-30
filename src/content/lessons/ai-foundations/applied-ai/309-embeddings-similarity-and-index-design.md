---
title: "Embeddings, Similarity, and Index Design"
track: ai-foundations
status: live
order: 309
description: "Build semantic retrieval by measuring whether nearest neighbours support the downstream task, not by admiring a scatter plot."
---

# Embeddings, Similarity, and Index Design

## Product question and learning objective

Build semantic retrieval by measuring whether nearest neighbours support the downstream task, not by admiring a scatter plot. The central discipline is to connect a technical choice to an accountable decision: who changes behaviour, what evidence supports that change, what happens when the system is wrong, and who can intervene. A useful applied-AI design begins with the existing workflow. Identify the decision, the information available at decision time, the people affected, the reversible and irreversible actions, and the baseline that already works. A model is only one component of that system.

Use this lesson to produce a short decision record. State the intended user, the decision deadline, the primary outcome, a safety or equity guardrail, and an explicit non-goal. If those cannot be written in plain language, implementation should pause. This is not bureaucracy: it prevents teams from optimizing a proxy metric while quietly changing a high-stakes workflow.

## Quantitative decision studio

A compact way to make trade-offs visible is:

cosine_similarity = dot(q,d) / (norm(q)*norm(d)); recall_at_k = relevant_found_at_k / relevant_available

Do not treat the expression as a universal law. It is a prompt to name quantities that are otherwise hidden: volume, uncertainty, review cost, error severity, operational capacity, and the value of a correct decision. Estimate a low, expected, and high case. Then ask which assumption could reverse the decision. A system with attractive mean performance can be unacceptable when its tail failure is severe or when it displaces a safer manual step.

Worked calculation: suppose the workflow handles 10,000 cases per month. A proposal improves 18% of cases by $8 each, creates 0.7% costly failures at $90 each, and costs $4,000 monthly. Its rough monthly value is 10,000 times (0.18 times 8 minus 0.007 times 90) minus 4,000 = $4,100. That is positive only if the error estimate is credible and the affected population is represented. Repeat the calculation at 0.7%, 1.5%, and 3% failure; communicate the break-even point rather than a single optimistic number.

## Worked scenarios

1. **Conservative path.** A policy assistant retrieves similar prior cases. Near duplicates should not crowd out the governing policy, and permissions must apply before ranking. Start with a visible recommendation and a trained human owner. Measure decisions before automating. This reveals whether the proposed model changes useful work or merely produces plausible text.

2. **Failure path.** The input is missing, stale, adversarial, or out of distribution. The system should validate the contract, preserve the original request, explain that it cannot complete the action, and route to a known safe process. “Try again” is not a safety plan.

3. **Scale path.** Demand triples and a new subgroup appears. Recompute the unit economics and slice all quality metrics by workflow, language, region, and risk band. A global average can hide the group that carries the harm.

4. **Counterfactual path.** Compare the AI proposal with a rules-only, search-only, or improved human-tooling baseline. If the baseline wins on quality, cost, or auditability, choose it. A mature team earns credibility by declining unnecessary AI.

## Implementation blueprint

    # Pseudocode: every production decision is observable and reversible.
    request = validate_schema(raw_request)
    context = load_authorized_context(request)  # access checks happen before ranking
    proposal = model_or_policy(request, context)
    decision = apply_thresholds_and_guardrails(proposal)

    if decision.requires_review or decision.is_unsafe:
        result = route_to_human(request, decision.reason)
    else:
        result = execute_reversible_action(decision)

    log_event(request_id=request.id, input_version=request.version,
              policy_version=POLICY_VERSION, model_version=MODEL_VERSION,
              result=result.kind, confidence=decision.confidence)

Replace the placeholder functions with contracts before selecting a framework. validate_schema should reject impossible or unauthorized input; load_authorized_context must scope data to the caller; apply_thresholds_and_guardrails must keep an action within approved boundaries; and log_event must support reproduction without retaining unnecessary sensitive content. Test each boundary with a fixture that should fail.

## Failure diagnostics

Common failures are deceptively ordinary. A team may use a training label created after the decision, report an offline metric that does not map to the operating threshold, silently let a fallback become the dominant path, or measure users who received an AI suggestion rather than the decision it changed. Another frequent failure is authority confusion: an assistant is presented as an adjudicator, or a tool call mutates records before an approval.

When an outcome is surprising, first capture the smallest reproducible case: input version and permissions, retrieved evidence, configuration, model or prompt version, threshold, output, action, and reviewer judgement. Then locate the earliest broken assumption: source data, representation, objective, threshold, interface, human workflow, or monitoring. Do not fix an incident by only adjusting a prompt or a temperature; make the causal hypothesis explicit and test it.

## Graded practice

Choose chunk boundaries, metadata filters, a lexical baseline, an ANN recall target, and a no-answer path.

Submit five artifacts:

1. A one-page decision brief with baseline, outcome, guardrail, non-goal, owner, and affected groups (20 points).
2. A calculation using the equation above with sensitivity analysis and units (20 points).
3. Three scenario tests, including one boundary or adversarial case, with expected and observed results (20 points).
4. Pseudocode or a small prototype with assertions, logs, approval or fallback behavior, and a test plan (25 points).
5. A failure memo: earliest signal, user impact, containment, and the design change you would make (15 points).

A passing submission is specific enough that another person can challenge its assumptions and reproduce its tests. Full credit requires a justified choice not to automate when evidence or controls are inadequate.
