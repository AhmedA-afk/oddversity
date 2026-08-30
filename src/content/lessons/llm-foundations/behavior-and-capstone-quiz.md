---
title: "Quiz: Behavior, Capabilities, and Limits"
track: "llm-foundations"
status: live
summary: "Eight questions across scaling laws, emergence, in-context learning, test-time compute, hallucination, and multimodal fusion."
duration: "9 min read"
---

Eight questions spanning this module. Pick an answer and reason it through before opening each one — the distractors are built to look right for a specific, common reason.

## 1. The compute-optimal split

You have a fixed training budget of `C` FLOPs, and you're using `C ≈ 6ND` with a Chinchilla-style compute-optimal ratio of `D ≈ 20N`. A colleague proposes doubling the parameter count `N` while holding `C` fixed. What happens to `D`?

- **A.** `D` stays the same — parameters and tokens are independent choices.
- **B.** `D` roughly halves, and the model moves further from the 20:1 ratio, toward undertrained.
- **C.** `D` roughly doubles, keeping the model compute-optimal.
- **D.** `D` is unaffected as long as `N` is still "large enough."

<details><summary>Answer</summary>

**Correct: B.** From `C = 6ND`, `D = C / (6N)`. Doubling `N` at fixed `C` roughly halves `D` — the model now needs about 10 tokens per parameter's worth of headroom to stay optimal but only gets about half its previous token budget, moving it toward the undertrained side of the ratio, exactly the mechanism the worked training-run example in this module walks through with real numbers. **A** ignores that `C = 6ND` links the two directly once `C` is fixed. **C** has the direction backwards — more `N` at fixed `C` leaves less room for `D`, not more. **D** treats "large enough" as if scale alone guarantees good training; the ratio to data, not raw size, is what determines whether the model can use its own capacity.

</details>

## 2. Reading the loss curve

A scaling-law fit predicts loss will fall from 2.9 to 2.4 as you 10x your compute budget, and it does, right on schedule. A specific downstream benchmark that requires getting a 6-step instruction exactly right, however, sits at 2% success both before and after — no visible improvement. What's the most defensible conclusion?

- **A.** The scaling law is wrong — a real improvement in loss should show up everywhere.
- **B.** The model didn't actually improve; the loss number must be measured incorrectly.
- **C.** Loss is an average over next-token prediction; a strict multi-step pass/fail score can stay near zero across a smooth loss improvement until the underlying per-step accuracy crosses whatever threshold that specific task's exponent requires.
- **D.** 6-step tasks are fundamentally impossible for language models regardless of scale.

<details><summary>Answer</summary>

**Correct: C.** This is the exact mechanism behind the emergence-and-metric debate covered earlier in this module: a k-step exact-match score scales like `p^k` for per-step accuracy `p`, so a smoothly improving `p` can leave the scored success rate looking flat for a long stretch before it visibly moves. **A** conflates a smooth aggregate statistic with every possible downstream measurement moving in lockstep — they don't have to. **B** loss and task success are different measurements of different things; neither being wrong is required to explain the mismatch. **D** the mirage argument is specifically that thresholded tasks *can* and often do improve — just not visibly, until the underlying rate clears the threshold.

</details>

## 3. What induction heads actually do

Which statement most accurately describes the induction-head mechanism behind in-context learning?

- **A.** A single attention head that stores a compressed summary of every example in the prompt.
- **B.** Two heads working together: one marks what token preceded each position, the other searches for the current token's earlier occurrence and copies whatever followed it.
- **C.** A separate optimizer module that runs actual gradient updates on the in-context examples.
- **D.** A lookup table built during pretraining that maps exact prompts to memorized answers.

<details><summary>Answer</summary>

**Correct: B.** This is the two-stage circuit from in-context learning mechanics: a previous-token head writes what came before each position into that position's representation, and the induction head queries by the current token to find an earlier match and copy what followed it. **A** describes something closer to a summarization mechanism, not the specific copy-what-followed circuit that's been directly identified. **C** describes the separate, more contested "implicit gradient descent" hypothesis — real in some constructed settings, not the same claim as the induction-head account, and not settled as the general explanation. **D** prompts are far too varied for exact memorization to explain generalization to novel example sets.

</details>

## 4. Chain of thought and why it helps

A model given a hard multi-step arithmetic problem answers correctly when allowed to write out intermediate steps, but answers incorrectly when forced to respond with only the final number. What's the best mechanistic explanation?

- **A.** The model is being lazy on the direct-answer version and could do better if incentivized.
- **B.** Writing out intermediate steps creates additional forward passes, each able to attend back over prior steps — externalizing state that a single forward pass has no room to hold internally.
- **C.** The direct-answer version uses a different, weaker part of the network.
- **D.** Chain of thought works purely because it primes the model with confidence, not because of any computational difference.

<details><summary>Answer</summary>

**Correct: B.** As covered in this module's chain-of-thought lesson, a transformer has fixed compute depth per token; forcing a single-token answer caps the sequential computation available to the problem, while each emitted reasoning token is a full additional forward pass that can condition on everything emitted so far. **A** "laziness" isn't a mechanism — there's no motivational state to invoke. **C** the same weights and layers process both versions; nothing routes to a different sub-network. **D** confidence framing doesn't add computation; the actual mechanism is extra forward passes, not tone.

</details>

## 5. RL on verifiable rewards vs. ordinary RLHF

What's the key structural difference between the RL stage used to train reasoning models and standard RLHF?

- **A.** Reasoning-model RL uses a much larger base model.
- **B.** Standard RLHF optimizes against a learned reward model trained on human preferences; reasoning-model RL optimizes against a programmatically checkable outcome (does the answer match, do the tests pass), removing the learned-approximator failure mode.
- **C.** Reasoning-model RL doesn't use reinforcement learning at all — it's pure supervised fine-tuning on long examples.
- **D.** They are functionally identical; "reasoning model" is a branding difference.

<details><summary>Answer</summary>

**Correct: B.** This module's lesson on how reasoning models are trained covers exactly this: a verifiable reward (checkable code tests, matched final answers) is an external, exact check, unlike a reward model that's a learned, foolable proxy for human preference. **A** model size is an independent variable, not the defining structural difference. **C** the recipe does use RL (PPO/GRPO-style policy optimization) on top of an optional supervised cold start — it's not SFT alone. **D** the reward signal's source (verifiable outcome vs. learned preference model) is a real mechanistic difference with real consequences for what gets optimized.

</details>

## 6. Diagnose the hallucination

A user asks a coding assistant: *"What parameters does `pandas.DataFrame.fast_merge()` take?"* There is no such method — `pandas.DataFrame` has `.merge()`, not `.fast_merge()`. The model responds with a confident, fully-formed parameter list (`on`, `how`, `suffixes`, `validate`) styled exactly like real pandas documentation. What's the most accurate diagnosis?

- **A.** The model is retrieving from a cached but outdated version of the pandas docs.
- **B.** The model's next-token objective has no reject option; `fast_merge` looks like a plausible pandas method name, and the argument list is assembled from the extremely dense, fluent pattern of real pandas method signatures — high fluency, zero factual grounding, because the fact ("does this method exist") was never a fact the objective could check.
- **C.** This is a sampling temperature bug — lowering temperature to 0 would have prevented it.
- **D.** The model is deliberately testing the user's knowledge.

<details><summary>Answer</summary>

**Correct: B.** This is the mechanism from this module's hallucination lesson: pretraining rewards fluent completion, not verified fact-checking, and a plausible-sounding but nonexistent API name gets a fully fluent, high-confidence completion because the surrounding pattern (pandas method signatures) is extremely dense in training data even though this specific method never existed. **A** there's no retrieval or caching involved in a base generation — the model isn't looking anything up. **C** covered explicitly in the same lesson: temperature 0 removes sampling variance, not fabrication — it would confidently walk to the same plausible-but-wrong completion, just more consistently. **D** language models have no intentions or testing behavior; this anthropomorphizes a next-token-prediction artifact.

</details>

## 7. Images as tokens

Under an early-fusion multimodal architecture, why does adding a high-resolution image to a prompt noticeably shrink the effective context budget left for text?

- **A.** Images are stored as a single opaque token regardless of resolution, so this shouldn't happen.
- **B.** The vision encoder's patches, once projected into the language model's embedding dimension, are inserted directly into the same token sequence the text occupies — more patches (higher resolution) means more tokens competing for the same context window.
- **C.** Images use a completely separate, unlimited context window from text.
- **D.** Only the image's file size in bytes counts against the context window, not its patch count.

<details><summary>Answer</summary>

**Correct: B.** As covered in this module's multimodal lesson, early fusion splices projected patch vectors directly into the same sequence as text tokens — patch count (which grows with image area, not linear resolution) drives token cost, and those tokens draw from the identical context budget as text. **A** a single opaque token is not how early fusion works — patch count scales with resolution, which is exactly why it eats budget. **C** cross-attention architectures avoid consuming the primary sequence's budget, but that's a different, named alternative to early fusion, not a property of early fusion itself. **D** token cost is driven by patch grid size, not file size — a visually simple but high-resolution image can cost more tokens than a complex low-resolution one.

</details>

## 8. Choosing an adaptation strategy

A team runs a support bot for a product catalog that changes weekly, and they're seeing outdated answers about discontinued products. What's the most appropriate fix?

- **A.** Fine-tune the model weekly on the updated catalog.
- **B.** Add the entire catalog to the system prompt on every call.
- **C.** Use retrieval-augmented generation so each query pulls current catalog data at query time, leaving the model's weights untouched.
- **D.** Increase the sampling temperature so the model is more likely to say something new.

<details><summary>Answer</summary>

**Correct: C.** Per this module's adaptation-strategy comparison, fast-changing factual knowledge is the textbook RAG scenario — retrieval keeps facts current without a retraining cycle. **A** weekly fine-tuning is a real option in principle but is the expensive, slow-to-update choice for something that's purely a freshness problem, not a style or behavior problem. **B** stuffing an entire catalog into every prompt burns context budget and cost on every call and doesn't scale as the catalog grows. **D** temperature controls the shape of the sampling distribution over tokens the model already would produce — it has no mechanism for injecting facts the model doesn't have.

</details>

**Related:** [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Emergent Abilities and the Mirage Debate](/learn/llm-foundations/emergent-abilities-and-the-mirage-debate), [Why LLMs Hallucinate](/learn/llm-foundations/why-llms-hallucinate), [LLM Internals Reference Card](/learn/llm-foundations/llm-internals-reference-card), [Build a Tiny GPT and Watch It Learn](/learn/llm-foundations/build-a-tiny-gpt-capstone)
