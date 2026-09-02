---
title: "Chat UX That Doesn't Feel Broken"
track: "genai-app-dev"
status: live
summary: "The small, invisible state machine behind every send — and the three race conditions that make chat feel amateur."
duration: "6 min read"
---

[Designing Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/designing-chat-ux) covers stop, regenerate, typing indicators, and error recovery. This lesson is one layer beneath that: the state machine every single message send passes through, and the timing bugs that live in its transitions — the ones that make a chat feel amateur even when every individual feature works.

## What it is

Every turn in a chat UI moves through the same sequence of states: idle, then optimistic-sent (the user's bubble appears immediately, before the network call resolves), then streaming (the assistant bubble grows token by token), then committed or errored. "Chat UX" isn't really about bubbles and spinners — it's about handling the transitions between those states correctly, especially the ones that happen in a window of a few hundred milliseconds where two things can happen out of order.

## The mental model

Treat each turn as a small state machine with one active instance at a time:

```
idle → sending (optimistic) → streaming → committed
                                        ↘ error → retry → sending
```

Nearly every "this chat feels janky" complaint traces back to code that doesn't actually enforce this — a UI that lets a second `sending` start before the first `committed`, or one that jumps straight from `idle` to a cleared input field without waiting to confirm `sending` even started.

## Why it works this way

The gap that causes most of these bugs is real and unavoidable: there's always a delay between "the user did something" (clicked send, clicked stop) and "the UI reflects that something changed" (input disabled, spinner shown). React doesn't update synchronously with a click handler's first line — state updates batch, and network calls are asynchronous by definition. Any UI logic that assumes "disable the input" and "the user can no longer submit" happen at the same instant is wrong by construction, and that gap is exactly wide enough for a fast typist to hit Enter twice.

## A concrete example (shown)

The naive version disables the input only after the request resolves — leaving a window where a second Enter press fires a second request:

```tsx
// Wrong: the guard depends on state that hasn't updated yet
async function handleSend(text: string) {
  const response = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ text }) });
  setIsGenerating(false); // too late — a second click already slipped through
}
```

The fix uses a synchronous guard that's true the instant the click handler runs, not after any await:

```tsx
const inFlightRef = useRef(false);

async function handleSend(text: string) {
  if (inFlightRef.current) return;      // synchronous — no race window
  inFlightRef.current = true;
  setDraft("");                          // clear input only after the request is confirmed sent
  setIsGenerating(true);

  try {
    await sendMessage(text);
  } catch {
    setDraft(text);                      // restore the draft — the user's words are never silently lost
  } finally {
    inFlightRef.current = false;
    setIsGenerating(false);
  }
}
```

A `useRef` updates synchronously, unlike `useState`, which is what closes the double-submit window a state-only guard leaves open. Note the draft isn't cleared until the send actually goes out, and it's restored on failure — that single line is the fix for "I typed a paragraph, hit send, it failed, and now my paragraph is gone."

## Where it shows up

Scroll jump is the other perennial offender: an assistant bubble streaming in constantly changes the scroll container's height, and a naive `scrollIntoView()` on every token yanks the view down even when the user scrolled up to reread an earlier message. The fix is conditional — only auto-scroll if the user was already at (or near) the bottom before the new content arrived:

```tsx
const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
if (isNearBottom) container.scrollTo({ top: container.scrollHeight });
```

This shows up hardest on mobile, where the soft keyboard opening also resizes the viewport and can trigger the same scroll logic for an unrelated reason — test scroll behavior with the keyboard open, not just on desktop.

## Watch out for

- **Disabling input on response, not on click.** The guard has to be synchronous and set the instant the user acts, not after the network round trip that action triggers — otherwise the disabled window opens too late to prevent the exact click it's meant to prevent.
- **Auto-scrolling unconditionally on every token.** A user who scrolled up to reread something gets yanked back down mid-read by their own assistant's reply — check "was I already at the bottom" before each scroll, not after.
- **Clearing the draft before the send is confirmed.** If the input field empties the instant Enter is pressed, a failed request loses the user's words with no way to recover them — hold the draft until you know the send worked, or restore it on failure.

## Where next

These are the same failure surfaces a Stop button and a Regenerate button have to survive without reopening — worked through end to end, including what happens to a half-rendered code block, in [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render).

**Related:** [Designing Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/designing-chat-ux), [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react), [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render), [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals)
