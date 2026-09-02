---
title: "Logging Prompts and Completions Safely"
track: "genai-app-dev"
status: live
summary: "Completion logs are a debugging lifeline and a privacy liability at the same time — build the pipeline that keeps both true safely."
duration: "7 min read"
---

You need last week's exact completion to debug a regression a user reported. You also just realized that completion contains their home address, because they pasted it into a chat asking for directions. Both facts are true at once, and the logging pipeline has to be built for that from day one, not patched afterward.

## What we're building

A completion-logging pipeline that's separate from the operational trace store in [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing): it redacts likely PII before anything touches disk, enforces a retention window instead of keeping everything forever, and gates read access instead of leaving logs queryable by anyone with database credentials. We'll log one completion end to end and show exactly what's stored versus what's dropped.

## Setup

TypeScript, no dependencies beyond a basic regex-based redactor — swap in a real PII-detection library for production, but the shape doesn't change.

```
logging/
  redact.ts     # pattern-based redaction
  store.ts      # write path with retention tag
  access.ts     # read-path authorization
```

## Build it

### Step 1: decide what tier each field belongs to, before you decide how to log it

```ts
type LogTier = "operational" | "content-redacted" | "content-raw";

interface FieldPolicy { field: string; tier: LogTier; retentionDays: number }

const policy: FieldPolicy[] = [
  { field: "model", tier: "operational", retentionDays: 365 },
  { field: "prompt_version", tier: "operational", retentionDays: 365 },
  { field: "tokens_in", tier: "operational", retentionDays: 365 },
  { field: "user_message", tier: "content-redacted", retentionDays: 30 },
  { field: "completion_text", tier: "content-redacted", retentionDays: 30 },
];
```

> **Why this step?** Deciding tiers up front is the whole discipline — it's tempting to log "everything, just in case," but that turns every field into the strictest field's problem. Operational metadata (model, version, token counts) has no privacy cost and can live for a year; the actual text needs redaction and a much shorter retention window. Making that a table, not a judgment call per log line, is what keeps it consistent.

### Step 2: redact before the write, not after

```ts
const PATTERNS: [RegExp, string][] = [
  [/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[EMAIL]"],
  [/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE]"],
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]"],
  [/\b\d{13,19}\b/g, "[CARD_NUMBER]"],
];

function redact(text: string): { redacted: string; hitCount: number } {
  let hitCount = 0;
  let redacted = text;
  for (const [pattern, replacement] of PATTERNS) {
    redacted = redacted.replace(pattern, () => { hitCount++; return replacement; });
  }
  return { redacted, hitCount };
}
```

> **Why this step?** Redacting at write time means the raw text never reaches disk in the first place — there's no "delete it later" step to forget. Pattern-based redaction won't catch everything (a pasted address like the one in this lesson's opening won't match any of these patterns), which is exactly why this stays a defense-in-depth layer, not the only one — see Step 4.

### Step 3: write with a retention tag, not an indefinite row

```ts
interface LogRecord {
  traceId: string;
  field: string;
  value: string;
  tier: LogTier;
  hitCount: number;
  expiresAt: string; // computed at write time, enforced by a scheduled deletion job
}

function writeLog(traceId: string, field: string, rawValue: string, pol: FieldPolicy): LogRecord {
  const isContent = pol.tier !== "operational";
  const { redacted, hitCount } = isContent ? redact(rawValue) : { redacted: rawValue, hitCount: 0 };
  const expiresAt = new Date(Date.now() + pol.retentionDays * 86_400_000).toISOString();
  return { traceId, field, value: redacted, tier: pol.tier, hitCount, expiresAt };
}
```

> **Why this step?** `expiresAt` computed at write time, not "cleaned up eventually," is what makes retention an enforceable property instead of a policy document nobody checks. A completion logged today for debugging is gone in 30 days whether or not anyone remembers it exists — the same discipline [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets) applies to credentials, applied here to user content.

### Step 4: gate reads, not just writes

```ts
function canRead(requester: { role: string }, record: LogRecord): boolean {
  if (record.tier === "operational") return true;               // anyone on-call
  if (record.tier === "content-redacted") return requester.role === "debugging" || requester.role === "support";
  return false; // "content-raw" tier shouldn't exist for user text at all in this design
}
```

> **Why this step?** Redaction reduces risk; it doesn't eliminate the need for access control, because redaction is imperfect (Step 2's regexes miss things) and because even redacted transcripts reveal what a user was asking about. Gating reads by role means an engineer debugging a latency issue never needs — and never gets — read access to completion content at all, since the trace from [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) answers that class of question without touching this store.

## Run it

```ts
const record = writeLog(
  "req_8f21ab",
  "user_message",
  "my email is dana@example.com, can you draft a reply?",
  policy.find(p => p.field === "user_message")!
);
console.log(record.value);     // "my email is [EMAIL], can you draft a reply?"
console.log(record.hitCount);  // 1
console.log(record.expiresAt); // 30 days out, not indefinite
```

The stored row is debuggable — you can still see the user was asking for a drafted reply — without the email address sitting in a database indefinitely.

## Harden it

- **Redact before logging, never as a batch job after.** A "redact nightly" job means every completion sits unredacted for up to 24 hours, which is exactly the window a breach or an overbroad query hits.
- **Log a redaction hit-count, and alert on drift.** If `hitCount` for a given field starts climbing, either user behavior changed (more people pasting sensitive data) or a prompt change started asking for it — both worth knowing immediately, not at the next audit.
- **Never let completion content flow into your trace or metrics store.** Keep the operational pipeline from [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) and this content pipeline physically separate — one polluted field can turn a low-access-control metrics dashboard into a privacy incident.
- **Confidential material never leaves the boundary it's scoped to.** Anything that counts as sensitive by your organization's own rules — internal records, credentials, anything a user or policy has flagged as confidential — should never reach an external logging or analytics vendor, even redacted. If in doubt, keep it in first-party storage only.

## Extend it

Add a real PII-detection model in front of the regex layer for names and addresses the patterns above miss, and route `hitCount > 0` records through the review queue pattern from [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues) if a human should confirm before content is retained at all. From here, the operational half of observability — traces, not content — feeds directly into [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing).

**Related:** [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai), [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing), [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets), [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation)
