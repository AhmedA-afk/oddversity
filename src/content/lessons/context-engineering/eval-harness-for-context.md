---
title: "An Eval Harness for Context Choices"
track: "context-engineering"
status: live
summary: "A small harness that scores accuracy, tokens, and cost per context config turns 'it feels essential' into a number."
duration: "9 min read"
---

An ablation you run once answers one question. A harness you run every time someone proposes adding or cutting a context segment turns "I think this helps" into a number you can actually check.

## What we're building

A small, reusable harness: given a labeled eval set and a handful of context-builder functions — one per configuration you want to compare — run every item through every config, score it, and report accuracy, tokens, and cost side by side.

## Setup

```python
EVAL_SET = [
    {"id": "q01", "query": "How do I reset a user's password via the API?",
     "expected_doc": "auth/password-reset.md"},
    {"id": "q02", "query": "What's the rate limit on the /orders endpoint?",
     "expected_doc": "api/rate-limits.md"},
    # ... a few dozen more, hand-labeled from real support or dev questions
]
```

Each item has a query and a ground-truth signal cheap enough to check automatically — here, which document should have been retrieved. Build this the way [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) describes: the labeled set is the expensive, reusable part; the harness wrapped around it is cheap.

## Build it

### Step 1 — define the configs to compare

```python
def build_full(item, kb):
    # everything: matched doc + full FAQ block + related tickets
    return kb.doc(item["expected_doc"]) + kb.faq_block() + kb.related_tickets(item["query"])

def build_no_faq(item, kb):
    # drop the FAQ block that "feels" essential
    return kb.doc(item["expected_doc"]) + kb.related_tickets(item["query"])

def build_doc_only(item, kb):
    return kb.doc(item["expected_doc"])

CONFIGS = {"full": build_full, "no_faq": build_no_faq, "doc_only": build_doc_only}
```

> **Why this step?** Naming configs explicitly, one builder function per config, is what makes the comparison reproducible. You're not eyeballing "we removed some stuff" — you're diffing two functions.

### Step 2 — run every item through every config

```python
def run_harness(eval_set, configs, kb, call_model, cost_per_1k=0.003):
    rows = []
    for name, builder in configs.items():
        for item in eval_set:
            ctx = builder(item, kb)
            tokens = approx_tokens(ctx)
            answer = call_model(ctx, item["query"])
            correct = item["expected_doc"] in answer.cited_docs
            rows.append({
                "config": name, "id": item["id"],
                "tokens": tokens, "correct": correct,
                "cost": tokens / 1000 * cost_per_1k,
            })
    return rows
```

`call_model` is your real model call in production. For a reproducible demo or a regression test, swap in a stub that returns fixed, recorded outputs, so the harness's own logic can be tested without burning API calls on every run.

> **Why this step?** Running every item through every config — not spot-checking a few — is what makes the per-config numbers comparable. A partial run biases whichever config happened to get the easier items.

### Step 3 — aggregate and report

```python
from collections import defaultdict

def summarize(rows):
    agg = defaultdict(lambda: {"n": 0, "correct": 0, "tokens": 0, "cost": 0.0})
    for r in rows:
        a = agg[r["config"]]
        a["n"] += 1
        a["correct"] += r["correct"]
        a["tokens"] += r["tokens"]
        a["cost"] += r["cost"]
    for name, a in agg.items():
        print(f"{name:10s}  acc={a['correct']/a['n']:.0%}  "
              f"avg_tokens={a['tokens']//a['n']}  cost=${a['cost']:.3f}")
```

## Run it

Illustrative output on a 40-item set:

```text
full        acc=83%  avg_tokens=6200  cost=$0.744
no_faq      acc=83%  avg_tokens=4100  cost=$0.492
doc_only    acc=71%  avg_tokens=1800  cost=$0.216
```

The FAQ block looked essential going in — it's the segment everyone assumed the `full` config needed. The harness shows `no_faq` matches `full` exactly on accuracy at about two-thirds the tokens and cost. `doc_only` shows the related-tickets block is doing real work — accuracy drops 12 points without it — so that one stays. The harness turned "I think the FAQ block helps" into "it doesn't, cut it," backed by a number instead of a guess.

## Harden it

- Keep the eval set paired across configs — same items, same order — so per-item diffs are meaningful, not just the aggregate. See the paired-measurement reasoning in [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps).
- Fix the model's sampling (temperature 0, or a recorded fixture) when testing the harness itself, so a flaky model call doesn't get mistaken for a config difference.
- Re-run periodically, not once. A config that was neutral against last quarter's model can become actively harmful after a model upgrade changes the baseline — the same kind of staleness [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios) covers for facts applies just as well to an eval result itself going stale.

## Extend it

- Wire it into CI as a gate on any change that touches prompt assembly or retrieval config — a context change gets the same scrutiny as a code change.
- Add slicing (by query type, length, or topic) instead of one aggregate row per config, since an average can hide a segment that helps one slice and hurts another.
- Feed the winning config's token counts into your [budgeting strategy](/learn/context-engineering/token-budgeting-strategies), so the harness's output directly sets the per-segment budget instead of a guessed number.

**Related:** [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality), [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps), [A/B Testing Context Variants](/learn/context-engineering/ab-testing-context-variants), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios)
