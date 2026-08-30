---
title: "Portability and Evaluation Checkpoint"
track: "structured-outputs"
status: live
summary: "Six questions on provider quirks, portable adapters, the four quality metrics, gold-set discipline, regression gating, and monitoring."
duration: "9 min read"
---

Six questions pulled from across this module. Read the feedback on the wrong answers too — that's usually where the actual distinction sharpens.

### 1. What actually differs across providers

A team ports a working extraction pipeline from one provider to another. The schema is unchanged, both calls report success, but a downstream parser starts throwing on some responses. What's the most likely cause?

A. The new provider doesn't support JSON at all.
B. The new provider's response shape differs from the old one — for example, prose trailing the JSON object, or a JSON string instead of an already-parsed object — even though both count as a "successful" call.
C. The schema itself must be invalid, since it worked before.
D. This can only happen if the model version also changed.

<details>
<summary>Answer</summary>

**Correct: B.** Two providers can both report success on the same schema while returning genuinely different wire formats — trailing text after the JSON, a parsed dict versus a string, different null-handling. See [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape) and [One Schema, Three Providers](/learn/structured-outputs/same-schema-three-providers-example).

- A: Both providers are described as reporting success; if JSON weren't supported at all the call itself would fail, not just downstream parsing.
- B: Correct.
- C: A schema that worked on one provider isn't evidence it's invalid — it's evidence the two providers translate the same schema differently.
- D: A model version change isn't the only trigger; a provider swap with the same schema and no model change is enough to expose these differences, since the response-shape convention is a provider property, not a model property.

</details>

### 2. Where provider-specific logic belongs

In a codebase using the adapter pattern from this module, where should the code that knows OpenAI's strict mode requires every field in `required` actually live?

A. Inside the shared `extract()` function, guarded by an `if provider == "openai"` check.
B. Inside the Pydantic/Zod schema definition itself, so it's visible in one place.
C. Inside the OpenAI adapter's `request` method — the one place in the codebase that already knows it's talking to OpenAI.
D. It doesn't need to live anywhere; strict mode requires no special handling.

<details>
<summary>Answer</summary>

**Correct: C.** The adapter's `request` method is exactly the translation seam meant to hold provider-specific request-shaping logic. See [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code) and [A Provider Adapter](/learn/structured-outputs/provider-adapter-implementation).

- A: This is precisely the anti-pattern the adapter boundary exists to prevent — provider branches scattered through shared logic instead of isolated behind an interface.
- B: The schema should stay provider-agnostic; baking one provider's strict-mode workaround into the shared definition would make every other adapter carry a mutation it doesn't need.
- C: Correct.
- D: Strict mode's "every field required" rule is a real constraint that has to be handled somewhere — a schema with genuinely optional fields needs its `required` list forced and its optional fields represented as nullable before the request can be sent.

</details>

### 3. Reading a metrics report correctly

A pipeline reports 99% valid-rate and 97% schema-conformance rate, and a stakeholder concludes the pipeline is "basically done." What's missing from that conclusion?

A. Nothing — those two numbers are sufficient to judge extraction quality.
B. Both numbers can be measured with no gold data at all, and neither says anything about whether the field *values* are actually correct — that requires field-level accuracy and exact-match, which need labeled gold data.
C. The numbers are meaningless without knowing the model's parameter count.
D. Valid-rate and schema-conformance always move together, so reporting both is redundant.

<details>
<summary>Answer</summary>

**Correct: B.** Valid-rate and schema-conformance are the two cheapest, least informative metrics precisely because they need no gold labels — they say nothing about correctness. See [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics).

- A: This is the exact mistake the module warns against — high outer-ring metrics implying a claim about the inner rings they never measured.
- B: Correct.
- C: Model size is unrelated to which axis a metric measures; this doesn't address the actual gap.
- D: They can diverge — a response can conform to every type and required-field rule while still being wrong on every value; conformance says nothing about whether the schema was satisfied with correct or incorrect data.

</details>

### 4. A gold-set discipline violation

An engineer, debugging a persistently wrong field, pastes one of the gold-set's labeled documents into the system prompt as a "here's exactly how to handle this case" example, planning to remove it before the next eval run — but forgets. What's the consequence?

A. None — as long as the labels themselves weren't edited, the gold set is still valid.
B. The eval's field-accuracy and exact-match numbers on that item (and possibly similar items) no longer measure generalization — the model has effectively seen the answer, turning a held-out exam into an open-book one.
C. This only matters if the pasted example was wrong.
D. It's fine as long as it's temporary, regardless of whether it's actually removed.

<details>
<summary>Answer</summary>

**Correct: B.** The instant a gold document appears in the prompt, any eval run scored while it's still there is measuring memorization, not generalization, for that item — the exact leakage risk in [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) and [Evaluation and Portability Mistakes](/learn/structured-outputs/eval-and-provider-mistakes).

- A: Correctness of the labels is irrelevant to this specific failure — the problem is exposure, not label accuracy.
- B: Correct.
- C: Even a correct pasted example compromises the measurement, because the model can now match the answer via the example rather than by actually solving the underlying task.
- D: "Forgot to remove it" is exactly the realistic failure mode — a plan to make it temporary provides no protection once it's forgotten, which is why leakage is a process risk, not just a hygiene preference.

</details>

### 5. Setting a CI regression threshold

A team's CI gate fails the build on any decrease in exact-match rate between runs, computed from a 15-item gold set with nonzero sampling temperature. What's the most likely operational outcome?

A. The gate will never fail, since 15 items is plenty to detect any real regression.
B. The gate will fail frequently on runs where nothing actually regressed, purely from sampling noise on a small set — and the team will likely start ignoring it.
C. This setup is ideal and needs no changes.
D. The gate will only fail on genuine schema-breaking changes.

<details>
<summary>Answer</summary>

**Correct: B.** A small gold set has a standard error large enough that "any decrease" will trip on noise alone, and a gate that cries wolf gets ignored — the exact derivation in [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts).

- A: 15 items is exactly the size where a couple of unlucky flips produces a real swing in the reported rate; it's too small to trust a bare decrease as signal.
- B: Correct.
- C: This setup is the anti-pattern the lesson works through in detail, not an example of a good gate.
- D: A gate this sensitive fires on ordinary sampling variance too, not only on genuine breaking changes — that's the whole problem.

</details>

### 6. Choosing which signal to act on

A production dashboard shows invalid-rate flat at its usual low baseline, but repair frequency has been climbing steadily for two weeks with no code, schema, or model change on record. What does this pattern most specifically indicate, and what should happen next?

A. Nothing actionable — if invalid-rate is flat, the pipeline is healthy by definition.
B. The input distribution or model behavior is drifting toward the edge of what the schema expects, and repair is currently absorbing the cost — a leading indicator that invalid-rate will likely follow if the cause isn't found and addressed.
C. This means the repair loop itself is broken and should be disabled.
D. This is purely a monitoring artifact and should be filtered out of the dashboard.

<details>
<summary>Answer</summary>

**Correct: B.** Repair frequency rising while invalid-rate stays flat is exactly the leading-indicator pattern described in [Monitoring in Production](/learn/structured-outputs/monitoring-structured-output-in-production) — repair is quietly doing more work to hold the visible number steady.

- A: Invalid-rate being flat only tells you repair is currently succeeding; it says nothing about how much harder repair is having to work to keep it that way.
- B: Correct.
- C: A rising repair rate is evidence the repair loop is doing its job under harder conditions, not evidence it's broken — disabling it would just let the drift show up as invalid-rate immediately instead of giving early warning.
- D: Dismissing a steady, sustained two-week trend as noise ignores exactly the kind of slow drift this signal exists to catch before it becomes a visible failure.

</details>

**Related:** [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape), [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code), [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset), [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts), [Monitoring in Production](/learn/structured-outputs/monitoring-structured-output-in-production)
