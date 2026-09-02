---
title: "Stopping Runaway Loops"
track: "tools-function-calling"
status: live
summary: "Three concrete guards that stop an agent from calling the same failing tool forever, and where each one hooks in."
duration: "6 min read"
---

An agent stuck in a loop doesn't crash — it just keeps going, burning tokens and latency on a call that was never going to succeed, until something outside the loop stops it.

## What it is

The tool-call loop — the cycle of the model calling a tool, getting a result, and deciding whether to call again — has no built-in reason to terminate. [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop) covers how that cycle runs normally; this lesson covers what stops it from running forever when something's wrong. Three guards, stacked, catch different ways a loop goes bad:

1. **A hard max-iteration cap.** A ceiling on total tool calls per turn, full stop, regardless of whether each individual call looks reasonable.
2. **Repeated-identical-call detection.** A check that catches the same tool called with the same arguments more than once, which is a much stronger and earlier signal than "we've made a lot of calls."
3. **Escalation after N failures.** After a small number of failed attempts at the same underlying task, stop trying to self-correct and hand control back to a human.

None of the three is sufficient alone. The cap catches loops that vary their arguments each time (so identical-call detection misses them) but never converge. Identical-call detection catches a tight loop fast, well before it would burn through the full cap. Escalation is the only one of the three that actually resolves the underlying problem instead of just stopping the burn.

## The mental model

Think of these as concentric guards, tightest first:

```
tool call
    │
    ▼
is this call identical to a recent failed call?  ──yes──► short-circuit:
    │no                                                    return "already tried,
    ▼                                                       do not repeat" instead
has this task failed N times in a row (any args)? ──yes──► of re-executing
    │no                                                            │
    ▼                                                              ▼
execute the call                                          escalate to user
    │                                                     after N failures
    ▼
has the turn hit the max tool-call cap? ──yes──► stop, force a final response
    │no
    ▼
continue the loop
```

The identical-call check fires first because it's the cheapest and most specific signal of the three — a model resending the exact same failing call is strong evidence that nothing about the context changed for it to condition on, tying directly back to [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics): if the call is identical, the error clearly wasn't informative enough to produce a different one.

## A concrete example (shown)

```python
class ToolLoopGuard:
    def __init__(self, max_calls=12, max_repeats=2, max_task_failures=3):
        self.max_calls = max_calls
        self.max_repeats = max_repeats
        self.max_task_failures = max_task_failures
        self.call_count = 0
        self.call_history = []      # (tool_name, frozenset(args.items()))
        self.consecutive_failures = 0

    def check_before_call(self, tool_name, args):
        self.call_count += 1
        if self.call_count > self.max_calls:
            return "cap_exceeded", "Tool call limit reached for this turn. Stop and report to the user."

        signature = (tool_name, frozenset(args.items()))
        repeats = self.call_history.count(signature)
        if repeats >= self.max_repeats:
            return "repeated_call", (
                f"This exact call to '{tool_name}' with these arguments already failed "
                f"{repeats} time(s). Do not repeat it — try different arguments, a "
                f"different tool, or ask the user for missing information."
            )

        self.call_history.append(signature)
        return None, None

    def record_result(self, ok: bool):
        self.consecutive_failures = 0 if ok else self.consecutive_failures + 1
        if self.consecutive_failures >= self.max_task_failures:
            return "escalate", (
                f"{self.consecutive_failures} consecutive tool failures. "
                f"Stop attempting automatically and ask the user for help or "
                f"confirm how to proceed."
            )
        return None, None
```

`check_before_call` runs *before* dispatch — a short-circuited call never touches the real tool, which is the same before-execution discipline as [Self-Correction When the Model Calls a Tool Wrong](/learn/tools-function-calling/self-correction-on-bad-tool-calls). `record_result` runs after, feeding the escalation branch. Both return a `(reason, message)` pair rather than raising, because the message — like every other error result in this module — has to be legible to the model or the user, not just to your logs.

## Why it works this way

Each guard exists because the failure it catches has a different signature. A tight identical-call loop is detectable in two calls — waiting for a max-call cap to catch it wastes ten more attempts first. A *varying* loop (different arguments each time, never converging — a model trying `"urgent"`, then `"high-priority"`, then `"critical"` against the same broken enum) never repeats a signature, so only the hard cap catches it; identical-call detection would let it run unbounded. And neither guard fixes anything — they just stop the burn — which is why escalation exists as a third layer: after a small number of genuine failures, the right move is often not "try again differently" but "get a human," because repeated failure at varying arguments is itself a signal that the model is missing something it can't self-correct its way to (a missing tool, a permission it doesn't have, a genuinely ambiguous request).

This is also why the retry cap from [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) and the loop cap here are deliberately separate counters. The retry cap bounds *code* retrying a single transient failure a few times before giving up. The loop cap bounds the *whole turn* — how many tool calls the model gets to make in total, across possibly many different tools and tasks. Sharing one counter between them means a few transient network blips can eat the budget meant for legitimate multi-step work.

## Where it shows up

These guards hook directly into [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop) at the point right before dispatch and right after result-handling. [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop) walks a real trace where the identical-call guard was missing and shows what adding it changes. The escalation branch is one leg of the fork covered fully in [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies).

## Watch out for

- **A cap so high it's decorative.** A max-call cap of 500 "just in case" never actually fires before the user gives up waiting — set it to the real expected depth of a legitimate task plus headroom, not an arbitrary large number.
- **Comparing call signatures too loosely.** If your identical-call check ignores argument order or normalizes types inconsistently, near-identical calls slip through uncaught; if it's too strict (comparing a timestamp field that changes every call even when nothing else does), it never fires at all. Match on the fields that actually determine behavior.
- **Shipping without any of the three.** This is common enough to get its own entry in [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes) — an agent with no iteration cap fails safely right up until the one time it doesn't, usually in production, usually expensively.

## Where next

[Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop) is the applied companion to this lesson — a real trace, diagnosed and fixed. For the decision of *what* happens once a guard fires, see [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies).

**Related:** [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop), [Debugging a Stuck Agent](/learn/tools-function-calling/debugging-a-stuck-agent-loop), [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools), [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies)
