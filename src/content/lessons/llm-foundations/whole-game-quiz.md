---
title: "Quiz: The Whole Game"
track: "llm-foundations"
status: live
summary: "Nine questions covering the forward pass, the generation loop, softmax, and what a model does and doesn't remember."
duration: "9 min read"
---

Nine questions pulling from every lesson in this module — the forward pass, the generation loop, softmax, and the difference between weights, activations, and data. Answer before you check.

### Question 1

What does a trained language model return, given a sequence of token ids?

A. The single most likely next word, already decided
B. A probability distribution over every token in its vocabulary
C. A retrieved passage from its training data
D. A confidence score for the whole input sequence

<details><summary>Answer</summary>

**Correct: B.** A forward pass produces one logit per vocabulary token, then softmax turns those into a full probability distribution — see [what a language model actually computes](/learn/llm-foundations/what-a-language-model-actually-computes). Sampling from that distribution is a separate step that comes after.

- A is wrong because picking a single word is what *sampling* does after the distribution exists — the model itself outputs the whole distribution, not a pre-made decision.
- C is wrong because nothing about a forward pass involves retrieving stored text; see [myths about how LLMs work](/learn/llm-foundations/myths-about-how-llms-work).
- D is wrong because the output isn't one score for the input — it's `vocab_size` scores, one per candidate *next* token.

</details>

### Question 2

In the autoregressive generation loop, what happens immediately after a token is sampled?

A. The model is retrained on that token
B. The token is discarded and a fresh prompt is used
C. The token is appended to the sequence and fed back in as input
D. The vocabulary is reduced by one token

<details><summary>Answer</summary>

**Correct: C.** That append-and-refeed step is the entire mechanism behind [the autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) — it's what turns one next-token prediction into arbitrarily long text.

- A is wrong because weights never change during generation — only during training or fine-tuning, a completely separate regime (see [training time vs. inference time](/learn/llm-foundations/training-time-vs-inference-time)).
- B is wrong because throwing the token away would mean the loop never progresses past one token.
- D is wrong because the vocabulary — the set of tokens the model can choose from — is fixed by the tokenizer and never shrinks during generation.

</details>

### Question 3

Given logits `[0, 1, 2]` for a three-token vocabulary, which value is closest to the probability softmax assigns to the token with logit `2`?

A. 0.25
B. 0.50
C. 0.665
D. 0.90

<details><summary>Answer</summary>

**Correct: C.** `exp(0)=1, exp(1)≈2.718, exp(2)≈7.389`, summing to about `11.107`. Dividing gives roughly `[0.090, 0.245, 0.665]` — the token with logit `2` gets about 66.5% of the distribution. Full step-by-step mechanics for exactly this kind of calculation are in [logits to probabilities, by hand](/learn/llm-foundations/logits-to-probabilities-by-hand).

- A (0.25) is too low — it underweights the top logit; because softmax exponentiates the gaps between logits, the largest logit's share climbs well above a naive linear split.
- B (0.50) would only be right if the distribution were close to a coin flip between two tokens — here there are three, and the gaps between logits aren't equal.
- D (0.90) overshoots — that would require a much larger gap between the top logit and the rest than `1` unit.

</details>

### Question 4

Suppose the autoregressive loop's append-and-refeed step were removed — every generation step fed the model only the original prompt, never the tokens produced so far. What would happen?

A. Generation would be faster with no change in output quality
B. The model would repeatedly predict the same next token after the prompt, never building a coherent multi-token continuation
C. The model would automatically switch to teacher forcing
D. The context window would shrink to zero

<details><summary>Answer</summary>

**Correct: B.** Without appending the sampled token back into the input, every "step" is really the identical forward pass over the identical prompt — sampling might occasionally vary the single next token, but nothing accumulates into a sentence. This is exactly why the append step is treated as load-bearing in [the autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) and traced concretely in [generating a sentence token by token](/learn/llm-foundations/generating-a-sentence-token-by-token).

- A is wrong because the outcome isn't "the same quality, faster" — it's qualitatively broken; you'd never get more than one new token's worth of information out of the whole process.
- C is wrong because teacher forcing is a *training*-time technique that feeds true tokens, not a fallback behavior for a broken inference loop.
- D is wrong because the context window's size is a property of the model's architecture, unrelated to whether the loop happens to keep reusing the same prompt.

</details>

### Question 5

Which of these persists inside a deployed language model after training is finished?

A. The raw training corpus
B. Intermediate activations from the model's last forward pass
C. The learned weights
D. The optimizer's gradient buffers

<details><summary>Answer</summary>

**Correct: C.** Weights are the one thing that survive training and get reused, unchanged, on every subsequent call — the whole distinction drawn in [parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data).

- A is wrong because the training corpus isn't stored in the deployed model at all — its patterns are compressed into the weights, but the text itself is gone.
- B is wrong because activations are recomputed fresh for every new input and discarded right after — nothing carries over between calls.
- D is wrong because gradient buffers exist only during training (they're what backpropagation uses to update weights) and have no role at inference, where no weight ever changes.

</details>

### Question 6

A user sets temperature to 0, hoping for "the smartest possible answer." What does that setting actually change?

A. It makes the model retrieve more accurate facts from training
B. It makes sampling deterministic — always pick the single highest-probability token — without changing what the model knows
C. It increases the model's parameter count for this request
D. It expands the context window

<details><summary>Answer</summary>

**Correct: B.** Temperature reshapes the softmax distribution *after* the forward pass has already produced its logits — at temperature 0, sampling collapses to always taking the top of that existing distribution. See [myths about how LLMs work](/learn/llm-foundations/myths-about-how-llms-work) and [sampling, temperature, and top-p](/learn/llm-foundations/sampling-temperature-top-p).

- A is wrong because temperature never touches the model's knowledge or its weights — it can only make an already-wrong logit less (or, at 0, still equally) likely to be picked.
- C is wrong because parameter count is fixed the moment training ends; no runtime setting changes it.
- D is wrong because context window size is an architectural property, unrelated to how a token is sampled from a distribution.

</details>

### Question 7

As a token's hidden state passes from transformer block 1 to block 12, what stays constant?

A. The tensor's shape, `(seq_len, d_model)`
B. The token count, which grows by one each block
C. The vocabulary size, which shrinks
D. The weights, which are identical across all 12 blocks

<details><summary>Answer</summary>

**Correct: A.** Every block takes `(seq_len, d_model)` in and returns `(seq_len, d_model)` out — the shape never moves until the final unembedding step. This is the core claim of [the forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks).

- B is wrong because the token count only grows across separate forward passes in [the generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) — it doesn't change *within* a single pass through the 12 blocks.
- C is wrong because vocabulary size never appears inside the block stack at all — it only shows up at the very end, in [the unembedding step](/learn/llm-foundations/the-vocabulary-and-the-unembedding).
- D is wrong, and it's the tempting distractor: the blocks are architecturally *identical* in design, but each one has its own independently learned weights — sameness of structure, not sameness of values.

</details>

### Question 8

Why does an LLM's final linear layer produce exactly `vocab_size` numbers, no more and no fewer?

A. Because that's the model's total parameter count
B. Because next-token prediction is framed as classification over the vocabulary, and softmax needs one raw score per candidate token
C. Because it matches the number of transformer blocks
D. Because it's set equal to the context window length

<details><summary>Answer</summary>

**Correct: B.** [The unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding) exists specifically to produce one logit per possible next token, because that's what a softmax-based classifier over the vocabulary requires — no more, no fewer.

- A is wrong because parameter count and vocabulary size are unrelated numbers — a model's total parameters run into the tens of millions or more, while `vocab_size` is typically tens of thousands.
- C is wrong because the number of transformer blocks (`n_layer`) is an independent architectural choice about depth, unconnected to how many candidate tokens exist.
- D is wrong because context window length governs how many *input* tokens a forward pass can see, not how many *output* candidates it scores.

</details>

### Question 9

A model with a 128k-token context window is used in two separate conversations, back to back, with no transcript passed between them. What does it "remember" from the first conversation in the second?

A. Nothing, unless the first conversation's transcript is explicitly included in the new context
B. Everything discussed, because the context window is large
C. Only the facts the model was highly confident about
D. It depends on the temperature setting used in the second conversation

<details><summary>Answer</summary>

**Correct: A.** A context window only governs how many tokens *one* forward pass can attend to in that call — it carries no memory between separate calls unless something upstream re-inserts the earlier transcript. See [context window mechanics](/learn/llm-foundations/context-window-mechanics) and the "bigger context means it remembers past chats" myth in [myths about how LLMs work](/learn/llm-foundations/myths-about-how-llms-work).

- B is wrong because window *size* has nothing to do with cross-session memory — a 128k window with nothing passed to it holds exactly as much of the prior conversation as a 4k window: none of it.
- C is wrong because there's no confidence-based memory mechanism at all — the model has no persistent memory to selectively retain from.
- D is wrong because temperature only affects how a token is sampled from a given distribution, not what information is available in the input to begin with.

</details>

**Related:** [What a Language Model Actually Computes](/learn/llm-foundations/what-a-language-model-actually-computes), [The Autoregressive Generation Loop](/learn/llm-foundations/the-autoregressive-generation-loop), [Myths About How LLMs Work](/learn/llm-foundations/myths-about-how-llms-work), [Parameters, Activations, and Data](/learn/llm-foundations/parameters-activations-and-data)
