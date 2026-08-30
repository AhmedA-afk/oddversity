---
title: "Writing Machine-Checkable Acceptance Criteria"
track: "prompt-engineering"
status: live
summary: "Converting three vague quality goals into criteria phrased so a script -- not a person rereading the output -- can verify them."
duration: "7 min read"
---

"Make sure it sounds professional" cannot be checked by a script. "Contains zero second-person pronouns" can. This lesson builds a tiny checker library for exactly that conversion — vague goal in, pass/fail function out.

## What we're building

Three vague quality goals, rewritten as [acceptance criteria](/learn/prompt-engineering/task-framing-intent-constraints-criteria) phrased so a piece of code can verify them, plus one small Python checker per criterion. The checkers are deliberately simple — the point isn't clever validation logic, it's the habit of writing criteria in a form that has a checker at all.

| Vague goal | Checkable criterion |
|---|---|
| "Return well-formatted JSON" | Output parses as JSON and contains the keys `summary` and `confidence` |
| "Keep it short" | Exactly 3 bullet points, each 15 words or fewer |
| "Sound professional, not chatty" | Output contains no second-person pronoun (`you`, `your`, `you're`, `yours`) |

## Setup

Nothing beyond the Python standard library — `json` for parsing, `re` for pattern matching. Each checker takes the model's raw output string and returns `(passed, reason)`, so a failure always comes with a human-readable explanation of what broke, not just a boolean.

## Build it

### Step 1: Write the criteria into the prompt itself

The prompt should state these in the same checkable language the checkers will verify, not a looser paraphrase of it:

```text
<output_format>
Return only valid JSON with exactly two keys: "summary" and
"confidence".
</output_format>

<constraints>
- Exactly 3 bullet points inside the "summary" field's text,
  each 15 words or fewer.
- Do not address the reader directly -- no "you," "your," or
  "you're" anywhere in the output.
</constraints>
```

> **Why this step?** A checker can only verify what the prompt actually asked for. If the prompt says "keep it brief" but the checker enforces "exactly 3 bullets, 15 words each," you've written a stricter test than the model was ever told to pass — the prompt and the checker have to describe the same rule.

### Step 2: One checker function per criterion

```python
import json
import re

def check_valid_json(output: str, required_keys: list[str]) -> tuple[bool, str]:
    try:
        data = json.loads(output)
    except json.JSONDecodeError as e:
        return False, f"not valid JSON: {e}"
    missing = [k for k in required_keys if k not in data]
    if missing:
        return False, f"missing keys: {missing}"
    return True, "ok"

def check_bullet_count(text: str, expected: int, max_words: int) -> tuple[bool, str]:
    bullets = [line for line in text.splitlines() if line.strip().startswith("-")]
    if len(bullets) != expected:
        return False, f"expected {expected} bullets, found {len(bullets)}"
    for b in bullets:
        word_count = len(b.strip("- ").split())
        if word_count > max_words:
            return False, f"bullet exceeds {max_words} words: '{b.strip()}'"
    return True, "ok"

def check_no_second_person(text: str) -> tuple[bool, str]:
    pattern = re.compile(r"\b(you|your|you're|yours)\b", re.IGNORECASE)
    hits = pattern.findall(text)
    if hits:
        return False, f"found second-person words: {hits}"
    return True, "ok"
```

> **Why this step?** Each function checks exactly one thing and returns a reason string, not just `True`/`False`. When a check fails during real testing, "found second-person words: ['your']" tells you what to fix; a bare `False` sends you back to rereading the whole output by eye — the thing this entire exercise was meant to replace.

### Step 3: Run every checker against one output

```python
def run_checks(raw_output: str) -> list[tuple[str, bool, str]]:
    results = []
    ok, reason = check_valid_json(raw_output, required_keys=["summary", "confidence"])
    results.append(("valid_json", ok, reason))
    if ok:
        data = json.loads(raw_output)
        ok, reason = check_bullet_count(data["summary"], expected=3, max_words=15)
        results.append(("bullet_count", ok, reason))
        ok, reason = check_no_second_person(data["summary"])
        results.append(("no_second_person", ok, reason))
    return results
```

> **Why this step?** The checks are ordered so a JSON parse failure short-circuits the rest — there's no point checking bullet count on a `summary` field that doesn't exist yet. This mirrors how a real eval loop should behave: fail fast on the structural criterion before spending effort on content criteria.

## Run it

Against a model output that came back with four bullets instead of three:

```python
raw_output = '''{"summary": "- Revenue grew.\\n- Costs held flat.\\n- Margin improved.\\n- Outlook is positive.", "confidence": 0.8}'''

for name, passed, reason in run_checks(raw_output):
    print(f"{name}: {'PASS' if passed else 'FAIL'} -- {reason}")
```

```text
valid_json: PASS -- ok
bullet_count: FAIL -- expected 3 bullets, found 4
no_second_person: PASS -- ok
```

Two criteria passed silently; the one that failed says exactly why, with the actual count — enough to decide, without rereading the output, whether the fix belongs in the prompt (tighten the instruction) or in the checker (was 3 ever really the right number).

## Harden it

- **Guard against non-string or empty input.** A `None` or empty output should fail every check with a clear reason ("empty output"), not raise an exception that kills the whole eval run.
- **Normalize before counting.** Trim trailing whitespace and collapse repeated blank lines before counting bullets — a model that adds a stray blank line between bullets shouldn't fail a check that has nothing to do with spacing.
- **Know what the regex won't catch.** `check_no_second_person` matches whole words, so it won't flag "yourself" — decide whether that's intentional or extend the pattern. Machine-checkable does not mean bulletproof; it means the rule is precise enough that you can see exactly what it does and doesn't cover.
- **Keep the criterion text and the checker in the same place.** If the prompt says "15 words or fewer" and the checker says `max_words=20`, one of them is wrong and nothing will tell you which until a human notices the gap. Treat a criterion and its checker as one unit that changes together, the same discipline [prompt templates](/learn/prompt-engineering/prompt-templates-and-variable-slots) applies to a template and its slots.

## Extend it

These functions aren't just for one-off debugging — they're the rubric functions [evaluating prompts before you ship them](/learn/prompt-engineering/prompt-evaluation-basics) asks you to build anyway, reused instead of rewritten. Run them over your whole test set every time the prompt changes, not just on the one output you're staring at. When a check legitimately fails on a good-faith output — valid content that happens to violate the JSON contract — that's exactly the case [the validation-and-repair loop](/learn/prompt-engineering/validation-and-repair-loop) exists for: retry with the failure reason fed back in, rather than discarding the call outright.

**Related:** [Task Framing: Intent, Constraints, Acceptance Criteria](/learn/prompt-engineering/task-framing-intent-constraints-criteria), [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics), [Validation and Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [JSON Schema in Prompts](/learn/prompt-engineering/json-schema-in-prompts), [Structured Output](/learn/prompt-engineering/structured-output)
