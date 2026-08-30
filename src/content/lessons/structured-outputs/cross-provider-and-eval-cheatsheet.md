---
title: "Portability and Eval Cheatsheet"
track: "structured-outputs"
status: live
summary: "Per-provider quirks to remember and which of the four quality metrics to optimize for, on one page."
duration: "5 min read"
---

The reference version of this module: what to remember about each provider before you build an adapter, and which metric actually answers the question you're asking.

## Per-provider quirks — start here, then verify

| Provider family | Mechanism | Optional-field convention | Watch for |
|---|---|---|---|
| Anthropic | Tool-schema mediated | Absent key = not returned | Response is a parsed dict inside a tool-call block, not a JSON string |
| OpenAI (strict mode) | Schema-constrained `response_format` | No true "optional" — every field `required`, `null` stands in | `additionalProperties: false` and full `required` list are mandatory to enable strict mode |
| Google (Gemini) | Restricted-OpenAPI `response_schema` | Varies by field type | Narrower keyword support than full JSON Schema; verify union (`anyOf`) support before relying on it |
| OSS engines (llama.cpp, vLLM, Outlines) | Grammar-constrained decoding | Whatever the grammar encodes | Strongest guarantee *if* you built the grammar correctly — a prompted-JSON fallback with no real grammar gives none of that guarantee |

Full framework and a real side-by-side response comparison: [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape).

## Never assume across a provider swap

- A schema constraint (`pattern`, `minimum`, `maxItems`) is enforced — some providers accept and ignore constraints beyond basic type.
- Key ordering, whitespace, or null-vs-absent is preserved identically — normalize before comparing or diffing.
- A refusal looks the same — it can be a JSON-shaped error, a `null` structured field alongside prose, or an API-level error, depending on provider.
- A union or discriminated-union schema transfers unchanged — verify `anyOf`/`oneOf` support per provider before shipping one.

## Portable vs. provider-specific — the one rule

Keep in one place, provider-agnostic: the schema definition (Pydantic/Zod), field semantics and descriptions, validation logic.

Keep in an adapter, one per provider: the request shape, response parsing, retry/backoff behavior, cost and latency tracking.

Full pattern and a runnable adapter: [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code).

## The four quality metrics — which one to optimize

| Metric | Answers | Cheap to compute? | Optimize this when... |
|---|---|---|---|
| Valid-rate | Did it parse at all | Yes — no gold data needed | You're still on JSON mode or an early prototype and can't yet trust the output shape |
| Schema-conformance rate | Does it match types/required/enums | Yes — no gold data needed | Valid-rate is already high but you keep seeing type or missing-field errors downstream |
| Field-level accuracy | Is each field's *value* right | No — needs gold labels | You need to know which specific field to fix, or you're comparing models/prompts |
| Full-object exact-match | Can this record skip human review entirely | No — needs gold labels | You're deciding whether to remove or reduce a human-review step |

Full derivation and a worked example: [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics).

**Never report valid-rate as if it were accuracy.** It answers a different, easier question.

## Regression gate — start here, then tune

```python
threshold = before["exact_match_rate"] - 2 * standard_error
fail_if = after["exact_match_rate"] < threshold or after["valid_rate"] < 0.98
```

- Size the gold set so a real 5-10 point swing clears sampling noise — a 10-20 item set will flag noise as often as it flags real regressions.
- Run more than once per gold item if temperature is nonzero; average before comparing.
- Keep a hard valid-rate floor independent of the before/after comparison — it catches slow multi-release drift a comparative check alone will miss.

Full derivation: [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts).

## Production signals to log, every run

| Signal | Rising means |
|---|---|
| Invalid-rate | Input distribution shifted, or a model/provider change broke parsing |
| Repair frequency | Model drifting toward the schema's edge — leading indicator of future invalid-rate |
| Field-value drift | The world (or the model's interpretation of it) changed, even with no single wrong value |
| Reject/review rate | Confidence threshold miscalibrated, or genuine quality drop upstream of routing |

Full signal-by-signal breakdown: [Monitoring in Production](/learn/structured-outputs/monitoring-structured-output-in-production).

## Pre-flight checklist

- Every provider-specific assumption lives in an adapter, not in shared code.
- All four metrics are reported together — never valid-rate alone.
- Gold-set documents never appear in a prompt or a few-shot example.
- The regression gate accounts for sampling noise, not a bare "any decrease fails."
- Cost and latency are tracked alongside every accuracy number.
- Production monitoring and the gold set feed each other — drift discovered live becomes a new gold-set edge case.

The mistakes behind most of these rules, spelled out one at a time: [Evaluation and Portability Mistakes](/learn/structured-outputs/eval-and-provider-mistakes).

**Related:** [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape), [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code), [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts), [Monitoring in Production](/learn/structured-outputs/monitoring-structured-output-in-production), [Evaluation and Portability Mistakes](/learn/structured-outputs/eval-and-provider-mistakes)
