---
title: "The Vocab-Size vs Sequence-Length Tradeoff"
track: "llm-foundations"
status: live
summary: "A bigger vocabulary shortens sequences but bloats the embedding table and starves rare tokens of training signal — you can't win both."
duration: "6 min read"
---

Why not just make the vocabulary enormous — a million tokens — and get every sequence down to almost nothing? Because the vocabulary isn't free. It costs parameters, and it costs the model practice on the tokens it needs most.

## The analogy

Think of the vocabulary as a warehouse of prebuilt LEGO pieces, and a sentence as something you have to build out of them.

A warehouse stocked only with 1x1 bricks is cheap to build and cheap to catalog — there's almost nothing to remember, every piece is identical. But building anything of size takes an enormous number of bricks, one at a time.

A warehouse stocked with every specialty piece imaginable — whole prebuilt walls, roof sections, staircases — lets you assemble a house from a handful of pieces. But now the warehouse itself is enormous, you had to manufacture and shelve every one of those specialty pieces in advance, and most of them are used so rarely that your factory barely gets any practice molding them well.

**Vocabulary size is the size of the warehouse. Sequence length is how many pieces a given sentence needs.** Tokenization is choosing how big to build the warehouse before you've seen everything you'll ever need to build.

## Walking the paragraph through

Take one sentence: `"Subword tokenization balances vocabulary size against sequence length control."`

**Character-level.** Every character — including spaces and the final period — is its own brick. Count them: `Subword`(7) + space + `tokenization`(12) + space + `balances`(8) + space + `vocabulary`(10) + space + `size`(4) + space + `against`(7) + space + `sequence`(8) + space + `length`(6) + space + `control`(7) + `.`(1) = 69 letters + 8 spaces + 1 period = **78 tokens**, out of a warehouse of roughly 256 possible bricks (raw bytes).

**An 8,000-token subword vocabulary.** This warehouse has room for common short words and frequent fragments, but not for less common compounds. A plausible split (illustrative — an actual tokenizer's exact merges will differ, but the *pattern* holds): `Sub` `word` ` token` `ization` ` balance` `s` ` vocab` `ulary` ` size` ` against` ` sequence` ` length` ` control` `.` — **14 tokens**. Long or less-frequent words like "tokenization" and "vocabulary" didn't earn a whole-word slot, so they're built from two or three pieces.

**A 100,000-token subword vocabulary.** This warehouse had room to give whole common words their own dedicated brick, including ones an 8k vocabulary had to split: ` tokenization` ` balances` ` vocabulary` ` size` ` against` ` sequence` ` length` ` control` `.`, plus `Sub` `word` for the less common compound — **about 10 tokens**. Fewer bricks, same sentence.

Now look at the other side of the ledger — the size of the warehouse itself. An embedding table is `vocab_size × d_model` numbers, one row per vocabulary entry. At a representative `d_model = 4096`:

```
8,000 vocab:   8,000 × 4,096  =  32,768,000  params  (~32.8M)
100,000 vocab: 100,000 × 4,096 = 409,600,000 params  (~409.6M)
```

Going from 8k to 100k tokens shortened this one sentence from 14 tokens to about 10 — roughly a 30% reduction — but it grew the embedding table (and the tied [unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding) matrix that projects back to vocabulary logits) by more than 12x. That parameter cost is paid once and carried on every forward pass forever, whether or not a given request ever uses the rare tokens it bought.

There's a second, quieter cost. Natural language follows a steep frequency curve — a small number of tokens account for most of the text, and the tail is long. Cramming in 100,000 vocabulary slots means many of those slots are rare tokens that show up only occasionally across the whole training run. Each one gets correspondingly less gradient signal, so its embedding vector is trained on far fewer examples than a common token's. A giant vocabulary doesn't just cost memory — it dilutes training attention across more, thinner slices of data.

## The wrong intuition

The instinctive assumption is "bigger vocabulary = strictly better, since it means shorter, cheaper prompts." That's true for the sequence-length side of the ledger and false as a whole picture. It ignores that:

1. The embedding and unembedding tables scale directly with vocabulary size, so a 12x larger vocabulary is not a free lunch — it's 12x more parameters spent on lookup tables instead of layers that do reasoning.
2. Shorter sequences from a bigger vocabulary don't reduce compute at the same rate you'd hope, because [self-attention cost scales roughly quadratically with sequence length](/learn/llm-foundations/the-quadratic-attention-bottleneck) — a 30% shorter sequence is still a meaningful win, but it's not the whole story, since the per-token cost of a bigger softmax over more vocabulary entries goes up too.
3. Rare tokens in a huge vocabulary are seen less often during training, so the model's competence on them is worse, not better, than it would be if those same substrings were built compositionally from more common subword pieces.

The real picture is a genuine tradeoff with no dominant strategy — which is exactly why real tokenizers converge on the middle of the dial (see [why models use tokens, not characters or words](/learn/llm-foundations/why-models-need-tokens-not-characters)) rather than either extreme, and why production vocabularies cluster in the tens of thousands to low hundreds of thousands rather than drifting toward millions.

## Where the analogy breaks

The LEGO warehouse analogy assumes you decide the inventory once and it stays fixed — which is true for a trained tokenizer, but it hides one thing: the *merge order* that built the warehouse also determines which pieces exist at all. Because [BPE](/learn/llm-foundations/build-bpe-from-scratch) greedily merges whatever pair is currently most frequent, a bigger target vocabulary size doesn't just add more of the same kind of pieces — it changes which merges happen at every earlier step too, since the greedy algorithm now has more merge steps to spend before it stops. Two vocabularies of different target sizes trained on the same corpus don't nest inside each other; the smaller one isn't simply a prefix of the larger one's merge list. That's a wrinkle the warehouse picture doesn't capture, but it doesn't change the core tradeoff: more slots, shorter sequences, bigger tables, thinner rare-token statistics.

**Related:** [Why Models Use Tokens, Not Characters or Words](/learn/llm-foundations/why-models-need-tokens-not-characters), [Build Byte-Pair Encoding From Scratch](/learn/llm-foundations/build-bpe-from-scratch), [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table), [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck)
