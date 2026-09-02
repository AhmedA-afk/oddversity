---
title: "When to Force and When to Let It Decide"
track: "tools-function-calling"
status: live
summary: "A decision framework for choosing auto, required, none, or a named tool at each step of an agent loop."
duration: "6 min read"
---

Every one of the four tool-choice modes prevents a specific failure and introduces a specific new risk. Picking the right one per turn is less about a fixed rule and more about answering one question honestly: does *this* step actually need the model's judgment?

## What it is

A decision framework built around one axis: is calling a tool at this step (a) mandatory and known in advance, (b) genuinely optional and dependent on the model's read of the situation, or (c) actively unwanted right now? Each answer maps to a mode from [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes).

| Situation | Mode | What it prevents |
|---|---|---|
| The step is mandatory and you know which tool | named | Chatter instead of action — see [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked) |
| An action is required but the choice is legitimately data-dependent | required / any | The model dodging into text when it should route |
| The model must judge whether a tool applies at all | auto | Forced calls on inputs where "no tool needed" was the right answer |
| You want a plain-text answer mid-loop (summary, clarification, explanation) | none | Over-eager calling when you just want prose |

## The mental model

Ask what happens if the model is *wrong* about whether to call a tool, in each direction, and pick the mode that makes the cheaper mistake the only one still possible.

- If skipping the tool is the bug you keep hitting (the model answers from memory instead of looking something up) — force it. You've decided the "don't call it" branch is never correct here, so remove it from the model's option space entirely.
- If calling the tool when it doesn't apply is the bug (a support bot escalating tickets that don't need escalation) — use `auto`, and if it's still too trigger-happy, tighten the tool's description rather than forcing `none`, since `none` removes the capability altogether rather than making the model more selective.
- If you're mid-agent-loop and this specific turn is a wrap-up ("summarize what you found"), use `none` — not because tools are wrong in general, but because this turn shouldn't call anything and `auto` leaves that door open.

## Why it works this way

Tool choice constrains what the sampler can emit ([Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes) covers the mechanism). That means every mode you pick is a bet about the *current* turn, not the conversation as a whole — and the bet is only safe when you actually have the information the model would otherwise need to make that judgment. Forcing is safe exactly when your code, not the model, already knows the answer to "should a tool run here" — a pipeline stage, a required first lookup, a fixed schema-only output. `auto` is safe exactly when that answer depends on something only the model can see: ambiguous phrasing, whether a claim needs verification, whether the user's question is even answerable from the tools you've got.

## A concrete example

A support agent loop with three tools: `search_kb`, `create_ticket`, `escalate_to_human`.

```python
def next_turn(state):
    if state.step == "initial_triage":
        # We always want to check the KB first — no judgment call here.
        return call_model(tool_choice={"type": "tool", "name": "search_kb"})
    elif state.step == "deciding_action":
        # Model must act, but which action depends on what the KB search found.
        return call_model(tool_choice={"type": "any"})
    elif state.step == "explaining_to_user":
        # We want prose only — no more tool calls this turn.
        return call_model(tool_choice={"type": "none"})
    else:
        # Open-ended follow-up — let the model decide.
        return call_model(tool_choice={"type": "auto"})
```

Four steps, four modes, each chosen because the code — not the model — already knows what kind of decision that step requires.

## Where it shows up

- **Pipeline entry points** that must always run a lookup or extraction step: named.
- **Routers** at the top of a multi-tool agent that must act but haven't decided how: required/any.
- **Final-answer turns** in a ReAct-style loop, once the loop has enough information: none, so the model can't keep calling tools past the point of diminishing returns.
- **General assistant turns** where "no tool needed" is a legitimate and common answer: auto, the default for a reason.

## Watch out for

- **Forcing out of habit on open-ended turns.** If you force a tool on a turn where "answer from what you already know" was sometimes correct, you've traded a rare wrong-tool-call for a guaranteed one every time.
- **Leaving `auto` on a mandatory step and patching failures with retries.** If a step must always call a specific tool, forcing it is strictly better than hoping `auto` complies and catching the misses after the fact — see [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries) for why retry logic shouldn't be substituting for a choice you could have made upfront.
- **Using `none` to "calm down" an over-eager model instead of fixing descriptions.** `none` disables tools for that turn entirely; if the real problem is the model calling tools too often across the whole conversation, the fix is in [Writing Tool Descriptions Models Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow), not in muting individual turns.

## Where next

This framework assumes a small, known tool set. Once the registry grows past a handful of tools, "auto vs. forced" stops being the only selection problem — [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models) picks up from here.

**Related:** [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes), [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked), [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)
