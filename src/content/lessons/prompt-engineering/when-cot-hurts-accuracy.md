---
title: "When Chain-of-Thought Hurts"
track: "prompt-engineering"
status: live
summary: "A support-triage classifier that gets a correct snap answer, then talks itself into the wrong one once forced to reason."
duration: "6 min read"
---

The same mechanism that makes chain-of-thought work — each reasoning token conditions the next — can also manufacture a plausible-sounding wrong turn on a task that never needed one. Here's that failure caught in the act, on a task where latency was already the wrong thing to spend.

## The setup

A live-chat triage assistant labels each incoming message `urgent` or `normal` so a human agent knows how to route it. The SLA is tight — every added moment of latency delays a real person waiting on the routing decision.

Incoming message: *"hey so my card got charged twice for the same order this morning, can someone look into it whenever, no rush its not blocking me right now"*

This is `normal`. The customer explicitly says "no rush" and "not blocking me right now" — there's no real ambiguity for a competent human triager to resolve.

## Step by step

**Bare zero-shot:** `"Label this message as urgent or normal. Reply with one word."` → **`normal`**, produced instantly as a single output token.

> **Why this step?** This establishes the baseline: a snap classification a competent human would also make immediately from the explicit "no rush" cue. There's no multi-step composition here for reasoning to help with.

**Same message, with "think step by step" appended:**

```text
The customer mentions a card being charged twice, which is a billing
error. Billing errors involving duplicate charges are often flagged as
high-priority in support policies, since they involve real money and
can indicate a payment system issue. Although the customer says "no
rush," billing problems can escalate if not addressed promptly, and a
duplicate charge specifically warrants faster attention regardless of
the customer's own framing.
Label: urgent
```

Illustrative wrong flip: **`urgent`**.

> **Why this step?** This is the actual mechanism, not a coincidence. Forced deliberation gives the model room to construct and follow a plausible-sounding alternate case — once it has written "billing errors are often flagged high-priority," the final label token now conditions on that sentence, the same way any chain-of-thought answer conditions on its preceding steps (see [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does)). The mechanism that makes CoT decompose a hard math problem correctly is the same one that, here, manufactures a countervailing reason a snap read never needed and then dutifully follows it.

## Where it breaks (+fix)

This breaks specifically on clear, low-ambiguity classification with a small fixed label set, decidable from an explicit statement in the text — especially where dwelling on connotation (the emotional weight of "billing error," "charged twice") can override something the customer stated plainly ("no rush"). There's no multi-step composition for the extra tokens to help with, only room for the model to talk itself past the actual answer.

Measuring the trade makes the cost concrete: the bare call generated 1 output token; the reasoning call generated roughly 90 reasoning tokens plus a label — on the order of 90 times more generated content, for a response that also happened to be wrong. Because tokens are generated sequentially, response latency scales roughly with token count, so this isn't just a wasted accuracy bet — it's a direct, measurable latency cost on a task where the SLA was already tight. See [cost and token budget for prompts](/learn/prompt-engineering/cost-and-token-budget-for-prompts) for how that scales across a whole traffic volume, not just one message.

The fix isn't a smarter reasoning prompt — it's not reasoning here at all. Skip chain-of-thought for this task shape entirely. If a genuinely ambiguous subset of messages worries you, don't force reasoning onto every message to catch it — route on a lightweight signal instead (an explicit check for urgency-negating phrases like "no rush"), and reserve any deliberation for the subset that actually needs it. If you want extra reliability without the "talk itself out of it" failure mode, prefer several fast bare zero-shot votes — [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling-explained) — over one deliberated pass: it can still misfire on a genuinely hard case, but it doesn't manufacture a rationalized minority position the way a single forced reasoning trace can.

## Takeaways

- The conditioning mechanism behind chain-of-thought cuts both ways: it decomposes problems that need real steps, and it can inject a rationalized detour into problems that don't have any.
- Latency is a direct, measurable cost of reasoning tokens, not just a secondary accuracy concern — see [cost and token budget for prompts](/learn/prompt-engineering/cost-and-token-budget-for-prompts).
- Rule of thumb: if a competent human would answer without pausing to think, and the label set is small and explicit, don't add reasoning. Measure before you add it, not after — see [prompt evaluation basics](/learn/prompt-engineering/prompt-evaluation-basics).

**Related:** [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Cargo-Cult Reasoning](/learn/prompt-engineering/cargo-cult-reasoning), [Cost and Token Budget for Prompts](/learn/prompt-engineering/cost-and-token-budget-for-prompts), [Which Reasoning Technique When](/learn/prompt-engineering/reasoning-technique-decision-guide), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained)
