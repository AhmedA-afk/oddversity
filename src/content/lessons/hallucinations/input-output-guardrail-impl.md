---
title: "Implementation: Input and Output Guardrails"
track: "hallucinations"
status: live
summary: "Build a runnable input guard for false premises and an output guard for unsupported claims, both reusable in the capstone."
duration: "8 min read"
---

The [guardrail taxonomy](/learn/hallucinations/guardrails-taxonomy) is a map. This lesson builds two of its three layers as actual code: an input guard that catches a bad question before generation, and an output guard that catches a bad claim after it.

## What we're building

Two wrapper functions around a normal LLM call:

- `check_input(question)` — flags false-premise or out-of-scope questions before they reach the generator.
- `check_output(answer, sources)` — extracts claims from a draft answer and verifies each one against retrieved sources, stripping or flagging anything unsupported.

Both are designed to be dropped into the pipeline from the [architecture overview](/learn/hallucinations/reliability-architecture-overview) as the input-guardrail and output-guardrail stages, and both get reused directly in the [capstone](/learn/hallucinations/capstone-trustworthy-qa-system).

## Setup

We'll use a generic `call_llm(prompt, temperature=0)` function standing in for whatever provider client you use — swap it for your actual SDK call. Everything else is plain Python, no framework required.

```python
def call_llm(prompt: str, temperature: float = 0.0) -> str:
    """Stand-in for your provider's chat completion call."""
    raise NotImplementedError("wire this to your LLM client")
```

## Build it

### Step 1: an input guard for false premises

The guard doesn't try to answer the question — it asks a narrower question: does this question assume something that isn't true?

```python
import json

INPUT_GUARD_PROMPT = """\
You are checking a question for hidden false premises before anyone
tries to answer it. Do not answer the question.

Question: {question}

Respond with strict JSON:
{{
  "has_false_premise": true or false,
  "premise_in_question": "the assumption you checked, or null",
  "explanation": "why it's false, or null if none found"
}}
"""

def check_input(question: str) -> dict:
    raw = call_llm(INPUT_GUARD_PROMPT.format(question=question))
    result = json.loads(raw)
    if result["has_false_premise"]:
        result["action"] = "block_and_clarify"
    else:
        result["action"] = "proceed"
    return result
```

> **Why this shape?** Separating "check the premise" from "answer the question" matters because a model asked to do both in one pass tends to answer first and rationalize the premise second — the same reasoning as splitting critique from revision in [self-verification](/learn/hallucinations/self-verification-techniques). A dedicated, narrowly-scoped call is more reliable than a side effect of a bigger one.

### Step 2: an output guard for unsupported claims

This is a small, single-purpose version of the full [fact-checking pipeline](/learn/hallucinations/fact-checking-pipeline-impl) — good enough to run on every request rather than reserved for the heaviest tier.

```python
CLAIM_CHECK_PROMPT = """\
SOURCES:
{sources}

ANSWER:
{answer}

List every factual claim in ANSWER as a separate item. For each, say
whether it is "supported" (stated in SOURCES), "unsupported" (not
in SOURCES), or "contradicted" (SOURCES say something different).
Respond as strict JSON: a list of
{{"claim": "...", "verdict": "supported|unsupported|contradicted"}}.
"""

def check_output(answer: str, sources: str) -> dict:
    raw = call_llm(CLAIM_CHECK_PROMPT.format(sources=sources, answer=answer))
    claims = json.loads(raw)
    bad = [c for c in claims if c["verdict"] != "supported"]
    return {
        "claims": claims,
        "all_supported": len(bad) == 0,
        "flagged": bad,
    }
```

### Step 3: wire block/rewrite behavior around both

A guard that only reports isn't a guardrail yet — it needs to actually change what ships.

```python
def guarded_answer(question: str, retrieve_fn, generate_fn) -> dict:
    input_check = check_input(question)
    if input_check["action"] == "block_and_clarify":
        return {
            "status": "blocked_input",
            "message": f"This question assumes: {input_check['premise_in_question']}. "
                       f"{input_check['explanation']}",
        }

    sources = retrieve_fn(question)
    draft = generate_fn(question, sources)
    output_check = check_output(draft, sources)

    if output_check["all_supported"]:
        return {"status": "shipped", "answer": draft}

    # rewrite: strip flagged claims, keep the rest
    flagged_text = "; ".join(c["claim"] for c in output_check["flagged"])
    rewritten = call_llm(
        f"Rewrite this answer, removing only these unsupported claims: "
        f"{flagged_text}\n\nOriginal answer:\n{draft}"
    )
    return {
        "status": "shipped_with_rewrite",
        "answer": rewritten,
        "removed_claims": output_check["flagged"],
    }
```

## Run it

A false-premise question intercepted before generation:

```python
result = guarded_answer(
    "Why did the EU ban GPT-4 in 2023?",  # false premise: no such ban happened
    retrieve_fn=my_retriever,
    generate_fn=my_generator,
)
# {"status": "blocked_input",
#  "message": "This question assumes: the EU banned GPT-4 in 2023. ..."}
```

An unsupported claim stripped from an otherwise-good answer:

```python
# draft answer includes: "The library was released in 2019 and has
# over 40,000 GitHub stars." Source only confirms the release year.
result = guarded_answer(
    "When was this library released and how popular is it?",
    retrieve_fn=my_retriever,
    generate_fn=my_generator,
)
# status: "shipped_with_rewrite"
# removed_claims: [{"claim": "has over 40,000 GitHub stars", "verdict": "unsupported"}]
```

## Harden it

- **Fail closed on guard errors.** If `call_llm` for either guard throws or returns unparseable JSON, treat that as a failed check, not a passed one — return `blocked_input` or hold the output rather than shipping unchecked, per [guardrails for high-stakes output](/learn/hallucinations/guardrails-for-high-stakes-output).
- **Cap the rewrite loop.** A single rewrite attempt is usually enough; looping "rewrite, recheck, rewrite again" without a limit risks the model reintroducing a different unsupported claim each pass.
- **Log every block and every flagged claim.** This is the raw material [monitoring](/learn/hallucinations/monitoring-hallucination-in-prod) needs to compute guard-block rate over time.

## Extend it

- Add a second input-guard check for out-of-scope requests (not false-premise, just outside what the system should answer at all) alongside the premise check.
- Feed `output_check["flagged"]` into the [confidence gate](/learn/hallucinations/confidence-gated-escalation-impl) as one input signal, alongside a semantic-entropy score, rather than deciding in isolation.
- Swap the single-call claim extraction for the full three-stage [fact-checking pipeline](/learn/hallucinations/fact-checking-pipeline-impl) on your highest-risk tier, where the extra latency is worth it.

**Related:** [A Taxonomy of Guardrails](/learn/hallucinations/guardrails-taxonomy), [Fact-Checking Pipelines Before Output Ships](/learn/hallucinations/fact-checking-pipelines), [Self-Verification: Having the Model Check Its Own Work](/learn/hallucinations/self-verification-techniques), [Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl), [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview)
