---
title: "Stop, Regenerate, and Rendering Partial Output"
track: "genai-app-dev"
status: live
summary: "One scenario, worked through: a stopped mid-code-block reply, a regenerate, and the markdown renderer that almost breaks."
duration: "7 min read"
---

One scenario, carried start to finish: a user asks for a function, the reply starts streaming a fenced code block, and they click Stop halfway through the fence. What happens next is where most half-built chat UIs quietly fall apart.

## The setup

The user sends:

```
Write a Python function to reverse a linked list.
```

The assistant starts streaming a reply. At the moment the user clicks **Stop**, the accumulated text looks like this — an *unterminated* markdown fence:

````text
Here's a function that reverses a singly linked list in place:

```python
def reverse_linked_list(head):
    prev = None
    while head:
        next_node = head.next
````

Notice the closing ` ``` ` never arrived. That's the exact state a naive renderer chokes on.

## Step by step

### Step 1: Stop aborts the client fetch, which propagates to the server

```tsx
function stop() {
  abortRef.current?.abort();      // closes the fetch — server sees req.signal fire
  finalize("stopped");            // commit whatever text arrived, don't discard it
}
```

> **Why this step?** This is the same `abortRef` wired in [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react) — closing the client's fetch is what turns into the server's `req.signal` abort event, which is what stops the upstream provider call from generating (and billing) any further tokens. Full chain: [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation).

### Step 2: the message is committed with a `stopped` status, not discarded

```tsx
setMessages((m) => [
  ...m,
  { role: "assistant", content: partialText, status: "stopped" },
]);
```

> **Why this step?** The instinct to "clear it since it's incomplete" throws away a genuinely useful partial answer — the reader can see the setup and most of the function body. `status: "stopped"` lets the UI show a small "stopped" badge without hiding the content itself.

### Step 3: render safety — the unterminated fence

Feed `partialText` straight into a naive markdown renderer and the open ` ```python ` fence has no matching close. Depending on the renderer, everything *after* that point — including your app's own UI chrome, if the renderer doesn't sandbox its output — can get swallowed into one giant, unstyled code block, or the renderer can throw outright.

The fix is a small pre-render pass that balances fences before handing text to the renderer:

```ts
function balanceFences(text: string): string {
  const fenceCount = (text.match(/```/g) ?? []).length;
  return fenceCount % 2 === 1 ? text + "\n```" : text; // close any open fence
}
```

> **Why this step?** Counting triple-backtick occurrences and closing an odd count is a cheap, reliable heuristic — it doesn't need to understand markdown, only to guarantee every fence it opened gets closed before the renderer sees the string. Run this on every render of in-progress *and* stopped text, not just at the final commit — the same half-open fence exists at every intermediate point while the stream is still live, and a renderer that breaks on it breaks the live view too, not just the stopped one.

### Step 4: Regenerate — remove the stale turn before resending

```tsx
function regenerate() {
  setMessages((m) => m.slice(0, -1)); // drop the stopped/mediocre assistant turn
  const lastUserMessage = messages.findLast((m) => m.role === "user")!;
  send(lastUserMessage.content, { skipAppendingUserBubble: true });
}
```

> **Why this step?** The naive version resends the full `messages` array *including* the half-finished assistant turn as prior context — which means the model sees its own truncated answer as something it already said, and often continues from that broken sentence instead of writing a fresh one. Splicing the stale turn out before resending is what makes "regenerate" actually mean "try again," not "continue this broken attempt."

### Step 5: the new stream renders into a fresh bubble

The regenerated response streams in exactly like the first attempt — same `streamingText` state, same fence-balancing pass, same Stop button available again. From the renderer's point of view, nothing about this turn is different from the first one; only the message array changed.

## Where it breaks (+ fix)

**Break:** the account resends the array with the stopped turn still in it (skipping Step 4), and the model's regenerated answer literally continues mid-sentence from `next_node = head.next` instead of starting over — confusing output that looks like a bug in the model when it's actually a bug in what context was sent.
**Fix:** always splice out the turn being regenerated before constructing the next request's message list — regenerate is "resend the last user turn," never "append a correction to the broken one."

**Break:** `balanceFences` is only applied at the final `stopped` commit, not during live streaming — so the *in-progress* bubble renders broken while the stream is still active, then snaps to correct only after Stop or completion.
**Fix:** run the same balancing function on `streamingText` for every intermediate render, not just the terminal state — partial rendering safety is a property of every frame, not just the last one.

## Takeaways

- A stopped generation is still useful output — commit it, don't discard it, and label it rather than hide it.
- Markdown (and any structured format) needs a tolerance pass before rendering partial text; an unbalanced fence is the single most common way a half-finished reply breaks the whole page's layout.
- Regenerate means resending the original request, not continuing the broken one — drop the stale turn from the message array before the retry goes out.
- Apply render-safety fixes to every intermediate frame of a live stream, not only to the final committed message — the bug is visible well before the user clicks Stop.

**Related:** [Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/chat-ux-that-doesnt-feel-broken), [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation), [SSE vs WebSockets: Choosing a Transport](/learn/genai-app-dev/sse-vs-websockets-deep)
