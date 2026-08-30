---
title: "Quiz: Foundations of Hallucination"
track: "hallucinations"
status: live
summary: "Six questions on classifying failures, spotting root causes, reading factuality contracts, and finding fabrication in real transcripts."
duration: "5 min read"
---

Six questions, each tied back to a specific lesson in this module. Work through them before moving on to the taxonomy module.

**1. A support bot's RAG system retrieves the 2022 refund policy document instead of the current 2024 one, and accurately summarizes it: "30 days." The actual 2024 policy is 45 days. What kind of failure is this?**

A. Hallucination - the model invented the number
B. Retrieval error - the model faithfully reported the wrong source
C. Reasoning mistake - the model miscalculated
D. Dataset bias - the model defaulted to a common industry figure

<details><summary>Answer</summary>

**Correct: B.** The model was faithful to its input - the input itself was wrong because the retriever fetched an outdated document. The fix belongs in the retrieval pipeline, not in how the model generates text.

- A: Wrong. Hallucination requires a claim unsupported by anything the model was given. Here the number came straight from an actual (if outdated) retrieved document - nothing was invented.
- B: Correct. Faithful-to-bad-input is still wrong, but it's a different bug with a different owner than a hallucination.
- C: Wrong. No calculation happened; the model directly restated a figure already stated in the retrieved text.
- D: Wrong. Nothing here suggests a training-data skew - the number came from a specific, identifiable (wrong) document.

See [Hallucination, Error, Bug, and Bias: Drawing the Lines](/learn/hallucinations/hallucination-vs-error-vs-bug).

</details>

**2. A benchmark scores an answer +1 if it matches the reference exactly, and 0 for anything else - including an explicit "I don't know." Which root cause of hallucination does this setup most directly illustrate?**

A. No ground-truth signal
B. The training objective rewards guessing over abstention
C. Next-token prediction mechanics
D. Parametric vs. contextual knowledge mismatch

<details><summary>Answer</summary>

**Correct: B.** Abstention and a wrong answer are scored identically (both zero), which makes guessing strictly better in expectation whenever there's any chance at all of landing on the right answer.

- A: Wrong. This is about what the model can introspect on before answering, a different root cause from how a scoring rule shapes incentives.
- B: Correct. This is exactly the expected-value asymmetry worked through in the deep dive: `E[guess] = p > 0 = E[abstain]` whenever `p > 0`.
- C: Wrong. Next-token mechanics explain how tokens get sampled, not why a scoring rule rewards guessing over honesty.
- D: Wrong. This scenario has no context/memory conflict at all - it's purely about scoring incentives.

See [Deep Dive: Why the Training Objective Rewards Guessing Over Abstention](/learn/hallucinations/training-objective-rewards-guessing).

</details>

**3. A product team asks a model to brainstorm 10 possible names for a new espresso machine. Does this task's factuality contract call for the grounding and verification machinery this track builds?**

A. Yes, always - any specific-sounding name could be mistaken for an existing real product
B. No - invention is the explicit goal here, and a separate check (trademark search) covers the real risk, not hallucination mitigation
C. Yes, because the model might be uncertain about the difference between real and invented company names
D. No - naming tasks never need any downstream verification of any kind

<details><summary>Answer</summary>

**Correct: B.** The task sits at the "invention wanted" end of the factuality-contract dial. The real risk (trademark collision) is handled by a trademark search, not by grounding the model's generation in a source document.

- A: Wrong. This conflates a real but separate risk (trademark collision) with hallucination mitigation - different problem, different fix.
- B: Correct. Invention-shaped output is exactly what was asked for; this module's machinery targets a different kind of task.
- C: Wrong. The model's internal uncertainty isn't the deciding factor - what the task wants is.
- D: Wrong. "No hallucination mitigation needed" doesn't mean "no verification of any kind ever" - trademark screening is still a reasonable, separate check.

See [When 'Making Things Up' Is Actually the Goal](/learn/hallucinations/when-hallucination-is-desirable).

</details>

**4. Context given to the model: "Remote work requests must be submitted at least two weeks in advance." Model output: "Per the 2024 employee handbook, remote work requests must be submitted at least two weeks in advance. Under Chapter 7, Section 3.2, team leads may grant exceptions without HR approval, per the flexibility clause added in the 2023 revision." Given only that one sentence of context, which part is the fabrication?**

A. "at least two weeks in advance" - the timing itself
B. "Chapter 7, Section 3.2" and the exception clause about team leads and the 2023 revision
C. None of it - this is a faithful, complete expansion of the source
D. All of it - this is a reasoning mistake, not a hallucination

<details><summary>Answer</summary>

**Correct: B.** Nothing in the supplied context mentions a chapter, section number, exception process, or revision year - this is invented detail dressed in specific, official-sounding language.

- A: Wrong. This detail is directly supported by the given context - it's the one grounded part of the answer.
- B: Correct. Same pattern as the fabricated DOI worked through in the anatomy lesson: structurally plausible, entirely unsupported.
- C: Wrong. Large parts of the answer have no basis in the one sentence provided.
- D: Wrong. This is confident invention of unsupported specifics - the definition of hallucination - not a calculation or logic error.

See [Worked Example: Dissecting One Real Hallucination](/learn/hallucinations/anatomy-of-a-hallucination).

</details>

**5. Generated code: `import pandas as pd` / `df = pd.read_csv("data.csv")` / `result = df.fast_merge(other_df, on="id", validate="1:1")`. Which line contains a fabrication?**

A. `import pandas as pd` - a fabricated import
B. `df = pd.read_csv("data.csv")` - a fabricated method
C. `df.fast_merge(...)` - a plausible-sounding but nonexistent method
D. None - this is all valid, idiomatic pandas code

<details><summary>Answer</summary>

**Correct: C.** pandas has `merge`, not `fast_merge` - the model generated a method name with the right shape and plausible intent but no real referent.

- A: Wrong. pandas is a real package, imported the standard way - nothing invented.
- B: Wrong. `read_csv` is a real, correctly-used pandas method.
- C: Correct. Same underlying mechanism as a fabricated citation, wearing code's syntax instead of prose's.
- D: Wrong. See C - one line does not correspond to a real API and will raise `AttributeError` at runtime.

See [Variants: Hallucination in Text, Code, Vision, and Structured Output](/learn/hallucinations/hallucination-across-modalities).

</details>

**6. A team sets decoding temperature to 0 on a factual-lookup endpoint and considers hallucination handled. What does temperature 0 actually do?**

A. Removes sampling randomness so the highest-probability token is always chosen, but doesn't change whether that token is correct
B. Forces the model to only output tokens it has high confidence are factually true
C. Disables the model's ability to fabricate entirely
D. Has no effect on hallucination in either direction

<details><summary>Answer</summary>

**Correct: A.** Temperature reshapes how you sample from an already-fixed probability distribution; it does nothing to that distribution's accuracy. If the wrong token has the highest probability, temperature 0 (greedy decoding) picks it every single time.

- A: Correct. Removing variance is not the same as removing error - it just makes the error deterministic and repeatable.
- B: Wrong. There is no separate "factually true" confidence channel the model can filter by; see the intuition lesson on why no such internal signal exists.
- C: Wrong. Fabrication happens whenever learned probability mass sits on a wrong continuation, regardless of decoding temperature.
- D: Wrong. It does have an effect - it can create false confidence by making a wrong answer perfectly stable across runs.

See [Common Myths: 'Bigger Models Don't Hallucinate' and Other Errors](/learn/hallucinations/myths-about-hallucination).

</details>

**Related:** [Foundations Cheatsheet](/learn/hallucinations/foundations-cheatsheet), [Hallucination, Error, Bug, and Bias](/learn/hallucinations/hallucination-vs-error-vs-bug), [The Model Cannot Feel the Boundary of Its Knowledge](/learn/hallucinations/no-ground-truth-signal)
