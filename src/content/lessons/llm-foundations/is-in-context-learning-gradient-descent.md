---
title: "Is In-Context Learning Implicit Gradient Descent?"
track: "llm-foundations"
status: live
summary: "A forward pass over few-shot examples can be built to mimic an optimizer — but evidence a trained model actually does this stays incomplete."
duration: "8 min read"
---

Here's a genuinely strange claim, made precise enough to test: showing a transformer a handful of examples in its prompt is, in some cases, mathematically the same operation as running gradient descent on those examples — except the "training" happens entirely inside a single forward pass, with no weight update in sight.

> **Optional depth.** [In-context learning mechanics](/learn/llm-foundations/in-context-learning-mechanics) covers the concrete, verified circuit (induction heads) behind pattern-completion from context. This page covers a different, more contested hypothesis about what the *net effect* of that attention over examples amounts to — treat it as live research, not settled mechanism.

## The hypothesis

Frame in-context learning as a two-step process: the demonstrations in the prompt implicitly define a small learning problem (given these input-output pairs, predict the label for a new input), and the transformer's forward pass over those tokens implicitly *solves* that problem, producing an effective set of task-specific parameters that then generate the prediction. If that framing is literally true, ICL isn't just "retrieval-flavored pattern completion" — it's a learning algorithm running inside inference, using attention weights as the substrate instead of a gradient-updated parameter vector.

## The strongest evidence: hand-built constructions

The cleanest support comes from constructions, not from inspecting a real trained model. Von Oswald et al. (2023, "Transformers Learn In-Context by Gradient Descent") hand-built a transformer's attention weights such that a single layer of self-attention, applied to a sequence of (input, label) pairs followed by a query, provably computes exactly one step of gradient descent on a linear regression loss defined by those pairs — and stacking `k` such layers computes `k` steps. Dai et al. (2022, "Why Can GPT Learn In-Context?") made a related argument by treating each attention head's output as analogous to a "meta-gradient": under a specific set of simplifying assumptions, the update a linear attention layer applies to its output looks structurally like the update a single step of gradient descent would apply to a linear model's weights. Akyürek et al. (2022) trained small transformers from scratch on synthetic linear-regression-in-context tasks and found the learned solutions were closely comparable, in prediction quality, to running actual gradient descent or ridge regression on the same in-context examples.

Put together, this is a real result: it is possible to build (or train) a transformer whose forward pass provably or empirically matches what an optimizer would do on the in-context examples, at least for simple function classes like linear regression. That's not "attention looks a bit like learning" — it's an explicit, checkable equivalence in a controlled setting.

## Where it gets shakier

The complication is the gap between "a transformer *can* be built or trained to implement something GD-like on toy tasks" and "the transformers you actually use implement this as their mechanism for ICL in general." A few things push against the clean version of the claim:

- **The equivalence is exact mainly for linear, single-layer, or otherwise simplified setups.** Extending the construction to the deep, nonlinear, many-headed transformers used in practice, on genuinely nonlinear tasks (sentiment classification, translation, arbitrary pattern completion), requires approximations that the hand-built proofs don't cover — the math gets much less clean exactly where it would need to hold for the general claim to follow.
- **The induction-head account is a separate, independently verified mechanism for a large share of ICL behavior**, and it doesn't look like an optimizer step — it looks like a literal search-and-copy operation over the context, covered in [in-context learning mechanics](/learn/llm-foundations/in-context-learning-mechanics). Both accounts can be simultaneously true for different tasks or different heads within the same model, which makes "ICL is implicit GD" a claim about *part* of the mechanism at best, not a full replacement for the copying account.
- **Behavioral signatures don't always match.** If a model were truly running something close to gradient descent internally, you'd expect its in-context behavior to track known properties of optimization — sensitivity to example ordering the way a specific GD trajectory would predict, degradation patterns matching an optimizer's known failure modes. Follow-up work probing these predictions on real models has found mixed results: some GD-like signatures show up on the simple synthetic tasks the theory was built for, and they weaken or disappear on tasks further from that regime — exactly where [format effects like label balance and example order](/learn/llm-foundations/few-shot-vs-zero-shot-worked) start dominating instead.

## Open questions

Nobody has shown that a large, production language model literally executes anything resembling explicit gradient-descent steps for ICL on the tasks people actually use it for — sentiment classification, translation, extraction. What's been shown is narrower and still valuable: the transformer architecture has the *representational capacity* to implement optimizer-like updates internally, at least for a restricted function class, and small trained models sometimes do approximate that behavior on tasks built specifically to test for it. Whether that capacity is what's actually driving ICL on a broad, messy real-world task — versus induction-style copying, versus some third mechanism nobody's isolated yet — is unresolved. The honest summary: "implicit gradient descent" is a mechanism transformers are provably *capable* of running, observed under favorable, simplified conditions, and not yet established as *the* explanation for in-context learning in general.

**Related:** [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics), [In-Context Learning](/learn/llm-foundations/in-context-learning), [Few-Shot vs Zero-Shot: Worked Prompts](/learn/llm-foundations/few-shot-vs-zero-shot-worked), [Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained)
