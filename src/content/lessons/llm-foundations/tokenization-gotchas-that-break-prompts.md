---
title: "Tokenization Gotchas That Break Prompts"
track: "llm-foundations"
status: live
summary: "Six concrete ways tokenizer boundaries quietly break prompts, few-shot examples, and cost estimates — and how to catch each one before shipping."
duration: "7 min read"
---

Most tokenization bugs don't look like tokenization bugs. They look like "the model randomly ignored my stop sequence" or "this prompt costs way more than I expected" — and the root cause is almost always a token boundary landing somewhere you didn't expect it to.

### The mistake: assuming a word and " word" are the same token

**Why it's wrong.** Byte-level BPE tokenizers fold the leading space into the token that follows it — `"the"` and `" the"` are different vocabulary entries with entirely separate learned representations, not the same token with an extra space glued on. See [BPE vs WordPiece vs Unigram vs byte-level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram) for why this convention exists.

**Symptom.** A stop sequence set to `"END"` doesn't fire when the model actually generates `" END"` (with a leading space) as a single different token, because you were matching against the wrong token identity. Few-shot examples built by concatenating labels without checking for a leading space produce inconsistent formatting across examples, and the model picks up on that inconsistency.

**Fix.** Test stop sequences and label strings both with and without a leading space, and match against however the string actually decodes from the model's output, not how it reads on the page. When building few-shot examples programmatically, keep the whitespace before each variable slot consistent across every example.

### The mistake: treating "gpt4," "gpt 4," and "GPT-4" as equivalent input

**Why it's wrong.** These three strings can each produce a completely different token sequence — different casing, different spacing, and a hyphen versus no separator all change which merges apply. Nothing downstream treats them as "the same term with different formatting" unless something explicitly normalizes them first.

**Symptom.** A classification or retrieval pipeline built on top of an LLM behaves inconsistently on inputs a human would consider identical — matching "GPT-4" reliably but missing "gpt4" — because the two strings never shared meaningful token overlap in the first place.

**Fix.** Normalize casing, spacing, and punctuation for known entities *before* they reach the model wherever consistency matters (search indexing, exact-match classification), rather than trusting the model to treat formatting variants as equivalent on its own.

### The mistake: asking the model to reverse a string or judge a rhyme like it can see letters

**Why it's wrong.** The model's input is a sequence of multi-character tokens, not characters. Reversing `"tokenization"` requires knowing the exact letter order inside a token like `ization` — information the model was never directly shown as separate symbols, so it has to have memorized or inferred that decomposition rather than read it off the input. The mechanism is spelled out in [why LLMs struggle with arithmetic and spelling](/learn/llm-foundations/why-llms-are-bad-at-arithmetic-and-spelling).

**Symptom.** String reversal comes back subtly wrong (right letters, wrong order past the first few characters), and rhyme judgments are inconsistent on less common words whose endings got absorbed into a token the model has to decompose from memory rather than perceive directly.

**Fix.** For tasks that are genuinely character-level (reversal, letter-counting, strict rhyme checking), don't rely on the model doing it in one pass over the raw string — have it write out the string as space-separated characters first (which forces character-level tokens), or hand the task to actual code instead of the model's forward pass.

### The mistake: estimating token count from word count or "characters divided by four"

**Why it's wrong.** That ratio is a rough average for ordinary English prose — it collapses the moment your text includes code, URLs, IDs, non-English words, or emoji, all of which tokenize far less efficiently, as shown in [tokenizing tricky strings](/learn/llm-foundations/tokenizing-tricky-strings).

**Symptom.** A request that "should" fit in the context window gets truncated, or a cost estimate built on the word-count heuristic comes in noticeably under the actual bill, specifically on inputs heavy in code, structured data, or non-English text.

**Fix.** Count tokens with the actual tokenizer for the model you're calling before you rely on the number — every provider exposes one. Treat the character-per-token heuristic as a napkin estimate for plain English only, never as a budget you build a pipeline around.

### The mistake: prompt templates that interpolate variables without normalizing whitespace

**Why it's wrong.** A template like `f"Context: {context}\n\nQuestion: {question}"` silently produces different tokenization if `context` happens to start or end with extra whitespace, or if a missing space fuses two words together at the seam (`"...end.Question:"` instead of `"...end. Question:"`). The model sees one merged, unfamiliar token sequence at that seam instead of the clean tokens it saw during training-adjacent formatting.

**Symptom.** The same logical prompt performs inconsistently depending on upstream data — sometimes a retrieved document has trailing whitespace, sometimes it doesn't — and the failure looks like flaky model behavior rather than a templating bug, because nobody's looking at raw token boundaries.

**Fix.** Strip and normalize whitespace at every variable interpolation point in a template, and spot-check the fully assembled prompt's token count and boundaries near each seam, not just the template's static text.

### The mistake: reusing a token budget across models with different tokenizers

**Why it's wrong.** Token counts aren't portable. The same English paragraph produces a different token count under a byte-level BPE vocabulary of 100k than under a SentencePiece vocabulary of 32k, because the merge lists and base alphabets are entirely different (see [BPE vs WordPiece vs Unigram vs byte-level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram)). A budget tuned against one model's tokenizer doesn't transfer.

**Symptom.** Switching providers or model families causes unexpected truncation or cost changes on inputs that were previously well within budget, even though nothing about the actual text changed.

**Fix.** Recompute token counts with each model's own tokenizer whenever you support more than one backend — never assume a token budget validated on one model holds for another.

## Pre-flight checklist

- [ ] Stop sequences and label strings tested with and without a leading space
- [ ] Known entities (product names, IDs) normalized for casing/spacing before matching or indexing
- [ ] Character-level tasks (reversal, counting, strict rhyme) routed to code or a character-spaced format, not asked of the model directly on raw text
- [ ] Token counts computed with the real tokenizer, not a word-count or characters/4 estimate
- [ ] Prompt template seams (variable interpolation points) checked for stray or missing whitespace
- [ ] Token budgets recomputed per model when supporting more than one backend

**Related:** [BPE vs WordPiece vs Unigram vs Byte-Level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram), [Tokenizing Tricky Strings](/learn/llm-foundations/tokenizing-tricky-strings), [Why LLMs Struggle With Arithmetic and Spelling](/learn/llm-foundations/why-llms-are-bad-at-arithmetic-and-spelling), [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost)
