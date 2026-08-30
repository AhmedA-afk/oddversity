---
title: "Scratchpad and Working-Memory Patterns"
track: "context-engineering"
status: live
summary: "A working-memory store outside the conversation array, so an agent's reasoning trail survives compaction instead of getting summarized away."
duration: "7 min read"
---

Everything in this module so far treats the conversation array as the one thing worth preserving. But an agent's most valuable working state — the plan it's executing, the hypotheses it's already ruled out — often isn't conversation at all. It's bookkeeping. Put bookkeeping in the transcript and it competes with everything else for space and for compaction's judgment about what matters. Put it somewhere else, and compaction can't touch it.

## What we're building

A file-backed `Scratchpad` that an agent reads and writes through explicit tool calls, holding a running plan, a log of things already tried, and free-form notes — entirely separate from the message history a [rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer) or [sliding window](/learn/context-engineering/sliding-window-context-management-deep) operates on. The point isn't the storage format; it's the boundary. Conversation history is what compaction is allowed to compress. The scratchpad is not.

## Setup

Standard library only — `json` and `pathlib`. In a real agent harness this is the same mechanism behind a coding agent's plan file or scratch notes: a real file on disk, read and written via tool calls, exactly like any other file the agent touches.

## Build it

### Step 1: A structured store, not a blob

```python
import json
from pathlib import Path

class Scratchpad:
    def __init__(self, path: str):
        self.path = Path(path)
        if not self.path.exists():
            self._write({"plan": [], "tried": [], "notes": {}})

    def _read(self) -> dict:
        return json.loads(self.path.read_text())

    def _write(self, data: dict) -> None:
        self.path.write_text(json.dumps(data, indent=2))
```

> **Why this step?** A flat text file the agent appends to forever becomes exactly the problem this lesson is trying to avoid — an ever-growing blob nobody curates. Three named sections (a plan, a log of attempts, freeform notes) give the agent a place to put each kind of working state without it all blurring into one undifferentiated scroll.

### Step 2: Writes the agent will actually make

```python
    def set_plan(self, steps: list[str]) -> None:
        data = self._read()
        data["plan"] = steps
        self._write(data)

    def log_attempt(self, hypothesis: str, result: str) -> None:
        data = self._read()
        data["tried"].append({"hypothesis": hypothesis, "result": result})
        self._write(data)

    def note(self, key: str, value) -> None:
        data = self._read()
        data["notes"][key] = value
        self._write(data)
```

> **Why this step?** `log_attempt` is the important one. It's the running memory of "what have I already ruled out" — exactly the thing that, left inside the conversation, is most at risk of being paraphrased into something vague like "the agent investigated the issue" the moment a compaction pass touches it.

### Step 3: A render function the agent reads back deliberately

```python
    def render(self) -> str:
        data = self._read()
        lines = ["## Plan"]
        lines += [f"- {step}" for step in data["plan"]] or ["- (none yet)"]
        lines += ["## Already tried"]
        lines += [f"- {t['hypothesis']} -> {t['result']}" for t in data["tried"]] or ["- (none yet)"]
        if data["notes"]:
            lines += ["## Notes"] + [f"- {k}: {v}" for k, v in data["notes"].items()]
        return "\n".join(lines)
```

> **Why this step?** `render()` is only called when the agent (or the harness) decides it needs the scratchpad, not injected into every turn automatically — the same discipline as [just-in-time context loading](/learn/context-engineering/just-in-time-context-loading). A scratchpad that gets dumped into context on every single turn regardless of relevance has just relocated the token-bloat problem, not solved it.

## Run it

Simulate a debugging session: an agent is chasing a flaky test across many turns, trying one hypothesis per exchange and logging each to the scratchpad as it goes.

```python
pad = Scratchpad("debug_session.json")
pad.set_plan(["Reproduce the failure", "Bisect recent commits", "Fix and verify"])

pad.log_attempt("race condition in the test fixture teardown", "ruled out - fixture is synchronous")
pad.log_attempt("flaky due to unseeded randomness", "ruled out - seed is fixed in conftest.py")
pad.log_attempt("timing-dependent assertion, CI is just slower", "plausible - added a retry, watching")
```

Now suppose the conversation has run long enough that the [rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer) from earlier in this module has fired. Even in the reasonable case — a summary that isn't badly written, just doing its job of compressing — the conversational trace of this investigation typically ends up looking like:

```text
Summary of earlier turns: Investigated a flaky test in the payment module;
root cause not yet confirmed, still in progress.
```

That's a perfectly serviceable summary of *what happened*. It is not a serviceable record of *which hypotheses are already dead*. If the agent's only source of truth were the conversation, its next move risks re-proposing "maybe it's unseeded randomness" — a hypothesis it already ruled out three turns ago — because the summary compressed three specific, falsified hypotheses into one vague sentence.

The scratchpad was never in scope for that compaction pass at all. Read it back explicitly:

```python
print(pad.render())
```

```text
## Plan
- Reproduce the failure
- Bisect recent commits
- Fix and verify

## Already tried
- race condition in the test fixture teardown -> ruled out - fixture is synchronous
- flaky due to unseeded randomness -> ruled out - seed is fixed in conftest.py
- timing-dependent assertion, CI is just slower -> plausible - added a retry, watching

## Notes
```

Every falsified hypothesis is still there, verbatim, exactly as logged — because compaction operates on the message array, and the scratchpad was never part of it. This is the concrete version of the general claim: a scratchpad survives a compaction pass that would otherwise erase the reasoning trail, not through some special resilience, but simply by living outside the thing compaction acts on.

## Harden it

- **Don't let the scratchpad become the new unbounded blob.** `tried` grows forever unless something prunes it — old, clearly-superseded entries can be summarized or archived, the same judgment call from [what to remember vs. forget](/learn/context-engineering/what-to-remember-vs-forget), just applied to working state instead of durable memory.
- **Keep the memory/state line clear.** A scratchpad is task-scoped working memory, not durable cross-session memory — see [memory vs. state](/learn/context-engineering/memory-vs-state-distinction). If something in it (a discovered root cause, a user preference surfaced mid-task) should outlive this session, it needs an explicit write into a real memory store, not just staying in the scratchpad file until it's eventually deleted with the task.
- **Treat scratchpad content as data, not instructions**, especially if any of it originated from tool output or retrieved text rather than the agent's own reasoning — a poisoned note ("ignore previous constraints") read back naively is the scratchpad-shaped version of [context poisoning](/learn/context-engineering/context-poisoning-and-distraction).
- **Guard concurrent writers.** A single JSON file with read-modify-write, as built here, is fine for one agent working alone. Multiple subagents writing to the same pad need file locking or a real key-value store underneath — the interface can stay identical.

## Extend it

For anything more concurrent or queryable than "one file per task," swap the JSON file for one of the backends compared in [structured memory stores](/learn/context-engineering/structured-memory-stores-compared) — a key-value store for the plan and notes, since they're exact-key lookups, keeping the graph and vector options in reserve for genuinely different query shapes. And when a scratchpad fact needs to survive past the end of this session — not just this compaction pass — that's the boundary into [cross-session memory](/learn/context-engineering/cross-session-memory-architecture): a deliberate promotion from working memory to durable memory, never an automatic one.

**Related:** [Scratchpad Patterns: Giving an Agent Somewhere to Think](/learn/context-engineering/scratchpad-and-working-memory-patterns), [Building a Rolling Summarizer](/learn/context-engineering/building-a-rolling-summarizer), [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading), [What to Remember, What to Forget](/learn/context-engineering/what-to-remember-vs-forget)
