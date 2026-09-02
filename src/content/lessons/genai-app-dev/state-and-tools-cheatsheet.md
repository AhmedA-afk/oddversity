---
title: "State, Structured Output, and Tools Cheatsheet"
track: "genai-app-dev"
status: live
summary: "One page: the conversation schema, the fit-to-budget rule, validate-and-repair with its cap, and the read-vs-write tool checklist."
duration: "5 min read"
---

The reference version of this module — pull this up when you're wiring a new stateful, structured, or tool-using feature and don't want to re-derive the shape from scratch.

## The conversation schema — start here, then measure

Two tables, from [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history):

| Table | Key columns | What they're for |
|---|---|---|
| `conversations` | `id`, `user_id`, `system_prompt`, `version` | One row per conversation; `version` is the optimistic-concurrency counter |
| `turns` | `conversation_id`, `seq`, `role`, `content`, `client_turn_id` | One row per turn; `seq` (not `created_at`) is the sort order; `client_turn_id` is the idempotency key |

Rules that matter more than the exact columns: order by `seq`, never by timestamp. Generate `client_turn_id` client-side, once per user action, so a retry reuses it instead of minting a new one. Guard concurrent writers with a version check (`WHERE version = $expected`), not a hope that two tabs won't collide.

## Fit-to-budget, one function

The budget math from [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming):

```text
context window
- system prompt + tool schemas
- reserved output tokens
= budget available for history + new message
```

Two strategies, one interface, from [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim):

```typescript
await fitToBudget(messages, budget, "window");   // drop oldest turns that don't fit — start here
await fitToBudget(messages, budget, "summary", summarizeModel); // compress dropped turns instead of deleting
```

| Strategy | Use when | Cost |
|---|---|---|
| Sliding window | Older turns genuinely stop mattering (self-contained tickets, one-off Q&A) — **start here** | None beyond the trim itself |
| Rolling summary | Facts from early in a long conversation still matter later (ongoing project, multi-session planning) | One extra model call per trim, and lossier than the original |

Always check `tokenCount(messages) <= budget` first — most turns don't need trimming at all, and running the trim (especially the summary path) on every call is wasted latency and cost.

## Validate-and-repair, with its cap

The pattern from [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation):

```typescript
const MAX_REPAIR_ATTEMPTS = 2; // total attempts = 1 initial + 2 repairs

for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
  const raw = await callModel(/* on attempt > 0, include the specific validation error */);
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
}
throw new RepairExhaustedError(); // route to human review — never a silent default
```

- **Start here:** 2–3 total attempts. More than that is rarely worth the latency; a schema the model can't satisfy in 3 tries usually can't be satisfied at all.
- Feed back the *specific* validation error, not "try again" — that's what makes attempt 2 more likely to succeed than attempt 1.
- Nullable fields + a `confidence` score beat a forced-required field the input can't actually support — see [Extracting Typed Records From Freeform Text](/learn/genai-app-dev/extracting-typed-data-from-freeform). Route anything below your confidence threshold to review instead of auto-accepting it.
- Schema-valid is not the same claim as correct — add a deterministic cross-check (sums, date ranges) wherever one is cheap to compute, per [Structured Output Failures and Repair Traps](/learn/genai-app-dev/structured-output-failures).

## The read-vs-write tool authority checklist

From [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority) and [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes):

| | Read tools | Write / side-effecting tools |
|---|---|---|
| Blast radius | Low — wrong args return wrong data | Real — wrong args change real state |
| Schema validation | Yes | Yes, plus semantic checks (ranges, formats) |
| Ownership/authorization check | Usually unnecessary | **Always**, against your own system state — never the model's assertion |
| Business-rule gate (allowlist, account flags) | Rarely | Check before every write |
| Audit record | Optional | Written **before** the mutation, not after |
| Execution style | Auto-execute | Gate, and consider confirmation for high-consequence actions |

Never expose raw SQL or shell execution as a tool — named, parameterized operations only. Never trust tool call arguments as sanitized just because they arrived as typed JSON; they're untrusted input the same as a form submission, per [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation).

## Tool-loop guard defaults — start here, then measure

From [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) and [Multi-Step Tool Loops and Where They Go Wrong](/learn/genai-app-dev/multi-step-agentic-tool-loops):

- `MAX_ITERATIONS`: a real ceiling (start around 6–8), throw on exhaustion — never return silently.
- Execute parallel tool calls with `Promise.allSettled`, not `Promise.all` — one failed call shouldn't crash the others.
- Past ~5–6 iterations, add repeat-call fingerprint detection (tolerant of legitimate polling) and a token budget alongside the iteration count — a step cap alone doesn't catch a loop that converges on the cap without converging on an answer.
- For consequential autonomous loops, require an explicit `finish` tool call (`status: complete | blocked`) rather than inferring "done" from the absence of a tool call.

## Pre-flight checklist

- [ ] Conversation history is ordered by `seq`, written idempotently via a client-generated `client_turn_id`, and guarded against concurrent writers by a version check.
- [ ] Every model call runs through `fitToBudget()` before it goes out — checked, not assumed, on every turn.
- [ ] Every parsed model response goes through a real schema before other code touches it, with a bounded repair loop (2–3 attempts) that routes exhaustion to a human queue.
- [ ] Every write tool has an authorization check independent of the model's request, plus an audit record written before the mutation.
- [ ] The tool loop has a hard iteration cap that throws, not returns silently, on exhaustion.

**Related:** [Session and State for Multi-Turn Features](/learn/genai-app-dev/session-and-state-management), [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming), [Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps), [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority), [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes)
