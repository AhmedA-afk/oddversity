---
title: "Mechanisms Checkpoint"
track: "structured-outputs"
status: live
summary: "Six questions on what each decoding mechanism actually guarantees, and when to reach for which one."
duration: "6 min read"
---

Check what stuck from this module before moving on to schema design.

**1. You turn on JSON mode and prompt a model to extract a customer's name and order total. It returns `{"customer": "Jordan Kim", "total": "42.50"}` — the field names don't match your intended schema and `total` is a string, not a number. What happened?**

A. JSON mode failed — this shouldn't be possible with the flag on
B. JSON mode worked exactly as designed — it guarantees valid syntax, not your specific field names or types
C. The model ignored the JSON mode flag entirely
D. This only happens at high temperature; lowering it would fix the field names

<details>
<summary>Answer</summary>

**Correct: B.** JSON mode compiles one fixed, generic JSON grammar and enforces only that the output is syntactically valid — balanced braces, quoted keys, correct primitive types (string/number/bool/null/object/array). It was never given your schema, so it has no way to know `customer` should have been `customer_name` or that the total should be a number. This is the entire subject of [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees).

- A is wrong: the output is valid JSON, so JSON mode did exactly what it promises — the promise is just narrower than assumed.
- B is correct.
- C is wrong: nothing here indicates the flag was ignored — valid syntax with wrong field names is JSON mode's normal behavior, not a malfunction.
- D is wrong: temperature affects which tokens are sampled among legal options; it doesn't give JSON mode knowledge of a schema it was never given.

</details>

**2. A constrained decoder is generating the value for a `"status"` field with `"enum": ["open", "closed", "pending"]`. What does it actually do to the other tokens in the vocabulary at that step?**

A. Lowers their probability so they're unlikely but still possible
B. Sets their logits to negative infinity, making their probability exactly zero regardless of temperature or top-p
C. Removes them from the vocabulary permanently for the rest of the response
D. Flags them for a validation step to catch after generation finishes

<details>
<summary>Answer</summary>

**Correct: B.** Masking happens to the logits before sampling ever runs, setting illegal tokens to `-inf` so their post-softmax probability is exactly `0`. This is what makes the guarantee hold under every sampling strategy layered on top, including high temperature — there's no mass left to resurface. See [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive).

- A describes a repetition penalty or similar nudge, not masking — the qualitative difference is the whole point of [Asking Nicely vs a Physical Rail](/learn/structured-outputs/guardrails-vs-guidance-intuition).
- B is correct.
- C is wrong: tokens are masked only at states where they'd be illegal; the same token is fully available again the moment the grammar allows it (e.g., in a different field).
- D is wrong: this is a decode-time mechanism, not a post-hoc check — the whole benefit is that the invalid path is never taken, not caught afterward.

</details>

**3. Which of these is typically enforced by schema-constrained decoding at decode time, without needing a separate validation step afterward?**

A. `"minLength": 5` on a string field
B. `"minimum": 1, "maximum": 5"` on an integer field
C. `"enum": ["low", "medium", "high"]` on a string field
D. A cross-field rule that `end_date` must be after `start_date`

<details>
<summary>Answer</summary>

**Correct: C.** Enum membership compiles almost directly into the grammar — each allowed value becomes one accepted literal path, so the field can never come back with a value outside the set. Length bounds, numeric ranges, and cross-field rules are typically not enforced at decode time, even when your provider's schema syntax accepts the keyword — see [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained) for exactly why each one falls on the wrong side of the line.

- A is wrong: most implementations don't enforce string length bounds at decode time.
- B is wrong: a smooth numeric range doesn't map onto a small set of accepted paths the way an enum does, and most engines skip it.
- C is correct.
- D is wrong: this requires comparing two field values, which the grammar can't evaluate — it's exactly the kind of rule that needs [post-generation validation](/learn/structured-outputs/the-validation-layer).

</details>

**4. A schema for a multi-step math problem requires `{"answer": int}` with no other fields. Responses are schema-valid every time but wrong more often than expected. What's the most likely mechanism, and the most direct fix?**

A. The model doesn't understand math — switch to a larger model
B. The constraint is forcing the answer token before any visible reasoning has happened, so multi-step arithmetic has to complete inside one hidden forward pass; add a reasoning field ordered before the answer field, or split into a reasoning pass then a structuring pass
C. JSON mode is misconfigured — switch to a stricter provider flag
D. The schema needs `additionalProperties: false` added

<details>
<summary>Answer</summary>

**Correct: B.** Each generated token gets one forward pass' worth of computation; visible chain-of-thought works because each token becomes input to the next step, giving the model more effective compute spread across steps. Forcing the answer field first removes that scaffolding entirely. The fix is exactly what's covered in [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction) and [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern): give reasoning a place to happen before the constraint closes around the answer.

- A is wrong: this is a shape-of-the-schema problem, not a raw capability problem — the same model does much better with a reasoning field or a reasoning pass first.
- B is correct.
- C is wrong: this isn't a JSON-mode problem at all — the schema is a single required integer field and it's producing valid integers, just wrong ones.
- D is wrong: `additionalProperties: false` controls whether extra keys are allowed; it has nothing to do with when arithmetic happens relative to the answer field.

</details>

**5. You need to extract structured line items from invoices into a fixed JSON shape your code already parses with a JSON Schema. Which mechanism should you reach for first?**

A. A hand-written GBNF grammar
B. Prompt-only, worded very precisely
C. Native schema-constrained decoding (`input_schema`/`response_format` with your JSON Schema)
D. Regex-constrained decoding over the whole response

<details>
<summary>Answer</summary>

**Correct: C.** The target is already JSON matching a schema you have — this is exactly the case native schema-constrained decoding is built for: best provider support, lowest setup cost, and the guarantee (shape, types, enums) that actually matches what you need. See the "start here, then measure" guidance in the [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet).

- A is wrong: a hand-written grammar re-implements what schema-constrained decoding already gives you natively, for extra authoring and hosting cost — the mismatch covered first in [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes).
- B is wrong: prompt-only is a suggestion the model can violate, unsuitable for something feeding an automated parser.
- C is correct.
- D is wrong: a regex constrains one fixed-pattern string, not a multi-field nested object with arrays of line items.

</details>

**6. Which statement about the cost of constrained decoding is accurate?**

A. Grammar/schema compilation is paid on every single request, regardless of whether the schema has been used before
B. Per-token masking overhead scales with prompt length, not output length
C. Compilation is typically a one-time cost per distinct schema that can be cached and amortized across requests reusing that schema; per-token masking overhead is paid on every token of every constrained response
D. Constrained decoding has no quality effects — any cost is purely latency

<details>
<summary>Answer</summary>

**Correct: C.** These are two separate costs with two different shapes: compilation happens once per distinct grammar/schema and libraries cache the result, so cost amortizes toward zero as the same schema gets reused; masking overhead is a small but nonzero tax paid at every generation step, scaling with how many tokens you generate. Full breakdown in [The Cost of Constraints](/learn/structured-outputs/what-constraints-cost-you).

- A is wrong: this is the opposite of how caching works — a stable, reused schema pays the compile cost once, not per request.
- B is wrong: masking cost scales with the number of tokens *generated* under constraint, not with how long the prompt was.
- C is correct.
- D is wrong: constraint strength and correctness are different axes — see [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction) for a real quality cost, separate from latency.

</details>

**Related:** [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet), [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes), [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern)
