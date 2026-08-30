---
title: "Worked Example: A Three-Shot Intent Classifier"
track: "prompt-engineering"
status: live
summary: "Build a three-shot ticket classifier, find its one real misclassification, then fix it by swapping an example instead of adding a rule."
duration: "7 min read"
---

Three examples, five held-out messages, one wrong answer — and the fix that actually works turns out to be a single swapped example, not an added instruction.

## The setup

You're building an intent classifier for customer messages, routing each into `billing`, `bug`, or `feature_request`. Following the standard [few-shot pattern](/learn/prompt-engineering/few-shot-prompting), you pick one clean, obvious example per class:

```text
Ticket: "I was charged twice this month."
Label: billing

Ticket: "The export button does nothing when I click it."
Label: bug

Ticket: "Could you add dark mode?"
Label: feature_request

Ticket: "{new message}"
Label:
```

You hold out five real messages to check it against before shipping:

| # | Message | True label |
|---|---|---|
| 1 | "My invoice shows the wrong plan tier." | billing |
| 2 | "Every time I upload a CSV over 10MB the page just freezes." | bug |
| 3 | "It would be great if I could export to Notion." | feature_request |
| 4 | "I paid for the annual plan but I'm still being shown ads." | billing |
| 5 | "Can you let me schedule posts instead of manual posting only?" | feature_request |

## Step by step

### Step 1 — Run the three-shot prompt against all five

Each example anchors its class through a distinctive keyword: "charged" → billing, "button...doesn't work" → bug, "add" → feature_request. Running the prompt against the five held-out messages:

| # | Message | True | Predicted |
|---|---|---|---|
| 1 | "My invoice shows the wrong plan tier." | billing | billing |
| 2 | "...page just freezes." | bug | bug |
| 3 | "...export to Notion." | feature_request | feature_request |
| 4 | "I paid for the annual plan but I'm still being shown ads." | billing | **bug** |
| 5 | "...schedule posts instead of manual..." | feature_request | feature_request |

Four out of five land correctly. Message 4 doesn't.

> **Why this step?** Running against held-out messages before shipping is the only way this kind of failure surfaces — reading the three examples in isolation, they look perfectly reasonable, and nothing about them announces which real input they'll fail on.

### Step 2 — Diagnose by asking which example it pattern-matched to

Message 4 describes an ongoing malfunction ("still being shown ads") using symptom language that reads a lot like the bug example's "does nothing when I click it" — both are "I did a thing, and something isn't working as it should" in shape. None of the three examples ever showed a billing case described in symptom language rather than transaction language ("charged," "invoice," "refund"). The model didn't fail at reasoning — it correctly found the closest pattern among the three shapes it was given, and the closest shape happened to be the wrong class.

> **Why this step?** Diagnosing a few-shot miss by asking "which example does this input most resemble on the surface" is the fast, reliable way in — it's usually far more informative than re-reading your instructions for a gap, because the failure is almost never really about the instructions.

### Step 3 — The tempting fix: add a rule

The obvious instinct is to append something like: *"Note: billing issues can include entitlement or access problems even without payment or transaction language."* This is exactly the kind of prose [a good example tends to outperform](/learn/prompt-engineering/why-examples-beat-instructions-sometimes) — it's vague about which specific symptom-language cases count, it competes with the concrete pull of the bug example's own symptom-shaped wording, and it has to be re-litigated in prose every time a new confusable case shows up.

> **Why this step?** It's worth trying this and watching it under-deliver before reaching for the real fix — the instinct to patch a few-shot failure with more instructions is common, and seeing why it's weak here is more convincing than being told.

### Step 4 — The actual fix: swap in a better-chosen example

Replace the billing example with one that anchors the exact confusion message 4 exposed — billing described in symptom language, not transaction language:

```text
Ticket: "I upgraded to remove ads but I'm still seeing them."
Label: billing

Ticket: "The export button does nothing when I click it."
Label: bug

Ticket: "Could you add dark mode?"
Label: feature_request

Ticket: "{new message}"
Label:
```

> **Why this step?** This follows directly from [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection): message 4 revealed exactly where the decision boundary between billing and bug actually sits — not at "mentions payment" but at "root cause is entitlement versus root cause is broken functionality" — so the new example is placed precisely on that boundary instead of restating an already-covered obvious case.

### Step 5 — Re-run all five

| # | Message | True | Predicted |
|---|---|---|---|
| 1 | "My invoice shows the wrong plan tier." | billing | billing |
| 2 | "...page just freezes." | bug | bug |
| 3 | "...export to Notion." | feature_request | feature_request |
| 4 | "I paid for the annual plan but I'm still being shown ads." | billing | **billing** |
| 5 | "...schedule posts instead of manual..." | feature_request | feature_request |

All five now resolve correctly, and every class still has exactly one anchor — nothing about label balance changed, only *which* billing case got shown.

## Where it breaks (+fix)

This fix resolves the one confusable pattern you found — it doesn't immunize the prompt against the next one. A message like "I removed a payment method and now the app won't load my dashboard" straddles the same boundary from a different angle, and a hand-picked three-shot set can't anticipate every variant of a boundary you haven't seen in your eval data yet. Swapping examples by hand also doesn't scale once your traffic is diverse enough that no fixed three shots cover every case that shows up — at that point the fix stops being "pick a better example" and becomes "pick examples per request," which is exactly what [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval) builds.

## Takeaways

- Diagnose a misclassification by checking which example it resembles on the surface, not by re-reading your instructions for a gap.
- A single well-placed example fixed a lexical-confusion failure that a written rule would have handled less reliably — see [Why a Good Example Outperforms a Paragraph of Rules](/learn/prompt-engineering/why-examples-beat-instructions-sometimes) for why that's the expected outcome, not a lucky one.
- Fixing one boundary by hand doesn't guarantee the next one is covered — treat this as the manual version of the general principle in [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection), and reach for retrieval once hand-picking stops scaling.

**Related:** [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [Why a Good Example Outperforms a Paragraph of Rules](/learn/prompt-engineering/why-examples-beat-instructions-sometimes) · [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval)
