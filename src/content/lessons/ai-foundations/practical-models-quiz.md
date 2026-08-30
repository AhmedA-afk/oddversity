---
title: "Choosing & Running: Make the Call"
track: "ai-foundations"
status: live
summary: "Six scenario-based MCQs on choosing open vs. closed models, estimating relative cost from token counts, why the frontier model isn't the default, and when a fine-tuned small model "
duration: "18 min read"
---

Every real model choice is a constraint-satisfaction problem wearing a technology decision's clothes. These six scenarios put you in the seat where you actually have to make the call — and each wrong answer is a reasoning trap that sounds right until you check it against the numbers or the actual constraint.

## 1. The contractual privacy trap

A healthcare startup's compliance policy says patient records must stay fully within its own infrastructure — no data leaves the corporate network, full stop, even to a vendor offering a "zero data retention, we never train on your data" contract. They're choosing between a frontier closed-API model and a mid-tier open-weight model of noticeably lower benchmark quality.

Which factor should actually drive the decision?

A. Choose the closed model — frontier models have stronger safety alignment for sensitive domains.
B. Choose the open-weight model — it can be self-hosted entirely inside their own network, satisfying the "data never leaves" constraint in a way no API contract can.
C. Choose the closed model — a "zero retention" contract is legally equivalent to data never leaving the network.
D. Either works — just put the API calls through a VPN.

<details><summary>Answer</summary>

**Correct: B.** [Open-weight models](/learn/ai-foundations/open-weight-vs-closed-models) can be downloaded and run on hardware you control, so the request never has to leave your network at all. That's a different, stronger property than any API's privacy terms can offer — the constraint here isn't "will they misuse the data," it's "does the data physically transit to someone else's servers," and self-hosting is the only choice that makes that question moot.

**A** is a red herring. Whatever a frontier model's alignment training looks like, using it via API still means the request travels to the vendor's infrastructure — that's exactly what the policy forbids, regardless of how well-behaved the model is once it gets there. Model quality and data locality are separate axes.

**C** confuses a contractual promise with a technical fact. "We won't retain or train on your data" is a policy about what the vendor does *after* receiving your data — it says nothing about whether the data left your network to reach them. It legally did leave; the contract just constrains what happens next.

**D** misunderstands what a VPN does. It encrypts the transport channel between you and the vendor, but the request still terminates on the vendor's servers outside your infrastructure — the model still executes somewhere you don't control. A VPN changes how the data travels, not where it ends up.

</details>

## 2. Fewer tokens, higher price

You're routing 100,000 support tickets through a model to draft responses, and you're comparing two options:

- **Model A:** $0.50 per million input tokens, $1.50 per million output tokens. Your prompts need 800 input tokens and 150 output tokens per ticket.
- **Model B:** $2.00 per million input tokens, $6.00 per million output tokens. It follows instructions well enough that you can drop the few-shot examples, cutting each request to 500 input tokens and 120 output tokens.

Which is cheaper for this batch, and what does that tell you about estimating cost from token counts?

A. Model B — needing fewer tokens per request always wins.
B. Model A — its per-token price is low enough to more than offset using more tokens; cost is tokens × price, and neither number alone tells you the answer.
C. Model B — output tokens dominate cost, and B uses fewer of them.
D. They land at roughly the same total cost.

<details><summary>Answer</summary>

**Correct: B.** Work it out per ticket:

```text
Model A: (800 × 0.50 + 150 × 1.50) / 1,000,000 = $0.000625/ticket → $62.50 for 100,000 tickets
Model B: (500 × 2.00 + 120 × 6.00) / 1,000,000 = $0.001720/ticket → $172.00 for 100,000 tickets
```

Model A comes out roughly 2.75x cheaper overall, even though it uses more tokens per ticket. B's per-token price is 4x higher on both input and output, and that multiplier outweighs the ~1.5x fewer tokens it needs. See [tokens and cost, worked](/learn/ai-foundations/tokens-and-cost-worked-example) for more of this kind of arithmetic before you trust a vendor's pricing page at a glance.

**A** is the mistake this question is built to catch: "fewer tokens" and "cheaper" are not the same claim. Token count is only half of the cost equation — you have to multiply by price per token, and a large enough price gap reverses the comparison completely.

**C** gets the internal breakdown wrong on top of the wrong conclusion: for both models here, *input* tokens are the bigger cost contributor (64% of A's per-ticket cost, 58% of B's), not output. Even if output did dominate, B still costs more overall once you do the full multiplication.

**D** is a failure to actually compute — the two totals differ by nearly 3x, not a wash. "Roughly cancels out" is exactly the kind of guess that estimating from token counts is supposed to replace.

</details>

## 3. Fast and good enough vs. slow and slightly better

You're building real-time coding autocomplete: suggestions must appear as the user types, inside a tight latency budget. A frontier flagship model gives noticeably better completions on gnarly, multi-file context — but a mid-size model responds much faster. The product only needs suggestions to feel instant and useful enough to keep the user typing.

What should dominate the model choice, and why isn't the frontier model the safe default here?

A. Always pick the frontier model — higher-quality output is worth any latency cost in a coding tool.
B. Latency dominates — a better suggestion that arrives after the user has already kept typing past that point delivers less value than a fast "good enough" one delivered in the flow.
C. Cost dominates — frontier models are always too expensive for a feature invoked on every keystroke, regardless of latency.
D. It doesn't matter — autocomplete UIs debounce requests anyway, so model latency is irrelevant.

<details><summary>Answer</summary>

**Correct: B.** This is the core reason the biggest model isn't the default: you have to match the model to the task's actual bottleneck, not to "quality" in the abstract. In a latency-bound, in-the-flow interaction, response time is part of the deliverable — a marginally better completion that renders after the user has already typed past that point, or after the request gets superseded by a newer one, delivers zero of that quality advantage. See [inference cost and latency intuition](/learn/ai-foundations/inference-cost-and-latency-intuition) for why bigger models are consistently slower per token, not just pricier.

**A** assumes quality dominates every tradeoff, which is exactly the "biggest model as default" instinct this module is pushing back on. In an interactive, real-time context, an answer's quality only counts if it arrives in time to be used — past that threshold, "better but late" can be worth less than "good enough but on time."

**C** overreaches with "always... regardless of latency." Cost is a real consideration at keystroke-level volume, but the scenario is explicitly framed around a latency budget — treating cost as the dominant, universal reason skips past the constraint the question actually names. The lesson here is to weigh the constraints in front of you, not apply a fixed rule about which axis always wins.

**D** is a mechanism error. Debouncing reduces how often a request fires, not how fast the model has to respond once it does. The requests that do go out still need to return inside the latency budget to be useful — debounce doesn't remove the requirement, it just changes the frequency it's applied to.

</details>

## 4. When smaller and fine-tuned wins

A company processes 2 million invoices a month, extracting five fixed fields (vendor name, invoice number, date, line-item total, tax amount) into structured JSON. They have 50,000 historical invoices with verified-correct extractions sitting around. Which approach is most likely to beat calling a frontier general-purpose model directly, and why?

A. A frontier model with a long, carefully engineered prompt — bigger models always generalize better, so they'll win on a narrow task like this too.
B. A small model fine-tuned on the 50,000 labeled examples — the task is narrow and well-defined with abundant labeled data, so fine-tuning can match or beat frontier accuracy on this exact pattern, at a fraction of the per-call cost and latency across 2 million calls a month.
C. Neither — abandon LLMs and hand-write a regex/rules parser; model-based approaches are too unreliable for structured extraction at this volume.
D. The frontier model — fine-tuning only helps with subjective, open-ended tasks like creative writing, not structured extraction.

<details><summary>Answer</summary>

**Correct: B.** This is the textbook case for [fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning) beating a frontier model: a narrow, repetitive task, a fixed output schema, and tens of thousands of labeled examples that are exactly what the model needs to see. Fine-tuning bakes your specific document formats and edge cases into a much smaller model, so it doesn't need broad world knowledge to do this one job well — and at 2 million calls a month, the per-call cost and latency savings compound into a decisive advantage.

**A** is the "bigger always generalizes better" myth this module exists to correct. General capability matters most on broad, novel, or open-ended tasks. On a narrow, in-distribution task like this one, a model tuned specifically on your data can match or exceed a much larger general model, because the job has shrunk from "understand anything" to "recognize this one pattern precisely."

**C** overcorrects in the opposite direction. Hand-written rules are brittle exactly where invoices are messy — different vendors, layouts, date formats, and line-item structures break regex parsers constantly. That fuzziness is precisely what a model (fine-tuned or not) handles better than rigid pattern matching. It also throws away the 50,000 labeled examples, which are a resource, not a reason to avoid models.

**D** has the fine-tuning use case backwards. Fine-tuning is most reliable, and easiest to measure, on narrow structured tasks like extraction and classification — you can score outputs directly against labeled examples. Subjective, open-ended generation is actually the *harder* place to prove fine-tuning helped, not the natural home for it.

</details>

## 5. "It's only $0.003 — basically free"

Your team expects a new feature to generate about 20 million model calls a month. A colleague argues: "The cost difference between these two models is only $0.003 per call — that's basically free, so let's just use whichever one is easier to integrate." What's wrong with that reasoning, if anything?

A. Nothing — $0.003 is negligible regardless of context, so ease of integration should decide it.
B. Treating a small per-call number as automatically negligible ignores volume: at 20 million calls a month, $0.003 per call is $60,000 a month — volume is exactly what turns a rounding error into a real budget line, so cost-per-call has to be evaluated against expected scale, not in isolation.
C. It's wrong because closed models never charge per-call, only via flat subscription, so the comparison is invalid to begin with.
D. It's wrong because integration ease should never factor into a model choice — only benchmark performance should.

<details><summary>Answer</summary>

**Correct: B.** `$0.003 × 20,000,000 = $60,000`. Volume is a first-class constraint alongside budget, privacy, and latency precisely because it multiplies small per-unit numbers into real ones — a difference that looks trivial at the scale of a single request stops looking trivial at the scale of your actual traffic. Always check a per-call number against your expected volume before calling it negligible.

**A** makes exactly the mistake the scenario is testing: reasoning about cost from a single call in isolation, without multiplying by how many calls you'll actually make. That's the same error as thinking a fraction-of-a-cent difference "doesn't matter" without asking "compared to what volume?"

**C** is factually off — most closed frontier APIs meter usage per-token (which is what makes a "$0.003 per call" comparison meaningful in the first place), even where subscription tiers also exist. More importantly, it dodges the actual reasoning error instead of addressing it: whether or not the pricing model is per-call, the mistake was skipping the volume multiplication.

**D** swings too far the other way. Integration ease is a legitimate tiebreaker *once* cost and quality are genuinely close — the flaw in the colleague's reasoning isn't that they considered it, it's that they dismissed a real $60,000/month cost gap as negligible before getting there.

</details>

## 6. When the constraints don't force a tradeoff

An internal tool drafts legal-contract summaries for lawyers to review before anything reaches a client. Volume is about 200 requests a day. Every summary gets read carefully for several minutes regardless of how fast it was generated. Budget is generously funded. There's no special data-residency requirement — the company already routes these same contracts to an external e-discovery vendor. Given this constraint set, what should most drive the model choice?

A. Latency — faster responses always improve user experience, in any context.
B. Cost — small per-call savings compound importantly at any volume.
C. Output quality — at this volume and budget, neither cost nor latency is actually binding (the human review step absorbs any latency gap, and 200 requests a day won't stress a generous budget), so this is a case where you should just spend on the best available model for a high-stakes task.
D. Open vs. closed licensing — that should be the first filter applied to every model decision, before looking at the task.

<details><summary>Answer</summary>

**Correct: C.** The whole point of [reasoning from a decision framework](/learn/ai-foundations/choosing-a-model-decision-framework) is that constraints sometimes *don't* bind, and you have to notice that too. Nothing here forces a cheaper, faster, or smaller choice: budget is ample, volume is low, latency differences vanish into a multi-minute human read, and there's no data-residency requirement. That's the flip side of "the biggest model isn't the default" — it's not a blanket bias against big models, it's matching the model to the constraints that are actually in front of you. Here, none of the usual pressures apply, and the task (legal accuracy, real stakes) is exactly the kind that rewards spending the available budget on the best available quality.

**A**'s "always" is the tell. This is precisely the low-volume, human-reviewed context where a latency difference of a few seconds disappears into several minutes of human reading time and changes nothing about the outcome.

**B** is the mirror image of question 5: at 200 requests a day, even a meaningfully larger per-call cost difference is a trivial total dollar amount against a budget already described as generous. Optimizing for a savings the budget won't notice just trades away quality on a high-stakes task for no real benefit.

**D** treats licensing as a universal first filter rather than one lens among several — relevant when privacy, control, or self-hosting is actually at stake, and irrelevant here since the company already sends these contracts externally to another vendor. Nothing in this constraint set makes open vs. closed the deciding factor; quality is.

</details>

**Related:** [Open-weight vs. closed models](/learn/ai-foundations/open-weight-vs-closed-models) · [Open vs. closed and hardware tradeoffs](/learn/ai-foundations/open-vs-closed-and-hardware-tradeoffs) · [Tokens, context, cost](/learn/ai-foundations/tokens-context-cost) · [Choosing a model](/learn/ai-foundations/choosing-a-model) · [Benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss)
