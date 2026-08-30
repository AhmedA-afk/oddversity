---
title: "Complexity vs Accuracy, and When to Split"
track: "structured-outputs"
status: live
summary: "Derive why whole-record accuracy decays with field count, then show why splitting a schema helps for a different reason than most people assume."
duration: "10 min read"
---

*This is the deferred-rigor lesson in the module — the mechanism behind "big schemas get less reliable," worked out in enough detail to state precisely what splitting does and doesn't buy you. Skip it on a first pass if you just need a rule of thumb; come back once "how many fields is too many" needs an actual answer.*

## The independence model

Start from a simplifying assumption, stated openly as an assumption: each field in a schema has some per-field accuracy `a` (the probability the model gets that one value right), and field errors are independent of each other. Neither half of that assumption is exactly true in practice — but it's a clean enough starting model to derive a real mechanism from, and you can sanity-check it against your own data afterward.

Under independence, the probability that *every* field in an `n`-field object is correct is `a^n` — each additional field multiplies in another chance to be wrong. This is just the chance of flipping `n` independent coins and having every one land the way you wanted, and it decays fast even when `a` looks high:

| Field count `n` | `a = 0.98` per field | Whole-record accuracy `a^n` |
|---|---|---|
| 5 | 0.98 | 0.98⁵ ≈ 90.4% |
| 10 | 0.98 | 0.98¹⁰ ≈ 81.7% |
| 20 | 0.98 | 0.98²⁰ ≈ 66.8% |
| 40 | 0.98 | 0.98⁴⁰ ≈ 44.6% |

A 98%-accurate field sounds like a solved problem in isolation. At 40 fields, under pure independence, better than half your records have at least one wrong value — not because any single field got worse, but because the number of chances to be wrong grew. This is the real content behind "big schemas get less reliable": not a vague feeling, a multiplication.

## What depth adds on top

Nesting introduces a second, structurally different failure mode. A wrong *value* can leave an object still syntactically valid — a wrong category in an otherwise well-formed record. A wrong *structural* choice — an object closed a level early, a value nested one level off — can invalidate the surrounding shape entirely, which is exactly the risk [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) calls "depth is a cost, not a convenience," and [When to Flatten and When to Nest](/learn/structured-outputs/flat-vs-nested-tradeoffs) turns into a design rule.

Model it as its own multiplicative factor: if each of `d` nesting levels has some probability `s` of being structurally correct, structural success across the whole object is roughly `s^d`, independent of the field-value accuracy `a^n` above. Overall success is then approximately `s^d × a^n` — depth and field count both erode reliability, through two genuinely different mechanisms, and they compound.

## The naive splitting argument — and why it's wrong

Here's the intuition that seems obviously right and isn't: "split a 40-field schema into two 20-field passes, and since `0.98²⁰ × 0.98²⁰ = 0.98⁴⁰`, you haven't gained anything — the arithmetic is identical either way." Check the arithmetic: it's exactly right. `a^20 × a^20 = a^40` for any `a`. If per-field accuracy stays the same in both passes, splitting the schema in half and requiring both halves to be correct produces *precisely* the same whole-record accuracy as one big pass — no more, no less. Combinatorics alone buys nothing here, and it's worth sitting with that, because "split it and multiply the probabilities" is the version of this argument people reach for first, and it's a wash by construction.

## What actually recovers accuracy when you split

The real gain isn't in the multiplication — it's in `a` itself changing. A 40-field extraction forces the model to track, order, and correctly place forty separate values in one continuous generation; a 20-field extraction has half the bookkeeping in play at any point. If that reduced load raises per-field accuracy — because there's less to juggle, shorter output means less drift, and each field competes with fewer neighbors for the model's attention within the response — then splitting isn't a wash, because `a` isn't fixed across the split.

Suppose you instrument your own pipeline and find exactly this: a single 40-field pass runs at roughly 95% per-field accuracy, but two focused 20-field passes each run closer to 99% (illustrative numbers — measure yours before trusting a specific figure here). The comparison changes completely:

- Single 40-field pass: `0.95⁴⁰ ≈ 12.9%` whole-record accuracy.
- Two 20-field passes, both required correct: `0.99²⁰ × 0.99²⁰ = 0.99⁴⁰ ≈ 66.9%`.

That's the entire mechanism: splitting recovers accuracy exactly to the extent that it raises `a`, and not one bit further. If splitting a schema doesn't measurably improve per-field accuracy on your actual task — if the model was never straining under 40 fields in the first place — running two passes buys you nothing but extra latency and cost, per the wash case above.

There's a second, independent benefit that doesn't depend on `a` moving at all: **isolating failures makes repair cheaper.** In one 40-field pass, a validation failure on field 31 means re-running (or re-prompting for) the whole object — [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair) has to resend all 40 fields' worth of context either way. Split into two passes, and a failure in pass 2 only costs a retry of pass 2's 20 fields; pass 1's already-validated output is untouched. This doesn't change the `a^n` math above, but it changes what a failure costs you in latency and tokens, which is often the more immediate reason production systems split.

## Tradeoffs, precisely stated

- Splitting helps whole-record accuracy **only if** per-field accuracy increases when the schema shrinks — verify this on your own task before assuming it, the same way you'd verify anything else in this module (see [Building an Extraction Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness)).
- Splitting helps repair cost **regardless of whether `a` moves** — a failure in one pass never forces a retry of the other.
- Splitting costs you a second round trip's latency and — for extraction tasks where later fields depend on facts established in earlier ones — a merge step to recombine two objects into one record, which is its own source of bugs if the split boundary was chosen carelessly. [Chunk-and-Merge Extraction](/learn/structured-outputs/chunk-and-merge-extraction) and [Long-Document Structured Extraction](/learn/structured-outputs/long-document-structured-extraction) cover the merge-side mechanics this introduces.

## When to actually split

Not at a fixed field count — there's no universal threshold in the math above, because everything depends on the specific `a` and `s` your model achieves on your task. Split when you've measured (not assumed) that a single pass's per-field accuracy is meaningfully lower than what a narrower pass achieves on the same fields, or when your validation-and-repair costs are dominated by full-object retries on a schema where most fields usually validate fine and only a specific subset tends to fail — in which case that subset is a strong candidate for its own pass. Absent a measurement either way, a schema under roughly 15–20 shallow fields is rarely worth splitting on accuracy grounds alone; the independence-model table above is the reason that range shows up as a common informal ceiling.

**Related:** [When to Flatten and When to Nest](/learn/structured-outputs/flat-vs-nested-tradeoffs), [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas), [Chunk-and-Merge Extraction](/learn/structured-outputs/chunk-and-merge-extraction), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)
