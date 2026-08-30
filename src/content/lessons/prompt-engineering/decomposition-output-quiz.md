---
title: "Quiz: Decomposition and Structured Output"
track: "prompt-engineering"
status: live
summary: "Ten questions on spotting a real seam, avoiding over-decomposition, writing a robust contract, and capping a repair loop."
duration: "9 min read"
---

Ten questions pulling from every lesson in this module — where to cut an overloaded prompt, when a pipeline has too many stages, what makes a schema actually enforceable, and how a repair loop should behave when it fails. Answer before you check.

### Question 1

A prompt currently does everything in one call: "Read this document, classify it as a contract or an invoice, then write a two-paragraph plain-English summary of it for a client." You're told to add exactly one seam — split this into two calls for the biggest reliability win. Where do you cut?

A. Between "read" and "classify" — reading is its own stage
B. Between "classify" and "summarize" — classification is graded on a fixed label being right or wrong, summarizing is graded on tone and clarity for a lay reader
C. Halfway through the summary, splitting paragraph one from paragraph two
D. Nowhere — three verbs in a prompt always means three mandatory stages

<details><summary>Answer</summary>

**Correct: B.** Classification and summarization fail differently and are graded by different criteria — exactly the signal for a real seam. See [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt).

- A is wrong because "read" produces no output and needs no prompt of its own — it's context every stage needs, not a job in itself. See the "stage 1 isn't a stage" point in [Over-Decomposition](/learn/prompt-engineering/over-decomposition).
- C is wrong because it doesn't split by rubric at all — both halves would still be graded on the same thing (summary quality), so nothing gets isolated.
- D is wrong for the same reason C is: counting verbs, not rubrics, is exactly the trap in [Over-Decomposition](/learn/prompt-engineering/over-decomposition) — several verbs in a description often name the same job repeated.

</details>

### Question 2

A prompt gives one detailed, 200-word rubric for sorting a single ticket into one of six categories — nothing else attached. Should you split it into multiple calls?

A. Yes, any prompt over roughly 150 words should be split for reliability
B. No — one job, one rubric, regardless of length; splitting here adds latency and a round trip without isolating anything
C. Yes — run six calls, one per category, and keep the most confident match
D. No, but replace the rubric with a single sentence and lower the temperature instead

<details><summary>Answer</summary>

**Correct: B.** Length isn't the signal — a single rubric for a single job stays one call no matter how long the rubric gets. See [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt) and the "split on distinct sub-tasks not on size" rule in the [cheatsheet](/learn/prompt-engineering/decomposition-output-cheatsheet).

- A is wrong because word count was never the trigger for splitting — a long, single-job prompt is exactly the case the cheatsheet's decision line says to keep whole.
- C is wrong because it invents six separate calls with the same rubric applied six times, which multiplies cost for no isolation benefit — nothing about this task has six different success criteria.
- D discards a rubric that might be doing real, necessary work just to make the prompt shorter — length was never the problem to fix.

</details>

### Question 3

A seven-stage contract-review pipeline runs: read, identify parties, identify payment terms, identify termination clause, identify liability clause, assess risk, write summary. What's the right fix?

A. Add an eighth stage that double-checks the final summary against the original document
B. Collapse the four "identify a clause" stages into one structured-extraction call returning all four fields, followed by a second call for risk and summary
C. Keep all seven stages, but run each one twice and take a majority vote
D. Merge everything into a single call, since multi-stage pipelines never help on document review

<details><summary>Answer</summary>

**Correct: B.** Stages 2–5 are the same job — extraction — run four times; collapsing them to one structured call cuts four round trips without losing any inspectability, leaving a clean two-job pipeline (extract, then synthesize). See [Over-Decomposition: Too Many Stages](/learn/prompt-engineering/over-decomposition).

- A adds an eighth call without addressing the actual problem — four redundant extraction stages — and a check with no new evidence risks being the rubber-stamp trap covered in the same lesson.
- C doubles the cost of the already-redundant design instead of fixing it; voting across duplicated, same-rubric stages doesn't create any isolation that wasn't already possible with one combined call.
- D overcorrects. The lesson's point isn't that multi-stage pipelines are bad — extraction and synthesis are genuinely two different rubrics — it's that four of the seven stages were the same job counted four times.

</details>

### Question 4

A pipeline adds a verification stage: it re-asks the exact same question with the exact same input the first stage saw, then checks whether the two answers match. In testing, the verification stage agrees with the first stage almost every time — on both correct and incorrect answers. What's actually wrong?

A. Verification stages never work and shouldn't be used
B. The verification stage was never given different evidence or a stricter rubric than the first stage — it's the same judgment made twice, not an independent check
C. The two stages should be run at different temperatures so they occasionally disagree
D. The verification stage's instructions need to say "double-check carefully" more forcefully

<details><summary>Answer</summary>

**Correct: B.** A check with the same information and the same rubric as the thing it's checking will agree with it by construction — it's not an independent signal. See the "double-check stage with no new rubric" mistake in [Over-Decomposition](/learn/prompt-engineering/over-decomposition).

- A overcorrects — a verification stage given genuinely new evidence (the source document, a stricter rubric) is a real, useful pattern; the mistake here is a specific one, not verification as a category.
- C treats a correctness problem as if scattering randomness in fixes it. Occasional disagreement from temperature alone isn't the same as real, aggregated [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling), which the lesson names as the honest alternative when variance, not a missing rubric, is the actual issue.
- D is a wording tweak that leaves the structural problem untouched — no instruction fixes a check that was never shown anything it could disagree with.

</details>

### Question 5

A prompt says "Analyze this ticket and return JSON with the sentiment and urgency." Three runs produce three different valid JSON shapes — different key names, different casing, different value types. What's missing?

A. A lower temperature and nothing else
B. Exact field names, exact types, and closed enum values for each field, spelled out in the prompt
C. A longer, more polite request for well-formatted JSON
D. Capitalizing the word "JSON" differently to draw more attention to it

<details><summary>Answer</summary>

**Correct: B.** "Return JSON" only constrains syntax, not the vocabulary behind it — nothing pins down the key names, the value types, or the exact enum strings, so every run is free to invent its own convention. See [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts).

- A helps make sampling more consistent but doesn't supply the missing vocabulary — a deterministic model still has nothing telling it whether the field is called `sentiment` or `Sentiment`.
- C is politeness, not specification — it doesn't name a single key, type, or allowed value.
- D is cosmetic and has no bearing on what shape the model produces.

</details>

### Question 6

You define a JSON schema for a classifier's output but leave out `additionalProperties: false`. What failure does this let slip through validation unnoticed?

A. The model returning a completely empty response
B. The model adding a stray extra field alongside the required ones — it still validates successfully, even though a stray field is an early sign the prompt's wording has started to drift
C. The model using the wrong data type for a required field
D. The model wrapping valid JSON in a markdown code fence

<details><summary>Answer</summary>

**Correct: B.** Without `additionalProperties: false`, a schema only checks that the required fields are present and correctly typed — it says nothing about extra fields, so one can ride along undetected. See [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts).

- A would fail a required-field check regardless of `additionalProperties`, since the required fields simply wouldn't be there.
- C is exactly what the `"type"` keyword on each property is built to catch, independent of `additionalProperties`.
- D is a syntax problem `json.loads` itself would choke on before the schema is ever checked — a different failure covered in [Taming Malformed JSON](/learn/prompt-engineering/fixing-malformed-json-output).

</details>

### Question 7

You prefill the assistant's turn with `{` and also set temperature to 0 for a JSON-extraction call. Given that the prefill already fixed the opening token, what is temperature 0 actually doing?

A. Guaranteeing that the extracted content itself will always be judged correct
B. Keeping the output *shape* from wobbling across calls — it says nothing about whether the judgment or extraction content is right
C. Nothing — it's fully redundant with the prefill and can be removed with no effect
D. Forcing the model to always produce the shortest possible valid JSON string

<details><summary>Answer</summary>

**Correct: B.** The prefill and the temperature setting fix two different things: the prefill removes the opening-token decision, and temperature 0 stabilizes the rest of the shape run to run. Neither one touches whether a judgment call inside the JSON is actually correct. See [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts).

- A conflates "consistent shape" with "correct content" — a schema-valid, low-temperature response can still misjudge urgency or pick the wrong category.
- C is wrong because the prefill only fixes the first token; everything after the opening brace is still generated normally and can still vary in field order, whitespace, or stray content without a stable temperature.
- D has no basis — nothing about temperature optimizes for shortness; it controls sampling randomness, not length.

</details>

### Question 8

Your repair loop currently has no cap — it keeps calling the model and re-validating until it either succeeds or you hit a request-budget limit. What's the main problem with this, beyond the extra cost?

A. It's the correct design — more attempts always converge on a valid answer eventually
B. Against a genuinely broken prompt, an uncapped loop just rediscovers the same failure repeatedly, hiding a wording bug that needs a fixed prompt instead of a persistent one
C. It causes the model to automatically lower its own temperature after each failed attempt
D. Schema validation becomes progressively stricter with each retry

<details><summary>Answer</summary>

**Correct: B.** A cap forces the real question — is this prompt's contract actually well-specified? — to surface as a loud failure instead of being buried under retries. See [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop).

- A assumes convergence that isn't guaranteed — a systematically ambiguous prompt can fail the same way indefinitely, since nothing about repeated attempts fixes an underlying wording problem.
- C describes a mechanism that doesn't exist — nothing about a failed validation call changes the model's sampling settings on its own.
- D is also invented — the schema is fixed by you; it doesn't tighten itself as attempts accumulate.

</details>

### Question 9

Your pipeline currently logs every schema failure as one generic "parse failed." Why is it worth splitting that into two distinct categories — a JSON decode error versus a schema validation error?

A. They point to different fixes — a cluster of decode errors usually means truncation (a `max_tokens` problem), while a cluster of validation errors on the same field usually means that field's prompt wording needs work
B. Decode errors are always the model's fault and validation errors are always the code's fault
C. There's no real difference — both mean the same thing and should be handled identically
D. A validation error means the API itself is unavailable

<details><summary>Answer</summary>

**Correct: A.** The two failures have different root causes and different fixes, so collapsing them into one label hides which repair is actually needed. See [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts) and [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop).

- B assigns blame along lines that don't hold up — a decode error can come from your own `max_tokens` setting, not just the model, and a validation error is about the model's output content, not "the code."
- C is the exact assumption this question is pushing back on; the two failures are diagnostically different even though both currently get logged the same way.
- D is unrelated — a validation error can only happen after a successful API call returned a response to validate.

</details>

### Question 10

A three-stage pipeline's final stage is handed the full 12-message raw ticket thread, the parsed data, the routing decision, and a 2,000-word policy document — on the theory that more context can only help. What failure does this most directly invite?

A. The final stage runs out of tokens and crashes immediately
B. The final stage can re-read the raw material and silently override an earlier stage's decision, or respond to an unrelated aside buried in the thread that was never meant to reach it
C. The model refuses to respond because the prompt is too long
D. Schema validation becomes faster because there's more context available to check against

<details><summary>Answer</summary>

**Correct: B.** Forwarded raw material isn't inert — every token is live and competes with the instructions that matter, and a model handed the same raw evidence a previous stage already judged can quietly re-derive its own conclusion instead of trusting the structured decision it was given. See [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages).

- A assumes a hard failure that the scenario doesn't establish — the real risk here is a silent behavioral drift, not a crash.
- C isn't the described mechanism — nothing about prompt length on its own triggers a refusal; the actual risk is the model acting on content it shouldn't.
- D confuses forwarding more text with the schema itself doing more work — the schema doesn't get faster or more thorough just because the prompt carries extra unrelated content.

</details>

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Over-Decomposition: Too Many Stages](/learn/prompt-engineering/over-decomposition), [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages)
