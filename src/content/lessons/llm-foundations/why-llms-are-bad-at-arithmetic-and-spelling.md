---
title: "Why LLMs Struggle With Arithmetic and Spelling"
track: "llm-foundations"
status: live
summary: "Traces digit-grouping and multi-character tokens to the exact mechanism behind letter-counting and multi-digit addition failures."
duration: "9 min read"
---

> **Optional depth.** This lesson derives the mechanism behind a specific, famous failure ("how many r's are in strawberry?") in more rigor than you need for everyday use. If [tokenizing tricky strings](/learn/llm-foundations/tokenizing-tricky-strings) and [tokenization gotchas](/learn/llm-foundations/tokenization-gotchas-that-break-prompts) already feel solid, this fills in exactly why those surface-level patterns happen.

The claim isn't "the model is bad at counting." The claim is narrower and more interesting: the model is being asked a question about a representation it was never given access to.

## The claim, precisely

A transformer's only input is a sequence of token embeddings — vectors pulled from [the embedding lookup table](/learn/llm-foundations/the-embedding-lookup-table), one per token ID. If a word is represented by one multi-character token, the individual characters inside that token are not separately present anywhere in the model's input. Whatever the model "knows" about a token's spelling has to have been learned indirectly, as a fact associated with that token's ID, the same way it learned any other fact — not perceived directly the way you perceive individual letters when you look at a printed word.

This matters for two distinct tasks that get confused with each other constantly: **spelling/counting** (does the model know what characters make up this token?) and **arithmetic** (does the token boundary line up with the place-value structure the arithmetic algorithm needs?). They fail for related but different reasons.

## Spelling: strawberry, token by token

Run `"strawberry"` through a byte-level BPE tokenizer and a common split is two tokens: `straw` + `berry`. (The exact boundary is tokenizer-version-dependent — some vocabularies split it differently — but the mechanism below holds for any split into multi-character pieces, which is the normal case for an ordinary English word.)

Spell each token out:

```
straw = s, t, r, a, w      -> one "r", at the 3rd character
berry = b, e, r, r, y      -> two "r"s, at the 3rd and 4th characters
```

The correct answer to "how many r's are in strawberry" is 3 — verify by spelling the whole word: `s-t-r-a-w-b-e-r-r-y`, with r at positions 3, 8, and 9. Getting this right requires three separate things to go correctly:

1. **Recall the exact character sequence inside `straw`** — not perceive it, *recall* it, the way you'd recall a fact you memorized rather than read one off a page in front of you.
2. **Recall the exact character sequence inside `berry`**, independently.
3. **Count matching characters within each recalled sequence and sum across tokens correctly.**

None of these three steps is handed to the model directly by its input. Each is an inference the model has to make from a token ID — a discrete, opaque integer as far as the architecture is concerned — using patterns it picked up during training from contexts where that token's spelling happened to be made explicit (spelling games, character-by-character text, code that iterates over strings). That's a fundamentally weaker channel than direct perception, and it degrades exactly where you'd expect: less common tokens, longer tokens, and tokens whose spelling was rarely spelled out explicitly in training data are where recall gets shakiest — which is why the model can nail short, extremely common words and stumble on a specific rarer one for no reason a person would guess.

## Arithmetic: why place value and token boundaries fight each other

Multi-digit addition, done by hand, depends on one structural fact: digits are aligned by place value, right-to-left, with units under units, tens under tens, and so on, so carries propagate correctly.

Byte-level BPE tokenizers used by GPT-3.5/4-class models specifically cap digit runs at a small number of consecutive digits per token (commonly three) to control the worst excesses of arbitrary digit grouping. But capping the run length doesn't restore place-value alignment — it just changes what breaks. Take two numbers of different lengths:

```
  47582   (5 digits)
+   215   (3 digits)
--------
  47797
```

Chunk each into groups of up to 3 digits, left to right (the documented behavior of this class of tokenizer):

```
47582  ->  "475" | "82"
  215  ->  "215"
```

Now look at what each chunk actually *means* in place value. `47582`'s second chunk, `"82"`, covers the tens and units digits — the last two places. `215`'s only chunk, `"215"`, covers hundreds, tens, *and* units — three places, including the same tens-and-units positions, but bundled with a hundreds digit that has no counterpart chunk boundary in the first number. There is no token-to-token correspondence between the two operands that lines up with place value the way handwritten, right-aligned digits do. The token `"215"` doesn't mean "the number 215" in some fixed, portable sense — it means "these three digits, wherever they happen to fall in whatever number they're chunked from," and that meaning shifts with every different total digit count, because chunking runs from the left, not anchored to the units digit the way arithmetic itself is.

This is precisely why longer, less common multi-digit sums are harder for a model than short ones: short, frequently-seen numbers can be handled by something closer to memorized pattern completion, but once problems get long enough that memorization runs out, the model needs to reconstruct place-value alignment from tokens that were never built to preserve it — extra work with no scaffolding for it in the input representation itself.

## Why memorization sometimes hides the problem

Neither failure is absolute, and that's part of what makes both confusing to reason about from the outside. A model can correctly spell extremely common words, correctly count letters in short, frequently-discussed examples, and correctly add small or round numbers — all without the representation problem going away, because for common-enough cases, the answer (or something very close to the reasoning pattern needed to produce it) was seen often enough during training to be recalled fairly directly, rather than derived step by step from first principles. The representational gap doesn't vanish; it's just papered over by memorization until you hit a case rare enough that memorization runs out and the model has to actually reconstruct spelling or place value from a token identity that doesn't expose either.

## What actually helps

Two mitigations follow directly from the mechanism, not from vague "try harder" advice:

- **Force character-level tokens explicitly.** Asking a model to first rewrite a word with spaces between every letter (`s t r a w b e r r y`) changes the tokenization itself — each letter becomes (or is very likely to become) its own token, so the count is now over an input where individual characters genuinely are separate positions the model can attend to, not something it has to recall from an opaque multi-character ID.
- **Externalize intermediate arithmetic steps.** Working a multi-digit sum one digit-column at a time, writing out each partial sum and carry as it goes (the mechanism behind [chain-of-thought and test-time compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute)), re-tokenizes each intermediate result as it's generated, giving the model a chance to align place values explicitly step by step instead of needing the whole answer to fall out of one forward pass over misaligned digit chunks.

Neither mitigation changes what the model's embeddings "contain" — they change what representation the task is being performed *over*, which is the actual lever available given that tokenization itself is fixed at training time (see [why models use tokens, not characters or words](/learn/llm-foundations/why-models-need-tokens-not-characters)).

## The precise tradeoff

None of this is a design flaw someone forgot to fix. The digit-run cap and multi-character subword merges exist because they make ordinary language modeling — the overwhelming majority of what these models are trained and used for — dramatically more efficient, per [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff). Character-level tokenization would make spelling and arithmetic trivially transparent to the model and make every other sequence roughly four times longer to process. The representation that's efficient for language is exactly the one that's opaque for character- and digit-level manipulation — you don't get to pick a tokenization that's optimal for both without giving something up on one side.

**Related:** [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table), [Tokenizing Tricky Strings](/learn/llm-foundations/tokenizing-tricky-strings), [Tokenization Gotchas That Break Prompts](/learn/llm-foundations/tokenization-gotchas-that-break-prompts), [Chain-of-Thought and Test-Time Compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute), [The Vocab-Size vs Sequence-Length Tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff)
