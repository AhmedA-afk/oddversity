---
title: "Fail to the Model, the User, or Silently Retry"
track: "tools-function-calling"
status: live
summary: "Four ways to surface a tool failure, mapped onto the failure taxonomy so the choice stops being a judgment call."
duration: "6 min read"
---

Once you know a tool call failed, there are only a few places the failure can actually go — and picking the wrong one is how a 429 becomes a support ticket, or a permission error becomes a silent retry loop that never resolves.

## Return to the model

The failure is reported as a normal tool result, and the model gets the next turn to react — reissue the call with different arguments, try a different tool, or decide it can't proceed and say so.

**How it works:** the error is formatted per [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) and placed in the same message slot a successful result would occupy. The model conditions on it exactly as described in [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics).

**When it wins:** the model caused the failure and has (or can infer) what's needed to fix it — a bad argument, a wrong tool, a hallucinated name. This is the majority case for reasoning-caused failures.

**Failure mode:** if the error message doesn't actually name the problem, the model has nothing to correct and can retry blind, guess a different wrong value, or drift toward an unrelated tool — the exact trap in [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example). It also fails if the model genuinely lacks the missing piece (an ID only the user has) — in that case returning to the model just relays the failure one hop later, to the user, with extra latency in between.

**Relative cost:** one extra turn (tokens + latency), no human interruption. Cheapest recoverable option when it works.

## Escalate to the user

The agent stops trying to resolve the failure itself and asks a person — for missing information, for a decision it isn't authorized to make, or for confirmation before a risky action proceeds.

**How it works:** the harness (not the model, and not silently) surfaces a message asking for what's missing: a credential, a disambiguating choice, explicit sign-off on something destructive. This is the human branch of the fork in [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries).

**When it wins:** the missing piece is something only a person has — authorization the model can't grant itself, a genuinely ambiguous request with two valid interpretations, a credential that was never in context to begin with. Also right for anything gated by [Approval Gates for Sensitive Tools](/learn/tools-function-calling/approval-gates-for-sensitive-tools) regardless of whether the call would otherwise have succeeded.

**Failure mode:** escalating too eagerly turns an agent that should have self-corrected into one that interrupts the user for things it could have handled — a `404` on a mistyped city name doesn't need a human, a corrected spelling does. Over-escalation trains users to stop trusting the agent to do anything on its own.

**Relative cost:** highest — it stops the automated flow entirely and waits on a person, which can be seconds or hours depending on the channel.

## Silently retry in code

The failure never reaches the model or the user at all. Code catches it, waits, and tries again — success and failure both happen invisibly from the model's point of view, except for the eventual outcome.

**How it works:** exactly the transient-failure branch from [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) — exponential backoff with jitter, capped at a small number of attempts, all inside the tool-dispatch layer.

**When it wins:** the failure is genuinely transient and nothing the model knows would change the outcome — a timeout, a 429, a momentary connection drop. The model has no power over a downstream service being briefly overloaded, so showing it the failure just wastes a turn.

**Failure mode:** applied to a deterministic failure, this is the classic bug — a `400` retried three times returns the identical `400` three times, burning latency for a guaranteed non-result. It's also risky on non-idempotent calls: retrying a write that may have already succeeded server-side (a timeout that fired after the write landed) can duplicate the effect unless the call is idempotent or checked first.

**Relative cost:** cheapest per-attempt (no extra model turn), but bounded — it must give up and route elsewhere after a small cap, or a persistent outage turns into an agent that hangs indefinitely on one call. See [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps) for the cap that has to sit on top of this.

## Fail hard and stop

The turn ends without a fix attempted — no retry, no self-correction attempt, no escalation prompt. The agent reports the failure plainly and does nothing further with that tool call.

**How it works:** used as a deliberate last resort, not a default — typically triggered by a guard (max iteration cap hit, repeated-failure streak, a genuinely unrecoverable exception) rather than chosen per-error. The response names what was attempted and what failed, honestly, without pretending to have succeeded or continuing to try.

**When it wins:** every other option has been exhausted or is inappropriate — the retry cap is spent, the model has already tried self-correcting and failed identically twice, or the failure is severe enough (auth entirely misconfigured, a tool permanently removed) that further attempts are pure waste. Also right when continuing silently risks a worse outcome than stopping — a partial multi-step transaction where retrying blind could leave data in a bad state.

**Failure mode:** used too readily, this produces an agent that gives up on the first hiccup instead of trying the cheap recoveries first — a single timeout shouldn't end the turn if a silent retry would have resolved it in half a second.

**Relative cost:** cheapest in compute (no more calls made), but highest in user-perceived reliability if it's reached without the cheaper options being tried first.

## Decision table

| Approach | Best for (taxonomy class) | Model sees it? | User sees it? | Typical cap |
|---|---|---|---|---|
| Return to model | Wrong tool, bad args, hallucinated call | Yes | No (until model reports) | 2-3 attempts per call |
| Escalate to user | Permission gap, real ambiguity, sensitive action | No | Yes, immediately | N/A — one-shot |
| Silent retry in code | Timeout, 429, 503 (transient) | No (unless cap exceeded) | No | 3-4 attempts, backoff |
| Fail hard and stop | Cap exceeded, repeated identical failure, unrecoverable error | Told after the fact | Yes, immediately | N/A — terminal |

## How to choose

Start from the taxonomy in [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures) and let the class pick the default: timeouts and execution errors from flaky infrastructure default to silent retry; wrong tool, bad arguments, and hallucinated names default to return-to-model; anything gated on authority or genuine ambiguity defaults to escalate-to-user. Fail-hard isn't really a fourth *default* — it's where every path ends up once its own cap is exhausted, which is why [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps) matters regardless of which of the first three approaches you started with.

The one rule that holds across all four: never let a failure resolve to *nothing visible happening*. Silent retry is fine because the eventual outcome — success or an escalation once the cap is hit — is still visible somewhere. What's never acceptable is catching an exception, returning as if the call succeeded, and leaving both the model and the user believing something happened that didn't — that's the first entry in [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes), and it's the one anti-pattern all four of these approaches are designed to avoid.

**Related:** [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries), [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps), [Approval Gates for Sensitive Tools](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes)
