---
title: "Worked Example: Building a Golden Hallucination Eval Set"
track: "hallucinations"
status: live
summary: "Build a 100-item domain eval set with known answers, adversarial edge cases, and disguised unanswerable questions that actually test abstention."
duration: "8 min read"
---

Every harness in this module needs something to run against. A public benchmark won't do — it's not your domain, your documents, or your users' phrasing. This lesson builds the dataset those harnesses actually run against: a golden set for a fictional internal assistant, tagged well enough to compute several of the rates from [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) without rebuilding it later.

## The setup

**Northbridge**, a fictional mid-size company, has an internal HR-policy assistant answering employee questions from a corpus of policy documents. The goal: a 100-item golden eval set covering three question types plus a cross-cutting risk tag, sized for a CI regression gate.

| Category | Count | What it tests |
|---|---|---|
| Known, with source | 45 | Straightforward factual recall against a specific policy passage |
| Adversarial long-tail | 25 | Specific edge cases a model might confidently guess wrong on |
| Unanswerable | 20 | Correct behavior is abstention, not a guess |
| *(tag)* High-stakes | 10 | Cuts across the above — legal/compliance-adjacent topics |

This is the same 100-item, 20-abstained shape used as the running example in [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) — built here from scratch so you can see exactly where those numbers come from.

## Step by step

### 1. Define the labeling schema

```json
{
  "id": "n014",
  "category": "known",
  "high_stakes": false,
  "question": "How many days of paid parental leave does a full-time employee get?",
  "gold_answer": "16 weeks, paid at full salary, for either parent.",
  "source_passage": "parental-leave-policy.md#section-2",
  "correct_behavior": "answer",
  "notes": ""
}
```

> **Why this step?** Every item needs the same shape whether it's answerable or not — `correct_behavior` is what makes an unanswerable item scoreable at all (see step 4). `notes` exists for adjudication history, so a rubric decision made once (per [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols)) doesn't get silently re-litigated by the next person who edits the set.

### 2. Write the "known" items from real source passages

Pull 45 questions directly from the policy corpus — one gold answer, one exact source citation, each. These are the floor: if a system can't nail these, nothing else in the set matters yet. Keep the phrasing natural, not lifted verbatim from the document — a question that echoes the source's exact wording makes retrieval look artificially easy and never gets asked that way by a real employee.

### 3. Write the adversarial long-tail items

These target the [risk factors](/learn/hallucinations/hallucination-risk-factors) that make confident fabrication most likely: multi-condition edge cases, numbers that sound like they should follow a clean rule but don't, and combinations the source documents address awkwardly or indirectly.

```json
{
  "id": "n067",
  "category": "adversarial",
  "high_stakes": true,
  "question": "If I'm on an approved sabbatical when my role is eliminated in a reorg, does my severance calculation use my sabbatical start date or my original hire date?",
  "gold_answer": "Original hire date — sabbatical time counts as continuous service for severance purposes.",
  "source_passage": "severance-policy.md#section-4, sabbatical-policy.md#section-1",
  "correct_behavior": "answer",
  "notes": "requires combining two documents; easy to guess wrong by assuming sabbatical resets tenure"
}
```

> **Why this step?** A model asked this without grounding will often produce a clean-sounding, confident, *wrong* answer — assuming sabbatical time doesn't count, because that's the more common policy pattern in general. That's exactly the shape of question a golden set needs and a public benchmark never has: specific to your actual policy's actual quirks.

### 4. Write the unanswerable items — and disguise them

```json
{
  "id": "n081",
  "category": "unanswerable",
  "high_stakes": false,
  "question": "What's the maximum number of remote-work days per month for the Singapore office specifically?",
  "gold_answer": null,
  "source_passage": null,
  "correct_behavior": "abstain",
  "notes": "remote-work policy exists but doesn't break out by office location; correct answer is to say so"
}
```

> **Why this step?** The correct behavior here is honest abstention, testing exactly the skill covered in [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know). Note the phrasing: it reads exactly like an answerable question, in the same style as the "known" items — that disguise is the whole point, and it's the part teams skip (see below).

### 5. Freeze and version the set

Commit it as a versioned file alongside the embedding model, chunking config, and system prompt version it was last scored against. Don't hand-edit an item because a system failed it and the failure felt unfair — that's how eval sets quietly rot into vanity metrics. Feed regressions back as a *new* item covering the same failure mode instead.

## Where it breaks (+fix)

The first draft of Northbridge's unanswerable items looked like this:

> *"Does Northbridge offer a company yacht for executive retreats?"*

Every system trivially "passes" abstention on a question this obviously absurd — it's not testing whether the system knows the boundary of its own knowledge, it's testing whether the system can pattern-match "silly question" from phrasing alone. The dataset reports a reassuring 100% correct-abstention rate that tells you nothing about real behavior.

**The fix:** rewrite every unanswerable item to be indistinguishable in style, plausibility, and structure from the answerable ones — like the Singapore remote-work example above, which is a perfectly reasonable thing an employee would ask, just not something the policy corpus happens to address. Only a disguised unanswerable item actually tests whether abstention comes from genuine knowledge-boundary awareness rather than surface-level question shape.

## Takeaways

- Category and stakes tags matter as much as raw item count — they're what let you compute per-category and per-risk-tier rates later without touching the dataset again, exactly the denominator flexibility [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) depends on.
- Unanswerable items are only useful when they're adversarially disguised as answerable ones — an obviously silly question tests nothing.
- Freeze and version the set like code. A score you don't like is a signal about the system, not an invitation to edit the test.
- 100 items is a reasonable starting size for a single-domain assistant's CI gate; grow it as [production monitoring](/learn/hallucinations/monitoring-hallucination-in-prod) surfaces new failure categories the original set didn't anticipate.

**Related:** [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) · [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors) · [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) · [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) · [Worked Example: Hallucination Regression Testing in CI](/learn/hallucinations/tracking-hallucination-in-ci) · [Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod)
