---
title: "The Repair Ladder"
track: "structured-outputs"
status: live
summary: "Three rungs of repair, cheapest first, and the discipline of climbing only as far as the failure actually requires."
duration: "6 min read"
---

Not every broken response deserves the same amount of effort to fix, and treating them all the same wastes either time or money — usually both. The repair ladder is the discipline of trying the cheapest fix first and stopping the instant something works.

## What it is

Three rungs, in order:

1. **Deterministic fixups** — no model call at all. Strip a prose wrapper, close an unclosed bracket, coerce an obvious digit-string to a number. Milliseconds, free, and fully predictable.
2. **Re-ask with the validation error attached** — one extra model call, feeding back exactly what failed (see [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures) for what that error looks like per failure type). Costs latency and tokens, but the model usually fixes a specific, named error on the first try.
3. **Constrained re-generation** — fall back to schema-constrained or [grammar-constrained decoding](/learn/structured-outputs/grammar-constrained-generation) for the retry, so the *next* attempt is structurally incapable of repeating the same shape mistake. The most expensive and slowest rung, and the one you reach for least often.

## The mental model

Picture the ladder as a triage line, not a fixed procedure you run start to finish. A patient with a splinter doesn't get sent to surgery because surgery *would* remove it — you use the tool that matches the severity of the problem, and every step up costs more than the step below it. The rule is simple: try rung one; if it visibly worked (the object now parses and validates), stop. Only climb to rung two if rung one wasn't enough. Only climb to rung three if rung two keeps failing in the same way.

Climbing past a rung that already worked isn't cautious, it's wasteful — a truncated object that a bracket-closer fixed instantly doesn't need a full re-ask round-trip on top of it "just in case."

## Why it works this way

Each rung matches a different [failure category](/learn/structured-outputs/failure-modes-taxonomy) because each one requires a different kind of correction:

- **Syntactic failures** (truncation, an unescaped character, a prose wrapper) don't need the model at all — the fix is mechanical, and a deterministic function is faster, cheaper, and more consistent than asking the model to "please output valid JSON this time."
- **Structural failures** (wrong type, wrong enum value, missing field) usually need the model's judgment, but not a second attempt at the whole task — the model already did the hard part (understanding the input); it just needs to be told exactly which field it got wrong and how. That's rung two, and it's [validation-and-auto-repair](/learn/structured-outputs/validation-and-auto-repair)'s core loop.
- **A structural failure that survives rung two** — the model keeps making the same shape mistake even after being told precisely what's wrong — is a sign that prompting alone isn't reliably steering the model's output shape. That's when constrained regeneration earns its cost: it doesn't ask nicely, it makes the wrong shape unreachable. See [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood) for the mechanism.

Climbing straight to rung three for every failure defeats the purpose of having a ladder — you'd pay the heaviest cost on the failures the cheapest fix would have solved in milliseconds.

## A concrete example

A response comes back truncated *and* structurally wrong — the model cut off early, and the field it was mid-way through writing when it got cut is also the wrong type:

```json
{"id": "t9", "priority": "hig
```

**Rung one:** the deterministic bracket-closer produces `{"id": "t9", "priority": "hig"}` — now syntactically valid, but `"hig"` obviously isn't a real priority value. Validation still fails, this time on `priority`, so rung one alone didn't fully resolve it — correctly: it fixed the syntactic half and surfaced the structural half cleanly, rather than masking it.

**Rung two:** re-ask with the specific error (`priority: expected an integer 1-5, got 'hig'`) attached, alongside the original ticket text. The model returns `{"id": "t9", "priority": 3}` on the first try. Validation passes. Stop here — there was never a reason to reach for rung three.

## Where it shows up

Rung one is the exact mechanism behind [incremental JSON repair](/learn/structured-outputs/incremental-json-repair) and the tolerant parsing used while [consuming a stream](/learn/structured-outputs/streaming-structured-output-model) — closing brackets on a partial buffer is the same operation whether the "partial" came from truncation or from a response still arriving token by token. Rung two is the loop built out fully in [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation). Rung three shows up most in high-stakes pipelines — tool-call arguments that trigger a real action, or extraction feeding a database — where a second plain re-ask failing is treated as a signal to stop asking nicely.

## Watch out for

**Skipping rung one because "we'll just re-ask anyway."** A re-ask round-trip costs real latency and a full model call. If the failure is purely syntactic, that cost buys you nothing a bracket-closer wouldn't have gotten for free.

**Climbing to rung three for a semantic problem.** Constrained regeneration guarantees shape, not truth. If the actual problem is a hallucinated value sitting inside a perfectly valid structure, no amount of grammar constraint fixes it — that's not a repair-ladder problem at all, see [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair).

**No stop condition.** A ladder without a hard ceiling on attempts turns into exactly the kind of unbounded loop [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes) warns about — climb methodically, but always with a floor under how many times you'll try before giving up.

## Where next

See the ladder as running code in [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation), and the failure modes it doesn't help with in [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair).

**Related:** [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy), [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation), [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood)
