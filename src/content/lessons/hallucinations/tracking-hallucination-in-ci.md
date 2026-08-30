---
title: "Worked Example: Hallucination Regression Testing in CI"
track: "hallucinations"
status: live
summary: "Wire a golden set and a judge harness into a CI gate that catches a prompt change quietly trading fabrication for coverage before it ships."
duration: "8 min read"
---

A golden set and a judge harness only stop hallucination rot if something actually blocks a bad merge. This lesson wires the two together into a CI check that fails a build when hallucination rate regresses past a threshold — and catches exactly the kind of change a human reviewer skimming a diff would miss.

## The setup

Northbridge's HR assistant has its 100-item golden set (from [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set)) and a judge harness (from [An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl)) already built. The goal: run both automatically on every pull request that touches the system prompt or retrieval config, and fail the build if hallucination rate moves past an agreed threshold.

## Step by step

### 1. Freeze the suite and record a baseline

Run the current production prompt through the harness once, record `hallucination_rate` and `abstention_rate` with their exact denominators stated, and check the result in as a versioned file:

```json
{
  "prompt_version": "v4-2026-07-01",
  "hallucination_rate": 0.07,
  "abstention_rate": 0.20,
  "denominator": "per-claim, over all claims made across the 100-item suite"
}
```

> **Why this step?** "Regression" is undefined without a fixed number to regress *from*. Versioning the baseline alongside the exact prompt that produced it means a future reviewer can always answer "regressed relative to what, exactly" — the same discipline [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) insists on for not quietly redefining the goalposts.

### 2. Write the CI check

```python
import json
import sys

THRESHOLD = 0.03  # allow at most a 3-point absolute rise in hallucination rate

def load_baseline(path="eval_baseline.json"):
    with open(path) as f:
        return json.load(f)

def run_eval(candidate_prompt, golden_set, generate_fn, judge_harness):
    results = judge_harness(golden_set, generate_fn, candidate_prompt)
    return {
        "hallucination_rate": results["hallucination_rate"],
        "abstention_rate": results["abstention_rate"],
    }

def main():
    baseline = load_baseline()
    current = run_eval(CANDIDATE_PROMPT, GOLDEN_SET, generate, judge_harness)

    delta = current["hallucination_rate"] - baseline["hallucination_rate"]
    print(f"baseline hallucination_rate:  {baseline['hallucination_rate']:.3f}")
    print(f"candidate hallucination_rate: {current['hallucination_rate']:.3f}")
    print(f"delta: {delta:+.3f} (threshold: {THRESHOLD})")
    print(f"baseline abstention_rate:  {baseline['abstention_rate']:.3f}")
    print(f"candidate abstention_rate: {current['abstention_rate']:.3f}")

    if delta > THRESHOLD:
        print("FAIL: hallucination rate regressed past threshold")
        sys.exit(1)

    print("PASS")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

> **Why this step?** Printing both rates — not just the gating one — means a reviewer sees the tradeoff, not just a pass/fail. A PR that drops hallucination_rate by trading away half the abstention rate is visible right in the CI log, not buried in a single green checkmark.

### 3. Wire it into the pipeline

```yaml
# .github/workflows/hallucination-eval.yml
name: Hallucination Regression Check
on:
  pull_request:
    paths:
      - "prompts/**"
      - "retrieval/**"
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: python run_ci_eval.py
```

Mark this job as a required check so a PR touching the system prompt or retrieval config can't merge while it's failing.

### 4. Catch a real regression

Someone opens a PR removing the line "say you don't know if you're not sure" from the system prompt, aiming to reduce complaints about the assistant refusing too often. CI runs the suite:

```
baseline hallucination_rate:  0.070
candidate hallucination_rate: 0.130
delta: +0.060 (threshold: 0.03)
baseline abstention_rate:  0.200
candidate abstention_rate: 0.060
FAIL: hallucination rate regressed past threshold
```

> **Why this step?** This is the exact abstention-for-coverage trade named in [What to Measure](/learn/hallucinations/what-to-measure-metrics) and the exact single-number gaming pattern named in [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) — abstention rate dropped from 20% to 6% (looks like more helpfulness), but hallucination rate more than doubled. CI catches it mechanically, before a human skimming the diff has to notice the tradeoff by eye and probably wouldn't.

## Where it breaks (+fix)

**Cost and latency.** The judge harness makes a model call per claim, and running the full 100-item suite on every commit is slow and expensive at PR volume. **Fix:** run a fast, stratified 20-item smoke subset on every PR, and the full suite nightly or pre-release — the same tiered-testing shape as unit versus integration tests, applied to hallucination eval.

**Flaky failures from judge non-determinism.** A judge run above temperature 0 can flip a borderline item's verdict between runs, failing a perfectly fine PR. **Fix:** pin judge temperature to 0, and re-run any failing item once before failing the build, logging both runs so a genuinely flaky item gets flagged for rubric review rather than silently retried forever.

## Takeaways

- A golden set and a judge harness are necessary but not sufficient — they only stop rot once something actually blocks a bad merge on their output.
- Gate on the pair, `hallucination_rate` and `abstention_rate`, in the same check, never on `hallucination_rate` alone — a threshold-tuning shortcut like the one in this example slips straight through a single-metric gate.
- Tier the suite: a cheap smoke subset per PR, the full suite nightly or pre-release, so the gate stays fast enough that people don't route around it.
- A frozen, versioned baseline is what turns "regression" from a feeling into a checkable, disputable claim.

**Related:** [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set) · [Implementation: An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl) · [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) · [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics) · [Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod)
