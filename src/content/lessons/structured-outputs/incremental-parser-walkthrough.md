---
title: "Building a Tolerant Incremental Parser"
track: "structured-outputs"
status: live
summary: "A working stateful parser that turns a growing, incomplete JSON buffer into the best valid partial object at every step."
duration: "9 min read"
---

[Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained) describes what a tolerant parser needs to do. This lesson writes one — a class you feed chunks into, that hands back the best-effort object at every point along the way.

## What we're building

A `TolerantParser` with two operations: `feed(chunk)` appends new text to an internal buffer, and `value()` returns the best valid object that buffer currently supports — closing whatever strings, arrays, and objects are still open, and dropping anything mid-write that isn't safely completable yet. We'll run the same `{"name": ..., "tags": [...]}` buffer from the previous lesson through it chunk by chunk and watch the object fill in.

## Setup

Standard library only — `json` and `re`.

## Build it

### Step 1: The scan — track containers, strings, and the last safe delimiter

```python
import json
import re

class TolerantParser:
    def __init__(self):
        self.buffer = ""
        self._last_good: dict = {}

    def feed(self, chunk: str) -> None:
        self.buffer += chunk
```

> **Why this step?** `feed` does nothing but append — all the actual parsing work happens lazily in `value()`, called whenever the caller actually wants a snapshot. That keeps the two concerns separate: accumulating tokens as they arrive, and deciding what's safe to show, are different jobs with different call frequencies.

### Step 2: `value()` — parse the closed candidate, fall back on failure

```python
    def value(self) -> dict:
        candidate = self._close(self.buffer)
        try:
            parsed = json.loads(candidate)
            self._last_good = parsed
            return parsed
        except json.JSONDecodeError:
            # _close isn't provably perfect on every edge case (see The
            # Partial-Parse State Machine) -- if it ever produces something
            # that still doesn't parse, fall back to the last snapshot that
            # did, rather than raising or guessing.
            return self._last_good
```

> **Why this step?** This fallback is the single most important line in the class. A tolerant parser's job is to never surprise its caller with an exception mid-stream — worst case, `value()` returns a slightly stale object instead of a fresh one. That's a far safer failure than crashing a UI mid-render.

### Step 3: `_close` — the actual bracket-and-string closing logic

```python
    _COMPLETE_NUMBER = re.compile(r"-?\d+(\.\d+)?([eE][+-]?\d+)?$")
    _COMPLETE_LITERAL = {"true", "false", "null"}

    def _close(self, s: str) -> str:
        stack, in_string, escape = [], False, False
        last_delim = -1  # index of the last unquoted structural character

        for i, ch in enumerate(s):
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                    last_delim = i  # a closed string is a complete token
                continue
            if ch == '"':
                in_string = True
            elif ch in "{[":
                stack.append(ch); last_delim = i
            elif ch in "}]":
                if stack:
                    stack.pop()
                last_delim = i
            elif ch in ",:":
                last_delim = i

        if in_string:
            # an unterminated string is dropped whole, not half-completed --
            # a partial string is never a safe guess at the real value
            s = s[: last_delim + 1].rstrip().rstrip(",")
        else:
            tail = s[last_delim + 1:].strip()
            if tail and tail not in self._COMPLETE_LITERAL and not self._COMPLETE_NUMBER.match(tail):
                # the trailing token isn't a complete value on its own yet --
                # drop it whole and pick it up complete on a later feed
                s = s[: last_delim + 1].rstrip().rstrip(",")

        s = s.rstrip().rstrip(",").rstrip(":")
        while stack:
            s += "}" if stack.pop() == "{" else "]"
        return s
```

> **Why this step?** `last_delim` is doing the real work — it's the index of the most recent point in the buffer where a complete token unambiguously ended. Everything after it is either a fully closed string/array/object (safe to keep) or a token still being written (checked against the two "already complete" cases — a finished literal or a number that already parses on its own, like `12.9`). Anything that fails both checks — `"tr"`, `"1e"`, a bare `-` — gets cut back to `last_delim`, not guessed at.

## Run it

Feed the buffer from [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained) in three growing chunks and watch `value()` fill in:

```python
p = TolerantParser()

p.feed('{"name": "Widget", "tags": ["sm')
print(p.value())
# {'name': 'Widget', 'tags': []}
# -- "sm is still open, so the whole partial string is dropped

p.feed('all", "clearance')
print(p.value())
# {'name': 'Widget', 'tags': ['small']}
# -- "small" closed cleanly; "clearance is open again, dropped the same way

p.feed('"], "price": 12.9')
print(p.value())
# {'name': 'Widget', 'tags': ['small', 'clearance'], 'price': 12.9}
# -- tags array is fully closed now; price's "12.9" already reads as a
#    complete number on its own, so it's kept as-is rather than dropped
```

Three feeds, three growing snapshots, and the object only ever gains fields and array elements — it never shows something wrong, only something not-yet-there.

### Edge case: a partial literal mid-write

```python
p2 = TolerantParser()
p2.feed('{"tags": ["a", "b", tr')
print(p2.value())
# {'tags': ['a', 'b']}
# -- "tr" is neither a complete literal nor a complete number,
#    so it's dropped whole rather than rendered as a guess
```

The same rule handles a half-written `true`/`false`/`null` exactly like a half-written number: if it doesn't already read as a complete value, it isn't shown yet.

## Harden it

- **This isn't quadratic-safe over a very long stream.** `_close` rescans the entire buffer from the start on every `value()` call, so cost grows with total stream length, not just the newest chunk — fine for a short response, worth fixing (by carrying scan state forward between calls) before pointing this at a very large streamed array. [The Partial-Parse State Machine](/learn/structured-outputs/partial-parse-state-machine-deep-dive) covers the fully incremental version.
- **The dangling-key edge case isn't handled here.** If a buffer ends with a complete key and its colon but nothing after (`..., "active":`), `_close` strips the colon and can leave a bare, invalid `"active"` fragment behind — `value()`'s fallback to `_last_good` catches this gracefully (you just don't see that field yet), but it's a real gap, not a hidden feature. The deep dive works through why a key needs different handling than a value.
- **Rate-limit how often you call `value()`.** Calling it on every single character is wasted work if you're only rendering every 100ms — parse on a timer or on a flush boundary, not on every token.

## Extend it

Wire `value()`'s output into an actual renderer that shows completed array elements and holds back the one still being written — that's exactly what [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example) builds next, including the element-boundary rule that decides when an array item counts as "done" rather than merely present.

**Related:** [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained), [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair), [The Partial-Parse State Machine](/learn/structured-outputs/partial-parse-state-machine-deep-dive), [Streaming Structured Output](/learn/structured-outputs/streaming-structured-output), [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example)
