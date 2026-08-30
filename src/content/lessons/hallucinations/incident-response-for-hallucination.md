---
title: "Incident Response When a Hallucination Ships"
track: "hallucinations"
status: live
summary: "The playbook for a shipped hallucination: contain it, classify the root cause, apply the targeted fix, and add a regression test."
duration: "7 min read"
---

Every guardrail in this module can fail. When one does and a hallucination reaches a user, what happens in the next hour and the next week matters as much as the guardrail did. This lesson is the playbook for that moment.

## What it is

Incident response for hallucination is the same discipline as any production incident response — contain, diagnose, fix, prevent recurrence — applied with one specific addition: the diagnosis step uses the hallucination taxonomy from earlier in the track to classify *what kind* of failure this was, because the fix is different for each kind. A guess-and-patch response without that classification step tends to fix the symptom in front of you and leave the actual failure mode free to recur in a different shape next week.

## The mental model

Four stages, in order, and skipping ahead in the order is the most common way incident response goes wrong:

1. **Contain** — stop the bleeding before you understand the cause.
2. **Classify** — use the [taxonomy](/learn/hallucinations/what-is-a-hallucination) to name the failure precisely.
3. **Fix** — apply the targeted mitigation for that specific failure type, not a generic tightening of everything.
4. **Regress** — add the case to your eval set so this exact failure can never silently reappear.

## Why it works this way

Containment has to come first because diagnosis takes time you don't have while the same failure keeps recurring live. But containment without classification just means you're guessing at what to disable, and disabling too broadly (turning off a whole feature because one path in it failed) costs more than the incident itself often warranted.

Classification is the step teams skip under pressure, and it's the one that determines everything after it. "The model gave a wrong answer" is not a diagnosis — [intrinsic vs. extrinsic](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination) tells you whether the model contradicted its own context or invented something ungrounded in it, and those need opposite fixes: an intrinsic failure means tightening how the model uses context it was already given (prompting, lower temperature); an extrinsic failure with no supporting source at all means the grounding or retrieval layer let an ungrounded claim through and needs a guardrail, not a prompt tweak. The [taxonomy decision tree](/learn/hallucinations/taxonomy-decision-tree) is the tool for doing this classification quickly and consistently rather than re-deriving it under pressure each time.

## A concrete example: a mock incident, start to finish

**Report.** A user of the clinical-documentation assistant flags that a generated answer stated a drug interaction that doesn't exist — support escalates it as a P1.

**Contain (minutes 0–15).** The specific query pattern (this drug pair) is added to a temporary blocklist that forces escalation for any matching request, while the team investigates. This is narrower than disabling the interaction-lookup feature entirely — narrow containment based on what's actually known, not a broad kill switch based on fear.

**Classify (minutes 15–60).** Pulling the audit log for the request (the same logging built in [monitoring hallucination in production](/learn/hallucinations/monitoring-hallucination-in-prod)) shows: retrieval returned no matching entry for this exact drug pair, but the model answered anyway, describing an interaction that resembles a different, more common pair. This is [extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination) — nothing in the retrieved context supports the claim — combined with a [guardrail failure](/learn/hallucinations/high-stakes-case-study): grounding was supposed to be mandatory for this risk tier, and empty retrieval should have forced an escalation, but didn't.

**Fix (hours 1–4).** The root cause traces to the guard's empty-retrieval check: it was checking for `sources == None` but the retriever was returning an empty list `[]` on no match, which passed that check. The fix is a two-line change to the check, not a broader model swap or prompt rewrite — because the classification correctly identified this as an enforcement gap, not a model capability gap.

```python
# before: missed the empty-list case entirely
if sources is None:
    return escalate()

# after: treat "nothing retrieved" as nothing retrieved
if not sources:
    return escalate()
```

**Regress (day 1–2).** The exact query, and a handful of variants with other drug pairs missing from the database, get added to the golden eval set from [building a golden eval set](/learn/hallucinations/building-golden-eval-set), tagged as an empty-retrieval-escalation case, so a future refactor of the guard logic can't reintroduce this exact gap without CI catching it.

## Where it shows up

Any production system with the stack from this module will eventually have an incident — that's not a sign the architecture failed, it's the expected long-run behavior of a probabilistic system with imperfect detection. What separates a mature reliability practice from a fragile one isn't zero incidents, it's how fast classification happens and whether the same root cause ever recurs.

## Watch out for

- **Fixing the symptom instead of the classified cause.** Patching the specific query that triggered the report, without checking whether the guard logic itself has the gap, guarantees a different query hits the same hole later.
- **Skipping the regression test because the fix "obviously works."** An untested fix for a hallucination incident is exactly the kind of thing that regresses silently on the next refactor — this is where the loop back to [CI](/learn/hallucinations/tracking-hallucination-in-ci) actually closes.
- **Treating every incident as a model problem.** Many production hallucinations, as in the example above, trace to an enforcement gap in the guardrail or pipeline code, not a limitation of the model itself — classify before you reach for a bigger model.

## Where next

The [production reliability cheatsheet](/learn/hallucinations/production-reliability-cheatsheet) includes a compact version of this playbook for quick reference during an actual incident. The [monitoring lesson](/learn/hallucinations/monitoring-hallucination-in-prod) is what generates the audit trail this playbook depends on.

**Related:** [What Is a Hallucination?](/learn/hallucinations/what-is-a-hallucination), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), [Taxonomy Decision Tree](/learn/hallucinations/taxonomy-decision-tree), [Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod), [Tracking Hallucination Rate in CI](/learn/hallucinations/tracking-hallucination-in-ci)
