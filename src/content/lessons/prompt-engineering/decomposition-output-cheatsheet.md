---
title: "Decomposition and Structured-Output Cheatsheet"
track: "prompt-engineering"
status: live
summary: "Split on distinct sub-tasks, keep stages testable, specify exact schemas, prefill, validate then repair once, pass structured state."
duration: "6 min read"
---

You already have the theory from the rest of this module — this page skips it and gives you the working defaults, the decision lines, and the snippets you'd actually copy.

## Start here, then measure

1. **Default to one call.** Add a stage only when [a specific signal](/learn/prompt-engineering/when-to-split-a-prompt) is present — not because the task feels complex.
2. **When you do split, split on rubric, not on verb.** "Read, identify parties, identify terms, identify liability" is one extraction job repeated four times, not four jobs — see [Over-Decomposition](/learn/prompt-engineering/over-decomposition).
3. **Write the schema before the prompt.** Keys, types, enums, nullability — decide it as code first, then describe that exact shape in prose. See [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts).
4. **Prefill the opening token** (`{` for an object) and drop temperature to 0 for the shape, even though content still varies. See [Prefilling the Assistant Turn](/learn/prompt-engineering/prefilling-responses).
5. **Validate against the schema, not just `json.loads`.** Syntax-valid and contract-valid are different checks — see [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts).
6. **On failure, repair once with the exact error, then fail loudly.** Not a retry loop with no cap — see [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop).
7. **Forward structured fields between stages, not raw prose.** Design backward from the next stage's prompt template — see [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages).
8. **Re-benchmark the split against a single call** on a real eval before you trust it earned its keep — see [Pipeline vs. Single Call](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs) and [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics).

## Split vs. keep whole — the one-line test

**If you can name two different rubrics you'd grade the output against, split. If you can only name one rubric no matter how long the prompt is, keep it whole.** A long single-rubric prompt (a detailed scoring guide for one classification) doesn't need a pipeline; a short prompt asking for a classification *and* a warm reply does, because "did it classify right" and "did it sound good" are graded on nothing alike. See [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt) for the full signal list, and [One Prompt, One Job](/learn/prompt-engineering/one-prompt-one-job-intuition) for why narrow scope beats a longer instruction list even when the long version isn't wrong yet.

## Symptom → fix

| Symptom | Likely cause | Fix |
|---|---|---|
| Output format (JSON vs. prose vs. mixed) varies run to run | Prompt is doing two jobs with different natural registers in one pass | Split into two calls with separate output contracts — [When to Split](/learn/prompt-engineering/when-to-split-a-prompt) |
| A bug shows up but you can't tell which part of a long prompt caused it | Monolithic call with no per-step visibility | Split into stages you can inspect independently — [One Prompt, One Job](/learn/prompt-engineering/one-prompt-one-job-intuition) |
| `json.loads` fails on a chunk of responses | Prose preamble, markdown fence, or trailing comma | Explicit "JSON only" rule + prefill the opening brace — [Taming Malformed JSON](/learn/prompt-engineering/fixing-malformed-json-output) |
| Parsing succeeds but code still breaks downstream (`KeyError`, silent no-match) | Schema is underspecified — key names, casing, or enum spelling drift across runs | Name exact keys, types, and enum strings in the prompt — [Structured Output Contracts](/learn/prompt-engineering/structured-output-contracts) |
| A stray extra field slips through validation | Schema has no `additionalProperties: false` | Add it — a stray field is an early signal the prompt's wording has drifted |
| Latency and cost balloon far more than the stage count suggests | Every stage re-sends the full growing history, not just what it needs | Forward only the fields the next stage's template references — [Passing State Cleanly](/learn/prompt-engineering/passing-state-between-stages) |
| A "verification" stage always agrees with the stage it's checking | It was given the identical evidence and no new rubric — same coin flip twice | Give it new evidence or a stricter rubric, or use real [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling) instead |
| Retry loop keeps calling the model and still fails | No repair cap — an unbounded loop rediscovers the same broken contract | Cap at one repair with the literal error message, then raise — [Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop) |

## The output-contract minimum

Every contract you ship should answer these four questions in the prompt itself, not leave them implied:

```text
- Exact field names — spelled out, not "something like a category field"
- Exact types — string / integer / boolean / array-of-X, never "whatever fits"
- Enums where the value set is closed — the literal allowed strings, cased exactly
- Nullability — which fields can be null, and what null means ("not found" vs. absent)
```

Pair it with a schema in code, not just prose, so a validator can check it mechanically:

```python
SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": ["billing", "technical", "other"]},
        "urgency": {"type": "integer", "minimum": 1, "maximum": 5},
    },
    "required": ["category", "urgency"],
    "additionalProperties": False,
}
```

## Validate-and-repair defaults

```python
def validate_with_one_repair(raw, schema, call_model, max_repairs=1):
    attempt = raw
    for i in range(max_repairs + 1):
        try:
            data = json.loads(attempt)
            jsonschema.validate(instance=data, schema=schema)
            return data
        except (json.JSONDecodeError, jsonschema.ValidationError) as e:
            if i == max_repairs:
                raise SchemaRepairFailed(raw, str(e)) from e
            attempt = call_model(repair_prompt(attempt, e), prefill="{", temperature=0)
```

- **Cap stays at one** unless you've measured that a second repair earns its cost — an unbounded loop hides a prompt bug instead of surfacing it.
- **Feed the literal validator message**, not a paraphrase — "'urgency' is a required property" is fixable; "please check the formatting" isn't specific enough to act on.
- **Keep decode errors and validation errors distinguishable in your logs** — a cluster of decode errors usually means truncation (`max_tokens`), a cluster of validation errors on one field usually means the prompt's wording for that field is the actual bug.

## Passing state — what crosses the boundary

Design backward from the next stage's prompt template: every `{field}` it references is something upstream owes it, and nothing else needs to cross.

```json
// Forward this
{"customer_first_name": "Priya", "decision": "resolve", "issue_summary": "duplicate charge on #4471"}

// Not this
{"full_12_message_thread": "...", "raw_policy_doc": "...", "decision": "resolve", ...}
```

Raw prose forwarded "just in case" isn't inert — every token is live, competes for attention with the instructions that matter, and can let a later stage silently re-derive and override a decision an earlier stage already made.

## Pipeline-depth defaults by stage count

| Stages | When it's the right call | Watch for |
|---|---|---|
| 1 (single call) | One job, one rubric, any length | Don't split just because the prompt got long |
| 1 + strict contract | One job, but code consumes the output | Contract-valid still isn't the same as correct |
| 2 | Two genuinely different rubrics (classify → extract) | The seam needs a real interface, not a shared blob |
| 3+ | Each stage needs its own settings, model, or eval | Count the handoffs — each one is a chance to drop a detail, and cost scales with re-sent tokens, not stage count alone |

Treat every row as a starting point to measure against your own eval, not a target — see [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs) for the arithmetic behind these, and [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) for what the multiples turn into on an actual bill.

## Pre-flight checklist

- [ ] You can name two different rubrics before adding a second stage — not just a longer instruction list.
- [ ] Every schema names exact keys, types, enums, and nullability — not "return JSON with the usual fields."
- [ ] `additionalProperties: False` is set, so a stray field fails loudly instead of slipping through.
- [ ] The opening token is prefilled and temperature is low for shape, independent of content quality.
- [ ] Validation checks the schema, not just that the text parses.
- [ ] Repairs are capped (start at one) and carry the literal validator error, not a paraphrase.
- [ ] Each stage receives only the fields its own prompt template references.
- [ ] The current stage count has been benchmarked against a simpler version at least once.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Over-Decomposition: Too Many Stages](/learn/prompt-engineering/over-decomposition), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages), [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs)
