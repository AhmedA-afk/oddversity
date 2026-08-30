---
title: "Deep Dive: Why Fabricated Citations Look So Real"
track: "hallucinations"
status: live
summary: "Invented citations have valid structure because the model learned the format distribution, not the reference database, and those are different skills."
duration: "8 min read"
---

*Optional depth: this extends [citation hallucination](/learn/hallucinations/citation-hallucination) with the mechanism behind why a fabricated reference is structurally indistinguishable from a real one — read the base lesson first if you haven't.*

A fabricated citation doesn't look almost right. It looks completely right, down to a docket number in the correct format and a DOI that resolves the way DOIs are supposed to look before you actually click it. That's not luck, and it's not the model "trying" to deceive anyone. It's what you get when two very different tasks get bundled into one and only one of them was ever learnable at scale.

## Two tasks wearing one costume

Producing a citation is actually two separate acts: (1) generating something in the *shape* of a citation — author names, a year, a journal or reporter, volume and page numbers, a DOI or docket format — and (2) pointing at one specific, real document that actually exists and actually says the thing being cited. Those two acts have wildly different statistics in training data.

The *shape* of a citation is one of the most repeated, rigidly patterned structures in academic and legal text. Millions of examples teach the model exactly what "Author, A. B., & Author, C. D. (Year). Title. *Journal*, Volume(Issue), pages. https://doi.org/..." looks like, character by character. That distribution is easy to learn and the model learns it extremely well — well enough to generate a citation for a paper that has never existed and have it pass a glance-test from a trained reader.

Pointing at one specific real document is a completely different kind of task: exact recall of a low-frequency, often unique fact. Most individual papers, cases, or filings appear a handful of times in training data, if at all, and the model has no mechanism to say "I have not actually memorized this specific one" mid-generation. So it does the part it's good at — the shape — and lets its language-modeling instinct (produce the statistically likely continuation) supply the specifics. The two halves fuse seamlessly because nothing in the generation process marks where recall gave way to invention.

## The legal-brief pattern

The now-familiar case where a filed legal brief cited a batch of court cases that turned out not to exist follows this mechanism exactly, and it's worth tracing why it fooled a human reader before it fooled a judge. Each fabricated case had:

- A plausible party-name format (`Smith v. National Freight Corp.`) — the kind of name pattern that appears constantly in real case law and is trivial to generate.
- A citation in the correct reporter-and-volume shape (`482 F.3d 913`) — structurally a real-looking Federal Reporter citation, just pointing at nothing.
- A holding that was *topically* on point for the argument being made — because the model was asked to support a specific legal claim, and the most likely continuation of "a case supporting this claim looks like..." is exactly a case that supports the claim, real or not.

None of that is evidence of an unusually deceptive failure. It's the same format-fluency described above, applied under real professional stakes, with nobody in the loop actually opening the reporter and checking.

## Why this looks *more* trustworthy than a hedge, not less

This is the part worth sitting with: a fabricated citation is more convincing than an honest "I'm not sure of the exact source," because polish reads as verification. A hedge signals uncertainty and invites scrutiny. A fully-formed citation signals "already checked" and discourages it — the entire social function of a citation is to let the reader *skip* verification. When the citation is fake, that skip is exactly what lets it through. [Confidence and uncertainty signals](/learn/hallucinations/confidence-and-uncertainty-signals) covers the general version of this: fluency and accuracy are produced by different parts of the process and don't move together, so the surface of the text gives you no signal at all here.

## The detection surface, precisely

The practical consequence of "shape is learned, content is guessed" is a clean detection rule: **a fabricated citation is format-valid but existence-invalid.** You cannot find it by reading — the format check will pass every time. You can only find it by resolution: does the DOI resolve, does the docket number pull up a real filing, does the paper's actual abstract say anything like what's being attributed to it. This is exactly the same "correct shape, fabricated content" pattern behind [code hallucination and package slop](/learn/hallucinations/code-hallucination-and-package-slop) (a package name with a plausible naming convention that isn't registered) and [tool-call hallucination](/learn/hallucinations/tool-call-hallucination) (a call with a syntactically valid schema to a tool that was never defined) — anywhere a model can pattern-complete a structured reference without ever touching the thing it refers to, this failure shows up in the same shape.

## Where the fix has to live

Because the failure is undetectable from the text itself, the fix can't be textual either. This module previews it here and builds it as running code in [the citation-verification loop](/learn/hallucinations/citation-verification-loop): resolve every reference against a real index before it ships, and treat "format looks right" as exactly zero evidence of "content is real." The two are, mechanically, unrelated skills the model happens to perform in the same breath.

**Related:** [Citation Hallucination: Fabricated Sources That Look Completely Real](/learn/hallucinations/citation-hallucination), [Citation Verification Loop](/learn/hallucinations/citation-verification-loop), [Code Hallucination and Package Slop](/learn/hallucinations/code-hallucination-and-package-slop), [Confidence and Uncertainty Signals](/learn/hallucinations/confidence-and-uncertainty-signals)
