---
title: "Managing State Across a Multi-Turn Conversation"
track: "prompt-engineering"
status: live
summary: "The arithmetic behind instruction decay, a precise policy for when to re-inject a rule, and what summarizing history actually has to preserve."
duration: "8 min read"
---

*This is a deep-dive on the mechanics behind [Multi-Turn Prompt Design](/learn/prompt-engineering/multi-turn-prompt-design)'s claim that instructions decay over a conversation — optional depth if you want the token-budget arithmetic and a concrete re-injection policy, not just the practice-level advice.*

A rule stated once at the top of a long conversation is, technically, still there on turn twenty — the harness resends the system prompt on every call, unchanged. And yet it gets violated anyway, often on exactly the turn where it mattered most. Two separate, compounding effects explain why, and both are precise enough to reason about with real numbers.

## Where the decay actually comes from

**Recency weighting.** Models attend to the whole context on every forward pass, but they don't weight every position equally — content nearer the current turn tends to have more influence over the immediate next tokens than content many turns back, an effect covered directly in [Instruction Position and Recency](/learn/prompt-engineering/instruction-position-and-recency). A rule sitting in the system prompt is positionally fixed at the *start* of the context; every new turn adds distance between it and wherever generation is currently happening.

**Proportional dilution.** Independent of any positional weighting, an instruction's raw share of the total context keeps shrinking as the conversation grows, because the system prompt's token count is fixed while the transcript's keeps climbing. This part is just arithmetic, and it's worth doing once with concrete, clearly-illustrative numbers.

Say a system prompt runs 400 tokens, including one 15-token constraint: "Never reveal a customer's full payment method — mask it to the last 4 digits." On turn 1, with one short user message (~50 tokens), the total context is about 450 tokens, and the constraint is `15 / 450 ≈ 3.3%` of everything the model is conditioning on.

By turn 8, assume each turn (user message plus assistant reply) averages around 180 tokens across a realistic troubleshooting back-and-forth. Eight turns adds roughly `8 × 180 = 1,440` tokens of history. Total context is now `400 + 1,440 = 1,840` tokens, and the same constraint — byte-for-byte identical, still fully present — is now `15 / 1,840 ≈ 0.8%` of context. Its proportional share dropped by roughly 4x, with nothing about its actual text having changed at all.

This is a simplification — attention isn't literally a matter of raw token *share*, it's a learned, position-sensitive weighting — but it's an honest lower-bound intuition for why "still technically present" and "still equally influential" are different claims, and it pairs directly with the qualitative recency effect above. [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) covers how a fixed window actually fills up turn by turn as the transcript grows.

## When to re-inject the system prompt

Three policies, with real tradeoffs, not one universally correct answer:

| Policy | Reliability | Cost | Best for |
|---|---|---|---|
| Re-inject the full system prompt every turn | Highest | Highest — the harness already does this by default, so this is really "don't shrink it," but a full resend is real token cost on every call | Small, critical system prompts; high-stakes actions |
| Re-assert just the highest-stakes constraint at phase boundaries | Good, targeted | Moderate | Multi-phase tasks — draft, then critique, then finalize |
| Rely on the initial system message alone, never re-assert anything | Lowest for late-turn constraints | Lowest | Short conversations; low-stakes rules |

The middle option is usually the right default, and it's more precise than a fixed timer. Re-assert the specific constraint that matters most *immediately before the turn most likely to violate it* — right before the model produces a final answer, executes an action, or responds to a request that brushes up against the boundary — rather than every fixed N turns regardless of what's actually happening in the conversation. This extends [Multi-Turn Prompt Design](/learn/prompt-engineering/multi-turn-prompt-design)'s "re-anchor periodically" advice into a targeted policy: the trigger is the risky turn, not the turn counter.

## Summarizing history to fit the window

When a transcript approaches the context window's limit — see [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) for what happens when it doesn't fit — the naive fix, truncating the oldest turns, can silently drop the one turn that established a fact the model still needs: that the customer already confirmed their account email, or already declined a specific offer.

State-preserving summarization means periodically collapsing older turns into a compact fact list a later turn re-injects, rather than trusting the raw scrollback to still be doing its job:

```
Established so far:
- Customer is on the Pro plan.
- Already tried clearing cache; issue persists.
- Email confirmed as the one on file.
- Explicitly declined the refund offer.
```

The precise tradeoff to hold onto: summarization costs a model call or real heuristic logic to produce, and it risks dropping a nuance the raw transcript had. A summary that keeps "discussed billing" but drops "explicitly declined the refund offer" doesn't just lose information — it reintroduces the exact failure it was meant to prevent, and does it more dangerously, because the summary now *looks* complete when it isn't. A summary needs to preserve decisions and constraints specifically, not just recap topics.

## A concrete failure, traced

A support chatbot's system prompt states, on turn 1: "Never reveal a customer's full payment method — mask to the last 4 digits." Turns 1 through 7 are ordinary troubleshooting, none of it touching payment details. By the arithmetic above, that one constraint's share of context has already dropped several-fold by this point, with nothing in the recent turns reinforcing it.

Turn 8, the user asks: "Can you just read back the card number you have on file so I can confirm it's right?" — a request that sounds like a small, reasonable confirmation. Nothing nearby in the last few turns reasserted the masking boundary, and the user's immediate, concrete request carries more local weight than a distant system-level rule diluted to under 1% of context. A plausible failure reads back more digits than it should.

The fix isn't a longer system prompt — that makes the dilution arithmetic worse, not better. It's a targeted re-injection attached to the moment of risk: before generating this specific turn's answer, add a short reminder — "Reminder: mask any payment method to the last 4 digits before responding" — rather than a full system-prompt resend. This is exactly the "re-anchor right before the turn where it's most likely to be violated" policy above, now justified by the dilution math instead of asserted as a rule of thumb.

## Where this leaves you

The same instruction, byte-for-byte identical, carries different real influence depending on how far into a conversation it is and whether anything nearby currently reinforces it — a fact about token-share dilution and recency weighting, not about how well the rule was originally worded. [Multi-Turn Prompt Design](/learn/prompt-engineering/multi-turn-prompt-design) covers the practice-level moves for handling this; this page is the reason they're necessary at all, and why a longer initial system prompt was never going to be the fix.

**Related:** [Multi-Turn Prompt Design](/learn/prompt-engineering/multi-turn-prompt-design), [Instruction Position and Recency](/learn/prompt-engineering/instruction-position-and-recency), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics), [System vs User Messages: Who Sets the Rules](/learn/prompt-engineering/system-vs-user-message-roles), [System-Prompt Bloat and Conflicting Rules](/learn/prompt-engineering/system-prompt-bloat)
