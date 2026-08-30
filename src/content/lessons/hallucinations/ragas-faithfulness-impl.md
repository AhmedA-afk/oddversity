---
title: "Implementation: Automated RAG Faithfulness Scoring"
track: "hallucinations"
status: live
summary: "Build a RAGAS-style faithfulness scorer that extracts claims, checks each against retrieved chunks, and compare it to human labels."
duration: "8 min read"
---

[Faithfulness Metrics for RAG Systems](/learn/hallucinations/rag-faithfulness-metrics) defines the metric; this lesson builds the scorer. Extract claims from an answer, check each against the retrieved chunks that actually produced it, report the supported ratio — then find out how well that automated number tracks a human's judgment on the same items.

## What we're building

A `ragas_faithfulness(question, retrieved_chunks, answer, judge)` function following the same claim-extraction-and-verify shape RAGAS uses under the hood, run over a small RAG eval set, with one item that visibly drifts beyond its sources, and a comparison against human labels on the same set.

## Setup

Standard library plus the usual `judge(prompt: str) -> str` abstraction. The eval set below is a small, fictional support-bot corpus — five items, enough to see the mechanism work without needing a real index.

## Build it

### Step 1: The eval-set shape

```python
EVAL_SET = [
    {
        "id": "r1",
        "question": "How long do I have to request a refund after cancelling?",
        "retrieved_chunks": [
            "Refund requests must be submitted within 14 days of the "
            "cancellation date and apply only to the unused portion of "
            "the current billing cycle."
        ],
        "answer": (
            "You have 30 days after cancelling to request a refund, and "
            "it's paid to your original payment method within 5-7 "
            "business days."
        ),
    },
    {
        "id": "r2",
        "question": "What file types can I upload for receipt OCR?",
        "retrieved_chunks": [
            "Supported formats for receipt scanning are JPEG, PNG, and "
            "PDF, up to 10 MB per file."
        ],
        "answer": "You can upload JPEG, PNG, or PDF files, up to 10 MB each.",
    },
    # r3-r5 follow the same shape: question, the chunks actually
    # retrieved for it, and the answer actually generated from them.
]
```

> **Why this step?** `retrieved_chunks` is the exact evidence the generator had for that call — not the whole knowledge base. Faithfulness only means something scored against what the model actually saw, per [Faithfulness Metrics for RAG Systems](/learn/hallucinations/rag-faithfulness-metrics).

### Step 2: Extract claims from the answer

```python
EXTRACT_PROMPT = """\
Break the following answer into individual factual claims, one per
line, with no numbering or commentary. Each claim should be a
standalone statement that could be true or false on its own.

ANSWER:
{answer}
"""

def extract_claims(answer: str, judge) -> list[str]:
    raw = judge(EXTRACT_PROMPT.format(answer=answer))
    return [line.strip("- ").strip() for line in raw.splitlines() if line.strip()]
```

### Step 3: Verify each claim against the retrieved chunks

```python
VERIFY_PROMPT = """\
RETRIEVED CONTEXT:
{context}

CLAIM:
{claim}

Is this claim directly supported by the retrieved context above?
Answer "yes" or "no" only. If the context is simply silent on it,
answer "no" — faithfulness requires the context to actually say it,
not merely fail to contradict it.
"""

def verify_claim(claim: str, chunks: list[str], judge) -> bool:
    context = "\n".join(chunks)
    verdict = judge(VERIFY_PROMPT.format(context=context, claim=claim))
    return verdict.strip().lower().startswith("yes")
```

> **Why this step?** The prompt deliberately resolves the "silent context" case as unsupported rather than a third bucket. RAGAS's faithfulness score is intentionally strict this way — an answer only earns credit for what its context actually states, so a model that pads a good answer with unrelated-but-true-sounding detail still gets penalized for the padding.

### Step 4: Score and report

```python
def ragas_faithfulness(item: dict, judge) -> dict:
    claims = extract_claims(item["answer"], judge)
    verdicts = [(c, verify_claim(c, item["retrieved_chunks"], judge)) for c in claims]
    supported = sum(1 for _, ok in verdicts if ok)
    return {
        "id": item["id"],
        "claims": verdicts,
        "faithfulness": supported / len(claims) if claims else None,
    }
```

### Step 5: Run it over the eval set

```python
for item in EVAL_SET:
    result = ragas_faithfulness(item, judge)
    print(f"{result['id']}: faithfulness={result['faithfulness']:.2f}")
    for claim, ok in result["claims"]:
        print(f"   [{'supported' if ok else 'UNSUPPORTED'}] {claim}")
```

For `r1`, both claims ("30-day window" and "5-7 business day payout") come back unsupported — the retrieved chunk says 14 days and says nothing about payout timing — giving **faithfulness: 0.00**, flagging exactly the drift-beyond-sources case from the previous lesson. For `r2`, both claims match the chunk directly, giving **faithfulness: 1.00**.

### Step 6: Compare to human labels

```python
HUMAN_LABELS = {
    "r1": 0.0,
    "r2": 1.0,
    # ... labeled independently, using the rubric from
    # Human Evaluation and Annotation Protocols
}

def compare_to_human(automated_scores: dict, human_labels: dict) -> float:
    diffs = [abs(automated_scores[qid] - human_labels[qid]) for qid in human_labels]
    return sum(diffs) / len(diffs)  # mean absolute difference
```

A small mean absolute difference (well under 0.1 on a well-behaved item like `r2`) is reassuring. Where they diverge is usually informative, not noise: a claim that's a reasonable paraphrase of the source ("costs about ten dollars a month" vs. a chunk stating "$9.99/month") might get marked supported by a lenient human and unsupported by a strict automated verifier reading for exact entailment — a calibration gap worth writing into the rubric, exactly the kind of disagreement [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) walks through resolving.

## Where it breaks (+fix)

The verifier above force-labels every claim "yes" or "no," with no room for "the context doesn't say either way but doesn't contradict it" — which is a real, common case (a claim about company policy tone or intent that's a fair reading of the source without being a literal restatement). Forcing binary here means borderline-reasonable paraphrases get penalized identically to outright fabrications, both scoring 0. **Fix:** add a third `"partial"` verdict scored at 0.5 rather than 0, and track how often it fires — a high partial rate is a signal that your extraction prompt is producing claims that are more interpretive than the retrieved text actually supports, which is worth fixing in the prompt rather than absorbing into the score.

## Takeaways

- Faithfulness scoring is claim extraction plus per-claim verification against the exact context used — not a whole-answer judgment call.
- A strict "silence means unsupported" rule is a deliberate choice, not an oversight — it's what makes the score sensitive to padding and drift rather than lenient toward it.
- Automated scores need a human comparison to mean anything; run the comparison on every new domain or judge-model swap, not once and never again.
- For higher-throughput, lower-cost verification than an LLM judge call per claim, the same verify step can be swapped for a dedicated entailment model — see [NLI Entailment Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl).

**Related:** [Faithfulness Metrics for RAG Systems](/learn/hallucinations/rag-faithfulness-metrics) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [NLI Entailment Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl) · [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) · [Worked Example: Hallucination Regression Testing in CI](/learn/hallucinations/tracking-hallucination-in-ci)
