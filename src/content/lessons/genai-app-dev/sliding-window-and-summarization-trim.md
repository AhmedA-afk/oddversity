---
title: "Trimming: Sliding Windows and Rolling Summaries"
track: "genai-app-dev"
status: live
summary: "Build one fitToBudget() function with two strategies — a sliding window and a rolling summary — and test it at a tight budget."
duration: "9 min read"
---

[Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming) established the math. Now we build the function that actually runs it: `fitToBudget()`, with two swappable strategies behind one interface.

## What we're building

A single function, `fitToBudget(conversation, budget)`, that returns a trimmed message array guaranteed to fit inside a token budget. It supports two strategies:

- **Sliding window** — keep the system message and the most recent N turns that fit; drop everything older.
- **Rolling summary** — keep the system message and recent turns, but replace dropped-off turns with a running summary instead of deleting them outright, so old context isn't fully lost.

Both share the same shape so callers don't need to know which one is active — this is the same "swap the implementation behind a stable interface" idea from [Building a Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), applied to history instead of providers.

## Setup

```typescript
import { encode } from "gpt-tokenizer"; // any tokenizer matching your model's family works

type Message = { role: "system" | "user" | "assistant" | "tool"; content: string };

function tokenCount(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + encode(m.content).length + 4, 0); // +4: per-message overhead
}
```

Use the tokenizer that matches your provider's family — an approximate count is fine for budgeting (you're leaving headroom anyway), but don't guess with a rough "4 characters per token" rule for anything close to the edge of the window; it's off by enough to matter right where it matters most.

## Build it

### Step 1: sliding window

```typescript
function slidingWindow(messages: Message[], budget: number): Message[] {
  const system = messages.filter((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system");

  const kept: Message[] = [];
  let used = tokenCount(system);

  // walk backward from the most recent turn, keep what fits
  for (let i = rest.length - 1; i >= 0; i--) {
    const withNext = used + tokenCount([rest[i]]);
    if (withNext > budget) break;
    kept.unshift(rest[i]);
    used = withNext;
  }

  return [...system, ...kept];
}
```

> **Why this step?** Walking backward and stopping the moment a message would overflow guarantees the result never exceeds budget — no post-hoc truncation, no partial messages. It's the cheapest strategy to reason about and the right default when older context genuinely stops mattering (a support bot where each ticket is self-contained, say).

### Step 2: rolling summary

```typescript
async function rollingSummary(messages: Message[], budget: number, summarizeModel: ModelClient): Promise<Message[]> {
  const system = messages.filter((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system");

  // find how many recent turns fit under budget on their own
  let recentCount = 0;
  let used = tokenCount(system);
  for (let i = rest.length - 1; i >= 0; i--) {
    const withNext = used + tokenCount([rest[i]]);
    if (withNext > budget * 0.7) break; // reserve 30% of budget for the summary
    recentCount++;
    used = withNext;
  }

  const dropped = rest.slice(0, rest.length - recentCount);
  const recent = rest.slice(rest.length - recentCount);
  if (dropped.length === 0) return [...system, ...recent];

  const summary = await summarizeModel.complete({
    messages: [
      { role: "system", content: "Summarize this conversation excerpt in under 200 words. Preserve names, decisions, numbers, and open questions. Do not add commentary." },
      { role: "user", content: dropped.map((m) => `${m.role}: ${m.content}`).join("\n") },
    ],
  });

  const summaryMsg: Message = { role: "system", content: `Earlier conversation summary: ${summary.text}` };
  return [...system, summaryMsg, ...recent];
}
```

> **Why this step?** Reserving 30% of the budget for the summary *before* deciding what counts as "recent" avoids a chicken-and-egg problem — you can't know if the summary fits until you know its size, so budget for it up front and only grow it if there's room. The summarization prompt explicitly asks for names, decisions, and numbers because those are what a generic summary drops first and what a user is most likely to reference later ("what did we decide about the deadline?"). This is the same compaction idea as [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction), applied specifically to conversation turns instead of documents.

### Step 3: one function, two strategies

```typescript
type TrimStrategy = "window" | "summary";

async function fitToBudget(
  messages: Message[],
  budget: number,
  strategy: TrimStrategy = "window",
  summarizeModel?: ModelClient
): Promise<Message[]> {
  if (tokenCount(messages) <= budget) return messages; // nothing to trim

  if (strategy === "summary" && summarizeModel) {
    return rollingSummary(messages, budget, summarizeModel);
  }
  return slidingWindow(messages, budget);
}
```

> **Why this step?** The early return matters as much as the trimming logic — most turns, especially early in a conversation, don't need trimming at all, and running a summarization call on every single turn would be needless latency and cost. Check first, trim only when you have to.

## Run it

Test at a deliberately tight budget to see both strategies under real pressure:

```typescript
const history: Message[] = [
  { role: "system", content: "You are a support assistant for Acme Cloud." },
  { role: "user", content: "My deploy is failing with error E4021." },
  { role: "assistant", content: "E4021 means your build exceeded the 10-minute timeout. Try splitting the build step." },
  { role: "user", content: "Split it how? We have one Dockerfile with 40 steps." },
  { role: "assistant", content: "Use multi-stage builds — separate the dependency install stage from the final image." },
  { role: "user", content: "Did that. Still hitting E4021 at 11 minutes." },
];

const tightBudget = 60; // deliberately small, in tokens

const windowed = await fitToBudget(history, tightBudget, "window");
console.log(windowed.map((m) => m.role)); // ["system", "assistant", "user"] — only the tail fits

const summarized = await fitToBudget(history, tightBudget, "summary", summarizeModel);
console.log(summarized.map((m) => m.role)); // ["system", "system", "user"] — summary + tail
```

At 60 tokens, the sliding window keeps only the last exchange and silently loses the fact that multi-stage builds were already tried — the next model call risks re-suggesting the same fix. The rolling summary keeps that fact compressed into the injected summary message, at the cost of one extra model call and a less precise record of exactly what was said.

## Harden it

- **Cap how often you re-summarize.** Summarizing every turn once history is long means every turn pays for a summarization call. Summarize only when the window strategy would drop something, and cache the summary until the next drop is needed.
- **Never summarize away tool call/result pairs separately.** A tool call and its result must travel together (see [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop)) — dropping half the pair leaves a dangling reference the model can't resolve.
- **Log what got dropped.** Even under the window strategy, write the full untrimmed history to your durable store from [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history) — trimming is what you *send*, not what you *keep*.
- **Set a hard floor.** If even the system prompt plus one turn doesn't fit the budget, that's a configuration bug (oversized system prompt or tool schemas), not a trimming problem — fail loudly rather than silently sending an empty system message.

## Extend it

Both strategies can run per-conversation-type: a coding assistant might default to sliding window (recent code matters more than a summary of it), while a long-running planning assistant benefits from rolling summaries almost immediately. Either way, this is the last stop before the history becomes a real API call — from here it feeds directly into whatever [structured output](/learn/genai-app-dev/structured-output-in-apps) or [tool-calling loop](/learn/genai-app-dev/implementing-a-tool-call-loop) sits on top of it.

**Related:** [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history), [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop)
