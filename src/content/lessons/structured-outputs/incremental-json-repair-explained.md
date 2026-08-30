---
title: "Repairing Partial and Streamed JSON"
track: "structured-outputs"
status: live
summary: "Why an incomplete stream snapshot and a genuinely malformed response need the same tolerant parser but a different mindset."
duration: "6 min read"
---

A truncated response and a mid-stream snapshot can look byte-for-byte identical — both are JSON that stops before a closing brace. Only one of them is actually broken.

## What it is

[Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair) covers the mechanics of turning `{"items": [{"name": "wid` into something parseable. This lesson is about a distinction that changes how you should feel about that input in the first place: is this text *malformed* — the model is done generating and what it produced simply isn't valid — or is it *incomplete by design* — the model is still generating, and you're looking at a correct prefix of a response that hasn't finished yet?

Both cases produce a string a standard parser rejects. Only the first one is actually a failure. The second is just what "in progress" looks like, and treating it as an error is a category mistake.

## The mental model

A **tolerant parser** is a parser built for the second case: given an incomplete-but-correct-so-far buffer, it provisionally closes whatever's still open — an unterminated string, an unclosed array, an unclosed object — and returns the best object it can construct from what's actually there. "Provisionally" is the operative word: the parser isn't claiming this is the final answer, only that it's the best guess available at this instant, and the last thing it touched (usually the array or object element currently being written) should be treated as tentative, not settled.

This is a genuinely different job from *repairing* malformed output. Repairing a broken response is a one-time cleanup you run once, on a response the model has already finished producing, when you've concluded something actually went wrong. Tolerant parsing runs continuously, dozens or hundreds of times, on a buffer that's growing in real time, and it's not diagnosing a failure at all — it's giving you an early read on an in-progress success.

## Why it works this way

The mechanism underneath both cases is identical — track what's open, close it provisionally — because from the parser's point of view "streaming" and "truncated" produce the exact same shape of incomplete text. The only real difference is *what you do with the result*. A truncated response you'd validate and possibly drop the final ragged element from; a streaming snapshot you'd render and then keep waiting for more of.

Getting this "closing" step right requires knowing exactly where you are in the buffer — inside a string, mid-escape-sequence, between array elements — not just counting braces. A naive bracket-counter breaks the moment a `{` or `}` shows up *inside* a string value, because it has no notion of "inside a string" at all. [The Partial-Parse State Machine](/learn/structured-outputs/partial-parse-state-machine-deep-dive) works through exactly what tracking that requires and where it gets genuinely tricky.

## A concrete example

The same growing buffer, tolerant-parsed at three points during a stream:

```text
t1:  {"name": "Widget", "tags": ["sm

     provisional value: {"name": "Widget", "tags": []}
     -- the open string "sm is dropped entirely, not guessed at;
        an incomplete string element isn't safe to half-complete

t2:  {"name": "Widget", "tags": ["small", "clearance

     provisional value: {"name": "Widget", "tags": ["small"]}
     -- "clearance is still open, so it's excluded the same way

t3:  {"name": "Widget", "tags": ["small", "clearance"], "price": 12.9

     provisional value: {"name": "Widget", "tags": ["small", "clearance"], "price": 12.9}
     -- price is a number mid-write; whether to include a dangling
        numeric prefix like this is a judgment call your parser makes
        explicitly, not an accident of how the bracket-closer works
```

At no point does this raise an exception. At no point is the object "wrong" — it's exactly as complete as the buffer justifies, which is the whole point.

## Where it shows up

Every place output is consumed before it's finished: chat UIs rendering a card as fields fill in, an agent surfacing a tool call's arguments as they're generated, a progress list rendering array elements one at a time. [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model) covers the full lifecycle this feeds into, and [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example) builds one all the way to a UI.

## Watch out for

**Treating a tolerant parse as validated.** A provisional object exists purely to render or reason about early — it should never be the input to your schema validator. Required fields that simply haven't streamed in yet will fail every time, for a reason that has nothing to do with correctness. Validate only once the stream reports completion, against the full text, as [Streaming Structured Output](/learn/structured-outputs/streaming-structured-output) lays out.

**Counting braces without tracking string context.** A `{` character sitting inside a string value (an address field containing `"{unit 4}"`, say) is not a structural open, and closing against it will produce a wrong structure, not just a warning.

**Re-scanning the whole buffer from character zero on every new chunk.** It works, but it's quadratic over a long stream — the cost of each parse grows with everything that's arrived so far, not just what's new. Carrying incremental state forward (what [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough) does) avoids paying that cost repeatedly.

## Where next

[Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough) codes the whole thing, and [The Partial-Parse State Machine](/learn/structured-outputs/partial-parse-state-machine-deep-dive) covers the edge cases — a brace inside a string, a half-written unicode escape — that break a naive version of this.

**Related:** [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair), [Streaming Structured Output](/learn/structured-outputs/streaming-structured-output), [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough), [The Partial-Parse State Machine](/learn/structured-outputs/partial-parse-state-machine-deep-dive), [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model)
