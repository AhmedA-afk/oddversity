---
title: "Consuming a Token Stream in React"
track: "genai-app-dev"
status: live
summary: "Read an SSE stream, append tokens without re-rendering the whole thread, show a typing cursor, and stop cleanly."
duration: "8 min read"
---

The client half of a streamed chat feature has one job that's easy to get subtly wrong: append incoming tokens fast enough to feel live, without re-rendering every past message on every single delta.

## What we're building

A `useChatStream` hook that POSTs to the SSE endpoint from [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), appends deltas to a dedicated "in-flight" slot, and exposes a stop function — the client pairing that makes the feature end-to-end.

## Setup

No extra dependencies — `fetch` with a readable body stream is native. The key design decision up front: **keep the message being streamed in its own piece of state**, separate from the committed message history, and only merge it into history once it's done.

```tsx
type Message = { role: "user" | "assistant"; content: string; status?: "streaming" | "stopped" | "done" };

const [messages, setMessages] = useState<Message[]>([]);
const [streamingText, setStreamingText] = useState("");
const [isStreaming, setIsStreaming] = useState(false);
const abortRef = useRef<AbortController | null>(null);
```

## Build it

### 1. Send the request and read the body as a stream

```tsx
async function send(userText: string) {
  setMessages((m) => [...m, { role: "user", content: userText }]);
  setStreamingText("");
  setIsStreaming(true);

  const controller = new AbortController();
  abortRef.current = controller;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [...messages, { role: "user", content: userText }] }),
    signal: controller.signal,
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
```

> **Why this step?** The `AbortController` created here — not the one inside your API route — is the one the user's Stop button will call. It's what turns into `req.signal` on the server, closing the chain described in [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation).

### 2. Parse SSE frames out of the raw byte stream

```tsx
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? ""; // last chunk may be incomplete — keep it for next read

    for (const frame of frames) {
      const eventLine = frame.match(/^event: (.+)$/m)?.[1];
      const dataLine = frame.match(/^data: (.+)$/m)?.[1];
      if (!dataLine) continue;
      const payload = JSON.parse(dataLine);

      if (eventLine === "delta") {
        setStreamingText((prev) => prev + payload.text); // append, don't replace
      } else if (eventLine === "done" || eventLine === "error") {
        finalize(eventLine === "error" ? "stopped" : "done");
        return;
      }
    }
  }
```

> **Why this step?** Splitting on `\n\n` and holding back an incomplete trailing frame is what makes this robust to chunk boundaries that don't line up with SSE frame boundaries — a TCP packet can split a single `data:` line in half, and the code above simply waits for the rest on the next read instead of trying to parse a partial line.

### 3. Appending without re-rendering the whole thread

```tsx
function finalize(status: "done" | "stopped") {
  setMessages((m) => [...m, { role: "assistant", content: streamingText, status }]);
  setStreamingText("");
  setIsStreaming(false);
}
```

> **Why this step?** Every `setStreamingText` call only re-renders whatever component reads `streamingText` — the streaming bubble — not the full `messages` array. If you instead pushed each delta into the last item of `messages` with `setMessages`, React would re-diff the entire list on every token, which is fine for ten messages and increasingly janky past a few hundred. Keep the two pieces of state separate for the whole life of the stream; merge only once, at the end.

### 4. A typing cursor that's just CSS

```tsx
function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="bubble assistant">
      {text}
      <span className="cursor" aria-hidden>▍</span>
    </div>
  );
}
```

```css
.cursor { animation: blink 1s step-start infinite; }
@keyframes blink { 50% { opacity: 0; } }
```

> **Why this step?** The cursor is rendered once, statically, next to whatever `streamingText` currently is — it never needs its own state or timer. It disappears naturally the moment `isStreaming` becomes false and the bubble unmounts in favor of the committed message.

### 5. Stop, cleanly

```tsx
function stop() {
  abortRef.current?.abort();
  finalize("stopped"); // keep the partial text — don't discard it
}
```

> **Why this step?** Aborting the fetch closes the connection, which the server's `cancel()` hook (from the Next.js lesson) turns into an upstream abort. On the client, `finalize("stopped")` still commits whatever text arrived before the click — discarding a partial, readable answer the moment the user asked to stop it is the wrong default; see [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render) for the fuller pattern, including regenerate.

## Run it

Wire `send`, `stop`, `messages`, `streamingText`, and `isStreaming` into a chat component: render committed `messages`, then a `StreamingBubble` while `isStreaming` is true, then a Stop button that calls `stop()` and is disabled otherwise. That's the whole loop — user sends, bubble streams, cursor blinks, done or stopped, repeat.

## Harden it

- **A reconnect story you can live without.** Native `EventSource` auto-reconnects; the `fetch`-based reader above doesn't, because you need POST support that `EventSource` lacks. For a chat UI, that's usually fine — on a dropped connection, `finalize("stopped")` with whatever text arrived, and let the user retry the turn rather than trying to resume a partial generation, which the model can't do anyway.
- **A client-side hard timeout as a backstop.** If the server ever fails to emit a terminal event (a bug, not by design — see [Streaming Failure Modes](/learn/genai-app-dev/streaming-failure-modes)), your `while (true)` loop hangs forever. Wrap the read loop with a timeout that calls `stop()` if no frame arrives for, say, 30 seconds.

## Extend it

Feed `streamingText` through a markdown renderer and you need the fence-balancing fix in [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render). Route the same parsing loop through `input_json_delta` events instead of `text_delta`, and this becomes the client for [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui).

**Related:** [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/chat-ux-that-doesnt-feel-broken), [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation)
