---
title: "Placing Instructions So They Stick"
track: "context-engineering"
status: live
summary: "A system instruction the model keeps dropping after long tool use, fixed by restating it right before generation."
duration: "7 min read"
---

An agent is told once, at the top of its system prompt, to always confirm destructive actions before executing them. Turn one through five, it does. By turn fifteen, after a dozen tool calls and file reads, it deletes a resource without asking. The instruction never left the context. It just stopped winning the attention competition.

## The setup

The agent: a file-management assistant with one system instruction —

```text
Before executing any destructive action (delete, overwrite, drop), ask the user
to confirm first. Never skip this step.
```

— followed by a 20-turn session doing routine file organization: listing directories, reading file contents, renaming things, running a dozen tool calls that return file listings and metadata. Turn 18, the user says "clean up the old exports folder," and the agent runs a delete without confirming — the exact behavior the system instruction was written to prevent.

## Step by step

### Step 1: confirm the instruction is actually still in context

Before assuming this is a bug in the model, check the boring explanation first: is the instruction still present in the payload sent on turn 18? In this setup, yes — the system prompt is resent (or persists) on every call, unmodified since turn 1. This rules out the simple failure (the instruction got truncated or dropped by a sliding window — see [Sliding Window Context Management](/learn/context-engineering/sliding-window-context-management)) and points at the more subtle one: presence without effect, the same gap [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) draws between being in context and being used.

> **Why this step?** Fixing the wrong problem — assuming the model "forgot" when the text is provably still there — wastes effort restating something that was never removed. The diagnosis has to rule out truncation before you reach for a positional fix.

### Step 2: measure adherence at instruction-top-only

Run the same 20-turn transcript shape several times, varying only how many filler tool-call turns precede a trigger for the destructive-action rule, with the instruction living solely in the system prompt at the top. Track whether confirmation happens.

| Turns before the trigger | Confirms? (instruction-at-top only) |
|---|---|
| 2 | Yes |
| 8 | Yes |
| 14 | Sometimes |
| 20 | Rarely |

This is an illustrative pattern, not a measured statistic from any specific model — but it's the shape you should expect and should verify directly on your own agent and transcripts, the same way [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle) has you verify the positional effect rather than take it on faith. The instruction's *reliability* degrades as a function of how much has accumulated between it and the point where it needs to fire — this is [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects) playing out directly: the system prompt keeps its primacy advantage, but recency's pull toward the last several tool-heavy turns grows and grows, and eventually outweighs it.

> **Why this step?** You need a baseline before you can claim a fix helped. "It felt more reliable" isn't a comparison — a table of confirm/no-confirm across increasing turn counts is.

### Step 3: add a restatement right before the risky action

Instead of relying on the top-of-prompt instruction alone, inject a short reminder immediately before any turn where a tool call matching a destructive pattern (`delete`, `drop`, `overwrite`) is about to be proposed:

```python
DESTRUCTIVE_PATTERNS = ("delete", "drop", "overwrite", "rm ")

def maybe_inject_reminder(next_user_message: str, tool_context: str) -> str:
    if any(p in tool_context.lower() for p in DESTRUCTIVE_PATTERNS):
        reminder = (
            "[reminder] The action about to be taken looks destructive. "
            "Confirm with the user before proceeding, per your standing instruction."
        )
        return f"{reminder}\n\n{next_user_message}"
    return next_user_message
```

> **Why this step?** This isn't asking the model to remember better — it's putting fresh text, carrying the same rule, at the position with the strongest structural claim on attention: right before generation. It doesn't replace the system prompt; it supplements it exactly where recency's advantage is strongest, which is the fix [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects) recommends for any constraint that has to survive a long session.

### Step 4: re-measure with the restatement in place

Re-run the same transcript shape with the reminder wired in ahead of any destructive-pattern trigger:

| Turns before the trigger | Confirms? (top-only) | Confirms? (top + restated at trigger) |
|---|---|---|
| 2 | Yes | Yes |
| 8 | Yes | Yes |
| 14 | Sometimes | Yes |
| 20 | Rarely | Yes |

> **Why this step?** The comparison is the actual evidence. If restatement genuinely fixes the degradation, the right column should stay flat where the left column visibly drops off — confirming the fix targets the actual mechanism (recency competing against a diluted primacy signal) rather than something else.

## Where it breaks (and the fix)

**Pattern-matching the trigger is brittle.** A simple keyword check on `delete`/`drop`/`overwrite` misses paraphrased destructive intent ("clear out," "wipe," "get rid of") and can also false-positive on benign mentions of the word in a filename. Fix: use a cheap classifier or a second small model call to detect destructive *intent* rather than string matching, if the stakes justify the extra call.

**Restating too often dilutes itself.** If every single turn gets a reminder regardless of relevance, the reminder becomes background noise the model learns to skim past — the same signal-to-noise problem covered in [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context). Fix: gate the restatement on an actual trigger condition, not a fixed interval.

**The system prompt still needs to be right.** Restatement is a patch for recency's pull on long sessions, not a substitute for a correct, clear standing instruction — if the base rule is ambiguous, restating an ambiguous rule more often just gets the ambiguity followed more consistently.

## Takeaways

- Before treating a dropped instruction as a positional problem, confirm it's actually still in the payload — truncation and attention-dilution look similar from the outside but need different fixes.
- Primacy from a system prompt is real but decays in relative influence, not absolute presence, as a session accumulates more recent competing content.
- A short, conditionally-triggered restatement right before the risky action recovers most of the reliability, and costs far fewer tokens than restating everything on every turn.

**Related:** [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects), [Lost in the Middle: Why Position Beats Presence](/learn/context-engineering/lost-in-the-middle), [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context), [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle)
