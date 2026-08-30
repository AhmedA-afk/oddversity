---
title: "Extracting Typed Records From Freeform Text"
track: "genai-app-dev"
status: live
summary: "Turn one messy vendor email into a typed, validated Invoice object — and show what happens to the field the model isn't sure about."
duration: "8 min read"
---

A vendor emails an invoice as prose, not as a form. Your accounts-payable system needs `{amount, dueDate, lineItems}`. This is the extraction problem in miniature, worked through with one real example end to end.

## The setup

The input — an actual-shaped vendor email, unedited for messiness:

```text
Subject: Invoice for August services

Hi team,

Following up on last month's work. Total comes to $4,250 for the
following:

- Consulting (32 hrs @ $100/hr): $3,200
- Rush delivery fee: $250
- Platform license (Aug): $800

Please remit within 30 days of receipt. Let me know if you need
anything else on our end.

Thanks,
Dana
```

The target type:

```typescript
type Invoice = {
  amount: number;
  dueDate: string | null;       // ISO date, or null if genuinely unresolvable
  lineItems: { description: string; amount: number }[];
  confidence: { amount: number; dueDate: number }; // 0-1, per uncertain field
};
```

Note what's *not* in the email: an actual due date. It says "within 30 days of receipt" — a relative date that depends on when the email was received, which the model has to resolve, and might resolve wrong.

## Step by step

### Step 1: define the schema with room for uncertainty

```typescript
import { z } from "zod";

const InvoiceSchema = z.object({
  amount: z.number().positive(),
  dueDate: z.string().nullable(), // ISO 8601 or null
  lineItems: z.array(z.object({
    description: z.string(),
    amount: z.number(),
  })).min(1),
  confidence: z.object({
    amount: z.number().min(0).max(1),
    dueDate: z.number().min(0).max(1),
  }),
});
```

> **Why this step?** `dueDate` is nullable and paired with a `confidence.dueDate` score deliberately. A schema that *requires* a concrete date forces the model to invent one when the email only implies it — that's a worse failure than an honest `null`. This is the schema-design lesson from [Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps): a rigid schema doesn't get you correctness, it just gets you a confident wrong answer in valid JSON.

### Step 2: extract, giving the model today's date as context

```typescript
const receivedAt = "2026-08-15"; // when this email actually arrived — from the mail headers, not the model's guess

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 500,
  tools: [{ name: "record_invoice", input_schema: zodToJsonSchema(InvoiceSchema) }],
  tool_choice: { type: "tool", name: "record_invoice" },
  messages: [{
    role: "user",
    content: `This email was received on ${receivedAt}. Extract the invoice details.
If a date is relative (e.g. "within 30 days"), resolve it against the received date
and report your confidence honestly — do not default to 1.0 for a resolved
relative date.

---
${emailBody}`,
  }],
});

const raw = response.content.find((b) => b.type === "tool_use")?.input;
```

> **Why this step?** Passing `receivedAt` explicitly is the fix for a common gap: the model has no reliable notion of "today" on its own, and a relative date like "30 days from receipt" is meaningless without an anchor. This is the same context-assembly discipline as [Messages, Roles, and the Prompt Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) — the model can only be as accurate as the context you hand it.

### Step 3: the actual extraction

```json
{
  "amount": 4250,
  "dueDate": "2026-09-14",
  "lineItems": [
    { "description": "Consulting (32 hrs @ $100/hr)", "amount": 3200 },
    { "description": "Rush delivery fee", "amount": 250 },
    { "description": "Platform license (Aug)", "amount": 800 }
  ],
  "confidence": { "amount": 0.98, "dueDate": 0.75 }
}
```

The line items sum correctly ($3,200 + $250 + $800 = $4,250), and `dueDate` was correctly computed as August 15 + 30 days. But `confidence.dueDate` came back at 0.75, not 0.98 — the model is telling you it inferred this rather than read it directly, and that inference (calendar math on a relative phrase) is exactly the kind of step worth a second look.

### Step 4: validate, then branch on confidence

```typescript
function processInvoice(raw: unknown) {
  const parsed = InvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ExtractionValidationError(parsed.error.message); // shape failure — see json-schema-and-validation
  }

  const invoice = parsed.data;
  const CONFIDENCE_THRESHOLD = 0.85;

  const lowConfidenceFields = Object.entries(invoice.confidence)
    .filter(([, score]) => score < CONFIDENCE_THRESHOLD)
    .map(([field]) => field);

  if (lowConfidenceFields.length > 0) {
    return { status: "needs_review" as const, invoice, flaggedFields: lowConfidenceFields };
  }
  return { status: "auto_approved" as const, invoice };
}
```

> **Why this step?** This is the fork that matters: `dueDate` at 0.75 falls under the 0.85 threshold, so the whole record routes to `needs_review` rather than being auto-posted to accounts payable. The alternative — accepting anything that merely passed the *shape* schema — would silently post an invoice with a possibly-wrong due date into a payment system. Low confidence isn't a soft signal to log; it's a hard gate on what gets to act autonomously.

### Step 5: hand it to a human, with the reason attached

```typescript
if (result.status === "needs_review") {
  await reviewQueue.enqueue({
    type: "invoice_extraction",
    payload: result.invoice,
    flaggedFields: result.flaggedFields,
    reason: `Low confidence on: ${result.flaggedFields.join(", ")}`,
    sourceText: emailBody,
  });
}
```

> **Why this step?** The reviewer sees exactly which field the model was unsure about and why — not a queue of undifferentiated "please check this" items. This is the connection point to [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues): a good review queue entry carries the model's own uncertainty forward instead of making the human re-derive it.

## Where it breaks (+fix)

**Break:** the model reports high confidence on a field that's actually wrong — say, it misreads "$4,250" as "$4,205" and rates the amount at 0.98. Confidence scores are the model's self-assessment, not ground truth, and self-assessment can be miscalibrated.
**Fix:** for financial fields specifically, add a deterministic cross-check that doesn't depend on the model's confidence at all — here, verify `lineItems` actually sum to `amount` in code, and flag a mismatch regardless of what the model reported.

```typescript
const lineItemTotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
if (Math.abs(lineItemTotal - invoice.amount) > 0.01) {
  lowConfidenceFields.push("amount"); // override, even if the model said 0.98
}
```

**Break:** the source email has no due date language at all ("thanks for your business").
**Fix:** the schema's `dueDate: z.string().nullable()` handles this cleanly — the model should return `null` with `confidence.dueDate` near 1.0 (it's *confident* there's no date to extract), which your review logic should treat differently from a low-confidence guess at a date. Don't conflate "confidently absent" with "uncertainly present."

## Takeaways

- A schema that allows `null` and carries a confidence score produces better decisions downstream than a schema that forces the model to always produce a value.
- Give the model the context it needs to resolve relative information (dates, in this case) — accuracy on extraction is bounded by what you hand it, not just by the model's skill.
- Confidence scores are a signal to route work, not a substitute for a deterministic check where one is available and cheap (the line-item sum here).
- Low-confidence output goes to a queue with the reason attached, never silently through — that's the difference between a review system and a hope.

**Related:** [Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps), [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation), [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues), [Messages, Roles, and the Prompt Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope)
