---
title: "The Just-in-Time Loading Pattern"
track: "context-engineering"
status: live
summary: "Keep lightweight references in context and hydrate full content only when the task actually reaches for it."
duration: "6 min read"
---

An agent that starts every task by reading every file it might need has already lost the game before it makes a single decision — most of what it read will never matter, and it paid full price for all of it.

## What it is

Just-in-time (JIT) context loading is the pattern of keeping the context window filled with *references* — filenames, ticket IDs, one-line summaries, URLs — rather than the full content those references point to, and giving the model a tool to hydrate any one of them into full content the moment the task actually needs it. [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading) covers the same core idea at the level of an agent's fetch tools generally; this lesson is about the pattern as a design discipline you apply deliberately, independent of any one tool implementation.

The shape is always the same: a cheap, complete index sits in context up front (so the model knows *what exists*), and an expensive, partial hydration happens only on demand (so the model pays only for *what it uses*). The index is small because it's summaries; the hydration calls are small individually because each one is scoped to a single item.

## The mental model

Think of it as the difference between a library's card catalog and its shelves. The catalog — title, author, one-line description, call number — is small enough to browse in full, so it stays permanently open on the desk. The books themselves stay on the shelf until a specific one is needed, and even then you pull one book, not the whole shelf. Nobody photocopies the entire library "just in case" before starting a research question; they consult the catalog, decide what's relevant, and walk to the shelf only for that.

The context window is the desk. The full documents are the shelf. JIT loading is the discipline of keeping only the catalog on the desk permanently, and treating every full-text fetch as a deliberate, individually justified trip.

## Why it works this way

The alternative — eager pre-loading — requires someone (a human, or a retrieval step) to predict in advance exactly what a task will need, and that prediction is either over-inclusive (waste) or under-inclusive (a gap the model has no way to fill). JIT sidesteps the prediction problem entirely by letting the entity that actually knows what it needs — the model, mid-task — make the call itself, one fetch at a time, informed by what it's already learned. This is the same shift that makes an agent with `read_file` and `grep` more capable on an unfamiliar codebase than a fixed context dump could ever be: the agent's second fetch is informed by what its first fetch revealed, which a pre-computed context bundle can't replicate.

The cost is real and worth naming plainly: every hydration is a tool call, which is a model round-trip, which is added latency. JIT trades some latency and a slightly more complex agent loop for a context window that stays proportional to what a task actually touches rather than to what it might conceivably touch.

## A concrete example (shown)

**Eager pre-loading, file-navigation agent.** Given a task like "find where the retry logic lives and add a max-attempts cap," an eager design might read every file in a 200-file `src/` directory into context before the model's first turn, on the reasoning that "better safe than sorry." That's 200 files' worth of tokens spent, and the model still has to read through all of it to find the two files that actually matter.

**JIT, same task.** The agent starts with a directory listing — 200 one-line entries, a tiny fraction of the eager cost — and a `read_file(path)` tool. The model scans the listing, guesses `retry.py` and `client.py` are the likely spots based on their names, reads those two, finds the retry loop in `retry.py`, notices it imports a constant from `config.py`, reads that one too. Three files hydrated, 197 left as index entries only. The total token cost is a small fraction of the eager version, and the three files chosen were chosen with more information (having already seen `retry.py`'s contents) than any pre-loading step could have had.

## Where it shows up

JIT loading is the mechanism behind [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader), which implements exactly this index-plus-hydrate shape as runnable code. It's also the reasoning behind [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value) — a pointer is only useful if something on the other end knows how to dereference it, and JIT is the loop that does the dereferencing. [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth) applies the identical index-then-hydrate shape to tool schemas instead of documents: show names and one-liners first, load the full definition only for the tool about to be called.

## Watch out for

- **An index too sparse to route from.** If the one-line summary doesn't distinguish `retry.py` from `retry_legacy.py`, the model can't make a good hydration decision and starts guessing — the index has to carry enough signal to be worth browsing.
- **No budget guard on hydration.** Nothing stops a model from hydrating far more than it needs turn after turn if there's no cap; [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader) covers wiring in that guard explicitly.
- **Assuming JIT is free.** Every hydration is a round-trip. A task that genuinely needs five specific files finishes faster with them pre-loaded than with five sequential fetches — JIT wins on tokens and precision, not on latency.

## Where next

[Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading) builds the intuition for exactly when eager pre-loading is still the right call, using the same demand-paging analogy this lesson gestures at. [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader) turns the pattern into working code.

**Related:** [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) · [Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading) · [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader) · [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value) · [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth)
