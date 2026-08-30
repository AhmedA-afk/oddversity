---
title: "What prompting actually is"
track: "prompt-engineering"
status: live
summary: "Prompting is the act of constructing the input context from which a model produces an output."
duration: "3 min read"
---

## The short answer

Prompting is the act of constructing the input context from which a model produces an output. It is not a magic spell and it is not only a question: it is a small interface contract containing a task, relevant information, constraints, and a desired response shape. Better prompting makes the task legible; it cannot give the model facts or abilities it does not have.

## A prompt is an input program

For a language model, the prompt is a sequence of tokens. The model uses that sequence, its learned parameters, and generation settings to predict a continuation. Your instruction competes for attention with examples, retrieved documents, conversation history, tool results, and attacker-controlled text.

```text
Task: classify a support message
Context: “I was charged twice for the same invoice.”
Constraints: choose one label from {billing, access, bug}
Output: JSON with label and one-sentence reason
```

The task is not “write something about this message.” It is a bounded decision with an observable output.

## A small story

A support team once asked an assistant to “be helpful” with refund requests. The model produced warm, plausible replies, but different agents interpreted “helpful” differently. The fix was not a longer personality paragraph. It was a label set, a refund policy excerpt, an escalation rule, and examples of edge cases.

## More examples and variations

- **Question:** “What is the return window?” needs a direct answer plus source context.
- **Extraction:** “Find the invoice ID” needs a null result when no ID exists.
- **Transformation:** “Rewrite this for a child” changes style, not the underlying facts.
- **Counterexample:** “Tell me everything about this” has no scope, audience, or success test.

## Two ways to see it

### Model view

You are shaping the context that conditions generation. Order, salience, ambiguity, and missing information matter.

### Product view

You are designing an interface between a human intention and a probabilistic component. The prompt needs an acceptance test, a fallback, and an owner.

## Hands-on

Take a recurring task and write three versions: a vague request, a request with constraints, and a request with an output contract. Run each on the same three inputs and record where the answer changes.

## Checkpoint

- [ ] Name the task, input, constraint, and output separately.
- [ ] Record one case the prompt cannot solve without better data or a tool.
- [ ] Keep the three outputs as a small baseline set.

## What this does not solve

A clear prompt does not guarantee truth, stable behavior across models, privacy, or resistance to malicious context.

## Continue, go deeper, apply it

- Continue: What prompt engineering is
- Go deeper: Task framing
- Apply it: Role workflow branch
