---
title: "Generating a Sentence Token by Token"
track: "llm-foundations"
status: live
summary: "Following 'Once upon a' through three generation steps, watching the context and the recomputation grow."
duration: "7 min read"
---

The autoregressive loop is easy to describe and easy to under-appreciate until you watch it run against real words, one step at a time.

## The setup

We'll generate from the prompt `"Once upon a"`, three tokens at a time, and watch two things simultaneously: what word gets picked, and how much the model reprocesses at each step.

```python
tokens = ["Once", "upon", "a"]      # 3 tokens
```

## Step by step

### Step 1: predict from 3 tokens

```python
logits = model.forward(tokens)         # forward pass over all 3 tokens
next_word = sample(softmax(logits[-1]))
# next_word = "time"
tokens.append(next_word)
# tokens = ["Once", "upon", "a", "time"]
```

> **Why this step?** The model doesn't get to see "time" as a hint — it has to produce it from just `["Once", "upon", "a"]`, which is exactly the kind of high-probability continuation the training data reinforced thousands of times over.

### Step 2: predict from 4 tokens

```python
logits = model.forward(tokens)          # forward pass over all 4 tokens — "Once", "upon", "a" are recomputed
next_word = sample(softmax(logits[-1]))
# next_word = "there"
tokens.append(next_word)
# tokens = ["Once", "upon", "a", "time", "there"]
```

> **Why this step?** Notice the input grew by exactly one token, but the forward pass reran attention over *all four* — including the three it already processed a moment ago. Nothing here reuses step 1's work yet.

### Step 3: predict from 5 tokens

```python
logits = model.forward(tokens)          # forward pass over all 5 tokens
next_word = sample(softmax(logits[-1]))
# next_word = "was"
tokens.append(next_word)
# tokens = ["Once", "upon", "a", "time", "there", "was"]
```

> **Why this step?** Same pattern again: 5 tokens in, full attention recomputed over all 5, one new word out. Three steps in, the model has now recomputed "Once," "upon," and "a" three separate times each.

Zoomed out, the whole thing is a five-line loop:

```python
tokens = ["Once", "upon", "a"]
for _ in range(3):
    logits = model.forward(tokens)                  # reprocesses the WHOLE prefix, every time
    tokens.append(sample(softmax(logits[-1])))
    print(tokens)
# ['Once', 'upon', 'a', 'time']
# ['Once', 'upon', 'a', 'time', 'there']
# ['Once', 'upon', 'a', 'time', 'there', 'was']
```

## Where it breaks (+ fix)

The pattern above — recompute the entire prefix at every single step — is correct but wasteful. Generating `n` tokens this way costs roughly `1 + 2 + 3 + ... + n`, proportional to `n²`, because token 1's attention gets recomputed at every one of the `n` steps that follow it. For a three-word prompt turning into a three-sentence paragraph, that's a lot of repeated arithmetic on tokens that never change once they're written.

The fix is [the KV cache](/learn/llm-foundations/the-kv-cache): since a token's key and value vectors depend only on tokens at or before it — guaranteed by [causal masking](/learn/llm-foundations/causal-masking) — they can be computed once, cached, and reused. With caching, step 2 above only computes Q, K, and V for `"time"`, the one new token, and attends it against the cached K/V of everything before it. The `n²` recomputation collapses to roughly `n`.

## Takeaways

- The context grows by exactly one token per iteration — that's the entire mechanism of "the model writing more."
- Naively, every step reprocesses the full prefix from scratch; this is correct but quadratic in the sequence length.
- Real systems never do it the naive way — [the KV cache](/learn/llm-foundations/the-kv-cache) is what makes this loop practical rather than a research curiosity.
- The number of steps in the loop, and when it stops, is governed by [the autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) more generally — this lesson is that loop, slowed down to three concrete steps.

**Related:** [The Autoregressive Generation Loop](/learn/llm-foundations/the-autoregressive-generation-loop), [The KV Cache](/learn/llm-foundations/the-kv-cache), [Causal Masking](/learn/llm-foundations/causal-masking)
