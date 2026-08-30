---
title: "Trading Compute, Data, and Parameters"
track: "ai-foundations"
status: live
summary: "A worked example that solves the Chinchilla compute-optimal split by hand and in numpy for a fixed toy compute budget, shows why many early large models were undertrained, and uses"
duration: "16 min read"
---

Ask an engineer how many tokens a given model size needs and you'll often get one number back: about 20 per parameter. That's not folklore — it falls out of a small optimization problem you can solve yourself in a few lines, and solving it is the fastest way to see exactly how starved a lot of "big" models actually were.

## The setup (specific)

[Scaling laws](/learn/ai-foundations/scaling-laws) shows you the shape of the curve: loss drops smoothly and predictably as compute grows. This page picks one point on that curve and does the arithmetic behind it — for a *fixed* compute budget, how do you split it between model size and training data?

The tool is a rough but widely used identity relating training compute to the two things you control:

```
C ≈ 6 · N · D
```

`C` is total training compute in FLOPs, `N` is parameter count, `D` is training tokens. The 6 comes from counting FLOPs per parameter per token: about 2 for the forward pass, roughly double that for the backward pass, so about 6 total — a standard rounding used across the [hardware stack](/learn/ai-foundations/ai-hardware-stack) that trains these models. It's an approximation, but a good enough one to reason with.

Here's the scenario for this page: **you've been handed a fixed budget of C = 1.2 × 10²² FLOPs.** That's a toy number — real frontier runs use far more — chosen only so the arithmetic comes out in round figures. Your job: pick N and D to get the lowest loss that budget can buy.

## Step by step

### Step 1 — see that N and D trade off against each other

Rearrange the identity: `D = C / (6N)`. Once C is fixed, choosing N *determines* D — you don't get to pick both freely.

Two extremes on that curve, same budget:

```
N = 1B    →  D = 1.2e22 / (6 × 1e9)   = 2,000B tokens   (2 trillion)
N = 100B  →  D = 1.2e22 / (6 × 1e11)  = 20B tokens
```

Both spend the same 1.2 × 10²² FLOPs. One trains a small model nearly to data exhaustion; the other trains a huge model on comparatively little text.

> **Why this step?** Because "more parameters" and "more data" aren't two separate budgets you can both max out — they're drawing from the same pool. Seeing the two extremes side by side makes it obvious that *somewhere* between them is better than either edge, before you've done a shred of optimization.

### Step 2 — use the empirical shortcut instead of guessing

Neither extreme above is good: the 1B model wastes tokens it can't absorb into that few parameters; the 100B model runs out of data and stalls with capacity it never gets to use. DeepMind's Chinchilla work found that the loss-minimizing point keeps parameters and tokens growing at close to the *same rate* as compute increases — which means their ratio settles near a constant. Rounded, that constant is about **20 tokens per parameter**.

That gives you a second equation to pair with the compute identity:

```
C = 6ND
D ≈ 20N
```

> **Why this step?** A single equation (`C = 6ND`) has infinitely many (N, D) solutions — you need a second constraint to pin down one answer. The 20:1 ratio *is* that second constraint, distilled from fitting many training runs down to a rounded rule of thumb.

### Step 3 — solve the toy budget by hand

Substitute `D = 20N` into `C = 6ND`:

```
C = 6 · N · 20N = 120N²
N² = C / 120 = 1.2e22 / 120 = 1e20
N  = 1e10 = 10B parameters
D  = 20 × 10B = 200B tokens
```

Check it: `6 × 10e9 × 200e9 = 1.2e22`. That's your compute-optimal point for this budget — **a 10B-parameter model trained on 200B tokens**, not a bigger model trained shorter or a smaller one trained longer.

> **Why this step?** This turns an abstract ratio into a number you can verify with a calculator. That's the whole point of a rounded heuristic: it should be cheap enough to check by hand before you commit a training run to it.

### Step 4 — confirm it by minimizing an actual loss surface

The 20:1 ratio isn't asserted from nowhere — it's the output of fitting a loss function with two terms, one that shrinks as N grows and one that shrinks as D grows, then finding where their combination is smallest under the compute constraint. You can reproduce the *shape* of that argument yourself with illustrative constants (not the paper's fitted values — just numbers picked so the ratio lands near 20, for teaching):

```python
import numpy as np

def loss(N, D, E=1.5, A=5.0, B=22.5, alpha=0.5, beta=0.5):
    n = N / 1e9   # parameters, in billions
    d = D / 1e9   # tokens, in billions
    return E + A / n**alpha + B / d**beta   # illustrative constants, not Chinchilla's fitted ones

C = 1.2e22                    # same fixed budget as Step 3
flops_per_param_token = 6

N_grid = np.logspace(8, 11, 400)                     # sweep 100M -> 100B parameters
D_grid = C / (flops_per_param_token * N_grid)        # tokens the budget allows at each N

losses = loss(N_grid, D_grid)
best = np.argmin(losses)

print(f"Best N: {N_grid[best]:.2e} params")
print(f"Best D: {D_grid[best]:.2e} tokens")
print(f"Tokens per parameter: {D_grid[best] / N_grid[best]:.1f}")
print(f"Loss at optimum: {losses[best]:.3f}")
```

Run it and you land within rounding distance of Step 3: N ≈ 9.9 × 10⁹, D ≈ 2.0 × 10¹¹, ratio ≈ 20. Worth checking one more thing by hand at that optimum: the two loss terms `A/n^0.5` and `B/d^0.5` come out **equal** (≈1.59 each here). That's not a coincidence — it's the actual condition being solved. If one term were larger, you'd get a lower loss by shifting FLOPs toward whichever side is more starved; the optimum is exactly where both sides stop complaining equally. (New to the array operations here? See [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals).)

> **Why this step?** The ratio in Step 2 can look like a memorized fact. Deriving it from "minimize this loss" instead shows it's a consequence of parameters and data having *similarly diminishing* returns — which is also why the ratio shifts if your data mix or architecture changes those returns.

### Step 5 — see what "undertrained" costs, on this same budget

Now suppose a team wants a flagship 50B-parameter model instead — bigger sounds stronger — but doesn't get any extra compute. Same C, much bigger N:

```
D = C / (6N) = 1.2e22 / (6 × 5e10) = 4e10 = 40B tokens
```

40B tokens for 50B parameters is **0.8 tokens per parameter** — 25× below the ~20:1 optimum. That model burns the identical 1.2 × 10²² FLOPs as the 10B/200B model from Step 3, but it never sees enough text to use most of its own capacity.

This is, in rounded terms, the real history: early large models sat far to the undertrained side of this curve — parameter counts in the hundreds of billions paired with token counts only modestly above them, well under 2 tokens per parameter. Chinchilla itself (70B parameters, 1.4 trillion tokens — about 20:1) was trained on roughly the same compute as Gopher (280B parameters, ~300B tokens) and came out ahead: four times smaller, fed properly, beating something four times bigger and starved.

> **Why this step?** "More parameters, same compute" is not automatically a stronger model — it's a *different point on the same feasible curve* from Step 1, and this one happens to sit far from the loss-minimizing point. Parameter count without tokens to match is compute you paid for and didn't collect on.

## Where it breaks

Extend the same scenario: instead of a bigger model on the same compute, give yourself 10× the compute and stay compute-optimal. Solving Steps 3–4 again at `C' = 1.2 × 10²³`:

| Compute (FLOPs) | Optimal N | Optimal D | Tokens/param | Toy loss |
|---|---|---|---|---|
| 1.2 × 10²² | ~9.9B | ~201B | ~20 | ~4.67 |
| 1.2 × 10²³ (10×) | ~31B | ~636B | ~20 | ~3.28 |

Both rows sit on the same ratio, and the loss drop between them is exactly the kind of smooth curve [scaling laws](/learn/ai-foundations/scaling-laws) shows you — predictable, no surprises, computable in advance from the recipe above.

Here's what that recipe can't tell you: whether some specific behavior — say, reliably working a 4-step arithmetic word problem, or holding a persona over ten turns — newly works at the second row. Two outcomes are equally consistent with the same 4.67 → 3.28 loss drop: the capability could have improved gradually in step with the loss (unremarkable), or it could have sat near zero success at the first row and mostly-working at the second (a jump). The loss number doesn't distinguish these, because loss is an average over every token the model predicts, while "did it solve the problem" is a pass/fail judgment on one specific behavior buried inside that average. A smoothly improving average can cross a pass/fail threshold at any point along the curve — sometimes gradually, sometimes all at once — and you cannot tell which from the loss curve alone.

That's the actual content behind emergence: it's not that models mysteriously acquire abilities, it's that a smooth quantity (loss) and a thresholded one (task success, especially under strict scoring like exact match) don't move at the same visible rate. See [emergent abilities in LLMs](/learn/llm-foundations/emergent-abilities-in-llms) for the full mechanism, including how the choice of metric can itself manufacture part of the apparent jump.

**The fix:** stop reading capability off the loss curve. If you need a model to reliably do something specific, evaluate that behavior directly at each scale checkpoint you can afford, and treat "where does this cross the threshold" as an empirical question you answer by testing — not one this compute-optimal arithmetic answers for you. The recipe tells you the cheapest way to buy a target loss; it has nothing to say about which capabilities that loss level unlocks.

## Takeaways

- **Fixed compute turns "how big should this model be" into arithmetic, not a guess.** `C ≈ 6ND` plus an empirical N:D ratio pins down both numbers — work it out before you commit a run.
- **The ~20-tokens-per-parameter figure is a rounded, regime-specific constant, not a law.** It falls out of parameters and data having similarly diminishing returns; change the data mix or architecture and the ratio moves. Check it against your own curves rather than treating it as permanent — [scaling laws](/learn/ai-foundations/scaling-laws) has the underlying shape.
- **Same compute, wrong split, worse model — parameter count alone isn't a proxy for quality.** A model can burn every FLOP a smaller, better-fed one used and still lose, simply because it never saw enough tokens to justify its own size.
- **Compute-optimal is optimal for training loss only — it ignores inference.** A model you'll query millions of times often pays back deliberately *overtraining* it (smaller N, more tokens than the 20:1 ratio suggests) many times over in serving cost. That tradeoff belongs to a different calculation — see [training vs. inference](/learn/ai-foundations/training-vs-inference) and [choosing a model: a decision framework](/learn/ai-foundations/choosing-a-model-decision-framework).
- **The recipe controls loss, not capability.** Loss falls on a smooth, predictable line as you scale compute-optimally; specific downstream abilities don't move in lockstep with it and can look like they appear from nowhere. Test the task you actually care about, not the loss number.

**Related:** [Scaling laws](/learn/ai-foundations/scaling-laws) · [Emergent abilities in LLMs](/learn/llm-foundations/emergent-abilities-in-llms) · [AI hardware stack](/learn/ai-foundations/ai-hardware-stack) · [Training vs. inference](/learn/ai-foundations/training-vs-inference) · [Choosing a model: a decision framework](/learn/ai-foundations/choosing-a-model-decision-framework) · [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals)
