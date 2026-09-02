---
title: "How Models Learn to Emit Tool Calls"
track: "tools-function-calling"
status: live
summary: "Tool calling is fine-tuned behavior and constrained decoding, not a separate execution engine bolted onto the model."
duration: "8 min read"
---

> **Optional depth.** Nothing later in this track depends on the mechanism in this lesson — you can build reliable tool-using systems without it. Read it when "the model just knows the JSON shape" stops being a satisfying answer.

Everything a language model produces, including a tool call, is still just the next most probable token given everything before it. That single fact resolves a question people ask surprisingly often: is there a special "function calling mode" the model switches into? Not really — there's a model that has been shaped, through training, to make certain tokens overwhelmingly likely in certain contexts, plus (optionally) a decoder on the API side that refuses to sample anything else.

## The base fact: still next-token prediction

If you haven't already, [Next-Token Prediction](/learn/llm-foundations/next-token-prediction) is worth reading before this — everything here is a special case of it. A base model, trained only to predict the next token of internet text, has no notion of "tool call" at all. Left alone, asked a question it can't answer from memory, it will do what it was trained to do: produce plausible continuation text, which usually means a confident, invented answer rather than a formatted request for help. Native tool calling is not a new capability bolted onto next-token prediction; it's the *same* mechanism, aimed at a different target distribution by additional training.

## Stage one: supervised fine-tuning on tool-call traces

After pretraining, the model goes through further training stages on curated conversation data — the same general process used to make a base model follow instructions at all. Part of that data, for a tool-using model, is transcripts where a user's message is followed not by prose but by a structured request: a tool name and arguments matching some schema, followed later by a tool-result message, followed by a final natural-language answer built from that result.

Training on many such traces does two things simultaneously. It teaches the model *when* a tool call is the appropriate next move — the distribution of tokens after "what's the weather like in Tokyo right now" shifts toward "emit a structured request" rather than "guess a temperature," because that's what the training examples reward. And it teaches *what a well-formed request looks like* — the token sequence that renders as valid JSON matching a supplied schema becomes far more probable than a malformed one, purely because the model has seen enormous numbers of examples of the correct shape and comparatively few of the wrong one.

This generalizes past the exact tools seen in training. A model isn't memorizing "when you see `get_weather`, output this." It's learning a more general pattern: given *some* schema describing *some* tool, and a user need that schema plausibly satisfies, produce arguments that (a) validate against that schema and (b) reflect the actual details of the request. That's why a model can call a tool it has never seen a training example for, as long as the schema is legible — which is exactly why the wording of your schema and description matters so much (see [Writing Tool Descriptions Models Actually Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow)).

## Stage two: reinforcement learning on outcomes

Beyond imitating traces, further training stages typically reward the model for *outcomes* — did it call the right tool, with correct arguments, and did the resulting answer actually solve the task? This is where a model gets better at judgment calls that supervised examples alone under-specify: whether a task needs a tool at all, which of several plausible tools fits best, and when to stop calling tools and answer directly. It's also where behavior you'll read about in [Common Tool-Calling Failure Modes](/learn/tools-function-calling/common-tool-calling-failure-modes) — like over-calling tools on tasks that didn't need one — gets partially, but never completely, trained away.

## Stage three: constrained decoding, on the API side

Training alone doesn't guarantee syntactically valid output — a model can still, occasionally, emit a token sequence that's almost-but-not-quite valid JSON, or that drifts outside a schema's constraints. Many providers backstop this with **constrained decoding**: at generation time, the API restricts which tokens the model is even allowed to sample next, using a grammar derived from your tool schema. If the schema says the next field must be one of three enum values, the decoder can mask out every token that isn't a prefix of one of those three strings, before the model ever gets a chance to pick something else. This is the mechanism behind Anthropic's `strict: true` on a tool definition and OpenAI's structured-outputs mode — training makes correct output *likely*; constrained decoding makes it *guaranteed*, at the cost of some latency and a schema that decoder can actually compile a grammar from (deeply recursive or highly dynamic schemas are harder to constrain).

This distinction matters practically: two models with identical training can differ sharply in reliability if one API applies constrained decoding to tool calls and the other only relies on the trained tendency. It's also why "the model called a tool with an extra field the schema didn't have" is a training-quality bug on one provider and structurally impossible on another that constrains decoding strictly.

## What this explains

- **Why tool calling degrades gracefully rather than failing hard.** Since it's trained behavior on a continuous probability distribution, not a hardcoded parser, a model can be *mostly* right — correct tool, slightly malformed arguments — in a way a hand-built rule-based system couldn't be.
- **Why a hallucinated tool call is possible at all** (see [Hallucinated Tool Calls](/learn/tools-function-calling/hallucinated-tool-calls)): if training biased the model toward "this kind of request usually gets a tool call," it can emit one even when you didn't actually supply a matching tool, because generating the *shape* of a call is a learned reflex, not a lookup against your real tool list.
- **Why prompt wording changes tool-selection behavior** — the model's training conditioned it on the literal text of names and descriptions, so a rewritten description can measurably shift which tool it reaches for on ambiguous requests, exactly the lever [Descriptions Are Prompts](/learn/tools-function-calling/descriptions-are-prompts) is about.

## Where next

[Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers) shows how this training-plus-decoding combination surfaces differently depending on the vendor, and [It's Still Text In, Text Out](/learn/tools-function-calling/tool-calling-still-text-in-text-out) pulls the thread back to the practical implication: there's no hidden RPC layer here, only tokens your harness has agreed to interpret a certain way.

**Related:** [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands), [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers), [Hallucinated Tool Calls](/learn/tools-function-calling/hallucinated-tool-calls), [Writing Tool Descriptions Models Actually Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction)
