---
title: "Advanced Tools and Testing Quiz"
track: "tools-function-calling"
status: live
summary: "Six questions on code execution, computer use, testing layers, and what a BFCL score does and doesn't tell you."
duration: "5 min read"
---

Six questions on the highest-power, highest-risk tools in this track, and on knowing whether your agent actually works before you ship it.

## Question 1

A restaurant has a public reservations API integrated with a major booking platform. Your agent needs to book a table there. What should it use?

A. A computer-use loop against the restaurant's website, since it always works regardless of what integrations exist
B. A dedicated `book_table` API tool
C. A `run_python` code-execution tool that scrapes the page
D. Whichever the model prefers on a given run

<details>
<summary>Answer</summary>

**Correct: B.** When a clean API exists, use it — it's cheaper, faster, and fails with structured errors instead of a misclick. See [API Tools vs. Computer Use for the Same Task](/learn/tools-function-calling/api-tools-vs-computer-use).

- A is wrong: computer use is the fallback for when no API exists, not the default — it's slower, pricier per step, and breaks when the page re-renders.
- B is correct: prefer an API tool whenever one exists.
- C is wrong: this reaches for the general-purpose tool where a purpose-built one already exists, and scraping is more brittle than either option.
- D is wrong: tool choice shouldn't be arbitrary — the harness should route to the API tool as a design decision, not leave it to chance.

</details>

## Question 2

You write a test that mocks a `tool_call` object with a missing required field and asserts the dispatcher returns a validation error — no model is called. Which layer does this test?

A. Selection
B. Execution
C. Integration
D. Benchmarking

<details>
<summary>Answer</summary>

**Correct: B.** This is a deterministic test of your dispatcher's own logic, with no model in the loop — that's the execution layer. See [Testing Tool Calls](/learn/tools-function-calling/testing-tool-calls-strategies).

- A is wrong: selection tests check whether the *model* picks the right tool, which requires calling the model — this test never does.
- B is correct: mocking the call and testing your own validation code is exactly the execution layer.
- C is wrong: integration tests exercise the full loop across multiple turns; this is a single isolated assertion.
- D is wrong: benchmarking is a separate activity (like BFCL) for measuring model tool-calling competence in general, not a layer of your own test suite.

</details>

## Question 3

A model tops the BFCL leaderboard's aggregate score. What does that tell you about how it will perform on your specific agent's tools?

A. It's guaranteed to select your tools correctly, since BFCL measures general tool-calling skill
B. Very little on its own — BFCL uses its own reference tools, not yours, and doesn't test your prompts or error handling
C. Nothing at all — BFCL is irrelevant to production agents
D. It guarantees correct argument values but not correct tool selection

<details>
<summary>Answer</summary>

**Correct: B.** A high aggregate score reflects general call-shape competence against BFCL's own tools — not your schemas, your prompts, or your error-handling paths. See [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard).

- A is wrong: this is the shortcut the lesson warns against directly — general competence doesn't guarantee transfer to your specific, possibly more ambiguous, tool set.
- B is correct: it's a reasonable filter, not a guarantee, precisely because your schemas and prompts aren't part of the benchmark.
- C is wrong: BFCL isn't irrelevant — it's a legitimate first-pass signal, just not a substitute for your own eval.
- D is wrong: this claims a specific, false guarantee about arguments that the benchmark doesn't provide either — both selection and argument accuracy on *your* tools remain untested by BFCL.

</details>

## Question 4

Why must a code-execution tool never run outside a sandbox?

A. Unsandboxed execution is slower than sandboxed execution
B. The model writes worse code without a sandbox present
C. It's arbitrary code execution on your infrastructure — a single bad input can do real damage with no isolation to contain it
D. Sandboxes are only needed for computer-use tools, not code execution

<details>
<summary>Answer</summary>

**Correct: C.** A `run_python` tool without isolation lets whatever code the model writes run with the full authority of the host process — a prompt injection or a bad instruction becomes a real compromise, not a contained error. See [Code Execution as a Tool](/learn/tools-function-calling/code-execution-as-a-tool-concept) and [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution).

- A is wrong: sandboxing is about containment, not performance — it can add latency, but that's not the reason it's required.
- B is wrong: the model's code quality doesn't depend on whether a sandbox is present; the risk is what unreviewed code can *do*, not how well it's written.
- C is correct: this is the core reason — no isolation means no ceiling on what a single bad execution can reach.
- D is wrong: computer use also needs isolation, but that doesn't reduce the requirement for code execution — both are high-authority tools that need containment, for related but distinct reasons.

</details>

## Question 5

Your agent has 40 narrow API tools. You're considering replacing them all with a single `run_python` tool that imports the same underlying functions. What's the main cost of doing this?

A. The model will no longer be able to perform any of the 40 actions
B. Token cost goes up, since one tool costs more than 40 small ones
C. Actions become harder to gate and audit individually, since your dispatcher can no longer inspect what a specific call will do before it runs
D. There is no cost — code execution strictly dominates a tool registry

<details>
<summary>Answer</summary>

**Correct: C.** A single code tool collapses your visibility into individual actions — you can't classify risk or apply a per-action approval gate to something happening inside an opaque script the way you can to a named function call. See [One Code Tool vs. Dozens of API Tools](/learn/tools-function-calling/code-execution-vs-many-tools).

- A is wrong: the actions remain reachable, just through code instead of named calls — capability isn't lost, only structure.
- B is wrong: it's the reverse — one small tool schema costs far fewer tokens per request than 40 individual ones.
- C is correct: this is the real tradeoff — the audit and gating cost that a single code tool hides.
- D is wrong: the lesson is explicit that neither approach strictly dominates; each wins on a different axis (token cost vs. auditability).

</details>

## Question 6

You're debugging a production agent that booked the wrong restaurant. You have full structured trace logs of every model turn and tool call for the session. What's the most direct way to find the bug?

A. Re-run the entire agent against the model repeatedly until it reproduces the same mistake
B. Read the trace in order and find the turn where the arguments in a tool call no longer match a prior tool result
C. Assume it's a handler bug and rewrite the dispatcher
D. Lower the model's temperature and hope the bug doesn't recur

<details>
<summary>Answer</summary>

**Correct: B.** A structured trace lets you walk the exact sequence of calls and results and spot exactly where an argument (like a restaurant ID) stopped matching what a previous tool call actually returned — a hallucinated or stale argument, visible directly in the log with no model call needed to find it. See [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging).

- A is wrong: this is slow, costly, and not guaranteed to reproduce a probabilistic failure — you already have the failing trace, no need to gamble on regenerating it.
- B is correct: reading the logged sequence directly is exactly what trace logging is for, and it's deterministic.
- C is wrong: jumping to a rewrite without diagnosing first risks fixing the wrong layer — the bug here is a model argument error, not necessarily a handler bug.
- D is wrong: this doesn't diagnose anything, and lowering temperature doesn't guarantee the underlying selection or argument issue goes away.

</details>

**Related:** [Testing Tool Calls](/learn/tools-function-calling/testing-tool-calls-strategies), [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard), [Advanced-Tools Mistakes](/learn/tools-function-calling/advanced-tools-common-mistakes), [API Tools vs. Computer Use for the Same Task](/learn/tools-function-calling/api-tools-vs-computer-use)
