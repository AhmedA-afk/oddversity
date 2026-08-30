---
title: "Building a Product Assistant's System Prompt"
track: "prompt-engineering"
status: live
summary: "Six sections — role, scope, tone, refusal policy, format, tool rules — assembled into one real system prompt and traced through two live requests."
duration: "8 min read"
---

Most of the steering levers in this module show up piecemeal, one technique at a time. A real product system prompt has to hold all of them together, at once, without them fighting each other. Here's a complete one, built section by section, for a fictional in-app help assistant.

## What we're building

A production-shaped system prompt for **Tasklight**, a project-management tool, covering six sections — role, scope boundaries, tone, refusal policy, output format, and tool-use rules — plus two traced example turns: one in-scope request handled correctly, and one out-of-scope request handled without a bare refusal.

## Setup

No framework needed — this is prompt design, not infrastructure. Assume two tools are already wired up through normal tool-calling: `search_help_docs(query)` and `get_account_plan(user_id)`.

```python
messages = [{"role": "user", "content": "<the incoming user message>"}]
system_prompt = SYSTEM_PROMPT  # assembled below, section by section
```

## Build it

### 1. Role — name what it is, not a superlative

```
You are Tasklight's in-app help assistant. You help users complete
tasks inside Tasklight and understand its features.
```

Per [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes), a role should specify actual scope and behavior, not a credential. "You are Tasklight's help assistant" sets vocabulary (product terms), audience (a logged-in user), and job — not a flattering label that would change nothing checkable.

### 2. Scope boundaries — state the edges positively

```
Answer only questions about using Tasklight: features, settings,
billing status, and troubleshooting. If a question is about something
else — general productivity advice, other tools, or anything unrelated
to Tasklight — say so plainly and point back to what you can help with.
```

Framed as "answer only X" rather than a list of "don't discuss Y, Z, W." One positive scope line does the work several negatives would have needed, and per [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem), it's also testable: does the answer stay inside Tasklight, or not.

### 3. Tone

```
Write in a clear, friendly, concise tone. Prefer short paragraphs and
numbered steps over long prose. Address the user directly as "you" —
never refer to yourself as "the assistant."
```

Concrete, checkable rules — paragraph length, step formatting, pronoun choice — the same audience-and-register pattern from [Before/After: A Role That Earns Its Tokens](/learn/prompt-engineering/role-prompt-before-after), applied at the system level instead of a one-off prompt.

### 4. Refusal policy — always name what to do instead

```
If you don't have enough information to answer — a tool returns
nothing, or the question needs account specifics you can't look up —
say exactly what's missing and what the user can do next. Never
respond with only "I can't help with that."
```

A bare refusal is itself a negative-instruction failure: an absence with no positive target. This line forces a next step every time, applying the same positive-rewrite pattern from [Before/After: Turning Prohibitions Into Positive Instructions](/learn/prompt-engineering/rewrite-dont-into-do) specifically to the refusal case.

### 5. Output format

```
For step-by-step instructions, use a numbered list. For a single
fact or short answer, use one or two plain sentences — do not add a
list for a one-line answer.
```

If this pipeline needs the numbered-list shape *guaranteed* — say, for a UI that renders steps as a special component — this instruction is necessary but not sufficient on its own. A router that already knows a question is how-to shaped could prefill the assistant's turn with `1.` to make the opening structurally certain rather than merely likely; see [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn) for exactly that mechanism.

### 6. Tool-use rules

```
Use search_help_docs before answering any question about a specific
feature or setting — never answer from memory about how a feature
works, since the product changes.

Use get_account_plan only when the question is specifically about the
user's billing, plan, or usage limits — do not call it for general
how-to questions.

If a tool call fails or returns nothing, say so and offer to have the
user check the help center directly, rather than guessing.
```

Tool-use rules are their own kind of scope boundary: which tool, under what condition, and what to do on failure. "Never answer from memory" is a deliberate exception carved out of the tone section's "answer directly" instinct, justified by the fact that product details go stale — the same freshness problem that motivates retrieval over memorized facts in general.

### Assemble it

```python
SYSTEM_PROMPT = """
You are Tasklight's in-app help assistant. You help users complete
tasks inside Tasklight and understand its features.

Answer only questions about using Tasklight: features, settings,
billing status, and troubleshooting. If a question is about something
else, say so plainly and point back to what you can help with.

Write in a clear, friendly, concise tone. Prefer short paragraphs and
numbered steps over long prose. Address the user directly as "you".

If you don't have enough information to answer, say exactly what's
missing and what the user can do next. Never respond with only
"I can't help with that."

For step-by-step instructions, use a numbered list. For a single fact
or short answer, use one or two plain sentences.

Use search_help_docs before answering any feature or setting question
— never answer from memory. Use get_account_plan only for billing,
plan, or usage-limit questions. If a tool call fails or returns
nothing, say so and suggest the help center.
""".strip()
```

## Run it

**In-scope request:** *"How do I move a task to a different project?"*

Trace: the scope check passes (this is squarely about using Tasklight) → the tool-use rule fires, calling `search_help_docs("move task to different project")` → a doc snippet comes back → the output-format rule applies, since this is a how-to question:

> *1. Open the task and click the project name at the top.*
> *2. Choose the new project from the dropdown.*
> *3. Confirm — the task moves immediately and keeps its due date and assignee.*

**Out-of-scope request:** *"What's a good way to prioritize my day in general, not just in Tasklight?"*

Trace: the scope boundary fires — this isn't about using Tasklight — and the refusal policy activates with a positive redirect, not a bare decline:

> *That's outside what I can help with here — but I can walk you through Tasklight's priority flags and due-date sorting if that would help instead.*

Note it's the scope-plus-refusal sections doing the work here, not the tone section. Staying friendly wouldn't have fixed an out-of-scope answer on its own; only the explicit boundary and the "always redirect, never refuse bare" rule together produce this response.

## Harden it

**Scope creep through a chain of follow-ups.** A user can walk the assistant out of scope one small step at a time — "ok, but generally speaking, how should I prioritize tasks?" — where each individual message looks like a reasonable follow-up. The fix: the scope check has to run on every turn, not just be assumed to still hold because it's still sitting in the resent system prompt. This is exactly the decay problem in [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state) — a boundary stated once needs to be actively re-applied at each new turn, not treated as permanently enforced just because it's technically still present.

**A tool-use rule silently skipped under a vague question.** "Is there a limit on my plan?" is billing-shaped but vague enough that the model might answer from general knowledge instead of calling `get_account_plan`. Fix: make the trigger condition concrete — "any question containing 'plan,' 'limit,' 'billing,' or 'upgrade'" — rather than relying on the model to infer intent from a loosely worded rule.

**A refusal redirect that grows long enough to bury the actual answer.** If the redirect for an out-of-scope question runs past a sentence or two, it starts competing with genuinely in-scope answers for attention. Fix: cap the redirect explicitly in the output-format section.

## Extend it

If this assistant's answers need to feed a UI component instead of a chat bubble, add a real structured-output contract — a JSON envelope like `{answer, steps: [...], sources: [...]}` — which would also need the prefilling technique above to guarantee the opening brace reliably rather than just requesting it.

Before shipping any edit to this prompt, build a small eval set of in-scope, out-of-scope, and deliberately ambiguous questions and run it after every change, rather than eyeballing the two traced examples above the way this page did for illustration.

**Related:** [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes), [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem), [Before/After: Turning Prohibitions Into Positive Instructions](/learn/prompt-engineering/rewrite-dont-into-do), [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn), [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state)
