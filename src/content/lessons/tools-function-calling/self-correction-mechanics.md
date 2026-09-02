---
title: "How a Model Corrects Its Own Call"
track: "tools-function-calling"
status: live
summary: "There's no separate repair mechanism — the error text just re-enters context as a tool result and conditions the next token."
duration: "5 min read"
---

Self-correction looks like the model is reasoning about its mistake. Mechanically, it's simpler and less magical than that — and understanding why makes it obvious what makes the mechanism fail.

## What it is

A tool call and its correction are two ordinary turns in the same conversation. Nothing special happens between them:

```
turn N:    assistant → tool_use: update_ticket(id=4471, status="done")
turn N:    user/tool → tool_result: {"error": "invalid_enum",
                                      "message": "status must be one of
                                                  ['open','in_progress','closed'],
                                                  got 'done'"}
turn N+1:  assistant → tool_use: update_ticket(id=4471, status="closed")
```

That's the entire mechanism. The tool result — including the error — becomes part of the context the model conditions on when generating turn N+1. There's no repair subroutine, no special "fix mode." The model is doing exactly what it always does: predicting the most likely next tokens given everything currently in context, and the error message is now part of that everything.

## The mental model

Think of the model as having no memory of *why* it made a call the way it did — only what's written down. Turn N's call and turn N's result sit next to each other in context exactly like a question and its answer. If the "answer" names a constraint the model can compare against the call it just made, generating a call that satisfies the constraint is the same kind of pattern completion as any other in-context task. If the "answer" is uninformative, there's nothing to compare against, and the next call is drawn from the same distribution as the first one — which is why it can fail identically.

This reframes self-correction as a special case of in-context learning, not a distinct capability. The model was never taught a rule like "when a tool errors, apologize and retry" — it's generalizing from the same pattern-completion behavior that makes it good at any task where the answer to "what comes next" is visible in what came before.

## Why it works this way

This is why the precondition matters so much: **self-correction only works if the error message actually names the problem.** A vague result — `{"error": "failed"}` — gives the model nothing to condition on except "that call didn't work," which is compatible with an enormous number of different fixes. The model might retry the same values, guess a plausible-looking different one, switch to an unrelated tool, or give up and tell the user something vague. All of those are reasonable completions of "a call failed and I don't know why" — which is exactly the problem, because none of them reliably fixes anything.

A message like the one in the trace above collapses that ambiguity. `status must be one of [...], got 'done'` doesn't require the model to guess what changed — the valid set and the invalid value are both right there, and picking a member of the valid set is a much narrower completion task. This is the same point made concretely in [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors): the quality of the message *is* the mechanism. There's no amount of model capability that compensates for an error that doesn't say what's wrong, because the model has no other channel to learn it from — it can't inspect your code, read your logs, or ask a clarifying question mid-generation.

## A concrete example (shown)

Same call, two different error bodies, two different outcomes:

```python
# Uninformative — the model has nothing to condition on
{"ok": False, "error": "Bad Request"}
# → next call: often a re-send of the same arguments, or a guess

# Actionable — names the field, the constraint, and the offending value
{"ok": False, "error": "invalid_enum",
 "message": "'status' must be one of ['open','in_progress','closed'], got 'done'"}
# → next call: update_ticket(id=4471, status="closed")
```

Nothing about the model changed between these two outcomes. The only variable is what was written into context for it to condition on.

## Where it shows up

This is the mechanism underneath both [Self-Correction When the Model Calls a Tool Wrong](/learn/tools-function-calling/self-correction-on-bad-tool-calls), which covers the validate-before-execute pattern that produces these error results, and [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example), which walks a complete annotated example turn by turn. It's also why [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) routes model-fixable failures back into context at all, rather than handling them silently in code — silent handling is invisible to the model, and invisible failures can't be conditioned on.

## Watch out for

- **Assuming self-correction is guaranteed.** It's a strong tendency given a good error, not a certainty. A model can still misread a subtle constraint, especially in a long or cluttered context where the error message is competing with a lot of other text for attention.
- **Expecting it to work across a topic change.** If several unrelated tool calls happen between the error and the retry, the error can effectively fall out of relevance even though it's technically still in context — treat self-correction as most reliable when the retry follows immediately.
- **Confusing this with the model "remembering" the mistake for next time.** Nothing here persists past the conversation. The same schema ambiguity will produce the same wrong first call in a fresh session, because nothing was learned — only recovered from, once.

## Where next

[Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example) shows this mechanism end to end on a realistic call. If you're building the error-generation side rather than just understanding the recovery side, [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) is the practical companion to this lesson.

**Related:** [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors), [Self-Correction When the Model Calls a Tool Wrong](/learn/tools-function-calling/self-correction-on-bad-tool-calls), [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries)
