---
title: "Before/After: Turning Prohibitions Into Positive Instructions"
track: "prompt-engineering"
status: live
summary: "Five stacked 'don't' rules, rewritten one by one into positive targets, with the leaky before and the cleaner after side by side."
duration: "6 min read"
---

[Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem) explains the mechanism — naming a concept primes it, and a negative leaves no positive target to redirect to. Here's that mechanism made concrete on a prompt with five stacked negatives, rewritten one rule at a time.

## The setup

A system-prompt fragment for a home-cooking assistant:

```
- Don't suggest recipes with nuts.
- Don't use overly casual language.
- Don't recommend restaurants.
- Don't give exact calorie counts.
- Don't mention specific brand names.
```

A user asks: "What's a quick dinner idea for tonight, and where can I get the ingredients?"

## Step by step

### 1. Run the negatives as written (illustrated failure)

A plausible completion:

> *Yeah, a quick stir-fry totally works for a weeknight dinner! Just grab some chicken, soy sauce, and veggies — you could pick everything up at Trader Joe's if you've got one nearby, it's usually pretty cheap there.*

Two of the five rules leak in one short answer: a specific brand name ("Trader Joe's"), and casual language ("Yeah," "totally"). Neither slipped by accident — the user's own question ("where can I get the ingredients") pulls directly toward exactly the store-and-brand territory rule three and rule five exist to avoid.

> **Why this step?** This shows the failure isn't a strawman. Five simultaneous absences are genuinely harder to hold than they look listed on paper, especially when the live question is aimed straight at two of them.

### 2. Rewrite each negative as a positive target

| Negative | Positive rewrite |
|---|---|
| Don't suggest recipes with nuts | Only suggest recipes made entirely from a nut-free ingredient list |
| Don't use overly casual language | Write in a clear, neutral, instructional tone, like a recipe card |
| Don't recommend restaurants | Frame every answer around cooking at home — treat the question as "what to make," not "where to eat" |
| Don't give exact calorie counts | Describe portions in cups, pieces, or servings, not calories |
| Don't mention specific brand names | Refer to ingredients by their generic category — "soy sauce," never a brand |

> **Why this step?** Each rewrite gives the model something to *do* that, if followed, makes violating the original rule structurally awkward rather than something to remember not to do. "Frame every answer around cooking at home" doesn't require the model to notice and suppress the word "restaurant" mid-generation — the frame itself never opens a door to it in the first place.

### 3. Run the rewritten prompt

```
- Only suggest recipes made entirely from a nut-free ingredient list.
- Write in a clear, neutral, instructional tone, like a recipe card.
- Frame every answer around cooking at home — treat the question as
  "what to make," not "where to eat."
- Describe portions in cups, pieces, or servings, not calories.
- Refer to ingredients by their generic category, never a brand name.
```

A cleaner completion:

> *A quick stir-fry: 2 cups chopped vegetables, 1 cup diced chicken, and 2 tablespoons soy sauce. Cook the chicken first, add the vegetables, then finish with the soy sauce over high heat for about five minutes.*

No brand names, no casual tone, no restaurant mention, no calorie count, no nuts — every rule held, and the store-related pull from the user's own question quietly went unanswered rather than triggering a leak.

> **Why this step?** This confirms the mechanism. The two leaks from step 1 don't reappear because the model got better at suppression — they don't reappear because the positive frame doesn't have a token position where they'd naturally fit anymore. "What to make" never opens onto "where to buy it" the way a literal answer to the full question would have.

## Where it breaks (+fix)

A positive reframe can overcorrect into silently ignoring a legitimate part of the question. Here, the user genuinely asked where to get the ingredients, and the rewritten prompt just... doesn't answer that half. That's not a win, it's a different failure — an unstated scope boundary instead of a leaked one.

The fix: pair every positive rewrite with an explicit fallback for the adjacent, legitimately in-scope case, rather than leaving it to go unaddressed. Add: "If asked where to buy an ingredient, say you don't have store information, and suggest checking a local grocery store's website." Now the rule has a positive target *and* a defined edge, instead of a silence that just happens to avoid the leak.

## Takeaways

- Nearly every "don't" rule can be restated as "only," "always," or "instead" — a scope, a default, or a redirect.
- The reframe works because it removes the forbidden concept's natural entry point in the response, not because the model got more disciplined about suppression.
- A positive rewrite still needs an explicit fallback for the adjacent, in-scope question it might otherwise leave unanswered. "Positive" should not quietly become "silent" on real edge cases.

**Related:** [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem), [Why 'Don't Do X' Backfires](/learn/prompt-engineering/negative-instructions-pitfall), [Task Framing](/learn/prompt-engineering/task-framing), [Prompt Anti-Patterns to Stop Doing](/learn/prompt-engineering/prompt-anti-patterns)
