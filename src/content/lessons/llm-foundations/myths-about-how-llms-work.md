---
title: "Myths About How LLMs Work"
track: "llm-foundations"
status: live
summary: "Four persistent myths about how LLMs work, corrected against what the forward pass actually does."
duration: "7 min read"
---

Four claims about LLMs get repeated so often they start to feel like established fact. All four fall apart the moment you trace them back to what actually happens inside [a forward pass](/learn/llm-foundations/what-a-language-model-actually-computes).

### The mistake: "It looks the answer up in a database"

**Why it's wrong:** there is no stored table of facts or passages the model consults while generating. A forward pass is the same fixed sequence of matrix multiplications on every single call, regardless of what's being asked — nothing resembling a query against a document store happens inside it. What the model "knows" was compressed into its weights during training, and the original text is gone by inference time — see [parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data) for exactly what does and doesn't survive past training.

**Symptom:** someone asks the model to "cite its source" the way a search engine would, or is surprised that it produces a plausible-sounding but nonexistent citation.

**Fix:** treat the model's knowledge as *compressed and interpolated*, not stored and indexed — accurate for common, well-represented facts, unreliable for anything that needed to be looked up rather than learned as a pattern. If you actually need retrieval and citations, that's a separate system bolted on top of the model, covered in [fine-tuning vs. prompting vs. RAG](/learn/llm-foundations/fine-tuning-vs-prompting-vs-rag).

### The mistake: "It plans the whole sentence before writing the first word"

**Why it's wrong:** [the autoregressive loop](/learn/llm-foundations/the-autoregressive-generation-loop) produces a distribution over exactly one next token per call. There's no buffer anywhere holding "the rest of the sentence" — the fifteenth word is decided in its own forward pass, after the first fourteen have already been sampled and appended, with no access to some earlier "plan."

**Symptom:** a well-structured, multi-clause answer looks like it must have been outlined in advance, the way a person drafts before writing.

**Fix:** the structure you're seeing emerges from token-by-token momentum — each token shifts what's most probable next, and coherent structure is a side effect of a well-trained distribution, not evidence of lookahead. Where models genuinely do get something like a scratchpad, it's because extra tokens are generated *before* the final answer and fed back in as context — that's [chain-of-thought and test-time compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute), and it's still the same one-token-at-a-time loop, just given more steps to work with.

### The mistake: "Temperature changes what the model knows"

**Why it's wrong:** temperature reshapes the softmax distribution *after* the logits are already fixed by the forward pass — it makes the distribution flatter (values pushed toward uniform, more random picks) or sharper (values pushed toward the max, more deterministic picks). Nothing about turning temperature up or down changes a single weight or recomputes a single logit.

**Symptom:** setting temperature to 0 expecting "the smartest, most accurate" answer, or turning it up expecting "more creative facts" — as if new information could appear from a sampling parameter.

**Fix:** temperature governs how deterministically you sample from a distribution the model already computed — it can make a wrong logit *less* likely to be picked, but it cannot supply a correct logit that wasn't there. See [sampling, temperature, and top-p](/learn/llm-foundations/sampling-temperature-top-p) for the full mechanics, including why temperature 0 isn't magic either — it's just always taking the top of a distribution that can itself be wrong.

### The mistake: "A bigger context window means it remembers past chats"

**Why it's wrong:** a context window is the number of tokens one forward pass can attend to *in that single call* — it's supplied fresh with every request. There is nothing persistent left inside the model's weights after a conversation ends; activations are computed and discarded per call (see [parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data)), and the model has no side channel for storing "what happened last week."

**Symptom:** expecting a brand-new conversation to somehow know who you are or what you discussed previously, purely because the model supports a large context window.

**Fix:** cross-session memory, where it exists, is a product feature built *around* the model — a system that retrieves and re-inserts prior transcripts into a new prompt. It has nothing to do with context window *size*; a 128k-token window with no re-inserted history remembers exactly as much about a previous session as a 4k-token one: nothing. See [context window mechanics](/learn/llm-foundations/context-window-mechanics) for what the window actually governs.

## Pre-flight checklist

Before making a claim about how a model "knows," "plans," "gets smarter," or "remembers," check:

- [ ] Am I describing something in the fixed weights, or something in one forward pass's activations?
- [ ] Would "it's just predicting the next token, one at a time" already explain this behavior?
- [ ] Am I mistaking the context window for persistent, cross-session memory?
- [ ] Am I attributing a change in knowledge to what's actually just a change in a sampling parameter?

**Related:** [The Autoregressive Generation Loop](/learn/llm-foundations/the-autoregressive-generation-loop), [Sampling, Temperature, and Top-p](/learn/llm-foundations/sampling-temperature-top-p), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
