---
title: "Worked Example: Dissecting One Real Hallucination"
track: "hallucinations"
status: live
summary: "One fabricated citation, taken apart span by span, into a reusable supported / unsupported / unverifiable annotation method."
duration: "7 min read"
---

You can talk about hallucination in the abstract for a long time without building the one skill that actually catches it: reading a specific piece of model output and pointing at exactly which words are the problem. This lesson does that once, carefully, on a single transcript, and comes out the other side with a method you can reuse on anything.

## The setup

*The transcript below is constructed for this lesson to demonstrate what a fabricated citation looks like. Treat every number, name, and link in it as illustrative - none of it refers to a real study.*

**User prompt:** "What does the research say about how many retail investors lost money in the flash crash?"

**Model output:**

```text
According to Smith et al. (2019) in the Journal of Finance, approximately
62% of retail investors who traded during the flash crash sustained net
losses, with an average drawdown of 4.3%. The study is available at
https://doi.org/10.1111/jofi.12345.
```

Read on its own, this looks like exactly what a well-sourced answer should look like: a named study, a reputable journal, two specific numbers, a resolvable-looking link. That surface polish is the entire problem - there is nothing about the sentence's *shape* that distinguishes it from a real citation.

## Step by step

**Step 1: Isolate each claim as its own span.**

```text
[1] "the flash crash"
[2] "Smith et al. (2019)"
[3] "Journal of Finance"
[4] "approximately 62%"
[5] "average drawdown of 4.3%"
[6] "https://doi.org/10.1111/jofi.12345"
```

> **Why this step?** Hallucination usually isn't all-or-nothing across a response - it's localized to specific spans. Treating the whole sentence as one blob either over-trusts it (because most of it sounds fine) or over-rejects it (throwing away the parts that are actually fine). Splitting into spans is what makes graded judgment possible.

**Step 2: Label each span supported, unsupported, or unverifiable.**

| Span | Label | Why |
|---|---|---|
| [1] "the flash crash" | Supported / generic | Refers to a real category of market event; carries no invented specifics on its own |
| [2] "Smith et al. (2019)" | Unverifiable | A common author surname and a plausible year - exactly the shape training data would make easy to generate, impossible to confirm from the claim alone |
| [3] "Journal of Finance" | Interpolated | A real, prestigious journal name attached to lend the whole sentence credibility - real venue, unconfirmed paper |
| [4] "approximately 62%" | Unsupported | A precise statistic with no traceable source; nothing in the prompt or any cited evidence produced this number |
| [5] "average drawdown of 4.3%" | Unsupported | A second precise number, compounding the first - two independent invented figures now reinforce each other's appearance of rigor |
| [6] the DOI URL | Unsupported, but structurally valid | Matches the correct DOI syntax for that publisher's prefix - it *could* be a real DOI - but resolving it turns up nothing that matches this claim |

> **Why this step?** "Unverifiable" and "unsupported" are doing different work here. Span [2] isn't provably false - a Smith could have written this in 2019 - it's just impossible to confirm from what's in front of you, which is its own risk category. Span [4] is stronger: a specific number with zero grounding is a much cleaner signal of fabrication than a plausible-sounding name.

**Step 3: Notice what makes the fabricated DOI dangerous specifically.**

A DOI has a real, checkable syntax: a registrant prefix (`10.1111` is genuinely Wiley's, who publishes the Journal of Finance) followed by a suffix the publisher assigns. The model has clearly learned that syntax pattern from real examples, and reproduces it perfectly - which is exactly why it's convincing. It is not gibberish; it is a well-formed key that happens to open no door. This is the same mechanism as [next-token-mechanics-of-fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication): the model produces the statistical *shape* of a citation, not a retrieved one.

## Where it breaks (and the fix)

The annotation above only becomes useful once someone actually resolves the DOI and searches for the paper - the labeling exercise identifies *where to look*, it doesn't replace looking. If nobody follows through and clicks the link, this table is just a more organized way of restating the hallucination. The fix that closes the loop is requiring citations to be independently verifiable before they ship, not just present: [enforcing-citations-impl](/learn/hallucinations/enforcing-citations-impl) and [citation-verification-loop](/learn/hallucinations/citation-verification-loop) cover pipelines that actually resolve links and cross-check author/venue/year combinations rather than trusting that plausible-looking metadata means real metadata.

## Takeaways

The reusable method here is small and applies to any model output, not just citations: **split the claim into spans, label each one supported / unsupported / unverifiable, and treat "unverifiable" as its own risk category rather than rounding it up to "probably fine."** You'll see this exact three-way label used again across this track whenever a lesson dissects a transcript - it's the common vocabulary for talking precisely about which part of an answer is the problem, rather than declaring the whole response either trustworthy or not.

**Related:** [How Next-Token Prediction Produces Fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication), [Citation Hallucination](/learn/hallucinations/citation-hallucination), [Fabricated Citations Deep Dive](/learn/hallucinations/fabricated-citations-deep-dive), [Citation Verification Loop](/learn/hallucinations/citation-verification-loop), [Hallucination, Error, Bug, and Bias](/learn/hallucinations/hallucination-vs-error-vs-bug)
