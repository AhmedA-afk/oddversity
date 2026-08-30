---
title: "What Different Attention Heads Learn"
track: "llm-foundations"
status: live
summary: "A tour of documented head types — previous-token, induction, syntactic — and why induction heads matter for in-context learning."
duration: "7 min read"
---

Nobody assigns attention heads their jobs. [Multi-Head Attention: Why Many Heads](/learn/llm-foundations/multi-head-attention-why-many-heads) explains why specialization emerges anyway — separate parameter subspaces competing to reduce the same loss tend to settle into different roles. This lesson works through one specific, well-documented example in detail: the induction head.

## The setup

Interpretability researchers examine trained transformers by visualizing each head's attention-weight matrix — the same kind of `(seq_len, seq_len)` grid from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) — across many inputs, looking for a consistent pattern. Three types recur often enough across models and papers to have settled names:

- **Previous-token heads** — attend almost entirely to the token immediately before the current position, regardless of content. Their attention matrix is close to a shifted identity: a strong diagonal one step below the main diagonal.
- **Syntactic heads** — attend based on grammatical structure: a verb's head attending back to its subject, or a closing bracket attending back to the matching opening one, tracking a dependency that can span many tokens.
- **Induction heads** — the pattern this lesson works through in detail, responsible for a specific kind of copying behavior tied directly to in-context learning.

## Step by step: the induction pattern

Induction heads implement a simple rule, usually described as "**A B ... A → B**": if the current token is a repeat of some earlier token `A`, attend to whatever token immediately followed that earlier `A`, and predict it comes next again.

Walk it through on a short repeated sequence: `"... cat sat ... cat"` — the model has seen "cat" followed by "sat" once already, and "cat" shows up again later.

1. **The current query is at the second "cat."** Its query vector encodes something like "I am the token 'cat'; where else has this exact token appeared before?"
2. **An earlier key matches: the first "cat."** That earlier position's key encodes "I am 'cat,' at this position." The query-key dot product between the second "cat" and the first "cat" is high, because token identity is what this head's projections are tuned to compare.
3. **Attention lands there, but the useful information is one position over.** This is what makes induction heads a genuinely two-step, two-head mechanism in most trained models: a first head (a "previous-token head") first copies information from position `t-1` into position `t`'s representation — so the representation *at* "sat" carries a trace of "the token before me was 'cat.'" The induction head's key is built from that shifted representation, so matching the query against it effectively matches against "the token that followed an earlier 'cat.'"
4. **The value carried back is "sat."** Because the key at that shifted position encodes "cat came before me," and the corresponding value is (or points toward) "sat," the second "cat" ends up attending strongly to "sat" and copying it forward.
5. **The output prediction favors "sat" as what comes next.** The model has, without any explicit copying instruction in its architecture, implemented "the pattern that followed this token last time will follow it again."

Here's an illustrative attention-pattern grid for the second occurrence of a repeated token in a sequence `[A, B, C, A]`, showing where an induction head at position 4 (the second `A`) places its weight:

```
attend to →      A(1)   B(2)   C(3)   A(4)
position 4 (A) [ 0.05   0.85   0.05   0.05 ]
```

Position 4 attends overwhelmingly to position 2 — the token that followed the *previous* occurrence of `A` — rather than to position 1 (the earlier `A` itself) or position 3. That's the induction signature: high weight not on the earlier match, but on whatever immediately followed it.

## Why this matters for in-context learning

Induction heads were first studied closely as a specific mechanistic explanation for part of [in-context learning](/learn/llm-foundations/in-context-learning) — a model's ability to pick up a pattern from examples given in the prompt without any weight updates. A prompt like `"blue -> bleu, red -> rouge, green ->"` hands the model exactly the repeated structure induction heads are built to exploit: `"green"` is new, but the *pattern* "word, then its translation" has already appeared once, and an induction-style mechanism can generalize the "A B ... A → B" rule from token-level repeats to structural repeats of a whole pattern. [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics) goes further into how this scales beyond literal token copying into few-shot task-following.

Researchers have also documented a further coincidence worth knowing about: during training, induction heads tend to emerge in a fairly sudden, concentrated phase rather than gradually, and that same phase tends to line up with a jump in the model's in-context learning ability — evidence (not proof) that this specific circuit is doing real work for that capability, rather than being an incidental pattern that happens to be interpretable.

## Where it breaks

The clean story above describes an idealized induction head. Real trained heads are messier in a few specific ways:

- **Many heads are partial or mixed.** A head might behave like an induction head on some inputs and do something else entirely on others — the named categories are useful abstractions, not a clean partition of every head in a real model.
- **The two-step (previous-token head feeding an induction head) story is a simplification.** Some models implement approximations of induction behavior in a single layer, or spread the mechanism across more than two heads working together — the tidy two-hop story is the clearest documented case, not a universal law.
- **Not every head is nameable.** Plenty of heads in a trained model resist any clean human description at all, and interpretability research is upfront that the named categories (previous-token, induction, syntactic) cover some, not all, of what heads actually do.

## Takeaways

- Head specialization isn't designed in — it's discovered by gradient descent, and researchers find it after the fact by inspecting attention patterns on real inputs.
- The induction pattern "A B ... A → B" is a concrete, well-documented circuit, not a metaphor — you can point at the specific attention weights that implement it, as in the grid above.
- This circuit is one of the more direct mechanistic links between something visible in a single attention matrix and a capability — in-context learning — that shows up several modules later in this track.

**Related:** [Multi-Head Attention: Why Many Heads](/learn/llm-foundations/multi-head-attention-why-many-heads), [In-Context Learning](/learn/llm-foundations/in-context-learning), [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics), [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention)
