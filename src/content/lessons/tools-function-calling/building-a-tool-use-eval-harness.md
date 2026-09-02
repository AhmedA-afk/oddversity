---
title: "Building Your Own Eval Harness"
track: "tools-function-calling"
status: live
summary: "Build a labeled eval set and grader for your actual tools, then use it to catch a regression a description change introduced."
duration: "8 min read"
---

BFCL tells you a model is generally competent at calling tools. It says nothing about whether it calls *your* `book_table` or `refund_order` correctly — for that you need an eval built from your own schemas, and this lesson builds one.

## What we're building

A small labeled eval set of realistic user requests with expected tool and arguments, a grader that scores selection accuracy and argument correctness against your actual tool registry, a run across two models to compare them, and a demonstration of the harness catching a regression that a routine description edit introduced.

## Setup

Assume a working tool registry and dispatcher (see [Building a Tool Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher)). We'll build the eval set as plain JSON so it's easy to grow and diff in version control.

### Step 1: Write the labeled eval set

```json
[
  {
    "id": "eval_001",
    "query": "Book a table for 4 at Lupo tonight at 7",
    "expected_tool": "book_table",
    "expected_args": { "restaurant": "Lupo", "party_size": 4, "time": "19:00" }
  },
  {
    "id": "eval_002",
    "query": "What's the capital of France?",
    "expected_tool": null
  },
  {
    "id": "eval_003",
    "query": "Cancel my reservation and refund the deposit",
    "expected_tool": "cancel_reservation",
    "expected_args": { "refund": true }
  }
]
```

> **Why this step?** `expected_tool: null` cases matter as much as positive ones — a set with only "should call a tool" examples can't catch a model that over-triggers on requests it should answer directly. Pull real queries from production logs where you can; invented ones tend to be easier than what users actually ask.

### Step 2: Write the grader

```python
def grade_selection(actual_tool: str | None, expected_tool: str | None) -> bool:
    return actual_tool == expected_tool

def grade_arguments(actual_args: dict, expected_args: dict) -> float:
    if not expected_args:
        return 1.0
    matched = sum(
        1 for k, v in expected_args.items()
        if k in actual_args and str(actual_args[k]).lower() == str(v).lower()
    )
    return matched / len(expected_args)
```

> **Why this step?** Loose, case-insensitive string comparison on argument values avoids over-penalizing a model for `"19:00"` vs `"7:00 PM"` when both are correct — see [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard) on why exact-match grading distorts scores. Score selection and arguments separately; a model that picks the right tool with a wrong argument is a different bug from one that picks the wrong tool entirely.

### Step 3: Run it end to end

```python
def run_eval(eval_set: list[dict], model_name: str) -> dict:
    results = []
    for item in eval_set:
        response = call_model(item["query"], tools=TOOL_REGISTRY, model=model_name)
        actual_tool = response.tool_calls[0].name if response.tool_calls else None
        actual_args = response.tool_calls[0].input if response.tool_calls else {}

        results.append({
            "id": item["id"],
            "selection_correct": grade_selection(actual_tool, item["expected_tool"]),
            "argument_score": grade_arguments(actual_args, item.get("expected_args", {})),
        })

    return {
        "model": model_name,
        "selection_accuracy": sum(r["selection_correct"] for r in results) / len(results),
        "avg_argument_score": sum(r["argument_score"] for r in results) / len(results),
        "results": results,
    }
```

> **Why this step?** Two aggregate numbers, not one — a drop in `avg_argument_score` while `selection_accuracy` holds steady tells you the model is still choosing correctly but filling arguments worse, which points you straight at the schema instead of the tool descriptions.

### Step 4: Compare two models

```python
for model in ["model-a", "model-b"]:
    result = run_eval(eval_set, model)
    print(f"{model}: selection={result['selection_accuracy']:.0%}, args={result['avg_argument_score']:.0%}")
```

Run this whenever you're deciding whether to switch models — the comparison is only meaningful because it's against *your* tools, not a public leaderboard's.

## Run it

Wire this into CI so it runs on every change to a tool schema or description, not just before a model swap. Treat a drop below a threshold you set (say, no more than a few points below the last known-good run) as a build failure the same way you'd treat a broken unit test.

## Harden it

Here's the regression it actually caught: a teammate rewrote the `cancel_reservation` description to be more concise, and dropped the sentence noting `refund` defaults to `true` unless the user says otherwise. `eval_003`'s argument score fell from `1.0` to `0.0` — the model still picked the right tool, but stopped inferring the refund correctly without the sentence spelling it out. No handler code changed, no schema type changed — a wording edit alone caused it, and only the eval caught it, because nothing about the tool schema itself was invalid enough for [argument validation](/learn/tools-function-calling/validating-tool-arguments) to flag.

## Extend it

- Add multi-turn cases once single-turn coverage is solid — a query that depends on a prior tool result in the same conversation.
- Track scores over time per model version and per schema version, not just as a pass/fail gate — a slow drift is as worth catching as a sharp regression.
- Feed real failures straight back into the eval set the same way you would with [unit-test fixtures from production traces](/learn/tools-function-calling/unit-testing-tool-handlers) — the eval set should grow every time something breaks in a new way.

**Related:** [Benchmarking Tool Use With BFCL](/learn/tools-function-calling/benchmarking-with-bfcl), [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard), [Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers), [Writing Tool Descriptions Models Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow)
