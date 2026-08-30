---
title: "When AI gets numbers and math wrong"
track: "ai-literacy"
status: live
summary: "Worked-example lesson: a four-friend restaurant bill split with an odd tax rate (8.875%) and proportional tip allocation, carried through six verified arithmetic steps, then delibe."
duration: "7 min read"
---

You ask an AI to split a dinner bill four ways with tax and tip, and it hands back four confident dollar amounts. They're wrong — not because it misunderstood the problem, but because it never actually did the arithmetic. It predicted numbers that *look like* a restaurant bill. Here's how to catch that before you Venmo the wrong amount.

## The setup

Four friends — Maya, Priya, Jordan, and Sam — go out for dinner. The itemized receipt:

| Person | Order | Price |
|---|---|---|
| Maya | Burger | $14.50 |
| Maya | Fries | $5.00 |
| Priya | Salad | $12.00 |
| Priya | Iced tea | $3.50 |
| Jordan | Pasta | $18.00 |
| Jordan | Wine | $9.00 |
| Sam | Steak | $27.00 |
| Sam | Soda | $3.00 |

Sales tax is 8.875%. They agree to tip 20% on the pre-tax subtotal. And because Sam's steak dinner isn't the same as Priya's salad, they want a **fair split**: everyone pays for what they ordered, plus their proportional share of the tax and tip — not just the total divided by four.

Someone types this into a chat AI:

```
Here's our bill. Maya: burger $14.50, fries $5.00. Priya: salad $12,
iced tea $3.50. Jordan: pasta $18, wine $9. Sam: steak $27, soda $3.
Tax is 8.875%. We're tipping 20% on the subtotal before tax. Split
the total so each person pays for their own items plus their fair
share of tax and tip. What does each person owe?
```

This is a completely reasonable ask. It's also several arithmetic steps deep, uses an odd tax rate, and ends in a division that has to come out right for four numbers at once. That combination is exactly where things go wrong.

## Step by step

**Step 1 — Get every number right before you calculate anything.**

Per-person subtotal: Maya $19.50, Priya $15.50, Jordan $27.00, Sam $30.00.
Overall subtotal: $19.50 + $15.50 + $27.00 + $30.00 = **$92.00**.

> **Why this step?** This is just counting and adding — no percentages yet — but it's also where a surprising number of real errors start. Drop one line item from a longer receipt, double-count a shared appetizer, or misread "$18" as "$8," and every downstream number will still compute cleanly. The math after this point can be flawless and the answer will still be wrong, because the input was wrong. Verify the raw numbers before you trust anything built on them.

**Step 2 — Compute tax on the subtotal.**

$92.00 × 0.08875 = $8.165 → rounds to **$8.17**.

> **Why this step?** 8.875% isn't a clean number like 10% or 20%. There's no shortcut — you have to actually multiply 92 by 0.08875, then round the fractional cent. Round-number percentages are exactly the kind of thing that shows up constantly in training data ("what's 10% of 92?"), so models tend to nail those. An odd rate multiplied against a specific, never-seen-before dollar figure is not a pattern anyone memorized — it has to be genuinely computed.

**Step 3 — Compute tip on the same base.**

$92.00 × 0.20 = **$18.40**.

> **Why this step?** Notice the prompt specified "20% on the subtotal *before* tax." That's a real ambiguity — some people tip on the post-tax total instead, which gives a different (also defensible) number. If you don't pin down which base you mean, you're not just risking a math error, you're risking the AI silently picking the other convention and being internally consistent about the wrong question. Specifying it removes one whole failure mode before the arithmetic even starts.

**Step 4 — Add up the grand total.**

$92.00 + $8.17 + $18.40 = **$118.57**.

> **Why this step?** This is plain addition of three numbers you already have in front of you. It sounds too simple to fail — which is exactly why it's worth watching. This is the step we'll break on purpose in a minute.

**Step 5 — Allocate tax and tip proportionally.**

The tax-and-tip pool is $8.17 + $18.40 = $26.57, split in proportion to what each person ordered (their subtotal ÷ $92.00):

- Maya: $19.50 ÷ $92.00 × $26.57 = $5.63
- Priya: $15.50 ÷ $92.00 × $26.57 = $4.48
- Jordan: $27.00 ÷ $92.00 × $26.57 = $7.80
- Sam: $30.00 ÷ $92.00 × $26.57 = $8.66

Add each person's share back to their own order:

- Maya: $19.50 + $5.63 = **$25.13**
- Priya: $15.50 + $4.48 = **$19.98**
- Jordan: $27.00 + $7.80 = **$34.80**
- Sam: $30.00 + $8.66 = **$38.66**

> **Why this step?** This is where a "looks right" wrong answer is easiest to produce and hardest to spot by eye. There's no single obviously-wrong digit — four plausible dollar amounts, each in a sane range for what that person ordered. You can't sanity-check any one of them in isolation. The only way to know if they're right is the next step.

**Step 6 — Verify: do the parts equal the whole?**

$25.13 + $19.98 + $34.80 + $38.66 = **$118.57** — matches the total from Step 4. The split checks out.

> **Why this step?** This is the step people skip because the four numbers already feel like an answer. Treat "does everything sum back to the total" as mandatory, not optional, every single time — not just when a number looks off. As you're about to see, a wrong answer can look exactly as finished as a right one.

## Where it breaks

Ask a chat AI to do this same calculation and you can easily get back something that reads like this:

```
Subtotal: $92.00
Tax (8.875%): $8.17
Tip (20%): $18.40
Total: $128.57

Maya owes: $27.25
Priya owes: $21.66
Jordan owes: $37.73
Sam owes: $41.93
```

Every input is correct. Tax and tip are each computed correctly. And it even passes the check from Step 6: $27.25 + $21.66 + $37.73 + $41.93 = $128.57, matching the total it gave. It looks verified.

It's still wrong. $92.00 + $8.17 + $18.40 is $118.57, not $128.57 — a plain addition slip, ten dollars off, on numbers that were sitting right there. And because every per-person share was calculated *against that wrong total*, the error didn't stay contained — it spread into all four "personalized" numbers, each of which now looks just as specific and trustworthy as a correct one would.

This is the trap, and it's worth naming precisely: **internal consistency is not the same as correctness.** Checking that the parts add up to the stated total only catches the AI contradicting itself. It does nothing if the AI is wrong in a way that's consistently wrong — which is exactly what happens when the error is baked in early and everything after it is computed faithfully from that bad number. The check that actually catches this is going back to the original inputs and re-deriving the total yourself: 92.00 + 8.17 + 18.40, by hand or in a calculator, equals 118.57. That's the number that exposes the slip, not the four downstream shares.

**Why this happens, structurally.** A language model generates its answer one token at a time, each one chosen because it's a plausible continuation given everything before it — not because a calculator ran and returned a value. Read more on that mechanism in [how language models produce text](/learn/ai-literacy/how-language-models-produce-text) and [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking). For arithmetic that appears constantly in training data — 2+2, 10% of 50 — "plausible" and "correct" are almost always the same thing, so the model looks reliable. But "$92.00 + $8.17 + $18.40" is a combination of numbers that has essentially never appeared anywhere before. There's no memorized pattern to fall back on and no persistent scratchpad carrying exact digits the way a calculator's registers do. The model has to generate a number that *looks like* a sum of those three figures, and nothing in how it works forces that number to actually equal the sum. It states $128.57 with exactly the same fluency and the same tone it would use for $118.57 — which is a big part of why AI sounds confident whether or not it's right; see [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident). This is a property of how the system generates output, not a bug that a future update quietly patches out. A bigger model still predicts tokens; it doesn't grow a built-in calculator by getting smarter.

**The fixes — in order of effort:**

**1. Ask it to show its steps, and actually read them.** Add "show your work step by step" to the prompt (see [chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting)). This doesn't guarantee correct arithmetic — the model can still show wrong steps just as confidently as a wrong final answer — but it turns one unverifiable number into several small, checkable ones. "92.00 + 8.17 + 18.40 = 128.57" is a claim you can falsify in five seconds. "Total: $128.57" alone is not.

**2. Do the final arithmetic yourself.** You don't have to re-derive the whole problem — let the AI do the heavy lifting of reading the receipt and structuring the approach. Just take the handful of numbers it surfaces (subtotal, tax, tip) and add them yourself, or drop them into a calculator or spreadsheet. That's the one check in this whole example that actually catches the $128.57 error, because it doesn't trust anything the AI computed downstream of the inputs.

**3. Have it use an actual calculator instead of "thinking" the numbers.** If your AI tool can run code (a code interpreter / tool-use mode), ask it to compute the split in code rather than in prose. Code that executes isn't predicted token by token the way the *answer* is — an interpreter actually runs the operations and returns an exact value:

```python
from decimal import Decimal, ROUND_HALF_UP

def to_cents(amount):
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

orders = {
    "Maya":   Decimal("14.50") + Decimal("5.00"),
    "Priya":  Decimal("12.00") + Decimal("3.50"),
    "Jordan": Decimal("18.00") + Decimal("9.00"),
    "Sam":    Decimal("27.00") + Decimal("3.00"),
}

subtotal = sum(orders.values())
tax = to_cents(subtotal * Decimal("0.08875"))
tip = to_cents(subtotal * Decimal("0.20"))
pool = tax + tip
total = subtotal + tax + tip

owed = {}
for name, order_total in orders.items():
    share = to_cents(order_total / subtotal * pool)
    owed[name] = order_total + share

print(f"Total: ${total}")
for name, amount in owed.items():
    print(f"{name} owes ${amount}")
print(f"Check: parts sum to ${sum(owed.values())}")
```

Run this and you get `Total: $118.57`, four owed amounts that sum to exactly that, every time, no matter how many times you run it. That reliability is the whole point — a calculator doesn't have an off day, and neither does an interpreter running the same arithmetic operators a calculator uses. For anything money-shaped, that makes a tool that can actually execute code a meaningfully different choice than one that can only generate text about the calculation.

The same structural gap shows up anywhere a specific combination of numbers has to come out exactly right and probably never appeared together in training: converting a recipe from 4 servings to 7, converting cups to grams, converting a price between currencies, reconciling a spreadsheet of expenses. The bill-split is just an easy one to catch because you can check it by hand in under a minute. Others won't be that obvious — which is exactly why the checking habit matters more than the specific example.

## Takeaways

- **Treat any nontrivial AI calculation as a draft, not a receipt.** It's predicting numbers that look like an answer, not running an algorithm that guarantees one — see [uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) for the broader habit this fits into.
- **"Do the parts add up to the total?" is a real check — but it only catches contradictions, not a consistently wrong number.** If the AI computed everything downstream from one bad early number, the whole answer will look self-consistent. Re-derive the total from the raw inputs yourself to catch that case.
- **Ask for the steps, not just the answer.** It doesn't make the arithmetic correct, but it turns one big unverifiable claim into several small ones you can actually check — see the full breakdown in [verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type).
- **For money, unit conversions, and counts, prefer a tool that actually calculates over one that only writes text about calculating.** A code interpreter running `92.00 * 0.08875` gets an exact answer every time; a model predicting the digits of that answer does not.
- **This won't get "fixed" by a smarter model.** It's a consequence of how these systems generate output — one plausible token after another — not a rough edge on today's version. Tool use closes the gap; raw scale doesn't.

**Related:** [the verification checklist](/learn/ai-literacy/the-verification-checklist) · [the single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output)
