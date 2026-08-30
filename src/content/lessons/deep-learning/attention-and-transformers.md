---
title: "Understand attention as learned context selection"
track: "deep-learning"
status: live
summary: "Attention lets a representation weigh other positions when constructing its next representation."
duration: "3 min read"
---

## The short answer

Attention lets a representation weigh other positions when constructing its next representation. A token can use nearby or distant context, and multiple heads can learn different relationships. Attention is a mechanism for combining information; it is not a guarantee that the model selected the right evidence or understood the world.

## A small intuition

For a question and a passage, each position produces a query, key, and value.
Compatibility between queries and keys produces weights; values are combined
using those weights. The details matter, but the debugging question is simpler:
what context was available, and what evidence did the output actually use?

## Four examples

### Example A: pronoun reference

In “The trophy did not fit in the suitcase because it was too large,” context
helps relate “it” to the likely object. Ambiguity remains a data and language
problem, not a magic attention solution.

### Example B: long document

A relevant definition far from the question may be available but diluted by
irrelevant context. Retrieval and context selection still matter.

### Boundary case: repeated terms

A word appearing many times can attract attention without being evidence for the
answer. Inspecting attention weights alone is not a sufficient explanation.

### Counterexample: attention map as proof

Visualizing weights can generate a useful hypothesis, but it does not prove causal
reasoning or factual grounding. Test with ablations and output checks.

## An illustrative story

A team highlighted the “important” sentence according to an attention view and
found it was a boilerplate footer. The visualization helped locate a question;
the retrieval and citation test found the actual failure.

## Two ways to see it

### Representation view

Attention mixes information so later layers can build richer contextual features.

### Application view

The available context, token budget, retrieval order, and output verification
determine whether that capacity becomes a useful answer.

## Hands-on

Use a small transformer or an existing visualization to compare a short input,
the same input with distractors, and a reordered input. Form a hypothesis from the
weights, then test the output with and without the suspected evidence.

## Checkpoint

- [ ] Query, key, value, and weighted combination have an intuitive explanation.
- [ ] Attention visualization is treated as a clue, not proof.
- [ ] Context length and distractors are tested.

## What this does not solve

Attention does not guarantee truth, causality, interpretability, or efficient
handling of arbitrarily long context.

## Formal extension: shape-aware scaled dot-product attention

With batch $B$, heads $H$, tokens $T$, and head width $d_k$, queries, keys, and values
have shape $(B,H,T,d_k)$. Scores are
$S=QK^\top/\sqrt{d_k}$ with shape $(B,H,T,T)$; apply the additive mask **before**
softmax along the final key axis; then return $\mathrm{softmax}(S)V$ with shape
$(B,H,T,d_v)$. Scaling matters because an unscaled dot product has variance that
grows roughly with $d_k$, which can saturate softmax and weaken gradients.

**Worked example.** With one query $q=(1,0)$, keys $(1,0)$ and $(0,1)$, values 10
and 2, the unmasked weights are proportional to $(e^{1/\sqrt2},1)$, so the output
is a weighted average near 7.36. If the second key is masked, its score must be
negative infinity before softmax and the result must be exactly 10—not a small
nonzero leakage.

**Implementation check.** Unit-test causal masking, padding masking, and the
one-token case. Print shapes at every transpose and assert that masked probabilities
are zero. For an assignment, benchmark a full prefill versus one-token KV-cache
decode, report memory as $O(BHTd_k)$, and explain why a faster attention kernel does
not replace retrieval or evidence evaluation.

## Continue, go deeper, apply it

- Continue: API lifecycle and structured output
- Go deeper: Grounding, citations, and context budgets
- Apply it: design a context-ablation experiment for one answer task.
