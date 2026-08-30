---
title: "Repair-Loop Mistakes"
track: "structured-outputs"
status: live
summary: "Five ways a repair loop that looks safe in testing turns dangerous or expensive under real production traffic."
duration: "7 min read"
---

A repair loop that only ever gets tested against a handful of fixable failures looks harmless. Every mistake below only shows itself once the loop meets a failure it can't actually fix, or meets it a thousand times a second.

### The mistake: no hard cap on attempts

**Why it's wrong:** a loop that keeps re-asking until it succeeds assumes every failure is eventually fixable by asking again. It isn't — a systematically wrong prompt, a schema the model genuinely can't satisfy, or a truly missing piece of information will fail identically on attempt one and attempt fifty. Without a ceiling, the loop either runs until a provider timeout kills the whole request or, worse, actually completes eventually by coincidence, teaching you nothing about how close it came to hanging.

**Symptom:** p99 latency spikes with no corresponding spike in traffic, or a single request that appears to hang for far longer than any individual model call should take.

**Fix:** a fixed, small `max_attempts` — [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation) uses two or three — with a typed "gave up" result on exhaustion, never a silent retry past it.

### The mistake: repairing into valid-but-wrong

**Why it's wrong:** a repair step under pressure to "just make it pass" can coerce an ambiguous field into a value that satisfies the schema without being true — a missing required field filled with an empty string, an unparseable date normalized to a guess. Validation passing after that is worse than validation failing, because the failure is now invisible: it looks like clean data everywhere downstream.

**Symptom:** structurally perfect records in production that are quietly wrong — caught, if at all, much later and far from the code that introduced the problem.

**Fix:** restrict automated repair to fixes with exactly one unambiguous correct answer — stripping a prose wrapper, closing a bracket, coercing `"5"` to `5`. Anything that requires the model (or your code) to *invent* a value belongs to [reject-and-review](/learn/structured-outputs/when-not-to-repair), not to a repair rung.

### The mistake: swallowing the real error

**Why it's wrong:** logging only "repair succeeded" and discarding the validation error that triggered it throws away the one piece of information that would tell you *why* the model keeps needing to be corrected. A repair loop that works is still a workaround; if the underlying cause — a prompt regression, a schema that drifted from what the model was trained against — never gets logged, it never gets fixed at the source, and the retry tax never goes away.

**Symptom:** the repair-attempt rate for one schema creeps upward over weeks and nobody notices, because every individual request still eventually "succeeds."

**Fix:** log every attempt's specific error — field, type, message — even on a successful outcome, and alert on the *rate* of repairs needed per schema over time, not just on outright failures. [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies) working consistently is a sign of a healthy system; needing it more and more often is a leading indicator, not a non-event.

### The mistake: retry storms under load

**Why it's wrong:** if every failed validation immediately triggers its own independent re-ask with no shared circuit-breaker, a single bad deploy — a prompt template change, a schema edit that the model wasn't re-tested against — turns every affected request into up to `max_attempts` times its original call volume, hitting the model provider hardest exactly when things are already going wrong.

**Symptom:** a spike in API cost or a wave of rate-limit errors that lines up suspiciously well with a recent deploy time.

**Fix:** track a rolling repair-success rate per schema or prompt. If it drops below a threshold, stop retrying per-request and fail straight to reject/fallback until the rate recovers — a circuit breaker, not an independent decision made fresh by every single failing request.

### The mistake: reusing a stale correction message

**Why it's wrong:** if attempt two sends the exact same correction prompt as attempt one — because the code cached it instead of rebuilding it from the *latest* validation error — there's no new information for the model to act on, and no reason to expect a different result. This quietly burns an attempt out of your budget for nothing.

**Symptom:** a repair loop that "succeeds" only on its last possible attempt by what looks like coincidence, or one that exhausts its full budget on an error that a fresh, specific correction would have fixed on the first retry.

**Fix:** always rebuild the correction message from the most recent errors, every single attempt — never from the first failure alone. [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation)'s `build_correction_prompt` is called fresh inside the loop for exactly this reason.

## Pre-flight checklist

- A hard, non-negotiable `max_attempts` exists, and every code path through the loop respects it.
- Every automated fix has exactly one correct answer — nothing in the repair path invents a value to make validation pass.
- Every attempt's specific error is logged, whether or not that attempt eventually succeeds.
- A rolling success-rate circuit breaker exists so a systemic failure fails fast instead of multiplying load.
- The correction message is rebuilt from the latest error on every attempt, never cached from the first one.

**Related:** [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation), [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Failure-to-Repair Cheatsheet](/learn/structured-outputs/failure-and-repair-cheatsheet)
