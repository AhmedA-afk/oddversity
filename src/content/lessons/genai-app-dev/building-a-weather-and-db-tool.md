---
title: "Two Tools: A Read API and a Guarded DB Write"
track: "genai-app-dev"
status: live
summary: "Wire a read-only weather tool and a gated address-update tool into one loop, and watch the same loop treat them completely differently."
duration: "8 min read"
---

One user message, two tool calls, two very different amounts of code standing between "the model asked" and "it happened." This walks both through the loop from [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) side by side.

## The setup

The user message:

```text
What's the weather in Austin right now? Also, please update my shipping
address to 456 Oak Street, Austin, TX 78701.
```

Two tools declared for this conversation:

```typescript
const tools = [
  {
    name: "get_weather",
    description: "Get current weather for a city",
    input_schema: {
      type: "object",
      properties: { city: { type: "string" }, state: { type: "string" } },
      required: ["city"],
    },
  },
  {
    name: "update_shipping_address",
    description: "Update the shipping address on the caller's account",
    input_schema: {
      type: "object",
      properties: {
        street: { type: "string" }, city: { type: "string" },
        state: { type: "string" }, zip: { type: "string" },
      },
      required: ["street", "city", "state", "zip"],
    },
  },
];
```

Same declaration shape for both — a name, a description, a schema. Nothing here signals risk; that has to live in how each tool executes.

## Step by step

### Step 1: the model proposes both tool calls at once

```json
[
  { "type": "tool_use", "id": "call_1", "name": "get_weather",
    "input": { "city": "Austin", "state": "TX" } },
  { "type": "tool_use", "id": "call_2", "name": "update_shipping_address",
    "input": { "street": "456 Oak Street", "city": "Austin", "state": "TX", "zip": "78701" } }
]
```

> **Why this step?** This is the parallel tool-call case `executeToolCalls` from the previous lesson was built for — one model response, two independent requests, executed concurrently. The model has proposed the write exactly as readily as the read; nothing in the proposal itself is more hesitant or "asked more carefully." That's the whole reason execution-side gating exists.

### Step 2: the read tool executes with no ceremony

```typescript
async function getWeather(input: { city: string; state?: string }) {
  const response = await fetch(`https://api.weather.example/v1/current?city=${encodeURIComponent(input.city)}&state=${input.state ?? ""}`);
  if (!response.ok) throw new Error(`Weather lookup failed: ${response.status}`);
  return response.json(); // { tempF: 94, conditions: "sunny" }
}
```

> **Why this step?** No ownership check, no confirmation, no audit log — a wrong city returns wrong (or no) weather, and the worst outcome is a slightly unhelpful answer. This is what "low blast radius" from [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority) looks like in code: the tool is allowed to just run.

### Step 3: the write tool goes through three gates before touching the database

```typescript
const US_STATE_CODES = new Set(["AL", "AK", /* ... */ "TX", "WY"]);

async function updateShippingAddress(input: any, ctx: { userId: string }) {
  // Gate 1: schema validation beyond what the tool schema already enforces
  const AddressSchema = z.object({
    street: z.string().min(3).max(100),
    city: z.string().min(2).max(60),
    state: z.string().refine((s) => US_STATE_CODES.has(s), "must be a valid US state code"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "must be a valid US ZIP code"),
  });
  const address = AddressSchema.parse(input);

  // Gate 2: allowlist — this account is even permitted to self-update via the assistant
  const account = await db.getAccount(ctx.userId);
  if (!account.selfServiceAddressUpdatesEnabled) {
    throw new AuthorizationError("Address updates for this account require manual review");
  }

  // Gate 3: audit before, not after, the write
  await auditLog.record({
    actor: ctx.userId, action: "update_shipping_address",
    before: account.shippingAddress, after: address,
  });

  return db.updateAccount(ctx.userId, { shippingAddress: address });
}
```

> **Why this step?** Three checks that the weather tool has none of. Gate 1 re-validates beyond the tool's declared schema — a ZIP that's syntactically a string but not a real ZIP would otherwise sail through. Gate 2 is a business-rule check that has nothing to do with the model at all — some accounts (say, ones flagged for fraud review) shouldn't accept self-service changes regardless of what's asked. Gate 3 writes the audit record *before* the mutation so a crash between logging and writing still leaves a trace of intent, which matters more for a write than a read: you can always re-run a weather lookup, you can't always reconstruct what an address update meant to do after the fact.

### Step 4: both results feed back into the same loop

```typescript
const toolResults = [
  { type: "tool_result", tool_use_id: "call_1", content: JSON.stringify({ tempF: 94, conditions: "sunny" }) },
  { type: "tool_result", tool_use_id: "call_2", content: JSON.stringify({ status: "updated" }) },
];
```

> **Why this step?** From the loop's perspective in `runToolLoop`, these are just two `tool_result` blocks going back in the next message — the loop mechanics don't know or care that one of them passed through three gates and the other passed through zero. That asymmetry is entirely encapsulated inside `executeTool`'s dispatch, which is exactly where it belongs: the loop stays generic, the risk-handling stays local to each tool.

### Step 5: the model composes the final answer

```text
It's currently 94°F and sunny in Austin. I've also updated your shipping
address to 456 Oak Street, Austin, TX 78701.
```

## Where it breaks (+fix)

**Break:** the account has `selfServiceAddressUpdatesEnabled: false`, so Gate 2 throws — but the loop's `executeToolCalls` catches it as an `is_error` result and the model, seeing a generic error string, might tell the user "something went wrong, please try again," which is misleading (retrying won't help; this account needs manual review).
**Fix:** make the error message itself informative enough for the model to relay correctly — `"Address updates for this account require manual review"` rather than a bare exception name — since that string is exactly what ends up in the `tool_result` the model reads and paraphrases back to the user.

**Break:** the model, retrying after the ZIP validation fails, invents a plausible-looking but wrong ZIP for the city rather than asking the user to confirm.
**Fix:** this is a prompt-level guard, not a code-level one — instruct the system prompt explicitly that address fields must come from the user's own words, never inferred or guessed, and treat a validation failure on a write tool as a signal to ask a clarifying question rather than retry with a different guess.

## Takeaways

- Identical tool declaration shape does not imply identical execution risk — the schema the model sees and the gating your code runs are two separate design surfaces.
- A read tool can run with essentially no ceremony; a write tool earns validation, an authorization check independent of the model's request, and an audit record written before the mutation.
- The loop mechanics stay generic across both — risk-handling belongs inside each tool's execution function, not in the loop that calls them.
- Error messages fed back as `tool_result` content are what the model uses to explain failures to the user — make them accurate enough to relay, not just technically correct.

**Related:** [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop), [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority), [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation), [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes)
