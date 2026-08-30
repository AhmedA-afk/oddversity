---
title: "Implementation: Forcing Every Claim to Cite Its Source"
track: "hallucinations"
status: live
summary: "Generate with span-level citations and mechanically reject any sentence that doesn't have one."
duration: "8 min read"
---

[Citations and attribution](/learn/hallucinations/citations-and-attribution) makes the case for why every claim should point at a source. This lesson makes it a mechanical guarantee instead of a polite request — a post-generation check that drops or flags sentences with no citation, rather than trusting the model to have followed the instruction.

## What we're building

A pipeline that tags retrieved spans with ids, requires the model to cite one after every factual sentence, and then runs a checker that finds sentences with no citation and either strips them or flags the whole answer for review. We'll see the difference between an answer that merely *looks* well-cited and one that's been mechanically verified to be.

## Setup

Pure Python again, building on the `docs`, `retrieve`, and `call_llm` scaffolding from [the RAG pipeline lesson](/learn/hallucinations/rag-grounding-pipeline-impl).

## Build it

### Step 1: Tagging chunks with span ids

```python
def tag_spans(chunks):
    """Splits each chunk into sentence-level spans with stable ids,
    so citations can point at a sentence, not just a whole document."""
    spans = []
    for c in chunks:
        sentences = re.split(r"(?<=[.!?])\s+", c["text"].strip())
        for i, sent in enumerate(sentences):
            if sent:
                spans.append({"id": f"{c['id']}.{i}", "text": sent})
    return spans
```

> **Why this step?** Document-level citations ("[doc1]") tell a reviewer which document to search — span-level citations ("[doc1.0]") tell them exactly which sentence, cutting verification time from minutes to seconds. This is the same narrowing principle as [citations and attribution](/learn/hallucinations/citations-and-attribution)'s point that a narrower span is cheaper to check.

### Step 2: The citation-required prompt

```python
def build_cited_prompt(query, spans):
    context = "\n".join(f"[{s['id']}] {s['text']}" for s in spans)
    return f"""Answer the question using only the spans below. After
every sentence in your answer, add the id of the span it's based on,
in brackets, like [doc1.0]. Do not write any sentence you cannot
attach a span id to.

Spans:
{context}

Question: {query}
Answer:"""
```

### Step 3: Parsing citations out of the answer

```python
def split_sentences(answer):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", answer.strip()) if s.strip()]

def extract_citation(sentence):
    match = re.search(r"\[([\w.]+)\]", sentence)
    return match.group(1) if match else None
```

### Step 4: The post-check — drop or flag uncited sentences

```python
def enforce_citations(answer, spans, mode="drop"):
    valid_ids = {s["id"] for s in spans}
    kept, dropped = [], []

    for sentence in split_sentences(answer):
        cid = extract_citation(sentence)
        if cid and cid in valid_ids:
            kept.append(sentence)
        elif mode == "drop":
            dropped.append(sentence)
        else:  # mode == "flag"
            kept.append(f"{sentence} [UNVERIFIED]")

    return " ".join(kept), dropped
```

> **Why this step?** This is the difference between decorative citations and enforced ones. A citation instruction alone produces citations the model *usually* includes; this check makes an uncited or fabricated-id sentence a build-time failure of the answer, not a style lapse a reviewer might miss.

## Run it

Suppose the model, prompted with `build_cited_prompt`, produces:

```text
The processing fee is $2 [doc1.0]. This fee applies to all subscription
plans including annual ones.
```

The first sentence cites `doc1.0`, a real span id — it survives the check. The second sentence has no bracketed citation at all: the model added a plausible-sounding generalization about annual plans that was never in the source. Running `enforce_citations` in `"drop"` mode removes it entirely, leaving only "The processing fee is $2 [doc1.0]." In `"flag"` mode it survives but is marked `[UNVERIFIED]` for a human reviewer to catch before it ships.

Either behavior is a real improvement over shipping the two-sentence answer as-is: the second sentence was never grounded in anything, and without this check it would have reached the user wearing the same confident tone as the first.

## Harden it

This check only proves a citation *exists and points at a real span* — it says nothing about whether that span actually supports the claim next to it. A model can write "The fee is $2 [doc1.0]" when `doc1.0` actually says "the fee is $5" and this checker would pass it, because it only validates the id, not the content. That gap — a real citation, a wrong claim — is exactly what [the citation verification loop](/learn/hallucinations/citation-verification-loop) closes next, using an entailment check instead of an existence check.

## Extend it

For anything feeding a downstream system rather than a human reader, don't parse citations out of free text at all — require the model to emit `{claim, span_id}` pairs as structured output validated against a schema, per [structured output decoding](/learn/hallucinations/structured-output-decoding-impl). That turns "did the model format the citation correctly" from a regex problem into a schema-validation problem, which fails loudly and predictably instead of silently.

**Related:** [Citations and Attribution](/learn/hallucinations/citations-and-attribution), [Citation Hallucination](/learn/hallucinations/citation-hallucination), [Citation Verification Loop](/learn/hallucinations/citation-verification-loop), [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations)
