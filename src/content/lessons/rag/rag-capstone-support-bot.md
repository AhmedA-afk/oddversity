---
title: "Capstone: Build a Grounded Support Bot"
track: "rag"
status: live
summary: "A capstone spec for a citation-grounded, refusal-capable support bot with acceptance criteria, milestones, and a small eval set — not a tutorial."
duration: "7 min read"
---

This is the assignment where RAG stops being a diagram and starts being a thing someone can actually break. You're building a support bot over real documentation that cites exactly where each claim came from, and — the part almost every weekend demo skips — knows when to shut up instead of guessing.

There's no numbered walkthrough here. You've already built the pieces in [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end); this page is the spec you build against. Treat it the way you'd treat a ticket from a product manager: the acceptance criteria are non-negotiable, the implementation is yours.

## The brief

Pick a real, moderately sized documentation set — a library, an API, a product — and build a bot that answers user questions from it. Not "answers questions in general with the docs as flavor text." Answers *only* from what's actually in the corpus, and says so when it can't.

Imagine the person asking is a real user of that product: a developer stuck on an API's auth flow, a customer wondering if a feature exists. They don't want a confident paragraph that's half-invented. They want the two sentences from the docs that answer their question, with a pointer to where those sentences live — or an honest "I don't see that covered here, try [this page]." That second behavior is the one that separates a capstone from a chatbot demo. Most RAG side projects nail the happy path and fall apart the moment the answer isn't in the corpus; this spec makes the unhappy path a graded requirement, not an afterthought.

Scope it so you can actually finish: one corpus, one bot, a golden set small enough to read in one sitting but large enough to catch regressions.

## Acceptance criteria

Your capstone isn't done because it runs — it's done when these are all true and you can demonstrate it, not just assert it.

- [ ] Every factual claim in a bot answer is backed by at least one retrieved source, and the answer surfaces that source (doc title, section, or URL) alongside the claim
- [ ] Citations are checkable — a reviewer can click or look up the cited chunk and confirm it actually supports the claim (no citing a doc that doesn't contain the fact)
- [ ] When retrieval comes back empty or below a relevance bar, the bot refuses or hedges explicitly instead of answering from the model's general knowledge — see [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) for the mechanics of enforcing this
- [ ] A golden set of at least 20–30 question/answer pairs exists, each with the expected source document(s) noted, including a deliberate subset of out-of-scope questions the bot should refuse
- [ ] An eval script runs the golden set automatically and reports at minimum: retrieval hit rate against expected sources, and a groundedness judgment per answer (see [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality))
- [ ] You can rerun the eval after a pipeline change and get a comparable number — not a vibe, a score you can put next to the previous score
- [ ] The ingestion pipeline (raw docs → chunks → index) runs from a single script or command, so the whole thing is reproducible from scratch
- [ ] There's a working interface — CLI or minimal web UI — where a person who isn't you can type a question and get an answer

If you can't check every box, that's fine — ship what's true and mark the rest as known gaps in your README. An honest gap list is itself evidence you understand what "done" means for a grounded system.

## Suggested corpus & stack

Don't overthink the corpus choice — the temptation is to spend a week finding the "perfect" dataset. Pick something with roughly 50–300 pages of real prose (not just API tables), stable enough that you're not chasing a moving target:

- **Docs of an actively maintained open-source project** — a library's official docs site, cloned or scraped (FastAPI, Postgres, a CLI tool you already use). Real docs have the mess real corpora have: inconsistent headings, code blocks mixed with prose, cross-references.
- **A public API's reference docs** — good for testing whether your bot can distinguish "this endpoint exists" from "this endpoint doesn't."
- **Your own project's README + wiki + issues**, if you maintain something — bonus points for a corpus you can validate answers against personally.

Stack, kept free end to end:

- **Embeddings**: an open-source sentence-transformer running locally (no API cost, no rate limit) or a provider's free tier if you'd rather not manage local inference.
- **Vector store**: something that runs with no server to babysit — an embedded store or a local index is plenty at this scale. See [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) if you want the tradeoffs spelled out; at a few hundred pages of chunks, almost any option here is overkill in the good way.
- **Chunking**: start with whatever [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) recommends as a default, then come back and tune it once your eval set exists — tuning before you can measure is just guessing with extra steps.
- **Generation**: any LLM with a usable free tier or a local model. The bot's job is to compress and cite retrieved text, not to be clever, so you don't need your biggest model here.
- **Eval**: a plain script over your golden set — JSON in, scored JSON out. No framework required.

## Milestones

Each milestone is a capability you can demonstrate, not a step you check off a tutorial. Do them roughly in order; skipping the eval milestone to "add more features first" is the single most common way these projects stall.

1. **Retrieval actually retrieves.** Given a query, your pipeline returns chunks that a human would agree are relevant, most of the time, on manual spot-checks across a dozen varied questions.
2. **Answers cite real sources.** The bot produces an answer plus a citation, and the citation genuinely supports the claim when you go check it — not just a doc title tacked on because the prompt asked for one.
3. **Refusal works under pressure.** Feed it questions the corpus doesn't cover — including ones phrased to sound like it might — and it declines instead of confabulating. This is where [Corrective / Self-RAG](/learn/rag/corrective-self-rag) ideas earn their keep: judging your own retrieval before answering from it.
4. **A golden set exists and an eval score comes out the other end.** Twenty-plus labeled examples, a script, a number. This is the milestone that turns "I think it got better" into "it got better."
5. **One deliberate improvement, measured.** Change one thing — chunk size, add [hybrid search](/learn/rag/hybrid-search-lexical-and-vector), add a [reranker](/learn/rag/reranking-retrieved-results), rewrite queries before retrieval — and show the eval score move because of it. If it doesn't move, that's a real result too; report it.
6. **Someone else can run it.** A stranger clones your repo, runs one setup command, and gets a working bot without asking you anything. This is the milestone most people skip and the one that separates a capstone from a personal script.

## What good looks like

The bar isn't "it answered my test question correctly in the demo." It's a system that behaves consistently when you stop being gentle with it. Concretely: paraphrase your golden-set questions five different ways and the bot still finds the right source most of the time, not just for the exact phrasing you tested during development. Ask it something adjacent-but-uncovered and it refuses cleanly instead of blending a real citation with an invented detail. Your eval report includes the failures, not just the wins — a golden set where everything passes on the first run usually means the golden set is too easy, not that the bot is finished. And the repo has a short README explaining what you chose and why (chunk size, retrieval method, refusal threshold) — decisions with reasons attached are what make this a capstone rather than a script that happened to work once.

If you want a north star for how deep the "grounded" behavior can go before you start extending, skim [RAG: The Whole Game](/learn/rag/rag-whole-game) — it's the same shape of system, one level more mature.

## Extensions

Once the core spec is solid, these are worth your remaining time roughly in this order of payoff:

- **Hybrid retrieval.** Add lexical search alongside vector search — docs are full of exact terms (function names, error codes) that embeddings alone under-serve. See [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector).
- **Query rewriting.** Expand short, underspecified user questions into something retrieval can actually work with, per [Query Rewriting and Expansion](/learn/rag/query-rewriting-and-expansion).
- **Metadata filtering.** If your corpus has versions or product tiers, let users scope answers to "docs for v2 only" — see [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval).
- **Contextual retrieval.** Prepend chunk-level context before embedding so isolated chunks stop losing the surrounding meaning — [Contextual Retrieval](/learn/rag/contextual-retrieval).
- **Agentic behavior.** Let the bot decide to retrieve again, reformulate, or escalate to "I need to search differently" rather than answering off one retrieval pass — [Agentic RAG](/learn/rag/agentic-rag).
- **Multi-turn memory.** Handle follow-up questions that depend on the previous answer without re-explaining the whole context each time.
- **A confidence signal.** Surface something like "low confidence, verify against the linked doc" when retrieval scores are borderline, rather than presenting every answer with the same tone of certainty.

Ship the core spec first. Every extension above is worth more once the base bot actually refuses when it should — a clever reranker on top of a system that still hallucinates is polish on the wrong problem.

**Related:** [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end) · [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Corrective / Self-RAG](/learn/rag/corrective-self-rag) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Choosing a Vector Database](/learn/rag/choosing-a-vector-database)
