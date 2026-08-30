---
title: "Queries, Keys, and Values: The Library Metaphor"
track: "llm-foundations"
status: live
summary: "A library search and a pronoun resolution, walked step by step, to make queries, keys, and values stick as intuition."
duration: "5 min read"
---

You've seen the formula: `softmax(QK^T / sqrt(d_k)) V`. It's correct, and it's also completely opaque the first time you meet it. Here's the picture that makes it click, plus the linguistic example it's actually for.

## The analogy: a library search

You walk into a library holding a question in your head — that's your **query**. You don't shout the question at every book; you walk down the aisles reading the little labels on the spines and shelf-ends — those labels are the **keys**. You compare your question against each label and judge how well it matches. A label that says "Astrophysics: Black Holes" matches a query about gravitational waves reasonably well; a label that says "18th Century French Poetry" doesn't match at all.

Here's where the library breaks from a real search engine and becomes attention: you don't walk away with just the one best-matching book. You walk away with a little bit of *every* book, mixed together in proportion to how well each one's label matched your query. The actual page contents you take home — the **values** — get blended: mostly from the astrophysics shelf, a trace from the neighboring cosmology shelf, essentially nothing from the poetry shelf. The label (key) is only ever used to judge relevance; the pages (value) are what you actually carry away.

## Walking it through the linguistic case

Now apply the same three roles to a sentence a transformer actually has to process:

> "The animal didn't cross the street because it was tired."

The token **"it"** needs to figure out what it refers to. Here's the walk, step by step:

1. **"it" builds a query.** Its query vector encodes something like "I'm a pronoun standing in for some earlier noun — which one?"
2. **Every earlier token offers a key.** "animal" offers a key that encodes "I am a concrete, singular, animate noun." "street" offers a key encoding "I am a concrete, singular, inanimate noun — a location." "because," "the," "didn't" offer keys too, but they encode almost nothing that looks like a pronoun's target.
3. **The query is compared against every key.** "it"'s query aligns much more strongly with "animal"'s key than with "street"'s — animacy and the semantics of "being tired" both point toward something that can *feel* tired, which favors the animal over the street. The comparison with "because," "the," and "didn't" scores low across the board.
4. **Scores become weights, weights pick values.** After softmax, "animal" might carry a weight like 0.6, "street" something like 0.15, and the rest split the remainder thinly. "it"'s new representation becomes mostly "animal"'s value vector, with small contributions from everything else — the model has resolved the reference, not by a hard rule, but by a weighted blend that's dominated by one term.

Change one word and the weights shift with it: "The animal didn't cross the street because it was too wide" pulls the weight toward "street" instead, because "wide" is a property of streets, not animals. Nothing about the *mechanism* changed — the same query-key-value machinery ran — but the query for "it" ends up closer to "street"'s key than to "animal"'s, because the rest of the sentence (via the query and key vectors, which are themselves built from context) encodes that shift.

## The common wrong intuition

The mistake most people make on first exposure is picturing attention as **retrieval**: "the model looks up the right answer for what 'it' means." That framing implies a single correct slot gets selected and everything else is discarded, the way a hash lookup discards every key except the exact match.

That's not what happens. Every token contributes *something* to "it"'s new representation — "street" isn't zeroed out, it's just down-weighted. This matters in practice: it's why attention can encode genuine ambiguity (a pronoun that's honestly unclear gets split weight across two candidates, rather than being forced to commit), and it's why you can't read off "the model's answer" by asking which single key won — you have to look at the whole distribution. See [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup) for why that softness is also what makes the whole thing trainable by gradient descent in the first place.

## When the analogy breaks

Push the library metaphor too far and it misleads you in a few specific places:

- **There's no separate "librarian" step.** In a real library, a person or catalog system decides how to rank matches. In attention, the same learned projections that produced the query and keys *are* the entire ranking mechanism — there's no additional judgment layer sitting outside Q and K.
- **Every token is both a searcher and a shelf, simultaneously.** "animal" isn't just sitting on a shelf waiting to be found — at the very same layer, "animal" is *also* issuing its own query and attending to other tokens. The library metaphor's clean split between "the person searching" and "the books being searched" doesn't hold; in self-attention every token plays both roles at once, for every position, in one parallel computation.
- **There's no shelf you can walk past and ignore.** A real search can stop early once it finds a good-enough match. Attention always compares the query against *every* key in the sequence — that's a full quadratic sweep, not a search that terminates. This cost is also why very long sequences get expensive; see [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) for what that means in practice.

Once this picture is solid, [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) turns it into actual matrices you can compute by hand, and [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics) covers the one restriction placed on which shelves a query is even allowed to browse.

**Related:** [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), [The Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained), [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics)
