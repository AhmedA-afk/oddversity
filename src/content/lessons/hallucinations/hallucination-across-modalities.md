---
title: "Variants: Hallucination in Text, Code, Vision, and Structured Output"
track: "hallucinations"
status: live
summary: "The same fabrication mechanism shows up differently in prose, code, images, and JSON - and each shape is easy or hard to catch for its own reason."
duration: "6 min read"
---

Everything in this module so far has used a prose example - a fake citation, an overridden date. The underlying mechanism ([next-token-mechanics-of-fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication): sample the most plausible-looking continuation, with nothing checking it against reality) doesn't care what format the output takes. Point it at code, images, or structured data, and it produces the exact same kind of confident invention, wearing a different costume each time.

## Text: a fabricated fact

**How it shows up:** A specific, checkable claim - a statistic, a date, a name - stated with the same fluency as a true one. "Roughly 62% of respondents..." with no survey behind it.

**Crisp example:** "The founding CEO of the company was appointed in 1998" when no such appointment date exists anywhere in the model's training data or the supplied context - a specific, invented year attached to a real-sounding role.

**What makes it easy or hard to catch:** Easy when the claim is independently verifiable against a known source - a quick search resolves it. Hard when the claim is about something obscure enough that verification requires real research, or vague enough ("many experts believe...") that it resists a clean true/false check at all.

## Code: an invented API method

**How it shows up:** A method call, parameter, or import that has the correct *shape* for the library's conventions but doesn't exist.

**Crisp example:** Generated code calls `pandas.DataFrame.fast_merge(other, on="id")` - `fast_merge` sounds exactly like a real pandas method (there's `merge`, there's a documented performance angle to joins), but it isn't one. The call is syntactically valid Python; it just fails at runtime with an `AttributeError`.

**What makes it easy or hard to catch:** Easier than a lot of text hallucination, because running the code often surfaces the error immediately - a runtime exception is a strong, cheap signal. Harder when the invented method or argument doesn't error but silently does the wrong thing, or when the hallucinated import is a plausible-sounding *package name* that doesn't exist at all and gets installed from an untrusted source - the "package slop" problem covered in full in [code-hallucination-and-package-slop](/learn/hallucinations/code-hallucination-and-package-slop).

## Vision: a described object that isn't there

**How it shows up:** A vision-language model asked to describe or answer questions about an image reports an object, person, or detail that the image simply does not contain - a dog in a photo with no dog, a "red car in the background" when the background is empty.

**Crisp example:** Shown a photo of an empty conference room, a model captions it as "a woman presenting to an audience of about ten people" - filling in the statistically typical contents of a "conference room" scene rather than only reporting the pixels actually present.

**What makes it easy or hard to catch:** Hard, structurally: there's no cheap automated way to re-derive "what's actually in this image" independent of another model's judgment, unlike code you can execute or text you can cross-reference. Catching it usually requires either a human check or a second, differently-prompted model pass looking specifically for unsupported objects - the same cross-checking principle as [ensemble-cross-checking](/learn/hallucinations/ensemble-cross-checking), applied to a modality where "the source of truth" is a fixed image rather than a retrievable document.

## Structured output: an invalid-but-well-formed field

**How it shows up:** A JSON (or XML, or other schema-constrained) response that parses cleanly and matches the expected shape, but contains a field value that's fabricated rather than derived from real input.

**Crisp example:** Asked to extract structured data from an invoice, a model returns valid JSON - `{"invoice_number": "INV-2024-0043", "due_date": "2024-11-15", "vendor_tax_id": "84-1927365"}` - where the tax ID field was never present anywhere in the source invoice and was invented to fill a schema slot the model felt obligated to complete.

**What makes it easy or hard to catch:** The schema validity is easy to check (does it parse, does it match the type) and gives false confidence, because that check says nothing about whether each *value* is real. Catching the actual problem requires validating field values against the source document, which is the same grounding problem as text hallucination, just wearing brackets - see [constrained-generation-concept](/learn/hallucinations/constrained-generation-concept) and [structured-output-decoding-impl](/learn/hallucinations/structured-output-decoding-impl) for where constraining the *shape* helps and where it doesn't.

## Decision table

| Modality | Typical tell | Cheapest check | Ease of catching |
|---|---|---|---|
| Text | A precise, checkable claim with no source | Retrieval / search cross-reference | Medium - depends on obscurity |
| Code | A plausible but nonexistent API surface | Actually execute it | Easy for hard errors, hard for silent wrong behavior |
| Vision | An object or detail absent from the image | Second-pass or human re-check against the image | Hard - no cheap ground truth |
| Structured output | A schema-valid field with a fabricated value | Validate values against the source, not just the schema | Medium - schema checks give false confidence |

## How to prioritize

Schema validity, syntax validity, and fluency are all cheap to check and all correlate weakly with actual truth - that's the trap across every one of these modalities. Spend your verification budget where the cheap check *doesn't* already cover you: code gets a lot of free protection from just running it, so prioritize catching the silent-failure cases; structured output needs value-level checks since format-level ones are nearly free and nearly useless on their own; vision needs a genuinely independent second look, since there's no automatic re-derivation of ground truth at all. Code and tool-call hallucination get a full module's worth of treatment ahead - [tool-call-hallucination](/learn/hallucinations/tool-call-hallucination) and [tool-call-argument-fabrication](/learn/hallucinations/tool-call-argument-fabrication) - because the "plausible but nonexistent" pattern shown above compounds badly once a model is calling real external tools rather than just writing text about them.

**Related:** [How Next-Token Prediction Produces Fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication), [Code Hallucination and Package Slop](/learn/hallucinations/code-hallucination-and-package-slop), [Constrained Generation Concept](/learn/hallucinations/constrained-generation-concept), [Domain-Specific Hallucination Variants](/learn/hallucinations/domain-specific-hallucination-variants), [Ensemble Cross-Checking](/learn/hallucinations/ensemble-cross-checking)
