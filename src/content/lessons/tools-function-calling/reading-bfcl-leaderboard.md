---
title: "Reading BFCL Scores Critically"
track: "tools-function-calling"
status: live
summary: "A high BFCL score predicts general call-shape competence, not that your specific schemas, prompts, and errors will work."
duration: "7 min read"
---

*Optional depth: read this once you've actually built your own eval, per [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) — the gap described here is much easier to see with a concrete score in front of you.*

A leaderboard number invites a shortcut: pick the model that's highest, ship it. BFCL is a genuinely useful benchmark, and that shortcut is still wrong more often than it's right for a specific agent.

## What the categories actually measure

Recall BFCL's structure from [Benchmarking Tool Use With BFCL](/learn/tools-function-calling/benchmarking-with-bfcl): simple, multiple, parallel, parallel-multiple, relevance, and multi-turn. Each isolates a distinct mechanical skill. A model can be strong on simple and multiple — good at picking the right tool from a small, well-labeled set — and weak on relevance, meaning it forces a tool call even when none of the offered tools actually answer the question. Averaged into one headline number, that weakness disappears; read per-category, it's the single most operationally important score for an agent where wrongly calling a tool has a real cost.

## What a high aggregate score does not predict

Precisely three things are missing from any BFCL score, no matter how high:

1. **Your tool schemas.** BFCL evaluates against its own reference tool set — different names, different argument shapes, different description styles than yours. A model's skill at BFCL's `get_weather(location, unit)` doesn't transfer perfectly to your `book_table(restaurant_id, party_size, time)` if your schema is ambiguous in a way BFCL's isn't. Schema quality is a variable BFCL holds constant; in your app it's a variable you control and can get wrong.
2. **Your prompts and system instructions.** BFCL's queries are presented in a fixed, benchmark-appropriate format. Your actual users write messier, more ambiguous requests, embedded in a longer conversation with your specific system prompt around them — none of which the benchmark exercises.
3. **Your error handling.** BFCL, even in its executable track, checks whether the call is right. It doesn't check what your agent does with a *result* — whether it recovers gracefully from a handler error, retries sensibly, or narrates around a silent failure. That's entirely downstream of the benchmark, covered in [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries) and [Returning Actionable Errors](/learn/tools-function-calling/returning-actionable-errors).

## A model can top the leaderboard and lose on your eval

Here's the concrete shape of the gap. Suppose Model A scores higher than Model B on BFCL's aggregate. Model A got there partly by being strong on "simple" (single tool, obvious argument) and "multiple" (clearly distinct tools) — the categories with the most test items. Your agent's actual tool registry, though, has several tools with overlapping purposes and subtly different argument names (`user_id` vs `account_id` for what's conceptually the same field across two legacy APIs) — closer to BFCL's harder "relevance" and "multiple" edge cases than its bulk of easy ones. Model B, weaker in aggregate, happens to be more careful about exactly that kind of ambiguity. Run both against [your own eval harness](/learn/tools-function-calling/building-a-tool-use-eval-harness), built from your schemas and your logged queries, and B can come out ahead — not because BFCL was wrong, but because its aggregate score was never a promise about your specific tool set.

## Why the custom eval wins

The custom eval isn't a nice-to-have layered on top of BFCL — it's testing something BFCL structurally cannot: the interaction between a specific model and your specific schemas, descriptions, and error paths. BFCL answers "is this model generally capable of function calling." Your eval answers "does this model, with these tools, described this way, do the right thing for the requests my users actually send." Those are different questions, and only one of them is the one you're shipping against.

## How to use BFCL well anyway

It's not useless — use it for what it's actually good at: a first-pass filter when choosing a base model (a model weak across the board on BFCL is unlikely to be strong on your narrower eval either), and a sanity check after a model upgrade that basic call-shape competence hasn't regressed. Just don't let it be the last check before a model change ships — that's what your own [eval harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) is for.

**Related:** [Benchmarking Tool Use With BFCL](/learn/tools-function-calling/benchmarking-with-bfcl), [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries), [Returning Actionable Errors](/learn/tools-function-calling/returning-actionable-errors)
