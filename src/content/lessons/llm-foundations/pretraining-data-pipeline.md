---
title: "Inside the Pretraining Data Pipeline"
track: "llm-foundations"
status: live
summary: "Crawling, deduplication, quality filtering, and mixture weighting turn raw web text into a corpus, and each stage measurably moves the loss."
duration: "9 min read"
---

By the time a model sees its first training batch, its corpus has already passed through a pipeline with more decisions baked into it than the training run itself — and those decisions show up directly in the loss curve.

> **Optional depth.** You don't need this lesson to understand what pretraining optimizes — see [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss). This is about how the corpus behind that objective actually gets built, and why "just add more data" is a subtler lever than it sounds.

## The stages

### Crawling

Raw text comes from web crawls, licensed and public-domain books, code repositories, curated reference sources, and increasingly filtered or synthetic subsets. At crawl scale, most of what's fetched is boilerplate, spam, auto-generated text, or duplicate mirrors of the same page. Crawling is the widest, lowest-quality stage of the funnel by design — filtering happens downstream, not at the door.

### Deduplication

Exact hashing catches identical documents; near-duplicate detection (n-gram fingerprinting, MinHash-style methods) catches documents and sub-document chunks that are almost, but not quite, the same text. This matters mechanically: a model trained on heavily duplicated text gets extra gradient steps that just reinforce memorizing that one passage, rather than spending that compute learning something new. It inflates apparent progress on the duplicated passage while doing nothing for generalization elsewhere, and heavy duplication is a well-documented mechanism behind models regurgitating memorized text verbatim.

### Quality and safety filtering

These are two related but distinct filters. Quality filtering pushes a crawl's long tail of garbled, template-spam, or auto-generated text down in sampling weight, typically using classifiers or heuristics trained to recognize coherent, edited-feeling text. Safety filtering removes or downweights categories an organization has decided shouldn't be in the training mix at all — a separate decision from "does this resemble coherent text," since a passage can be well-written and still filtered on safety grounds, or garbled and still pass a lenient quality bar. The tradeoff is real: overly aggressive quality filtering skews a corpus toward a narrower, more formal register and can filter out entire dialects or informal registers disproportionately — a precision-versus-coverage tradeoff, not a free win.

### Domain mixture weighting

The final training mix isn't "whatever fraction each source happened to be in the raw crawl." Teams set explicit sampling weights per domain — web text, code, books, reference material — often upweighting smaller, high-value sources like code and curated reference text far above their natural share of the crawl, because those sources tend to contribute more to downstream capability per token than their raw volume would suggest. This is a deliberate lever, independent of total token count.

### Tokenized document packing

After filtering and mixing, documents get [tokenized](/learn/llm-foundations/tokenization-explained) and packed into fixed-length training sequences, typically concatenating multiple documents (with a separator token) to fill each sequence efficiently, since real documents vary wildly in length and padding every short one out to the maximum length would waste a large fraction of every batch. Packing interacts with [causal masking](/learn/llm-foundations/causal-masking-mechanics): without care, packing lets a model attend across the boundary from the end of one unrelated document into the start of the next — exactly what a document separator, and in careful implementations an attention-mask reset at document boundaries, is meant to prevent.

## A concrete illustration: what dedup and filtering do to loss

The following is a toy version of the mechanism with made-up, representative numbers — not a reported result from any specific model.

Suppose a raw crawl contains one passage duplicated 50 times across mirror sites. Every one of those 50 copies burns a training step's worth of gradient update reinforcing the model's confidence on that exact passage — pushing its per-token loss toward zero far faster than for text seen once — while contributing nothing to the model's loss on the rest of the corpus. When duplication like this is common, training loss can look better than it really is: it's being dragged down by trivially memorizable repeats rather than genuine generalization, and held-out validation loss (on non-duplicated text) can lag behind. Removing the 49 redundant copies redirects that compute toward passages the model hasn't already memorized, which is the mechanical reason dedup lowers loss on genuinely new text.

The same logic applies to quality filtering: a corpus half-full of low-information boilerplate spends training steps predicting highly repetitive, low-entropy filler. Filtering it out reallocates those steps toward higher-information text, which is why quality filtering tends to move held-out loss down even though the total token count went down.

## Tradeoffs to hold in tension

- **More raw tokens vs. cleaner tokens.** Aggressive filtering shrinks the corpus, and [scaling laws](/learn/llm-foundations/scaling-laws-what-they-predict) generally reward more tokens — so filtering has to earn its keep by removing tokens that hurt more than they'd have helped.
- **Dedup aggressiveness vs. useful repetition.** Some repetition is legitimate signal — canonical facts and common code idioms genuinely do recur — so dedup thresholds have to distinguish "the same page mirrored 50 times" from "this idiom appears often because it's genuinely common."
- **Mixture weighting is a bet.** Upweighting code or reference text is a hypothesis about what improves general capability, tested empirically per run rather than derived from first principles.

## Where next

The corpus this pipeline produces is what [the pretraining loss](/learn/llm-foundations/the-pretraining-objective-and-loss) actually gets computed over, and it's the raw material [self-supervision](/learn/llm-foundations/what-the-internet-teaches-a-model) works on. The optimizer that consumes it is covered next in [Optimization Mechanics](/learn/llm-foundations/optimization-mechanics-adam-warmup).

**Related:** [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss), [What the Internet Actually Teaches a Model](/learn/llm-foundations/what-the-internet-teaches-a-model), [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Tokenization Explained](/learn/llm-foundations/tokenization-explained), [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics)
