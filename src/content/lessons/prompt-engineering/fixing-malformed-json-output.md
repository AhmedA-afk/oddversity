---
title: "Before/After: Taming Malformed JSON"
track: "prompt-engineering"
status: live
summary: "One extraction prompt, run against six tickets twice — with a preamble and trailing commas, then without."
duration: "6 min read"
---

Six tickets, one prompt, two versions. The only thing that changes between them is three sentences about output formatting — and that's the difference between a parser that works most of the time and one that works every time.

## The setup

The task: pull an order ID and issue type out of a short support message.

```text
Extract the order ID and issue type from this support message and return it as JSON.

Message: "{message}"
```

Run it against six real-shaped messages and check whether `json.loads` on the raw completion succeeds.

## Step by step

### The failing batch

| # | Message | Raw output | `json.loads`? |
|---|---|---|---|
| 1 | "Order A1029 arrived damaged" | `Sure, here's the extracted information:\n\n{"order_id": "A1029", "issue": "damaged"}` | Fails — leading prose |
| 2 | "Still no refund for order B2044, it's late" | `{"order_id": "B2044", "issue": "late",}` | Fails — trailing comma |
| 3 | "Order C3091 needs a refund" | `{"order_id": "C3091", "issue": "refund"}` | Passes |
| 4 | "Wrong item sent, order D4177" | ` ```json\n{"order_id": "D4177", "issue": "wrong item"}\n``` ` | Fails — markdown fence |
| 5 | "Order E5088, missing a part" | `{"order_id": "E5088", "issue": "missing part"}` | Passes |
| 6 | "Package for F6199 never arrived" | `Here you go: {"order_id": "F6199", "issue": "never arrived"}` | Fails — leading prose |

Four failures out of six. Every failure is valid *content* wrapped in something a strict JSON parser chokes on — none of them are a wrong order ID or a misread issue. That's the tell that this is a formatting problem, not a comprehension problem.

> **Why this step?** Categorizing each failure (preamble, trailing comma, markdown fence) before fixing anything tells you what the fix actually needs to address. A generic "make it more reliable" prompt tweak fixes whichever failure the author happened to be looking at and leaves the others.

### The fix: delimiters, an explicit rule, and a prefill

```text
Extract the order ID and issue type from the support message below.

Respond with JSON only: {"order_id": "<string>", "issue": "<string>"}
No text before or after the JSON. No markdown code fences. No trailing
comma after the last field.

Message: "{message}"
```

paired with prefilling the assistant turn with `{` (see [Prefilling the Assistant Turn](/learn/prompt-engineering/prefilling-responses)) so there's no room left for "Sure, here's..." to open the response at all.

> **Why this step?** Each clause targets one specific failure seen in the batch: "JSON only... no text before or after" kills the preamble, "no markdown code fences" kills the wrapper, "no trailing comma" kills the syntax error, and the prefill removes the one opening move — a friendly preamble — that no instruction fully suppresses on its own. This is the same principle as [rewriting a negative instruction into a positive one](/learn/prompt-engineering/negative-instructions-pitfall): each rule names the exact bad pattern that showed up, rather than a vague "format it well."

### Re-running the same batch

| # | Output | `json.loads`? |
|---|---|---|
| 1 | `{"order_id": "A1029", "issue": "damaged"}` | Passes |
| 2 | `{"order_id": "B2044", "issue": "late"}` | Passes |
| 3 | `{"order_id": "C3091", "issue": "refund"}` | Passes |
| 4 | `{"order_id": "D4177", "issue": "wrong item"}` | Passes |
| 5 | `{"order_id": "E5088", "issue": "missing part"}` | Passes |
| 6 | `{"order_id": "F6199", "issue": "never arrived"}` | Passes |

Six for six. The parse-failure rate on this batch went from 4/6 to 0/6, and every fix was formatting — the content the model extracted was already correct in every one of the four failing rows, it just needed to be reachable by a parser. Checking a batch like this before and after a prompt change is the smallest possible version of [evaluating a prompt before you ship it](/learn/prompt-engineering/prompt-evaluation-basics).

## Where it breaks (and the fix)

Run the fixed prompt against a few hundred more tickets and you'll likely still see an occasional markdown fence slip back in — instructions reduce a behavior, they don't guarantee its absence, especially under a long or unusual input. Two more sentences of prompt rarely close the last gap; a cheap defensive strip in code does:

```python
import re

def clean_json_text(raw: str) -> str:
    # strip a leading/trailing ```json ... ``` fence if the model added one anyway
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
```

Run every completion through this before `json.loads`, regardless of how well-specified the prompt is — it's a one-line safety net, not a substitute for the prompt fix, and it won't help with a preamble the fence-stripping regex doesn't match.

## Takeaways

- Prose preambles, trailing commas, and markdown fences are formatting failures, not comprehension failures — check that distinction before rewriting the whole prompt.
- Each rule in the fix targets one specific failure pattern actually observed in the batch, not a general "be careful with formatting."
- Prefilling the opening token removes the one failure mode instructions alone don't fully close.
- Even a well-specified prompt still benefits from a cheap defensive parse step, because "usually" and "always" are different guarantees — and when a batch still won't reach 100%, that's the case for a real [validate-and-repair loop](/learn/prompt-engineering/validation-and-repair-loop) instead of more prompt tweaking.

**Related:** [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Prefilling the Assistant Turn](/learn/prompt-engineering/prefilling-responses), [Why 'Don't Do X' Backfires](/learn/prompt-engineering/negative-instructions-pitfall), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics)
