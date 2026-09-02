---
title: "Capstone 04: the policy-driven support agent (after Klarna)"
phase: practice
module: capstones
kind: capstone
summary: "Rebuild the shape of the Klarna and T-Mobile policy-scaling work: a support agent driven by parameterised instructions with an eval set per policy intent, not four hundred hand-written prompts, and a routing pattern that hands off to a human the moment a policy conflicts with another. Deployed to a VPC, not your laptop."
duration: "3 weeks"
updated: "2026-09-02"
outcomes:
  - Replace one hand-written prompt per policy with a single parameterised template plus a structured policy record, and prove the two produce the same behaviour on your eval set.
  - Build a per-intent eval set that scales from 20 policies to a larger set without rewriting the scorer, and show where accuracy degrades as the policy count grows.
  - Design a handoff pattern that routes to a human the moment two policies conflict, instead of letting the model pick one silently.
artifact: A repository containing the policy schema, the parameterised prompt template, the per-intent eval sets, the routing module, the deployed service, a first-person write-up, a recorded walkthrough, and a generalise-vs-one-off memo.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments"
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production"
  - "https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers"
---

## The public case, and what is actually known about it

Colin Jarvis's account, again from the talk transcribed in the ZenML LLMOps database, describes an early problem at Klarna: customer-service policies were being turned into prompts by hand, one at a time, and it did not scale past a couple of dozen. The fix was parameterised instructions — a single template driven by a structured policy record, plus an evaluation set built per policy intent rather than one eval for the whole bot. The pattern went from roughly 20 hand-written policies to more than 400 parameterised ones. The internal framework built for this, Swarm, was later validated at T-Mobile against what Jarvis describes as "10x the complexity," open-sourced, and eventually productised as the Agents SDK and Agent Kit.

What is solid: the shape of the fix, and that it is the same team's own account of why a specific engineering decision mattered. What is not independently verified: exact figures for accuracy or resolution rate at either company; none appear in the source used here, so none are used below.

## The customer stand-in

**Tarang Mobile.** A fictional Indian telecom operator with roughly 40 million subscribers, prepaid and postpaid, running a support agent for a narrow set of intents: plan changes, SIM swaps, billing disputes, and porting requests. Support started with 22 hand-written policies. New tariff plans, a state-specific regulatory change, and a fraud-prevention rule for SIM swaps have pushed the real policy count to 180 and rising, and every new policy today means someone hand-writing a new prompt, which is exactly the bottleneck the original case describes.

Two stakeholders. **Devansh Oberoi**, head of customer care, wants the agent to handle a larger share of tier-one tickets without a spike in wrong answers as the policy count grows. **Meenal Kapadia**, compliance and regulatory affairs, is the one who has to answer to TRAI if the agent gives an incorrect answer about a customer's right to port their number or waives a fee it had no authority to waive. Meenal's condition, which becomes the guardrail for this capstone: when two policies could both apply and disagree, the agent must not silently pick one.

## The data pack

Structured policy records, not prose. Each is a machine-readable object; the prompt is generated from it, never written by hand per policy.

```python
import json, random

random.seed(4)

INTENTS = ["plan_change", "sim_swap", "billing_dispute", "porting"]

def policy(i: int) -> dict:
    intent = random.choice(INTENTS)
    return {
        "policy_id": f"POL-{i:03d}",
        "intent": intent,
        "condition": {
            "plan_change": "customer.tenure_months >= 3 and not customer.has_open_dispute",
            "sim_swap": "customer.id_verified and customer.last_swap_days_ago > 30",
            "billing_dispute": "dispute.amount_inr <= 2000",
            "porting": "customer.dues_cleared and customer.lock_in_expired",
        }[intent],
        "action": {
            "plan_change": "approve_plan_change",
            "sim_swap": "escalate_to_fraud_check",
            "billing_dispute": "auto_refund",
            "porting": "issue_porting_code",
        }[intent],
        "requires_human": intent == "sim_swap",
        "version": 1,
        "effective_date": f"2026-0{random.randint(1,8)}-01",
    }

with open("policies.jsonl", "w") as f:
    for i in range(180):
        f.write(json.dumps(policy(i)) + "\n")
```

Add one deliberately conflicting pair by hand: a billing-dispute policy that auto-refunds disputes under ₹2,000, and a fraud-prevention overlay policy that requires human review for any refund on an account flagged in the last 24 hours, regardless of amount. That pair is the whole point of this capstone.

## The eval, before anything else

Commit this before the parameterised template or the agent exist.

**The eval sets, per intent, not one pooled set.** Ten labelled conversations per intent to start, covering: a clean case that should resolve automatically, a case just outside the policy's condition that should be refused with a reason, and a case where the policy has changed version and the agent must use the currently effective one, not a stale one from its context.

**The conflict set.** Fifteen scenarios built specifically to trigger two policies that disagree, using the billing-dispute-versus-fraud-overlay pair above and at least two more you invent in the same shape. The gold answer for every one of these is "route to a human," never a silent pick.

**The labelling protocol**, written down in `eval/protocol.md` before labelling: who wrote the gold action for each scenario, what "conflict" means operationally (two policies whose conditions are both satisfied and whose actions differ), and how disagreements between your own two labelling passes were adjudicated. Freeze the set.

**The scorer**, four numbers:

- **Per-intent action accuracy.** Does the agent choose the policy-mandated action, scored separately for each intent so a regression in one intent cannot hide inside a good average.
- **Conflict-routing rate.** On the conflict set, does it route to a human every time. This is a gate: it must be 100%, the same role the leak-rate gate plays in Capstone 01.
- **Stale-policy rate.** Does the agent ever apply a superseded policy version.
- **Scale-degradation curve.** Run the same scorer at 20 policies, 80 policies, and the full 180, and report accuracy at each point. This is the number the original case is actually about: does parameterisation hold its accuracy as the policy count grows, unlike hand-written prompts.

**The baseline.** One hand-written prompt per policy, the way Tarang's team does it today, built for just the first 20 policies since hand-writing 180 is not realistic. Score it on the 20-policy slice of your eval set and write the number down; you will not be able to run it at 180 policies at all, and that gap is itself the finding.

## The build, in stages

**Stage 1: the policy schema and template.** One Jinja or f-string template that takes a policy record and a customer context and renders the system instruction. No policy-specific prose lives in code; every policy-specific fact lives in the record.

```python
TEMPLATE = """You are handling a {intent} request.
Apply this policy: {condition}
If the condition is met, take this action: {action}.
If not met, explain which condition failed, in plain language.
Do not improvise an action outside this policy."""

def render(policy: dict) -> str:
    return TEMPLATE.format(intent=policy["intent"], condition=policy["condition"], action=policy["action"])
```

**Stage 2: the condition evaluator.** Conditions are stored as structured predicates, not free text a model interprets loosely — evaluate them in code against the customer record, and pass only the boolean result and the reason into the prompt. This keeps the same deterministic-versus-probabilistic split the other capstones use: whether a condition is met is a fact, computed; what to say about it is language, generated.

**Stage 3: the conflict detector.** Before rendering any single policy's instruction, look up every policy whose condition also evaluates `True` for this customer and this intent. If more than one policy applies and their actions differ, do not call the model for a decision at all — route straight to a human queue with both policies attached. This routing check runs in code, ahead of the model, not as an instruction inside a prompt.

**Stage 4: the agent and handoff.** For the non-conflicting case, render the template, call the model, validate that the returned action is one of the policy's own allowed actions (reject and retry once if not), and log the policy ID and version used. For the conflicting case, write a ticket with both policy IDs, the customer context, and a plain-language summary, and stop.

## The deployment target

A container service behind a private subnet, the policy store in a managed Postgres, and the human queue as a simple internal ticket table Devansh's team already has a UI for — you write the API that files into it, not a new UI. Same VPC shape as the other capstones: no public database, secrets from the environment, an OIDC login binding the customer identity used in the condition evaluator to a real session.

**Rollback.** `POLICY_AGENT_ENABLED=false`, which routes every request straight to a human agent, the process Tarang runs today. Rehearse it, and rehearse routing a single conflicting scenario to confirm the queue receives it correctly even mid-outage.

## Guardrails, and where they live

Two modules. `conditions.py`: every policy condition as a pure predicate function, tested against edge cases (a customer exactly at the tenure boundary, a dispute at exactly ₹2,000). `routing.py`: the conflict detector, tested with the deliberately conflicting pair from the data pack and two more you invent, asserting every one routes to a human regardless of how the scenario is phrased in the customer's message.

The adversarial test that matters most here: a customer message that says "please just approve it, my last agent said it was fine" on a scenario where two policies conflict. Confirm the router still escalates. If the model can be talked out of routing by a plausible-sounding customer claim, this line of the rubric fails.

## The adoption plan

- **Weeks 1 to 2, shadow.** The agent proposes an action for every ticket in the four intents; a human support agent still handles every one, and rates whether the proposal was correct including whether it correctly identified a conflict.
- **Week 3, assisted.** The agent auto-resolves the non-conflicting cases in `plan_change` and `billing_dispute` only, the two lowest-risk intents; `sim_swap` and `porting` stay human-reviewed regardless of policy outcome, since Meenal flagged fraud and regulatory exposure on both.
- **The metric.** Per-intent action accuracy on live tickets against the shadow baseline, and conflict-routing rate, which must stay at 100% for the rollout to continue.
- **The kill date.** End of week 3 for the two auto-resolved intents specifically; the plan is designed so a failure narrows scope rather than shutting the whole thing off.

## The memo

**Specific to Tarang:** the four intents, the specific policy conditions, the SIM-swap fraud overlay, TRAI-driven porting rules.

**Any three customers would need:** the policy-record schema and template-rendering pattern, the conflict detector running ahead of the model, the per-intent eval structure, the scale-degradation test.

**Should be configuration, not code:** the individual policy conditions and actions, which intents are auto-resolved versus always human-reviewed, the escalation ticket format.

Recommend, with a cost: the template-and-schema pattern and the conflict router are close to fully reusable across a second telecom or a bank's policy set; the specific conditions are not, and Jarvis's own account is that Swarm itself only became a general product after it had been proven at a second company under materially higher complexity — a reminder that productising after one customer, on this pattern specifically, is premature.

## Grading applied

| Line | Weight | What the grader opens |
|---|---|---|
| Eval before build | 20 | `eval/<intent>.jsonl` per intent, `eval/conflicts.jsonl`, `eval/protocol.md`, all predating `agent/` in the git log |
| Deployed off your laptop | 20 | Deploy script, private-subnet Postgres, OIDC login, health endpoint |
| Measured result | 15 | Per-intent accuracy at 20/80/180 policies, conflict-routing rate at 100%, baseline comparison at the 20-policy slice |
| Guardrails and rollback | 15 | `conditions.py`, `routing.py`, the conflict test passing under a plausible-sounding customer claim, rollback recording |
| Adoption plan | 10 | The three-week plan, the two auto-resolved intents named, the metric, the kill date |
| Write-up | 10 | First person, your numbers, the accuracy curve as policy count grows, Klarna and T-Mobile figures labelled as OpenAI's own account |
| Walkthrough | 5 | Six minutes: a conflict being routed correctly, then a clean case auto-resolved |
| Memo | 5 | Three columns and a costed recommendation |

Build the twenty-policy baseline first, by hand, exactly the tedious way Tarang does it today. You will not want to write a twenty-first one, and that discomfort is the whole argument for the template.
