---
title: "Understand how language models produce text"
track: "ai-literacy"
status: live
summary: "A language model turns text into tokens, uses learned parameters and the supplied context to estimate what token should come next, and repeats."
duration: "5 min read"
---

## The short answer

A language model turns text into tokens, uses learned parameters and the supplied context to estimate what token should come next, and repeats that process to generate an output. It is not consulting a database of guaranteed facts. Retrieval, tools, instructions, and application checks are separate parts of the system around the model.

## Why this matters

The next-token view explains both the usefulness and the limits of a language
model. It can continue patterns, transform language, follow examples, and combine
context. It can also produce a confident continuation when the context is
missing, ambiguous, or misleading. “It sounds like it knows” is not a verification
method.

This model also separates responsibilities. The language model generates. A
retriever supplies evidence. A tool performs an operation. The application checks
the result and decides whether any action is allowed.

## How it works

1. **Tokenization:** text is split into tokens, which may be whole words,
   fragments, punctuation, or spaces. Token count is not the same as word count.
2. **Context:** the current prompt, conversation, retrieved passages, and tool
   results are supplied as a finite sequence. The model can only condition on what
   reaches this context.
3. **Prediction:** learned parameters assign scores to possible next tokens based
   on patterns in the context.
4. **Selection:** a decoding rule chooses a token. Settings can make selection
   more deterministic or more varied, but they do not add missing knowledge.
5. **Iteration:** the selected token becomes part of the context and the model
   predicts again until a stopping condition is reached.

In simplified form:

```text
tokens + context + parameters → scores for next token → selected token
                                             ↑                 |
                                             └──── repeat ─────┘
```

Parameters store patterns learned during training. They are not a transparent
list of sources, and a generated citation is not evidence that a source was
actually consulted.

## Worked examples and variations

### Example A: completion

Prompt: `The kettle is on the`. A likely continuation is `stove`, `table`, or
`counter`, depending on context. The model is completing a pattern; it is not
checking the state of a real kitchen.

### Example B: constrained transformation

Prompt: “Extract the invoice ID from this text; return `null` when absent.” The
instruction and output contract make the desired behavior more inspectable. They
do not guarantee that the model will notice every ID or obey the contract every
time, so a parser and a test set still matter.

### Example C: missing fact

Prompt: “What was the exact internal outage duration?” with no incident record in
the context. A model may produce a plausible duration because a continuation is
always available. The correct application behavior is “not enough evidence,” a
request for the incident record, or a source lookup.

### Boundary case: long context

Adding more text does not guarantee that every detail will receive equal
attention. Repeated, conflicting, stale, or poorly delimited passages can make
the relevant evidence harder to use. Test long-context behavior with known answers
and conflicting distractors.

### Counterexample: temperature as truth control

Lowering randomness can make outputs more repeatable, but a repeatable mistake is
still a mistake. Sampling settings affect variation; they do not verify facts,
repair permissions, or turn a model into a calculator.

### Production example: tool boundary

A model can propose `refund_invoice(id=123)`, but the tool and application must
decide whether the invoice exists, the user is authorized, the amount is within
policy, and confirmation is required. Tool calling changes what the surrounding
system can do; it does not mean the model itself performed the refund safely.

## An illustrative story

A learner asked a model to explain a missing chapter from a book. The response was
clear, organized, and wrong in several small details. When the learner supplied
the chapter text, the task changed from unsupported recall to a grounded
transformation. The prose was still generated, but the evidence boundary became
visible.

This is illustrative. The point is not that models always hallucinate; it is that
an absent source changes what the system can honestly claim.

## Two ways to see it

### Model view

Generation is iterative prediction over tokens conditioned on context and learned
parameters. Prompt structure changes the context; it does not rewrite the model’s
parameters.

### Systems view

A useful product wraps the model with retrieval, tools, validation, policy, logs,
and a human or automated review path. Reliability belongs to the whole boundary,
not to the generated paragraph alone.

## Hands-on

Create a small “model versus evidence” worksheet with six prompts:

| Prompt type | What to record |
| --- | --- |
| simple completion | likely continuation and what it does not prove |
| extraction with a missing field | whether the output abstains |
| rewrite with source text | facts preserved or changed |
| question with supplied evidence | claim-to-source mapping |
| question without evidence | unsupported details or abstention |
| conflicting passages | which source the system uses and why |

Mark every output as **supported**, **unsupported**, **ambiguous**, or **malformed**.
Your failure state is a polished answer with no evidence. The repair is not “ask
more confidently”; add a source, a null/abstain behavior, or a review step and
record the difference.

## Checkpoint

- [ ] You can explain tokens, context, parameters, prediction, and decoding in order.
- [ ] You can distinguish a model output from a retrieved source or tool result.
- [ ] You can identify one answer that sounds plausible but is unsupported.
- [ ] You can state what the application should do when evidence is absent or conflicting.

## What this does not solve

This mental model does not teach model training, embeddings, or transformer
mathematics in depth. It also does not make a model deterministic, truthful,
private, or safe to grant broad authority. Those are separate engineering and
governance problems.

## Continue, go deeper, apply it

- Continue: Uncertainty, verification, and human judgment
- Go deeper: Neural networks and representations
- Apply it: What prompting actually is
