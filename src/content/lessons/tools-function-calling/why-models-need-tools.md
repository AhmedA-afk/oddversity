---
title: "Why a Model Needs Tools at All"
track: "tools-function-calling"
status: live
summary: "Four concrete gaps — stale knowledge, no private data, no side effects, weak arithmetic — that tools exist to close."
duration: "7 min read"
---

"Just give the model a tool for it" is not always the right call. Before you reach for one reflexively, it helps to know precisely which gaps tools close — there are four, and a task either falls into one of them or it doesn't.

## What it is

A model is a function from text to text, frozen at the point its training ended. Every gap tools fill traces back to that one fact: it knows nothing that happened after training, nothing that was never public, can't cause anything to happen outside the conversation, and — despite writing fluent digits — isn't actually running a calculator when it produces a number.

## The mental model

Ask, for any task: *does the answer depend on something the model couldn't have learned by reading text once, a long time ago, and never again?* If yes, it's a tools problem. If the task is purely "transform text I already gave you into other text" — summarize, rephrase, classify, translate — no tool is involved at all, and reaching for one just adds latency and failure surface for nothing (see [Beginner Tool-Calling Mistakes](/learn/tools-function-calling/foundations-common-mistakes) for what that looks like in practice).

## Why it works this way

Each gap below is the same underlying limitation showing up in a different guise:

**1. Stale knowledge past the training cutoff.** The model's information stops at a fixed point in time. Anything newer simply isn't in there.

*Without a tool:* "Who won the most recent Formula 1 race?" gets a confident, plausible answer — for whichever race was most recent as of training, presented as current. The model has no internal signal that time has passed since then.

*With a tool:* a `search_web` or `get_latest_results` call retrieves this week's actual result, and the model reports what the tool returned instead of what it remembers.

**2. No access to private or live data.** Even for *current* information, if it was never published anywhere the model could have read it, no amount of training helps.

*Without a tool:* "What's the status of order #48213?" — the model has never seen your order database and cannot have. It will either refuse or, worse, invent a plausible-sounding status.

*With a tool:* a `get_order_status` call hits your actual database and returns the real record.

**3. No ability to cause side effects.** Reading is one gap; *changing* something is another. A model that answers "Yes, I've sent that email" without a tool has done nothing except write a sentence that sounds like it did.

*Without a tool:* "Cancel my 3pm meeting" — the model can produce text describing cancellation. No calendar event moves.

*With a tool:* a `cancel_event` call actually mutates your calendar, and the confirmation text is now true because the action really happened first.

**4. Unreliable arithmetic.** This one surprises people — the model is *made of* numbers, so why would math trip it up? Because it generates a numeric answer as a sequence of predicted tokens, the same way it generates a word — it isn't running long multiplication step by step through a guaranteed-correct algorithm. On short, memorized-pattern arithmetic it's usually fine; push into larger numbers or multi-step compounding and errors creep in with no internal signal that anything went wrong.

*Without a tool:* "What's 847293 × 58231, compounded over 14 periods at 3.2%?" — the model produces a number that looks right, formatted correctly, occasionally wrong.

*With a tool:* a `calculator` or `code_execution` call runs the actual computation, and the returned digits are exact by construction rather than by prediction.

## A concrete example (shown)

Put gaps 2 and 3 together and you get the shape of most real business tools: "What's my account balance, and can you move $200 to savings?" needs a *read* (gap 2 — private data) before it can safely attempt a *write* (gap 3 — a side effect), and the write should probably pass through an approval step before it fires, which is exactly the territory of [Approval Gates for Sensitive Tools](/learn/tools-function-calling/approval-gates-for-sensitive-tools).

## Where it shows up

This four-gap framing is the honest justification for adding *any* tool to a system prompt — if a proposed tool doesn't close one of these four gaps, ask what problem it's actually solving. It's also the framing an interviewer or a code reviewer will implicitly use when they ask "why does this agent need a tool for that?"

## Watch out for

- **Reaching for a tool on gap-free tasks.** "Summarize this document" needs no tool — the input is already in the conversation. Adding one anyway adds a round trip, more tokens, and a new failure mode for zero benefit.
- **Assuming any gap needs a *new* tool.** Sometimes an existing tool already covers it — the fix is [Writing Tool Descriptions Models Actually Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow) so the model recognizes it applies, not building a second one.
- **Treating gap 4 as fully solved by any calculator tool.** A tool only helps if the model reliably reaches for it on math it should distrust — see [Common Tool-Calling Failure Modes](/learn/tools-function-calling/common-tool-calling-failure-modes) for cases where models skip an available tool and guess anyway.

## Where next

Once you know *why* a tool belongs in the system, [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools) explains how the model actually produces a well-formed request for it, and [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema) covers building the tool itself.

**Related:** [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands), [Beginner Tool-Calling Mistakes](/learn/tools-function-calling/foundations-common-mistakes), [Approval Gates for Sensitive Tools](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [Writing Tool Descriptions Models Actually Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow), [Common Tool-Calling Failure Modes](/learn/tools-function-calling/common-tool-calling-failure-modes)
