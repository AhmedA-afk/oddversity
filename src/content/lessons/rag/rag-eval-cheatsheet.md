---
title: "RAG Evaluation Cheatsheet"
track: "rag"
status: live
summary: "A scannable reference for localizing RAG failures to retrieval or generation, mapping ragas/TruLens metrics, building a golden set fast, and calibrating your judge."
duration: "7 min read"
---

When your RAG eval score drops, the first question isn't "how do we fix it" — it's "which stage broke." This cheatsheet maps the common ragas/TruLens-style metrics to the failure they actually localize, gives you if-then rules for diagnosis, and a fast path to a golden set and a judge you can trust. It assumes you've already read [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) — that's where the concepts live; this is the reference card you keep open while debugging.

## The four-metric diagnostic

Every RAG failure traces back to one of two stages: retrieval (did we fetch the right material?) or generation (did the model use it correctly?). Four metrics, read together, tell you which:

| Context Precision | Context Recall | Faithfulness | Answer Relevancy | Diagnosis | Go fix |
|---|---|---|---|---|---|
| Low | Low | — | Low | Retrieval isn't finding relevant material at all | Chunking, embedding model, index config |
| High | Low | — | Low | Right chunks rank well, but coverage is incomplete — needed info never surfaces | [Hybrid search](/learn/rag/hybrid-search-lexical-and-vector), query expansion, chunk overlap |
| High | High | Low | — | Retrieval is fine; the model is ignoring or contradicting its context | Prompt grounding, lower temperature, [citation-forcing](/learn/rag/grounding-answers-with-citations) |
| High | High | High | Low | Model is faithful to context, but the context doesn't actually answer the question asked | Query understanding, corpus coverage gap, question may be unanswerable |
| High | High | High | High | Both stages look healthy | If users still complain: check golden-set quality or judge calibration (below) |

Read precision/recall/faithfulness/relevancy together, never in isolation — a single low number without its neighbors tells you *that* something's wrong, not *where*.

## The metric map

Ragas and TruLens name overlapping ideas differently. Same failure mode, different vocabulary:

| What it measures | Ragas name | TruLens name | Stage | Needs ground truth? |
|---|---|---|---|---|
| Fraction of retrieved chunks that are actually relevant, rank-weighted | Context Precision | Context Relevance | Retrieval | Ragas: yes (or LLM-judged) · TruLens: no |
| Fraction of needed information that made it into retrieved context | Context Recall | — | Retrieval | Yes |
| Fraction of answer claims supported by retrieved context | Faithfulness | Groundedness | Generation | No |
| Does the answer address the question actually asked | Answer Relevancy | Answer Relevance | Generation | No |
| Does the final answer match a reference answer | Answer Correctness / Answer Similarity | — (usually custom) | End-to-end | Yes |

TruLens's classic "RAG triad" (Context Relevance, Groundedness, Answer Relevance) has no direct recall analogue — its context metric is precision-style, judged per retrieved chunk, not a coverage check against a known-needed answer set. If you need recall specifically, you need ground truth, full stop.

Two mechanics worth knowing before you trust the numbers:

- **Faithfulness** is typically computed by decomposing the answer into atomic claims, then asking a judge "is this claim supported by the context?" per claim, and averaging. One unsupported claim in an otherwise-solid answer tanks the score more than a quick read would suggest — that's the intended sensitivity, not a bug.
- **Answer Relevancy** (ragas) works backwards: it prompts an LLM to generate several questions that the *answer* would be a good response to, embeds them, and compares to the original question's embedding. A vague or partial answer generates vague reverse-questions that drift from the original — that drift is what tanks the score, not keyword overlap.

## Decision rules

- **Context precision low** → your retriever is returning noise ahead of signal. Try a [reranker](/learn/rag/reranking-retrieved-results) before touching the embedding model — reranking is markedly slower per query but often fixes precision faster than a re-index.
- **Context recall low, precision fine** → the right chunk exists somewhere in the index but isn't surfacing. Check chunk boundaries first — an answer split across two chunks looks like "missing" to a top-k retriever — then try [hybrid search](/learn/rag/hybrid-search-lexical-and-vector) or query expansion.
- **Faithfulness low despite high recall/precision** → this is a prompting problem, not a retrieval problem. Don't touch your index. Tighten the system prompt ("answer only using the provided context; say you don't know if it isn't there"), drop temperature, and consider [forcing citations](/learn/rag/grounding-answers-with-citations) so ungrounded claims are structurally harder to produce.
- **Answer relevancy low despite high faithfulness** → the model answered *faithfully* to context that didn't address the question. That's a retrieval-relevance problem wearing a generation costume — go back to precision/recall for this specific query type, not the prompt.
- **Answer correctness low but faithfulness high** → suspect the golden answer before the pipeline. A stale or wrong reference answer will fail a pipeline that's actually behaving correctly.
- **Everything scores well but users still complain** → your golden set doesn't represent real usage, or your judge is miscalibrated. Go to the next two sections before touching the pipeline again.

## Build a golden set fast

You don't need hundreds of hand-labeled examples to start catching regressions — you need real coverage.

1. **Mine real queries first.** Support tickets, search logs, Slack questions — anything users actually asked beats guessing every time. Synthetic questions skew toward "the obvious thing you'd ask about a paragraph," which real users rarely phrase that cleanly.
2. **Backfill with corpus-derived synthesis.** For chunks with no real query on file, generate one: sample a chunk, prompt an LLM to write a question it answers plus an extractive gold answer. This gives you `(question, gold_context, gold_answer)` triples for free, at the cost of some genericness.
3. **Stratify on purpose, not luck.** Deliberately include single-fact lookups, multi-hop questions needing two-plus chunks, out-of-scope questions that should trigger a refusal, and ambiguous phrasing. A set that's mostly easy single-fact lookups hides exactly the failures that matter in production.
4. **Human-review a sample of the synthetic slice.** LLM-generated questions drift toward trivial extraction over time — spot-check and hand-edit the easy ones out or the hard ones in.
5. **Freeze it and version it.** Treat the golden set like a test suite: commit it, diff it release over release, and don't quietly edit it when a score you don't like shows up — that's how eval sets rot into vanity metrics.

Starting points, then measure:

| Use case | Golden set size |
|---|---|
| CI regression gate (catch "did this change break anything") | ~50–100 examples |
| Model/prompt version comparison (need stable deltas) | ~300+ examples |
| Stratified slice, per query type (e.g. multi-hop) | ~20–30 examples minimum |

## Judge calibration

An LLM judge is an unvalidated instrument until you check it. Cheap ways to check it:

- **Avoid judging with the same model that generated the answer** when you can. Self-preference bias — a model rating its own style of output more favorably — is a real, well-documented effect, and it quietly inflates every faithfulness/relevancy number you report.
- **Decompose before you score.** A judge asked "rate this 1–5" is noisier than one asked "list the claims, then say yes/no per claim" — this is what ragas's faithfulness metric does under the hood. Binary per-claim judgments reproduce far better than holistic scores.
- **Spot-check against humans before trusting scale.** Pull 20–30 examples, get a human label, compare to the judge's label, eyeball agreement. Do this per judge-model/prompt combination, not once ever — a judge well-calibrated on easy questions can fall apart on multi-hop ones.
- **Watch for length and position bias.** In pairwise "which answer is better" judging, longer answers and the answer shown first both win more often than quality alone would predict. Randomize order; consider normalizing for length when comparing terse vs. verbose systems.
- **Pin the judge, not just the pipeline.** Treat judge model + prompt + version as part of your eval spec and log it with results. Silently upgrading your judge model shifts your whole historical baseline — you'll see a "regression" that's actually just a stricter grader.
- **Set judge temperature to 0** as a starting point, then re-run the same judge call 2–3x on a handful of examples to confirm it's actually stable — some judge models drift even at temperature 0.

## Copy-paste snippets

Ragas-style batch eval (adjust metric imports to your installed version):

```python
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)

data = {
    "question": [...],          # your golden questions
    "answer": [...],            # what your pipeline produced
    "contexts": [[...], [...]], # retrieved chunks per question
    "ground_truth": [...],      # golden answers, for recall/correctness
}

dataset = Dataset.from_dict(data)
result = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)
print(result)  # per-metric scores, plus a per-row breakdown for triage
```

Synthetic golden-set seed prompt (feed it one chunk at a time):

```text
You are generating a QA test case from a single document chunk.

CHUNK:
{chunk_text}

Write:
1. A question a real user might ask that this chunk answers directly.
2. A concise gold answer, using only information in the chunk.
3. One "hard mode" variant: a question that needs this chunk PLUS
   context outside it to answer fully (or say "none" if not possible).

Do not invent facts not present in the chunk.
```

Manual faithfulness check, for when you don't want a framework dependency:

```text
Given CONTEXT and ANSWER below, list every factual claim in ANSWER
as a separate bullet. For each claim, answer only "supported",
"contradicted", or "unsupported" based strictly on CONTEXT — not
on your own knowledge.

CONTEXT:
{retrieved_context}

ANSWER:
{model_answer}
```

Score = supported claims ÷ total claims. This is the manual version of what ragas automates — useful when you need to explain a score to a stakeholder who doesn't trust a black-box number.

## Keep going

The table and rules above are diagnostic tools, not scores to chase for their own sake. See the [RAG eval worked example](/learn/rag/rag-eval-worked-example) for a full failure trace start to finish, and [RAG eval common mistakes](/learn/rag/rag-eval-common-mistakes) for what goes wrong when teams apply this table without first checking their golden set or judge.

**Related:** [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) · [RAG Eval Worked Example](/learn/rag/rag-eval-worked-example) · [RAG Eval Common Mistakes](/learn/rag/rag-eval-common-mistakes)
