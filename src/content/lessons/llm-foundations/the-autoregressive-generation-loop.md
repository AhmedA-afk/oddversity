---
title: "The Autoregressive Generation Loop"
track: "llm-foundations"
status: live
summary: "How one next-token prediction becomes a paragraph: sample, append, feed back in, repeat."
duration: "6 min read"
---

A model only ever predicts one token. Everything longer than one token — a sentence, a poem, a pull request — is that same single prediction, run in a loop and fed its own output.

## What it is

The autoregressive generation loop is the procedure that turns "predict one next token" into "produce arbitrarily long text": sample a token from the model's output distribution, append it to the input, and call the model again on the new, slightly longer sequence.

```python
def generate(prompt_tokens, model, max_new_tokens=50, stop_token=EOS_ID):
    tokens = list(prompt_tokens)
    for _ in range(max_new_tokens):
        logits = model.forward(tokens)[-1]      # only the last position matters
        probs  = softmax(logits)                 # <- logits to probabilities
        next_token = sample(probs)               # <- sampling, temperature, top-p
        tokens.append(next_token)                # <- the context window grows by one
        if next_token == stop_token:             # <- the stopping condition
            break
    return tokens
```

Every full response a model produces is one call to this function.

## The mental model

Nothing about the model itself is "autoregressive" — the forward pass in isolation is a single, stateless function call (see [what a language model actually computes](/learn/llm-foundations/what-a-language-model-actually-computes)). Autoregression is a property of the *loop* wrapped around that function: the word "auto" is accurate here — the model regresses on (feeds on) its own previous outputs. Nothing is held over between calls except the growing token sequence itself; the model has no memory beyond what's sitting in its input.

## Why it works this way

There isn't a clean alternative. Language doesn't have a fixed length, so you can't have the model output "the whole answer" as a single fixed-size tensor — the output space would have to be infinite. Predicting one token, appending it, and re-running is the trick that lets a fixed-size function (the forward pass) produce variable-length output. It costs you compute (each call reprocesses the whole prefix, at least conceptually — more on that below) in exchange for that flexibility.

## A concrete example (shown)

```text
step 0:  ["The", " sky", " is"]                       → sample "clear"
step 1:  ["The", " sky", " is", " clear"]              → sample " today"
step 2:  ["The", " sky", " is", " clear", " today"]    → sample "."
step 3:  [...6 tokens..., "."]                         → sample <EOS>  → stop
```

Each row is a full, independent forward pass — the model has no idea it already did steps 0-2 when it runs step 3, except that the tokens it produced are now sitting in its input. [Generating a sentence token by token](/learn/llm-foundations/generating-a-sentence-token-by-token) walks this same shape with a real toy phrase and makes the recomputation visible.

## Where it shows up

Every LLM product surface is this loop with different stopping rules bolted on: a chat reply stops at an end-of-turn token, code completion might stop at a matching bracket or a token budget, streaming UIs just render `tokens` after every iteration instead of waiting for the loop to finish.

## Watch out for

- **Assuming the model "plans" the sentence before generating it.** It doesn't — step 3 above has no access to any information about what it "intended" to write beyond the literal tokens produced in steps 0-2. See [myths about how LLMs work](/learn/llm-foundations/myths-about-how-llms-work) for the fuller version of this correction, and how chain-of-thought changes the picture.
- **Ignoring the recomputation cost.** Naively, step `t` reprocesses attention over all `t` previous tokens — that's wasted work, since a token's key and value never change once computed. That waste is exactly what [the KV cache](/learn/llm-foundations/the-kv-cache) eliminates.
- **Forgetting the loop can fail to stop.** A missing or wrong stop condition produces rambling, repetitive output — a real failure mode, not a hypothetical one, and part of why [repetition penalties and constrained decoding](/learn/llm-foundations/repetition-penalties-and-constrained-decoding) exist.

## Where next

[Generating a sentence token by token](/learn/llm-foundations/generating-a-sentence-token-by-token) traces this exact loop against a real phrase, and [the KV cache](/learn/llm-foundations/the-kv-cache) explains how production systems make each iteration cheap instead of quadratic.

**Related:** [Sampling, Temperature, and Top-p](/learn/llm-foundations/sampling-temperature-top-p), [The KV Cache](/learn/llm-foundations/the-kv-cache), [What a Language Model Actually Computes](/learn/llm-foundations/what-a-language-model-actually-computes)
