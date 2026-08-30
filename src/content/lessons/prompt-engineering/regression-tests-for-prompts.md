---
title: "Regression Tests: Keeping a Golden Set Green"
track: "prompt-engineering"
status: live
summary: "Why a small, curated golden set has to gate every prompt change, and the exact tradeoffs in making that gate mean something."
duration: "9 min read"
---

*This is the deferred-depth lesson in the module - read [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) first if you haven't. Everything here assumes you already have a `cases.jsonl` and a runner.*

A prompt change that fixes the case you're staring at can break two you aren't. A golden set is how you find out before your users do, instead of after.

## What a golden set actually is

Your full eval set (per [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)) should keep growing - every production failure becomes a new case. A **golden set** is a smaller, curated subset of it: the cases you've decided a prompt must never fail again, because each one already represents a real failure mode or a business-critical path. Not every case earns golden status. The full set measures how good a prompt is; the golden set enforces how bad it's allowed to get.

The distinction matters because the two sets are used differently. The full set is something you *read* - pass rate by tag, failures worth investigating. The golden set is something you *gate on* - a build either passes all of it or it doesn't merge.

## Worked example: a fix that regresses two other cases

Take the due-date extractor from [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset). Its golden set is five cases:

```json
{"id": "case-001", "tag": "golden", "input": "Thanks for your business! Payment is due by March 15, 2026.", "expected": "2026-03-15"}
{"id": "case-003", "tag": "golden", "input": "Invoice date: 2026-02-10. Please remit within 30 days of the invoice date.", "expected": "2026-03-12"}
{"id": "case-004", "tag": "golden", "input": "Payment due 03/05/2026 (DD/MM format).", "expected": "2026-05-03"}
{"id": "case-006", "tag": "golden", "input": "Please remit payment by 04/06/2026, thanks!", "expected": "2026-04-06"}
{"id": "case-007", "tag": "golden", "input": "Invoice payment due 02/09/2026 under standard 30-day terms.", "expected": "2026-02-09"}
```

The current prompt (v2) defaults ambiguous numeric dates to month-first (MM/DD) unless the email states otherwise. Under v2, case-004 fails: the email explicitly says "(DD/MM format)," but the model ignores the clue and defaults anyway, producing `2026-03-05` instead of `2026-05-03`. Golden score: **4/5**.

An engineer sees that one failure, diagnoses it as "the default is wrong," and ships v3: flip the global default from MM/DD to DD/MM for every ambiguous date. Rerunning the golden set:

| Case | Expected | v2 result | v3 result |
|---|---|---|---|
| case-001 | 2026-03-15 | pass | pass |
| case-003 | 2026-03-12 | pass | pass |
| case-004 | 2026-05-03 | **fail** (`2026-03-05`) | pass (`2026-05-03`) |
| case-006 | 2026-04-06 | pass | **fail** (`2026-06-04`) |
| case-007 | 2026-02-09 | pass | **fail** (`2026-09-02`) |

v3 fixes case-004 and breaks case-006 and case-007, both plain ambiguous dates with no format clue, both previously correct under the MM/DD default. Golden score: **3/5** - worse overall than v2, despite "fixing" the case that motivated the change. The actual bug was never the default; it was that the model wasn't reliably using an explicit format clue when one was present. Flipping the global default was the fix for the symptom the engineer happened to look at, not the mechanism. [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow) picks up exactly here and walks the surgical fix that gets all five green.

Nobody needed to notice case-006 or case-007 by eye to catch this - that's what the gate is for.

## The mechanism: gating, not just measuring

A regression gate is a script that runs only the golden-tagged subset and exits non-zero if any of them fail:

```python
import sys, json

def load_golden(path):
    with open(path) as f:
        return [c for c in (json.loads(l) for l in f if l.strip()) if c["tag"] == "golden"]

def gate(cases_path, call_model_fn):
    cases = load_golden(cases_path)
    failures = [c for c in cases if call_model_fn(c["input"]).strip() != c["expected"]]
    if failures:
        print(f"GOLDEN GATE FAILED: {len(failures)}/{len(cases)} regressed")
        for f in failures:
            print(f"  [{f['id']}] expected {f['expected']!r}")
        sys.exit(1)
    print(f"Golden gate passed: {len(cases)}/{len(cases)}")

if __name__ == "__main__":
    gate("cases.jsonl", call_model)
```

Running this against only the golden subset - not the full 20-or-however-many-case set - is a deliberate choice, not a shortcut. Every case in the full set costs a model call each run; a set small enough to run on every proposed change stays small on purpose, and every case in it has to be worth that permanent cost.

## The precise tradeoffs

**Sensitivity vs. cost.** A bigger golden set catches more regressions but means more API calls, more latency, and more money spent on every single proposed change - to CI or to whoever's iterating locally. There's no set size that's simply "correct"; it's a budget decision that trades thoroughness for how often you're willing to run it.

**Exact-match gating vs. rubric-threshold gating.** The gate above works because the due-date extractor has one correct string per case. A golden case scored by an [LLM judge](/learn/prompt-engineering/rubric-and-llm-judge) needs a threshold instead - "must score at least 2/3 on every dimension" - and where you set that threshold is itself a judgment call. Set it too loose and a real quality regression slides through; set it too strict and ordinary judge noise starts blocking harmless changes.

**Non-determinism.** Even at a low sampling temperature, model output isn't perfectly reproducible across calls, and can shift entirely across a provider-side model version bump you didn't ask for. A golden case can flap between pass and fail on identical input. For exact-match cases with a narrow valid answer space (a date, a category) this rarely matters in practice; for anything with more output freedom, consider requiring a case to pass on a majority of several samples rather than one.

**Staleness.** A golden set frozen at launch stops representing your actual traffic as usage shifts - new phrasing, new customer segments, new formats nobody wrote a case for yet. The fix is the same discipline from [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset): every real production failure becomes a new case, and a genuinely stable golden case occasionally gets promoted out of golden status once it's no longer testing anything failure-prone.

**Local overfitting.** This is the tradeoff most worth sitting with: a set small enough to run on every PR is, by construction, small enough for a prompt to be tuned specifically to pass it while still failing broadly on the input distribution it was meant to stand in for. "Golden gate green" means *no known regression* - it does not mean *verified good at scale*. That gap is exactly why [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production) exists as an independent second check: the golden set answers "did we break something we already know about," and only live traffic can answer "is this actually better."

## Wiring it into CI

```yaml
# .github/workflows/prompt-gate.yml
on:
  pull_request:
    paths:
      - 'prompts/**'
jobs:
  golden-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r eval/requirements.txt
      - run: python eval/run_eval.py --gate --tag golden
```

Scoping the trigger to `prompts/**` keeps this from running (and costing money) on every unrelated PR, while guaranteeing it runs on every one that could actually change behavior.

## Where this still lets you down

A green golden gate tells you nothing about an input nobody has tagged yet - it can't catch a failure mode that doesn't exist as a case. It also can't tell you whether your golden cases are still the right five to be defending; that's a judgment call for the humans maintaining the set, not something the gate can verify about itself. Treat it as a floor, not a ceiling.

**Related:** [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge), [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow), [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production), [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code)
