---
title: "Rendering Results as They Stream"
track: "structured-outputs"
status: live
summary: "Stream an array of extraction results and render each card the instant its element is confirmed complete, not a token before."
duration: "8 min read"
---

A document-extraction endpoint streams `{"results": [{"id", "label", "confidence"}, ...]}` back one token at a time, and the UI is supposed to render a card per result the moment it's ready. "The moment it's ready" turns out to need a precise definition, or you get a flash of half-written cards on every single element.

## The setup

The model streams a growing text buffer. On every chunk, the UI needs to answer two separate questions: what does the data look like right now (the [tolerant parse](/learn/structured-outputs/incremental-parser-walkthrough)), and how many of those array elements are actually safe to show (the [element-boundary rule](/learn/structured-outputs/streaming-structured-output-model) — an element counts as done only once the character right after it, ignoring whitespace, is a comma or the array's own closing bracket).

Those two questions need two different pieces of code. The tolerant parser answers the first. This function answers the second, scanning the raw buffer directly for confirmed boundaries rather than trusting the parser's synthetic closing brackets:

```python
def confirmed_element_count(buffer: str, array_key: str) -> int:
    marker = f'"{array_key}": ['
    start = buffer.find(marker)
    if start == -1:
        return 0
    body = buffer[start + len(marker):]

    depth, in_string, escape = 0, False, False
    count, awaiting_confirmation = 0, False

    for ch in body:
        if in_string:
            if escape: escape = False
            elif ch == "\\": escape = True
            elif ch == '"': in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch in "{[":
            depth += 1
        elif ch in "}]":
            if depth == 0:
                if awaiting_confirmation:
                    count += 1   # the array's own ']' confirms the last element too
                break
            depth -= 1
            if depth == 0:
                awaiting_confirmation = True   # just closed one element object
        elif ch == "," and depth == 0 and awaiting_confirmation:
            count += 1
            awaiting_confirmation = False
    return count
```

An element closing its own `}` isn't enough on its own — `awaiting_confirmation` only turns into an actual count once a real comma or the array's real `]` shows up right after it in the stream.

## Step by step

### t1 — mid-way through the first element

```text
buffer: {"results": [{"id": 1, "label": "invoice", "conf

tolerant parse:      {"results": [{"id": 1, "label": "invoice"}]}
confirmed_element_count: 0
rendered list:        []   (first card still shown as loading)
```

The tolerant parser already has `id` and `label` for element 0, but `confirmed_element_count` correctly reports zero — nothing has closed yet, so nothing renders.

### t2 — first element closed, second element opening

```text
buffer: {"results": [{"id": 1, "label": "invoice", "confidence": 0.92}, {"id": 2, "label": "rec

tolerant parse:      {"results": [{"id": 1, "label": "invoice", "confidence": 0.92}, {"id": 2}]}
confirmed_element_count: 1
rendered list:        [ {id: 1, label: "invoice", confidence: 0.92} ]
```

The tolerant parse already shows a second array entry — `{"id": 2}` — but `confirmed_element_count` still returns 1, because no comma or `]` has arrived after element 1's own `}` yet. The rendered list takes only the first `confirmed_element_count` entries from the tolerant parse, discarding anything past that boundary regardless of how complete it looks.

### t3 — stream complete

```text
buffer: {"results": [{"id": 1, "label": "invoice", "confidence": 0.92}, {"id": 2, "label": "receipt", "confidence": 0.81}]}

tolerant parse:      full object, both elements
confirmed_element_count: 2
rendered list:        [ {id: 1, ...}, {id: 2, label: "receipt", confidence: 0.81} ]
```

Both elements confirmed, both rendered. This is also the point where [the final track](/learn/structured-outputs/streaming-structured-output-model) takes over — a real schema validation runs against the complete text here, once, and its result (not anything from the rendered list above) is what anything durable acts on.

## Where it breaks (and the fix)

The naive version of this UI skips `confirmed_element_count` entirely and just renders `parser.value()["results"]` directly on every chunk. Watch what happens at t2 under that version: the tolerant parse already contains `{"id": 2}` as a second array entry, so a naive renderer draws a second card immediately — with a visible `id`, no `label`, and no `confidence` — and then, a few tokens later, that same card silently gains a label and a confidence value. To a user, that reads as a flash of a broken card correcting itself, which is worse than a plain loading spinner would have been.

```python
# naive -- flashes an incomplete card at t2
render(parser.value()["results"])

# fixed -- only ever renders confirmed elements
confirmed = confirmed_element_count(parser.buffer, "results")
render(parser.value()["results"][:confirmed])
```

A common shortcut you'll see in the wild is "just always hold back the last element of the array while streaming" — render `results[:-1]` unconditionally until the stream reports done. It's simpler code and works fine when the array is the last thing the model writes, but it's an approximation: it assumes the *currently last* parsed element is always the one still being written, which breaks the moment there's a field after the array in the schema, or you want to know exactly how many elements are truly confirmed rather than just "all but one." `confirmed_element_count` gives you the precise answer instead of a rule of thumb.

## Takeaways

- Two different questions need two different tools: a tolerant parser tells you what the data currently looks like; a boundary check tells you how much of it is safe to commit to a render. Conflating them is what produces the flash-of-truncated-card bug.
- The pattern generalizes past this one schema — any array-shaped streamed field benefits from confirming elements against the raw stream rather than the parser's synthetic closing brackets, which will always look one step more "done" than the real data actually is.
- The rendered list, at every point during the stream, is a UI convenience only. The one moment its contents are ever trusted for a real decision is after the stream ends and [the final full parse and validation](/learn/structured-outputs/the-validation-layer) has run — nothing here replaces that step.

**Related:** [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model), [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough), [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained), [Streaming Structured Output](/learn/structured-outputs/streaming-structured-output), [Always Validate at the Boundary](/learn/structured-outputs/the-validation-layer)
