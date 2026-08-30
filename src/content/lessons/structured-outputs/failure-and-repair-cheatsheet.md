---
title: "Failure-to-Repair Cheatsheet"
track: "structured-outputs"
status: live
summary: "One lookup table from symptom to cause to cheapest fix, plus the snippets and defaults to keep open during an incident."
duration: "6 min read"
---

The runbook version of this module — what to check first when a validated pipeline starts throwing errors, before you have time to re-read the lessons behind it.

## Start here, then measure

1. **Always try the free rung first.** Deterministic fixups (strip prose, close brackets, coerce an obvious digit-string) cost nothing and fix a large share of failures outright. Never open a model call before checking whether one of these already solves it — see [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies).
2. **Default `max_attempts` = 2–3** for any re-ask loop. Start here, then measure your own success-rate-per-attempt curve before raising it — most gains happen on attempt one or two; a fourth attempt rarely earns its cost.
3. **Set `additionalProperties: false` (`extra="forbid"` / `.strict()`) by default.** It turns a silent hallucinated field into a catchable structural error instead of an invisible one.
4. **Log every repair attempt's error type, on success or failure.** A rising repair rate for one schema is the earliest signal something upstream drifted.

## The symptom table

| Symptom | Likely cause | Category | Cheapest fix |
|---|---|---|---|
| Truncated mid-string or mid-array | Hit `max_tokens` | Syntactic | Deterministic bracket-close (rung 1); raise `max_tokens` at the source |
| Wrong type (string where a number belongs) | Model wrote a word-form or quoted a number | Structural | Coerce if it's an unambiguous digit-string (`"5"` → `5`); otherwise re-ask (rung 2) |
| Response wrapped in apologetic prose | Conversational instinct not suppressed by mode/prompt | Prose-leakage | Extract the JSON substring or fenced block first (rung 1); switch to real [JSON mode](/learn/structured-outputs/json-mode-basics) or [tool calling](/learn/structured-outputs/tool-function-schemas) to prevent it at the source |
| Enum value not in the allowed set | Model paraphrased instead of picking literally | Structural | Deterministic synonym remap if known (rung 1); otherwise re-ask with the allowed set restated (rung 2) |
| Extra, unrequested field present | Model added something "helpful" | Structural (if schema forbids extras) or invisible otherwise | Set `additionalProperties: false` so it's catchable; strip deterministically on repair |
| Required field missing | Content genuinely absent upstream, or model dropped it | Structural, sometimes semantic | Re-ask if the source clearly contains the value; **reject** if the source genuinely doesn't — see [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair) |
| Value present but fabricated (phantom ID, invented confidence score) | Semantic — fluent and wrong | Semantic | Not fixable by validation at all; ground or verify against a source of truth downstream |
| Two fields contradict each other (end before start, total ≠ sum of lines) | Semantic, cross-field | Semantic | Reject and route to human review; no schema check catches this alone |

Full definitions for the category column are in [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy); worked diagnoses for the first five rows are in [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures).

## Snippets you'll want mid-incident

**Deterministic bracket-closer** (rung 1, for a syntactic truncation):

```python
def close_open_structures(s: str) -> str:
    stack, in_string, escape = [], False, False
    for ch in s:
        if in_string:
            if escape: escape = False
            elif ch == "\\": escape = True
            elif ch == '"': in_string = False
            continue
        if ch == '"': in_string = True
        elif ch in "{[": stack.append(ch)
        elif ch in "}]" and stack: stack.pop()
    if in_string: s += '"'
    s = s.rstrip().rstrip(",").rstrip(":")
    while stack:
        s += "}" if stack.pop() == "{" else "]"
    return s
```

Full version with number/literal edge cases in [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair) and [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough).

**Prose-strip** (rung 1, for prose-leakage):

```python
import re

def extract_json_substring(text: str) -> str | None:
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        return fenced.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    return text[start:end + 1] if start != -1 and end > start else None
```

## The one-line decision rule

> **Shape problem, real content underneath it → repair.**
> **Missing, self-contradictory, or untrusted content → reject.**

If answering "does fixing this require inventing information that isn't actually there?" comes back yes, stop climbing [the repair ladder](/learn/structured-outputs/auto-repair-strategies) and route to [reject](/learn/structured-outputs/when-not-to-repair) instead — no rung above it changes that answer.

## Repair-loop guardrail checklist

- [ ] Hard `max_attempts` ceiling, no code path bypasses it.
- [ ] Correction prompt rebuilt from the *latest* error every attempt, never cached.
- [ ] Every attempt logged, success or failure, with the specific error type.
- [ ] A circuit breaker trips on a dropping success rate — no retry storms under load.
- [ ] Nothing in the repair path invents a value to make validation pass.

See [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes) for the failure story behind each line.

**Related:** [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy), [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes)
