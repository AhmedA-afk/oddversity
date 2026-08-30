---
title: "From Prompt to Next Token, Traced"
track: "ai-foundations"
status: live
summary: "A worked example that traces the exact prompt 'The capital of France is' through tokenization, embedding, attention, and the final softmax — with runnable numpy code, real GPT-2 to"
duration: "25 min read"
---

Every explanation of "how LLMs work" eventually waves at a black box between typing a prompt and reading an answer. This one doesn't wave — we're going to push five words through an actual (miniature, hand-checkable) transformer, watch the numbers change at every stage, and end up staring at the exact probability distribution that makes "Paris" the obvious next token.

## The setup

We're tracing one input, start to finish: the string `"The capital of France is"`, fed to a GPT-2-shaped model as a plain completion — no chat template, no system prompt, just the raw text, the way the original GPT-style models were actually used. If you want the architecture map first, [How LLMs Work](/learn/ai-foundations/how-llms-work) covers that; this page assumes you already have that picture and just runs one prompt through it with real numbers on every arrow.

Two honesty notes before we start:

- **Scale.** A real GPT-2-small forward pass pushes 768-dimensional vectors through 12 stacked attention-plus-feedforward blocks, indexing into a 50,257-row vocabulary. That's not a whiteboard exercise. So below, we'll build a miniature stand-in with the same four operations — tokenize, embed, attend, unembed — using 4-dimensional vectors and a five-word shortlist of candidate next-tokens, so every number is something you can check by hand. The mechanism is identical; only the size changes.
- **Weights.** In a trained model, every weight you're about to see — the embedding table, the attention projections, the unembedding matrix — was learned from data by gradient descent over enormous amounts of text. That's not this page's subject. Here, weights are hand-set to values that produce sensible behavior, purely so you can see the *shape* of the computation without needing billions of learned parameters to make the arithmetic work.

## Step by step

### 1. Tokenize: text becomes integers

Run this (`pip install tiktoken` first):

```python
import tiktoken

enc = tiktoken.get_encoding("gpt2")
ids = enc.encode("The capital of France is")
for i in ids:
    print(i, repr(enc.decode([i])))
```

On GPT-2's BPE vocabulary, this particular prompt happens to split one token per word: `The`, ` capital`, ` of`, ` France`, ` is` — five integers, each just a row-index into a 50,257-row table, with no meaning attached yet. That's not guaranteed for every prompt — rarer words get chopped into sub-word pieces — so when it matters, run the two lines above instead of assuming. The mechanics of how those merges get learned live in [Byte-Pair Encoding](/learn/llm-foundations/byte-pair-encoding).

One detail that matters for everything downstream: notice the leading spaces baked into four of the five tokens. GPT-2-family tokenizers fold the space before a word into that word's token, so the vocabulary has a separate entry for `" France"` (space included) than for bare `"France"`. That's why, when we get to Step 4, the token racing to win isn't the bare word `Paris` — it's `" Paris"`, space and all.

> **Why this step?** Every weight matrix from here on is a table of floating-point numbers. No row anywhere is labeled `France` — only integers index into things. Tokenization is the seam between human text and the only kind of object the rest of the pipeline can consume: numbers you can look up and add.

### 2. Embed: integers become vectors

```python
import numpy as np

d_model = 4  # GPT-2 small actually uses 768; kept tiny so every number is checkable

# a stand-in for 5 rows pulled out of a real (50257, 768) embedding table
token_embedding = {
    "The":     np.array([1.0, 0.0, 0.0, 0.0]),
    "capital": np.array([0.0, 1.0, 0.0, 0.0]),
    "of":      np.array([0.0, 0.0, 0.0, 0.0]),   # function words often end up small
    "France":  np.array([0.0, 0.0, 1.0, 0.0]),
    "is":      np.array([0.0, 0.0, 0.0, 1.0]),
}
tokens = ["The", "capital", "of", "France", "is"]

X = np.stack([token_embedding[t] for t in tokens])                    # (5, 4)
pos = np.array([[i * 0.05] * d_model for i in range(len(tokens))])    # stand-in for learned positional embeddings
X = X + pos
print(X)
```

```
[[1.   0.   0.   0.  ]
 [0.05 1.05 0.05 0.05]
 [0.1  0.1  0.1  0.1 ]
 [0.15 0.15 1.15 0.15]
 [0.2  0.2  0.2  1.2 ]]
```

Each row is one token's position in a 4-dimensional space (768-dimensional for real). The geometry of why nearby vectors can mean similar things is covered in [What Embeddings Are](/learn/ai-foundations/what-embeddings-are) — what matters here is just that an integer became a vector, and that vector now carries *where in the sequence* it sits, not just *which word* it is. (Step 3 below drops the small positional nudge to keep the arithmetic exact — in a real 12-layer network it stays in the vector the whole way through, it just doesn't change which token wins in this particular example.)

> **Why this step?** An ID has no sense of similarity — token 4881 isn't "closer to" token 1611 in any way that matters; it's a row number. Embedding trades the ID for a vector living in a space where distance and direction can encode meaning, learned entirely from co-occurrence during training. Position gets added for the same reason "France of capital the" doesn't mean what "the capital of France" means — without it, every occurrence of a word looks identical no matter where it sits.

### 3. Attention mixes context

On its own, the vector for `is` knows nothing about France — it's the same 4 numbers every time the word "is" shows up in any sentence anywhere. Attention is what lets the vector at the last position pull in information from earlier positions before the network has to commit to anything.

```python
import numpy as np

K = V = np.array([
    [1.0, 0.0, 0.0, 0.0],   # The
    [0.0, 1.0, 0.0, 0.0],   # capital
    [0.0, 0.0, 0.0, 0.0],   # of
    [0.0, 0.0, 1.0, 0.0],   # France
    [0.0, 0.0, 0.0, 1.0],   # is
])
tokens = ["The", "capital", "of", "France", "is"]

# stand-in for W_Q @ x_is — a real model learns this projection; we hand-set it
# so that "is" is looking for whatever filled the place/topic slot earlier in the sentence
q_is = np.array([0.2, 0.3, 1.5, 0.4])

d_k = K.shape[1]
scores = (K @ q_is) / np.sqrt(d_k)          # one dot product per position
weights = np.exp(scores - scores.max())
weights /= weights.sum()

for tok, w in zip(tokens, weights):
    print(f"{tok:>8s}  {w:.3f}")

z_is = weights @ V
print("z_is =", z_is.round(3))
```

```
     The  0.167
 capital  0.176
      of  0.151
  France  0.320
      is  0.185
z_is = [0.167 0.176 0.32  0.185]
```

Causal masking (covered in [Causal Masking](/learn/llm-foundations/causal-masking)) is what makes this legal in the first place: the `is` position is allowed to look back at `The`, `capital`, `of`, and `France` because they came before it, but `The` was never allowed to peek ahead at `is` when it computed its own attention. Every position only ever sees its own past.

Look at what came out: `France` pulls the largest share of attention weight (32%), and the resulting vector `z_is` has its third component — the "France" axis — as its largest entry, even though the raw embedding for "is" started with a zero there. The position that has to predict the next word just absorbed a signal from three tokens back.

> **Why this step?** By itself, the embedding for "is" is identical every single time that word appears. Attention lets each position rebuild its vector out of everything relevant that came before it. By the time we reach the last position, its vector isn't really "is" anymore — it's closer to "is, in a sentence about the capital of France."

### 4. Unembed + softmax: the vocabulary votes

Stack eleven more attention-and-feedforward blocks on top of the one above (GPT-2 small has 12 total) and that France-lean typically sharpens rather than fades — later layers build on what earlier ones found. Rather than hand-simulating eleven more layers, let's jump to a plausible final hidden state and run the last operation: multiply it by the unembedding matrix (in GPT-2, this is literally the token-embedding matrix from Step 2, transposed — the model reuses one lookup table in both directions) to get one score per vocabulary row, then softmax.

```python
import numpy as np

def softmax(x):
    x = np.asarray(x, dtype=float)
    x = x - x.max()          # numerical stability, doesn't change the result
    e = np.exp(x)
    return e / e.sum()

# a plausible final hidden state at the last position, after 11 more layers
h_final = np.array([0.17, 0.18, 1.92, 0.18])

vocab = ["Paris", "Lyon", "Marseille", "Berlin", "London"]
# 5 rows pulled from the real (50257, 768) unembedding matrix
unembed = np.array([
    [0.2, 0.1, 2.00, 0.2],   # Paris
    [0.2, 0.1, 1.00, 0.1],   # Lyon
    [0.1, 0.1, 0.75, 0.1],   # Marseille
    [0.1, 0.0, 0.50, 0.2],   # Berlin
    [0.0, 0.1, 0.25, 0.2],   # London
])

logits = unembed @ h_final     # -> [3.93, 1.99, 1.49, 1.01, 0.53]
probs = softmax(logits)
for word, p in sorted(zip(vocab, probs), key=lambda t: -t[1]):
    print(f"{word:>10s}  {p:6.2%}")
```

Those raw logits round to a clean `[4.0, 2.0, 1.5, 1.0, 0.5]`, which is what we'll carry forward — the exact decimals were our own stand-in numbers to begin with, not a measurement of anything real. Softmax turns them into:

```
     Paris  77.08%
      Lyon  10.43%
 Marseille   6.33%
    Berlin   3.84%
    London   2.33%
```

`Paris` wins — not because the model "decided" anything, but because its unembedding row happens to line up most closely with the direction the final hidden state points in. The other 50,252 rows in the real vocabulary get scored too; most land on strongly negative logits (punctuation, unrelated words), so softmax hands them only a vanishingly small combined slice. We're just not printing all 50,257 lines.

> **Why this step?** A vector isn't an answer — "points toward the France-topic direction" has to become a claim about one specific next word. Multiplying by the unembedding matrix asks the same question 50,257 times at once ("how much does this final vector look like *this* row?"), and softmax turns the resulting scores into something that behaves like a probability distribution: non-negative, summing to 1, ready to be sampled from. This is the distribution [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai) is describing in general terms — here it's the actual numbers.

### 5. Generation is the loop, not a single step

Nothing in steps 1–4 stops after one token — there's no "done" flag anywhere in the architecture. Something samples one token from the distribution above, appends it to the input, and the entire four-step pipeline reruns on the longer sequence.

```python
def generate_step(vocab, logits, temperature=1.0, greedy=True, rng=None):
    probs = softmax(np.asarray(logits) / temperature)
    if greedy:
        idx = int(np.argmax(probs))
    else:
        rng = rng or np.random.default_rng()
        idx = rng.choice(len(vocab), p=probs)
    return vocab[idx], probs

# Turn 1: "The capital of France is" -> next token
vocab_1, logits_1 = ["Paris", "Lyon", "Marseille", "Berlin", "London"], [4.0, 2.0, 1.5, 1.0, 0.5]
tok, probs = generate_step(vocab_1, logits_1, temperature=1.0)
print(tok, probs.round(3))
# -> Paris [0.771 0.104 0.063 0.038 0.023]

# Turn 2: "The capital of France is Paris" -> next token
# a fresh forward pass over 6 tokens now — no memory of turn 1 outside the sequence itself
vocab_2, logits_2 = [",", ".", " and", " which"], [3.2, 2.8, 1.0, 0.6]
tok2, probs2 = generate_step(vocab_2, logits_2, temperature=1.0)
print(tok2, probs2.round(3))
# -> , [0.539 0.361 0.06  0.04 ]
```

Turn 2 isn't a continuation of some in-progress plan — it's steps 1 through 4, run again from scratch, on a sequence one token longer. (Real systems cache the keys and values for tokens already processed so they don't redo that arithmetic, but conceptually every new token is still a full forward pass over the whole prefix.)

> **Why this step?** There's no separate sentence-planning stage hiding in the architecture. "Generation" is just this loop — sample, append, rerun — and it's exactly why a model can paint itself into a corner: nothing upstream ever reconsiders a token once it's been appended.

### 6. Temperature: same logits, different dice

`generate_step` above already takes a `temperature` argument — it divides the logits by `T` before the softmax. Turn the same Step-4 logits through three temperatures:

```python
for T in [0.5, 1.0, 2.0]:
    probs = softmax(np.array(logits_1) / T)
    print(f"T={T}:", dict(zip(vocab_1, probs.round(3))))
```

```
T=0.5: {'Paris': 0.972, 'Lyon': 0.018, 'Marseille': 0.007, 'Berlin': 0.002, 'London': 0.001}
T=1.0: {'Paris': 0.771, 'Lyon': 0.104, 'Marseille': 0.063, 'Berlin': 0.038, 'London': 0.023}
T=2.0: {'Paris': 0.487, 'Lyon': 0.179, 'Marseille': 0.140, 'Berlin': 0.109, 'London': 0.085}
```

The logits never moved. `T=0.5` divides them by a number less than 1, which stretches the gaps between them before the exponential — Paris ends up all but certain. `T=2.0` shrinks the gaps, and suddenly Berlin and London are back in the running. As `T → 0`, softmax converges to picking the single largest logit every time (equivalent to greedy `argmax`); as `T → ∞`, it converges to uniform — every candidate equally likely regardless of what the network actually preferred.

> **Why this step?** Argmax alone makes a model deterministic and, for open-ended text, repetitive — it always takes the single most likely continuation, forever. Temperature is a knob on the *sampling* step, not the network: it rescales logits before softmax so you can trade off how often you take a chance on the second-best token, without retraining anything.

## Where it breaks

Everything above worked because the logits handed to the final layer were already lopsided — Paris's score (4.0) was double the runner-up's (2.0). Two different things can go wrong from here, and they produce identical-looking output (fluent, grammatical, confident) for completely different reasons.

**Failure 1 — temperature turned up until the sharp distribution stops mattering.** Push the *same* logits through `T=5` instead of `T=1`:

```python
probs = softmax(np.array(logits_1) / 5)
print(dict(zip(vocab_1, probs.round(2))))
# -> {'Paris': 0.3, 'Lyon': 0.2, 'Marseille': 0.18, 'Berlin': 0.17, 'London': 0.15}
```

Paris is still individually the most likely single token — but there's now roughly a 70% chance the sampler lands on something else. Sample from this enough times and you will eventually generate "The capital of France is Berlin." — a completely fluent, grammatically correct sentence that's false, from a model whose top answer was correct the entire time. High temperature didn't make the model dumber; it made the sampler stop caring how confident the model actually was.

*Fix:* for anything where you want the mode and not a sample — factual lookups, tool-call arguments, classification labels — use low temperature, often literally `temperature=0` (equivalent to argmax), rather than trusting a wide distribution to survive the dice roll.

**Failure 2 — the distribution itself is flat, and temperature can't fix that.** Now imagine this were a fact the model's training didn't nail down nearly as hard — a less universally-repeated capital city — and the final logits came out close together instead of lopsided: `[2.1, 2.0, 1.9, 1.8, 1.7]` instead of `[4.0, 2.0, 1.5, 1.0, 0.5]`.

```python
probs = softmax([2.1, 2.0, 1.9, 1.8, 1.7])
print(dict(zip(vocab_1, probs.round(2))))
# -> {'Paris': 0.24, 'Lyon': 0.22, 'Marseille': 0.2, 'Berlin': 0.18, 'London': 0.16}
```

Even greedy decoding (`T → 0`) still prints "Paris" here — correctly — but nothing about the printed word tells you it won a five-way photo finish (24% vs. the 20% you'd get guessing uniformly) instead of the 2-to-1 blowout from before. Temperature governs how a distribution gets sampled; it has no way to fix a distribution that's flat to begin with, because flat means the network genuinely never learned a strong preference. This is the same mechanism behind [Why LLMs Hallucinate](/learn/ai-foundations/why-llms-hallucinate): the failure isn't in the sampling, it's in what the training data ever gave the model a reason to be sure about.

*Fix:* if it matters whether the model was sure or barely sure, don't read the sampled token alone — read the distribution (most inference APIs will return top-token log-probabilities on request). And for facts you can't afford to get wrong, don't lean on parametric memory at all: retrieve the answer and put it in the context instead of hoping the weights memorized it strongly enough.

## Takeaways

- Every arrow in a "how LLMs work" diagram is a concrete array operation here: tokenize → integers, embed → vectors, attend → reweighted vectors, unembed → logits, softmax → probabilities. None of it is metaphor.
- The model never "chooses" Paris. It computes a distribution over its entire vocabulary; a separate sampling step (argmax or otherwise) collapses that distribution into one token.
- Generation is that same four-step pipeline rerun on a longer sequence, one new token at a time — no planning stage, no lookahead, only the growing context.
- Temperature rescales logits before softmax. It changes how sharply the distribution favors the top candidate; it cannot change which candidate has the highest logit in the first place.
- A model can produce a false, fluent sentence two structurally different ways: an unlucky sample from a genuinely sharp distribution (temperature's doing), or a confident-looking greedy pick from a genuinely flat one (the training's doing). On the page, they read identically.
- If you need to know how sure a model actually was, look at the logits or probabilities — the printed word alone throws that information away.

**Related:** [How LLMs Work](/learn/ai-foundations/how-llms-work) · [Self-Supervised Learning: Next-Token Example](/learn/ai-foundations/self-supervised-next-token-example) · [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai) · [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty) · [Interpretability & the Black-Box Problem](/learn/ai-foundations/interpretability-black-box-problem) · [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it)
