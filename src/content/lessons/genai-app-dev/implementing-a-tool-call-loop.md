---
title: "Implementing the Tool-Call Loop"
track: "genai-app-dev"
status: live
summary: "Build the reusable loop that declares tools, executes what the model proposes, feeds results back, and stops at a final answer or a guard."
duration: "9 min read"
---

Every tool-using feature — a support bot, a research agent, a coding assistant — runs the same loop underneath. This lesson builds that loop once, generically, so the examples after it just plug tools into it.

## What we're building

A `runToolLoop()` function that: declares tools to the model, receives however many tool calls come back (possibly several in parallel), executes each through the risk-aware dispatcher from [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority), feeds the results back as the next turn, and repeats until the model returns a plain text answer or an iteration guard trips.

## Setup

```typescript
type ToolDef = { name: string; description: string; input_schema: object };
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
type Message = { role: "user" | "assistant"; content: any };

const MAX_ITERATIONS = 8; // a real ceiling, not a suggestion
```

## Build it

### Step 1: declare tools and make one model call

```typescript
async function callModelWithTools(messages: Message[], tools: ToolDef[]) {
  return anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    tools,
    messages,
  });
}
```

> **Why this step?** Keeping this as its own function matters once you get to retries and provider swaps — every other step in the loop treats "call the model" as a black box that returns content blocks, regardless of which provider is behind it. That's the same seam [Building a Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts) draws for non-tool calls.

### Step 2: execute every tool call in the response, in parallel

```typescript
async function executeToolCalls(toolUseBlocks: any[], ctx: { userId: string }): Promise<ToolResultBlock[]> {
  const results = await Promise.allSettled(
    toolUseBlocks.map((block) => executeTool(block.name, block.input, ctx))
  );

  return results.map((result, i) => {
    const block = toolUseBlocks[i];
    if (result.status === "fulfilled") {
      return { type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result.value) };
    }
    // a failed tool call becomes an error result the model can see and react to —
    // it does not crash the loop
    return { type: "tool_result", tool_use_id: block.id, content: String(result.reason), is_error: true };
  });
}
```

> **Why this step?** `Promise.allSettled`, not `Promise.all` — a model asking for weather in three cities at once shouldn't have all three fail because one city's lookup threw. Each result is matched back to its request by `tool_use_id`, which is what lets you run several tool calls concurrently and still reassemble them in the right order for the model to read. A tool failure becomes an `is_error` result fed back into the conversation, not an uncaught exception — the model can often recover ("that city wasn't found, did you mean...") if it's told what actually happened.

### Step 3: the loop itself

```typescript
async function runToolLoop(initialMessages: Message[], tools: ToolDef[], ctx: { userId: string }): Promise<string> {
  let messages = [...initialMessages];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await callModelWithTools(messages, tools);
    const toolUseBlocks = response.content.filter((b: any) => b.type === "tool_use");

    if (toolUseBlocks.length === 0) {
      // no tool calls left to make — this is the final answer
      const textBlock = response.content.find((b: any) => b.type === "text");
      return textBlock?.text ?? "";
    }

    messages.push({ role: "assistant", content: response.content });
    const toolResults = await executeToolCalls(toolUseBlocks, ctx);
    messages.push({ role: "user", content: toolResults });
  }

  throw new ToolLoopExhaustedError(`Did not converge after ${MAX_ITERATIONS} iterations`);
}
```

> **Why this step?** The loop's exit condition is "the model stopped asking for tools," not a fixed number of rounds — most real requests resolve in one or two. `MAX_ITERATIONS` exists purely as a backstop against the model getting stuck proposing tool calls indefinitely (a malformed result it keeps misreading, a tool that never returns what it expects). Throwing rather than silently returning an empty string when the guard trips means the caller finds out the loop didn't converge instead of shipping a blank response to a user.

## Run it

```typescript
const answer = await runToolLoop(
  [{ role: "user", content: "What's the weather in Austin, and is my order #4521 shipped yet?" }],
  [weatherTool, orderStatusTool],
  { userId: "user_123" }
);
console.log(answer);
// One iteration: model requests both tools in parallel, gets both results,
// composes a single answer referencing both.
```

Then force the guard: point one tool at a stub that always returns a result the model will predictably ask to retry (e.g., an always-"pending" status), and confirm the loop throws `ToolLoopExhaustedError` at iteration 8 instead of running forever.

## Harden it

- **Persist `messages` after every iteration**, not just at the end — if the process crashes mid-loop, you want to resume from the last completed round-trip using the conversation store from [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history), not restart the whole request.
- **Feed trimmed history into `callModelWithTools`**, not the raw growing array — a long tool loop accumulates tool results fast, and [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim)'s `fitToBudget()` applies here exactly as it does to ordinary chat turns.
- **Track a cost budget alongside the iteration count.** A loop can converge within `MAX_ITERATIONS` and still be expensive if each tool call round-trips a large result — cap total tokens spent per loop, not just rounds.
- **Log the full sequence of tool calls per loop run.** When a loop produces a wrong final answer, the tool call sequence is almost always where the investigation starts — you need it recorded, not just the final text.

## Extend it

This loop is deliberately generic — [Two Tools: A Read API and a Guarded DB Write](/learn/genai-app-dev/building-a-weather-and-db-tool) plugs a real read tool and a real write tool into `executeTool` and shows how the risk split changes what happens inside each branch. [Multi-Step Tool Loops and Where They Go Wrong](/learn/genai-app-dev/multi-step-agentic-tool-loops) picks up what happens when `MAX_ITERATIONS` isn't enough of a guard on its own.

**Related:** [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority), [Two Tools: A Read API and a Guarded DB Write](/learn/genai-app-dev/building-a-weather-and-db-tool), [Storing and Reloading Conversation History](/learn/genai-app-dev/storing-conversation-history), [Trimming: Sliding Windows and Rolling Summaries](/learn/genai-app-dev/sliding-window-and-summarization-trim)
