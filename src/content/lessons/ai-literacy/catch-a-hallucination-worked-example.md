---
title: "Worked example: catching a hallucination"
track: "ai-literacy"
status: live
summary: "Worked example walking through a real-feeling health-claim citation check: an AI returns three authoritative-looking sources (author, journal, year, DOI), and the reader runs the e."
duration: "9 min read"
---

Three citations, three journals, three years — and one of them doesn't exist at all. Here's exactly how you'd find that out, using nothing but a browser and about five minutes.

## The setup

Say your aunt asks whether chamomile tea before bed actually helps with sleep, or whether it's just a placebo she's paying $14 a box for. You open an AI chat and ask:

```text
What does the research say about chamomile tea and sleep quality
in adults? Give me some real sources so I can look into it myself.
```

The answer comes back fast, specific, and confident — no hedging, no "I think," just a clean numbered list:

```text
Here's what the research shows:

1. Reyes, M. T., & Delgado, F. (2019). "Chamomile extract
   supplementation and subjective sleep quality in adults with
   mild insomnia: a randomized, double-blind, placebo-controlled
   trial." Journal of Clinical Sleep Medicine, 15(4), 601–609.
   doi:10.5664/jcsm.7738

2. Bergström, A., & Lindqvist, H. (2017). "Herbal interventions
   for sleep disturbance in older adults: a systematic review."
   Sleep Medicine Reviews, 33, 88–97.
   doi:10.1016/j.smrv.2016.08.004

3. Whitfield, D., Park, S., & Osei, K. (2020). "Apigenin-rich
   chamomile tea and polysomnographic sleep outcomes in adults
   over 55." International Journal of Sleep and Circadian Health,
   8(2), 112–121. doi:10.1016/j.ijscm.2020.02.014
```

This is the moment most people either screenshot the answer and move on, or feel a vague "I should probably check this" and don't, because checking a citation sounds like it requires a university login. It doesn't. [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) covers the mindset for when to bother checking at all — this page is the muscle memory once you've decided to. Everything below is clicks any of us can make.

## Step by step

You're going to run the same three checks on all three citations, cheapest first, and stop early whenever one fails. Nothing here needs a library subscription — you're checking whether a thing exists, not reading the full paper yet.

### Step 1 — Search the exact title

Open a new tab, go to `scholar.google.com` (or, since this is a health claim, `pubmed.ncbi.nlm.nih.gov`), and paste each title in quotation marks exactly as given.

- **Citation 1** ("Chamomile extract supplementation and subjective sleep quality in adults with mild insomnia...") returns no exact match. The closest hit is a 2019 paper in the *same journal* called "Chamomile extract and postpartum sleep quality: a randomized controlled trial," by three different authors — Cheng, Lin, and Wu. Similar topic, same journal, same year. Not the same paper.
- **Citation 2** ("Herbal interventions for sleep disturbance in older adults: a systematic review") returns an exact match on the first try — the publisher's own abstract page, matching author names, volume, and page numbers.
- **Citation 3** ("Apigenin-rich chamomile tea and polysomnographic sleep outcomes in adults over 55") returns nothing. Not on Scholar, not on PubMed, not on plain Google with the quotes removed. Zero hits anywhere for a five-word phrase that specific is itself a finding.

> **Why this step?** A real paper's title is a fixed string of text that exists somewhere on the internet — on its own abstract page, in someone else's reference list, in a library catalog — even if you can't read the full paper. A search engine can't "almost find" text that was never written, so a title with zero hits, on more than one engine, is real evidence. A title that returns something *close but different*, like citation 1, is a different and subtler signal: it suggests the model latched onto a real paper's shape (author count, journal, year) and swapped in different details.

### Step 2 — Look up the author

Search the lead author's name alongside their supposed field: `"M. T. Reyes" sleep medicine`, `"A. Bergström" sleep research`, `"D. Whitfield" chamomile OR sleep`.

- **Reyes, M. T.** turns up no researcher with a publication record in sleep medicine — no ORCID iD, no university page, no Google Scholar profile. The actual author of the real paper found in Step 1, Cheng, H.-M., *does* have a consistent history of sleep-related publications.
- **Bergström, A.** has a Google Scholar profile at a research institution, with a publication list that includes this exact 2017 review, co-authored with Lindqvist.
- **Whitfield, D.** has no ORCID, no faculty page, no scholarly profile anywhere under that name in any sleep-related field. Combined with the zero hits in Step 1, that's two independent checks agreeing this person, as a researcher on this topic, doesn't exist.

> **Why this step?** A name that "sounds academic" — a plausible surname, tidy initials — is trivial for a language model to generate, because it's just predicting what an author byline typically looks like. A real author leaves a trail: co-authors, an institution, other papers, a citation count. A fabricated one leaves nothing to find, because there was never a person behind it to search for.

### Step 3 — Check the journal, then the DOI

Search for the journal itself, not just the article, and paste the DOI directly into your browser after `https://doi.org/`.

- *Journal of Clinical Sleep Medicine* is real, published by the American Academy of Sleep Medicine, with its own site and archives. Pasting `doi.org/10.5664/jcsm.7738` resolves — but to the Cheng et al. postpartum paper from Step 1, not to anything by "Reyes & Delgado." Real journal, real DOI, wrong paper wrapped around it. **This is the misattribution**, confirmed at the source.
- *Sleep Medicine Reviews* is a real, indexed Elsevier journal. Pasting `doi.org/10.1016/j.smrv.2016.08.004` resolves directly to the Bergström & Lindqvist article — title, authors, and pages all match. **This one checks out.**
- *International Journal of Sleep and Circadian Health* returns no publisher, no website, no ISSN in the ISSN registry — the journal itself has no footprint, not just the article. Pasting the DOI gives "DOI not found." **This is the invention**, and it goes one layer deeper than citation 1: not just a fake paper, but a fake container to put it in.

> **Why this step?** A citation is really a chain of separate claims — this person wrote this, it appeared in this journal, you can find it at this identifier — and each link can be checked on its own. A DOI is the strongest link to pull on because it isn't a matter of judgment: it's a registry lookup that either resolves or doesn't. You're not asking "does this sound right," you're asking a system of record to prove it, and it answers.

By the end of three cheap checks, in order: citation 2 survives everything you throw at it, citation 1 turns out to be a real journal and a real DOI stitched to invented authors and a subtly wrong title, and citation 3 fails at every single layer — title, author, and journal. Notice that the failures are different *kinds* of failure. Lumping "the AI hallucinated" onto all three would have been true but useless; knowing *which* one is fake and *how* is what lets you tell your aunt "here's one solid source" instead of throwing the whole list out. That's also the core move in [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) generally — check the specific claim, not the vibe of the answer.

## Where it breaks

Citation 2 passed every check. Title, author, journal, DOI — all real, all matching. So it's safe to trust whatever the AI said it proves, right?

Not quite. Go back and reread the sentence the citation was attached to. If the AI's summary said something like "research confirms chamomile meaningfully improves sleep quality in older adults," now actually open the abstract for Bergström & Lindqvist (2017) — the real, verified paper — and read its actual conclusion:

```text
Evidence remains limited: of the six trials identified, most were
small and at meaningful risk of bias. Pooled effects on sleep
quality were modest and did not reach statistical significance
for half of the outcomes examined.
```

That is not "research confirms it works." That's "we looked, and the evidence so far is thin and mixed." The citation is completely real. The claim built on top of it is inflated. This is where citation-checking as a process quietly breaks: it's built to answer "does this source exist," and it stops there feeling done — but existing and supporting the stated claim are two different questions, and only the second one is the one you actually cared about.

**The fix** costs about sixty extra seconds: once a source clears title, author, and journal, open the abstract — always free, even behind a paywall — and check it against the specific words the AI used. Watch for a confident verb ("confirms," "proves," "shows") sitting on top of a hedged one ("may," "in a subset of," "limited evidence," "small sample," "not significant"). A real citation with an inflated claim riding on it is arguably more dangerous than an invented one, because it survives the checks most people actually bother to run.

This is also why [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine): it isn't retrieving Bergström & Lindqvist's conclusion and reporting it back to you, it's predicting a fluent-sounding sentence about chamomile and sleep, and a citation with matching structure to hang next to it. The structure can be flawless — right author, right journal, right page numbers — while the substance drifts. Confident phrasing is not evidence of accuracy either way; see [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) for why a fabricated citation and a real one get delivered in exactly the same tone.

## Takeaways

- **Check each citation on its own.** A list of three isn't one fact to trust or distrust — it's three separate claims. One being fake doesn't mean they all are; one being real doesn't vouch for its neighbors.
- **Run the checks cheapest-first and stop early.** Exact-title search, then author lookup, then journal/DOI. Any one of them failing is usually enough to drop a source — you rarely need all three.
- **A DOI is a free, instant lie detector.** Paste it after `https://doi.org/` and see what comes back: the paper you were told about, a different paper, or nothing. This takes ten seconds and catches [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) in its most checkable form — a specific, falsifiable string.
- **Existing isn't the same as accurate.** A citation can clear every structural check and still be attached to a claim stronger than the source supports. Read the abstract, not just the reference.
- **The more specific a claim looks, the more it needs checking — not less.** A named author, an exact journal, a volume and page range, a DOI: every one of those specifics is a separate thread you can pull, and pulling it is cheap. Vague claims ("some studies suggest...") are actually harder to verify and easier to let slide. Precision isn't proof. It's just more surface area to check — so check it.

**Related:** [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [Verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type) · [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine)
