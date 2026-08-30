---
title: "System, User, Assistant: The Message Envelope"
track: "genai-app-dev"
status: live
summary: "The roles array is a contract, not a formality — where you put text changes how strongly the model treats it."
duration: "6 min read"
---

Two prompts can contain the exact same words and behave completely differently, because one put an instruction in the system slot and the other buried it in the user turn. The roles array isn't bookkeeping — it's the actual mechanism you're programming with.

## What it is

Every chat-style model call takes a `messages` array where each entry is tagged with a role — almost always `system`, `user`, or `assistant`. That tagging is the entire interface for telling the model "this part is standing instruction" versus "this part is what just happened." Here's a tone-controlled summarizer's envelope:

```json
[
  { "role": "system", "content": "Summarize input text. Tone: upbeat and concise." },
  { "role": "user", "content": "Q3 revenue missed target by 12%; churn rose to 8%." }
]
```

Swap which role carries the tone instruction and the model's *weighting* of that instruction changes — not just where the text physically sits.

## The mental model

Think of the system message as the standing contract for the whole conversation, and each user/assistant pair as a transcript of what's actually been said under that contract. The system message is written once (or updated rarely) and holds behavior that should survive every turn: tone, output format, hard constraints. The user and assistant messages are the accumulating history — each real exchange appends one of each.

```text
system:    "Tone: upbeat and concise."          ← set once, applies to everything below
user:      "Q3 revenue missed target by 12%..."  ← turn 1
assistant: "Q3 had a rough quarter, but..."       ← turn 1's reply
user:      "Now do Q4."                           ← turn 2, same contract still applies
```

Nothing forces you to only send one user message — you can hand the model a full back-and-forth transcript in a single call, which is exactly what a multi-turn chat feature does before every request: replay the accumulated history, then append the newest turn.

## Why it works this way

Providers train models to treat these roles with different priority, roughly in this order: system instructions are meant to be the most stable and hardest to override, user content is the immediate ask, and assistant content is the model's own prior output, included so it can maintain continuity with what it already said. That ordering is why "tone: upbeat and concise" belongs in the system slot rather than glued onto the front of the user's data — put it in the user turn instead, and a long or oddly worded piece of user content can crowd it out or make the model treat it as negotiable rather than standing.

This also explains why the system message is the right place for anything that should hold across every future call this feature makes, and the user message is the wrong place for it: mixing "the instruction" and "this request's data" into one blob makes it easy for user-supplied text to look like part of the instruction — which is the seam [prompt injection](/learn/genai-app-dev/guardrails-and-input-validation) attacks exploit later in this course.

## A concrete example

Here's the same summarizer handling a second request in the same session, with the accumulated history included:

```json
[
  { "role": "system", "content": "Summarize input text. Tone: upbeat and concise." },
  { "role": "user", "content": "Q3 revenue missed target by 12%; churn rose to 8%." },
  { "role": "assistant", "content": "Q3 had a soft quarter, but there's real signal to build on for Q4." },
  { "role": "user", "content": "Now do the same for Q4: revenue up 15%, churn flat." }
]
```

The system message didn't need to be repeated or restated — it applies to the whole array once, for every turn that follows. The assistant turn from the first exchange is included not because you need it summarized again, but because it gives the model continuity: it can now match its own established voice on the second answer rather than starting cold.

## Where it shows up

Every feature in this course that takes more than one input from the same user is doing this accumulation. [Session, State, and Multi-Turn](/learn/genai-app-dev/session-state-multi-turn) covers how you actually store and replay that growing array between requests, and [Trimming Conversation History](/learn/genai-app-dev/trimming-conversation-history) covers what to do once the array gets too large to send in full. The [temperature and sampling settings](/learn/genai-app-dev/tuning-sampling-params-in-an-app) you choose apply to the whole call regardless of role — the envelope shapes *what* gets sent, not how deterministically it gets read.

## Watch out for

- **Putting per-request data in the system message.** It technically works, but it means rebuilding (and re-sending) the "standing" part of your prompt on every single call instead of once, and it blurs the line between instruction and data that keeps your prompt maintainable.
- **Forgetting the assistant role exists for a reason.** Skipping it and only ever sending user messages means the model has no record of what it already told this user — expect it to repeat itself or contradict its own earlier answer.
- **Assuming role placement is a strict guarantee, not a strong bias.** A system instruction shifts the odds heavily but isn't an unbreakable rule — it's still worth validating output rather than trusting the system prompt to be airtight. That's exactly the gap [output validation](/learn/genai-app-dev/structured-output-in-apps) exists to close.

## Where next

The next lesson in this module, [Temperature, top_p, and max_tokens in Practice](/learn/genai-app-dev/tuning-sampling-params-in-an-app), covers the parameters that sit alongside this same `messages` array in the request — same envelope, different knob.

**Related:** [Your First LLM API Call](/learn/genai-app-dev/your-first-llm-api-call), [Session, State, and Multi-Turn](/learn/genai-app-dev/session-state-multi-turn), [Trimming Conversation History](/learn/genai-app-dev/trimming-conversation-history), [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation)
