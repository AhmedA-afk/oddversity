---
title: "Why Models Emit Broken JSON"
track: "structured-outputs"
status: live
summary: "Invalid JSON is a predictable artifact of token-by-token sampling with no lookahead, not a model being bad at JSON."
duration: "9 min read"
---

Invalid JSON from an unconstrained model isn't the model "being bad at JSON" — it's a predictable consequence of how token-by-token sampling works, and once you see the mechanism you can predict which failures show up and why constraining generation, not better prompting, is what actually removes them.

> **Optional depth.** This goes a level deeper than you need to *use* structured output correctly. Read it to understand why the failure modes in [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes) look the way they do — not because you need it to build a working pipeline.

## The mechanism: generation has no lookahead

A model generates autoregressively: it predicts a probability distribution over the next token conditioned on every token so far, then samples one token from that distribution — a process shaped by temperature and top-p (see [Sampling: Temperature and Top-p](/learn/llm-foundations/sampling-temperature-top-p) and [Next-Token Prediction](/learn/llm-foundations/next-token-prediction)). Critically, the model never plans the whole JSON object before starting. It commits to the opening `{`, then a key, then a colon, then a value, one irreversible token at a time, with no built-in mechanism to revise an earlier token once it's emitted. Every failure pattern below is a direct consequence of that single fact.

## Four concrete failure patterns

### 1. Mid-object truncation on length limits

Generation is a linear token stream with a hard `max_tokens` cutoff. If the object is still open when the budget runs out, the stream simply stops — mid-string, mid-array, wherever the cutoff lands:

```json
{"vendor": "ACME Bolts", "line_items": [{"sku": "M8-HEX", "qty": 3, "unit_price": 0.40}, {"sku": "M6-WASH
```

There was no point during generation where the model "decided" to truncate. The process was told to stop, and unlike a person wrapping up a sentence, it has no built-in notion of "let me close this out neatly" unless that behavior was specifically trained in or enforced at decode time.

### 2. Wrong escaping of quotes and newlines

When a string value needs to contain a literal quote — extracting a clause like `The buyer said "deliver by Friday"` — the model must, deep inside generating that string, choose `\"` over a bare `"`. That choice is just another token decision made under the same probability distribution as every other token; there's no separate "am I inside a JSON string, better escape this" subroutine unless the constraint is enforced structurally. An occasional unescaped quote slipping through breaks the string boundary for every character that follows it.

### 3. Trailing commas

```json
["battery life", "camera", "packaging",]
```

That trailing comma before `]` is invalid JSON. This is a direct artifact of local pattern continuation: "item, item, item," is an extremely common sequence in ordinary prose and code, and the decision to close the array with `]` versus continue with another item is made independently, per token, from the decision to emit the separating comma before it. The model can commit to "another item is coming" before it's actually decided the list is finished.

### 4. Hallucinated keys

A schema asks for `{amount: float, currency: string}` and the model returns:

```json
{"amount": 127.44, "currency": "USD", "notes": "invoice looked slightly overdue"}
```

The extra `notes` key isn't a misunderstanding of the schema — it's the model continuing in a locally plausible direction, because nothing in unconstrained decoding stops it from extending the object past the fields you named. The schema was a request stated in the prompt, not an enforced boundary on which tokens are legal next.

## Why this is a sampling artifact, not a bug

None of these four require the model to be "confused" about JSON syntax the way a person making a typo is confused about spelling — the model has almost certainly seen millions of syntactically perfect JSON documents in training. Each failure is a per-token sampling decision compounding without any mechanism to revise earlier tokens or verify global well-formedness before the stream ends. That's precisely the gap that JSON mode and schema-constrained decoding close structurally: they don't make the model "understand JSON better" — they remove the illegal tokens from the sampling distribution at every step, so the failure literally cannot be sampled, regardless of what the underlying probabilities looked like. See [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood) and [Schema-Constrained Decoding, Explained](/learn/structured-outputs/schema-constrained-decoding-explained) for exactly how that removal happens at the token-mask level.

## Tradeoffs, stated precisely

- Prompting for "be careful with JSON syntax" can reduce the *rate* of all four failures — it nudges the probability distribution toward better patterns — but it cannot make the rate zero, because the underlying per-token sampling process is unchanged.
- Constrained decoding eliminates the pure-syntax versions of 1 through 3 by making illegal tokens unsamplable, at the cost of some inference-side complexity and, mechanism-dependent, added latency (see [What Constraints Cost You](/learn/structured-outputs/what-constraints-cost-you)). It does not eliminate a hard cutoff mid-generation leaving a valid-but-incomplete object — the constraint keeps every emitted token legal, but a stream that stops early is still an incomplete document.
- No mechanism here fixes pattern 4's semantic cousin: a schema-legal value in a field that exists, chosen wrongly. Constraining decoding stops the model from inventing an extra key; it does nothing to stop the model from confidently filling a real key with the wrong value. That's a layer-3 problem, covered in [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) and [Evaluating Structured Output Quality: Metrics](/learn/structured-outputs/evaluating-structured-output-quality-metrics).

## Where next

Mid-object truncation is exactly why partial, in-flight JSON needs its own handling rather than waiting for a complete document — see [Incremental JSON Repair, Explained](/learn/structured-outputs/incremental-json-repair-explained). For the full catalog of what these patterns look like once they reach your validation code, see [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes).

**Related:** [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood) · [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes) · [Incremental JSON Repair, Explained](/learn/structured-outputs/incremental-json-repair-explained) · [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means)
