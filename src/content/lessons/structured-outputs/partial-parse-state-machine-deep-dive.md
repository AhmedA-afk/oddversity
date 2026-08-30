---
title: "The Partial-Parse State Machine"
track: "structured-outputs"
status: live
summary: "The exact state a tolerant parser must track to close partial JSON correctly, and the edge cases that break naive brace-counting."
duration: "10 min read"
---

This is the deferred rigor behind every earlier claim in this module that a tolerant parser "just closes what's open." You don't need any of this to use a partial-JSON library successfully — only to build one, or to figure out exactly why one just produced a wrong answer on your specific input. Optional depth; skip it until you need it.

## The states, precisely

A correct partial-JSON scanner is tracking more than "am I inside a string." It needs, at minimum:

| State | What it means | What advances it |
|---|---|---|
| `Default` | Between values, inside a container, or at the top level | Any structural character or the start of a value |
| `InString` | Inside an open `"..."`, not mid-escape | Any character except `"` or `\` |
| `InStringEscape` | Just consumed a `\` inside a string | Exactly one more character: `"`, `\`, `/`, `b`, `f`, `n`, `r`, `t`, or `u` |
| `InUnicodeEscape(n)` | Consumed `\u` plus `n` of the 4 required hex digits (`n` = 0..3) | One hex digit at a time, advancing `n` |
| `InNumber(sub)` | Mid-number, at a specific sub-position: sign, int digits, decimal point, fraction digits, exponent marker, exponent sign, exponent digits | The next character in a legal number grammar |
| `InLiteral(prefix)` | Mid-`true` / `false` / `null`, holding exactly which prefix has matched so far | The next character, if it still matches some literal |

Alongside the state, the scanner carries a **container stack** (each entry is `{` or `[`), and for every `{` on that stack, one bit of extra information: whether the object is currently expecting a **key** or a **value**. That bit is what the walkthrough's simpler version left out, and it's exactly what the next section needs.

## Where naive brace-counting breaks

A brace-counter that just increments on `{`/`[` and decrements on `}`/`]`, with no string-awareness at all, breaks on the first string containing a literal brace character:

```json
{"address": "{unit 4}", "city": "Springfield"
```

A naive counter sees the `{` inside `"{unit 4}"` as a real container open and the following `}` as a close, and its depth tracking is now off for the rest of the buffer — every subsequent close looks one level too shallow. `InString` exists specifically to make every character inside a string invisible to the container stack, no matter what it looks like.

Escaping breaks a *slightly* less naive version that does track `InString` but forgets `InStringEscape`:

```json
{"note": "she said \"go\"", "id": 4
```

Without escape-tracking, the `\"` before `go` reads as the string's real closing quote. Everything after it — `go\"` — is now parsed as if it were outside the string, and `, "id": 4` looks like it's still part of a string that was actually already closed for good three characters earlier. `InStringEscape` is a one-character detour specifically so that the character right after a backslash never gets to end the string, no matter what it is.

## The half-written unicode escape

This is the case that breaks an otherwise-careful implementation. A buffer can end mid-way through a `\uXXXX` escape sequence:

```text
"caf\u00
```

The naive fix — "we're in a string, so just append a closing quote" — produces:

```json
"caf\u00"
```

This is still invalid JSON. `\u` promises exactly four hex digits will follow; two isn't an option, and a parser that doesn't reject this string is being more lenient than the spec allows. The correct repair isn't "close the string," it's "truncate back to before the `\u` sequence began, *then* close the string" — `InUnicodeEscape(n)` exists so the scanner knows precisely where that rollback point is, because it's tracking exactly how many of the four digits actually arrived.

## The many ways a number can be incomplete

A number isn't binary-complete-or-not; JSON's number grammar has several sub-positions, and only some of them are legal stopping points:

```text
legal to stop:    42          (int digits)
                  42.5        (frac digits)
                  42.5e10     (exp digits)

illegal to stop:  -           (sign only, no digits yet)
                  42.         (decimal point, no frac digit yet)
                  42e         (exponent marker, no exp digit yet)
                  42e+        (exponent sign, no exp digit yet)
```

`InNumber(sub)` tracks which of these sub-positions the scanner is currently in. The rule for "is this number safe to keep as-is" reduces to one check: is the current sub-position one of the three digit-accepting states (int, frac, or exp digits) with at least one digit already consumed? If yes, the number the buffer has so far already parses as a complete, legal JSON number on its own — keep it untouched. If no — a bare sign, a trailing dot, a trailing exponent marker — truncate the whole number back to the end of the last legal sub-position, or drop it entirely if it never reached one.

## Partial literals: never assume the ending

A buffer ending in `tru` is unambiguously heading toward `true` — no other JSON literal starts that way. It's tempting to complete it early. Don't: the discipline this whole state machine exists to enforce is "never output a value you haven't actually seen finish," and a literal is no exception just because its continuation happens to be predictable. `InLiteral(prefix)` tracks the matched prefix and nothing more; the value only becomes real the instant the full literal — all four, five, or four characters of it — has actually streamed in.

## The key-vs-value ambiguity

This is the sharpest edge naive implementations miss, and it's why the container stack needs that extra "expecting key or value" bit per object. An open, unterminated string inside an object means two structurally different things depending on which side of a `:` you're on:

```text
Case A (expecting a key):    {"id": 1, "sta
Case B (expecting a value):  {"id": 1, "status": "pe
```

In **Case A**, the open string is a key with no colon or value anywhere near it yet. There is nothing safe to salvage from it — roll the object back to its last complete `key: value` pair, dropping the dangling key attempt entirely.

In **Case B**, the key `"status"` and its colon are already complete; it's the *value* that's unterminated. Naively closing just the value's string (`"pe"`) would produce `{"id": 1, "status": "pe"}` — syntactically valid, but silently wrong, since `"pe"` was never a value the model actually finished writing. The safer choice mirrors Case A: drop the value attempt *and* roll back past the key and its colon, since a half-written value isn't meaningfully different from a half-written key — neither is a real, finished piece of data yet.

The practical rule: **track whether each open object is expecting a key or a value, and on an unterminated string in either position, roll back to the last complete `key: value` pair** — never patch a dangling key or a dangling value in place. This is exactly the gap flagged as unhandled in the simplified parser from [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough); the fix is this one extra bit of state per open object, checked before deciding what to roll back.

## Tradeoffs: build it or use a library

A hand-rolled scanner with every state above is precise on exactly the inputs you've thought to test, and silently wrong on the ones you haven't — unicode escapes and the key/value distinction are the two most commonly missed. A maintained library (`json-repair`, `partial-json`, `best-effort-json-parser`) has already hit these edge cases against far more real traffic than any one team's test suite will. Default to the library, the same guidance [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair) gives for one-shot repair. Reach for building your own only when you're debugging a library's specific wrong output against a captured buffer — at which point you now have the exact state names to look for in its source — or when you're the one building the library.

**Related:** [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained), [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough), [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair), [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model), [Streaming Structured Output](/learn/structured-outputs/streaming-structured-output)
