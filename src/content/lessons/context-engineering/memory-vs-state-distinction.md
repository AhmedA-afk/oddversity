---
title: "Memory vs State"
track: "context-engineering"
status: live
summary: "Two different lifecycles hide behind 'the agent remembers' - durable memory that should persist, and working state that should not."
duration: "6 min read"
---

A user books three flights with the same assistant, weeks apart. Each time, it should already know they prefer an aisle seat. Each time, it should have zero memory of the half-finished booking they abandoned last visit. Getting both of those right at once depends on drawing one line correctly, and most "the bot forgot me" or "the bot is stuck on my old order" complaints trace back to that line being blurred.

## What it is

[Memory vs. state](/learn/context-engineering/conversation-memory-and-state) at the turn, session, and cross-session level establishes *where* things live. This lesson names the binary underneath that directly, because it's the decision you actually have to make about every single value your agent produces: is this **state** or is this **memory**?

**State** is data scoped to the task currently in progress. It exists to let this specific piece of work get done — a form being filled in, arguments gathered for a pending action, a plan mid-execution — and it's meant to be discarded when the task ends, whether it succeeds, fails, or is simply abandoned.

**Memory** is data meant to outlive any single task. It's keyed to something durable — a user, a project, an account — written because someone (a person or the agent itself) judged it worth keeping, and re-surfaced later specifically because it's expected to still be true.

## The mental model

Picture two separate stores with different lifecycles, not two flavors of the same thing:

- **State** is born when a task starts, gets updated on every step of that task, and is killed when the task ends. Nothing about finishing (or abandoning) a task promotes its state into anything longer-lived by default.
- **Memory** is born from an explicit "this is worth keeping" decision, written once, read back by a retrieval step in *future, otherwise-unrelated* sessions, and updated only when corrected — not on every interaction.

State is a scratch buffer for building one specific output. Memory is a filing cabinet for facts about an entity that persists past any output. Something can move from one to the other — a preference that surfaces mid-task can get promoted into memory — but that promotion has to be a deliberate, separate write, never the automatic fate of everything that happened to pass through state. This is the same discipline built concretely in [scratchpad and working-memory patterns](/learn/context-engineering/scratchpad-working-memory-patterns): working state gets discarded by default, and only what's explicitly promoted survives.

## Why it works this way

Getting this boundary wrong costs you in a specific, predictable way depending on which direction you get it wrong.

Treat state as if it were memory — never discard it — and stale, in-progress values start leaking into sessions where they no longer apply. An abandoned draft resurrected as if it were a standing fact. A half-filled form treated as intent. The user experience is an assistant that seems confused about what's currently true.

Treat memory as if it were state — discard it at the end of every task — and the assistant re-asks questions it was already told the answer to, loses continuity a user reasonably expects, and never accumulates anything about the person it's talking to. This is the far more common failure, and it's what most "this chatbot has no memory" complaints actually are.

The working test: would this value still be correct and useful if the user came back in a month having done something entirely unrelated in between? If yes, it's a memory candidate. If it only makes sense in the context of the specific thing currently in progress, it's state, and it should die with the task.

## A concrete example

A user starts booking a flight from New York to San Francisco for next Tuesday, picks economy, then an aisle seat, reaches the payment step, and closes the app. Two weeks later, they open a new session to book a completely different flight, Los Angeles to Chicago.

**State** this session held — and should discard entirely:

```python
task_state = {
    "destination": "SFO",
    "date": "next Tuesday",
    "seat_class": "economy",
    "seat": "14C",
    "payment_step": "awaiting card details",
}
# scoped to this one booking attempt; discarded on completion, failure, or abandonment
```

None of it applies to the new trip. Carrying `payment_step: "awaiting card details"` forward would be actively wrong — there's no cart to resume paying for.

**Memory** that should have been written during the seat-selection step, independent of whether the booking ever completed:

```python
user_memory = {"preferred_seat": "aisle"}
# keyed by user id, read at the start of every new task, written only when
# something looks like a durable preference — not a mirror of every state change
```

The difference shows up directly in what the agent does next. Getting it wrong looks like: *"Should I resume your San Francisco booking — seat 14C, awaiting payment?"* — stale task state, resurrected as if it were memory, for a booking that was abandoned two weeks ago. Getting it right looks like: *"I'll default to an aisle seat for this one too — let me know if you'd like something different."* — a real preference, correctly decoupled from the fate of the specific task it was first observed in.

## Where it shows up

A coding agent has state (the current diff, the plan for this session's task) and memory (the user's stated style preferences, noted once and applicable to every future session). A support bot has state (the details collected for the ticket open right now) and memory (the customer's account tier, past escalation history). Any agent that spans more than one task needs this line drawn somewhere — see [memory across sessions](/learn/context-engineering/cross-session-memory-architecture) for how the memory side of that line actually gets read back into context on a later visit, and [structured memory stores](/learn/context-engineering/structured-memory-stores-compared) for where a promoted fact should physically live.

## Watch out for

- **Auto-promoting everything in state "just in case."** Every value that passes through a task isn't a memory candidate — most of it is exactly as disposable as it looks. Over-promotion produces retrieval noise later; see [what to remember, what to forget](/learn/context-engineering/what-to-remember-vs-forget) for the judgment call.
- **Never promoting anything.** The opposite failure — an assistant that treats every session as the first one — is the more common complaint, and it usually isn't a technical limitation, it's simply that nothing was ever wired to write a durable fact anywhere.
- **Confusing "survives a page reload" with "is memory."** A session id or cookie that keeps an in-progress task alive across a browser refresh is still state — it's the same task, just not yet abandoned. Surviving a reload is not evidence something should be treated as durable across genuinely separate sessions.

## Where next

The clean version of this boundary in code is the state side, built out fully in [scratchpad and working-memory patterns](/learn/context-engineering/scratchpad-working-memory-patterns). The memory side — how a promoted fact gets keyed, written, and correctly re-surfaced on a much later visit — is [memory across sessions](/learn/context-engineering/cross-session-memory-architecture), with [structured memory stores](/learn/context-engineering/structured-memory-stores-compared) covering where it should actually live once you've decided to keep it.

**Related:** [Memory vs State: What Persists Across Turns and Sessions](/learn/context-engineering/conversation-memory-and-state), [Scratchpad and Working-Memory Patterns](/learn/context-engineering/scratchpad-working-memory-patterns), [Memory Across Sessions](/learn/context-engineering/cross-session-memory-architecture), [What to Remember, What to Forget](/learn/context-engineering/what-to-remember-vs-forget)
