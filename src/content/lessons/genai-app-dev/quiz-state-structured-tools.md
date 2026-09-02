---
title: "Quiz: State, Structured Output, and Tools"
track: "genai-app-dev"
status: live
summary: "Ten questions on trimming math, validation and repair caps, the tool-call loop, and tool authority — including a spot-the-ungated-write scenario."
duration: "9 min read"
---

Ten questions covering this module. Question 9 is a scenario — read the tool definitions carefully before picking an answer.

## 1. A model's context window is 16,000 tokens. The system prompt and tool schemas reserve 1,000 tokens, and you reserve 500 tokens for the model's response. How many tokens are available for conversation history plus the new user message?

A. 16,000
B. 15,500
C. 14,500
D. 1,500

<details><summary>Answer</summary>

**Correct: C.** As worked through in [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming): 16,000 − 1,000 (system + tools) − 500 (response reserve) = 14,500.

- A ignores every reservation — that's the total window, not what's left over for history.
- B subtracts only the response reserve and forgets the system prompt and tool schemas.
- C is correct.
- D is the reserved amount itself, not the remaining budget — the inverse of what the question asks.

</details>

## 2. Why does a chat feature need to resend the entire conversation history on every single turn, rather than just the newest message?

A. It's a defensive habit with no real technical reason
B. Most LLM APIs are stateless — the provider doesn't remember your last call, so anything not explicitly resent is effectively gone from the model's view
C. Providers require the full history for billing purposes only
D. Only the first message of a conversation needs to be resent; later ones can be sent alone

<details><summary>Answer</summary>

**Correct: B.** [Session and State for Multi-Turn Features](/learn/genai-app-dev/session-and-state-management) frames this directly: statelessness is what lets providers scale requests across any server without pinning a session to one machine — the cost is that your application, not the provider, is responsible for reconstructing continuity on every call.

- A dismisses a real architectural reason as a habit.
- B is correct.
- C is not why — resending is about what the model can see, not how usage is billed.
- D is backwards: skipping resent history for any turn after the first means the model has no memory of everything before it.

</details>

## 3. A sliding-window trim and a rolling-summary trim both bring a conversation under budget. What's the actual difference in what happens to the turns that get dropped from the window?

A. There's no difference; both discard the same information
B. The sliding window deletes older turns outright; the rolling summary compresses them into a shorter summary message instead of deleting them
C. The sliding window compresses turns; the rolling summary deletes them
D. Both approaches keep every turn, just reformatted

<details><summary>Answer</summary>

**Correct: B.** [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim) builds exactly this contrast — at a tight budget, the window strategy drops the fact that a fix was already tried, while the summary strategy keeps a compressed version of it, at the cost of one extra model call and some precision.

- A is wrong: dropped information is not equivalent between the two — one is a clean loss, the other a lossy-but-present compression.
- B is correct.
- C reverses the two strategies.
- D is wrong: the sliding window genuinely deletes what doesn't fit; nothing is kept "just reformatted" under that strategy.

</details>

## 4. `fitToBudget()` checks `tokenCount(messages) <= budget` and returns the messages unchanged if true, before running any trimming logic. Why does that early check matter?

A. It doesn't matter; the trimming logic is idempotent either way
B. Most turns, especially early in a conversation, don't need trimming at all — running a summarization call (or any trim logic) on every single turn wastes latency and cost for no benefit
C. It's required by the model provider's API
D. It prevents the conversation from ever being summarized

<details><summary>Answer</summary>

**Correct: B.** As stated directly in [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim): check first, trim only when you have to — the rolling-summary path in particular costs a real extra model call, and most turns simply don't need it yet.

- A undersells the cost: the summary strategy specifically involves an extra model call, which is not free to run unconditionally.
- B is correct.
- C is not a real API requirement — it's an application-level efficiency choice.
- D is wrong: the check only skips trimming when nothing needs to be trimmed yet; summarization still runs once the budget is actually exceeded.

</details>

## 5. A response handler runs `JSON.parse(modelOutput)` and passes the result straight to a function that calls `.toFixed(2)` on an `amount` field. What's the real gap this leaves?

A. `JSON.parse` already guarantees the right field types, so there's no gap
B. `JSON.parse` only confirms the text is syntactically valid JSON — it says nothing about whether `amount` is actually a number, so a value like `"forty-two"` parses fine and crashes downstream
C. The gap is that JSON is the wrong format entirely; XML would avoid this
D. There's no risk as long as the prompt asks for a number

<details><summary>Answer</summary>

**Correct: B.** [Structured Output Failures and Repair Traps](/learn/genai-app-dev/structured-output-failures) opens with exactly this failure: a schema answers "is this the JSON I asked for," where `JSON.parse` only answers "is this JSON at all."

- A is the core misconception the mistake is built on.
- B is correct.
- C misdiagnoses the problem as a format choice rather than a missing validation step — the same gap exists in any format without a schema check.
- D is wrong: prompt wording is not enforcement — a schema (or the API's native schema mechanism) is what actually constrains the output.

</details>

## 6. A validate-and-repair loop re-prompts the model on a validation failure, feeding back the specific error each time, capped at 2 repair attempts (3 total). Why is the cap essential, not just a nice-to-have?

A. Without a cap, a schema the model structurally cannot satisfy turns one request into an unbounded (or just very expensive) retry loop, burning tokens and latency on a request that was never going to succeed
B. The cap exists only to satisfy provider rate limits
C. More attempts always produce better results, so the cap is purely a cost-saving tradeoff with no correctness benefit
D. The cap prevents the model from ever seeing its own validation errors

<details><summary>Answer</summary>

**Correct: A.** [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation) is explicit that the cap is "the difference between a bug and an incident" — an uncapped loop against an unsatisfiable schema or a genuinely ambiguous input has no natural stopping point.

- A is correct.
- B misattributes the reason — it's about bounding cost and failure mode, not rate-limit compliance specifically.
- C understates the real tradeoff: a schema the model can't satisfy won't be fixed by more attempts, only more spend — see [Structured Output Failures and Repair Traps](/learn/genai-app-dev/structured-output-failures) on schemas too strict to comply with.
- D is backwards: the loop's whole mechanism is feeding the specific error back so the model can act on it — that's what the cap bounds, not what it prevents.

</details>

## 7. A schema field is only constrained by a sentence in the prompt ("respond with low, medium, or high") rather than an actual `enum` in the tool's JSON schema. What failure does this invite?

A. None — a clear sentence is just as reliable as a schema-level constraint
B. The model can and occasionally will produce a value outside the described set (like "urgent"), which reads as reasonable English but doesn't exist in a downstream `switch` statement expecting only the three named values
C. The API will reject any response that doesn't match the sentence
D. This only matters for numeric fields, never for string enums

<details><summary>Answer</summary>

**Correct: B.** [Structured Output Failures and Repair Traps](/learn/genai-app-dev/structured-output-failures) names this directly: a prose-described constraint is not an enforced one, and the fix is to use the provider's native schema/tool-calling enum mechanism, then validate again in code.

- A is the mistake itself, restated as if it were safe.
- B is correct.
- C is wrong: there is no API-level enforcement at all when the constraint lives only in prose — that's exactly the gap.
- D is wrong: the failure is specifically about string enums (or any small closed set), not a numeric-only concern.

</details>

## 8. In a tool-call loop executing several tool calls the model requested in parallel, why use `Promise.allSettled` instead of `Promise.all`?

A. `allSettled` is faster because it skips error handling entirely
B. `Promise.all` would reject the entire batch if any single tool call throws, failing calls that succeeded; `allSettled` lets each call succeed or fail independently, so a failed lookup becomes an `is_error` result the model can react to instead of crashing the whole loop
C. `allSettled` guarantees all calls succeed
D. There's no functional difference between the two for this use case

<details><summary>Answer</summary>

**Correct: B.** [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) makes this exact point: a model asking for weather in three cities shouldn't have all three fail because one city's lookup threw — each result is matched back by `tool_use_id` and a failure becomes a handled `is_error` result, not an uncaught exception.

- A misdescribes what `allSettled` does — it doesn't skip error handling, it captures each outcome individually.
- B is correct.
- C is false: `allSettled` doesn't guarantee success, it guarantees every promise resolves to a recorded outcome, success or failure.
- D ignores the real behavioral difference: `Promise.all` short-circuits and rejects on the first failure among the batch.

</details>

## 9. A support assistant has two tools declared:

```json
[
  { "name": "get_account_balance", "description": "Look up the caller's account balance" },
  { "name": "adjust_account_balance", "description": "Adjust the caller's account balance by a given amount" }
]
```

The execution code for both looks like this:

```typescript
async function executeTool(name: string, args: any, ctx: { userId: string }) {
  switch (name) {
    case "get_account_balance":
      return await db.getBalance(ctx.userId);
    case "adjust_account_balance":
      return await db.adjustBalance(ctx.userId, args.amount);
  }
}
```

What's the authority problem here, and what's missing?

A. Nothing is wrong — both tools use `ctx.userId`, so both are equally safe
B. `adjust_account_balance` is a write tool executed with no validation beyond the schema, no business-rule check, and no audit record — it runs on any `amount` the model proposes as readily as the read tool runs
C. The problem is that both tools are named too similarly, which will confuse the model
D. The problem is that the read tool is too slow, not that the write tool is unguarded

<details><summary>Answer</summary>

**Correct: B.** This is the exact asymmetry from [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority) and [Two Tools: A Read API and a Guarded DB Write](/learn/genai-app-dev/building-a-weather-and-db-tool): identical tool-declaration shape does not imply identical execution risk, and here `adjustBalance` runs directly on `args.amount` with no range check, no confirmation, and no audit entry — a wrong or manipulated amount changes real account state immediately, exactly the gap [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes) catalogs as "executing a write tool with only schema validation."

- A is wrong: scoping to `ctx.userId` prevents touching *another* user's account, but does nothing to validate the amount or record what happened — the write itself is still ungated.
- B is correct.
- C is a naming concern, not an authority one, and not the actual defect here.
- D misdirects toward a nonexistent performance issue instead of the real gap: the write path has no checks the read path is also missing, but only the write path's missing checks carry consequence.

</details>

## 10. In a longer autonomous tool loop, why might requiring an explicit `finish` tool call (with a `status: complete | blocked`) be a better stopping signal than simply inferring "done" from the model returning text with no further tool calls?

A. There's no difference; absence of a tool call always means successful completion
B. A model can also stop calling tools because it's confused or stuck, not because the task is actually done — an explicit `finish` call forces the model to report which one happened, so a `blocked` status can route to a human instead of looking identical to success in your logs
C. The `finish` tool is required by every provider's API
D. It only matters for read tools, never for consequential write-capable loops

<details><summary>Answer</summary>

**Correct: B.** [Multi-Step Tool Loops and Where They Go Wrong](/learn/genai-app-dev/multi-step-agentic-tool-loops) makes this distinction directly: "the model stopped" is not the same fact as "the model succeeded," and for a consequential loop, only an explicit signal tells the two apart.

- A is the exact conflation this stopping condition is designed to catch.
- B is correct.
- C is false — this is an application-level design pattern, not an API requirement.
- D is backwards: it matters most for exactly the consequential, write-capable loops where silently stopping on confusion is the costliest failure to miss.

</details>

**Related:** [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming) · [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation) · [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) · [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes) · [State, Structured Output, and Tools Cheatsheet](/learn/genai-app-dev/state-and-tools-cheatsheet)
