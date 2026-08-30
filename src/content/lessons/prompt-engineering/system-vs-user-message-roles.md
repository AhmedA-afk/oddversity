---
title: "System vs User Messages: Who Sets the Rules"
track: "prompt-engineering"
status: live
summary: "The system message is resent unchanged every call; the user message is a one-time entry into a growing transcript — that's the whole difference."
duration: "6 min read"
---

[System Prompts vs User Prompts](/learn/prompt-engineering/system-vs-user-prompts) draws the basic line: system is standing configuration, user is the live ask. This lesson is about what "standing" actually buys you mechanically, and what happens the moment you forget it — because the two channels don't just read differently, they *persist* differently, and that's the part that bites in a real multi-turn product.

## What it is

Every call to a chat model carries two kinds of text that end up in the same context window but arrive through different doors. The system message is set once by your application and resent, character for character, on every single request. The user message (and everything in the growing `messages` array after it) is turn-specific content that accumulates — it's added once and then just sits further back in the transcript as the conversation continues. Same window, same model attention mechanism reading both — but one is refreshed every time and the other is a fixed point in history.

## The mental model

Think of the system message as a contract that gets reprinted and handed to the model before it says anything, every single turn — and the user/assistant history as a transcript of what's already happened. A contract you reread before every decision stays load-bearing. A promise you made in the middle of a long meeting, that nobody's mentioned since, is technically still "on the record" — it's just competing with everything said afterward for anyone's attention.

## Why it works this way

Every API call is stateless: the model has no memory between calls, so the harness must resend the *entire* context — system prompt included — every time (see [context window mechanics](/learn/llm-foundations/context-window-mechanics)). Put a rule in the system prompt and it's identical, present, and equally "recent" in positional terms on turn 1, turn 5, and turn 50, because it's re-supplied fresh each time. Put the same rule only in the user's first message and it's a one-time entry — by turn 5 it's sitting behind four more turns of newer content, and models weight recent tokens more heavily than distant ones, a pattern covered directly in [instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency). The rule didn't get deleted. It just stopped being the freshest thing in the room.

## A concrete example (shown)

Same instruction, two placements. First, in the system prompt:

```json
{
  "system": "Always respond in exactly two sentences, no matter the question.",
  "messages": [
    { "role": "user", "content": "What's our refund policy?" }
  ]
}
```

By turn 4 of this conversation, the harness has resent that exact system string three more times — it's still there, untouched, on every call.

Now the same instruction, placed only in the first user turn:

```json
{
  "system": "You are a support assistant.",
  "messages": [
    { "role": "user", "content": "Always respond in exactly two sentences, no matter the question. What's our refund policy?" },
    { "role": "assistant", "content": "Refunds are available within 30 days of purchase, with a receipt." },
    { "role": "user", "content": "What if I lost the receipt?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "And what about a gift I received, not something I bought myself?" }
  ]
}
```

By the fifth message, the two-sentence rule is three turns back in scrollback, competing with everything said since. It's a completely ordinary failure mode for the reply to this last question to run to a full paragraph — nothing enforced the rule after turn 1, because nothing re-supplied it.

## Where it shows up

Any product where a single rule needs to hold for the whole session — tone, a formatting contract, a hard scope boundary — should put that rule in the system message specifically so the harness resends it automatically. This is exactly the foundation [Building a Product Assistant's System Prompt](/learn/prompt-engineering/system-prompt-for-product-assistant) builds on: role, scope, tone, and refusal policy all go in system precisely because they need to hold on turn one and turn thirty equally.

## Watch out for

- **A rule stated once in a user turn isn't durable — there's no mechanism enforcing it later.** If it matters past that one turn, it belongs in the system message, not scrollback.
- **Dumping the live request into the system prompt doesn't help either.** The system channel is meant to be stable and reusable; stuffing the specific question or a one-off exception into it defeats the point and is the first step toward an unreadable, self-contradicting system prompt.
- **Being in the system prompt isn't full immunity from decay.** Over a genuinely long conversation, even resent system content can lose relative influence as the transcript around it grows — see [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state) for the arithmetic behind why, and when a rule needs active re-injection rather than a one-time placement.

## Where next

Placement is the first lever. [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes) covers the next one — what you put *in* that system message once it's there — and a third channel entirely, seeding the assistant's own turn, is covered next in this module.

**Related:** [System Prompts vs User Prompts](/learn/prompt-engineering/system-vs-user-prompts), [Instruction Position and Recency](/learn/prompt-engineering/instruction-position-and-recency), [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state), [Building a Product Assistant's System Prompt](/learn/prompt-engineering/system-prompt-for-product-assistant), [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
