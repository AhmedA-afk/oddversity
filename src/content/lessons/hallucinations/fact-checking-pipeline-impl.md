---
title: "Implementation: An Automated Fact-Checking Pipeline"
track: "hallucinations"
status: live
summary: "Chain claim extraction, evidence retrieval, and entailment checking into one pipeline that labels every claim and catches a fabrication."
duration: "8 min read"
---

[Fact-checking pipelines](/learn/hallucinations/fact-checking-pipelines) described the three-stage shape: extract, retrieve, judge. This lesson builds it as a runnable chain and runs it against a multi-claim answer with one fabrication buried in it.

## What we're building

A pipeline function that takes a draft answer, breaks it into individual claims, retrieves evidence for each one independently, and labels each claim `supported`, `unsupported`, or `unverifiable`. Unlike the single-pass output guard in the [previous lesson](/learn/hallucinations/input-output-guardrail-impl), this pipeline retrieves fresh evidence per claim rather than checking against whatever sources generation already had — which is what lets it catch a claim the generator invented from parametric memory instead of the retrieved context.

## Setup

Same `call_llm` stand-in as before, plus a `retrieve(query)` function representing your search or vector-lookup layer.

```python
def call_llm(prompt: str, temperature: float = 0.0) -> str:
    raise NotImplementedError("wire this to your LLM client")

def retrieve(query: str, k: int = 3) -> list[str]:
    raise NotImplementedError("wire this to your retriever")
```

## Build it

### Step 1: extract discrete claims

```python
import json

EXTRACT_PROMPT = """\
Break the following answer into individual, checkable factual claims.
Split bundled statements — a claim should contain exactly one fact
(one number, one date, one attributed quote, one named relationship).

ANSWER:
{answer}

Respond as a JSON list of strings, one claim per item.
"""

def extract_claims(answer: str) -> list[str]:
    raw = call_llm(EXTRACT_PROMPT.format(answer=answer))
    return json.loads(raw)
```

### Step 2: retrieve evidence per claim

```python
def gather_evidence(claim: str) -> list[str]:
    # a targeted query per claim outperforms reusing the original
    # question's retrieval — the claim is more specific than the question
    return retrieve(claim, k=3)
```

### Step 3: judge each claim against its evidence

```python
JUDGE_PROMPT = """\
CLAIM: {claim}

EVIDENCE:
{evidence}

Does the evidence support this claim? Respond as strict JSON:
{{"verdict": "supported" or "contradicted" or "unverifiable",
  "reasoning": "one sentence"}}
Use "unverifiable" only if the evidence neither confirms nor denies it —
do not guess supported or contradicted from missing information.
"""

def judge_claim(claim: str, evidence: list[str]) -> dict:
    evidence_text = "\n".join(f"- {e}" for e in evidence) or "(no evidence found)"
    raw = call_llm(JUDGE_PROMPT.format(claim=claim, evidence=evidence_text))
    return json.loads(raw)
```

### Step 4: chain them and annotate the answer

```python
def fact_check(answer: str) -> dict:
    claims = extract_claims(answer)
    results = []
    for claim in claims:
        evidence = gather_evidence(claim)
        verdict = judge_claim(claim, evidence)
        results.append({"claim": claim, **verdict, "evidence": evidence})

    unsupported = [r for r in results if r["verdict"] != "supported"]
    return {
        "claims": results,
        "clean": len(unsupported) == 0,
        "unsupported": unsupported,
    }
```

> **Why this step?** Judging claim-by-claim against claim-specific evidence, rather than one holistic "is this answer accurate?" call, is what makes the pipeline catch a single fabricated detail buried in an otherwise solid answer — a holistic judge tends to average across claims and let one bad one hide behind several good ones.

## Run it

A multi-claim answer with one fabrication:

```python
draft = (
    "The company was founded in 2014 by two former engineers from a "
    "larger firm. It raised $12M in its Series A, led by a well-known "
    "fund, and now employs over 400 people across three offices."
)

report = fact_check(draft)
for r in report["claims"]:
    print(r["verdict"], "-", r["claim"])
```

```text
supported     - The company was founded in 2014.
supported     - It was founded by two former engineers from a larger firm.
supported     - It raised $12M in its Series A led by a well-known fund.
unsupported   - It now employs over 400 people across three offices.
```

The headcount claim doesn't appear anywhere in the retrieved sources — most likely the model interpolated a plausible-sounding number from the funding size. `report["clean"]` is `False`, and `report["unsupported"]` contains exactly the one claim to strip or flag, feeding directly into the rewrite step from the [output guard](/learn/hallucinations/input-output-guardrail-impl).

## Harden it

- **Cap claims per answer.** A long answer can produce dozens of atomic claims; checking all of them multiplies retrieval and judge calls. Scope to checkable claim types (numbers, dates, named entities, quotes) rather than every sentence, as the source lesson recommends.
- **Distinguish `unverifiable` from `unsupported` in your routing.** A claim your evidence source simply doesn't cover is a different problem than a claim actively invented — the first might mean "expand retrieval," the second means "the model fabricated this." Conflating them in monitoring hides which one is actually happening.
- **Watch the judge for over-agreeableness.** A judge that verifies too permissively defeats the whole pipeline — periodically spot-check its verdicts against a human read, the same discipline as calibrating any LLM-as-judge.

## Extend it

- **Cache evidence by claim, not by question.** Two different questions often produce overlapping atomic claims ("founded in 2014" shows up across many prompts about the same company) — cache retrieval results keyed on the claim text to cut repeated lookups.
- **Batch judge calls.** Running the judge prompt across several claims in one call, rather than one claim per call, cuts latency and cost roughly in proportion to the batch size — worth it once you're checking answers with many claims routinely.
- **Feed `report["unsupported"]` into monitoring** as a sampled faithfulness signal — see [monitoring hallucination in production](/learn/hallucinations/monitoring-hallucination-in-prod) for turning this per-request output into a trend line.

The throughput cost is real: this pipeline is one extraction call plus one retrieval and one judge call per claim, which for a five-claim answer is roughly six to eleven model calls beyond the original generation. That's the wrong trade for casual chat and the right one for financial, medical, or legal content — see [latency, cost, and reliability tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) for how to decide which requests earn the full pipeline versus the lighter single-pass guard.

**Related:** [Fact-Checking Pipelines Before Output Ships](/learn/hallucinations/fact-checking-pipelines), [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl), [Deep Dive: Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs), [Citations: Making Every Claim Traceable to a Source](/learn/hallucinations/citations-and-attribution), [Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod)
