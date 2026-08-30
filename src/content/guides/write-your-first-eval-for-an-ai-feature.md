---
title: "Write your first eval for an AI feature"
description: "Twenty examples, a grader you trust, and a number that moves when quality moves — the smallest eval that actually stops you shipping regressions."
question: "How do I test an AI feature when the output is different every time?"
level: "intermediate"
duration: "25 min"
published: "2026-08-30"
tags: ["Evals", "Testing", "Python"]
featured: true
steps:
  - "Write down what 'correct' means for this feature, concretely"
  - "Collect twenty real examples, including the ones that already failed"
  - "Pick the cheapest grader that can tell right from wrong"
  - "Run it, record the baseline, and put it in CI"
  - "Grade the grader before you trust the number"
related:
  - "/learn/evals-red-teaming/why-evals-matter"
  - "/learn/evals-red-teaming/building-a-golden-dataset"
  - "/learn/evals-red-teaming/llm-judge-bias-and-calibration"
---

You changed the prompt and the output looks better. Better than what, measured how, on
which inputs? Without an answer you are not iterating, you are wandering — and the specific
cost is that you cannot tell an improvement from a change that fixed your three test cases
and broke twenty you never look at.

An eval is a small, boring dataset and a grader. It does not need to be sophisticated. It
needs to exist.

## Step 1 — Define correct, in writing

Before any code, finish this sentence for your feature: *"This output is wrong if…"*

For a support-answer feature that might be: it contradicts the source docs; it answers when
the docs do not cover the question; it omits a required disclaimer; it exceeds 150 words.

Four checkable properties. Notice none of them is "is it good". "Good" is not gradeable;
"contradicts the source" is. If you cannot write the failure conditions down, you do not
yet know what you are building, and no eval framework will supply that for you.

## Step 2 — Twenty examples, chosen deliberately

Twenty is enough to catch a real regression and small enough to write this afternoon. Do
not sample randomly. Take:

- **Five easy cases.** If these break, something is badly wrong.
- **Ten realistic cases** pulled from actual usage, in the actual messy phrasing users
  produce — not the clean version you would write.
- **Five known failures.** Every complaint, bug report and "huh, that's wrong" moment. These
  are the most valuable rows in the file, because they are the regressions you have already
  paid for once.

```jsonl
{"id": "refund-window", "input": "how long do i have to return something", "expect_contains": ["30 days"], "expect_absent": ["60 days"]}
{"id": "not-covered", "input": "do you ship to antarctica", "expect_refusal": true}
{"id": "multi-part", "input": "can i return a gift and get store credit instead", "expect_contains": ["gift receipt", "store credit"]}
```

Keep it as JSONL in the repo, next to the code. It is a test fixture; treat it like one and
review changes to it in pull requests.

## Step 3 — The cheapest grader that works

Three kinds, in order of preference. Use the earliest one that can decide your case.

**Deterministic checks.** Substring, regex, JSON-schema validity, a refusal-phrase match, a
length bound. Free, instant, zero ambiguity. Most people underestimate how far these go —
"did it cite a source at all", "did it stay under the word limit", "did it emit valid
JSON" are a large fraction of real failures.

```python
def grade_deterministic(row: dict, output: str) -> tuple[bool, str]:
    lowered = output.lower()
    for needle in row.get("expect_contains", []):
        if needle.lower() not in lowered:
            return False, f"missing required content: {needle!r}"
    for needle in row.get("expect_absent", []):
        if needle.lower() in lowered:
            return False, f"contained forbidden content: {needle!r}"
    if row.get("expect_refusal") and "do not" not in lowered and "cannot" not in lowered:
        return False, "expected a refusal, got an answer"
    return True, "ok"
```

**A model as judge**, for the properties a string match cannot reach — "is this grounded in
the provided sources", "is the tone appropriate". Give the judge a rubric and force a
structured verdict:

```python
JUDGE = """You are grading one answer against its source documents.

Answer PASS only if every factual claim in the answer is supported by the sources.
Answer FAIL if any claim is unsupported, contradicted, or if the answer should have
declined but did not.

SOURCES:
{sources}

ANSWER:
{answer}

Reply with JSON: {{"verdict": "PASS" | "FAIL", "reason": "<one sentence>"}}"""
```

**A human**, for a sampled subset. Not for every run — for enough runs to know whether the
first two graders are lying to you.

## Step 4 — Run it, baseline it, gate on it

```python
import json

def run_eval(rows_path: str, generate) -> dict:
    rows = [json.loads(line) for line in open(rows_path)]
    failures = []
    for row in rows:
        output = generate(row["input"])
        ok, why = grade_deterministic(row, output)
        if not ok:
            failures.append({"id": row["id"], "why": why, "output": output[:300]})
    return {"total": len(rows), "passed": len(rows) - len(failures), "failures": failures}

if __name__ == "__main__":
    result = run_eval("evals/support.jsonl", answer_question)
    print(f"{result['passed']}/{result['total']} passed")
    for f in result["failures"]:
        print(f"  FAIL {f['id']}: {f['why']}")
    raise SystemExit(1 if result["failures"] else 0)
```

Record today's number. That is your baseline, and it is almost certainly not 20/20 — which
is fine and useful. In CI, fail the build when the score drops below the baseline rather
than when it is below perfect. You are gating on regression, not on an aspiration.

Because generation is stochastic, a single failing row is not always a regression. Set
temperature to 0 for eval runs where the provider supports it, and for anything you cannot
make deterministic, run the set three times and compare medians.

## Step 5 — Grade the grader

This is the step that gets skipped, and skipping it is how teams end up confidently
optimising a number that does not track quality.

Take twenty outputs. Grade them yourself. Compare with the automated grade. If the judge
disagrees with you more than about one time in ten, the judge is the problem — usually
because the rubric is vague, or because it is being asked to score 1–5 when it can only
reliably do PASS/FAIL.

Known judge failure modes worth checking for: it prefers longer answers; it prefers answers
written in its own style; it is more lenient on the first item in a list than the last; and
it will happily rate a fluent, wrong answer above a terse, correct one.

## What this buys you

A number that moves when quality moves. From that point on, "the new prompt is better" is a
claim with evidence behind it — and the twenty rows will keep paying for themselves every
time a model version changes underneath you.
