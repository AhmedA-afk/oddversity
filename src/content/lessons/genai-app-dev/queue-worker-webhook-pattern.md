---
title: "The Queue, Worker, and Webhook Pattern"
track: "genai-app-dev"
status: live
summary: "Build enqueue-on-request, a worker that runs the long AI task, and status polling plus a webhook, with retries and a dead-letter path."
duration: "9 min read"
---

[Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks) made the sync-vs-async call. This lesson builds the async side end to end: the enqueue endpoint, the worker, the status API, and the notification back to the client.

## What we're building

A batch document-summarization endpoint: a request enqueues a job and returns immediately with an ID, a worker pulls jobs off the queue and runs the actual model call, the client polls for status or receives a webhook when it's done, and failures get retried with a limit before landing in a dead-letter queue instead of vanishing silently.

## Setup

This example uses Node.js with a Postgres-backed job table standing in for a real queue (Redis, SQS, or a managed option like Inngest or Trigger.dev all follow the same shape). The job table is the durable record — the queue moves work through, the table answers "what happened to job 4192."

```sql
create table jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued', -- queued | running | completed | failed
  input jsonb not null,
  result jsonb,
  error text,
  attempts int not null default 0,
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Build it

### Enqueue on request

```ts
import { randomUUID } from "crypto";

app.post("/summarize", async (req, res) => {
  const { documentText, webhookUrl } = req.body;

  const job = await db.query(
    `insert into jobs (id, status, input, webhook_url)
     values ($1, 'queued', $2, $3) returning id`,
    [randomUUID(), { documentText }, webhookUrl ?? null]
  );

  await queue.push({ jobId: job.rows[0].id });

  res.status(202).json({ jobId: job.rows[0].id, status: "queued" });
});
```

> **Why this step?** The response comes back in milliseconds regardless of how long the summarization actually takes — a `202 Accepted` with a job ID, not a `200` with a result, is the honest signal that work has started but not finished. Nothing about this endpoint blocks on the model call.

### The worker runs the actual task

```ts
async function processJob(jobId: string) {
  await db.query(`update jobs set status = 'running', updated_at = now() where id = $1`, [jobId]);

  const job = await db.query(`select input, attempts from jobs where id = $1`, [jobId]);
  const { documentText } = job.rows[0].input;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: `Summarize this document:\n\n${documentText}` }],
    });
    const summary = response.content.find(b => b.type === "text")?.text ?? "";

    await db.query(
      `update jobs set status = 'completed', result = $2, updated_at = now() where id = $1`,
      [jobId, { summary }]
    );
    await notifyClient(jobId);
  } catch (err) {
    await handleFailure(jobId, err);
  }
}
```

> **Why this step?** The worker is the only place the actual model call happens — it runs on its own process, on its own timeline, with no HTTP client waiting on the other end. This is what makes a 90-second summarization job the same shape of code as a 9-second one; the worker doesn't care, because nothing times out waiting on it.

### Status polling for the client

```ts
app.get("/jobs/:id", async (req, res) => {
  const job = await db.query(
    `select status, result, error from jobs where id = $1`, [req.params.id]
  );
  if (job.rows.length === 0) return res.status(404).json({ error: "not_found" });
  res.json(job.rows[0]);
});
```

> **Why this step?** Polling needs no reachable endpoint from the caller and works through any firewall — the tradeoff is wasted requests and a small discovery delay, which is fine at a 2-5 second poll interval with backoff. This is the fallback every client can use, even ones that can't receive a webhook.

### Completion webhook for clients that can receive one

```ts
async function notifyClient(jobId: string) {
  const job = await db.query(`select webhook_url, result from jobs where id = $1`, [jobId]);
  const { webhook_url, result } = job.rows[0];
  if (!webhook_url) return; // polling-only client

  const payload = JSON.stringify({ jobId, status: "completed", result });
  const signature = signPayload(payload, process.env.WEBHOOK_SECRET);

  await fetch(webhook_url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-signature": signature },
    body: payload,
  });
}
```

> **Why this step?** A signed payload — not a secret embedded in the URL — is what lets the receiver verify the callback genuinely came from you and wasn't forged or replayed. This is near-instant compared to polling, but it requires the caller to expose a reachable endpoint and handle their own retries if it's briefly down, which is why it's an addition to polling, not a replacement for it.

### Retries and a dead-letter path

```ts
const MAX_ATTEMPTS = 3;

async function handleFailure(jobId: string, err: Error) {
  const job = await db.query(
    `update jobs set attempts = attempts + 1 where id = $1 returning attempts`, [jobId]
  );
  const attempts = job.rows[0].attempts;

  if (attempts < MAX_ATTEMPTS) {
    const backoffMs = 2 ** attempts * 1000 + Math.random() * 500;
    await queue.push({ jobId }, { delayMs: backoffMs });
  } else {
    await db.query(
      `update jobs set status = 'failed', error = $2, updated_at = now() where id = $1`,
      [jobId, err.message]
    );
    await deadLetterQueue.push({ jobId, error: err.message });
    await notifyClientFailure(jobId, err.message);
  }
}
```

> **Why this step?** A queued job can fail silently — a transient rate limit, a timeout, a bad document — unless retries are bounded and the terminal failure is recorded somewhere durable. A dead-letter queue is what stops "we retried forever and never told anyone" from being the failure mode; see [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter) for the backoff math this borrows directly.

## Run it

```bash
curl -X POST /summarize -d '{"documentText": "...", "webhookUrl": "https://myapp.com/hooks/summary"}'
# {"jobId": "a1b2...", "status": "queued"}

curl /jobs/a1b2...
# {"status": "running"}
#  ... a few seconds later ...
# {"status": "completed", "result": {"summary": "..."}}
```

## Harden it

- **Make job processing idempotent.** If a worker crashes mid-job and the queue retries, re-running the summarization shouldn't double-send the webhook or double-charge the user — check `status` before starting work, and make the completion write-and-notify sequence safe to repeat. This is the same discipline [Idempotency and Partial Failure](/learn/genai-app-dev/idempotency-and-partial-failure) covers for the request path generally.
- **Push progress updates for long multi-step jobs**, not just a binary queued/completed — a multi-step agent job can update a `progress` field on the job row after each step, so the client's poll response shows "3 of 7 sections summarized" instead of a flat spinner.
- **Timeout the worker's own model call**, separately from the job's overall lifetime — see [Timeouts and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers) — so a single hung API call doesn't hold a worker slot indefinitely.

## Extend it

This pipeline is what a heavy async feature — a multi-step agent run, a batch operation, anything queued for [human review](/learn/genai-app-dev/human-in-the-loop-review-queues) before it ships — is built on. Push `progress` updates over [SSE or a WebSocket](/learn/genai-app-dev/sse-vs-websockets) instead of polling when the client has a live connection open already; it's the same completion signal, delivered instantly instead of discovered on the next poll.

**Related:** [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks), [Background Jobs for Long-Running AI Tasks](/learn/genai-app-dev/background-jobs-for-long-running-ai-tasks), [SSE vs. WebSockets for Streaming LLM Output](/learn/genai-app-dev/sse-vs-websockets), [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues)
