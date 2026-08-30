---
title: "Selection and Ordering Quiz"
track: "context-engineering"
status: live
summary: "Twelve scenario questions on relevance filtering, the U-shaped curve, recency/primacy, and delimiter choice."
duration: "9 min read"
---

Twelve questions, all scenario-based. Each one asks you to apply a rule from this module rather than recall a definition.

## 1. Comparing two candidate chunks

Two retrieved chunks are being scored for inclusion. Chunk A is 92% relevant and 500 tokens. Chunk B is 78% relevant and 60 tokens. Both clear your relevance floor. Using the value-per-token heuristic, which is the stronger candidate purely on that measure?

A. Chunk A, because 92% is a higher absolute relevance score.
B. Chunk B, because its relevance-per-token (0.78/60 ≈ 0.013) is far higher than Chunk A's (0.92/500 ≈ 0.0018).
C. They're equal, since both cleared the relevance floor.
D. Chunk A, because longer chunks always carry more total information.

<details><summary>Answer</summary>

**Correct: B.** [The Include-or-Cut Decision](/learn/context-engineering/what-to-include-vs-what-to-cut) scores candidates by relevance divided by token cost, not by relevance alone — Chunk B delivers roughly seven times the relevance per token spent, even though its raw score is lower.

**A** is exactly the mistake the heuristic is built to correct — a higher raw score can still be a worse use of budget once token cost is factored in.

**C** ignores that clearing a floor is a pass/fail gate, not a tie-breaker — value-per-token is what ranks candidates that both passed.

**D** assumes length correlates with value, which the heuristic explicitly denies — a long chunk pays a real cost in tokens and attention regardless of how much of that length is actually useful.

</details>

## 2. A top-8 that still underperforms

A pipeline retrieves the top 8 chunks by similarity score for a policy question. All 8 individually clear a relevance threshold. The final answer is still weak. Inspecting the 8, three of them restate the same policy in slightly different wording. What's the most likely fix?

A. Increase the similarity threshold so fewer, higher-scoring chunks are admitted.
B. Add a redundancy pass that drops near-duplicate chunks after relevance scoring, keeping the highest-ranked of each duplicate cluster.
C. Retrieve more chunks so the signal has a better chance of winning out.
D. Switch the embedding model, since the current one is clearly broken.

<details><summary>Answer</summary>

**Correct: B.** This is the exact gap [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth) targets — a naive top-k by similarity keeps near-duplicates because each one independently clears the bar; only a pairwise redundancy check catches that three slots are one idea repeated.

**A** would remove weak candidates but wouldn't catch three chunks that are each genuinely, individually relevant — the problem here isn't low relevance, it's overlap between relevant chunks.

**C** compounds the actual problem — more chunks without a redundancy check means more opportunities for duplication, not less, and adds more competing content per [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context).

**D** jumps to the most drastic fix without evidence — nothing in the symptom (near-duplicate content correctly scoring high) indicates the embedding model is malfunctioning; it's behaving exactly as expected.

</details>

## 3. Spare context budget

A team argues: "we have 150K tokens of window and we're only using 20K, so there's no cost to retrieving 10 more marginal chunks just in case." What's wrong with that reasoning?

A. Nothing — if the tokens fit under the limit, there's no cost to including them.
B. Token budget and attention quality are different resources; marginal chunks still compete for the model's attention even when the window has spare capacity.
C. It's wrong only because it will increase latency, not because of any accuracy concern.
D. It's wrong only for models with small context windows; large-window models are immune to this effect.

<details><summary>Answer</summary>

**Correct: B.** [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context) makes exactly this distinction — having spare token budget doesn't mean spare quality, because every additional passage, however cheap, is competing for the same limited attention as the content that actually matters.

**A** is the fallacy the lesson is built to correct — "it fits" answers a budget question, not an attention-quality question, and the two are independent.

**C** understates the concern — latency is a real cost too, but the lesson's core claim is specifically about accuracy degrading from diluted attention, not just slower responses.

**D** overclaims immunity — large windows can widen the safe zone but the underlying dilution effect isn't eliminated by window size, as [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained) shows even for models marketed on huge windows.

</details>

## 4. Why the middle underperforms

A colleague says the "lost in the middle" effect means the model literally can't see tokens in the middle of a long context. What's the more accurate explanation?

A. Middle tokens are silently truncated by the tokenizer before the model ever processes them.
B. The model processes all tokens, but causal attention structurally privileges early tokens (seen by every later token) and late tokens (closest to generation), leaving middle tokens comparatively less reinforced.
C. Middle tokens are randomly dropped during training to save compute.
D. The effect is a training bug specific to one model family and doesn't generalize.

<details><summary>Answer</summary>

**Correct: B.** [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained) grounds the effect in attention mechanics, not a literal blind spot — early positions get reinforced by every later token attending back to them, and late positions benefit from proximity to generation, leaving the middle with neither structural advantage.

**A** invents a mechanism (silent truncation) that isn't what's happening — the tokens are present and processed; they're just weighted less.

**C** also invents a false mechanism — nothing about training involves randomly dropping middle tokens; the effect comes from learned attention patterns, not data loss.

**D** understates how broadly the pattern shows up — it appears across model families and context lengths, even if its exact depth and width vary, which is why it's worth measuring directly per [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle) rather than assuming it's model-specific.

</details>

## 5. Distinguishing primacy from recency

An agent's system prompt sets a rule at session start. Forty turns later, the agent violates that rule. Which explanation correctly distinguishes primacy from recency?

A. The system prompt was silently deleted from context somewhere around turn 20.
B. Primacy still gives the system prompt a structural edge from its early position, but forty turns of more-recent content now compete for the same attention, and recency's pull has grown enough to outweigh it.
C. Recency and primacy are the same effect described with two different names.
D. The model has a fixed memory limit of roughly twenty turns, after which earlier content stops mattering entirely.

<details><summary>Answer</summary>

**Correct: B.** [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects) is explicit that this isn't primacy fading — the system prompt's structural advantage from position is unchanged. What changes is the ratio: forty turns of intervening, more-recent content increasingly outweighs it in the attention competition.

**A** assumes deletion, which contradicts the premise — the instruction is still present in context; this is a dilution failure, not a truncation failure, and the two need different fixes.

**C** collapses a real distinction the lesson draws carefully — primacy and recency are two separate structural advantages that happen to point the same way in short sessions and diverge in long ones.

**D** invents a hard cutoff that doesn't reflect how the effect actually works — it's a gradual, competitive dilution, not a fixed-turn memory wall.

</details>

## 6. Placing the critical fact — a scenario

You're assembling context for a question that depends on exactly one fact buried in one of six retrieved documents: the customer's negotiated discount rate, which overrides the standard pricing everyone else sees. The other five documents are general, lower-stakes background (shipping info, general FAQ, etc.). Where should the discount-rate document go in the assembled context?

A. Wherever the retriever ranked it internally — reordering isn't necessary if the content is present.
B. In the exact middle of the six documents, since that's the most "neutral" position.
C. At the very start or very end of the assembled context — the two positions with the strongest recall — not left in the middle regardless of retrieval rank.
D. It doesn't matter, since the fact is short and short facts aren't affected by position.

<details><summary>Answer</summary>

**Correct: C.** This is the direct payoff of [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention): with one decision-critical fact and several lower-stakes supporting documents, the critical one should be forced to an edge position, and the supporting documents can safely absorb the weaker middle position instead.

**A** is the exact failure [Selection and Ordering Mistakes](/learn/context-engineering/relevance-filtering-common-mistakes) calls out — raw retrieval order has no relationship to where content should sit for the model's attention, and it can easily leave the one critical document at the worst position by accident.

**B** picks precisely the position [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained) shows has the weakest recall — "neutral" here actually means "worst," not safest.

**D** is false — the positional effect is about where a fact sits relative to the sequence, not how many tokens it takes up; a short fact in the middle is just as vulnerable as a long one.

</details>

## 7. A flawed needle-in-a-haystack test

You run a needle-in-a-haystack experiment to measure your own model's position sensitivity. Your needle fact is "the meeting was held in Paris." The model gets it right at every position you test, including deep in the middle, with no dip in recall at all. What should you check before concluding your pipeline is immune to the effect?

A. Nothing — a flat, high recall curve at every position is conclusive proof of immunity.
B. Whether "Paris" is a guessable, plausible answer the model could produce from general world knowledge or context clues, independent of whether it actually read the needle.
C. Whether the plot was rendered in the correct color scheme.
D. Whether the haystack filler was written in the same programming language as the pipeline.

<details><summary>Answer</summary>

**Correct: B.** [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle) flags exactly this trap — a needle that's guessable from world knowledge or plausible surrounding context produces a "hit" whether or not the model actually retrieved it from the haystack, which can flatten your curve for the wrong reason. An arbitrary, made-up identifier with no prior plausibility is the fix.

**A** takes the flat curve at face value without ruling out the confound — a genuinely uninformative test can produce a misleadingly flat result.

**C** and **D** aren't relevant to whether the test result is valid — visual styling and filler's programming language (haystack filler is prose, not code, in this test) have no bearing on whether the needle content is actually what drove a correct answer.

</details>

## 8. Diagnosing an unciteable answer

A RAG pipeline retrieves five documents, concatenates them as raw text with no separators, and asks the model to answer and cite its source. The answer is plausible but the citation is wrong. What's the most direct fix?

A. Ask the model to try harder to remember which document it used.
B. Wrap each document in a labeled, bounded block with a stable ID, and instruct the model to cite by that ID.
C. Reduce the number of documents to one, eliminating the need for citation entirely.
D. Switch to a larger model, since citation accuracy is purely a function of model size.

<details><summary>Answer</summary>

**Correct: B.** [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns) fixes exactly this failure mode — an undifferentiated concatenation gives the model no handle to reference a specific source; a bounded block with an ID makes "cite doc_3" a checkable, unambiguous instruction.

**A** treats this as a recall problem when it's a scaffolding problem — the model has no structural way to distinguish sources, no amount of "trying harder" changes that.

**C** avoids the symptom by removing the use case rather than fixing the underlying pipeline, which still needs multi-document citation to work for other queries.

**D** misattributes the cause — a bigger model can't invent document boundaries that were never marked in the input; this is a formatting problem, not a capability problem.

</details>

## 9. Choosing a delimiter format

Your prompt-assembly code already holds retrieved documents as a list of Python dicts (with `id`, `source`, and `text` fields) and needs to hand them to the model as part of a larger programmatically-built prompt. No human will read the raw prompt text. Which format fits best by default?

A. XML tags, because XML is always the safest choice regardless of context.
B. JSON, since the data already exists as objects and serializing them avoids hand-formatting a string.
C. Markdown headers, since they're the easiest for a human to read.
D. A plain `===` delimiter string, since it's the cheapest option token-wise.

<details><summary>Answer</summary>

**Correct: B.** [XML vs Markdown vs JSON Delimiters](/learn/context-engineering/xml-vs-markdown-vs-json-delimiting) calls out this exact case — when a prompt is assembled by code from data that already exists as objects, JSON serialization is the natural fit and avoids the escaping and formatting risk of hand-building a string in another format.

**A** overstates a real strength into a blanket rule — XML earns its place for untrusted content needing a hard boundary, but that's not the deciding factor here; the deciding factor is that the data is already object-shaped.

**C** picks the format optimized for human readability in a scenario the question explicitly says has no human reader of the raw prompt — that advantage doesn't apply here.

**D** picks the cheapest option without weighing its weakest boundary — for a mostly-trusted, code-assembled payload the concern isn't cost, it's that this format has no field structure for the id/source/text pairs already in your data.

</details>

## 10. Fixing dropped adherence over a long run

An agent reliably follows a "confirm before deleting" rule for the first ten turns of a session, then stops following it around turn twenty, even though the rule is still present in the system prompt on every call. What's the most targeted fix?

A. Rewrite the system prompt to be even longer and more emphatic.
B. Conditionally restate the rule right before any turn that looks like it's about to trigger a destructive action, so it benefits from recency near the point of generation.
C. Shorten the session to under ten turns so the rule never has a chance to be forgotten.
D. Repeat the entire system prompt after every single turn, regardless of content.

<details><summary>Answer</summary>

**Correct: B.** [Placing Instructions So They Stick](/learn/context-engineering/placing-instructions-for-adherence) shows this exact fix — a conditional restatement right before the risky action gives the rule fresh recency benefit exactly where it's needed, without diluting every other turn with an unrelated reminder.

**A** targets wording strength when the actual problem is positional — a longer, more emphatic instruction at the same early position still loses the same recency competition as the transcript grows.

**C** avoids the problem rather than solving it, and isn't viable for any agent that legitimately needs long sessions.

**D** is the over-restatement failure the same lesson warns about — reminding on every turn regardless of relevance dilutes the reminder's own signal, per [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context).

</details>

## 11. What reranking alone can't do

A pipeline reranks ten retrieved candidates and hands the top 5, in reranked order, to the model. On one particular query, none of the ten candidates are actually relevant — the retriever simply had nothing good to return. What does reranking alone fail to catch here?

A. Nothing — reranking always guarantees the top results are good enough to use.
B. Reranking only produces an ordering among the candidates it's given; it has no mechanism to reject a candidate set that's uniformly bad, which is a filtering job.
C. This can only happen if the reranker model itself is broken.
D. Reranking and filtering are the same operation, so this scenario is impossible by definition.

<details><summary>Answer</summary>

**Correct: B.** [Filtering vs Reranking](/learn/context-engineering/filtering-vs-reranking) draws exactly this line — reranking answers "which is more relevant than which" and will confidently order even a uniformly bad candidate set from least-bad to most-bad, because rejecting candidates outright was never its job. Only a filtering step with a threshold can say "none of these clear the bar."

**A** states the false assumption the question is designed to surface — reranking says nothing about absolute quality, only relative order within the set it's given.

**C** misdiagnoses working-as-intended behavior as a bug — a reranker correctly ordering ten irrelevant documents is doing exactly what reranking is supposed to do; the gap is the missing filter step.

**D** denies a real, load-bearing distinction the lesson builds from the ground up — they consume similar inputs but answer structurally different questions.

</details>

## 12. Multi-fact placement under a tight budget

You have three facts a correct answer depends on (from three different retrieved documents) and five lower-value supporting documents, and a token budget that only comfortably fits six of the eight total. What's the correct combination of decisions, applying this whole module?

A. Keep all eight to be safe, and don't worry about order since the content is all technically relevant.
B. Cut down to the highest value-per-token documents first (likely all three critical ones plus the best two supporting ones), then place the three critical documents at the head and tail positions, leaving only supporting content in the middle.
C. Keep only the three critical documents and discard all supporting context, regardless of whether any of it adds real value.
D. Keep all eight, but only worry about ordering if the answer comes back wrong.

<details><summary>Answer</summary>

**Correct: B.** This combines the module end to end: [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut) says cut by value-per-token under a real budget rather than force everything in, and [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) says the survivors that are actually decision-critical belong at the edges, not the middle — leaving weaker supporting content to absorb the weakest recall position.

**A** ignores the stated budget constraint entirely and repeats the "spare room means no cost" fallacy corrected in [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context) — and even if it fit, raw retrieval order would still risk burying a critical fact in the middle.

**C** overcorrects — discarding all supporting context isn't required by the budget given (six documents fit) and throws away potentially useful material the value-per-token heuristic might actually have kept.

**D** treats ordering as an optional afterthought to be tried only after a failure, when it's a first-pass design decision — waiting for a wrong answer to diagnose a placement problem is far more expensive than placing correctly the first time.

</details>

## If a question tripped you up, go here first

- **Missed Q1 or Q2** (value-per-token, redundancy): [The Include-or-Cut Decision](/learn/context-engineering/what-to-include-vs-what-to-cut), [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth).
- **Missed Q3 or Q4** (signal-to-noise, the U-curve mechanism): [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context), [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained).
- **Missed Q5 or Q10** (primacy vs. recency, restating instructions): [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects), [Placing Instructions So They Stick](/learn/context-engineering/placing-instructions-for-adherence).
- **Missed Q6 or Q7** (placement scenario, testing your own setup): [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention), [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle).
- **Missed Q8 or Q9** (structure and delimiters): [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns), [XML vs Markdown vs JSON Delimiters](/learn/context-engineering/xml-vs-markdown-vs-json-delimiting).
- **Missed Q11 or Q12** (filtering vs. reranking, combining it all): [Filtering vs Reranking](/learn/context-engineering/filtering-vs-reranking), [Selection and Ordering Cheatsheet](/learn/context-engineering/selection-and-ordering-cheatsheet).

If all twelve felt clear, you have the full picture this module builds: decide what earns a place, then decide where it goes — neither step optional, neither one a substitute for the other.

**Related:** [Selection and Ordering Cheatsheet](/learn/context-engineering/selection-and-ordering-cheatsheet), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention), [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained), [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth), [Filtering vs Reranking](/learn/context-engineering/filtering-vs-reranking)
