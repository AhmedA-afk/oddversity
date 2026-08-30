---
title: "Why Inference Is Bottlenecked by Memory, Not Math"
track: "ai-foundations"
status: live
summary: "An intuition-first lesson explaining why LLM inference is memory-bandwidth-bound rather than compute-bound: it builds a 'walk the weight warehouse for every token' mental model, co"
duration: "14 min read"
---

Ask a model to output one word and ask it to write a careful, reasoned paragraph, and the cost per word comes out nearly the same — which is strange if you think of inference as "thinking harder for harder questions." It isn't. Almost every millisecond you wait for a token is spent moving numbers around, not computing with them.

## The picture: load the weights, answer with one word, repeat

Picture a warehouse holding every number in the model — its weights — stacked on shelves, aisle after aisle, sometimes tens of billions of them. Next to the warehouse sits a small workbench where the actual arithmetic happens: multiply this number by that one, add it to a running total. The workbench is tiny compared to the warehouse — nowhere near enough room to keep the whole inventory sitting out at once.

To produce a single output token, someone has to walk every aisle that matters, pull each weight off its shelf, carry it to the workbench, do one multiply-and-add with it, and set it down. Once you've walked the relevant part of the warehouse and combined every weight with the current token's data, out comes exactly one token. Then the process starts over: same walk, same shelves, same weights — because the *next* token depends on what you just produced, so you can't even begin fetching for it until the previous one exists. You re-walk the whole warehouse, from scratch, for every single token.

That's the entire idea. Everything below is just this picture getting more precise.

## Walking through a token, step by step

Trace three tokens of a reply and notice what stays fixed and what changes.

1. You send a prompt. The model turns it into a sequence of numbers — nothing has been fetched from the weight warehouse yet for the *next* token.
2. To produce token 1, the model runs that data through every layer: for each layer, it pulls that layer's weights out of memory, multiplies them against the current numbers, and moves on. Every weight in every layer gets touched, once, to produce token 1.
3. Token 1 is chosen and appended to the sequence — it now becomes part of the input.
4. To produce token 2, the model runs the *whole warehouse walk again* — same weights, same layers, same multiply-and-adds — this time combined with token 1. There's no way to fetch weights for token 2 before token 1 exists, because token 2's computation depends on it.
5. Repeat for token 3, 4, 5, and so on, for as long as the reply runs.

Steps 2 and 4 aren't different in kind — same shelves, same walk, same volume of data moved. What changes between tokens is only which numbers you multiply the weights against, and, as the next two sections cover, how much *extra* material besides the weights you have to drag along.

This one-at-a-time dependency is also the specific thing that makes inference different from training the same model. Training already has the entire target sequence sitting in memory, so it can process thousands of positions in a single pass — see [training-vs-inference](/learn/ai-foundations/training-vs-inference) for that half of the picture. Inference can't do that trick during generation, because it doesn't know token 2 until it has produced token 1. That dependency is the whole reason the warehouse gets walked again and again instead of once.

## The wrong intuition: harder questions should be slower

The natural guess is that generating a token is like solving a math problem — more reasoning, more time. It feels like a carefully-reasoned next word should take longer to produce than a trivial one like "the."

It doesn't, really. Once the weights are sitting at the workbench, the multiply-and-add for "the" and the multiply-and-add for a hard-won next word are the identical operation on the identical amount of data. The model doesn't do more arithmetic for a "harder" token — every token is the same walk through the same warehouse. What differs between an easy question and a hard one is usually how many tokens it takes to answer, not the cost of any single token.

The same wrong intuition shows up as "a faster or bigger chip should make generation proportionally faster." Faster arithmetic helps with the multiply-and-add step, but that step was never the bottleneck — the walk to the shelves was. Once most of your time is going into moving weights rather than computing with them, giving the workbench more raw arithmetic speed is like hiring a faster cashier for a line that's stuck at the door. See [ai-hardware-stack](/learn/ai-foundations/ai-hardware-stack) for what's actually sitting on each side of that door; what matters here is recognizing which side the wait is coming from.

## Why parallelism is the actual fix

If moving weights dominates, the lever that helps is either moving fewer of them, or making one walk answer more questions at once. This second option — batching — is the real mechanism behind "GPUs and TPUs win through parallelism."

Here's the math-to-bytes relationship made concrete. Say one layer's weight matrix has shape `(d_in, d_out)`, stored at 2 bytes per weight (a typical inference precision):

```python
import numpy as np

d_in, d_out = 8, 32          # toy size — the ratio below doesn't depend on it
W = np.zeros((d_in, d_out))
bytes_per_param = 2          # 16-bit weights

flops = 2 * W.size                       # one multiply + one add per weight, for ONE token
bytes_moved = W.size * bytes_per_param   # every weight has to be read at least once

print(flops, bytes_moved, flops / bytes_moved)
# 512 512 1.0
```

That ratio — one useful operation for every byte fetched — doesn't change if you swap in a real transformer's dimensions (a few thousand by a few thousand instead of 8 by 32). It's a property of multiplying a matrix by a single vector, not of the model's size. And it's a bad ratio to hand an accelerator: modern chips are built to do far more arithmetic than that for every byte they pull from memory, which means most of their multiply-and-add capacity sits idle, waiting for the next weight to arrive. That idle capacity is exactly what batching puts to work:

```python
batch_size = 32   # next-token requests from 32 different conversations, processed together

flops_batched = 2 * batch_size * W.size
bytes_moved_batched = W.size * bytes_per_param   # same weights, fetched once, reused 32 times

print(flops_batched / bytes_moved_batched)
# 32.0
```

Fetch the weights once, multiply them against 32 different requests' data instead of one, and the math-to-bytes ratio scales directly with batch size. That's the actual mechanism: not that the chip does one multiply faster, but that thousands of arithmetic units can chew on the *same fetched weight* for many requests at once, so one expensive walk to the shelves gets amortized across many answers instead of one. It's also why a token often arrives faster and cheaper when a provider's servers are busy serving many users at once than when a model is running just for you.

## Why a longer conversation costs more per token

Weights aren't the only thing that has to be read for every token. To decide what comes next, the model also attends back over everything already said — every previous token's key and value vectors, cached from when they were first computed (see [attention-mechanism-explained](/learn/llm-foundations/attention-mechanism-explained) and [context-window-mechanics](/learn/llm-foundations/context-window-mechanics) for what those actually are). That cache is extra shelving that grows every time a token gets added to the conversation, and it has to be read in full before each new token, on top of the fixed weight warehouse.

Ten tokens of history is a short detour down one aisle. Fifty thousand tokens of history is its own warehouse, re-read in full before every new word. The weights stay the same size all conversation long; the notebook of everything already said keeps growing — and rereading a longer notebook is strictly more bytes moved per token, even though nothing about the model itself changed. That's the mechanical reason a long-context request is slower and pricier per output token than a short one, independent of how large the model is. See [tokens-context-cost](/learn/ai-foundations/tokens-context-cost) for how that shows up on an actual bill.

## Why a bigger model costs more per token

This one is the simplest consequence of the picture: a bigger model is a bigger warehouse. More parameters means more shelves to walk for every single token, regardless of context length, regardless of batch size. A model with twice the parameters, at the same precision, moves roughly twice the bytes per token — which is roughly twice the minimum time, and, on a metered API, roughly twice the price for the same output, before batching or lower-precision weights change the constant.

That's a separate lever from context length: context grows the notebook you reread; model size grows the warehouse you walk, once, every time. A provider's higher per-token price for a bigger model is mostly a receipt for a bigger walk, not a receipt for "more thinking" on any single token — [choosing-a-model-decision-framework](/learn/ai-foundations/choosing-a-model-decision-framework) is where that tradeoff, quality per token against bytes moved per token, actually gets made.

## When this picture breaks down

The one-warehouse-walk-per-token story is the right mental model for decoding — generating tokens one by one — but it doesn't hold everywhere:

- **Processing the prompt is a different regime.** Before generating anything, the model has to run every prompt token through the network at least once. But those tokens already all exist — there's no need to wait for one before starting the next — so the model stacks them together and multiplies them against the weights all at once, the same trick as the batching example above. This step (often called prefill) is usually compute-bound rather than memory-bound; the slow, walk-per-token picture applies specifically to the tokens generated *after* the prompt, not to the prompt itself.
- **A busy server isn't walking the warehouse once per user.** As the batching math above shows, combining many users' next-token requests into one pass changes the ratio entirely — a provider running near-saturated batches can sit much closer to compute-bound than the single-request picture suggests. That's a real reason the same model can feel fast or slow depending on how busy the service is, not just on its size.
- **Not every model reads every shelf for every token.** Sparse, mixture-of-experts models route each token to only a fraction of their total parameters, so a model with a huge total parameter count can move far fewer bytes per token than that total implies. "Bigger model, bigger warehouse" assumes every parameter gets touched every time — worth checking before assuming a model's advertised size tells you its per-token cost.

The math-to-bytes arithmetic from the parallelism section still holds in all three cases — it's the same ratio, just computed on a different batch of work. What changes is which side of that ratio you happen to be stuck on.

**Related:** [AI hardware stack](/learn/ai-foundations/ai-hardware-stack) · [Training vs inference](/learn/ai-foundations/training-vs-inference) · [Attention mechanism, explained](/learn/llm-foundations/attention-mechanism-explained) · [Context window mechanics](/learn/llm-foundations/context-window-mechanics) · [Tokens, context, and cost](/learn/ai-foundations/tokens-context-cost) · [Tokens and cost, worked example](/learn/ai-foundations/tokens-and-cost-worked-example) · [Choosing a model: decision framework](/learn/ai-foundations/choosing-a-model-decision-framework) · [Open vs closed models and hardware tradeoffs](/learn/ai-foundations/open-vs-closed-and-hardware-tradeoffs)
