---
title: "Foundation Models & LLMs: Check Your Model"
track: "ai-foundations"
status: live
summary: "A 6-question self-check quiz for the Foundation Models & LLMs module, testing understanding (not recall) of why LLMs predict tokens rather than facts, what fine-tuning can and can'"
duration: "12 min read"
---

Six scenarios, no vocabulary recall. Each one is designed to catch the exact place where a plausible-sounding mental model breaks — the same places engineers get burned in production.

## 1. What's actually happening when it "knows" an answer

You ask a model "What's the capital of France?" and it answers "Paris." What is mechanically happening?

- A. It queries an internal fact table mapping country → capital, built during pretraining.
- B. It computes a probability distribution over the next token given everything before it, and "Paris" wins that distribution by a wide margin because that continuation was reinforced enormously often across its training data.
- C. It performs something like a live lookup encoded in its weights, similar to a database query.
- D. It doesn't really process the question — it just emits the statistically most common word in English as the next token, regardless of context.

<details>
<summary>Answer</summary>

**Correct: B.** There's no fact table and no lookup. Training pushes the weights so that, given a context, the next-token distribution puts most of its mass on tokens that continue plausibly and correctly — for extremely well-represented facts like this one, that distribution is sharply peaked on the right answer. See [how LLMs work](/learn/ai-foundations/how-llms-work) for the full mechanism.

**A** — Tempting because the output *feels* like retrieval, and something fact-like clearly is encoded somewhere in the weights. But "somewhere in the weights" is not the same as a queryable table with an address you can look up or edit. That distinction is exactly why you can't patch one wrong fact by editing a value — you have to retrain, fine-tune, or hand the model the correct text at inference time (retrieval).

**C** — There's no live lookup unless the model is wired to a tool or retrieval system. A base model answering from its own weights has no access to anything outside the forward pass that's running right now.

**D** — If this were true, the model couldn't produce coherent, varied text at all — every answer would collapse to the same few high-frequency words. The prediction is conditioned on the *entire context*, which is why changing the question changes the answer.

</details>

## 2. What fine-tuning is actually a lever for

Your base model reasons fine but won't reliably output strict, valid JSON. A teammate proposes fine-tuning on a few thousand prompt → correctly-formatted-JSON examples. Separately, you also want the model to know about a product that launched last week, after its training cutoff. Which is accurate?

- A. Fine-tuning is a good fit for the JSON formatting problem. It's a poor, unreliable way to teach durable new facts like the product launch — a few thousand examples is a tiny signal next to the trillions of tokens the model was pretrained on, and pushing hard on a narrow dataset risks memorizing your exact examples (or degrading general ability) rather than building reliable recall.
- B. Both problems are equally well-suited to fine-tuning — it's just more gradient descent on new data, so it teaches new facts and new behaviors equally well.
- C. Neither problem can be solved with fine-tuning. Output format and factual recency are both locked in at pretraining time.
- D. Fine-tuning should be used for the factual-knowledge problem, and the JSON-formatting problem should be solved with prompting alone, never fine-tuning.

<details>
<summary>Answer</summary>

**Correct: A.** [Fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning) is strongest at *reshaping behavior* on top of capability the model already has — format, tone, task-following, refusal patterns. It's weak at *injecting knowledge* reliably, because there's no mechanism forcing the model to generalize a handful of examples about one product into robust recall — you get something closer to inconsistent memorization. For facts outside the training window, retrieval (handing the model the source text at inference time) is the more trustworthy tool.

**B** — This is the trap. "More training" isn't a uniform knob — a few thousand examples targeting a narrow behavior is a completely different signal-to-noise regime than trillions of tokens of diverse pretraining, and it can even come at a cost (catastrophic forgetting of other abilities if you overfit the fine-tuning set).

**C** — Wrong in the other direction. Behavior absolutely can be changed after pretraining — that's the entire premise of instruction tuning and [RLHF](/learn/ai-foundations/rlhf-and-instruction-tuning), which is why the same base model can be turned into something that follows formatting instructions it previously ignored.

**D** — Backwards on both counts: prompting alone can't reliably teach facts the model never saw, and it dismisses fine-tuning for exactly the problem (format/behavior) it's actually good at.

</details>

## 3. Where the cost is actually coming from

You're building a chat feature. Turn 1 is cheap. By turn 20, every response costs noticeably more and takes longer — even though the user keeps typing short, single-sentence messages and the replies are the same length as always. Why?

- A. The model has to re-read the entire conversation history as input tokens on every single call — it has no memory between requests — so the input token count, and the cost, grows with the length of the conversation, not just the new message.
- B. API pricing tiers automatically increase the longer a single conversation runs.
- C. The model "gets tired" and needs more compute to hold quality steady as the conversation gets longer.
- D. Only output tokens are billed, so this must mean the model is quietly generating longer, more detailed answers as the conversation goes on.

<details>
<summary>Answer</summary>

**Correct: A.** The model is stateless between calls — nothing persists in its weights or activations from one request to the next. So the client has to resend the whole transcript every time:

```python
# Turn 1
messages = [{"role": "user", "content": "Hi"}]

# Turn 20 — the entire prior transcript goes back in as input tokens,
# not just the newest message
messages = [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "..."},
    # ... 17 more turns of history ...
    {"role": "user", "content": "ok one more question"},
]
```

Input tokens are billed (and take time to process) whether they're brand new or the same history you sent last turn. This is the mechanical link between [tokens and cost](/learn/ai-foundations/tokens-and-cost-worked-example) that catches people building their first chat feature — cost scales with conversation length, not message length.

**B** — There's no such escalating-tier mechanism triggered by conversation length; the per-token rate doesn't change mid-conversation. This is a plausible-sounding invented explanation, which is worth noticing as a pattern in itself.

**C** — Anthropomorphizes the model. There's no fatigue state; each call is an independent forward pass.

**D** — Wrong on the premise (most APIs bill both input and output tokens) and wrong on the diagnosis — the growth here is on the input side (resent history), which this option doesn't even consider.

</details>

## 4. What a scaling law is actually a prediction about

A research team trains a series of small and mid-size models, plots loss against compute, and fits a curve before committing budget to a much larger run. What can they now reliably predict about the untrained giant model?

- A. Roughly where its pretraining loss will land on the extrapolated curve — a fairly reliable prediction — but *not* necessarily how that translates into performance on any specific downstream benchmark, since some capabilities show up abruptly rather than improving smoothly alongside loss.
- B. Its exact score on any given benchmark (coding, reasoning, etc.), since loss and benchmark accuracy scale identically.
- C. Whether the model will be safe and well-aligned, since scaling laws account for capability and alignment together.
- D. The precise parameter count needed to reach human-level performance on any task, since scaling laws define a fixed ceiling.

<details>
<summary>Answer</summary>

**Correct: A.** [Scaling laws](/learn/ai-foundations/scaling-laws-worked-example) describe a smooth, predictable relationship between compute/data/parameters and pretraining loss — that's genuinely useful for planning a run you haven't afforded yet. What they don't hand you for free is task performance: a benchmark score is usually a threshold on top of a continuous underlying capability (right answer or not), so a smooth loss curve can produce what looks like a sudden jump in a specific skill — the kind of behavior covered under emergent abilities.

**B** — Tempting because loss and benchmark performance are correlated in general, but the relationship isn't 1:1 or guaranteed per-task. Treating "loss will be X" as "benchmark score will be Y" is exactly the extrapolation scaling laws don't license.

**C** — Alignment and safety come from separate training stages (instruction tuning, RLHF, red-teaming) layered on top of the base model, not from the loss-vs-compute curve. A model can sit exactly where its scaling law predicts on loss and still behave in ways nobody wants.

**D** — Overclaims what a curve fit under specific data and architecture assumptions can tell you. "Human-level" isn't a well-defined single point on the curve, and scaling laws describe a trend, not a hard ceiling.

</details>

## 5. Why "bigger is always better" breaks under a fixed budget

Your team has a fixed compute budget for one training run — a set number of GPU-hours, no more. An engineer argues: "We should make the model as many parameters as memory allows, since bigger models are more capable." What's wrong with that reasoning?

- A. For a fixed compute budget, model size and training-data size trade off against each other. Pouring most of the budget into parameters while leaving too few tokens to train on produces an *undertrained* large model — one that a smaller model trained on proportionally more data, using the same total compute, would actually beat. Compute has to be balanced across both axes, not maxed out on one.
- B. Nothing is wrong with it — for any fixed compute budget, the largest possible model always reaches the lowest loss, full stop.
- C. The real problem is that larger models are always slower at inference, so the fix is to pick the smallest model that fits in memory, regardless of training data.
- D. Compute budget only limits training *time*, not final quality, so parameter count doesn't matter as long as training eventually finishes.

<details>
<summary>Answer</summary>

**Correct: A.** This is the finding that corrected a lot of early "just make it bigger" intuition: for a given compute budget (measured in FLOPs, not GPU count or wall-clock time), there's a balance point between how many parameters you train and how many tokens you train them on. Many early large models were sized up without scaling their training data proportionally, and were measurably undertrained relative to what the same compute could have achieved with a smaller model and more data. "Bigger" only wins if the data scales with it — [scaling laws](/learn/ai-foundations/scaling-laws) are precisely what expose this trade-off instead of treating parameter count as a free-standing virtue.

**B** — The absolute language ("always," "full stop") is itself a tell. This is the exact claim the compute-optimal finding overturns: past a certain point, more parameters with insufficient data trains worse than fewer parameters with more data, for the same compute spend.

**C** — Inference speed is a real cost (see [inference cost and latency intuition](/learn/ai-foundations/inference-cost-and-latency-intuition)), but it's a different problem from *training*-compute allocation, and "smallest model regardless of data" ignores the actual lever the question is about.

**D** — Compute is the constraint on achievable loss, not just a clock — that's the whole premise of plotting loss against compute in the first place. If parameter count vs. data split didn't matter, there would be no such thing as an undertrained model.

</details>

## 6. Why confident and correct can look identical

Asked to cite the page number for a specific claim in a paper it's never seen in full, a model gives a specific, plausible-looking page number. It's wrong. Why does this happen instead of "I don't have that information"?

- A. The next-token objective rewards fluent, plausible continuations — it has no built-in signal separating "confident because this pattern was seen constantly" from "guessing because this is the shape an answer is expected to take." Unless a model has specifically been trained to recognize and flag uncertainty (via instruction tuning/RLHF, or grounded by retrieved source text it can check against), a fabrication and a genuine recollection come out equally fluent.
- B. The model knows it doesn't have the answer and chooses to lie anyway, to appear competent.
- C. This only happens with smaller or older models — sufficiently large modern models don't fabricate specific details like this.
- D. The wrong page number must have appeared somewhere in training, since the model can only output things it saw verbatim.

<details>
<summary>Answer</summary>

**Correct: A.** Generating a citation-shaped answer and generating a *correct* citation are the same process from the model's point of view — both are "produce a plausible continuation of this prompt." Nothing in next-token prediction inherently distinguishes calibrated knowledge from confabulation; that gap is exactly what [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate) digs into, and it's why grounding (giving the model the actual source to quote from) works better than asking it to recall unaided.

**B** — Anthropomorphizes the failure. There's no intent, no private knowledge that it's suppressing — "knowing you don't know" is a calibration behavior that has to be specifically trained for, not a default state models start in.

**C** — Scale reduces some errors but doesn't eliminate this structurally — confabulation is a property of open-ended generation without grounding, not something that disappears purely by adding parameters. See [what LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) for where scale does and doesn't help.

**D** — Confuses generation with verbatim memorization. The model isn't quoting a memorized exact string — it's producing a sequence that has the *shape* of a real citation, learned from having seen the general pattern of "papers have page-numbered claims" many times, not this specific wrong number anywhere in particular.

</details>

**Related:** [How LLMs work](/learn/ai-foundations/how-llms-work) · [Pretraining vs. fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning) · [RLHF and instruction tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) · [Tokens, context, cost](/learn/ai-foundations/tokens-context-cost) · [Scaling laws](/learn/ai-foundations/scaling-laws) · [Emergent abilities in LLMs](/learn/llm-foundations/emergent-abilities-in-llms) · [Why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate)
