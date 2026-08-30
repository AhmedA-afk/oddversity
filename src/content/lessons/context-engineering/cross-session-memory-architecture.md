---
title: "Memory Across Sessions"
track: "context-engineering"
status: live
summary: "Storing a fact is one write - keying it, deciding when it earns a write, and knowing when it's gone stale are the actual design problems."
duration: "8 min read"
---

Storing a fact across sessions is one line of code. The hard part is everything around that line: whose fact is it, when does something stop being a one-off and become worth keeping, and what happens the day it stops being true. This is the deferred depth behind [memory vs. state](/learn/context-engineering/memory-vs-state-distinction) — worth returning to once the state/memory boundary itself is second nature.

## The three architectural questions

Cross-session memory is really three separate decisions wearing one name:

1. **Keying** — what identity does a fact attach to, so it can be found again in a session that shares no conversation array with the one that produced it?
2. **Write policy** — what has to happen before something crosses from "this came up" to "this is now durable"?
3. **Re-entry** — of everything durable that's true about this identity, what actually gets pulled into *this* session's context, and how much?

Get any one of the three wrong and the whole system either forgets things it should keep or confidently serves things that are no longer true.

## Keying memory to identity

Session state is keyed by session id, and that's correct — it should die with the session. Memory needs a key that outlives the session: a user id, an account id, sometimes a narrower scope like a specific project or workspace nested under it. The narrower key matters more than it looks: a fact that's true of "this user, on this project" — a coding style enforced by a specific team's linter, say — shouldn't surface in a session about a different, unrelated project just because it's the same person. Key facts to the entity they're actually true of, not reflexively to whichever identity is easiest to grab at write time.

## Write policies: when does a fact become memory

Two different write patterns need different bars for confidence before they commit anything:

- **Explicit statement.** The user says "remember that I prefer TypeScript" or "I'm always in IST." This is about as high-confidence as a fact gets — someone stated it as a fact about themselves — and it can be written immediately, in a form that can still be corrected later.
- **Inferred from behavior.** The user has picked TypeScript in three unrelated sessions without ever saying so explicitly. A single observation shouldn't become a durable fact — that's how a one-off exception (a project that genuinely needed a different language) gets promoted into a false standing preference. A threshold — observed consistently across N sessions, or above some confidence the extraction step assigns — is the right gate, and it's the same judgment call as [what to remember vs. forget](/learn/context-engineering/what-to-remember-vs-forget) applied specifically to the promotion-from-behavior case.

Either way, the extraction step that decides "this is worth writing" should be a distinct pass from ordinary [compaction](/learn/context-engineering/summarization-for-compaction). Compaction's job is shrinking a conversation that's about to overflow a window; a memory-write pass's job is scanning for durable, identity-scoped facts regardless of whether the window is anywhere near full. They can share machinery, but conflating them means memory only gets written when a window happens to fill up, which has nothing to do with when something durable actually happened.

## Staleness: the failure that's worse than forgetting

A memory store that never expires or corrects anything eventually serves facts that are confidently wrong — a job that's changed, a preference that's reversed, a constraint that no longer applies. This is a worse failure than having no memory at all, because a wrong fact stated with full confidence is harder for a user to catch and correct than an honest "I don't know."

Three mechanisms keep staleness in check:

- **Expiry.** Not every fact has the same shelf life. "Works in IST" is stable for years; "currently blocked on the legacy migration" has a shelf life of weeks. Facts with an inherently short natural lifetime should carry a shorter TTL, or be tagged as task-adjacent and reviewed rather than surfaced indefinitely.
- **Explicit correction, not silent append.** When a user directly contradicts an earlier fact, that correction should supersede the old value, not sit alongside it as an equally-weighted alternative memory the retrieval step might resurface at random.
- **Versioning over overwriting.** Keep the old value, marked superseded, rather than deleting it outright. If the agent ever says something surprising, being able to trace which memory write produced it — and when it was corrected — is the difference between a fixable bug and an unexplainable one.

This is the same principle [structured memory stores](/learn/context-engineering/structured-memory-stores-compared) makes concrete for knowledge graphs: updating a fact means retiring an edge, not hoping a new embedding happens to out-rank a stale one in similarity search.

## Worked scenario: greeting a returning user correctly

A user, Priya, tells a coding assistant a month ago: *"I'm on Python 3.9, can't upgrade because of a legacy dependency."* Two weeks later, in an unrelated conversation, she mentions in passing: *"we finally migrated off the legacy service, I'm on 3.11 now."* Today, she opens a brand-new session.

The write path, correcting rather than appending:

```python
def write_fact(memory_store, user_id, fact_key, value, written_at):
    for f in memory_store.setdefault(user_id, []):
        if f["key"] == fact_key and f["status"] != "superseded":
            f["status"] = "superseded"
    memory_store[user_id].append({
        "key": fact_key, "value": value,
        "written_at": written_at, "status": "current",
    })
```

The read path, at the start of the new session:

```python
def latest_fact(memory_store, user_id, fact_key):
    candidates = [f for f in memory_store.get(user_id, [])
                  if f["key"] == fact_key and f["status"] != "superseded"]
    return max(candidates, key=lambda f: f["written_at"], default=None)
```

Get this wrong and the greeting is: *"Welcome back — I'll keep suggestions compatible with Python 3.9."* — a stale fact, superseded two weeks ago, served with full confidence. Get it right and `latest_fact` returns the 3.11 entry because the 3.9 entry's status is `superseded`, and the greeting is: *"Welcome back — I'll write for Python 3.11."* The mechanism is almost embarrassingly simple; the discipline that makes it work is that the write path always supersedes on a genuine correction instead of letting two contradictory facts sit at equal weight, waiting for a coin flip at read time.

## The precise tradeoff at re-entry

Once a session starts, how much of what the memory store holds should actually enter context? Two ends of a real tradeoff:

- **Inject everything the store holds about this user.** Maximizes recall — nothing durable is ever missed — but pays a token cost on every single session regardless of relevance, and risks a fact surfacing somewhere it reads as bizarre: a seat preference showing up unprompted in a debugging session. This is [context stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) applied to memory instead of documents, and it has the same failure shape.
- **Retrieve only what's scoped to this session's apparent topic**, plus a small, always-injected set of identity-level facts cheap enough to never gate — a name, a communication-style preference. This minimizes cost and irrelevant surfacing, at the risk of a retrieval miss: a fact that actually was relevant this time, filtered out because the retrieval step scored it as off-topic.

No architecture removes this tradeoff — it only lets you set the dial deliberately instead of by accident. Keep the always-injected set genuinely small and genuinely cheap, gate everything else behind retrieval scoped to the current session the same way [just-in-time context loading](/learn/context-engineering/just-in-time-context-loading) gates any other external content, and measure retrieval misses the same way you'd measure any other recall problem rather than assuming a bigger always-inject set is the safe default.

**Related:** [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Structured Memory Stores](/learn/context-engineering/structured-memory-stores-compared), [What to Remember, What to Forget](/learn/context-engineering/what-to-remember-vs-forget), [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading)
