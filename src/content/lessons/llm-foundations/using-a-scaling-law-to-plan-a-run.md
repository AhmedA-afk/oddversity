---
title: "Using a Scaling Law to Plan a Training Run"
track: "llm-foundations"
status: live
summary: "A fixed FLOPs budget, worked by hand into a params/tokens split, plus what a naive over-parameterized choice wastes."
duration: "7 min read"
---

You've been handed a training budget denominated in FLOPs, not dollars, and asked how big to make the model. [Scaling laws](/learn/llm-foundations/scaling-laws-what-they-predict) tell you loss falls smoothly with scale — this page turns that into the one number a planning memo actually needs: the parameter count and token count that budget should buy.

## The setup

**Budget: C = 5 × 10²² FLOPs** (a toy number, picked only so the arithmetic lands cleanly — real frontier runs are one to three orders of magnitude larger).

The tool is the standard compute identity, covered in [counting the FLOPs of one token](/learn/llm-foundations/counting-the-flops-of-one-token): `C ≈ 6 · N · D`, where N is parameter count and D is training tokens. Paired with the Chinchilla-style compute-optimal ratio of roughly **20 tokens per parameter** (`D ≈ 20N`), that's two equations and two unknowns — solvable, not guessable.

## Step by step

### Step 1 — substitute the ratio into the compute identity

```
C = 6ND
D ≈ 20N
→ C ≈ 6N(20N) = 120N²
```

> **Why this step?** One equation (`C = 6ND`) has infinitely many valid (N, D) pairs — a 1B model and a 500B model can both "use up" the same C at some D. The 20:1 ratio is the second constraint that pins down a single answer instead of a whole curve of them.

### Step 2 — solve for N, then D

```python
C = 5e22
N = (C / 120) ** 0.5
D = 20 * N

print(f"N ≈ {N:.3e} params")
print(f"D ≈ {D:.3e} tokens")
print(f"Check: 6ND = {6 * N * D:.3e}")
```

```
N ≈ 2.041e10 params   (≈ 20.4B)
D ≈ 4.082e11 tokens   (≈ 408B)
Check: 6ND = 5.000e22   ✓
```

> **Why this step?** This is the entire planning answer: a **20.4B-parameter model trained on 408B tokens** is the compute-optimal point for this budget. Every other (N, D) pair that also spends 5 × 10²² FLOPs sits off this ratio and, per the scaling law, lands at a higher loss for the identical spend.

### Step 3 — price out a tempting "just make it bigger" alternative

Suppose the team wants a 175B-parameter flagship instead — bigger sounds like a safer sell — on the *same* budget:

```python
N_big = 175e9
D_big = C / (6 * N_big)
ratio = D_big / N_big

print(f"D ≈ {D_big:.3e} tokens")
print(f"tokens per parameter ≈ {ratio:.2f}")
```

```
D ≈ 4.762e10 tokens   (≈ 47.6B)
tokens per parameter ≈ 0.27
```

> **Why this step?** 0.27 tokens per parameter is roughly **74x below** the 20:1 optimum. This model spends the identical 5 × 10²² FLOPs as the 20.4B/408B model from Step 2, but it never sees enough text to justify its own size — it's badly undertrained, not badly designed. This is, in rounded shape, the real story behind why several early large models — huge parameter counts paired with comparatively modest token counts — sat far to the undertrained side of this curve.

### Step 4 — see the loss cost of that mismatch

Using the same illustrative loss surface from [scaling laws: what they predict](/learn/llm-foundations/scaling-laws-what-they-predict):

```python
def loss(N, D, E=1.7, A=400.0, B=800.0, alpha=0.34, beta=0.28):
    return E + A / N**alpha + B / D**beta

print(f"Compute-optimal (20.4B/408B): {loss(2.041e10, 4.082e11):.3f}")
print(f"175B/47.6B (undertrained):    {loss(175e9, 4.762e10):.3f}")
```

The undertrained run comes out with a visibly worse loss — for the same FLOPs bill — because the illustrative loss surface penalizes a starved D term (`B/D^beta`) more sharply than the modest N gain buys back. That's the concrete cost of "over-parameterized, under-trained": you paid for capacity you never gave the model enough data to use.

## Where it breaks

Compute-optimal minimizes *training* loss for a *fixed training budget* — it says nothing about inference. If this model will be queried millions of times, every one of those 20.4B parameters costs FLOPs on every single call, forever. A smaller model trained past the 20:1 ratio — intentionally "overtrained" relative to the compute-optimal point — can land at a slightly higher training cost but a much cheaper, faster model to actually serve. This is why several open-weight model families deliberately train smaller models on more tokens than the Chinchilla ratio calls for: they're optimizing total cost of ownership, not the training run in isolation. See [training time vs. inference time](/learn/llm-foundations/training-time-vs-inference-time) for that second half of the tradeoff.

**The fix:** treat the compute-optimal (N, D) pair from Step 2 as the answer to "cheapest way to buy this training loss," not as the final word on model size. If the deployment plan involves heavy serving volume, deliberately shift the split toward smaller N and larger D than the ratio suggests, and check the resulting loss increase against the inference savings — a calculation this page's arithmetic hands you the inputs for, but doesn't finish on its own.

## Takeaways

- **A fixed compute budget turns "how big should this model be" into algebra**, not a judgment call — `C = 6ND` plus an empirical N:D ratio pins down a single point.
- **Parameter count without matching tokens isn't a proxy for quality.** Two runs can burn the identical FLOPs and land at very different losses purely because of the split between them.
- **The 20:1 ratio is a rounded, regime-specific constant** — worth re-deriving from your own training curves rather than treating as permanent, the same caveat [scaling laws: what they predict](/learn/llm-foundations/scaling-laws-what-they-predict) raises about the exponents themselves.
- **Compute-optimal for training loss is not compute-optimal for total cost.** A model you'll serve at scale often justifies deliberately undershooting N and overshooting D relative to the ratio above — see [training time vs. inference time](/learn/llm-foundations/training-time-vs-inference-time).

**Related:** [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Counting the FLOPs of One Token](/learn/llm-foundations/counting-the-flops-of-one-token), [Training Time vs. Inference Time](/learn/llm-foundations/training-time-vs-inference-time), [Parameters, Activations, and Data](/learn/llm-foundations/parameters-activations-and-data)
