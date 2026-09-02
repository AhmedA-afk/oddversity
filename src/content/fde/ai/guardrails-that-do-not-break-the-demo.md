---
title: Guardrails that do not break the demo
phase: ai
module: guardrails-cost-and-choice
kind: lesson
summary: "A guardrail bolted on after the fact tends to refuse legitimate requests as often as it catches bad ones. Design guardrails as part of the system from day one, tested against the same real inputs your eval set already has, or they will fail in front of the exact audience you needed to convince."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Name at least three categories of guardrail a customer-facing AI system needs, and what each one is actually protecting against.
  - Explain why a guardrail added late tends to over-refuse, and design one that doesn't.
  - Write a guardrail test that uses the same eval set as the system's accuracy tests, not a separate ad hoc list.
artifact: A guardrail layer (input validation, an output check, and a graceful refusal message) added to a system from an earlier lab, tested against both the cases it should block and the legitimate cases it must not.
---

The most common way a pilot fails in the room is not the model getting an answer wrong. It is the model refusing a completely reasonable request in a way that looks broken, in front of the person you needed to impress. That failure usually traces back to a guardrail added in a hurry, late, by someone who was optimising for "never say anything bad" without checking what it would cost in false refusals.

## What a guardrail is actually protecting against

Guardrails are not one thing. Three categories cover most of what a customer-facing system needs, and conflating them produces the over-broad, brittle filter that breaks demos:

**Input validation.** Catching malformed, malicious, or out-of-scope input before it reaches the model at all — a prompt-injection attempt hidden in a document the system is asked to summarise, a request clearly outside the system's intended scope, input that would blow the token budget. This is the cheapest guardrail to get right because it runs before any model call and can be tested like ordinary input validation.

**Output validation.** Checking what the model produced before it reaches the user or a downstream system — the schema validation from the structured-outputs lesson is one form of this; a second form is a content check specific to the domain, such as confirming a claims-triage system's decision field is never `auto_approve` when the confidence score is below the threshold your eval set established.

**Behavioural boundaries.** Constraints on what the system is allowed to do regardless of what it is asked — a support agent that can look up account information but is never permitted to change a password without a second verification step, a claims assistant that can draft a denial letter but cannot send it without human sign-off. These are usually enforced as the deterministic layer from the previous lesson, not as a prompt instruction the model might or might not follow.

## Why late guardrails over-refuse

A guardrail added after a demo has already gone wrong once is usually written to prevent that specific embarrassing case, broadly. A content filter tuned to block one bad output about a sensitive topic often ends up blocking every mention of that topic, including the many legitimate ones a real user will actually ask about. The result is a system that refuses a policy question about a legally protected leave category because the guardrail pattern-matches on a keyword, in front of the HR team that was supposed to be reassured, not alarmed.

The fix is not writing a more careful keyword list. It is testing every guardrail against the same eval set the rest of the system already has — the labelled examples a domain expert produced in the evals-first module — because that set already contains the legitimate hard cases the guardrail must not block, alongside whatever new cases prompted the guardrail in the first place.

```python
def test_guardrail_does_not_overblock(guardrail, eval_set):
    false_positives = [
        example for example in eval_set
        if example.label != "should_block" and guardrail.blocks(example.input)
    ]
    assert not false_positives, f"Guardrail blocked {len(false_positives)} legitimate cases"
```

Run this test alongside the ordinary accuracy eval, not as an afterthought. A guardrail with a 100% catch rate on bad inputs and a 15% false-positive rate on legitimate ones is not a working guardrail — it is a system that will visibly malfunction for roughly one in seven real users, and that number will surface in the pilot, not before it.

## Designing the refusal itself

When a guardrail does correctly block something, what the user sees matters as much as the fact that it blocked. A bare refusal — "I cannot help with that" — reads as broken, especially to a stakeholder watching a demo who does not know it was supposed to be blocked. A designed refusal explains, in the customer's terms, what happened and what to do instead: "This looks like a request to change account ownership, which needs a verified callback rather than a chat message — I've flagged this for a specialist to call you back within the hour." The second version is a feature. The first looks like a bug regardless of whether it technically is one.

## The FDE angle

The instinct in a first build is to add guardrails as a final pass before a demo, treating them as a safety patch rather than part of the architecture. That ordering is exactly backward for the reason above: a guardrail with no accuracy testing against real cases is more likely to embarrass you in the room than the thing it was meant to prevent. Build guardrails alongside the eval set from the start of this phase, test them against the same labelled examples, and treat a guardrail's false-positive rate as a number you report to the customer with the same seriousness as the model's accuracy — because from the end user's seat, an over-eager refusal and a wrong answer are the same experience: the system did not do what a reasonable person expected.

## What you should be able to do now

Given a customer-facing AI system, you should be able to name which category — input validation, output validation, or behavioural boundary — a proposed guardrail belongs to, and design a test for it that checks both what it correctly blocks and what it must not.

Build the artifact now: add a guardrail layer to a system from an earlier lab — one input check, one output check, and a graceful refusal message — and run it against both your eval set's legitimate cases and at least three cases specifically designed to trigger it, confirming it catches the latter without touching the former.
