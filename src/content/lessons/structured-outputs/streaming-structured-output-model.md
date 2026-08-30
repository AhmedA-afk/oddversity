---
title: "Consuming Structured Output as It Streams"
track: "structured-outputs"
status: live
summary: "Two tracks for one stream: a provisional one safe to render early, and the one full parse that's ever safe to trust."
duration: "7 min read"
---

A streaming response gives you two different objects over its lifetime, and confusing them is where most streaming UIs get their bugs: a running best-guess you update constantly, and one final, validated answer you compute exactly once.

## What it is

Model the whole consumption lifecycle as two tracks running side by side:

- **The live track** — a [tolerant parser](/learn/structured-outputs/incremental-parser-walkthrough) re-run against the growing buffer, used purely to decide what's safe to render or act on *right now*. It is never authoritative, and it can be revised at any moment as more tokens arrive.
- **The final track** — the one full-text parse and schema validation that runs exactly once, when the provider signals the stream is complete. This is the only object [the validation layer](/learn/structured-outputs/the-validation-layer) ever needs to see, and the only one your code should treat as a contract.

Everything in between — deciding what to show early, detecting when an array element is finished, reconciling the live view with the final one — is about keeping those two tracks from ever getting confused for each other.

## The mental model

Think of the live track as a weather forecast and the final track as the actual weather. A forecast updated every hour is genuinely useful — you plan your day around it — but nobody files the 9am forecast as the permanent record of what happened; the actual observation at day's end is what goes in the log. The live track exists to be useful *now*, at the cost of sometimes being revised. The final track exists to be *correct*, once, and only once it can be.

## Why it works this way

**What's safe to render early** isn't a single rule, it's a spectrum by field mutability. A field like `title` or `status`, once its closing quote has streamed in, cannot retroactively change — generation is append-only, so a closed string is closed for good. Rendering it immediately is safe. The dangerous case is the *currently open* element of an array or object: it looks complete-ish in a tolerant parse, but it is, by definition, still being written. Treat the last element of any still-open array as provisional and withhold it from view, even while every earlier element in that same array is safe to show.

**Detecting a completed array element** follows directly from that: an element counts as done the moment the tolerant parser's scan passes the character immediately after it — ignoring whitespace — and that character is a comma or the array's own closing bracket. Until that character has actually streamed in, the element is still open, no matter how complete its fields look.

```text
[{"id": 1, "label": "invoice"}, {"id": 2, "label": "rec

element 1: complete   -- followed by a comma
element 2: still open -- no comma or ] has arrived yet
```

**Reconciling the final parse** matters because live rendering and schema validation are checking fundamentally different things. The live track only ever asks "is this syntactically closeable" — it has no concept of required fields, enums, or types, because [tolerant parsing skips validation entirely by design](/learn/structured-outputs/incremental-json-repair-explained). So the final full parse can still fail validation even when everything rendered live looked perfectly fine — a `status` field that streamed in as `"resolved-ish"` renders just as confidently as `"resolved"` would have, right up until the real validator sees it. When the stream reports done, discard every provisional assumption, run [the validation layer](/learn/structured-outputs/the-validation-layer) against the complete text exactly once, and treat that result — not anything shown live — as ground truth. If it fails, this is now an ordinary validation failure, handled by [the repair ladder](/learn/structured-outputs/auto-repair-strategies) like any other.

## A concrete example

```python
events = []

for chunk in stream:
    parser.feed(chunk.delta)
    live_view = parser.value()                 # live track: always provisional
    events.append(("live", live_view))
    render_safe_fields(live_view)               # e.g. title, status if closed

# stream reports completion
full_text = parser.buffer
final, errors = try_validate(json.loads(full_text), ResponseSchema)  # final track: runs once

if final is not None:
    commit(final)                               # the only object anything durable sees
else:
    handle_output(full_text, ResponseSchema)     # ordinary repair/reject path
```

Notice `commit` is only ever called with `final`, never with anything pulled from `events`. The live track fed the UI throughout; it never touches anything that writes to a database or triggers an action.

## Where it shows up

Chat UIs rendering a structured card as it's generated, an agent surfacing a tool call's arguments as they stream in for a human to review before execution (see [Tool Schemas](/learn/structured-outputs/tool-function-schemas)), and progress views over a streamed extraction array — built out fully in [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example).

## Watch out for

**Rendering the still-open last element as if it were finished.** This is the single most common streaming-UI bug in this space — a "flash of truncated text" the instant before the element actually closes.

**Skipping final validation because the live view "looked right."** The live track has no schema awareness at all; a value can look perfectly plausible while streaming and still fail validation the moment the real check runs.

**Triggering a real action from the live track.** Anything with a side effect — sending a message, executing a tool, writing a row — waits for the final, validated object. The live track is for display and reasoning about progress, never for decisions with consequences.

## Where next

See both tracks built into a real renderer in [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example), and the mechanics that make the live track possible in [The Partial-Parse State Machine](/learn/structured-outputs/partial-parse-state-machine-deep-dive).

**Related:** [Streaming Structured Output](/learn/structured-outputs/streaming-structured-output), [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained), [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough), [Always Validate at the Boundary](/learn/structured-outputs/the-validation-layer), [Tool Schemas](/learn/structured-outputs/tool-function-schemas)
