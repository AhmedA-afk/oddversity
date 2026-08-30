---
title: "Implementation: An LLM-as-Judge Evaluation Harness"
track: "hallucinations"
status: live
summary: "A reusable harness that scores (question, answer, reference) triples claim by claim, compares two prompts, and checks itself against human labels."
duration: "9 min read"
---

A one-off judge prompt you paste into a notebook doesn't survive contact with a second prompt variant, a bigger dataset, or a teammate asking "wait, how did you control for position bias?" This lesson builds the harness version: reusable, comparable across runs, and honest about its own failure modes.

## What we're building

A harness that takes a dataset of `(question, answer, reference)` triples, runs a claim-level rubric judge over each, and aggregates the results into a factuality score and a faithfulness score per prompt variant — so you can run it once against your current system prompt and once against a candidate, and see whether the candidate actually reduces hallucination rate or just feels different. We include a position-bias control and a human spot-check step, because an unvalidated judge is not a measurement, it's an opinion with a temperature setting.

## Setup

Standard library plus a `judge(prompt: str) -> str` callable, same abstraction used throughout this module. Pin its temperature to 0 before you trust anything it reports — a judge that isn't deterministic makes every downstream number noisy for reasons that have nothing to do with your system.

## Build it

### Step 1: The dataset shape

```python
DATASET = [
    {
        "id": "q1",
        "question": "What's the maximum file size for a receipt upload?",
        "reference": "10 MB per image; larger files are rejected before OCR runs.",
    },
    {
        "id": "q2",
        "question": "How many days do I have to request a refund after cancelling?",
        "reference": "14 days from the cancellation date, unused portion of the current cycle only.",
    },
    {
        "id": "q3",
        "question": "Does the product support filing expenses in cryptocurrency?",
        "reference": "Not supported — correct behavior is to say so, not guess.",
    },
    # a real dataset here is the golden set built in
    # Building a Golden Hallucination Eval Set
]
```

> **Why this step?** Every item carries a `reference` — the known-correct answer — because the claim-level rubric below scores generated claims against it. Without a reference, "faithfulness" and "factuality" collapse into "sounds plausible," which is exactly the failure mode a judge is supposed to catch, not repeat.

### Step 2: Generate answers under two prompt variants

```python
PROMPT_VARIANT_A = "Answer the user's question directly and completely."
PROMPT_VARIANT_B = (
    "Answer the user's question using only information you're confident "
    "about. If you don't know or aren't sure, say so explicitly rather "
    "than guessing."
)

def generate(question: str, system_prompt: str, model_call) -> str:
    return model_call(system_prompt, question)

def run_variant(dataset, system_prompt, model_call) -> list[dict]:
    return [
        {**item, "answer": generate(item["question"], system_prompt, model_call)}
        for item in dataset
    ]
```

> **Why this step?** Comparing prompt variants only means something if everything else — dataset, judge, decomposition rubric — is held identical between runs. The only thing that should differ between `run_variant(A)` and `run_variant(B)` is the system prompt.

### Step 3: The claim-level rubric judge

```python
CLAIM_JUDGE_PROMPT = """\
QUESTION: {question}
REFERENCE ANSWER: {reference}
MODEL ANSWER: {answer}

List each factual claim in MODEL ANSWER as a short standalone line.
For each claim, judge it against REFERENCE ANSWER only, and label it
exactly one of: "correct", "contradicted", or "unsupported" (reference
doesn't address it either way). Output as "label: claim text", one per
line.
"""

def judge_claims(question: str, reference: str, answer: str, judge) -> list[tuple[str, str]]:
    raw = judge(CLAIM_JUDGE_PROMPT.format(question=question, reference=reference, answer=answer))
    parsed = []
    for line in raw.splitlines():
        if ":" in line:
            label, claim = line.split(":", 1)
            parsed.append((label.strip().lower(), claim.strip()))
    return parsed
```

> **Why this step?** This is the same decomposition discipline as [FActScore-style evaluation](/learn/hallucinations/factscore-eval-impl), applied against a reference answer instead of an open knowledge source — appropriate here because the harness is scoring factuality/faithfulness relative to a known-correct answer, not an open-ended fact check.

### Step 4: Aggregate into a hallucination rate

```python
def score_variant(results: list[dict], judge) -> dict:
    total_claims = 0
    bad_claims = 0
    for item in results:
        claims = judge_claims(item["question"], item["reference"], item["answer"], judge)
        total_claims += len(claims)
        bad_claims += sum(1 for label, _ in claims if label != "correct")
    return {
        "total_claims": total_claims,
        "hallucinated_claims": bad_claims,
        # explicit denominator, per Hallucination Rate Denominators:
        # per-claim, over all claims made across this run.
        "hallucination_rate": bad_claims / total_claims if total_claims else None,
    }
```

### Step 5: Control for position bias

Position bias shows up when the judge does *pairwise* comparison ("which answer is better") rather than independent scoring — the answer shown first tends to win more often than quality alone predicts. Guard it by judging both orders and checking agreement:

```python
PAIRWISE_PROMPT = """\
QUESTION: {question}
ANSWER 1: {first}
ANSWER 2: {second}

Which answer is more accurate and better grounded? Reply with exactly
"1" or "2".
"""

def pairwise_judge_debiased(question: str, answer_a: str, answer_b: str, judge) -> str:
    verdict_ab = judge(PAIRWISE_PROMPT.format(question=question, first=answer_a, second=answer_b))
    verdict_ba = judge(PAIRWISE_PROMPT.format(question=question, first=answer_b, second=answer_a))
    picked_a_when_first = verdict_ab.strip() == "1"
    picked_a_when_second = verdict_ba.strip() == "2"
    if picked_a_when_first != picked_a_when_second:
        return "inconsistent"  # position flipped the verdict — don't trust this one
    return "a" if picked_a_when_first else "b"
```

> **Why this step?** A judge call made only once, in one order, can't distinguish "answer A is genuinely better" from "answer A happened to go first." Running both orders and flagging disagreement as `"inconsistent"` turns an invisible bias into a visible, countable rate you can report alongside your scores.

### Step 6: Spot-check against human labels

```python
def spot_check(results: list[dict], human_labels: dict[str, str], judge_labels: dict[str, str]) -> float:
    agreements = sum(1 for qid in human_labels if human_labels[qid] == judge_labels.get(qid))
    return agreements / len(human_labels)
```

Pull 20–30 items, get an independent human claim-level label using the same rubric (see [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols)), and compare. This isn't optional scaffolding — it's the only thing that tells you whether the judge you just built is measuring the same thing a careful person would.

## Run it

```python
results_a = run_variant(DATASET, PROMPT_VARIANT_A, model_call)
results_b = run_variant(DATASET, PROMPT_VARIANT_B, model_call)

score_a = score_variant(results_a, judge)
score_b = score_variant(results_b, judge)

print("Variant A (direct):", score_a)
print("Variant B (abstain-aware):", score_b)
```

A typical outcome: variant B's `hallucination_rate` comes in lower than variant A's — the abstention-aware prompt trades some coverage (more "I'm not sure" responses on the crypto-expense question) for fewer confidently wrong claims elsewhere. Report both the rate *and* how many items produced a hedge or refusal under B, or you've reproduced the exact single-number trap [What to Measure](/learn/hallucinations/what-to-measure-metrics) warns about — a lower hallucination rate that's really just more abstention wearing a better-sounding label.

## Harden it

- **Pin the judge model, prompt, and version, and log them with every result.** Silently upgrading your judge shifts your entire historical baseline — a "regression" next month might just be a stricter grader.
- **Use a judge from a different model family than whatever generated the answers.** A judge sharing the generator's blind spots under-flags exactly the errors both share — a specific pitfall named in [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls).
- **Cache judge calls per `(question, answer)` pair.** Re-running the harness during development shouldn't re-pay for identical judge calls every time.

## Extend it

Swap the reference-based claim rubric for the open-knowledge-source version from [FActScore-style evaluation](/learn/hallucinations/factscore-eval-impl) when you don't have a gold reference answer, only a knowledge source to check against. Once the harness is trustworthy, wire it into a build gate exactly as [Hallucination Regression Testing in CI](/learn/hallucinations/tracking-hallucination-in-ci) does next.

**Related:** [Implementation: FActScore-Style Atomic-Fact Evaluation](/learn/hallucinations/factscore-eval-impl) · [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) · [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) · [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics) · [Worked Example: Hallucination Regression Testing in CI](/learn/hallucinations/tracking-hallucination-in-ci)
