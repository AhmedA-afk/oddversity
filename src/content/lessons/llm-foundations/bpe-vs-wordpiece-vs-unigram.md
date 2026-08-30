---
title: "BPE vs WordPiece vs Unigram vs Byte-Level"
track: "llm-foundations"
status: live
summary: "Four ways production tokenizers are actually built, and why the one your model shipped with was rarely a free choice."
duration: "8 min read"
---

"BPE" gets used as a catch-all for "how modern tokenizers work," but the models you actually use split into a few genuinely different families — different merge criteria, different whitespace handling, different guarantees about what happens to text they've never seen.

## Byte-level BPE (GPT-2/3/4-class, RoBERTa)

**How it works.** The base alphabet is all 256 possible byte values, not Unicode characters — so [BPE's merge loop](/learn/llm-foundations/build-bpe-from-scratch) starts from raw bytes and merges upward from there. Whitespace is folded into tokens directly: a leading space becomes part of the token that follows it, so `"the"` and `" the"` are different tokens with different learned merge histories, not the same token with a separate space token in front.

**When it wins.** You want zero risk of an unrecognized-input failure across code, emoji, mixed scripts, or garbage input, with no separate preprocessing step. Because the base alphabet already covers every possible byte, there's no character a byte-level vocabulary can fail to represent.

**Failure mode.** The leading-space convention is a constant source of confusing behavior — the same word tokenizes differently depending on what precedes it, which trips up humans debugging prompts and can subtly affect few-shot formatting (see [tokenization gotchas that break prompts](/learn/llm-foundations/tokenization-gotchas-that-break-prompts)). Left unpatched, digit merges also group arbitrarily, which is why production versions add an explicit cap on digit-run length.

**Relative cost.** Training is the same bottom-up merge loop as any BPE — computationally the cheapest of the four to train. Vocabularies in this family tend to run large (100k+), which grows the embedding table but shortens sequences; see [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff).

## WordPiece (BERT, DistilBERT, Electra)

**How it works.** Also a bottom-up merge algorithm, but the criterion for picking the next merge isn't raw pair frequency — it's whichever merge most increases the likelihood of the training corpus, roughly the pair's frequency divided by the product of its two symbols' individual frequencies. Text is first split into words by whitespace and punctuation, and each word is then greedily matched against the vocabulary longest-piece-first; subword continuations get a `##` marker (`"playing"` → `"play"` + `"##ing"`).

**When it wins.** Encoder-only, bidirectional models built for classification, retrieval, or embedding tasks, where the `##` marking gives the model an explicit, cheap signal about which pieces are word-starts versus word-continuations.

**Failure mode.** The whitespace-based pre-tokenization step is a real dependency — languages without whitespace word boundaries (Chinese, Japanese, Thai) need a separate segmentation pass before WordPiece can even start, or fall back to inefficient per-character splitting. WordPiece also keeps a genuine `[UNK]` token in the pipeline, so a character combination the vocabulary never saw can still fail to represent cleanly, unlike a byte-level base alphabet.

**Relative cost.** The likelihood-based merge criterion costs more to evaluate per candidate than plain frequency counting during training. Vocabularies in this family are typically smaller (BERT's is around 30k), keeping the embedding table modest.

## SentencePiece + Unigram LM (T5, ALBERT, XLNet, mT5)

**How it works.** The opposite direction from BPE and WordPiece: start with a large candidate set of subwords and a unigram probability model over them, then repeatedly remove whichever pieces hurt the corpus's overall likelihood least, pruning down to the target vocabulary size. SentencePiece (the framework this runs inside) treats whitespace as an ordinary symbol — commonly rendered as a `▁` meta-character — so there's no separate whitespace pre-tokenizer at all. Because it's probabilistic, a single string can have more than one valid segmentation, each with a probability; encoding usually picks the most likely one, though the same machinery lets training sample alternate segmentations as a regularizer.

**When it wins.** Multilingual training runs, especially covering languages without whitespace-delimited words, since there's no pre-tokenizer to write per language. Also useful when subword regularization during training is worth the added complexity.

**Failure mode.** Segmentation isn't a fixed merge list you can replay by hand the way BPE's is — it's a probabilistic search over candidate segmentations, which makes it more opaque to inspect and debug, and typically the most expensive of the four to train given the top-down prune-from-a-huge-candidate-set shape.

**Relative cost.** Training is algorithmically the heaviest of the four (build a huge candidate vocabulary, then iteratively re-score and prune it). Inference-time encoding is comparable in practice thanks to efficient implementations, but it's doing genuinely different work than a merge-list replay.

## SentencePiece BPE with byte fallback (Llama, Llama 2, Mistral)

**How it works.** The same bottom-up BPE merge loop as byte-level BPE, but run inside SentencePiece over Unicode characters rather than raw bytes as the primary alphabet — with an explicit byte-fallback rule: any character missing from the trained vocabulary decomposes into raw UTF-8 bytes instead of becoming an unknown token.

**When it wins.** You want the smaller, character-centric vocabularies common in open-weight models (often around 32k, versus 100k+ for byte-level BPE) while still keeping a guarantee that nothing is ever truly out-of-vocabulary, thanks to the byte-fallback safety net. SentencePiece's built-in whitespace-as-symbol handling is a bonus for multilingual text without extra preprocessing.

**Failure mode.** Because the trained vocabulary is smaller and character-oriented rather than byte-first, text in scripts underrepresented in training leans on the byte-fallback path more often — producing noticeably longer token sequences for those languages than a byte-level BPE tokenizer with a larger, more inclusive vocabulary would. (Note that newer open-weight releases, including Llama 3, have moved toward larger, byte-level-BPE-style vocabularies closer to the GPT family, partly to close this gap.)

**Relative cost.** A ~32k vocabulary keeps the embedding and unembedding tables small relative to a 100k+ byte-level vocabulary — directly trading vocabulary size for longer sequences on underrepresented scripts, another instance of [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff).

## Decision table

| Family | Base unit | Needs a pre-tokenizer? | True out-of-vocabulary possible? | Typical vocab size | Example models |
|---|---|---|---|---|---|
| Byte-level BPE | Raw bytes (256) | No | Never | 50k–200k | GPT-2/3/4, RoBERTa |
| WordPiece | Characters, whitespace-split | Yes (whitespace/punctuation) | Yes, via `[UNK]` | ~30k | BERT, DistilBERT, Electra |
| SentencePiece Unigram | Unicode chars, space-as-symbol | No | Rare, vocabulary-dependent | 30k–250k | T5, ALBERT, XLNet, mT5 |
| SentencePiece BPE + byte fallback | Unicode chars, byte fallback | No | Never (falls back to bytes) | ~32k | Llama, Llama 2, Mistral |

## How to choose

If you're building on an existing pretrained model, you don't choose — the tokenizer is frozen the moment you load the checkpoint, and swapping it means retraining the embedding and [unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding) layers from scratch. The choice only matters when you're training a tokenizer for a new model:

- Default to **byte-level BPE** for a general-purpose model expected to see arbitrary input — code, mixed languages, emoji, malformed text — with the simplest encoding pipeline and no true unknown-token risk.
- Reach for **SentencePiece Unigram** when multilingual coverage (especially languages without whitespace word boundaries) is a first-class requirement, or when subword regularization is worth the training complexity.
- Pick **WordPiece** mainly for compatibility with the BERT ecosystem and its tooling — there's little reason to choose it fresh today over the alternatives above for a new model.
- Pick **SentencePiece BPE with byte fallback** when a compact, character-centric vocabulary matters more than maximal multilingual efficiency, and you're comfortable with somewhat longer sequences on underrepresented scripts as the tradeoff.

**Related:** [Byte-Pair Encoding](/learn/llm-foundations/byte-pair-encoding), [Build Byte-Pair Encoding From Scratch](/learn/llm-foundations/build-bpe-from-scratch), [Tokenization Gotchas That Break Prompts](/learn/llm-foundations/tokenization-gotchas-that-break-prompts), [The Vocab-Size vs Sequence-Length Tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff), [Model Families and Variants](/learn/llm-foundations/model-families-and-variants)
