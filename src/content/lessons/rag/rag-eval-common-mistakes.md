---
title: "RAG Evaluation: Common Mistakes"
track: "rag"
status: live
summary: "Six documented ways RAG evaluation goes wrong — leaked eval sets, vibes-only checks, blended retrieval/generation scores, uncalibrated LLM judges, and metric overfitting — with mec."
duration: "7 min read"
---

Most broken RAG evaluations don't fail because someone picked the wrong metric — they fail because the setup feeding the metric was compromised from the start. These are the mistakes that show up over and over in real pipelines, quietly convincing a team its system is fine when it isn't. If you haven't yet, read [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) first — this page assumes you know the metrics and goes straight to how teams misuse them.

## Evaluating on the docs you indexed

### The mistake (what people actually do)
You build your eval set by generating queries *from* the corpus you just indexed — either an LLM writes a question from a chunk ("what does this paragraph say about refund windows?"), or you use the chunk's own heading as the query. Then you check whether retrieval surfaces that same chunk.

**Why it's wrong**
The query and the target are generated from the same source, so they share vocabulary, phrasing, and structure almost by construction. A bi-encoder doesn't need to generalize at all to match them — it's answering a paraphrase-recognition test, not a retrieval test. Real users don't phrase questions the way the source document phrases its own content: they use their own vocabulary, ask about things spanning multiple chunks, or ask questions the corpus answers only indirectly.

**Symptom**
Retrieval numbers look excellent in eval — recall@k sitting near-perfect — while production complaints keep arriving about the system "not finding basic things." Look closer and your eval set has zero multi-hop questions, zero paraphrased vocabulary, and zero queries with no clean matching chunk.

**Fix**
Source eval queries from real usage — logged user queries, support tickets, or a domain expert writing questions cold, without seeing the chunk text. If you must generate synthetically, do it adversarially: prompt the generator to phrase as someone unfamiliar with the document's exact wording, and deliberately include queries that require combining two chunks or that have no answer in the corpus at all. See the [worked example](/learn/rag/rag-eval-worked-example) for building a set this way end to end.

## No golden set — vibes-only evaluation

### The mistake (what people actually do)
You change a prompt, a chunk size, or swap a model, run a handful of queries you remember off the top of your head, glance at the outputs, and decide "yeah, this looks better." No fixed query set, no recorded expected answers, no number.

**Why it's wrong**
Without a fixed, repeatable set you're comparing against a moving and subjective bar. You'll unconsciously favor whatever you just changed (you *want* your change to have worked), you'll test the cases you happen to remember rather than the cases that actually matter, and you have no way to tell whether change A quietly regressed something that change B, three weeks later, happened to fix back. Two people on the same team can disagree about whether the system improved and neither can point to anything concrete.

**Symptom**
A regression ships, feels fine at the time, and resurfaces as a support ticket or an offhand "hasn't this gotten worse lately?" weeks later — with no way to bisect which change caused it, because nothing was measured at each step.

**Fix**
Build a golden set — even 30-50 well-chosen examples is meaningful — with real queries and either expected chunks/doc IDs for retrieval, or an answer rubric for generation. Re-run it automatically on every meaningful change and track the score over time, not just at a single point. The [cheatsheet](/learn/rag/rag-eval-cheatsheet) has a compact reference for what to put in a first golden set.

## Conflating retrieval and generation failures

### The mistake (what people actually do)
You measure a single end-to-end "is this answer good" score. When it's bad, you reach for the nearest lever — rewrite the prompt, swap in a bigger model — without ever checking whether the retrieved context actually contained the answer in the first place.

**Why it's wrong**
A RAG pipeline has at least two independent failure surfaces: retrieval can fail to surface the relevant passage, or generation can fail to use good context correctly — ignoring it, hallucinating past it, or blending it with unrelated facts. A single blended score can't tell you which one broke. Tune the prompt when retrieval was the actual problem and you'll see no improvement (there was nothing useful to work with); tune retrieval when the model was ignoring good context and you'll see the same. Either way you burn a cycle chasing the wrong fix and the real bug survives untouched.

**Symptom**
You upgrade to a noticeably stronger model expecting a clear jump in quality and see almost nothing move, because the model was never handed the right passage to begin with. Or your retrieval precision@k looks solid but the final answers are still wrong at a rate that doesn't add up.

**Fix**
Score the two stages separately. For every eval example, log what was retrieved, and label failures as either "the needed information wasn't in the retrieved context" (a retrieval problem) or "the context was there but the model got it wrong anyway" (a generation problem). Keep context-relevance and answer-faithfulness as distinct numbers, not one average. If retrieval is the recurring culprit, that usually traces back to [chunking](/learn/rag/chunking-strategies-for-documents) or the retrieval method itself — see [retrieval's own common mistakes](/learn/rag/retrieval-common-mistakes). If generation is the culprit despite good context, that's a grounding problem — see [grounding answers with citations](/learn/rag/grounding-answers-with-citations).

## Trusting an LLM judge without calibration or spot-checks

### The mistake (what people actually do)
You use an LLM as an automatic judge — "rate this answer's faithfulness 1-5" — and treat whatever number comes back as ground truth, forever, without ever checking it against a human rating on the same examples.

**Why it's wrong**
LLM judges carry documented, reproducible biases: they tend to favor longer, more confident-sounding answers regardless of correctness (verbosity bias), they can favor outputs that resemble their own family's style (self-preference), and small changes to the grading prompt or the order candidates are shown in can shift verdicts. If you never check the judge against a human, you don't actually know what a "4/5" means — you're optimizing toward the judge's specific blind spots rather than toward real quality, and you won't notice until the gap between judge score and user-perceived quality has grown wide.

**Symptom**
Judge scores climb release over release while users report no improvement — or keep filing the same complaints. Or you tweak the grading rubric's wording and the same set of answers suddenly scores noticeably differently with no change to the system itself.

**Fix**
Periodically sample judge verdicts — not once at setup, on an ongoing basis — and have a person rate the same examples independently. Compute agreement and dig into the disagreements to fix the rubric, not just note the number. Write the judge prompt with a specific, checkable criterion ("is every claim in the answer traceable to the provided context, yes/no, with the unsupported span quoted") rather than an open-ended "is this a good answer." Re-run the calibration whenever you change the judge model or the prompt — both invalidate your prior calibration. Treat the judge as a proxy you've verified, not an oracle.

## Optimizing one metric into another failure

### The mistake (what people actually do)
You chase a single number in isolation. Recall@k looks low, so you retrieve more chunks — say, moving k from 5 to 20 — and declare the retrieval problem solved once recall climbs. Or precision looks noisy, so you add an aggressive reranker or similarity threshold that filters hard, and declare victory once precision improves.

**Why it's wrong**
RAG metrics trade off against each other, and against things you may not even be measuring. Retrieving more chunks raises recall almost by definition — more candidates, more chances to include the right one — but it dilutes the context window with irrelevant text, and a bigger, noisier context increases the odds the generator hallucinates or grabs the wrong fact, plus it costs more tokens and latency, none of which shows up in a recall number. Going the other way, an overly strict [reranker](/learn/rag/reranking-retrieved-results) or threshold raises precision by discarding marginal candidates, but for a query with genuinely sparse matches it can discard the *only* relevant chunk, producing a confident "I don't know" or, worse, a fabricated answer. Tuning hard against your fixed golden set has the same shape of problem one level up: you can push its score higher while quietly regressing on the broader real query distribution it was only ever a sample of.

**Symptom**
Recall@k rises while end-to-end faithfulness or answer correctness falls. Precision improves while your "no answer found" rate spikes. Latency or token cost creeps up and nobody notices because it wasn't on the dashboard next to the metric everyone was watching.

**Fix**
Track a small set of complementary metrics side by side — retrieval recall and precision, context relevance, answer faithfulness, latency/cost, and rate of "no answer" responses — and require that a change not regress any of them past a set tolerance, not merely improve the one you targeted. Hold out a slice of queries that's never used for tuning decisions, only for a final check, so you catch overfitting to the golden set itself before it ships. If you're combining lexical and vector signals, the same tradeoff shows up in how you weight them — see [hybrid search](/learn/rag/hybrid-search-lexical-and-vector) — and reranking has its own version of this failure mode worth knowing before you reach for one, in [reranking's common mistakes](/learn/rag/reranking-common-mistakes).

## Pre-flight checklist

Before you trust a RAG eval number, check that:

- Eval queries came from real usage or a human writing cold — not generated from the same chunks they're meant to retrieve.
- A fixed golden set exists, is version-controlled, and gets re-run automatically on every change — not eyeballed per change.
- The golden set has been refreshed recently against real traffic and current documents, not left as-is since the project started.
- Retrieval quality and generation quality are scored and reported separately, not blended into one end-to-end number.
- Every retrieval failure and generation failure is bucketed by cause before you decide what to fix.
- Any LLM judge has been checked against human ratings on a sample, recently — not just once at setup — with disagreements actually reviewed.
- The judge prompt states a specific, checkable criterion, not an open-ended "is this good."
- You're watching a small dashboard of metrics together (recall, precision, faithfulness, latency/cost, no-answer rate), not optimizing one in isolation.
- A change is required not to regress the others past a set tolerance, not just to improve the target metric.
- A holdout slice, untouched by tuning decisions, confirms gains generalize before you ship.

**Related:** [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [RAG Evaluation: Worked Example](/learn/rag/rag-eval-worked-example) · [RAG Evaluation Cheatsheet](/learn/rag/rag-eval-cheatsheet) · [Retrieval Common Mistakes](/learn/rag/retrieval-common-mistakes) · [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) · [Reranking Common Mistakes](/learn/rag/reranking-common-mistakes)
