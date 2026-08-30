---
title: "Adapting Prompts Across Languages"
track: "prompt-engineering"
status: live
summary: "A prompt's length, tone, and format constraints can quietly stop holding the moment the input switches languages."
duration: "6 min read"
---

A prompt that reliably respects a length limit, a format, and a tone in English can drop every one of those constraints the moment the input switches languages — and translating the instructions doesn't always fix it.

## What it is

This lesson extends the language side of [Adapt Prompts Across Modalities and Languages](/learn/prompt-engineering/multimodal-and-localized-prompts): what changes, specifically, in a text-in/text-out prompt when the input language varies or is unpredictable, rather than fixed once per market. Three concrete problems: keeping your instructions in one language while inputs vary, non-English output quality, and localizing examples rather than just translating them.

## The mental model

Look for the parts of your prompt that are *units*, not just words — a word count, a "formal tone," a currency symbol, a name-order assumption. Each one quietly encodes an assumption about one language or script, and translating the sentence around it doesn't make the unit itself carry over as a concept.

## Why it works this way

Models are trained on a corpus where English (and a handful of other high-resource languages) dominates most instruction-following demonstrations, so their calibration for exactly what "concise," "polite," or "three bullet points" cashes out to is strongest in the best-represented languages. There are structural mismatches on top of that: CJK languages don't delimit words with spaces, so "word" is an ambiguous unit for a length constraint; heavily inflected languages change what "the same sentence" looks like in token count for the same meaning; and instructions issued in English while the output is expected in another language ask the model to juggle two languages' conventions in the same generation, which is exactly where a constraint is most likely to get half-followed.

## A concrete example (shown)

A prompt that works cleanly in English:

```text
Summarize the support ticket in exactly 3 bullet points. Each bullet must
be under 15 words. Respond in the same language as the ticket.
```

On an English ticket, this reliably produces 3 bullets, each clearly under the word limit. On a Japanese ticket, the same prompt can produce 3 bullets that run oddly long or short, because Japanese doesn't tokenize into space-separated words the way the "15 words" constraint assumes — there's no clean way for the model to apply a word count to a script that doesn't mark word boundaries. It may also occasionally slip a phrase back into English despite the last instruction.

The fix:

```text
Summarize the support ticket in exactly 3 bullet points. Each bullet must
be 40 characters or fewer (count characters, not words). Respond in the
same language as the ticket, including for these bullet points themselves
— do not switch to English at any point in the response.
```

Two changes: "words" became "characters" — a unit that's well-defined in any script — and the language instruction was scoped explicitly to cover the bullets themselves, not just prose, removing the ambiguity about whether the constraint applied to the whole response or just its framing.

## Where it shows up

- Multilingual support and chat bots handling whatever language the user happens to type in
- Classification and extraction prompts operating on user-generated text across a broad user base
- Few-shot examples that are all written in English while production inputs aren't — the model tends to imprint the example's language and structure onto its output even when told to match the input's language, the same [format-leakage](/learn/prompt-engineering/few-shot-format-leakage) mechanism that shows up in monolingual prompts
- Content moderation, where a rule calibrated on English slang and idiom silently under- or over-triggers on other languages

## Watch out for

- Assuming a length or format constraint measured in "words" transfers to every language — swap to characters, sentences, or a fixed enumerated structure when scripts vary.
- Translating your few-shot examples word-for-word instead of writing genuinely native ones — a stilted, translated example teaches the model a stilted, translated *style*, not the register a native speaker would actually use.
- Trusting your English eval score as evidence the prompt works elsewhere — build a real eval slice per supported language rather than assuming transfer; see [Building an Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset).

## Where next

The next lesson does the same treatment for a different axis of "the input isn't the clean text you designed against": [Worked Example: A Multimodal Image-Plus-Text Prompt](/learn/prompt-engineering/multimodal-prompt-worked).

**Related:** [Adapt Prompts Across Modalities and Languages](/learn/prompt-engineering/multimodal-and-localized-prompts) · [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage) · [Building an Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) · [Worked Example: A Multimodal Image-Plus-Text Prompt](/learn/prompt-engineering/multimodal-prompt-worked)
