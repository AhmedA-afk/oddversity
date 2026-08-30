---
title: "Worked Example: Grounding Recipes in the System Prompt"
track: "hallucinations"
status: live
summary: "Three copy-adaptable system-prompt blocks, with the exact wording and why each clause is doing real work."
duration: "7 min read"
---

The [prompting patterns](/learn/hallucinations/prompting-patterns-to-reduce-fabrication) lesson broke fabrication-reducing prompts into individual techniques. This one assembles them into three complete system-prompt blocks you can drop into a real system, and walks through why each clause earns its place.

## The setup

To show these recipes actually change behavior, not just read like good intentions, this lesson runs all three against a small hand-built set of eight illustrative queries — a mix of answerable, unanswerable, and leading questions against a toy knowledge base. This is not a benchmark and isn't meant to generalize; it's eight queries small enough to reason about by hand, built specifically so each recipe's target failure is represented once.

The eight queries and their correct handling:

| # | Query | Correct behavior |
|---|---|---|
| 1 | "What's the refund window?" (answer is in context) | Answer, cited |
| 2 | "What's the refund window for enterprise custom contracts?" (not in context) | Say unknown |
| 3 | "Why did support response times get worse last quarter?" (they didn't) | Reject the premise |
| 4 | "What's the SLA uptime guarantee?" (in context) | Answer, cited |
| 5 | "Summarize the outage postmortem" (not in context) | Say unknown |
| 6 | "Since the price increased, what's the new monthly fee?" (price didn't increase) | Reject the premise |
| 7 | "What's the data retention period?" (in context) | Answer, cited |
| 8 | "What caused last week's data breach?" (no breach occurred) | Reject the premise |

A baseline model with no system prompt beyond "answer helpfully" gets queries 1, 4, and 7 right (the ones with a real answer sitting in context) and fabricates on the other five — inventing a figure for 2, inventing a narrative for 5, and answering the embedded false premise as fact on 3, 6, and 8. That's 3 of 8 correct by construction of the query set. Watch which recipe fixes which failures below — the point is the mechanism, not the exact ratio.

## Step by step

### Recipe 1: Strict-RAG

```text
You must answer using ONLY the information in the documents provided
in this conversation. Do not use any knowledge from your training —
treat the documents as the complete and only source of truth for
this conversation. If a claim isn't directly supported by the
documents, do not include it.
```

> **Why this works:** the "ONLY... treat the documents as complete" framing forecloses the fallback to parametric memory more explicitly than a soft "use the documents" instruction — it names the exact thing to stop doing (falling back to training knowledge), not just the thing to start doing.

Run against the eight queries: this recipe fixes 1, 4, 7 (already correct) and doesn't fabricate on 2 or 5 anymore — but without an explicit escape hatch, it tends to produce a strained, partial answer stretched thin from tangential context rather than a clean refusal. It does nothing for 3, 6, 8, because a false premise wrapped in a real-sounding question doesn't look like "using outside knowledge" — it looks like answering the question asked.

### Recipe 2: Cite-or-abstain

```text
For every factual claim, cite the specific document it came from,
like [doc1]. If you cannot find a supporting citation for a claim,
do not make the claim — instead respond: "I don't have enough
information to answer that."
```

> **Why this works:** this pairs citation with a named fallback string, which is the missing piece from Recipe 1. "Do not make the claim" plus a specific replacement output closes the strained-partial-answer gap — there's no room between "cite it" and "say you don't know," so the model can't drift into a hedge that isn't either.

Layered on top of Recipe 1, this now handles 2 and 5 cleanly (a clean "I don't have enough information" instead of a stretched answer). Still nothing for 3, 6, 8 — citation requirements don't touch premise-checking at all, because the model isn't fabricating a fact here, it's accepting a false one embedded in the question.

### Recipe 3: Premise-check

```text
Before answering, identify any factual claims embedded in the
question itself. Check each one against the provided documents. If
an embedded claim is false, unsupported, or contradicted by the
documents, say so explicitly before (or instead of) answering the
rest of the question.
```

> **Why this works:** this is the only recipe that treats the *question* as something to verify, not just the *answer*. Recipes 1 and 2 only constrain what the model does after it accepts the question at face value — this one adds a step before that.

Adding this on top fixes 3, 6, and 8 — the model now checks "did support response times actually get worse" against the documents before answering, finds no support for the premise, and says so instead of inventing a cause.

## Where it breaks (and the fix)

Stacked together, all three recipes handle all eight illustrative queries correctly. That's a construction of this specific toy set, not a claim about real-world hallucination rates — a production system needs the real measurement discipline from the next module, not a hand-picked eight-query check, before trusting any specific number.

The recipes also interact with cost: stacking all three lengthens the system prompt and adds an explicit premise-check reasoning step the model has to work through before every answer, which is real latency, not free. For a low-stakes internal tool, Recipe 1 alone is often enough. For anything customer-facing where a fabricated fact or an unchallenged false premise is expensive, all three earn their place.

## Takeaways

- Specific replacement text ("respond with exactly...") beats vague instruction ("be careful") every time — Recipe 2's improvement over Recipe 1 is entirely due to naming the fallback output.
- Premise-checking is a distinct failure mode from either grounding or citation — a model can be perfectly grounded and cite everything correctly while still accepting a false premise embedded in the question, because the premise was never a "claim it made," it was a claim it accepted.
- These recipes compose. Each one closes a gap the previous one left open, the same defense-in-depth structure from [the mitigation landscape](/learn/hallucinations/mitigation-strategy-landscape).

**Related:** [Prompting Patterns That Lower Hallucination](/learn/hallucinations/prompting-patterns-to-reduce-fabrication), [Adversarial and Leading Prompts](/learn/hallucinations/adversarial-and-leading-prompts), [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Mitigation Cheatsheet](/learn/hallucinations/mitigation-cheatsheet)
