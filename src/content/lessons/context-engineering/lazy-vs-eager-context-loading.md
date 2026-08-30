---
title: "Lazy vs Eager Loading"
track: "context-engineering"
status: live
summary: "Context loading has the same shape as lazy evaluation and demand paging: load the index eagerly, the pages lazily."
duration: "6 min read"
---

Every runtime you've ever used already solved this problem for memory. Context engineering is applying the same answer to tokens.

## The analogy

A demand-paged operating system doesn't load an entire program into RAM before running it. It loads a page table — a small, complete map of where every piece of the program *would* live if touched — and pulls individual pages into memory only when the running program actually references an address on them. The page table is eager: it's built once, fully, up front, because it's cheap and the program can't run without knowing what exists. The pages themselves are lazy: each one is paged in only on first touch, and a program can run its entire life touching a small fraction of its own address space.

Lazy evaluation in a programming language does the identical thing with computation instead of memory: build the full expression tree eagerly (it's just structure, practically free), but don't evaluate any node until something actually demands its value. A `LazyList` of the first million primes doesn't compute a million primes when you construct it — it computes the third one only once you ask for the third one.

Context loading is the same trade, aimed at tokens instead of RAM or CPU. The **index** — filenames, ticket IDs, one-line summaries — is the page table: small, complete, built eagerly because an agent that can't see what exists can't decide what to fetch. The **full content** behind each entry is a page: it gets pulled into the context window lazily, on first reference, and never at all if nothing ever asks for it.

## Walk it through, step by step

Picture an agent handed a repository with 200 files and the task "add rate limiting to the API client."

**Step 1 — eager index load.** The agent's first turn includes a directory listing: 200 lines, each a path and maybe a one-line description from a docstring or commit message. This costs a small, fixed amount of tokens regardless of repo size, the same way a page table's size scales with address space, not with how much of it gets touched.

**Step 2 — the model reasons over the index.** Scanning 200 one-liners, `api_client.py` and `rate_limiter.py` (if it exists) jump out by name. Nothing else does. This is the lazy evaluator deciding which branch of the expression tree is actually going to matter — a decision that's only possible because the full tree (the index) was visible, even though none of its leaves (the file contents) were evaluated yet.

**Step 3 — first page fault.** The agent calls `read_file("api_client.py")`. This is the demand page-in: one file's content, maybe 2,000 tokens, enters the window. The other 199 entries stay as index lines.

**Step 4 — a second fault, informed by the first.** Reading `api_client.py`, the agent sees an import: `from .http_config import DEFAULT_TIMEOUT`. It didn't know this file mattered from the index alone — it learned it by touching the first page. It reads `http_config.py` next. This is the part a purely eager or purely pre-computed load can't replicate: the second fetch is informed by the *result* of the first, not by a prediction made before either happened.

**Step 5 — task finishes having touched 3 of 200 files.** Total tokens spent on full content: three files' worth. Total tokens spent on the index: 200 cheap one-liners. Compare that to eager full-content loading, which pays for all 200 files whether or not the task ever looks at 197 of them.

## The wrong intuition, corrected

The tempting wrong belief is: *lazy is strictly better, so load everything lazily, including the index.* That's backwards, and it's exactly where the demand-paging analogy earns its keep — an OS with no page table isn't lazier, it's broken, because a program can't fault in a page it doesn't know exists. An agent given a `read_file` tool but no directory listing has the same problem: it can only read paths it already knows about, which usually means it can't discover anything outside what the task prompt happened to mention. The index has to be eager, or lazy loading of everything behind it has nothing to route through.

The second wrong belief: *since lazy loading is cheaper, it's always the right call.* Cheaper per call, yes — but demand paging has a real, well-known cost too: a page fault takes time, the same way a `read_file` tool call takes a model round-trip. A program that touches nearly all of its address space anyway pays that fault overhead for no benefit over having loaded it up front; the equivalent agent — one that's going to end up reading most of the repo regardless — pays extra latency in exchange for savings it never actually realizes.

## When the analogy breaks

Demand paging assumes a page, once faulted in, might be evicted and re-faulted later — but a context window doesn't quietly evict old content the way an OS reclaims cold memory. Once a file is hydrated into the conversation, it stays there (consuming its share of the budget) until something — a compaction step, an explicit summarization — removes it. [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization) and [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) are the closest things context engineering has to page eviction, and unlike an OS, they're a deliberate step you build, not something that happens for free underneath you.

The other place the analogy strains: a real page table is close to free to build, since it's just addresses. An agent's index isn't always free — a good one-line summary per file, ticket, or document sometimes has to be *generated*, and a bad index (too sparse, too similar across entries) makes the lazy phase worse, not neutral. When is eager pre-loading still worth it despite all this? When the working set is both small and knowable in advance — a handful of files a task will certainly touch, a short conversation history that fits comfortably — the fault-overhead of doing it lazily buys you nothing, and you're back to the stuffing side of [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision).

**Related:** [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) · [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision) · [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization) · [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader)
