---
title: "It's Still Text In, Text Out"
track: "tools-function-calling"
status: live
summary: "There's no RPC channel under the hood — a tool call is text your harness agrees to interpret as a request."
duration: "5 min read"
---

It's tempting to picture tool calling as the model reaching through an API into your code, the way one function calls another in a running program. It doesn't. Nothing about the transport changes when tools enter the picture — the model still only ever produces tokens, and your code still only ever reads them.

## The analogy

Picture a diplomatic exchange conducted entirely through translated letters. Two parties have agreed in advance on a convention: any letter starting with "FORMAL REQUEST:" followed by a specific format is to be treated not as correspondence to read and reply to in kind, but as a request to be *acted on* — checked against records, verified, fulfilled — with the outcome written up and sent back as a new letter. Nothing about the paper or the ink is special. The letter carries no embedded machinery. The *meaning* of "this is a request, not prose" exists only because both sides agreed, beforehand, to treat that specific format that way.

The model is one party to this exchange. Your application code — the harness — is the other. The "special" tool-call JSON is not a different kind of output than ordinary prose; it's ordinary output that both sides have agreed, in advance, to treat specially.

## Walk it through

1. Your harness sends the model a prompt, plus a description of the agreed format: "if you need `get_weather`, write it as a JSON object with fields `name` and `input`, matching this schema."
2. The model generates tokens. Nothing at the API layer forces those tokens into a special "call mode" — the model is simply very likely, because of how it was trained (see [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools)), to produce tokens matching that agreed format when a tool is warranted.
3. Your harness receives the raw response and checks: does this match the agreed tool-call shape? If yes, it treats those tokens as a request rather than as an answer to show the user — that check is a piece of code you wrote, not a property of the tokens themselves.
4. Your harness executes the real function, gets a real result, and writes it back as more text, formatted the way the agreed convention says a result should look.
5. The model reads that text on its next turn. It has no way to distinguish "text I'm reading because it's a tool result" from "text I'm reading because a user typed it" except that, again, both sides agreed on a convention — the result arrives inside a message shaped like the schema said it would.

At every step, what's moving between the two parties is text. The "call" and the "result" are labels your harness and the model's training have agreed to apply to particular text shapes — not a separate wire protocol.

## The wrong intuition — and the correction

The natural wrong picture is that a tool call is somehow lower-level than the rest of the conversation — that it briefly steps outside the token stream into a real function invocation, the way a compiled program's function call jumps to another address in memory. It doesn't step outside anything. The tool-call JSON is exactly as "just text" as the model's ordinary prose; the only difference is that your harness's parsing code recognizes that particular shape and reacts to it differently than it reacts to plain prose.

This reframing is what explains two things that otherwise look like bugs:

**Why the exact wording of a tool's description changes behavior.** If tool calling were a hardcoded API feature, the English words in a `description` field would be cosmetic. They're not — they're prompt text the model reads and reasons over like any other instruction, which is why rewriting a vague description can measurably change whether the model reaches for a tool at all. [Descriptions Are Prompts](/learn/tools-function-calling/descriptions-are-prompts) is built entirely on this fact.

**Why a model can "call" a tool that doesn't exist.** If tool calling were true RPC, an undefined function simply couldn't be invoked — there'd be nothing to link to. But because a tool call is just a trained tendency to produce a particular text shape, a model can emit a syntactically perfect call to `send_email` even when no such tool was ever declared, if the conversation makes that shape seem plausible enough. Nothing in the mechanism prevents it — only your harness catching the mismatch does. See [Hallucinated Tool Calls](/learn/tools-function-calling/hallucinated-tool-calls) for exactly this failure and how to guard against it.

## When the analogy breaks

The letters-and-convention picture is honest about the *mechanism*, but it undersells how strict the convention actually is in practice. Real tool-calling APIs don't just hope the model follows the format — many apply constrained decoding, restricting which tokens can be sampled next so that malformed output is structurally impossible rather than merely unlikely (see [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools)). At that point the convention is enforced by the platform, not just agreed to by the model — closer to a letter that's physically impossible to write in the wrong format than one that merely follows an honor system. The core claim still holds even then: it's text, shaped by a rule your harness supplied, not a hidden execution channel.

**Related:** [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands), [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools), [Hallucinated Tool Calls](/learn/tools-function-calling/hallucinated-tool-calls), [Descriptions Are Prompts](/learn/tools-function-calling/descriptions-are-prompts), [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call)
