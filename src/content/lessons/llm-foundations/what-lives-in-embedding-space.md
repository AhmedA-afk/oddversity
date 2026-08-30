---
title: "What Lives in Embedding Space"
track: "llm-foundations"
status: live
summary: "Similar tokens cluster and directions can carry meaning — the king-queen-man-woman story, told honestly, including where it falls apart."
duration: "6 min read"
---

[The embedding lookup table](/learn/llm-foundations/the-embedding-lookup-table) tells you each token gets a row of numbers. This lesson is about what those numbers, taken together as coordinates, actually seem to encode — and how much weight that famous "king minus man plus woman" story can really bear.

## The analogy

Picture a city map where neighborhoods correspond to topics, not geography. All the animal words cluster in one district, all the finance words in another, all the emotion words in a third. Within a district, similar concepts sit close together — "puppy" a few blocks from "dog," "furious" a short walk from "angry." That's the clustering half of the picture, and it's the least controversial part: training pushes tokens that appear in similar contexts toward similar coordinates, because a model that predicts text well has to treat interchangeable words as, geometrically, nearly interchangeable.

The more interesting claim is about *directions*, not just neighborhoods: that walking a fixed distance in a fixed compass direction from any starting point applies roughly the same "kind of change" every time — the way walking three blocks north from any point on a real map always means "further north," regardless of which block you started on.

## Walking the map: king, queen, man, woman

The canonical demonstration, first popularized with pre-transformer word embeddings like word2vec: take the vector for `"king"`, subtract the vector for `"man"`, add the vector for `"woman"`. The resulting point lands close to the vector for `"queen"` — closer than to almost any other word in the vocabulary.

Walk through what that implies, step by step. Start at `"man"`. There's apparently a consistent direction in the space — call it the "royalty" direction — that gets you from `"man"` to `"king"`. If that same direction means the same thing regardless of where you start, then applying it starting from `"woman"` instead should land you somewhere near `"queen"` — and empirically, on this specific, often-cited example, it roughly does. The takeaway isn't "there's a labeled royalty axis somewhere in the matrix" — nobody designed one — it's that the *relationship* between king and man got encoded similarly enough to the relationship between queen and woman that vector arithmetic exposes the parallel.

## The wrong intuition

The popular version of this story implies two things that don't actually hold up: that this arithmetic works cleanly and generally (pick almost any analogy, and `a - b + c` lands on the right answer), and that it reveals a small number of clean, human-nameable axes running through the space (a "royalty" direction, a "gender" direction, sitting there waiting to be found).

Neither is quite true. The king/queen/man/woman example is a famous, carefully chosen success story, not a representative sample — try the same trick on less curated analogies and the nearest neighbor to the resulting vector is often something plausible-but-wrong, or not obviously related at all. And the "royalty direction" isn't a single clean axis reserved for that one concept; a token's position is shaped by every context it ever appeared in, so any given direction in the space is doing double or triple duty, entangled with several loosely related distinctions at once rather than isolating one. What actually happens is not "meaning is a small number of labeled axes," it's "the space has thousands of directions, most of them not individually nameable, and a handful of them happen to be exploitable by simple arithmetic on well-chosen examples."

That entanglement is exactly what [the geometry of embeddings](/learn/maths-foundations/the-geometry-of-embeddings) and [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) get into in more depth — nearness and direction are both real, useful signals, but neither one is as clean or as singular as the popular analogy suggests.

## When the analogy breaks

Two places this picture stops holding, both worth knowing explicitly:

**High-dimensional geometry doesn't behave like the 2D map in your head.** A model dimension of a few thousand means directions and distances behave in ways that contradict low-dimensional intuition — in very high dimensions, most randomly chosen vectors end up nearly perpendicular to each other by default, and "nearest neighbor" distances concentrate more than 2D or 3D geometry would suggest. That's covered directly in [high-dimensional spaces](/learn/maths-foundations/high-dimensional-spaces), and it's a big part of why clean arithmetic relationships are the exception in this space, not the rule.

**The famous demonstrations mostly used static word embeddings, not a modern LLM's raw token table.** Word2vec-style embeddings were trained specifically to be the final semantic representation used directly for downstream tasks, so directions in that space were optimized to be as separable and reusable as possible. A modern LLM's token embedding table, in contrast, is just the *first* layer of a much larger system — its raw rows are an out-of-context starting point, and most of the meaningful, context-sensitive geometry gets built afterward, layer by layer, through [attention](/learn/llm-foundations/attention-mechanism-explained). Looking for clean, isolated "meaning directions" in the raw embedding table alone is looking in the wrong place for a lot of what you'd actually want to find.

**Related:** [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table), [Finding Nearest Neighbors in an Embedding Matrix](/learn/llm-foundations/nearest-neighbors-in-an-embedding-matrix), [The Geometry of Embeddings](/learn/maths-foundations/the-geometry-of-embeddings), [High-Dimensional Spaces](/learn/maths-foundations/high-dimensional-spaces)
