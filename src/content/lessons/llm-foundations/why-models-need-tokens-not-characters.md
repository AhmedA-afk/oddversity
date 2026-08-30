---
title: "Why Models Use Tokens, Not Characters or Words"
track: "llm-foundations"
status: live
summary: "Subword tokens are the compromise between tiny-vocab characters and huge-vocab words — and a permanent constraint on the model."
duration: "6 min read"
---

Before you can ask why a model mangles arithmetic or miscounts letters, you have to answer a more basic question: why doesn't it just read text one character at a time, the way you're reading this sentence? The answer is a tradeoff nobody has fully escaped, and understanding it explains a surprising amount of downstream LLM behavior.

## What it is

A **tokenizer** is the function that turns raw text into the discrete units — tokens — a model actually consumes. There are three natural places to draw the boundary:

- **Character-level**: every character is its own token. Vocabulary is tiny (maybe 100–200 symbols for a script plus punctuation).
- **Word-level**: every whitespace-separated word is its own token. Vocabulary has to cover every word the model might ever see.
- **Subword-level**: tokens are chunks smaller than a word but usually bigger than a character — common words stay whole, rare ones split into pieces. This is what every production LLM actually uses, built by an algorithm like [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding).

## The mental model

Think of it as a dial with two ends, and subword tokenization living in the middle:

**Character-level, all the way left.** Vocabulary is small — great, the embedding table is cheap and there's never an unrecognized symbol. But every sequence gets long: "tokenization" is 12 tokens instead of 2–3. Since [attention cost grows with sequence length](/learn/llm-foundations/context-window-mechanics), and the model has to do more sequential reasoning steps just to see across a single word, this is expensive and it makes the model's job harder — it has to painstakingly assemble meaning from individual letters before it can do anything else with them.

**Word-level, all the way right.** Sequences get short — one token per word is about as compact as language gets. But now vocabulary has to contain every word form your training data (and every word users will ever type) or it fails outright. English alone has enormous numbers of word forms once you count inflections, names, typos, and made-up words; you cannot enumerate them in advance. Whatever's missing becomes an **out-of-vocabulary (OOV)** token — usually a generic `<UNK>` symbol — and the model loses all information about what the actual word was.

**Subword tokenization is the dial set in the middle.** Frequent whole words ("the", "is", "dog") get their own single token, because they're common enough to earn a dedicated vocabulary slot. Rare or novel words get decomposed into smaller, more common pieces — "tokenization" might become `token` + `ization`, and a word the tokenizer has genuinely never seen (a typo, a made-up brand name, a string of random characters) still encodes, just as more, smaller fragments, down to individual bytes if nothing else matches. Nothing is ever truly out-of-vocabulary, because the smallest units are guaranteed to be in the vocabulary.

## Why it works this way

The two costs that word-level and character-level tokenization each solve for one and blow up for the other are:

1. **Vocabulary size** — how many rows the embedding table needs, and how many parameters the final projection back to vocabulary (the [unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding)) needs.
2. **Sequence length** — how many tokens a given piece of text turns into, which drives compute cost, since [attention is quadratic in sequence length](/learn/llm-foundations/the-quadratic-attention-bottleneck).

Subword tokenization is a deliberate compression scheme learned from data: it spends vocabulary slots on the substrings that appear most often, so that the *average* sequence gets meaningfully shorter than character-level while the vocabulary stays orders of magnitude smaller than word-level. This is explored quantitatively in [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff).

## A concrete example (shown)

Take the word "unhappiness."

- **Character-level**: `u`, `n`, `h`, `a`, `p`, `p`, `i`, `n`, `e`, `s`, `s` — 11 tokens, but every one of them is guaranteed to be in a tiny, universal vocabulary.
- **Word-level**: 1 token, *if* "unhappiness" happens to be in the vocabulary. If not, it's `<UNK>` — and the model has zero information about the word beyond "some unknown word was here."
- **Subword (BPE-style)**: something like `un` + `happi` + `ness` — 3 tokens, built from pieces frequent enough to have earned their own slots, and composable enough to represent a word the tokenizer never saw as a whole unit during training.

Subword tokenization gets most of word-level's compactness without word-level's brittleness.

## Where it shows up

Every modern LLM you interact with — GPT-family, Llama-family, Claude, Gemini — tokenizes with a subword scheme, typically byte-level BPE or a close relative (see [BPE vs WordPiece vs Unigram vs byte-level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram) for how the families differ). This choice happens once, before pretraining even starts, and it's frozen for the model's entire life — you cannot swap a model's tokenizer after the fact without retraining the embedding and unembedding layers from scratch.

## Watch out for

- **"Tokens" is not a synonym for "words."** People routinely estimate cost or context usage by counting words, then get surprised. A rough English rule of thumb is closer to 4 characters per token, not one token per word — see [tokens, context, and cost](/learn/ai-foundations/tokens-context-cost).
- **Tokenization is chosen once and locked in.** It's not a runtime setting or a knob you tune per request — it's baked into the model's weights the moment pretraining starts, which is why it's worth understanding as an architectural decision, not an implementation detail.
- **"Subword" doesn't mean "morpheme."** BPE merges are chosen by raw frequency in training data, not by linguistic meaning, so splits often land somewhere a linguist wouldn't — more on this in [tokenization gotchas that break prompts](/learn/llm-foundations/tokenization-gotchas-that-break-prompts).

## Where next

The next lesson makes this tradeoff concrete by tokenizing the same paragraph three different ways and counting tokens directly: [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff). To see how the merge rules that create subwords are actually learned, go to [build BPE from scratch](/learn/llm-foundations/build-bpe-from-scratch).

**Related:** [Byte-Pair Encoding](/learn/llm-foundations/byte-pair-encoding), [Tokenization: How Text Becomes Tokens](/learn/llm-foundations/tokenization-explained), [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost)
