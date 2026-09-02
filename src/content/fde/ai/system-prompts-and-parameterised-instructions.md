---
title: System prompts and parameterised instructions
phase: ai
module: prompts-and-structure
kind: lesson
summary: "A hand-written system prompt works for one customer and one policy. The FDE problem is the twentieth policy, and the four-hundredth: instructions built from templates and data, not from a growing pile of hand-edited text."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Separate a system prompt into a fixed template and the variables that change per customer, per intent, or per policy.
  - Explain why hand-writing hundreds of near-duplicate prompts is a reliability risk, not just an effort problem.
  - Version a prompt template the way you would version a schema, and know what a change requires before it ships.
artifact: A parameterised system-prompt template with at least three variable slots, tested against two different sets of inputs, in your repository.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
---

The first customer's support bot gets a system prompt you write by hand: who it is, what it can do, the three policies it enforces, the tone. It works. Then the customer asks for a fourth policy, and a fifth, and by policy twenty you are maintaining one enormous block of prose that nobody fully understands, that breaks in places nobody predicted, and that takes an afternoon to edit safely. This is the wall every FDE hits, and it has a known shape: stop writing prompts, start generating them.

## The Klarna shape of the problem

When OpenAI's field team worked with Klarna and T-Mobile on customer-service automation, hand-writing prompts for policy after policy did not scale past the first handful. The fix, described by the team's head of Forward Deployed Engineering, was to move to **parameterised instructions**: a template that takes structured inputs — the policy text, its conditions, its exceptions — and produces the instruction text, paired with an evaluation set built per intent so each new policy could be checked in isolation. What started as one customer's fix, internally called Swarm, was later validated at T-Mobile at roughly ten times the complexity and eventually became the public Agents SDK. The pattern generalised because the underlying problem — hundreds of near-identical, hand-maintained prompts — is universal, not specific to one customer.

Anthropic's own Forward Deployed Engineer posting lists advanced prompt engineering as a hard requirement, and in practice that phrase means exactly this discipline: building instructions that scale, not writing a clever single prompt once.

## Splitting a prompt into template and data

Most system prompts that grew organically actually contain two things tangled together: a fixed frame (who the assistant is, its tone, its hard boundaries, its output format) and variable content (which policies apply, which tools exist, which customer's data this is). Separate them explicitly.

```python
SYSTEM_TEMPLATE = """You are the support assistant for {customer_name}.
You answer questions about the following policy only: {policy_name}.

Policy text:
{policy_text}

Conditions under which this policy applies:
{conditions}

Exceptions, and what to do when one applies:
{exceptions}

If the customer's situation is not covered by this policy, say so and route
to a human agent. Do not guess at a policy you have not been given.
Respond in {response_language}.
"""

def build_system_prompt(policy: dict, customer_name: str, language: str = "English") -> str:
    return SYSTEM_TEMPLATE.format(
        customer_name=customer_name,
        policy_name=policy["name"],
        policy_text=policy["text"],
        conditions=policy["conditions"],
        exceptions=policy["exceptions"],
        response_language=language,
    )
```

The template is code, reviewed like code. The policy content is data — pulled from a table, a CMS, or the customer's own policy repository — and can be edited by the customer's operations team without anyone touching the prompt engineering. This is the same move as separating a report template from its data source, and it has the same payoff: the twentieth policy costs you a row in a table, not an afternoon of prose.

## Why this is a reliability discipline, not a convenience

A hand-written prompt accumulates small inconsistencies: policy twelve phrases the exception clause slightly differently from policy three, because a different person wrote it on a different day. Those inconsistencies are invisible until an eval catches a case that falls between two policies' inconsistent wording. A template forces every policy through the same structure, which means every policy gets the same treatment of conditions, exceptions, and escalation language — and any bug you find in the template is fixed everywhere at once, not in whichever of four hundred prompts happened to have it.

This is also what makes the eval set from the previous module tractable. If every policy's instructions come from the same template, you can build one eval harness that runs against every policy's rendered prompt, rather than one bespoke test per hand-written variant.

## Versioning instructions like you version a schema

Treat a prompt template the way you treat a database migration: a change is a diff, it has a version, and it does not go live without running against the eval set. In practice this means:

- Store templates in version control, not in a database field edited through an admin UI with no history.
- Tag each rendered prompt (in logs, in traces) with the template version that produced it, so a regression can be traced to the exact change.
- Run the full eval set — every policy, every labelled example — before merging a template change, not just the policy you were editing. A word change meant to fix policy nine can shift behaviour on policy three if both share the escalation clause.
- Keep a rollback path. If a template change ships and the eval regresses in production traffic that the offline set did not cover, you need to revert the template, not the whole deployment.

## The FDE angle

Parameterisation is also a scoping tool. When a stakeholder asks for a new policy to be covered, the honest cost estimate is "one row in the policy table and a labelled eval set for it", not "an engineering sprint". That reframes a feature request that used to feel open-ended into something you can commit to in the same meeting. It is also the reason the reusability targets an FDE is often measured against — roughly a fifth of an engagement's components reused the first time, growing toward half by the third — are achievable at all: a parameterised prompt system is portable to the next customer in a way that four hundred hand-written prompts never will be.

## What you should be able to do now

Given a system prompt that has grown past a few hundred words of hand-tuned prose, you should be able to point at the line where the fixed frame ends and the customer- or policy-specific content begins, and say what would need to change to add a new policy without touching the frame.

Build the artifact now: take a prompt you have already written for an earlier lab, split it into a template with at least three variable slots (customer name, policy or domain content, and one behavioural switch such as language or tone), and render it against two different sets of inputs to confirm the template holds for both.
