---
title: "Building an Eval Harness"
track: "structured-outputs"
status: live
summary: "A runnable harness that scores extractor output against gold on all four metrics and tells you which field is weakest."
duration: "8 min read"
---

[Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics) defined valid-rate, schema-conformance, field accuracy, and exact-match. This lesson wires all four into one harness you actually run, against a gold set, producing a report that names the field dragging your average down instead of just a headline number.

## What we're building

A function that takes your extractor (anything from [A Provider Adapter](/learn/structured-outputs/provider-adapter-implementation) works), a gold dataset of `(input, expected_output)` pairs, and returns a structured report: the four rollup metrics plus a per-field breakdown, sorted worst-first.

## Setup

Reuse the `TicketExtraction` schema and a small gold set — five labeled tickets is enough to demonstrate the mechanics; [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) covers what a real one needs to look like.

```python
gold_set = [
    {"document": "Can't export CSV, demo in 2 hours, please help ASAP",
     "expected": {"category": "bug", "priority": "high", "escalation_note": None}},
    {"document": "Would love a dark mode option someday, not urgent",
     "expected": {"category": "feature_request", "priority": "low", "escalation_note": None}},
    # ... three more, held out, never shown to the extractor's prompt
]
```

## Build it

### Step 1 — score one record on all four axes

```python
from pydantic import ValidationError
import json

def score_record(raw_text: str, expected: dict, schema) -> dict:
    result = {"valid_json": False, "schema_conforms": False,
              "field_correct": {}, "exact_match": False}

    try:
        parsed = json.loads(raw_text)
        result["valid_json"] = True
    except json.JSONDecodeError:
        return result  # nothing downstream can be scored

    try:
        validated = schema.model_validate(parsed)
        result["schema_conforms"] = True
    except ValidationError:
        return result

    got = validated.model_dump()
    for field, expected_value in expected.items():
        result["field_correct"][field] = (got.get(field) == expected_value)
    result["exact_match"] = all(result["field_correct"].values())
    return result
```

> **Why this step?** Each `return result` early-exit mirrors the nested-rings model from [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics) directly in code: you can't score field accuracy on something that didn't even parse, so the function refuses to try rather than crash or fake a score.

### Step 2 — run the whole gold set

```python
def run_eval(extract_fn, gold_set: list[dict], schema) -> list[dict]:
    results = []
    for item in gold_set:
        raw_text = extract_fn(item["document"])
        scored = score_record(raw_text, item["expected"], schema)
        scored["document"] = item["document"]
        results.append(scored)
    return results
```

> **Why this step?** `extract_fn` is deliberately just a callable — plug in an adapter from [A Provider Adapter](/learn/structured-outputs/provider-adapter-implementation), a repair-wrapped version from [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), or a completely different pipeline. The harness doesn't care how the JSON was produced, only whether it's correct.

### Step 3 — roll up into a report

```python
def summarize(results: list[dict]) -> dict:
    n = len(results)
    valid = sum(r["valid_json"] for r in results)
    conforms = sum(r["schema_conforms"] for r in results)
    exact = sum(r["exact_match"] for r in results)

    field_totals: dict[str, list[bool]] = {}
    for r in results:
        for field, correct in r["field_correct"].items():
            field_totals.setdefault(field, []).append(correct)

    field_accuracy = {f: sum(v) / len(v) for f, v in field_totals.items()}
    weakest = min(field_accuracy, key=field_accuracy.get) if field_accuracy else None

    return {
        "n": n,
        "valid_rate": valid / n,
        "schema_conformance_rate": conforms / n,
        "field_accuracy": field_accuracy,
        "exact_match_rate": exact / n,
        "weakest_field": weakest,
    }
```

> **Why this step?** `weakest_field` is the one line that turns this from a scorecard into a to-do list — it's the field [A Field-Level Scorecard](/learn/structured-outputs/field-level-scorecard-example) picks up and actually fixes.

## Run it

```python
def extract_fn(document: str) -> str:
    adapter = OpenAIAdapter(model=OPENAI_MODEL)
    raw = adapter.request(TicketExtraction, document)
    return raw.choices[0].message.content  # score_record parses it itself

results = run_eval(extract_fn, gold_set, TicketExtraction)
report = summarize(results)
print(report)
```

Illustrative output on a 5-item set:

```text
{'n': 5, 'valid_rate': 1.0, 'schema_conformance_rate': 1.0,
 'field_accuracy': {'category': 1.0, 'priority': 0.8, 'escalation_note': 1.0},
 'exact_match_rate': 0.8, 'weakest_field': 'priority'}
```

Both structural metrics are perfect, but `priority` is wrong on one of five records — invisible to anyone reading valid-rate alone, and now the first thing to investigate rather than something you'd stumble on by accident.

## Harden it

- **Run each record more than once and report variance, not a single pass.** Sampling temperature means the same input can score differently on two runs; a harness that reports one number per item without noting run-to-run spread will look noisier or steadier than it really is when you compare two model versions. This matters directly for [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts), where a single flaky run can look like a regression.
- **Keep the harness's own parsing forgiving of nothing.** Don't let `score_record` silently strip whitespace or fix trailing commas before scoring valid-rate — that's exactly the metric meant to catch that failure, and repairing it inside the scorer hides the number you're trying to measure. Repair belongs in the pipeline under test, from [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), not in the eval that grades it.
- **Log the full input/output/expected triple for every failing record**, not just the aggregate score — this is what [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) recommends generally, and it's the difference between "priority is at 80%" and knowing *which* ticket got miscategorized and why.

## Extend it

- Add per-field tolerance rules — an exact-match check for `priority`, a $0.01 band for a `total` field, fuzzy match for free-text fields — instead of the flat `==` used here, matching the field-specific guidance in [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics).
- Extend `run_eval` to accept multiple `extract_fn`s and report a side-by-side comparison table — the natural next step once you have more than one [provider adapter](/learn/structured-outputs/provider-adapter-implementation) to evaluate.
- Wire the summary into a CI failure condition, covered fully in [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts).

**Related:** [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Parsing and Validating API Responses](/learn/python-data-apis/parsing-and-validating-api-responses), [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset), [A Field-Level Scorecard](/learn/structured-outputs/field-level-scorecard-example)
