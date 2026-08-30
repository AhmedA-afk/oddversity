---
title: "Capstone: Build a Tiny GPT and Watch It Learn"
track: "llm-foundations"
status: live
summary: "Assemble every from-scratch piece in this track into one working GPT, train it on a tiny corpus, and run guided experiments that break it on purpose."
duration: "8 min read"
---

Every earlier capstone piece in this track — a tokenizer, an attention head, a transformer block, a sampler — has been a component tested in isolation. This is the assignment where they stop being separate exercises and become one program that watches its own loss fall.

There's no numbered walkthrough here. You've already built each piece; this page is the spec you assemble them against, plus the experiments that turn a working model into an understood one.

## The brief

Build a small, fully working GPT-style language model from the pieces you've implemented across this track: a byte-pair tokenizer, an embedding table, rotary position embeddings, causally-masked multi-head attention, a SwiGLU feed-forward block, and top-p sampling. Train it end to end on a small corpus — a character-level corpus (Shakespeare, a book you like, your own writing) or a small token-level dataset, sized so a full training run finishes in minutes to a couple of hours on whatever hardware you have, not days. Watch the loss curve fall, and watch the model's generations go from noise to something locally coherent.

This isn't a from-scratch reimplementation for its own sake. The point is to see, on your own screen, the exact objects this track has been describing in the abstract: an attention pattern actually attending to the right tokens, a loss curve actually following the shape [scaling laws](/learn/llm-foundations/scaling-laws-what-they-predict) predicts at small scale, and a sampling temperature actually changing what comes out.

## Acceptance criteria

- [ ] A working tokenizer trained on your corpus (BPE, or character-level if you want to keep the surface area small) with encode/decode round-tripping correctly on held-out text
- [ ] An embedding table plus rotary position embeddings applied to queries and keys before the attention dot product — not added positional vectors, the actual RoPE rotation
- [ ] Causally-masked multi-head attention, verified by confirming position `i`'s output is unchanged when you alter tokens at positions `> i`
- [ ] At least one full transformer block (attention + SwiGLU feed-forward + residual connections + normalization), stacked at least 2–4 deep
- [ ] Top-p (nucleus) sampling implemented and switchable against greedy decoding, with a temperature parameter
- [ ] A training loop that logs loss every N steps, and a saved plot or printed table showing loss falling over the course of training
- [ ] Generated samples captured at at least three points in training (early, middle, late) so the coherence progression is visible and comparable
- [ ] Written answers (a few sentences each) to all four guided experiments below, referencing the specific mechanism responsible for what you observed

If you can't check every box, ship what's true and mark the rest as a known gap — an honest gap list is itself evidence you understand what each piece does.

## Suggested stack

- **Framework:** PyTorch is the standard choice for the training loop and autograd; a pure-numpy forward pass is a valid (harder) alternative if you want to also hand-implement backprop, but isn't required.
- **Corpus:** something in the range of a few hundred KB to a few MB of text — large enough that the model has something to learn, small enough that a full run doesn't need serious compute. Character-level modeling on a single book keeps the vocabulary tiny and the whole pipeline easy to debug end to end.
- **Model size:** a handful of layers, a model width in the low hundreds, and a context length of 128–256 tokens is plenty to see the effects below. This capstone is about mechanism, not scale — a bigger model mostly costs you iteration speed.
- **Compute:** a single GPU (even a modest one) trains this in minutes; CPU-only is workable for a character-level model at this size if a GPU isn't available, just slower.

## Milestones

Each milestone is a capability you can demonstrate, not a step to check off a tutorial.

1. **The pipeline runs end to end, badly.** Random-initialized model, one forward pass, one backward pass, loss is a number (even a bad one). This is the milestone that catches shape bugs before you've wasted a training run on them.
2. **Loss actually falls.** A real training run, logged, shows a clearly decreasing loss curve — not necessarily smooth, but trending down over hundreds to thousands of steps.
3. **Generations go from noise to structure.** Sample text at the start of training (should look like random tokens), partway through (should look like plausible local structure — real words, rough grammar), and near the end (should look like short, locally coherent passages in the style of your corpus).
4. **You can explain every shape in the forward pass.** Given any intermediate tensor in your model, you can state its shape and why it's that shape, without looking it up — the [LLM internals reference card](/learn/llm-foundations/llm-internals-reference-card) is the cheat sheet, not a substitute for knowing it.
5. **The four guided experiments are run and explained**, not just performed. "The output got weirder" is not an answer; "removing the causal mask lets later tokens leak information backward, so the model can partially solve the task by looking ahead instead of predicting it" is.

## What good looks like

The bar isn't "it produced English-looking words." It's a model whose behavior you can predict and explain from mechanism before you run the experiment, and whose actual behavior then confirms or usefully contradicts your prediction. A generation that's a little repetitive or occasionally nonsensical is completely fine at this scale — a tiny model on a tiny corpus for a short training run is not going to be fluent, and treating "it's not GPT-4" as a failure misses the point. What matters is that the loss curve, the attention patterns, and the sampling behavior all move the way the mechanisms in this track predict they should, and that your written explanations for the guided experiments are grounded in those mechanisms rather than vague impressions.

## Extensions

Once the core build is solid and the four experiments are done, in roughly this order of payoff:

- **Change temperature systematically.** Generate the same prompt at temperatures from 0.1 to 1.5 and describe the trend, connecting it to [temperature as flattening the distribution](/learn/llm-foundations/temperature-as-flattening) the softmax produces.
- **Remove the causal mask entirely and retrain from scratch.** Not just at inference — retrain the model with full (non-causal) attention and compare the resulting loss and generations. Explain the difference using [causal masking](/learn/llm-foundations/causal-masking) and what the training objective is actually asking the model to predict.
- **Shrink the context window and watch a long-range task degrade.** Pick or construct a tiny task in your corpus that requires remembering something from far back (a name introduced early, referenced late), then artificially cap the model's context length below that distance and show the task starts failing — a hands-on version of [context window mechanics](/learn/llm-foundations/context-window-mechanics).
- **Swap in a tiny few-shot prompt at inference and see if in-context learning shows up at all.** At this scale, it may not — and explaining *why not*, using [in-context learning mechanics](/learn/llm-foundations/in-context-learning-mechanics) and what induction heads need to have formed, is itself a real result.
- **Plot loss against model size or data size at fixed compute**, using two or three tiny training runs, and see whether your own toy curve resembles the shape from [scaling laws: what they predict](/learn/llm-foundations/scaling-laws-what-they-predict) — a small-scale, hands-on check of the same power law the rest of the track discusses abstractly.

Ship the four required experiments first. Every extension above is worth more once you've actually watched your own model's loss fall and can point at the mechanism behind each behavior you observe.

**Related:** [LLM Internals Reference Card](/learn/llm-foundations/llm-internals-reference-card), [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Causal Masking](/learn/llm-foundations/causal-masking), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics), [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics), [Temperature as Flattening](/learn/llm-foundations/temperature-as-flattening)
