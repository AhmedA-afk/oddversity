---
title: "Schema, Validation, and Auto-Repair"
track: "genai-app-dev"
status: live
summary: "Validate every model response against a real schema, and add a repair loop with a hard retry cap instead of trusting it blind."
duration: "8 min read"
---

[Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps) drew the line between shape (what the API enforces) and meaning (what your code still has to check). This lesson builds both checks into one pipeline, with a repair loop that gives the model a bounded number of chances to fix its own mistake.

## What we're building

A validation pipeline for a `record_priority` tool call: define the schema once, validate the model's output against it, and — if validation fails — re-prompt the model with the specific error, up to a fixed retry cap, before giving up and escalating. We'll show it in TypeScript with Zod and Python with Pydantic; pick whichever matches your stack, the logic is identical.

## Setup

```bash
npm install zod
# or
pip install pydantic
```

```typescript
import { z } from "zod";

const PrioritySchema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string().min(10, "reason must be at least 10 characters"),
  confidence: z.number().min(0).max(1),
});
type Priority = z.infer<typeof PrioritySchema>;
```

```python
from pydantic import BaseModel, Field
from typing import Literal

class Priority(BaseModel):
    priority: Literal["low", "medium", "high"]
    reason: str = Field(min_length=10)
    confidence: float = Field(ge=0, le=1)
```

Notice `confidence` is required, not optional — it's a deliberate design choice from [Extracting Typed Records From Freeform Text](/learn/genai-app-dev/extracting-typed-data-from-freeform) that we'll reuse: giving the model a place to express uncertainty instead of forcing a confident guess.

## Build it

### Step 1: validate, don't just parse

```typescript
function validate(raw: unknown): { ok: true; data: Priority } | { ok: false; error: string } {
  const result = PrioritySchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
```

> **Why this step?** `safeParse` (not `parse`) returns a result object instead of throwing, which matters because a validation failure here is an expected, handled case — not an exceptional one. The error string is built to be *specific* (`reason: reason must be at least 10 characters`, not just "invalid") because that specificity is what makes the repair prompt in step 3 actually work.

### Step 2: the model call, schema-enforced

```typescript
async function callForPriority(userMessage: string): Promise<unknown> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    tools: [{ name: "record_priority", input_schema: zodToJsonSchema(PrioritySchema) }],
    tool_choice: { type: "tool", name: "record_priority" },
    messages: [{ role: "user", content: userMessage }],
  });
  return response.content.find((b) => b.type === "tool_use")?.input;
}
```

> **Why this step?** Passing `zodToJsonSchema(PrioritySchema)` as the tool's `input_schema` means the same Zod definition drives both the API's shape constraint and your own validation — one source of truth instead of two schemas that can silently drift apart.

### Step 3: the bounded repair loop

```typescript
const MAX_REPAIR_ATTEMPTS = 2; // total attempts = 1 initial + 2 repairs = 3

async function extractWithRepair(userMessage: string): Promise<Priority> {
  let lastError = "";
  let messages = [{ role: "user" as const, content: userMessage }];

  for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      messages = [
        ...messages,
        { role: "user", content: `Your previous response failed validation: ${lastError}. Correct it and call the tool again.` },
      ];
    }

    const raw = await callForPriority(messages.map((m) => m.content).join("\n"));
    const result = validate(raw);
    if (result.ok) return result.data;

    lastError = result.error;
  }

  throw new RepairExhaustedError(`Failed after ${MAX_REPAIR_ATTEMPTS + 1} attempts: ${lastError}`);
}
```

> **Why this step?** The cap is not a performance nicety — it's the difference between a bug and an incident. Without `MAX_REPAIR_ATTEMPTS`, a schema the model structurally cannot satisfy (say, a `reason` constraint the input text can't honestly meet) turns one user request into an unbounded loop of paid API calls. Feeding the *specific* validation error back (not just "try again") is what makes the second attempt more likely to succeed than the first — the model can only fix what it's told is wrong. This pattern is the same one detailed in [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair).

## Run it

```typescript
try {
  const result = await extractWithRepair("The server's been down for six hours and customers are calling.");
  console.log(result); // { priority: "high", reason: "...", confidence: 0.9 }
} catch (e) {
  if (e instanceof RepairExhaustedError) {
    await queueForHumanReview(userMessage, e.message); // never silently drop it
  }
}
```

Force a failure to see the loop work: temporarily set `min_length` on `reason` to `500` characters — an impossible bar for a one-line input — and confirm the loop makes exactly 3 attempts, then throws `RepairExhaustedError`, rather than looping forever.

## Harden it

- **Cap wall-clock time, not just attempt count.** If each repair call can itself take 10+ seconds, three attempts can add real latency to a user-facing request — set a total timeout across the whole loop, not just per call.
- **Log every failed attempt with its validation error**, not just the final failure — a schema the model *reliably* fails on the first pass but recovers on the second is a signal the prompt or schema needs work, and you'll only see that pattern if failed-but-recovered attempts are visible in your logs too.
- **Distinguish "invalid shape" from "invalid meaning" in your error messages** fed back to the model — a schema violation ("priority must be one of low/medium/high") is fixable by the model; a factual error ("this due date is in the past") usually isn't, and repeating it back just wastes an attempt.
- **Never let repair-exhausted fail silently.** A request that exhausts retries is exactly the case [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues) exists for — route it to a person, don't return a default value that looks like a real answer.

## Extend it

The same `validate` + bounded repair pattern applies to any tool-enforced output, not just extraction — a tool call's arguments in [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) should run through an identical validate-before-execute step before your code ever acts on them. [Structured Output Failures and Repair Traps](/learn/genai-app-dev/structured-output-failures) catalogs what goes wrong when any of these guards is skipped.

**Related:** [Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Extracting Typed Records From Freeform Text](/learn/genai-app-dev/extracting-typed-data-from-freeform), [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues)
