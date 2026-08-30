---
title: "Implementing a Minimal Prompt Template Engine"
track: "prompt-engineering"
status: live
summary: "About 30 lines of Python that render a prompt from a template and a variables dict, and refuse to run when a slot is missing."
duration: "6 min read"
---

A production prompt template doesn't need Jinja's full feature set. It needs two things: a way to find out what slots a template requires, and a way to fail loudly, before the call goes out, when one is missing.

## What we're building

A tiny renderer for the `{{slot}}` syntax from [templates and variable slots](/learn/prompt-engineering/prompt-templates-and-variable-slots) — a `required_slots()` helper that inspects a template string, and a `render()` function that fills it in or raises a clear error. No external dependencies; the whole thing is regex and a dict.

## Setup

Standard library only — `re` for pattern matching. This is deliberately smaller than a real template library like Jinja2; the point is seeing the mechanism, not replacing a battle-tested tool for a project that's grown past this.

## Build it

### Step 1: Pick a slot syntax and detect required slots

```python
import re

TOKEN = re.compile(r"\{\{\s*(\w+)\s*\}\}")

def required_slots(template: str) -> set[str]:
    return set(TOKEN.findall(template))
```

> **Why this step?** `required_slots()` exists so you can ask "what does this template need?" without rendering it — useful for validating a caller's variables dict up front, and for documentation that can't silently go stale, since it's derived from the template itself rather than hand-maintained.

### Step 2: Render by substituting each slot

```python
class MissingVariableError(Exception):
    pass

def render(template: str, variables: dict) -> str:
    missing = required_slots(template) - variables.keys()
    if missing:
        raise MissingVariableError(f"missing slots: {sorted(missing)}")

    def substitute(match: re.Match) -> str:
        value = variables[match.group(1)]
        if isinstance(value, list):
            return "\n".join(f"- {item}" for item in value)
        return str(value)

    return TOKEN.sub(substitute, template)
```

> **Why this step?** The missing-slot check runs before any substitution happens — a template with three slots and two filled variables fails immediately with the name of what's missing, rather than rendering a prompt with a literal `{{max_words}}` still sitting in it and sending that to the model. List values get joined into bullet lines automatically, since that's the common case for a slot like a batch of reviews.

### Step 3: Confirm the failure happens where you want it

```python
review_template = """You are summarizing customer reviews for {{product}} \
for an internal product dashboard.

Write a summary in {{max_words}} words or fewer covering the dominant \
positive theme and the dominant negative theme, if any.

<reviews>
{{reviews}}
</reviews>"""

incomplete_vars = {
    "product": "Acme Widget Pro",
    "reviews": ["Great battery life.", "App crashes weekly."],
    # max_words is missing
}

try:
    render(review_template, incomplete_vars)
except MissingVariableError as e:
    print(f"refused to send: {e}")
```

> **Why this step?** This is the entire point of building the check in — the error surfaces in your own code, with a variable name attached, before a single token reaches the API. Without it, the model would receive a prompt containing a literal `{{max_words}}` and either ignore it, ask a clarifying question, or invent a word limit of its own — three different failure modes, none of which tell you what actually went wrong.

## Run it

With every slot filled:

```python
full_vars = {
    "product": "Acme Widget Pro",
    "reviews": ["Great battery life.", "App crashes weekly."],
    "max_words": 40,
}

print(render(review_template, full_vars))
```

```text
You are summarizing customer reviews for Acme Widget Pro for an
internal product dashboard.

Write a summary in 40 words or fewer covering the dominant positive
theme and the dominant negative theme, if any.

<reviews>
- Great battery life.
- App crashes weekly.
</reviews>
```

And `required_slots(review_template)` returns `{"product", "reviews", "max_words"}` — the same three slots documented in the [previous lesson](/learn/prompt-engineering/prompt-templates-and-variable-slots)'s table, now derived automatically instead of hand-maintained.

## Harden it

- **Check types, not just presence.** `required_slots` catches a missing `reviews` key; it won't catch `reviews` being a single string instead of a list. A stricter version would accept a small schema alongside the template and validate shape, not just existence.
- **Watch what's inside the values, not just the template.** This engine substitutes whatever a value contains verbatim — including brace-like text, or something that reads as an instruction. That's a different problem from the one this lesson solves, and it's the entire subject of [escaping user content in templates](/learn/prompt-engineering/escaping-user-content-in-templates), which picks up exactly here.
- **Precompute `required_slots` once per template**, not on every render call, if you're rendering the same template thousands of times in a batch job — the regex scan is cheap once, wasteful ten thousand times over.

## Extend it

A real prompt library adds versioning (which template revision produced this exact output), a small typed schema per slot instead of a bare set of names, and hooks into [the validation and repair loop](/learn/prompt-engineering/validation-and-repair-loop) on the output side, mirroring the checks this lesson puts on the input side. If you're assembling a whole library of these, [the prompt library capstone](/learn/prompt-engineering/prompt-library-capstone-project) is where all of it — templates, checkers, and eval cases — comes together as one maintained asset instead of a folder of strings.

**Related:** [Templates: Separating the Stable Prompt From the Variable Input](/learn/prompt-engineering/prompt-templates-and-variable-slots), [Escaping User Content in Templates](/learn/prompt-engineering/escaping-user-content-in-templates), [Validation and Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Prompt Library Capstone](/learn/prompt-engineering/prompt-library-capstone-project)
