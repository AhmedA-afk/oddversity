---
title: "Retrieval and JIT Quiz"
track: "context-engineering"
status: live
summary: "Twelve questions on the stuffing/retrieval decision, JIT loading, progressive disclosure, and budget-aware retrieval."
duration: "10 min read"
---

Twelve questions on the calls this module is actually about: when to stuff, when to retrieve, when to load just-in-time, and what happens when retrieval and a token budget collide. If a question trips you up, the feedback names exactly which lesson to revisit.

## Question 1

A team has a single 15-page internal onboarding doc (roughly 7,000 tokens) that every new-hire chatbot query might need to reference. What's the right call?

- A. Stuff the whole document into context on every call — it's small, stable, and building retrieval for it adds failure modes with no real benefit
- B. Build a retrieval pipeline immediately, since any external knowledge source should be retrieved, not stuffed
- C. Chunk it into paragraphs and embed each one before ever measuring whether stuffing would have worked
- D. Summarize it down to 500 tokens and stuff the summary instead of the original

<details><summary>Answer</summary>

**Correct: A.** At 7,000 tokens, the document fits comfortably alongside a conversation and the model's own reasoning — there's no retrieval problem to solve, and a retriever here would add ranking and chunk-boundary failure modes for a corpus small enough that none of that was needed. See [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision). **B** treats "external" as the deciding factor, but size and predictability are what actually matter, not whether the content originated outside the prompt. **C** jumps straight to infrastructure without checking whether the simpler option already works — exactly the reflex this lesson warns against. **D** throws away detail the model might need (a specific policy line, an exact number) to solve a token-cost problem that stuffing the full 7,000 tokens didn't actually have.

</details>

## Question 2

A 300-page contract has a term defined once in section 2 and referenced with legal consequences in sections 9, 15, and 28. A chunked retrieval system is asked "does the indemnification clause in section 15 apply given the affiliate definition." Why does chunked retrieval struggle here even with a good retriever?

- A. A query about section 15 has no strong topical similarity to the definitions in section 2, so a similarity-based retriever has little reason to fetch a chunk that doesn't resemble the query, even though it's required to answer correctly
- B. Chunked retrieval always fails on any document longer than 50 pages, regardless of content
- C. Retrieval only fails when the embedding model is outdated
- D. This has nothing to do with retrieval — it's purely a prompt-wording problem

<details><summary>Answer</summary>

**Correct: A.** Retrieval finds chunks that resemble the query; it doesn't know that an unrelated-looking section is a structural dependency for answering correctly. This is the core argument in [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) — cross-references spanning a document are exactly the case where stuffing the whole thing outperforms chunked retrieval, because stuffing never has to guess which distant section is relevant. **B** overstates it — plenty of 50+ page documents retrieve fine when queries map cleanly onto single sections; length alone isn't the trigger, cross-reference structure is. **C** is a real failure mode for other reasons, but it doesn't explain this specific gap — even a perfect embedding model has no signal that a definitions section is relevant to an indemnification question, because the two don't discuss similar content. **D** dismisses a real structural limitation as a wording issue; no rephrasing of the query fixes a retriever that was never going to fetch section 2 for a section-15 question.

</details>

## Question 3

What does the just-in-time (JIT) loading pattern keep permanently in context, and what does it defer?

- A. It keeps a lightweight index (names, summaries, IDs) permanently in context, and defers full content until the model requests it
- B. It keeps full content for everything permanently in context, and defers only the index
- C. It defers everything, including the index, until the very last turn of the conversation
- D. It keeps full content for the first item only, and defers the index for all others

<details><summary>Answer</summary>

**Correct: A.** This is the defining shape of the pattern: a cheap, complete index stays resident so the model knows what exists, while expensive full content hydrates only on demand — see [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern). **B** inverts the pattern entirely — that's eager stuffing, the exact thing JIT is designed to avoid. **C** breaks the pattern at its foundation: without an eager index, the model has no way to know what's available to fetch in the first place — [Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading) makes this point directly with the demand-paging analogy. **D** describes an arbitrary, inconsistent policy that isn't what JIT loading refers to at all.

</details>

## Question 4

In the demand-paging analogy for lazy vs. eager context loading, what does the "page table" correspond to, and why must it be built eagerly even though individual pages load lazily?

- A. The page table corresponds to the lightweight index of what exists; it must be eager because a program (or agent) can't fault in — or fetch — a page it doesn't know exists
- B. The page table corresponds to the full file contents, and it's loaded eagerly to save time later
- C. The page table doesn't need to be eager; lazy loading works identically whether or not an index exists
- D. The page table is only relevant to operating systems and has no useful analogy in context engineering

<details><summary>Answer</summary>

**Correct: A.** The page table is small and cheap (just addresses, or in context-engineering terms, just an index of names and summaries), and it has to be built up front because nothing downstream can request a page — or a document — it doesn't know exists. This is the "wrong intuition, corrected" section of [Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading): lazy loading everything, including the index, breaks the pattern rather than making it more efficient. **B** confuses the page table with the pages themselves — the whole point of the analogy is that they're different things with different loading strategies. **C** is the specific wrong belief the lesson corrects — an agent given a fetch tool but no index can only reference paths it already happens to know about. **D** dismisses an analogy that maps cleanly onto agent design, as the lesson demonstrates step by step.

</details>

## Question 5

In a JIT loader implementation with a hydration token budget, why should the budget check happen *before* a document is added to the running hydrated total, rather than after?

- A. Checking before hydration prevents committing a fetch that would blow the budget, so the failure is caught and reported cleanly instead of silently exceeding the intended limit
- B. It doesn't matter which order the check happens in, as long as the total is eventually correct
- C. Checking after hydration is actually preferred because it allows the budget to flex upward automatically
- D. The order only matters for performance, not correctness

<details><summary>Answer</summary>

**Correct: A.** [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader) implements this as a guard that runs before the hydration is committed — the same "fail before spending" discipline used elsewhere for validation. Checking after the fact means the budget has already been exceeded by the time anyone notices. **B** is wrong precisely because order determines whether an overage is prevented or merely detected after the damage — those are very different outcomes for cost control. **C** inverts the purpose of a budget guard entirely; a budget that flexes upward whenever it's hit isn't a budget. **D** misses that this is a correctness issue, not a performance one — an after-the-fact check lets an agent temporarily exceed a hard limit it was supposed to respect.

</details>

## Question 6

A coding agent has 45 tools registered across git operations, file editing, deployment, and database access. What's the main cost of exposing all 45 tool schemas on every single turn, beyond raw token count?

- A. A long, undifferentiated tool list degrades the model's own tool-selection accuracy — more near-duplicate options increase the chance of calling the wrong tool or filling in arguments incorrectly
- B. There is no cost beyond token count; tool selection accuracy is unrelated to how many tools are registered
- C. Extra tools only slow down the tool itself when called, not the model's decision-making
- D. Registering more tools always makes a model faster, since it has more options to try

<details><summary>Answer</summary>

**Correct: A.** [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth) makes this the central argument: tool selection is a classification problem solved at inference time, and every additional near-duplicate option (like a `search_users` next to a `find_users`) is another way to pick wrong — a cost separate from and additional to the token cost of the schemas themselves. **B** ignores exactly the selection-accuracy dynamic the lesson demonstrates. **C** misattributes the cost — the tool's own execution speed is unrelated to how many *other* tools are registered; the cost shows up in the model's decision before any tool is even called. **D** has the relationship backwards; more options to disambiguate between generally slows and complicates decision-making, it doesn't speed it up.

</details>

## Question 7

In a retrieve-then-filter pipeline, why is a reranking step needed after initial retrieval, rather than just taking the top-k results by embedding similarity directly?

- A. Embedding similarity measures topical closeness, which can differ from how well a chunk actually answers the specific query — a reranker scores the query and candidate together and can catch that difference
- B. Reranking exists only to reduce the token count of retrieved chunks
- C. Embedding similarity and reranking always produce identical orderings, so reranking is a redundant step kept for legacy reasons
- D. Reranking replaces the need for a token budget entirely

<details><summary>Answer</summary>

**Correct: A.** [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline) traces exactly this: a chunk about "order cancellation before shipment" ranked highly on embedding similarity to a shipping-delay query, but reranking correctly buried it because it answers a related-but-different situation. Reranking adds precision that similarity search alone doesn't have. **B** confuses reranking with the budget-filter stage that comes after it — reranking reorders, it doesn't trim length. **C** is directly contradicted by the traced example, where the two orderings differ meaningfully. **D** conflates two separate pipeline stages — reranking improves ordering; the budget filter (a separate step) is what actually enforces a token limit.

</details>

## Question 8

At a million-token context window, does the lost-in-the-middle effect (reduced model attention to content in the middle of a long context) still apply?

- A. Yes — a bigger window means a bigger absolute "middle" zone, so the effect doesn't disappear and may leave more total tokens sitting in the weakest-attention region
- B. No — extremely large windows are specifically engineered to eliminate lost-in-the-middle effects
- C. It only applies to windows under 50,000 tokens
- D. It only matters if the content in the middle is retrieved rather than stuffed

<details><summary>Answer</summary>

**Correct: A.** [Strategies for Million-Token Windows](/learn/context-engineering/million-token-window-strategies) is direct about this: a larger window doesn't repeal lost-in-the-middle, it just means there's more room for content to fall into the zone where recall is weakest. This is exactly why the lesson recommends patterns like structured tables of contents and positional anchoring rather than treating the larger window as a fix in itself. **B** states the opposite of what the lesson establishes — a bigger container doesn't fix an attention pattern that isn't about container size. **C** invents a size threshold that isn't supported; [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) describes the effect generally, and it doesn't switch off at large sizes. **D** confuses two separate issues — lost-in-the-middle is about position within whatever's in context, independent of whether that content arrived via stuffing or retrieval.

</details>

## Question 9

Why does a multi-agent handoff pass a pointer (like `artifact://report/3`) rather than inlining the full report content directly into the plan?

- A. Passing a pointer keeps the plan's own size small regardless of the report's size, and defers the cost of the full content to only the step(s) that actually dereference it — avoiding duplicated cost across retries or multiple downstream agents
- B. Pointers are always faster to generate than the actual content, regardless of context
- C. Inlining content is technically impossible in most agent architectures
- D. Pointers eliminate the need for any budget or token accounting at all

<details><summary>Answer</summary>

**Correct: A.** [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value) walks through exactly this: inlining a report into three plan steps that each reference it means paying for three copies of the same content, while a pointer keeps every step small and defers the full cost to only the step(s) that actually need to read it — once, not repeatedly. **B** isn't the reason at all — the benefit is about deferred and avoided cost, not generation speed. **C** is false; inlining content is entirely possible, and is in fact the default failure mode the lesson warns against. **D** overclaims — a dereferenced pointer still costs tokens once fetched; the pattern reduces unnecessary cost, it doesn't remove the need to account for tokens at all.

</details>

## Question 10

With a 1,200-token retrieval budget and 10 ranked candidate chunks whose sizes vary, why does a "walk the ranked list and keep checking past a chunk that doesn't fit" approach usually beat truncating the concatenated list at exactly 1,200 tokens?

- A. Walking and skipping keeps every included chunk whole and intact, while flat truncation can cut a chunk mid-sentence and silently drop several lower-but-still-relevant chunks that would have fit had the process kept scanning
- B. Both approaches always produce identical results, so the distinction doesn't matter in practice
- C. Truncation is always faster, so the quality tradeoff is worth accepting
- D. Walking and skipping ignores relevance ranking entirely and just picks chunks at random until the budget fills

<details><summary>Answer</summary>

**Correct: A.** [How Retrieval and Budget Interact](/learn/context-engineering/retrieval-budget-interaction) traces exactly this: flat truncation at a token count can slice partway through a chunk based purely on where the running total happens to cross the line, while a fill-to-budget walk that keeps scanning past a chunk that doesn't fit can seat a smaller, still-relevant chunk further down the list — and never splits a chunk in half. **B** is contradicted directly by the traced example, where the two methods produce different final selections. **C** trades away answer quality (a half-chunk that reads as complete but is missing its conclusion) for a speed difference that's typically negligible at this scale. **D** misdescribes the algorithm — it walks in ranked order and respects relevance; it doesn't randomize anything.

</details>

## Question 11

A team retrieves `top_k=25` chunks for every query "to be safe," reasoning that the model can just ignore whatever isn't relevant. What's the actual risk of this approach?

- A. The model can't cleanly ignore irrelevant injected content — every extra chunk competes for attention with the ones that matter, diluting focus and adding cost without adding signal past the point where quality actually improves
- B. There is no risk — more retrieved context is strictly better regardless of relevance, since irrelevant chunks are functionally invisible to the model
- C. The only cost is a minor increase in latency; answer quality is unaffected by chunk count
- D. High top_k only matters for very small corpora, not large ones

<details><summary>Answer</summary>

**Correct: A.** [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes) names this directly: injected content isn't ignorable the way a skimmed search result is, and past a certain k, additional chunks are net-negative — more cost, more noise, no added signal. This connects to [Context Rot](/learn/context-engineering/context-rot), which documents how irrelevant tokens degrade quality, not just cost. **B** is precisely the false intuition the mistake is built on — "the model can just ignore it" doesn't hold in practice. **C** understates the risk; the lesson describes real quality symptoms (citing the wrong source, blending details from unrelated chunks) not just a latency cost. **D** has it backwards — the risk of over-retrieval scales with corpus size and chunk variety, not the other way around.

</details>

## Question 12 (scenario)

A team is building an agent to help engineers debug issues across a live microservices repo: roughly 400 services, each with its own directory, README, and changelog, growing weekly, with no way to predict in advance which 2–3 services a given bug report will actually involve. Which strategy fits best, and why?

- A. Just-in-time loading — expose an index of service names and one-line descriptions permanently, and give the agent a `read_file`/`read_changelog` tool to hydrate only the specific services the investigation actually leads to
- B. Stuff all 400 services' full READMEs and changelogs into context on every debugging session, since more context can only help find the bug faster
- C. Retrieve the top-5 most similar services by embedding the bug report and comparing it against service names, then never look at any other service regardless of what the investigation uncovers
- D. Pick one strategy for the whole repo and never revisit it, since the corpus size won't meaningfully change

<details><summary>Answer</summary>

**Correct: A.** This is exactly the profile JIT loading is built for: a large, structured, growing space where you can't predict in advance what a task needs, but the agent can discover it turn by turn — read one service's changelog, find a reference to a dependency, read that service next. See [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) and [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader). **B** is the over-eager-loading mistake named directly in [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes) — 400 services' worth of content paid on every session when any given bug touches 2–3 is exactly the waste the lesson warns about, and it also throws away the multi-hop discovery an agent needs (a bug in service A caused by a change in service C it depends on). **C** commits too early — a fixed embedding-based top-5 can't follow a lead the investigation surfaces mid-task, like a dependency the initial bug report never mentioned; this is the same rigidity [Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading) contrasts with JIT's ability to let each fetch be informed by the last. **D** ignores that this corpus is explicitly growing weekly — per [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes), a strategy decision made once against a moving corpus needs an explicit trigger to get revisited, not a permanent commitment.

</details>

If more than a couple of these caught you off guard, [Retrieval vs Stuffing Cheatsheet](/learn/context-engineering/retrieval-vs-stuffing-cheatsheet) is the fastest way to re-anchor the whole decision space in one pass before you go build against it.

**Related:** [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision) · [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth) · [How Retrieval and Budget Interact](/learn/context-engineering/retrieval-budget-interaction) · [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes) · [Retrieval vs Stuffing Cheatsheet](/learn/context-engineering/retrieval-vs-stuffing-cheatsheet)
