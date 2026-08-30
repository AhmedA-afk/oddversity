---
title: "Session and State for Multi-Turn Features"
track: "genai-app-dev"
status: live
summary: "A chat feature that forgets mid-conversation is a state bug, not a model bug — map what has to persist and what doesn't."
duration: "7 min read"
---

The model has no memory between calls. Every "conversation" your users experience is an illusion your application maintains, one HTTP request at a time. When that illusion breaks — the assistant forgets what it just said, a retry double-books an appointment, two browser tabs stomp on each other's turns — the bug is almost never in the model. It's in how your app decided what to remember, where to keep it, and when to forget it.

## What it is

A multi-turn feature needs four distinct kinds of state, and conflating them is where most bugs start:

- **Message history** — the back-and-forth of user and assistant turns, plus any tool calls and results embedded in that sequence. This is what gets replayed into the model on every call.
- **System configuration** — the system prompt, active tool definitions, model choice, sampling parameters. Usually stable within a conversation, but it can change (a user switches modes, a feature flag flips mid-session).
- **Tool results** — data your app fetched on the model's request. These often need to live in message history (so the model can reference them) *and* in a durable form your app can audit independently of what got trimmed out of the prompt.
- **User/session context** — who's asking, their permissions, their preferences, which experiment bucket they're in. This shapes *how* you assemble the other three but isn't itself part of the conversation.

The second split that matters is **ephemeral vs. durable**. Ephemeral state lives for the lifetime of one request: the parsed input, an in-flight retry counter, a rate-limit token bucket check. Durable state survives the request: the message history that has to be there when the user reopens the app tomorrow. Ephemeral state belongs in memory or a short-lived cache; durable state belongs in a store you'd trust with any other user data — because that's exactly what it is.

## The mental model

Treat each turn as a pure function over persisted state, not as a conversation that "continues" on the provider's side:

```text
turn(n):
  state[n-1] = load(conversation_id)          # durable
  request    = assemble(state[n-1], new_input) # ephemeral
  response   = call_model(request)             # stateless call
  state[n]   = append(state[n-1], new_input, response)
  save(conversation_id, state[n])              # durable
```

Most LLM APIs are stateless HTTP calls — the provider doesn't remember your last request (a few providers now offer server-side conversation objects, but even those are optional and provider-specific, so don't build your architecture around them). That means *your app* reconstructs the entire visible context on every single call. If you don't explicitly load and pass the history, the model has none. If you don't explicitly save the new turn, it's gone the moment the response finishes streaming.

This is the same request lifecycle from [Build an AI feature around a request lifecycle](/learn/genai-app-dev/api-lifecycle-and-structured-output) — state management is what happens in the "compose" and "act" ends of that lifecycle, stretched across many requests instead of one.

## Why it works this way

Statelessness on the provider side is a feature, not a limitation you're working around. It's what lets a provider load-balance your requests across any server in any region, retry a failed call without coordinating with some session store, and scale to millions of concurrent users without pinning each one to a machine that "remembers" them. The cost of that scalability is that continuity becomes your problem. You get full control over what the model sees — you can edit history, redact a turn, inject a summary, branch a conversation — precisely because the provider isn't secretly holding a copy you'd have to fight with.

## A concrete example

A minimal turn handler that respects the split above:

```typescript
type Turn = { role: "user" | "assistant" | "tool"; content: string; toolCallId?: string };
type Conversation = {
  id: string;
  systemPrompt: string;
  turns: Turn[];
  userId: string;
};

async function handleTurn(conversationId: string, userMessage: string) {
  // durable state, loaded fresh — never assume it's cached from last time
  const convo = await loadConversation(conversationId); // e.g. from Postgres

  // ephemeral: this request's working copy
  const messages = [
    { role: "system", content: convo.systemPrompt },
    ...convo.turns,
    { role: "user", content: userMessage },
  ];

  const response = await callModel({ messages, tools: activeToolsFor(convo.userId) });

  // durable again: persist before returning, not after
  convo.turns.push({ role: "user", content: userMessage });
  convo.turns.push({ role: "assistant", content: response.text });
  await saveConversation(convo);

  return response.text;
}
```

Notice what's *not* in `Conversation`: no retry counters, no in-flight lock state, no rate-limit bookkeeping. Those are ephemeral and belong in memory, Redis with a TTL, or the request scope — not mixed into the record you're going to replay into the model next turn.

## Where it shows up

- **Chat UIs** — the obvious case: every message box with history is this loop, running once per send.
- **Background agents** — a job that resumes after a crash needs the same load-assemble-save discipline, just triggered by a queue message instead of an HTTP request. See [Background Jobs for Long-Running AI Tasks](/learn/genai-app-dev/background-jobs-for-long-running-ai-tasks).
- **Tool-calling loops** — each tool round-trip is itself a mini-turn that appends to the same history; how you store those results feeds directly into [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority).
- **Multi-device sync** — if state lives only in browser memory, a user switching from phone to laptop loses the thread. Durable, server-side storage is what makes "continue on another device" possible at all.

## Watch out for

- **Storing everything in the prompt and nothing anywhere else.** If the message array *is* your only record, you can't audit what happened, can't trim without losing data permanently, and can't build analytics on top of conversations. Keep a durable store independent of whatever shape you trim the prompt into.
- **Letting ephemeral state leak into durable state.** A retry counter or a half-finished tool call that gets accidentally persisted will replay on every future turn, confusing the model with stale internal bookkeeping it was never meant to see.
- **No concurrency story.** Two tabs, or a retry racing a real request, can both load the same conversation, append different turns, and save — with the second write silently discarding the first. This is small enough to defer here, but not in production; the next lesson handles it directly.

## Where next

This lesson sets the frame; the next one, [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history), builds the actual persistence layer — schema, load-on-resume, and the concurrency guard this lesson flagged. After that, [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming) picks up what happens when that durable history gets too big to replay whole.

**Related:** [Session and State Across Turns](/learn/genai-app-dev/session-state-multi-turn), [Build an AI feature around a request lifecycle](/learn/genai-app-dev/api-lifecycle-and-structured-output), [Background Jobs for Long-Running AI Tasks](/learn/genai-app-dev/background-jobs-for-long-running-ai-tasks), [Treat tool calls as requests for authority](/learn/genai-app-dev/tool-calling-as-authority)
