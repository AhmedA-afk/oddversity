---
title: "Storing and Reloading Conversation History"
track: "genai-app-dev"
status: live
summary: "Build a Postgres-backed conversation store with a real schema, idempotent appends, and a concurrency guard against double writes."
duration: "8 min read"
---

[Session and State for Multi-Turn Features](/learn/genai-app-dev/session-and-state-management) drew the load-assemble-save loop. This lesson builds the "load" and "save" halves for real, with a schema that survives a retry storm and a resume after a crash.

## What we're building

A conversation store with two tables — `conversations` and `turns` — plus three operations: `loadConversation` (resume), `appendTurn` (idempotent write), and a concurrency guard so two simultaneous writers can't corrupt one conversation. We'll use Postgres because conversation history is exactly the kind of data you want ACID guarantees on — it doesn't just feed the model, it's often the audit trail for what your AI feature actually did.

## Setup

```sql
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  system_prompt TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  version       INT NOT NULL DEFAULT 0,   -- optimistic concurrency
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE turns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  seq             INT NOT NULL,           -- 0, 1, 2... order within the conversation
  role            TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content         TEXT NOT NULL,
  tool_call_id    TEXT,                   -- links a tool result back to its request
  tool_name       TEXT,
  client_turn_id  TEXT NOT NULL,          -- idempotency key from the caller
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, seq),
  UNIQUE (conversation_id, client_turn_id)
);
```

Two things are doing real work here. `seq` gives every turn an unambiguous order that survives clock skew (never sort conversation history by `created_at` alone — two turns can land in the same millisecond). `client_turn_id` is a caller-supplied idempotency key: if the client retries a request that actually succeeded server-side, the unique constraint rejects the duplicate insert instead of silently doubling the turn.

## Build it

### Step 1: load on resume

```typescript
async function loadConversation(conversationId: string) {
  const convo = await db.query(
    `SELECT id, user_id, system_prompt, metadata, version FROM conversations WHERE id = $1`,
    [conversationId]
  );
  const turns = await db.query(
    `SELECT role, content, tool_call_id, tool_name, seq
     FROM turns WHERE conversation_id = $1 ORDER BY seq ASC`,
    [conversationId]
  );
  return { ...convo.rows[0], turns: turns.rows };
}
```

> **Why this step?** Resuming a conversation is a read path, not a special case — the same query runs whether it's turn 2 or turn 200. Ordering by `seq` (not by insertion order or timestamp) is what guarantees the model sees history in the order it actually happened, even if a write landed out of order due to retries.

### Step 2: append a turn, idempotently

```typescript
async function appendTurn(
  conversationId: string,
  clientTurnId: string,
  role: "user" | "assistant" | "tool",
  content: string,
  extra: { toolCallId?: string; toolName?: string } = {}
) {
  const nextSeq = await db.query(
    `SELECT COALESCE(MAX(seq), -1) + 1 AS next FROM turns WHERE conversation_id = $1`,
    [conversationId]
  );

  await db.query(
    `INSERT INTO turns (conversation_id, seq, role, content, tool_call_id, tool_name, client_turn_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (conversation_id, client_turn_id) DO NOTHING`,
    [conversationId, nextSeq.rows[0].next, role, content, extra.toolCallId, extra.toolName, clientTurnId]
  );
}
```

> **Why this step?** `ON CONFLICT ... DO NOTHING` on `client_turn_id` is the idempotency guarantee: if the frontend times out waiting for a response and retries the same submit with the same `client_turn_id`, the second insert is a no-op instead of a duplicate user message that confuses the model on the next call. Generate `client_turn_id` client-side (a UUID) once per user action, before the network request goes out — not server-side, or a retry generates a *new* key and defeats the whole point.

### Step 3: guard against concurrent writers

```typescript
async function appendTurnSafely(conversationId: string, expectedVersion: number, ...turnArgs: Parameters<typeof appendTurn>) {
  const result = await db.query(
    `UPDATE conversations SET version = version + 1, updated_at = now()
     WHERE id = $1 AND version = $2`,
    [conversationId, expectedVersion]
  );
  if (result.rowCount === 0) {
    throw new ConcurrentModificationError(conversationId);
  }
  await appendTurn(conversationId, ...turnArgs);
}
```

> **Why this step?** The `WHERE version = $2` clause is optimistic concurrency control: the caller loaded the conversation at version 3, and if it's still version 3 when they write, the update succeeds and bumps it to 4. If someone else's turn landed first, the version has already moved and this update matches zero rows — telling the caller to reload and either retry or surface a conflict, instead of two turns silently interleaving into a corrupted transcript.

## Run it

```typescript
const convo = await loadConversation(conversationId);
const userMsg = "What's the status of order #4521?";
const clientTurnId = crypto.randomUUID(); // generated once, reused on retry

await appendTurnSafely(conversationId, convo.version, clientTurnId, "user", userMsg);
const response = await callModel({ messages: toModelMessages(convo) });
await appendTurnSafely(conversationId, convo.version + 1, crypto.randomUUID(), "assistant", response.text);
```

Run the user-turn insert twice with the same `clientTurnId` (simulating a retried request) and confirm only one row exists in `turns` — that's the idempotency guarantee working.

## Harden it

- **Index `(conversation_id, seq)`** — you already have it via the `UNIQUE` constraint, but confirm your query planner is using it once conversations grow past a few hundred turns; a sequential scan over turns is the first thing that gets slow.
- **Cache the hot conversation in Redis** for active sessions, with Postgres as the source of truth. Read from cache, write-through to Postgres, and treat a cache miss as "reload from Postgres" rather than "conversation doesn't exist" — caches evict, databases don't.
- **Soft-delete, don't hard-delete.** A `deleted_at` column on `conversations` lets you honor a user's delete request in the product while keeping the audit trail for the retention window your compliance requirements need.
- **Never trust `content` as safe to render.** Store what the model actually said; sanitize on the way out to the UI, not on the way into the database — you want the untouched record for debugging and replay.

## Extend it

This schema is the foundation the next two lessons build directly on: [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming) reads the `turns` table to decide what fits in a budget, and [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim) writes summarized turns back into it. If your feature calls tools, the `tool_call_id` and `tool_name` columns are exactly what [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) needs to match a tool result back to its request across turns.

**Related:** [Session and State for Multi-Turn Features](/learn/genai-app-dev/session-and-state-management), [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming), [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim), [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop)
