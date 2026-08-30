---
title: "In-Context Learning Mechanics"
track: "llm-foundations"
status: live
summary: "The induction-head account of few-shot learning: attention heads that literally search the context for a repeat and copy what followed it."
duration: "6 min read"
---

[In-context learning](/learn/llm-foundations/in-context-learning) tells you the phenomenon: no weight updates, and the model still adapts to examples sitting in the prompt. This page opens the mechanism up one layer: a specific, identified attention circuit that does much of the actual work.

## What it is

An **induction head** is a pair of attention heads working together, discovered by looking directly at attention patterns in small transformers (Olsson et al., 2022). The pair implements one operation: *find the last place in the context where the current token appeared before, and copy whatever token came right after it.* If the model has already seen `"... Mr. Smith is a ..."` and the context now reads `"... Mr. Smith is a doctor. His colleague, Mr."`, an induction head looks back for the previous `"Mr."`, finds `"Smith"` sitting right after it, and boosts the prediction for `"Smith"` as the next token — a literal, mechanical pattern-completion, built entirely out of the [attention mechanism](/learn/llm-foundations/attention-mechanism-explained) already covered earlier in this track.

## The mental model

The pair works in two stages, and the [causal masking](/learn/llm-foundations/causal-masking) that already restricts attention to earlier tokens is exactly what makes "the previous occurrence" a well-defined thing to search for:

1. **A previous-token head**, one layer earlier, writes information about *the token one position back* into each position's residual stream — so position `i`'s representation now carries a trace of what sat at position `i-1`.
2. **The induction head**, in a later layer, queries using the *current* token and attends to positions whose previous-token trace matches it — in effect asking "where else in this context did a token just like me get followed by something?" — then copies that followed-by token's identity forward into its own prediction.

Composing two heads across two layers is what makes this a genuinely different mechanism from a single head just "attending to similar tokens": the first head manufactures the exact signal (*what came after this position*) that the second head's query is built to match against. Neither head alone does the job.

## Why it works this way

This circuit is a natural thing for gradient descent to discover because next-token prediction rewards exactly this behavior constantly during pretraining: raw text is full of repeated names, repeated phrases, repeated code identifiers, and lists where the pattern "A followed by B" recurs and should predict B again the next time A shows up. A circuit that generalizes "copy what followed last time" reduces loss across an enormous number of ordinary training sequences, long before anyone frames it as "few-shot learning." Few-shot prompting at inference time is simply handing this already-learned circuit an unusually clean, explicit version of the pattern it was already tuned to exploit — a `demo A_1 → B_1, A_2 → B_2, A_3 → ?` list is close to the cleanest possible instance of "a token that appeared before, followed by something."

## A concrete example (shown)

A minimal repeat-copy setup makes the mechanism's target behavior concrete, even without inspecting real attention weights:

```python
context = ["the", "cat", "sat", "on", "the", "mat", ".",
           "the", "cat"]
# An induction head's job at this final position: find the earlier
# occurrence of "the", "cat" and predict whatever followed it.

def induction_predict(context):
    # naive stand-in for "search for the last matching bigram, copy what followed"
    for i in range(len(context) - 2, 0, -1):
        if context[i-1:i+1] == context[-2:]:
            return context[i+1]
    return None

print(induction_predict(context))   # -> "sat"
```

This toy function is not the real circuit — real induction heads operate on learned vector similarity inside attention, not string matching — but it names the exact target computation the two-head pair approximates, and it's why "the cat sat on the mat ... the cat ___" reliably continues with "sat" rather than a random verb, even in models far too small to know anything about cats.

## Where it shows up

Induction heads are believed to form early in training and are one of the most consistently identified circuits across model sizes and architectures — see [what different heads learn](/learn/llm-foundations/what-different-heads-learn) for the broader picture of how attention heads specialize. They're the mechanistic backbone behind [few-shot vs. zero-shot prompting](/learn/llm-foundations/few-shot-vs-zero-shot-worked): every demonstration you add to a prompt is another instance of the "A followed by B" pattern this circuit is built to detect and repeat.

## Watch out for

- **Induction heads explain copying, not reasoning.** The mechanism accounts for why a model continues a *pattern* reliably — it doesn't by itself explain a model solving a genuinely novel problem that has no pattern-shaped precedent in the prompt or its training data.
- **"Attention looks back at examples" is not the same claim as "the model runs an optimizer over the examples."** The induction-head account is a concrete, verified circuit; a separate and more speculative line of work asks whether the *net effect* of attending over examples resembles gradient descent — that's a different, harder question, covered in [is in-context learning implicit gradient descent?](/learn/llm-foundations/is-in-context-learning-gradient-descent).
- **Induction heads aren't the whole story of ICL.** They're the best-understood single circuit, not a complete mechanistic account of every few-shot behavior — plenty of ICL phenomena (task selection from ambiguous instructions, style transfer) aren't reducible to copy-the-last-match alone.

## Where next

[Few-shot vs. zero-shot: worked prompts](/learn/llm-foundations/few-shot-vs-zero-shot-worked) shows this mechanism's practical fingerprints — why example order and label balance change output. [Is in-context learning implicit gradient descent?](/learn/llm-foundations/is-in-context-learning-gradient-descent) takes the harder, more contested question further.

**Related:** [In-Context Learning](/learn/llm-foundations/in-context-learning), [What Different Heads Learn](/learn/llm-foundations/what-different-heads-learn), [Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained), [Causal Masking](/learn/llm-foundations/causal-masking)
