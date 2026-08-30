---
title: "Stuff It or Retrieve It"
track: "context-engineering"
status: live
summary: "The first decision in any context pipeline: does this knowledge base fit in the window, or does it need a fetch step?"
duration: "6 min read"
---

Before you write a single line of retrieval code, you owe yourself one honest question: does the thing you're trying to give the model actually need retrieval at all, or does it just need to be pasted in?

## What it is

Every piece of external knowledge an agent needs — a policy document, a codebase, a customer's history, a product catalog — has to get into the context window somehow. There are exactly two ways to do that. **Stuffing** puts the whole knowledge base in the prompt on every call, unconditionally. **Retrieval** keeps the knowledge base outside the window and pulls in only the slice a given query needs. [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) names this same fork; this lesson is about the decision procedure for picking a side, not the mechanics of either one.

## The mental model

Think of it as a librarian question, not an engineering question: "could a person hold this whole thing in their head while answering, or would they need to walk to the shelf?" A ten-page onboarding doc, a person holds in their head — that's stuffing. A shelf of five thousand support tickets, nobody holds that — that's retrieval. The size of the corpus relative to what fits comfortably in a context window (with room left for the conversation, the system prompt, and the model's own reasoning) is the first and biggest factor, and it's a factor you can measure before writing any code.

## Why it works this way

Stuffing is simple because it removes an entire failure mode: there's no ranking step to get wrong, no query to under-specify, no relevant chunk that silently didn't make the cut. When the corpus is small, that simplicity is free — you pay a few thousand extra tokens per call and get perfect recall in exchange, because "recall" is trivial when everything is already present.

Retrieval exists because stuffing's cost doesn't stay flat. Tokens are billed whether the model uses them or not, so a knowledge base that keeps growing turns every single call more expensive, even for questions that only ever touch a tiny corner of it. Past a certain size, dumping everything in also stops being harmless to quality — irrelevant content competes for the model's attention with the one paragraph that mattered, a dynamic covered in [Context Rot](/learn/context-engineering/context-rot). Retrieval trades a bit of latency and engineering (embedding, indexing, ranking) for a context window that stays small and relevant no matter how large the underlying knowledge base grows. [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) covers the retrieval side of that trade in full; this lesson is about recognizing which side of the fork you're standing on.

## A concrete example (shown)

**Case A: a 40-page internal style guide.** Say it renders to roughly 18,000 tokens. A typical modern context window has hundreds of thousands of tokens of headroom. Stuffing the whole guide costs a small, fixed slice of every call and buys you zero retrieval-failure risk — the model can quote any rule, cross-reference section 3 against section 12, and never miss a chunk boundary that split a rule from its exception. There's no query to write, because there's no search — the answer is: stuff it.

**Case B: a support knowledge base with 6,000 articles, growing by dozens a week.** Even a terse summary of each article — one line — puts you at tens of thousands of tokens before a single real question is asked, and the corpus doesn't stay this size. Worse, most questions only ever touch one or two articles; stuffing means paying for the other 5,998 every time. This is a retrieval problem: embed the articles, index them, and pull back the handful that match a given ticket. The answer is: retrieve it.

The tell isn't "how many documents" in the abstract — it's *does this specific corpus, at its current and near-future size, fit comfortably alongside everything else that has to share the window*. A 40-page guide clears that bar. A knowledge base with thousands of live entries does not.

## Where it shows up

This decision sits upstream of almost everything else in this module. [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) and [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value) both assume you've already decided the corpus is too big to stuff and need a strategy for fetching pieces of it. Long-document reasoning — cross-references, whole-document synthesis — pulls the decision back toward stuffing even at larger sizes, which is exactly what [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) covers next.

## Watch out for

- **Treating corpus size as a one-time judgment call.** A 40-page guide today can be a 400-page guide in a year. Revisit the decision when the corpus grows by an order of magnitude, not just when you first build the feature.
- **Stuffing because retrieval feels like more work.** It often is more work up front — but "more work now" and "wrong choice" aren't the same thing, and the wrong choice compounds every time the corpus grows.
- **Retrieving a corpus that would have fit.** Building an embedding pipeline and a vector store for ten documents adds ranking failure modes and latency you didn't need to accept — measure the token cost of just stuffing it before assuming retrieval is required.

## Where next

[When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) sharpens this further: even a corpus large enough to feel like a retrieval problem can still be worth stuffing whole, if the task needs the model reasoning across the entire thing at once.

**Related:** [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) · [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) · [Context Rot](/learn/context-engineering/context-rot) · [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) · [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value)
