---
title: "Why LLMs Hallucinate"
track: "ai-foundations"
status: live
summary: "Deep-dive lesson deriving hallucination mechanistically from the next-token training objective (no reject option, fluency/content density mismatch, causal-mask snowballing), walkin"
duration: "1 min read"
---

## Why LLMs Hallucinate

> Optional depth. [What LLMs Can and Cannot Do](/learn/ai-foundations/what-llms-can-and-cannot-do) tells you *that* models fabricate; this page derives *why*, down to the training objective, and shows precisely where each mitigation does and doesn't reach.

Here's the uncomfortable part: a hallucination isn't a bug in the generation process. It's the generation process working exactly as trained, applied to a case where "exactly as trained" and "actually true" have come apart.

## The objective has no reject option

Pretraining optimizes one thing: given the tokens so far, predict the next one. Formally, for a sequence x1...xT, the loss is the average negative log-likelihood the model assigns to the token that actually came next:

```
loss = -(1/T) * sum_t log P(x_t | x_1, ..., x_{t-1})
```

Every gradient update pushes the weights to raise P(correct next token) and lower P(everything else), across billions of tokens of real text. Nowhere in that objective is there a class called "I don't know," and nowhere is there a penalty for confidently completing a pattern whose specific content is wrong. Contrast this with a classifier trained with an explicit reject option (predict "unknown" when confidence is below a threshold, and get rewarded for it) — that structure has to be built in on purpose. [Self-supervised learning](/learn/ai-foundations/self-supervised-learning) on raw text never sees an "unknown" label because raw text doesn't come annotated with which sentences the *next reader* will find true.

So at inference time, a forward pass produces logits over the vocabulary, you run softmax, and you sample or take the argmax. That's the entire decision procedure. There is no second pass that checks the chosen token against a fact store. If the model has hooks for one (tool use, retrieval), that's added scaffolding — not something the base mechanism provides.

## Fluency is cheap, verification is absent: watch a fake citation get built

Ask a model: *"Give me a citation for a 2019 paper on transformer-based anomaly detection in oil-and-gas time-series data, by a researcher named Priya Chandran."* Assume, for the exercise, that no such paper exists. Here's a plausible completion:

```
Chandran, P. (2019). "Transformer-Based Anomaly Detection for Multivariate
Time-Series in Industrial Oil and Gas Systems." IEEE Transactions on
Industrial Informatics, 15(4), 2201-2210.
```

Walk it field by field, because each one is generated under different conditions:

- **"Chandran, P." and "2019"** — copied straight from your prompt. High probability, and correct, because it's extractive: the model is conditioning on tokens you handed it.
- **The title** — assembled from a template. Paper titles follow an extremely regular grammar (`Method + "for" + Task + "in" + Domain`), and your prompt supplied the domain vocabulary (transformer, anomaly detection, time-series, oil and gas). Slotting those nouns into the template is a high-confidence next-token operation even though no such title was ever seen.
- **The journal name** — chosen by topical association. *IEEE Transactions on Industrial Informatics* is a real, high-frequency journal strongly co-occurring with "industrial," "anomaly detection," and "time-series" in training data. The model isn't looking up which journal published this paper; it's doing something like a soft nearest-neighbor pull over journal names conditioned on subject-matter tokens. That's a well-calibrated move for "what journal *sounds* right here" and a completely unverified one for "what journal did this actually appear in."
- **Volume, issue, pages** — small integers in the range typical of that journal's publication history. Plausible in magnitude, invented in specifics.

Notice what never happens: at no point does a lookup fire. There's no step that queries a citation database and reconciles it with the generated text. The reason this reads as confident is that citation *format* is one of the most rigid, high-density patterns in the training corpus — so the model nails the shape with high probability, and that shape is your only signal, as a reader, for whether the content is trustworthy. It isn't.

## Why sparse regions of the training distribution don't announce themselves

The distinction that matters is fluency versus content density, and they're controlled by different things. Fluency (grammar, citation formatting, code syntax) is dense everywhere in the training data — millions of examples reinforce it regardless of topic. Content correctness for a specific fact depends on how often *that fact* showed up, which varies wildly and has nothing to do with how well-formed the sentence around it will be.

When a fact is well-represented, next-token prediction across many contexts reinforces the same completion, and the model's output distribution at that position is sharply peaked — low entropy, one dominant token. When a fact is rare or absent, the distribution over "what plausibly goes here" is flatter — several journal names or page ranges are all roughly equally likely — but the sampler still has to emit *something*, and greedy or top-p decoding will hand you one specific, fluently-phrased token anyway. Read [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty) if the bits terminology below is new.

You can see this with toy numbers (not measured from any real model — just to make the shape concrete):

```python
import numpy as np

def softmax(logits):
    exp = np.exp(logits - np.max(logits))
    return exp / exp.sum()

def entropy_bits(probs):
    probs = probs[probs > 0]
    return -np.sum(probs * np.log2(probs))

# Toy logits over a tiny 5-token vocabulary at one decoding step
logits_common = np.array([5.2, 1.0, 0.5, 0.3, 0.1])   # e.g. "the capital of France is ___"
logits_rare    = np.array([1.8, 1.6, 1.5, 1.4, 1.3])   # e.g. "the journal was ___" for an obscure paper

p_common, p_rare = softmax(logits_common), softmax(logits_rare)
print("common: top prob = %.2f, entropy = %.2f bits" % (p_common.max(), entropy_bits(p_common)))
print("rare:   top prob = %.2f, entropy = %.2f bits" % (p_rare.max(), entropy_bits(p_rare)))
```

Run it and the rare case has both lower peak probability and higher entropy — the model really is "less sure" internally. But that internal spread never reaches you. Chat UIs don't show logprobs, and even a raw API's top token still gets printed as plain, unhedged prose. Translating "high entropy at this step" into visible hedging ("I'm not certain, but...") is a separate, learned behavior — not something the softmax gives you for free. That's exactly the gap [refusal training](/learn/ai-foundations/rlhf-and-instruction-tuning) is trying to close, and it's why the fix has to be deliberate rather than automatic.

## Autoregressive generation lets a wrong token become load-bearing

There's a second mechanism that compounds the first. Generation is causal: each token can only attend to tokens already emitted ([causal masking](/learn/llm-foundations/causal-masking) is what enforces this), and once a token is out, it's permanent context for everything after it. During training the model always conditions on the *true* preceding tokens (teacher forcing); at inference it conditions on its *own* preceding tokens, true or not.

So if step 6 of a generation confidently produces a wrong journal name, step 7 isn't generating "the pages of the real paper" — it's generating "pages that would plausibly follow, in this specific fake journal, at this specific fake volume." The model has no mechanism to notice the premise three tokens back was invented; it just keeps being locally fluent, conditioned on whatever's actually in the context window now. This is sometimes called hallucination snowballing, and it's why asking a model to "explain your reasoning" after a fabricated claim usually produces a coherent-sounding justification for the fabrication rather than a retraction — the justification is generated under the same causal constraint, conditioned on a context that already contains the error.

## What retrieval, calibration, and refusal training each actually fix

These three are the standard toolkit, and they attack different parts of the mechanism above. None of them touch the underlying generation procedure — they add scaffolding around it.

| Mitigation | What it actually changes | What it leaves untouched |
|---|---|---|
| Retrieval (RAG) | Puts real source text in context so the model can condition on ground truth instead of generating from parametric weights alone | Still autoregressive on top of whatever was retrieved — can misquote, misattribute, or fabricate on retrieval misses or irrelevant hits |
| Calibration | Aligns *stated* confidence with *empirical* accuracy in aggregate, giving you a threshold to abstain or escalate on | Fixes nothing about any single answer; a verbalized "I'm 90% sure" is itself generated text, meaningless until it's been trained against real outcomes |
| Refusal training | Adds real gradient pressure toward an abstention pathway that pretraining never rewards at all | Only as good as the training signal's ability to label "known unknowns" — a boundary the model can't fully introspect on either |

**Retrieval** ([what RAG is and when to use it](/learn/rag/what-is-rag-and-when-to-use-it)) is the closest thing to attacking the actual cause identified above — it directly patches the "no ground truth available at generation time" gap for facts that exist in your corpus and get retrieved correctly. It does nothing for facts outside the corpus, and it doesn't stop the model from generating a fluent but subtly wrong paraphrase of a retrieved passage — the generation mechanism hasn't changed, only its input has gotten better.

**Calibration** is honest about what it can and can't promise: "when this model says 80% confident, it's right about 80% of the time" is a statement about a population of predictions, not a guarantee about the one in front of you. It's also fighting an uphill battle, because instruction-tuning and RLHF tend to erode calibration that existed at the raw pretraining stage — the reward signal optimizes for answers that feel complete and satisfying to a human rater, not for probabilities that track truth. So production calibration work is often partially about undoing a side effect of alignment training, not just adding a new capability.

**Refusal training** is the one that actually creates something pretraining structurally lacks: a rewarded pathway to "I don't know" or "I can't verify this." That's real progress on the root cause. Its limit is upstream of the training procedure itself — to reward correct refusals you need to know, at training time, which questions the model actually can't answer reliably, and that labeling problem is hard for the same reason the original problem is hard. In practice this gets approximated with proxies (question type, known-cutoff dates, self-consistency signals), which is why refusal-trained models both over-refuse things they actually know and still confidently fabricate things that don't match the proxy pattern.

## A practitioner's check: does the claim survive resampling?

One thing falls directly out of the entropy argument above and is genuinely useful day to day: a fact the model has strong support for should barely move if you resample the same prompt at temperature > 0. A fabricated specific — freshly generated from a comparatively flat distribution each time — tends to drift.

```python
# Toy illustration using canned outputs so this runs standalone.
# In practice, `claims` comes from resampling the same prompt several
# times against a real model at temperature 0.7-1.0.
claims = [
    {"author": "Chandran, P.", "year": "2019", "journal": "IEEE Trans. Industrial Informatics", "pages": "2201-2210"},
    {"author": "Chandran, P.", "year": "2019", "journal": "IEEE Trans. Industrial Informatics", "pages": "2198-2207"},
    {"author": "Chandran, P.", "year": "2019", "journal": "Journal of Industrial Data Systems", "pages": "45-58"},
    {"author": "Chandran, P.", "year": "2019", "journal": "IEEE Trans. Industrial Informatics", "pages": "112-121"},
]

for field in ["author", "year", "journal", "pages"]:
    values = {c[field] for c in claims}
    status = "stable" if len(values) == 1 else f"drifted across {len(values)} variants"
    print(f"{field:10s} -> {status}")
```

Author and year hold steady — they were extractive, copied from the prompt each time. Journal and pages drift — they were reconstructed fresh from a flatter distribution on every sample. That instability is the signature of fabrication, and it's checkable without any access to internal logprobs: just resample and diff.

## Where the intuition misleads you

- **"Temperature 0 removes hallucination."** No — greedy decoding removes *sampling noise*, not fabrication. It still walks straight to the argmax token even when the argmax token is a fabricated-but-plausible continuation. It'll actually make the fabrication more *consistent* across runs, not less present.
- **"It gave me a source, so it must be real."** Treat this as evidence in the wrong direction. Sources are exactly where confidently-shaped fabrication is cheapest to produce, because citation formatting is one of the most rigid patterns in the training distribution — easy to nail regardless of whether the content underneath is real.
- **"A bigger, newer model won't do this."** Scale shrinks the sparse regions (more facts become well-represented) but doesn't change the mechanism. Any question that lands outside what the model has dense support for can still get a fluent, wrong answer — and better prose quality can make it a more convincing one, not less.

**Related:** [How LLMs Work](/learn/ai-foundations/how-llms-work) · [Loss Functions Explained](/learn/ai-foundations/loss-functions-explained) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [What LLMs Can and Cannot Do: Case Studies](/learn/ai-foundations/what-llms-can-and-cannot-do-case-studies)
