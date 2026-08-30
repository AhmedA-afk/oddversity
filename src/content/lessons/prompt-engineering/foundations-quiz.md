---
title: "Quiz: Foundations and Mental Model"
track: "prompt-engineering"
status: live
summary: "Ten questions on prompt-solvable vs. non-prompt problems, specificity, temperature choice, and diagnosing failures."
duration: "8 min read"
---

Ten questions covering everything in this module. Two of them are scenarios asking which fix actually applies — those are the ones worth slowing down for.

## 1. Why does a prompt influence a model's output at all?

A. Because the model parses the prompt like source code and executes it as a program
B. Because the prompt's tokens condition the model's next-token probability distribution at every generation step
C. Because the model looks up your intent in a rules database and matches it to a stored response template
D. Because the prompt tells the model which pre-written answer to retrieve

<details><summary>Answer</summary>

**Correct: B.** A prompt is context, and context conditions the probability distribution the model samples from at each generation step — that's the entire mechanism, as covered in [why prompts steer next-token prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction).

- A is wrong: there's no execution step or compiler — the same "instruction" can produce different outputs across runs, which a real program wouldn't.
- B is correct.
- C is wrong: there's no lookup table or template-matching step; the output is generated token by token, conditioned on context.
- D is wrong: nothing is "retrieved" from a pre-written store unless you've explicitly built a retrieval system yourself — the model generates the response.

</details>

## 2. A support bot keeps stating the wrong current promotional price because the price changed last week, after the model's training cutoff. What is the most effective fix?

A. Add "please always be accurate about prices" to the system prompt
B. Increase the temperature so it considers more possibilities
C. Retrieve the current price and put it directly in the prompt's context
D. Add three more examples of correctly-formatted prices to a few-shot section

<details><summary>Answer</summary>

**Correct: C.** This is a [what prompting cannot fix](/learn/prompt-engineering/what-prompting-cannot-fix) case — the model has no way to know a fact that postdates its training and isn't in context. Putting the actual current price into the prompt turns this into a prompt-solvable problem.

- A is wrong: asking for accuracy doesn't grant the model information it doesn't have — it's still just conditioning tokens, not a fact source.
- B is wrong: temperature affects sampling randomness, not what the model knows; more randomness makes an already-wrong answer less consistent, not more correct.
- C is correct.
- D is wrong: examples fix format and tone, not missing factual knowledge — the model would still confidently apply the old price in the new format.

</details>

## 3. Which rewrite of "write about the meeting" most narrows the space of plausible outputs?

A. "Write about the meeting, please."
B. "Write a 3-bullet summary of action items from the meeting notes below, for the engineering team."
C. "Write something insightful about the meeting."
D. "Write about the meeting in as much detail as possible."

<details><summary>Answer</summary>

**Correct: B.** This pins audience, length, format, and subject matter — the funnel in [a prompt is a set of constraints on likely continuations](/learn/prompt-engineering/prompt-as-conditioning-intuition) narrows on every one of those dimensions at once.

- A adds politeness, not a constraint — the funnel is essentially unchanged.
- B is correct.
- C adds a vague quality bar ("insightful") without narrowing length, format, or audience — still very wide.
- D actually widens the plausible output further by inviting maximum length and coverage, the opposite of narrowing.

</details>

## 4. You're building a prompt that extracts a shipping address from an email into JSON for a downstream parser. What temperature is the best starting point?

A. Around 1.0, to make sure it considers creative interpretations of the address
B. Around 0 to 0.2, since there's one correct shape and consistency matters
C. Temperature doesn't apply to extraction tasks
D. As high as possible, so you get more diverse address formats

<details><summary>Answer</summary>

**Correct: B.** Extraction has one right answer per input, so you want the sampling distribution to consistently collapse to it — see [temperature for prompt engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters).

- A is wrong: "creative interpretation" of a shipping address is exactly what you don't want — it invites formatting drift or invented details.
- B is correct.
- C is wrong: temperature applies to every generation call, including extraction — it's just that low is almost always the right setting for this task type.
- D is wrong: diverse formats are a liability here, not a feature, since a downstream parser expects one stable shape.

</details>

## 5. A classification prompt should return `{"label": "billing"}` but instead returns "This is a billing-related ticket." Which single fix is most likely to resolve this?

A. Lower the temperature to 0
B. Add a worked example of the exact JSON output, or prefill the response with the opening brace
C. Add a longer explanation of the label set in the task description
D. Switch to a different model entirely

<details><summary>Answer</summary>

**Correct: B.** This is a format problem, not a randomness or knowledge problem — the model correctly identified the category but defaulted to prose because nothing demonstrated the required shape. See [diagnosing why a prompt failed](/learn/prompt-engineering/reading-a-model-failure).

- A helps with run-to-run consistency but wouldn't, by itself, make the model choose JSON over prose — that's a shape problem, not a sampling-variance problem.
- B is correct.
- C is wrong: the label set (billing/technical/account) was already correctly identified — explaining it further doesn't touch the output-shape gap.
- D is a disproportionate fix for a problem this specific and cheap to solve directly.

</details>

## 6. A prompt states "keep the reply under 100 words" at the very top, followed by a long context block and several examples. The model consistently returns replies over 250 words. What's the most likely cause and best fix?

A. The model can't count words; there's no fix
B. The instruction is too far from where generation begins; restate the limit near the output format region, right before the input
C. The task description is too vague; rewrite the whole prompt from scratch
D. Temperature is too low; raise it so the model explores shorter completions

<details><summary>Answer</summary>

**Correct: B.** This matches the instruction-position failure pattern in [diagnosing why a prompt failed](/learn/prompt-engineering/reading-a-model-failure) — a true, unambiguous constraint stated far from generation loses influence to whatever pattern is active by the time the model is actually writing the reply.

- A overstates the limitation — models can approximate length limits reasonably well when the constraint is positioned to actually bind; the failure here is positional, not a hard capability wall.
- B is correct.
- C throws away a prompt that likely only needs one instruction relocated, not a full rewrite.
- D is backwards: temperature controls randomness in token choice, not adherence to a length constraint, and raising it would not reliably shorten anything.

</details>

## 7. You run the same prompt on the same input twice and get two different, both-plausible-looking answers. What does this tell you?

A. The model is broken and needs to be reported
B. Your prompt has a syntax error
C. This is expected sampling behavior; if you need one shape of answer every time, lower temperature and test across multiple reruns before trusting either output
D. The prompt is too short

<details><summary>Answer</summary>

**Correct: C.** See [prompting is not deterministic programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) — unless temperature is pinned to 0 (and even then, near-certainly), sampling variance is expected, not a malfunction.

- A is wrong: this is normal behavior for a sampling process, not a defect.
- B is wrong: prompts don't have "syntax errors" in the way code does — there's no parser to reject malformed instructions.
- C is correct.
- D is wrong: length has no direct bearing on whether sampling produces varied output; a short prompt at high temperature and a long one can both vary.

</details>

## 8. A colleague shows you a short, clever one-line prompt that nailed the three examples they tried. What should you ask before adopting it?

A. Nothing — three correct examples is a solid enough sample
B. Whether it was tested on inputs it wasn't tuned against, including ambiguous or edge-case ones
C. Whether it uses a persona, since personas guarantee reliability
D. Whether it's shorter than your current prompt

<details><summary>Answer</summary>

**Correct: B.** This is the exact trap covered in [reliability beats cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) — three hand-picked successes tell you almost nothing about behavior on inputs you haven't tried yet.

- A is wrong: three examples, especially ones likely chosen because they worked, is a very small and probably biased sample.
- B is correct.
- C is wrong: a persona can shift tone, but it doesn't enforce constraints or guarantee correctness on edge cases.
- D is wrong: brevity is not a proxy for reliability — a shorter prompt can just mean fewer constraints were specified.

</details>

## 9. Scenario: your extraction prompt correctly pulls a customer's order number 9 times out of 10, but on the 10th run — same input — it returns a slightly different field name (`order_id` instead of `order_number`). Which fix applies?

A. This is a knowledge gap — add the correct field name to the model's training data
B. This is a formatting/consistency problem — lower temperature and give an explicit output schema with a worked example, since the value itself was correct every time
C. This is unfixable — extraction tasks are inherently unreliable
D. Switch to a completely different task framing

<details><summary>Answer</summary>

**Correct: B.** The value extracted was correct in all 10 runs — only the field *name* wandered, which is a shape problem, not a knowledge or capability problem. Pinning the schema with an example and lowering temperature (see [temperature for prompt engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters)) directly targets this.

- A misdiagnoses a formatting drift as a missing fact — nothing here indicates the model lacks knowledge; you can't retrain the model for a single prompt's field-naming convention anyway.
- B is correct.
- C overstates the problem — the substance was right 10 out of 10 times, which is a strong sign this is fixable, not fundamental.
- D is a disproportionate response to a narrow, specific formatting gap.

</details>

## 10. Scenario: a financial-reporting assistant is asked to sum a column of 40 large numbers and gets the total wrong about half the time, regardless of how the prompt is worded. What's the right fix?

A. Keep iterating on the wording until it consistently gets the sum right
B. Add "please double check your math" to the prompt
C. Hand the actual summation to a calculator or code-execution tool, and have the prompt call it rather than compute the sum via generated text
D. Increase temperature so it explores more calculation paths

<details><summary>Answer</summary>

**Correct: C.** Exact arithmetic over many large numbers, done purely through token-by-token generation, is squarely in [what prompting cannot fix](/learn/prompt-engineering/what-prompting-cannot-fix) — the fix is a tool, not better wording.

- A wastes time: the brief states wording changes haven't helped, which is the signature of a non-prompt problem.
- B is wrong for the same reason as always asking for care doesn't grant a capability the underlying generation process doesn't reliably have at this scale.
- C is correct.
- D is wrong and would likely make results less consistent, not more accurate — this is an accuracy problem, not a variety problem.

</details>

**Related:** [What Prompting Cannot Fix](/learn/prompt-engineering/what-prompting-cannot-fix) · [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure) · [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters) · [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks)
