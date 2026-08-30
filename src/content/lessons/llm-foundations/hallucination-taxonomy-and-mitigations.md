---
title: "A Hallucination Taxonomy and Its Mitigations"
track: "llm-foundations"
status: live
summary: "Four hallucination shapes, why RLHF worsens overconfidence, and what retrieval, abstention training, and self-verification each actually fix."
duration: "8 min read"
---

"The model hallucinated" covers at least four mechanistically different failures. Lumping them together is why "just add RAG" fixes some hallucinations and does nothing for others.

> **Optional depth.** [Why LLMs hallucinate](/learn/llm-foundations/why-llms-hallucinate) covers the single root mechanism — no reject option in the training objective. This page classifies the shapes that mechanism produces and goes deeper on what each mitigation does and doesn't reach.

## A taxonomy

| Type | What's actually wrong | Example | Root cause |
|---|---|---|---|
| **Intrinsic factual fabrication** | A claim about the world that's simply false, with no input to have contradicted | "The Eiffel Tower was completed in 1911" (it was 1889) | Sparse or absent training support for the specific fact — see [why LLMs hallucinate](/learn/llm-foundations/why-llms-hallucinate) |
| **Unfaithfulness to a provided source** | Output contradicts or isn't supported by source text sitting right there in context | Summarizing a document that says a trial found "no significant effect" as "the trial confirmed a significant effect" | An attention/grounding failure, not a knowledge gap — the correct answer was available and got dropped or inverted anyway |
| **Fabricated citations and references** | A real-shaped but nonexistent source: author, title, journal, page numbers | A fully-detailed citation for a paper that was never written | A special case of factual fabrication that exploits citation formatting's extremely high fluency density in training data |
| **Unfaithful reasoning (CoT)** | The stated reasoning trace doesn't match what actually produced the answer | A chain of thought that "checks" an answer with steps that don't logically justify it | Generation is a narration produced under the same causal, next-token mechanism as the answer — not a transcript of an internal audit; see [chain of thought and test-time compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute) |

The first and third rows share a root cause (missing knowledge) but differ in *why they're worth separating*: a fabricated citation is dangerous specifically because citation format is one of the highest-fluency-density patterns in the training distribution, so it gets nailed even when the content is invented — making it look more trustworthy than an equally fabricated claim stated in plain prose. The second and fourth rows are structurally different from the first two: the model isn't missing information, it's failing to faithfully use information it already has or already generated.

## Why RLHF can make overconfidence worse

[RLHF's reward model](/learn/llm-foundations/rlhf-reward-models-and-ppo) is trained on human preference judgments between candidate responses. Raters, on average, tend to rate a complete, confident-sounding answer higher than a hedged one — even when the hedge is the more honest response — because a hedge reads as less helpful in the moment a rater is scoring it, independent of whether it's actually more accurate. That preference gets baked into the learned reward model, and then policy optimization pushes the model's outputs toward whatever the reward model scores highest. The result is a systematic pressure in the *opposite* direction from what honesty about uncertainty requires: pretraining leaves a real signal behind (a flatter, lower-confidence token distribution in sparse regions, as covered in [why LLMs hallucinate](/learn/llm-foundations/why-llms-hallucinate)), and preference-based fine-tuning can actively train the model to paper over that signal with confident phrasing, because confident phrasing is what got rewarded during training regardless of the underlying certainty. This is a specific, well-documented instance of the broader pattern covered in [alignment tax, reward hacking, and sycophancy](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy): optimizing hard against a learned proxy for "good answer" can degrade a property (calibrated honesty) the proxy never explicitly measured.

## Mitigation 1: retrieval grounding

Retrieval-augmented generation attacks the *intrinsic fabrication* row directly: instead of generating purely from parametric memory, an embedding-based search over a document store (see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity)) pulls in real source text at query time, and the model conditions its generation on that retrieved passage rather than filling the gap from a sparse region of its training distribution. This is the closest of the three mitigations to patching the actual root cause identified above — it changes the *input*, so the same next-token mechanism now has real facts to condition on instead of a gap to plausibly fill.

What it doesn't fix: unfaithfulness. Putting a correct passage in context doesn't guarantee the model reports it faithfully — the *unfaithfulness-to-source* row can still happen on top of perfect retrieval, because the underlying generation mechanism (attend over context, predict the fluent next token) hasn't changed, only its input has improved. Retrieval also does nothing for questions outside the corpus, and a retrieval miss or an irrelevant hit can itself become the source material for a confidently-stated wrong answer.

## Mitigation 2: abstention training

This is the mitigation that adds something pretraining structurally lacks: a rewarded pathway to "I don't know" or "I can't verify this from what I have." Concretely, this means constructing training examples where the correct target response is an explicit refusal or hedge — questions with no reliable answer, or questions just outside a stated knowledge boundary — and training against those examples the same way any other supervised or preference target is trained against, so that abstaining stops being a strategy the model has zero gradient signal to reinforce and starts being one it's explicitly rewarded for choosing correctly.

The limit is upstream: to reward correct refusals, you need to know at training time which questions the model genuinely can't answer reliably — a labeling problem that's hard for essentially the same reason the original problem is hard. In practice this gets approximated with proxies (question type, known knowledge-cutoff boundaries, self-consistency signals from resampling), which is why abstention-trained models both over-refuse things they actually know and still confidently fabricate on questions that don't match the proxy pattern used to build the training set.

## Mitigation 3: self-verification

Where abstention training changes the model, self-verification changes the *procedure* around a fixed model, spending extra inference compute to check a draft against itself. One concrete form, chain-of-verification (Dhuliawala et al., 2023): generate a draft answer, then generate a set of independent verification questions targeting the draft's specific claims, answer each verification question separately (so the answer isn't contaminated by having already committed to the draft), and revise the draft wherever a verification answer contradicts it. A simpler, cheaper form: resample the same claim at nonzero temperature several times and check whether the specific fact holds steady — a claim the model has real support for tends not to move much across resamples, while a fabricated specific, freshly reconstructed from a flatter distribution each time, tends to drift.

What it doesn't fix: self-verification uses the same underlying model and the same mechanism to do the checking, so it inherits the checker's own blind spots — a fact the model is confidently wrong about tends to get confidently re-confirmed rather than caught, because the verification step has no more access to ground truth than the original generation did. It's most useful for catching the *unstable*, sparse-region fabrications described in [why LLMs hallucinate](/learn/llm-foundations/why-llms-hallucinate), and least useful for catching a wrong "fact" the model holds with genuine, consistent (but incorrect) conviction.

## What none of these fully solve

All three mitigations are scaffolding around an unchanged generation mechanism, not a fix to the mechanism itself. Retrieval supplies better inputs; abstention training adds a rewarded exit ramp; self-verification spends more inference compute checking the model's own output with the model's own judgment. Combining them narrows the failure surface — grounding plus abstention plus a resampling check catches more than any one alone — but each still fails exactly where its own blind spot sits: retrieval on corpus gaps, abstention on unlabeled unknowns, self-verification on confidently-and-consistently-wrong beliefs. Treat "we added RAG" or "we added a verification pass" as a claim about *which* hallucination types got rarer, not a claim that hallucination stopped.

**Related:** [Why LLMs Hallucinate](/learn/llm-foundations/why-llms-hallucinate), [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity), [Alignment Tax, Reward Hacking, and Sycophancy](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy), [RLHF, Reward Models, and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [Chain of Thought and Test-Time Compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute)
