---
title: "Reliably Extracting the Final Answer After Reasoning"
track: "prompt-engineering"
status: live
summary: "A small, robust parser for pulling a delimited final answer out of a reasoning trace, with a fallback for when the model forgets it."
duration: "7 min read"
---

A reasoning-first prompt is only useful to a pipeline if you can reliably get the answer back out of it. This builds a small parser for that, including what to do when the model doesn't follow the format you asked for.

## What we're building

A function that takes a full chain-of-thought completion and returns a clean final-answer string, using a delimiter convention as the primary path and two fallbacks for when the model doesn't emit it — the exact gap left open in [chain-of-thought on a multi-step problem](/learn/prompt-engineering/cot-on-a-word-problem).

## Setup

The prompt convention: instruct the model to end with an exact literal line.

```text
Solve this step by step. When you're done, end your response with a
line in exactly this form, and nothing after it:
FINAL_ANSWER: <value>
```

## Build it

### Step 1: the primary extraction pattern

```python
import re

FINAL_ANSWER_RE = re.compile(r"FINAL_ANSWER:\s*(.+)", re.IGNORECASE)

def extract_final_answer(reasoning_text: str) -> str:
    """Pull the final answer out of a reasoning trace.

    Primary path: the last 'FINAL_ANSWER: <value>' line. Taking the LAST
    match (not the first) matters -- a model that restates the answer
    mid-trace, then corrects itself, still gets the true answer at the
    end of the transcript.
    """
    matches = FINAL_ANSWER_RE.findall(reasoning_text)
    if matches:
        return matches[-1].strip().rstrip(".")
```

> **Why this step?** `findall` instead of `search` handles the case where the model states a provisional number mid-reasoning and revises it later — a real pattern in longer traces. Taking the last match trusts the model's own most recent statement over an earlier one.

### Step 2: fallbacks for when the model forgets the delimiter

```python
    # Fallback 1: the model forgot the delimiter but still said "the
    # answer is X" or "answer: X" somewhere in its own words.
    loose = re.search(r"answer\s*(?:is|:)\s*(.+)", reasoning_text, re.IGNORECASE)
    if loose:
        return loose.group(1).strip().splitlines()[0].rstrip(".")

    # Fallback 2: no phrasing matched either. Assume a trace that forgot
    # every convention still ends on its conclusion.
    lines = [ln.strip() for ln in reasoning_text.strip().splitlines() if ln.strip()]
    if lines:
        return lines[-1].rstrip(".")

    raise ValueError("no answer found in reasoning text")
```

> **Why this step?** Two fallbacks, in decreasing order of trust. The loose "answer is" pattern still targets a phrase that means the same thing as the delimiter. The last-non-empty-line fallback is a genuine last resort — it assumes a trace that forgot every convention still ends on its conclusion, which is usually true but not guaranteed, so it's worth flagging when this path fires (see Harden it, below).

### Step 3: wire it into a call, with one retry

```python
def ask_with_reasoning(model_call, prompt: str, retries: int = 1) -> str:
    for attempt in range(retries + 1):
        completion = model_call(prompt)
        try:
            return extract_final_answer(completion)
        except ValueError:
            if attempt == retries:
                raise
            prompt += "\n\nYou didn't end with a FINAL_ANSWER: line. Do that now."
    raise AssertionError("unreachable")
```

> **Why this step?** The one case none of the three extraction paths can save you from is a completion with genuinely no conclusion at all — for example truncated mid-trace, the exact failure mode covered in [answer-first vs reasoning-first ordering](/learn/prompt-engineering/answer-first-vs-reasoning-first). A single retry with an explicit nudge is cheap and usually enough; beyond that, surface the failure rather than guessing.

## Run it

```python
trace = """
Morning sales: 3/8 * 144 = 54. Remaining: 144 - 54 = 90.
Baking: 90 + 36 = 126.
Afternoon sales: half of 126 = 63. Remaining: 126 - 63 = 63.
FINAL_ANSWER: 63
"""
print(extract_final_answer(trace))  # -> "63"

no_delimiter_trace = """
Morning sales: 54. Remaining: 90.
Baking: 126.
Afternoon sales: 63 sold, so 63 muffins remain at closing.
"""
print(extract_final_answer(no_delimiter_trace))  # -> "Afternoon sales: 63 sold, so 63 muffins remain at closing"  (fallback grabs the whole last line)
```

The second call shows the fallback's honest limitation: it recovers *something* usable rather than nothing, but it's not a clean scalar. That's the tradeoff of a last-resort path — treat its output as lower-confidence than a clean delimiter match, not equivalent to it.

## Harden it

- **Multiple occurrences:** already handled — `findall` plus `[-1]` takes the model's most recent statement if it revises itself mid-trace.
- **Case and punctuation noise:** `re.IGNORECASE` covers casing; strip Markdown emphasis characters (`**`, `` ` ``) from the extracted value if your model tends to bold or code-format its answer.
- **Track the fallback-path hit rate.** Log which extraction path fired on every call. A rising rate of fallback hits is a direct signal that your delimiter instruction needs reinforcing — often a single worked example showing the exact format fixes it; see [few-shot prompting](/learn/prompt-engineering/few-shot-prompting).
- **Validate the type before trusting it downstream.** If you expect a number, check it: `re.fullmatch(r"-?\d+(\.\d+)?", value)`. Route anything that fails validation to human review instead of silently passing a garbage string further down the pipeline.

## Extend it

For answers with more than one field, don't keep hand-rolling regexes — move to a real [structured-output](/learn/prompt-engineering/structured-output) contract with a [JSON schema](/learn/prompt-engineering/json-schema-in-prompts) and parse JSON instead of a bespoke delimiter line. And note a real limit here: [prefilling the assistant turn](/learn/prompt-engineering/prefill-to-force-json-worked) can force a response to *start* with a given string, which is exactly what you want for answer-first output, but it can't guarantee a delimiter appears at the true *end* of a reasoning-first trace — you can't prefill your way past the ordering tradeoff covered in [answer-first vs reasoning-first ordering](/learn/prompt-engineering/answer-first-vs-reasoning-first).

**Related:** [Structured Output](/learn/prompt-engineering/structured-output), [JSON Schema in Prompts](/learn/prompt-engineering/json-schema-in-prompts), [Answer-First vs Reasoning-First Ordering](/learn/prompt-engineering/answer-first-vs-reasoning-first), [Worked Example: Chain-of-Thought on a Multi-Step Problem](/learn/prompt-engineering/cot-on-a-word-problem), [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting)
