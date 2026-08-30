---
title: "Vector, KV, and Graph Memory Stores"
track: "context-engineering"
status: live
summary: "Four memory backends, four different query shapes each one actually serves - and the wrong default is reaching for a vector store every time."
duration: "7 min read"
---

"Add a memory store" isn't one decision. It's a choice between data structures with genuinely different strengths, and the fastest way to end up with an expensive memory system that's still wrong is picking the fashionable option — a vector store, every time — instead of matching the store to the shape of query it actually has to serve.

## Key-value: exact facts, exact lookups

**How it works:** a row, a Redis hash, or a JSON blob per identity, addressed by an exact key — `timezone`, `subscription_tier`, `preferred_language`.

**When it wins:** memory is a small set of discrete facts you'll look up by an exact or near-exact key, the kind of thing [memory vs. state](/learn/context-engineering/memory-vs-state-distinction) calls a durable, identity-scoped fact. Lookups are effectively instant and the data is trivial to inspect, audit, and correct — overwrite the key.

**Failure mode:** no notion of "things similar to this" and no notion of how facts relate to each other. It works cleanly for a few dozen settings per user and has nothing to offer the moment memory needs to answer "what do I know that's relevant here" instead of "what's the value for this exact key."

**Relative cost:** lowest — a table or a hash map, no specialized infrastructure.

## Full-text (lexical) search: exact terms and phrases

**How it works:** an inverted index over free-text memories, ranked by keyword overlap (BM25 and its relatives) — no embeddings, no vector math, just "which stored notes contain these terms."

**When it wins:** the query hinges on an exact term or phrase actually appearing in the text — "find where this user said the words 'requires 2FA'" — or the memory volume is small enough that standing up embedding infrastructure is overkill for what you're storing.

**Failure mode:** zero semantic understanding. A note that says "needs two-factor" won't match a search for "2FA" unless the terms overlap or you've built synonym expansion on top — lexical search is brittle to exactly the phrasing variance that free-text memories are full of.

**Relative cost:** low — well-understood, no embedding pipeline, but it's still its own index to build and keep in sync, separate from a plain key-value table.

## Vector stores: fuzzy relevance over free text

**How it works:** embed each memory as a point in high-dimensional space and retrieve by similarity to the current query — the same machinery behind [retrieval vs. context stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), applied to memories instead of documents.

**When it wins:** memories are free-text and you don't know in advance what shape a future query will take — "things this user has told me about their project," phrased however they happened to phrase it, and however the retrieving query happens to be phrased later.

**Failure mode:** similarity is not structure. A vector store can tell you a memory is *semantically close* to a query, not that one fact caused another or that one entity is a kind of another — two facts can sit close in embedding space while being logically unrelated, or sit far apart while being tightly connected. It also degrades gracefully into noise rather than failing loudly: a mediocre match still returns *something*, at a confident-looking similarity score.

**Relative cost:** moderate to high — an embedding pipeline, a vector index, and the latency of an approximate-nearest-neighbor search on every read.

## Knowledge graphs: entities, relationships, multi-hop recall

**How it works:** memory as nodes (entities) and typed edges (relationships) — the graph-native counterpart to structured retrieval, where a query is a traversal rather than a lookup or a similarity score.

**When it wins:** the value of a memory is in *how facts connect*, not just that they exist — "which of this user's projects share the same auth provider" is a graph walk of two or three edges, not a key lookup and not a similarity search.

**Failure mode:** engineering weight. Extraction has to produce clean entities and typed relations, not just chunks of text, and that extraction step is itself a place errors and hallucinated relationships creep in. Update semantics are cleaner than a vector store's — retire or add an edge rather than hope a new embedding out-competes a stale one — but only if the extraction that produces edges in the first place is trustworthy.

**Relative cost:** highest — schema design, an extraction pipeline, and graph-native infrastructure to query it.

## Decision table

| Store | Best query shape | Update semantics | Relative cost |
|---|---|---|---|
| Key-value | Exact key → exact value | Overwrite | Lowest |
| Full-text (lexical) | Exact term or phrase recall over free text | Re-index on write | Low |
| Vector | Fuzzy "find things like this" over free text | Re-embed on write | Moderate–high |
| Knowledge graph | Multi-hop "how does X relate to Y" | Add or retire an edge | Highest |

## How to choose

Three real queries, routed to the store that actually serves them:

**"What timezone is this user in?"** — key-value. It's an exact key with one current value, and a similarity search or a graph traversal would be pure overhead for a lookup this direct.

**"Find past sessions where this user complained about onboarding being confusing."** — vector, not lexical, and the reason is exactly the lexical failure mode above: the complaint might be phrased "the onboarding was confusing," "signup felt overwhelming," or "I got lost setting things up" — three unrelated keyword sets describing the same underlying issue. A similarity search over embeddings catches all three; a keyword index only catches the one that happens to share your search terms.

**"Which of this user's projects use the same database as their most recent one?"** — knowledge graph. This is a two-hop traversal (project → uses → database, then database → used-by → other projects), not a fact you look up by key and not a free-text relevance question. Neither a key-value store nor a vector store has a native way to answer "how does X relate to Y" at all — they can only tell you facts *about* X and facts *about* Y separately.

Most production memory systems don't pick one of these and stop — they layer key-value for stable settings, a lexical or vector index for episodic free-text recall, and a graph for the entities and relationships that matter across sessions, exactly the mixing [structured memory stores](/learn/context-engineering/structured-memory-stores) describes at the architecture level. The question that decides which layer a new fact belongs in is always the same one from [memory vs. state](/learn/context-engineering/memory-vs-state-distinction) and [memory across sessions](/learn/context-engineering/cross-session-memory-architecture): what does this memory need to answer — a key you'll look up exactly, a "find things like this," or a "how does X connect to Y"? The answer picks the store, not the other way around.

**Related:** [Structured Memory Stores: Vector, Key-Value, or Knowledge Graph](/learn/context-engineering/structured-memory-stores), [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Memory Across Sessions](/learn/context-engineering/cross-session-memory-architecture), [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), [What to Remember, What to Forget](/learn/context-engineering/what-to-remember-vs-forget)
