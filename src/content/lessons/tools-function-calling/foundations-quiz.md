---
title: "Foundations Quiz"
track: "tools-function-calling"
status: live
summary: "Ten questions on the loop, message roles, and the core intuition — check what actually stuck."
duration: "6 min read"
---

Ten questions. No calculators needed — just the mental model from the rest of this module.

**1. In this exchange, which message is the tool call?**

```
[1] {"role": "user", "content": "What's the weather in Lisbon?"}
[2] {"role": "assistant", "content": [{"type": "tool_use", "id": "t1", "name": "get_weather", "input": {"city": "Lisbon"}}]}
[3] {"role": "user", "content": [{"type": "tool_result", "tool_use_id": "t1", "content": "24°C, sunny"}]}
[4] {"role": "assistant", "content": "It's 24°C and sunny in Lisbon."}
```

A. Message [1]
B. Message [2]
C. Message [3]
D. Message [4]

<details><summary>Answer</summary>

**Correct: B.** Message [2] is the assistant asking for the tool — a `tool_use` block naming `get_weather` and its arguments, before anything has run.

- A is wrong: [1] is the original user question, containing no tool machinery at all.
- B is correct: the `tool_use` type and the un-executed `name`/`input` pair mark this as the request, not a result.
- C is wrong: [3] is the *result* of running the tool, sent back with a matching `tool_use_id` — the answer to the request, not the request itself.
- D is wrong: [4] is the model's final natural-language answer, produced only after it saw [3].

</details>

**2. In the same exchange, which message is the tool result?**

A. Message [1]
B. Message [2]
C. Message [3]
D. Message [4]

<details><summary>Answer</summary>

**Correct: C.** Message [3] carries `type: "tool_result"` and `tool_use_id: "t1"`, matching it to the request in message [2].

- A is wrong: [1] predates any tool involvement.
- B is wrong: [2] is the request the result answers, not the result itself.
- C is correct: the `tool_result` type and matching id are exactly what marks a message as the answer to a specific prior tool call.
- D is wrong: [4] is downstream of the result — the model's answer built *from* it, not the result itself.

</details>

**3. A user asks: "Rewrite this paragraph in a more formal tone," and pastes the paragraph in the same message. Does this task need a tool?**

A. Yes — text rewriting always benefits from a grammar-check tool
B. No — the input is already fully present in the conversation and nothing needs to be looked up or changed elsewhere
C. Yes — the model can't be trusted to rewrite text without verifying it against a style guide via a tool
D. It depends on which model is being used

<details><summary>Answer</summary>

**Correct: B.** None of the four gaps from [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools) apply — nothing is stale, private, side-effecting, or arithmetic. This is a pure text transformation of data already in hand.

- A is wrong: there's no indication a grammar tool is needed or was requested; adding one is unjustified overhead.
- B is correct: the task is self-contained — a transformation of already-provided text.
- C is wrong: this invents a need for verification the task never asked for.
- D is wrong: the tool-need decision is about the *task's shape*, not which model happens to be running it.

</details>

**4. A user asks: "Has my package shipped yet? Order #A-4471." Does this task need a tool?**

A. No — the model can reason its way to a plausible shipping status
B. Yes — shipping status is private, live data the model could never have seen in training
C. No — shipping questions are common enough that the model has memorized typical timelines
D. Only if the user explicitly says "please look this up"

<details><summary>Answer</summary>

**Correct: B.** This is gap 2 from [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools) — data specific to this user's account that was never public and never in training data.

- A is wrong: "plausible" here means fabricated — an invented, unverifiable status.
- B is correct: no amount of training data could contain this specific order's real-time status.
- C is wrong: memorized *typical* timelines are not this order's actual status.
- D is wrong: the need for a tool is a property of the task, not of how the user phrases the request.

</details>

**5. This loop is broken — it only ever completes one tool call correctly even when the model needs several turns. What's missing?**

```python
response = client.messages.create(model=MODEL, tools=tools, messages=messages)
tool_use = next(b for b in response.content if b.type == "tool_use")
result = execute(tool_use.name, tool_use.input)
messages.append({"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": tool_use.id, "content": result}
]})
response = client.messages.create(model=MODEL, tools=tools, messages=messages)
```

A. The `tools` parameter is missing from the second call
B. The assistant's own tool-call message (`response.content` from the first call) was never appended to `messages`
C. `max_tokens` was never set
D. The tool result should be sent as an `assistant`-role message, not `user`

<details><summary>Answer</summary>

**Correct: B.** The tool result was appended, but the assistant turn that *asked* for the tool — `{"role": "assistant", "content": response.content}` — never was. Without it, the conversation the model sees is missing its own request, and `tool_use_id` has nothing in the history to match against.

- A is wrong: `tools` is present in both calls in the snippet shown.
- B is correct: this is exactly the forgotten-append mistake from [Beginner Tool-Calling Mistakes](/learn/tools-function-calling/foundations-common-mistakes).
- C is wrong: a missing `max_tokens` would raise a clear validation error, not this quieter failure.
- D is wrong: Anthropic's `tool_result` blocks belong in a `user`-role message — that part of the snippet is already correct.

</details>

**6. The model's response contains two `tool_use` blocks in the same turn. What should your code do?**

A. Execute only the first one — models rarely need more than one tool per turn
B. Execute both, and send both results back in one message before calling the model again
C. Execute both, but send each result back in its own separate message
D. Reject the response as malformed — one turn should only ever request one tool

<details><summary>Answer</summary>

**Correct: B.** Multiple `tool_use` blocks in one turn are meant to run concurrently, with all matching `tool_result` blocks returned together in a single follow-up message — see [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls).

- A is wrong: dropping the second call silently leaves the model's second request unanswered.
- B is correct: this is the standard parallel tool-call pattern.
- C is wrong: splitting results across multiple messages is a known anti-pattern that can train the model to stop attempting parallel calls.
- D is wrong: multiple `tool_use` blocks in one turn are valid, common, and expected.

</details>

**7. On OpenAI's API, `tool_call.function.arguments` is:**

A. A plain Python dict, ready to index directly
B. A JSON-formatted string that must be parsed before use
C. Always empty — arguments are sent separately
D. An XML fragment

<details><summary>Answer</summary>

**Correct: B.** Unlike Anthropic's pre-parsed `input`, OpenAI's `arguments` field is a string that must be run through `json.loads()` (or your language's equivalent) before you can read individual fields.

- A is wrong: that's how Anthropic's `input` field behaves, not OpenAI's `arguments`.
- B is correct: treating it as a string to parse, not a ready-made object, is the exact distinction covered in [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers).
- C is wrong: arguments are very much present in this field, just string-encoded.
- D is wrong: the format is JSON, not XML.

</details>

**8. Which response field tells you the model wants to call a tool rather than having finished with a plain-text answer?**

A. The presence of any text at all in the response
B. `stop_reason` (Anthropic) / `finish_reason` (OpenAI) set to a tool-related value
C. The length of the response content
D. Whether `tools` was included in the request

<details><summary>Answer</summary>

**Correct: B.** `stop_reason: "tool_use"` on Anthropic and `finish_reason: "tool_calls"` on OpenAI are the explicit signals your loop should check — see [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop).

- A is wrong: Anthropic responses can interleave text *and* tool-call blocks in the same turn — text alone doesn't mean the model is done.
- B is correct: this stop/finish reason field is the reliable signal, independent of what else is in the content.
- C is wrong: response length has no defined relationship to whether a tool was requested.
- D is wrong: including `tools` in the request only makes calling one *possible* — it doesn't mean the model used it on this particular turn.

</details>

**9. A model emits a well-formed call to a tool named `send_invoice` — but your code never declared any tool by that name. What's the most accurate explanation?**

A. The API silently auto-generated a plausible tool on the model's behalf
B. This is impossible — models can only emit calls to tools that were declared in the request
C. Tool calling is a trained tendency to produce a particular text shape, not a hard link to your declared tools, so the model can produce a syntactically valid call to a tool it was never given
D. The conversation history must contain a typo that accidentally declared the tool

<details><summary>Answer</summary>

**Correct: C.** As covered in [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools) and [It's Still Text In, Text Out](/learn/tools-function-calling/tool-calling-still-text-in-text-out), a tool call is generated text shaped by training, not a lookup against your actual tool list — the model can hallucinate a call to a plausible-sounding tool that was never declared.

- A is wrong: no API layer invents tools on the model's behalf.
- B is wrong: this is exactly the failure that's possible, and it's the reason validation matters.
- C is correct: this is a hallucinated tool call, and your dispatcher — not the model — is responsible for rejecting calls to undeclared tools.
- D is wrong: no typo is required; this can happen with a perfectly clean request.

</details>

**10. "Extract the vendor name, amount, and due date from this invoice text into JSON" and "check whether this invoice has already been paid, and mark it paid if not" — which technique fits each, respectively?**

A. Tool call, then tool call
B. Structured output, then tool call
C. Tool call, then structured output
D. Structured output, then structured output

<details><summary>Answer</summary>

**Correct: B.** The first task transforms data already present in the conversation into a shaped answer — nothing needs to happen outside the response, which is structured output. The second needs a real lookup (has it been paid?) and a real side effect (mark it paid), which only a tool call can provide — see [Structured Output vs. Tool Calls: Which and When](/learn/tools-function-calling/structured-output-vs-tool-calls-when).

- A is wrong: the first task has no action to execute — a tool call would be unjustified overhead.
- B is correct: extraction-from-given-text is structured output; lookup-then-act is a tool call.
- C is wrong: this reverses the two tasks' correct techniques.
- D is wrong: the second task requires a real side effect (marking paid), which structured output alone cannot cause.

</details>

**Related:** [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop), [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call), [Beginner Tool-Calling Mistakes](/learn/tools-function-calling/foundations-common-mistakes), [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools), [Structured Output vs. Tool Calls: Which and When](/learn/tools-function-calling/structured-output-vs-tool-calls-when)
