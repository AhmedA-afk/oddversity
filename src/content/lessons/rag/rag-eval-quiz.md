---
title: "RAG Evaluation: Check Yourself"
track: "rag"
status: live
summary: "Six MCQs that test whether you can tell faithfulness, relevance, and context recall apart, and pinpoint where a RAG answer actually broke."
duration: "7 min read"
---

You can watch three eval numbers move in the same dashboard for months without ever being tested on whether you know what moved them. This quiz is that test — six scenarios built from the confusions that actually trip people up once they start running evals for real, not the definitions themselves. If you haven't read [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) yet, do that first; this page assumes you already know what faithfulness, answer relevance, and context recall measure and pokes at where that knowledge gets shaky.

## 1. The answer that's helpful and wrong

Your RAG system retrieves a chunk about your company's vacation policy. A user asks how many PTO days they get. The model's answer is on-topic, well-written, directly addresses the question — and states a specific number of days that appears nowhere in the retrieved chunk (it looks like the model filled the gap from general knowledge about "typical" PTO). Which metric catches this, and which one looks fine?

- **A.** Faithfulness will look fine (the answer is coherent and well-formed); relevance will flag it.
- **B.** Faithfulness will flag it (the claim isn't grounded in the retrieved context); relevance will look fine, maybe even great.
- **C.** Both will flag it — an ungrounded claim is inherently irrelevant, so they move together here.
- **D.** Neither catches this — it's a retrieval problem, and retrieval-stage metrics are the only ones that can see it.

<details><summary>Answer</summary>

**Correct: B.** Faithfulness checks whether every claim in the answer is entailed by the retrieved context — the PTO number isn't there, so it fails, even though the answer is fluent and directly on-topic. Relevance, by contrast, is scored against how well the answer addresses the question, not whether it's grounded — a confident invented number that answers the question well scores *high* on relevance. This exact split (high relevance, low faithfulness) is the signature of confident hallucination, and it's the reason you track both rather than picking one. See [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) for how forcing citations makes this failure visible to users, not just to your eval.

**A** has the two metrics backwards — coherence isn't grounding, and grounding isn't the same as answering the question. **C** feels right (ungrounded feels bad in every sense) but relevance is computed independent of the source context; it only asks "does this answer the question," so it can stay high while faithfulness craters. That gap is the whole point of measuring both. **D** is wrong because faithfulness is precisely an answer-level metric built for this — you don't need to re-inspect retrieval to catch it, just check the answer's claims against what was actually retrieved for that call.

</details>

## 2. High recall, unhappy users

Context recall on your eval set comes back around 0.95 — the retrieved chunks contain almost everything your golden references say they need. But users keep complaining the model "missed the point" or answered a slightly different question than they asked. What does this combination most likely tell you?

- **A.** Context recall is a generation-time metric, so this is a contradiction — go recheck your golden set for errors.
- **B.** The necessary information is being retrieved, so the problem more likely sits in generation (the model not using the right chunk well) or in ranking/noise (the right chunk is buried among a lot of irrelevant ones) — not in retrieval coverage.
- **C.** High context recall implies faithfulness must also be high, so the complaints must purely be about relevance.
- **D.** Context recall can't be computed without a golden set, so this scenario — production complaints alongside an offline number — can't actually happen.

<details><summary>Answer</summary>

**Correct: B.** Context recall answers one narrow question: "did we retrieve the information the reference answer needed?" It says nothing about ranking order, how much irrelevant material surrounds the good chunk, or what the generator actually did with it. High recall plus bad answers is a strong hint to look downstream — either the generator is drowning the right chunk in noise (a job for [reranking](/learn/rag/reranking-retrieved-results)) or it's attending to the wrong part of a long context window. Walking a concrete case through this split is exactly what the [RAG eval worked example](/learn/rag/rag-eval-worked-example) does.

**A** invents a contradiction that isn't there — context recall is a retrieval-stage metric computed against a reference, and nothing about it being high while generation struggles is inconsistent. **C** assumes a link between metrics that doesn't exist: faithfulness measures grounding of the *answer's claims*, context recall measures *coverage* of what got retrieved — one being high tells you nothing about the other. **D** has a kernel of truth (recall does need a golden reference, so it's usually an offline number) but the conclusion is wrong — that's exactly why offline scores and live user complaints can diverge: they're measuring different things at different times, not something impossible.

## 3. The golden set that grades itself

A team builds their golden set by taking 200 passages from the knowledge base, asking GPT-4 to write a question each passage answers, then asking GPT-4 again to write the "ideal answer." Every eval run comes back with strong scores. They ship, and the complaints roll in about wrong answers. What's the most likely explanation?

- **A.** Questions generated straight from a passage tend to mirror that passage's own wording, so they're easier to retrieve for than real user queries — the golden set systematically overstates how well retrieval handles vocabulary mismatch, ambiguity, and multi-hop questions real users actually send.
- **B.** GPT-4 can't reliably generate valid questions from a passage, so the scores are essentially noise.
- **C.** The real flaw is using GPT-4 anywhere in the loop — an LLM anywhere in an eval pipeline invalidates it.
- **D.** The golden set is fine; since it passed every offline eval, the bug is almost certainly something production-only, like a stale index or a broken embedding deploy.

<details><summary>Answer</summary>

**Correct: A.** This is the classic "golden set doesn't match the production distribution" trap. A question generated by round-tripping through the same passage tends to share vocabulary and structure with that passage — near word-for-word overlap makes retrieval look artificially easy. Real users paraphrase, misspell, ask compound or out-of-scope questions, and use words the source document never uses. A golden set built this way measures how well you retrieve for *easy* queries, not the ones that will actually break you. See [common RAG eval mistakes](/learn/rag/rag-eval-common-mistakes) for more of this family of trap.

**B** overstates it — GPT-4 can generate serviceable questions; the problem isn't capability, it's that the questions it defaults to are systematically more literal than real ones. **C** is too absolute: LLM-generated eval data and LLM-as-judge are both legitimate and widely used tools. The actual issue here is narrower — generating the question, matching it to its source, and grading the answer all in one closed loop with the same style of model, which never encounters what breaks in the wild. **D** jumps to a separate root cause when a well-known, specific bias sits right there in the eval construction — always check the more obvious explanation before assuming an unrelated outage.

</details>

## 4. The judge that likes its own kind

You use an LLM as a judge to score faithfulness. Over time you notice it consistently rates answers from your production model higher than equivalent answers from a different vendor's model — even when a human reading both blind calls them equally well-grounded. What's happening, and what do you do about it?

- **A.** This is expected and fine — a judge naturally understands the style of models in its own family, so higher scores there are reasonable.
- **B.** This is self-preference bias — LLM judges tend to rate outputs from their own model family more favorably. Mitigate by using a judge from a different model family than whatever you're evaluating, and periodically spot-check its scores against human review.
- **C.** This proves LLM judges can't be trusted for faithfulness at all — switch to a purely reference-based, non-LLM metric instead.
- **D.** This means your golden set questions are too easy; harder questions would remove the bias.

<details><summary>Answer</summary>

**Correct: B.** Self-preference (or self-enhancement) bias in LLM judges is a documented, specific failure mode — it's a property of the judge, not the questions. The practical fix is boring but effective: use a judge from a different model family than the systems under test, and don't fully trust even that judge without periodic human spot-checks to catch drift or new blind spots.

**A** just relabels a measurement bias as a feature — "understanding style" isn't the same as accurately assessing whether a claim is grounded, and a biased instrument is biased regardless of the story attached to it. **C** overcorrects: faithfulness checking (is this claim entailed by that context) is one of the tasks LLM judges are actually decent at, closely related to natural-language-inference scoring — the fix is judge selection and calibration, not abandoning the approach. **D** doesn't follow — question difficulty has no mechanical relationship to a judge systematically favoring one vendor's phrasing over another's; that's about the judge, not the eval set.

</details>

## 5. Where did it actually break

A user gets a wrong answer. You want to know — before you spend a week tuning something — whether this was a retrieval failure or a generation failure. What's the single most direct diagnostic step?

- **A.** Re-run the same query through a bigger, more expensive model and see if the answer improves; if it does, call it a generation problem.
- **B.** Pull up the actual chunks that were retrieved and passed to the model for that specific call, and check whether the information needed to answer correctly is in there. If it's absent, that's a retrieval failure. If it's present and the answer is still wrong, that's a generation failure.
- **C.** Check the faithfulness score for that answer — a low score always means retrieval failed.
- **D.** Re-run your whole eval suite and see whether the aggregate numbers dropped; a single wrong answer can't be diagnosed on its own.

<details><summary>Answer</summary>

**Correct: B.** This is the actual split: go look at what was retrieved for that call and ask whether the answer was findable in it. That one inspection tells you which stage to go fix, which is why good tracing that logs the exact chunks passed to the generator (not just the final answer) pays for itself the first time something goes wrong.

**A** can be suggestive but it's indirect and can mislead you: a bigger model might "fix" the answer by leaning on its own parametric knowledge to paper over a genuine gap in the retrieved context, which looks like "generation problem solved" while masking a retrieval failure that will resurface on a question the model doesn't happen to know. **C** conflates two things — a low faithfulness score means the answer's claims aren't grounded in the context it *was* given, which could be a generation issue (model ignoring good context) or still trace back to retrieval (context was wrong or insufficient in the first place). The score alone doesn't tell you which; you still have to look. **D** is unnecessary overkill — you don't need to re-run a whole suite to diagnose one example when the trace for that single call already contains everything you need.

</details>

## 6. Reading three numbers at once

Last month's baseline versus this month's eval run: context recall dropped from about 0.90 to about 0.65, faithfulness held roughly steady around 0.95, and answer relevance dropped from about 0.85 to about 0.55. What's the most coherent explanation, and where do you look first?

- **A.** Faithfulness holding steady while the others drop suggests a full-stack collapse — the fastest fix is swapping to a stronger generation model.
- **B.** This pattern — recall down sharply, faithfulness flat, relevance down — points to a retrieval regression: the generator is still faithfully grounding to whatever it's handed, but with less of the necessary material retrieved, its answers land as generic, partial, or slightly off-target. Check what changed upstream (index rebuild, embedding model version, chunking change, a new filter) before touching the prompt or the model.
- **C.** The relevance drop is the real, independent signal — go investigate the relevance judge itself, since faithfulness and recall look unaffected by whatever's actually broken.
- **D.** Context recall needs a golden set and can drift for reasons unrelated to production quality — treat the recall number as noise and trust faithfulness and relevance instead.

<details><summary>Answer</summary>

**Correct: B.** One root cause explains both symptoms: retrieval is bringing back less of what's needed (recall drop), the generator is still behaving reasonably given what it gets (faithfulness holds — it's not fabricating, it's just under-resourced), and the resulting answers are less on-target because they're built from thinner material (relevance follows recall down). That's a retrieval-stage regression, and the fix is to look at whatever changed in the retrieval path — a re-index, an embedding model swap (see [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) for what changes when you touch that layer), a chunking change, or an overly aggressive filter — not the prompt or the generator.

**A** is backwards: flat faithfulness is *evidence the generator is fine*, not evidence of collapse, and swapping models would burn a cycle without touching the actual regression — worse, a stronger model might mask it by compensating with parametric knowledge. **C** ignores the coherent causal chain in favor of treating one number as an isolated bug; when a relevance drop lines up numerically with a recall drop while faithfulness is untouched, the simpler explanation (one root cause, two symptoms) beats inventing a second, unrelated failure in the judge itself. **D** hand-waves away the largest, most specific number in the set — a 0.90-to-0.65 move is a big, structured signal, not noise, and dismissing it is how retrieval regressions ship unnoticed for weeks. Keep a short reference like the [RAG eval cheatsheet](/learn/rag/rag-eval-cheatsheet) nearby for exactly this kind of triage.

</details>

## The pattern underneath all six

Every one of these traps comes from treating eval numbers as a single "health score" instead of a set of independent instruments, each pointed at a different failure. Faithfulness looks at the answer against the context. Relevance looks at the answer against the question. Context recall looks at what got retrieved against what should have been retrieved. They can move independently, and when they move *together* in a particular pattern, that pattern is usually more informative than any one number alone — as long as you resist the urge to read them as interchangeable "goodness" and instead ask, for each one, exactly what it can and can't see.

**Related:** [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [RAG Eval Worked Example](/learn/rag/rag-eval-worked-example) · [Common RAG Eval Mistakes](/learn/rag/rag-eval-common-mistakes) · [RAG Eval Cheatsheet](/learn/rag/rag-eval-cheatsheet) · [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations)
