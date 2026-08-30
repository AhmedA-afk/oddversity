---
title: "The Steering Levers: Role, Prefill, Format, Examples"
track: "prompt-engineering"
status: live
summary: "Four ways to shape output compared on one task — what each actually fixes, what it doesn't, and which one to reach for first."
duration: "7 min read"
---

By this point in the module you've seen role, prefill, and negative-vs-positive framing each on their own. The question that actually matters in practice is which one to reach for when an output is coming back wrong — and the answer is almost never "all of them at once." Here they are, side by side, on one task.

**The task:** get the model to return three book recommendations, each with a title, an author, and a one-line reason, in a format a downstream script parses reliably.

## Role

**How it works:** a system or user clause like "You are a librarian who only recommends books, states the three fields asked for, and adds no commentary." A role compresses several scope and tone constraints into one persona clause — see [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes).

**When it wins:** when the failure is really about register or scope more than exact syntax — staying on-topic ("only recommend books"), dropping unwanted commentary — and some looseness in the literal output shape is tolerable.

**Failure mode:** a role reliably shifts tone and scope, but doesn't reliably pin an exact, machine-parseable shape. You'll likely get three books with reasons — whether it's `1. Title by Author — reason` or `Title: X, Author: Y, Reason: Z` can still vary from run to run, because nothing in a persona clause specifies syntax at that level of precision.

**Relative cost:** cheapest. One clause, reusable across many different requests to the same assistant.

## Prefilling

**How it works:** seed the assistant's turn with the literal opening of the intended structure — `1. ` — so the first item's format is fixed from token one. See [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn).

**When it wins:** when you need the *opening* pinned exactly — no preamble, first token already inside the target shape — and you can predict ahead of time what that opening looks like.

**Failure mode:** it only constrains the start. It says nothing about whether item 2 and item 3 match item 1's format, or whether "reason" comes out as a full sentence or a fragment — the rest of the shape can still drift.

**Relative cost:** cheap to add, but it solves exactly one class of failure — the preamble — and pairs best alongside an explicit format spec rather than replacing one.

## Explicit format instruction

**How it works:** state the literal template directly: "Respond with exactly 3 lines, each formatted as `Title — Author — Reason`, no other text."

**When it wins:** when the downstream consumer needs a specific, fully describable syntax and there's no genuine ambiguity a worked example would resolve better than a plain description. This is the most direct route to a specific shape — more precise than a role's vague "no commentary."

**Failure mode:** a written spec still competes with the model's other habits the way any instruction does, per [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn)'s point about instructions being probabilistic, not structural. Under a long or complex prompt it can still slip on an edge case you didn't anticipate — a book title that itself contains an em dash, colliding visually with your chosen delimiter.

**Relative cost:** low — a few extra lines, no infrastructure — but every ambiguity in the spec (what delimiter, what to do on a punctuation collision) has to be anticipated by you up front, or it becomes a live bug.

## Examples (few-shot)

**How it works:** show one or two fully worked input-to-output instances, delimiter and all — see [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting).

**When it wins:** when the shape has an ambiguity that's genuinely easier to show than describe — exactly how to handle punctuation, capitalization, or an edge case like a book with two authors. One example can resolve what a paragraph of instruction can't, which is the whole premise of [why examples beat instructions sometimes](/learn/prompt-engineering/why-examples-beat-instructions-sometimes).

**Failure mode:** real ongoing cost on every call, and an unrepresentative example set teaches the wrong lesson — the model can lock onto an incidental detail of your examples (always fiction, always a one-clause reason) rather than the actual pattern you meant, covered in [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage).

**Relative cost:** highest ongoing cost of the four — every example is resent on every call — but often the most reliable lever for a genuinely ambiguous format.

## Decision table

| Lever | Fixes | Doesn't fix | Relative cost |
|---|---|---|---|
| Role | Register, scope, default tone | Exact syntax, machine-parseable structure | Lowest |
| Prefill | The opening token(s) only | The structure of everything after the opening | Low |
| Explicit format instruction | The literal template, if fully unambiguous | Edge cases you didn't anticipate | Low–moderate |
| Few-shot examples | Ambiguities a description can't resolve | Per-call cost; risk of copying an incidental detail | Highest |

## How to choose

Reach for the cheapest lever that actually addresses the failure you're seeing — never the whole stack pre-emptively. If the problem is tone or scope, add a role. If it's a stray preamble in front of an otherwise-correct structure, add a prefill. If it's the literal shape and you can describe it exactly, write the format instruction. If the shape has a genuine ambiguity a sentence can't pin down, add one or two examples.

In practice these stack rather than compete. The book-recommendation task ends up well served by a role (scope: only recommend books) plus an explicit format spec (the exact template) plus a prefill of the first list marker if a downstream parser needs the opening guaranteed. Reach for few-shot only once you've actually seen an ambiguity the other three didn't resolve — it's the most expensive lever per call, so it should be the last one added, not the first.

**Related:** [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes), [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn), [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting), [Why Examples Beat Instructions Sometimes](/learn/prompt-engineering/why-examples-beat-instructions-sometimes), [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage), [Structured Output](/learn/prompt-engineering/structured-output)
