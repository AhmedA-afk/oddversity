---
title: "Building a Prompt Eval Dataset"
track: "prompt-engineering"
status: live
summary: "A concrete recipe for turning your prompt's test cases into a JSONL dataset and a runner that reports pass rate by case type."
duration: "7 min read"
---

You've accepted that a demo isn't an eval - see [Why You Evaluate Before You Ship](/learn/prompt-engineering/why-eval-before-ship) if you haven't. This lesson is the next step: turning that intention into a file you can actually run.

## What we're building

A `cases.jsonl` file holding labeled, real, edge-case-inclusive inputs, and a small `run_eval.py` script that loads it, runs a prompt over every case, and prints a pass rate broken out by case type - with the failing cases printed so you can go read them, not just count them.

## Setup

You need three things: a prompt you want to test, a way to call your model (a function you'll plug your real API client into), and the dataset file itself. We'll keep using the due-date extractor from [Why You Evaluate Before You Ship](/learn/prompt-engineering/why-eval-before-ship) so the two lessons connect.

```
eval/
  cases.jsonl
  run_eval.py
```

## Build it

### Step 1: Collect real inputs, not invented ones

Pull from wherever real inputs already exist - support tickets, logs, a sample of production traffic, bug reports filed against the last version of this prompt. Do not sit down and write twenty inputs from memory; that reproduces exactly the selection bias this dataset exists to catch. If you genuinely have no production traffic yet, use inputs from the domain (real invoices, real tickets from a public dataset) rather than inputs shaped by what you expect the prompt to handle.

> **Why this step?** A dataset assembled from your own head is a mirror of your assumptions, not a sample of your users' behavior.

### Step 2: Label each case with an expected output and a tag

For every input, write down the correct output and tag the case by what it's testing: `ordinary` for the common path, `edge` for something unusual but valid, `failure` for an input a previous version actually got wrong. The tags matter more than they look like they do - they let you see *which kind* of input a prompt struggles with, not just an aggregate score.

```json
{"id": "case-001", "tag": "ordinary", "input": "Thanks for your business! Payment is due by March 15, 2026.", "expected": "2026-03-15"}
{"id": "case-002", "tag": "edge", "input": "Net 30 from receipt.", "expected": "null"}
{"id": "case-003", "tag": "edge", "input": "Invoice date: 2026-02-10. Please remit within 30 days of the invoice date.", "expected": "2026-03-12"}
{"id": "case-004", "tag": "failure", "input": "Payment due 03/05/2026 (DD/MM format).", "expected": "2026-05-03"}
{"id": "case-005", "tag": "ordinary", "input": "No due date mentioned, please pay at your convenience.", "expected": "null"}
```

Case 3 is worth checking by hand: an invoice dated 2026-02-10 plus 30 days lands on 2026-03-12 (18 days remain in February, then 12 more into March) - if your dataset's expected values are wrong, everything downstream is measuring against a bad answer key.

> **Why this step?** A test set without an explicit expected output isn't a test set, it's a pile of inputs. The expected value is what makes a run scoreable instead of just readable.

### Step 3: Store it as JSONL

One JSON object per line, not a single JSON array. JSONL appends cleanly (one new line per new case, no risk of a merge conflict rewriting the whole file), diffs cleanly in git (a new case is a one-line diff), and streams without loading the whole file into memory as your set grows past a few hundred cases.

### Step 4: Write the runner

```python
import json

def call_model(prompt: str, email_text: str) -> str:
    """Stand-in for your actual model call - replace with your API client."""
    raise NotImplementedError

PROMPT = """Extract the payment due date from this email.
Return it as YYYY-MM-DD, or the literal string "null" if no due date is stated.

Email:
{email_text}"""

def load_cases(path):
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]

def run_eval(cases_path, call_model_fn):
    cases = load_cases(cases_path)
    results = []
    for case in cases:
        prompt = PROMPT.format(email_text=case["input"])
        actual = call_model_fn(prompt, case["input"]).strip()
        results.append({**case, "actual": actual, "passed": actual == case["expected"]})
    return results
```

> **Why this step?** The runner is deliberately dumb - it does exact string comparison. That's the right choice for a field with one correct answer (a date, a category, a boolean). It is the *wrong* tool for open-ended text like a summary, where two different strings can both be correct - that's what [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge) is for.

### Step 5: Report pass rate by tag, not just overall

```python
def report(results):
    by_tag = {}
    for r in results:
        by_tag.setdefault(r["tag"], []).append(r["passed"])
    total_pass = sum(r["passed"] for r in results)
    print(f"Overall: {total_pass}/{len(results)} ({total_pass/len(results):.0%})")
    for tag, passes in sorted(by_tag.items()):
        print(f"  {tag}: {sum(passes)}/{len(passes)} ({sum(passes)/len(passes):.0%})")
    print("\nFailures:")
    for r in results:
        if not r["passed"]:
            print(f"  [{r['id']}] expected {r['expected']!r}, got {r['actual']!r}")

if __name__ == "__main__":
    results = run_eval("cases.jsonl", call_model)
    report(results)
```

> **Why this step?** An overall pass rate can look fine while one whole category is quietly broken. Breaking the report out by tag turns "83% pass" into "100% on ordinary, 50% on edge cases" - a much more actionable number.

## Run it

```
$ python run_eval.py
Overall: 3/5 (60%)
  edge: 1/2 (50%)
  failure: 0/1 (0%)
  ordinary: 2/2 (100%)

Failures:
  [case-002] expected 'null', got '2026-01-01'
  [case-004] expected '2026-05-03', got '2026-03-05'
```

Both failures are informative: case-002 shows the model inventing a date instead of admitting it can't compute one from "net 30 from receipt" with no receipt date given; case-004 shows it defaulting to month-first parsing on an ambiguous numeric date. Neither of those would have shown up if you'd only run the single demo input.

## Harden it

- **Feed failures back in.** Every time production surfaces a wrong answer, add it as a new `failure`-tagged case with the correct expected value. The dataset should only grow, and it should grow toward the shape of your real failures.
- **Record provenance.** Add a `source` field (a ticket ID, "sampled from prod on 2026-08-01") so a case's origin is traceable later, not just its content.
- **Version the file.** Commit `cases.jsonl` to git alongside the prompt it tests, the same way you'd version the prompt itself - see [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code).
- **Split exact-match from open-ended cases early.** If your prompt also produces free text anywhere, don't try to force it through string equality - route it to a rubric-based scorer instead.

## Extend it

Once this runner exists, three things become possible that weren't before: gating every prompt change on it before merge (see [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts)), scoring the open-ended parts of your prompts with a judge instead of string equality (see [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge)), and rerunning the exact same file the moment you swap models to catch drift before your users do (see [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy)).

**Related:** [Why You Evaluate Before You Ship](/learn/prompt-engineering/why-eval-before-ship), [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge), [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code)
