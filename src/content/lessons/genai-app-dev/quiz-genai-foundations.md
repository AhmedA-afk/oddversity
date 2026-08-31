---
title: "Quiz: The GenAI Request Lifecycle"
track: "genai-app-dev"
status: live
summary: "Ten questions on the shell-vs-core model, role placement, sampling defaults, the eight-hop lifecycle, and two bugs to spot."
duration: "8 min read"
---

Ten questions covering this module. If you can get through these without guessing, you're ready for the provider layer.

**1. A GenAI feature is best described as:**

A. A prompt that produces the whole feature by itself
B. Ordinary, testable code wrapped around one nondeterministic function call
C. A CRUD feature with an extra database table
D. A UI component that happens to call an API

<details><summary>Answer</summary>

**Correct: B.** The call to the model is the one genuinely nondeterministic piece; everything around it — input assembly, validation, rendering, auth, storage — is code you can unit test like anything else. That shell-vs-core split is the frame the whole module uses.

- A is wrong: treating the prompt as the entire feature is exactly the mistake that leads to no validation and no failure handling — see [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai).
- C is wrong: a GenAI feature does share auth, storage, and UI with a CRUD feature, but variance, latency, cost, and failure shape are genuinely new — it's not "the same thing plus a column."
- D is wrong: it undersells how much of the feature (validation, retries, rendering partial output) is not UI code at all.

</details>

**2. In a support-ticket summarizer, where does the customer's actual ticket text belong in the messages array?**

A. In the system message, appended after the instructions
B. In the user message
C. Split evenly between system and user messages
D. It doesn't matter as long as the model receives it somewhere

<details><summary>Answer</summary>

**Correct: B.** The system message is the standing contract — true for every call this feature makes. Per-request content, like one specific ticket's text, belongs in the user message so the contract stays stable across requests.

- A is wrong: stuffing per-request data into the system message blurs the contract and, in a multi-turn setting, means you're re-sending (and re-paying for) content that should have been a single user turn.
- C is wrong: there's no benefit to splitting one request's content across two roles — it just makes the prompt harder to reason about.
- D is wrong: placement changes how strongly the model weighs the content and how the prompt behaves across turns — see [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope).

</details>

**3. You're building a feature that extracts `{name, date, amount}` from an invoice PDF into a database row. What temperature should you set?**

A. Leave it unset and use the SDK default
B. As high as the API allows, to maximize accuracy
C. Low (0–0.2)
D. It only matters for chat features, not extraction

<details><summary>Answer</summary>

**Correct: C.** Extraction has one correct output shape — you want the same invoice to produce the same fields every time, not a range of phrasings. Low temperature minimizes run-to-run variance on exactly this kind of task.

- A is wrong: SDK defaults are usually tuned for conversational variety, not structured accuracy — leaving it unset is how "flaky-looking" bugs get introduced into a task that should be deterministic.
- B is wrong: higher temperature increases variance, which is the opposite of what a database column needs.
- D is wrong: temperature affects any task where the model samples tokens, extraction included — see [Temperature, top_p, and max_tokens in Practice](/learn/genai-app-dev/tuning-sampling-params-in-an-app).

</details>

**4. Which of these is one of the eight hops between a button click and a rendered token?**

A. The database migration that created the ticket table
B. Token-by-token streaming from the provider back to your server
C. The CI pipeline that deployed your app
D. The user's operating system update

<details><summary>Answer</summary>

**Correct: B.** The lifecycle runs client → your API route → prompt assembly → provider → token stream → validation → UI — the provider's token stream back to your server is one of those named hops, and each hop carries its own latency and failure risk.

- A, C, and D are wrong: real infrastructure, but not part of the request path a single user action travels through — see [Tracing One Request Through Eight Hops](/learn/genai-app-dev/request-lifecycle-mental-model) for the full hop-by-hop map.

</details>

**5. Why should the LLM call happen on your server rather than directly from the browser?**

A. Browsers can't make HTTPS requests to third-party APIs
B. It's the only way to enable streaming
C. A key embedded in client code ships in plaintext to every visitor's browser
D. Server-side calls are always faster

<details><summary>Answer</summary>

**Correct: C.** Anything in client-side code is bundled into the JS every visitor downloads — an API key there isn't hidden, just unnoticed until someone looks, and then it's usable by anyone who finds it.

- A is wrong: browsers can call third-party APIs fine; the problem is what has to ship with that call (the key), not the mechanics of the request.
- B is wrong: streaming works from either side technically — the boundary rule is about key exposure and rate-limit control, not streaming capability.
- D is wrong: routing through your server adds a hop, not fewer — the reason for the rule is security and control, not raw speed. See [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives).

</details>

**6. Spot the bug:**

```ts
const client = new Anthropic({ apiKey: "sk-ant-..." });
// inside a React client component
```

A. No bug — this is the normal way to initialize an SDK client
B. The API key is bundled into the browser JS and visible to every visitor
C. The bug is that `Anthropic` should be lowercase
D. The bug is missing a `temperature` parameter

<details><summary>Answer</summary>

**Correct: B.** Anything referenced inside a client component ships in the JS bundle. A hardcoded key here is readable by anyone who opens dev tools — it's not a hypothetical risk, it's plaintext in a public file.

- A is wrong: this is exactly the antipattern — normal-looking code that leaks a secret, which is what makes it common in first features.
- C is wrong: capitalization isn't the issue; the constructor call is syntactically fine.
- D is wrong: a missing `temperature` is a real (different) mistake covered elsewhere in this module, but it's not what's wrong in this snippet — see [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns).

</details>

**7. Spot the bug:**

```ts
const result = await callModel(prompt);
return Response.json(result);
```

A. No bug — awaiting a promise is always safe
B. The call has no timeout, so a provider hang or outage stalls this request indefinitely
C. `Response.json` should be `Response.text`
D. The bug is that `prompt` should be an array of messages, not a string

<details><summary>Answer</summary>

**Correct: B.** With no timeout, a slow or hung provider call ties up the request — and often a worker — until something further up the stack gives up, if anything does. The fix is an explicit timeout shorter than any timeout above it.

- A is wrong: `await` is fine mechanically; the missing safeguard is a bound on how long it's allowed to wait.
- C is wrong: `Response.json` is the right call if the result is meant to be JSON — that's not the defect here.
- D is wrong: `callModel` may reasonably wrap message-array construction internally; the bug the snippet is illustrating is specifically the absent timeout, per [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns).

</details>

**8. A two-person startup needs a streaming chat endpoint shipped this week, with no plans yet to switch providers. Which layer fits best?**

A. Raw HTTP requests, for maximum control
B. A provider SDK
C. A full orchestration framework with built-in agents and memory
D. Writing a custom abstraction layer over multiple providers before shipping anything

<details><summary>Answer</summary>

**Correct: B.** A provider SDK gives streaming, typed responses, and retry handling out of the box with minimal boilerplate — exactly what a small team on a tight deadline needs, without the lock-in-avoidance cost of an abstraction they don't need yet.

- A is wrong: raw HTTP means hand-rolling SSE parsing, retries, and types — control you're paying for in time this team doesn't have.
- C is wrong: a full framework's abstractions (agents, memory, chains) solve problems this feature doesn't have yet, at the cost of a heavier learning curve and more moving parts.
- D is wrong: building a multi-provider abstraction before you have a second provider is speculative work — the decision table in [SDK vs Raw API vs Framework: Choosing Your Layer](/learn/genai-app-dev/sdk-vs-raw-api-decision) keys this to team size and complexity for a reason.

</details>

**9. "Make it summarize tickets" is not yet buildable. What turns it into a spec?**

A. Picking which model to call
B. Writing the input/output shape, success criteria, and a latency/cost ceiling before any code
C. Writing the system prompt first, then figuring out the rest as you go
D. Asking the model what a good summary would look like

<details><summary>Answer</summary>

**Correct: B.** A vague ask has no defined input shape, output shape, or definition of "good" — those have to be pinned down before code, or you're guessing at all three while also debugging.

- A is wrong: model choice is a real decision but doesn't resolve any of the ambiguity in what "summarize" means for this feature.
- C is wrong: writing the prompt first without a spec means the prompt is guessing at the same ambiguities the spec exists to remove.
- D is wrong: the model can't tell you your product's success criteria or latency budget — those are product decisions, not something to delegate. See [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec).

</details>

**10. Which of these is true validation, versus a mistake that only looks like validation?**

A. `JSON.parse(result.text)` succeeding without throwing
B. Checking the parsed object against an explicit schema for required fields, types, and allowed values
C. Confirming `result.text` is a non-empty string
D. Trusting the output because the system prompt asked for a specific format

<details><summary>Answer</summary>

**Correct: B.** `JSON.parse` succeeding only proves the text was syntactically valid JSON — it says nothing about whether the fields your app depends on are present, correctly typed, or in range. Real validation checks the shape you actually need against a schema.

- A is wrong: this is the "no output validation" antipattern in disguise — it passes and still lets malformed data through.
- C is wrong: non-empty is a weaker check than A, not a stronger one — it doesn't touch structure at all.
- D is wrong: "asked for" is a request, not a guarantee — the model can and does deviate from a requested format. See [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps) and [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns).

</details>

If most of these felt easy, you're ready to move into how a single provider call becomes a multi-provider system — start with [Provider Landscape and Tradeoffs](/learn/genai-app-dev/provider-landscape-and-tradeoffs). If a couple felt shaky, the checklist at [GenAI Feature Starter Checklist](/learn/genai-app-dev/genai-feature-starter-checklist) is the fast way back through the same material.

**Related:** [GenAI Feature Starter Checklist](/learn/genai-app-dev/genai-feature-starter-checklist), [The Whole Game: Build a Support-Reply Drafter End to End](/learn/genai-app-dev/the-whole-game-genai-feature-tour), [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns), [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai)
