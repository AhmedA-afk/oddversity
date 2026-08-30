---
title: "Before/After: A Role That Earns Its Tokens"
track: "prompt-engineering"
status: live
summary: "One plain prompt, one role clause naming an audience and register, and a countable diff between what each produces."
duration: "6 min read"
---

[What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes) claims a role can shift vocabulary, tone, and format in ways you can actually measure. Here's that claim carried through one real task, start to finish, with a diff you can count instead of eyeball.

## The setup

The task: explain an API error to someone who has to fix it. The error itself:

```
429 Too Many Requests
{"error": "rate_limit_exceeded", "retry_after": 20}
```

**Prompt A (plain):**

```
Explain this API error and how to fix it.

429 Too Many Requests
{"error": "rate_limit_exceeded", "retry_after": 20}
```

**Prompt B (role added — audience and register, not a credential):**

```
You're explaining this to a junior developer, six months into their first job,
who has never worked with HTTP status codes before. Don't use any jargon
without defining it inline, and include exactly one analogy.

Explain this API error and how to fix it.

429 Too Many Requests
{"error": "rate_limit_exceeded", "retry_after": 20}
```

## Step by step

### 1. Run the plain prompt

A representative output for Prompt A:

> *A 429 status code indicates the client has exceeded the rate limit configured for this endpoint. The response includes a `retry_after` field specifying the number of seconds to wait before retrying. Implement exponential backoff in your client-side retry logic, respecting the `retry_after` hint, and consider request batching or caching to reduce call volume if this occurs frequently.*

> **Why this step?** This establishes a real baseline — what a plain, reasonable instruction gets you by default — so the role's effect isn't measured against a strawman. Nothing here is wrong. It's also written for a peer who already knows what "rate limit," "client-side," and "exponential backoff" mean without being told.

### 2. Add the role clause, and nothing else

Same task, same underlying facts, with Prompt B:

> *This error means you knocked on the API's door too many times too fast, and it's asking you to wait before knocking again. "429" is just the API's way of saying "slow down" — every API response has a three-digit code, and codes starting with 4 mean the request itself was the problem, not the server. The `retry_after: 20` part tells you exactly how long to wait: 20 seconds. Think of it like a parking meter — if you try to add more time before the meter resets, it won't let you; you have to wait for the timer to run out first. The fix: catch this error in your code, read the `retry_after` value, pause for that many seconds, then try the request again.*

> **Why this step?** The role clause packed several separate instructions — "define jargon," "use an analogy," "assume no prior knowledge" — into one sentence naming an audience and a register. This is [what a role can do](/learn/prompt-engineering/what-role-prompting-changes) as a compressed instruction: one clause the model has seen paired with exactly this kind of explanatory pattern thousands of times, satisfying several constraints at once instead of needing each spelled out.

### 3. Diff the two outputs on things you can count

| | Prompt A | Prompt B |
|---|---|---|
| Undefined jargon terms | 4+ ("rate limit," "client-side," "exponential backoff," "request batching") | 0 — every term used is defined at first mention |
| Analogy present | 0 | 1 (parking meter) |
| Register | Peer-to-peer | Explaining to someone newer |
| Average sentence length | Longer, compound clauses | Shorter, single-idea sentences |

> **Why this step?** This is the difference between [persona theater](/learn/prompt-engineering/persona-theater-that-does-nothing) and a role that actually specifies behavior. A superlative ("you are a world-class API expert") would have changed none of these four rows — the facts stated would likely be identical to Prompt A's, just with slightly more confident framing. Naming the audience and the register changed all four, and every one of them is something you could check in an automated review, not just a vibe.

## Where it breaks (+fix)

If the audience spec is vague — "explain this simply" instead of naming who the reader actually is — the model tends to default back toward a technical-peer register on anything past a couple of sentences, and jargon creeps back in as the explanation gets longer. Name the audience concretely (a role, an experience level, what they do and don't already know) rather than reaching for a vague adjective like "simply."

If this needs to hold across an entire multi-turn debugging conversation rather than one answer, put the role clause in the system prompt, not a single user turn — a role stated once in the user message decays across turns exactly like any other instruction, as covered in [System vs User Messages: Who Sets the Rules](/learn/prompt-engineering/system-vs-user-message-roles).

## Takeaways

- A role that specifies audience and register isn't decoration — it compresses several separate formatting instructions ("no jargon," "define terms," "use an analogy," "assume less") into one clause.
- Test a role's effect on something countable — jargon terms, sentence length, presence of a specific device like an analogy — not on a general impression that it "reads better."
- The contrast with [persona theater](/learn/prompt-engineering/persona-theater-that-does-nothing) is the whole point: a superlative credential changed nothing checkable here; naming an audience and register changed four separate, countable things.

**Related:** [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes), [Persona Theater: Roles That Change Nothing](/learn/prompt-engineering/persona-theater-that-does-nothing), [System vs User Messages: Who Sets the Rules](/learn/prompt-engineering/system-vs-user-message-roles), [Role Prompting: What Personas Actually Change](/learn/prompt-engineering/role-prompting)
