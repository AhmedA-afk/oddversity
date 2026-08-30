---
title: "Tokenizing Tricky Strings"
track: "llm-foundations"
status: live
summary: "Run emoji, code, a plain number, a URL, and a non-English word through a real tokenizer and watch token counts stop matching intuition."
duration: "7 min read"
---

If you've ever pasted something short into a model and been told it's "surprisingly expensive," this is usually why: token count and character count only loosely agree, and the gap widens fast on exactly the kind of input people paste without thinking twice.

## The setup

We'll run five short strings through a byte-level BPE tokenizer — the family described in [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding), the kind behind GPT-3.5/GPT-4-class models via a library like `tiktoken`:

```python
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")

for s in ["🎉", "👨‍👩‍👧‍👦", "12345",
          "https://oddversity.com/learn/llm-foundations",
          "kütüphanecilerimizden"]:
    ids = enc.encode(s)
    print(f"{s!r:45} -> {len(ids)} tokens: {[enc.decode([i]) for i in ids]}")
```

Exact merge boundaries depend on the specific tokenizer and vocabulary you run — what follows is representative of the real behavior, not a guarantee of the precise split you'd get from every vocabulary. The mechanism behind each is what matters, not the exact digit count.

## Step by step

### 🎉 — a single common emoji

A widely-used emoji like 🎉 is common enough in training data (social media, chat logs, code comments) to have earned its own dedicated token — one token in, one token out.

> **Why this step?** This is the case people wrongly generalize from. One familiar emoji costing one token creates the intuition that "emoji are cheap," which the next example breaks immediately.

### 👨‍👩‍👧‍👦 — a family emoji built from a ZWJ sequence

What looks like one emoji is actually four base emoji (man, woman, girl, boy) glued together with invisible zero-width joiner (ZWJ) characters — a Unicode composition trick, not a single character. A tokenizer sees the underlying bytes, not the rendered glyph, so this typically fragments into several tokens: the individual person emoji plus the joiner bytes between them, something like 6–7 tokens for what visually reads as "one emoji."

> **Why this step?** Visual unit and token unit are unrelated. The tokenizer has no concept of "one emoji" — it only has bytes and its learned merges, and a compound glyph is, underneath, a run of several distinct codepoints.

### 12345 — a plain five-digit number

Byte-level BPE tokenizers built for GPT-3.5/4-class models deliberately cap how many consecutive digits can fuse into one pretoken — commonly at three — specifically because letting merges group digits arbitrarily (as GPT-2's original tokenizer did) made arithmetic worse. So `"12345"` typically splits as something like `123` + `45`: two tokens, boundary decided by that digit-count cap, with zero regard for place value.

> **Why this step?** This is a real, documented design constraint, not an accident — and it's the direct mechanism behind [why LLMs struggle with arithmetic](/learn/llm-foundations/why-llms-are-bad-at-arithmetic-and-spelling). The model never sees "one ten-thousands digit, one thousands digit, ..." — it sees two arbitrary chunks, `123` and `45`, and has to learn arithmetic on top of a representation that doesn't align with the number system it's computing in.

### A URL

`https://oddversity.com/learn/llm-foundations` is one visual "word" with no spaces, but it's built from pieces that rarely co-occur verbatim in training text: a scheme (`https`), a separator (`://`), a domain in parts, slashes, and a path. Expect something in the range of 12–16 tokens — `https`, `://`, `exploration`, `bonus`, `.com`, `/learn`, `/ll`, `m`, `-`, `found`, `ations`, roughly — more tokens than a clean English phrase of the same character length would need, because URLs fragment into many rare sub-pieces.

> **Why this step?** Punctuation-dense, low-frequency strings are exactly what subword tokenization is worst at compressing — vocabulary slots got spent on frequent natural-language substrings, and a specific URL wasn't one of them. This is also why pasting file paths, hashes, or IDs into a prompt eats context faster than the visible text length suggests.

### kütüphanecilerimizden — a Turkish word

Turkish is agglutinative: this single word roughly means "from our librarians," built by stacking suffixes onto a root (`kütüphane`, "library") the way English would use several separate words. Because BPE merges are learned from whatever mix of languages dominates the training corpus — usually English-heavy — the merges available for Turkish morphology are far coarser. Expect this one word to cost noticeably more tokens than an English word of the same length, often approaching one token every couple of characters rather than one token per whole word or common affix.

> **Why this step?** Tokenization isn't language-neutral. A vocabulary trained mostly on English text encodes English most efficiently by construction — every other language pays a real, measurable tax in tokens-per-word, which shows up directly as more expensive prompts and less usable context for non-English text.

## Where it breaks (+fix)

**It breaks** when people estimate cost or context budget by eyeballing text length. A prompt that "looks short" — a URL, an emoji-heavy message, a paragraph in Turkish or Hindi, a JSON blob — can silently cost 2–5x the tokens of English prose of similar visible length, and a model can hit its [context window](/learn/llm-foundations/context-window-mechanics) limit well before the character count suggests it should.

**The fix** is mechanical, not intuitive: count tokens with the actual tokenizer you're paying for (`len(enc.encode(text))`), not by dividing characters by four or counting words. For code and structured data specifically, budget extra — indentation, punctuation, and identifiers tokenize less efficiently than prose. For multilingual input, assume non-English text costs more tokens per character and verify rather than guess.

## Takeaways

- Token count tracks **statistical frequency in training data**, not visual or semantic unit boundaries — a glyph, a digit run, and a word are all just candidate merge targets that either paid off or didn't.
- The two most reliable "expensive" categories are **compound Unicode sequences** (emoji built from multiple codepoints) and **punctuation-dense, low-frequency strings** (URLs, code, IDs, hashes).
- The digit-grouping cap in modern tokenizers is a deliberate fix for one problem (arithmetic) that creates a different, predictable pattern (chunks that ignore place value) — worth knowing before you ask a model to do math on large numbers.
- None of this is guesswork you have to eyeball — every tokenizer library exposes an `encode` function; when the token count matters, call it.

**Related:** [Byte-Pair Encoding](/learn/llm-foundations/byte-pair-encoding), [Why LLMs Struggle With Arithmetic and Spelling](/learn/llm-foundations/why-llms-are-bad-at-arithmetic-and-spelling), [Tokenization Gotchas That Break Prompts](/learn/llm-foundations/tokenization-gotchas-that-break-prompts), [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost)
