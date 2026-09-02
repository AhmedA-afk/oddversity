---
title: "One Code Tool vs. Dozens of API Tools"
track: "tools-function-calling"
status: live
summary: "Precisely weigh the token-cost win of a single code tool against the audit and gating cost it hides."
duration: "7 min read"
---

*Optional depth: read this after you've built at least one tool registry and one code-execution tool — the tradeoff only feels real once you've felt both costs.*

"Code is the universal tool" is a real design position, not a slogan: instead of registering `get_weather`, `search_flights`, `send_email`, and forty more, you register one `run_python` tool with those same APIs importable as functions, and let the model write the glue code.

## The claim being weighed

Whether this is a good idea depends on two things you can actually measure — token cost and audit surface — not on which one sounds more elegant.

## The token-cost argument

Every tool in your schema costs tokens on every single call, whether the model uses it or not — see [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas) for the mechanics. A purely illustrative comparison:

- 40 narrow tools, each with a name, description, and 3-5 typed parameters: illustratively ~80-150 tokens apiece → roughly 3,000-6,000 tokens of schema on *every* request, whether the turn needs one tool or none.
- 1 `run_python` tool with a short description: a few hundred tokens, flat, regardless of how many underlying capabilities the code inside it touches.

That gap compounds because it's paid on every turn of every conversation, not once. It's also why [tool selection at scale](/learn/tools-function-calling/tool-selection-at-scale) becomes a real engineering problem well before you hit 40 tools — a single code tool sidesteps that problem entirely, because there's nothing to *select among*.

## The audit-and-gating argument, precisely

Here's the cost that doesn't show up in a token count. A discrete tool is a checkpoint: you can look at `send_email(to, subject, body)` in isolation, decide it needs an [approval gate](/learn/tools-function-calling/approval-gates-for-sensitive-tools), log exactly when it fired, and rate-limit it independently of everything else. A `run_python` tool has none of that structure inside it — the *interior* of the script is invisible to your dispatcher until it runs. If `send_email` is reachable as a Python import inside the sandbox, "does this action need approval" stops being a question you can answer by inspecting the tool call, because the tool call is just `run_python(code="...")` regardless of what the code does.

State the tradeoff precisely: narrow tools push classification work to *design time* — you decide the risk tier once, per tool, when you write the schema (see [Classifying Tool Risk Tiers](/learn/tools-function-calling/classifying-tool-risk-tiers)). A code tool pushes that same classification to *runtime*, where recovering the same information would require parsing or sandbox-monitoring arbitrary code — much harder, and easy to get wrong in exactly the cases that matter, like a script that constructs an API call dynamically from string concatenation instead of calling a named function directly.

## The hybrid, and why it's not a compromise

The resolution isn't "pick one." Code execution and discrete gated tools solve different problems and coexist in the same agent without contradiction:

- **Computation, transformation, multi-step glue logic** → route through the code tool. Filtering a dataframe, joining two API responses, formatting output — none of it needs a human in the loop, and a code tool handles all of it with one schema instead of a dozen.
- **State-changing, sensitive, or externally consequential actions** → keep as discrete, named, gated tools (`send_email`, `charge_card`, `delete_record`), each with its own [approval gate](/learn/tools-function-calling/approval-gates-for-sensitive-tools) and its own entry in your [execution authority model](/learn/tools-function-calling/execution-authority-model). Critically, don't expose these as importable functions inside the sandbox — if the model wants to send an email, it should have to make a separate, visible `send_email` tool call your dispatcher can intercept, not smuggle it through a Python import where your gate never sees it.

This is the same least-privilege logic that governs any system: the general-purpose tool gets a small, sealed-off blast radius (no network, no privileged imports), and every action that actually changes something in the world stays behind a checkpoint your harness controls, not one buried inside model-generated code.

## Takeaway

Neither approach is strictly safer or strictly cheaper — they trade token cost against auditability at different points. A code tool wins on schema size and on tasks whose shape you can't fully anticipate; discrete tools win on anything you need to gate, log, or rate-limit per action. Most production agents run both, deliberately kept from overlapping.

**Related:** [Code Execution as a Tool](/learn/tools-function-calling/code-execution-as-a-tool), [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [Execution Authority Model](/learn/tools-function-calling/execution-authority-model), [Classifying Tool Risk Tiers](/learn/tools-function-calling/classifying-tool-risk-tiers)
