---
title: "Before/After: Porting a Prompt to a New Model"
track: "prompt-engineering"
status: live
summary: "The due-date extractor moves to a new model, drops from 5/5 to 3/5 on the golden set, and recovers case by case."
duration: "8 min read"
---

Delimiters and few-shot ordering are usually free to fix. Knowing that's where the recovered points came from - instead of guessing - is what the eval set is for.

## The setup

`v3-revised` of the due-date extractor - the one that came out of [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow) fixing case-004 without regressing case-006 or case-007 - was tuned and gated against Model X. It scores 5/5 on the golden set and 18/20 on the full eval set from [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset). The team is now evaluating Model Y for cost reasons. Same prompt file, same eval set, different model underneath it.

The prompt itself, unchanged from `v3-revised`:

```
### EXAMPLES ###
Email: "Due 03/05/2026 (DD/MM format)." -> 2026-05-03
Email: "Payment due by March 1, 2026." -> 2026-03-01
Email: "Please pay within 30 days, no other date given." -> null

### EMAIL ###
{email_text}

Extract the payment due date. If the email explicitly states its own
date format, use that. Otherwise default to MM/DD for ambiguous dates.
Return YYYY-MM-DD or the literal string "null".
```

## Step by step

### Step 1: Run the unchanged eval set against Model Y first

```
$ python eval/run_eval.py --model model-y --tag golden
Golden gate: 3/5
  [case-004] expected '2026-05-03', got '2026-05-03 (interpreted using the stated DD/MM format)'
  [case-007] expected '2026-02-09', got '2026-09-02'
```

Model Y baseline: **3/5** on golden, down from Model X's 5/5. Case-004 fails on a technicality - the *date* is right, but trailing commentary breaks exact-match parsing. Case-007 fails on the actual logic - no format clue is present in that email, so the default should hold, but Model Y over-applies the "watch for a stated format" instruction and treats "under standard 30-day terms" as if it were a clue, flipping to DD/MM.

> **Why this step?** Establish the baseline drop before changing anything. It tells you portability work is actually necessary here, and gives you a number to recover back to - without this, every later "fix" is just a guess about whether it helped.

### Step 2: Fix the delimiters

The `### ### ` convention was never a broadly-recognized structural marker (see the checklist in [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy)) - it happened to work on Model X and is just inert text formatting to Model Y, which attends more reliably to Markdown headers.

```diff
-### EXAMPLES ###
+## Examples

-### EMAIL ###
+## Email
```

```
$ python eval/run_eval.py --model model-y --tag golden
Golden gate: 4/5
  [case-007] expected '2026-02-09', got '2026-09-02'
```

Case-004 now passes - with the example block read as a clearer demonstration block rather than literal text, Model Y stops padding its answer with commentary. **4/5.**

> **Why this step?** This cost nothing but two lines and recovered one full case. Delimiter mismatches are usually the cheapest fix in the whole checklist, which is exactly why they're worth checking first.

### Step 3: Re-test few-shot ordering

Case-007 is still failing on the logic itself, not formatting. The three examples were ordered for Model X - clear case, unambiguous case, no-date case - with the "watch for a stated format" pattern shown first. If a model weights recent examples in a prompt more heavily on ambiguous new input (see [Example Count and Ordering](/learn/prompt-engineering/example-count-and-ordering) and [Label Bias and the Majority Label](/learn/prompt-engineering/label-bias-and-majority-label)), the pattern shown *last* is the one most likely to dominate a genuinely ambiguous case like case-007, which has no clue at all.

```diff
-Email: "Due 03/05/2026 (DD/MM format)." -> 2026-05-03
-Email: "Payment due by March 1, 2026." -> 2026-03-01
-Email: "Please pay within 30 days, no other date given." -> null
+Email: "Payment due by March 1, 2026." -> 2026-03-01
+Email: "Please pay within 30 days, no other date given." -> null
+Email: "Due 03/05/2026 (DD/MM format)." -> 2026-05-03
```

Reordering so the "no clue present, don't invent one" pattern sits closer to the clue-detection example - rather than putting clue-detection last, where Model Y was over-generalizing it to every ambiguous case - is the actual fix:

```
$ python eval/run_eval.py --model model-y --tag golden
Golden gate: 5/5
```

Case-007 now correctly falls back to the MM/DD default. Golden set matches Model X's original **5/5**.

> **Why this step?** Nothing about the *instructions* changed - only which example a model was most likely to over-index on. This is the part of portability that's easy to skip because it feels like superstition; the eval set is what turns it into a measured fix instead of a guess.

### Step 4: Spot-check the fuller set and tighten output format

Golden is green, but the full 20-case set (grown since launch via the "feed failures back" habit from [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)) tells a different story:

```
$ python eval/run_eval.py --model model-y
Overall: 17/20 (85%)
```

Reading the failures: several non-golden ordinary cases pass on the date itself but fail exact-match because Model Y appends a trailing pleasantry ("Let me know if you need anything else!") after the date - the same class of issue Step 2 partially fixed, still present where the example block doesn't directly apply. Adding an explicit constraint closes it:

```diff
 Return YYYY-MM-DD or the literal string "null".
+Output only the date or "null". No other text.
```

```
$ python eval/run_eval.py --model model-y
Overall: 19/20 (95%)
```

**19/20** - one case still fails, and it's not a portability issue at all.

## Where it breaks (+fix)

The one remaining failure is case-002: `"Net 30 from receipt."` with no receipt date anywhere in the email, expected `null`. Model Y, like Model X before it, invents a date rather than admitting it can't compute one from missing information. This isn't a delimiter, ordering, or verbosity problem - it's a task gap that predates the model swap entirely (it's the same failure flagged back in [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)). Porting didn't cause it and porting techniques can't fix it; it needs an explicit instruction covering "relative date with no anchor," and it would have needed one on Model X too. Not every failure that survives a port is a portability issue - some are gaps that happened not to matter yet, on either model.

## Takeaways

- Delimiters and few-shot ordering were free to fix and recovered two of the two golden-set points lost in the swap - check them first.
- The explicit output-format constraint mattered most in raw case count: one line recovered two cases on the full set that the golden subset never even exposed.
- Rerunning the *same* eval set - not a fresh round of manual spot-checks - is what told the team when they were actually done, and what caught that the last remaining gap wasn't about the model at all.

**Related:** [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy), [Prompt Portability: Writing Prompts That Survive a Model Swap](/learn/prompt-engineering/prompt-portability-across-models), [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Example Count and Ordering](/learn/prompt-engineering/example-count-and-ordering), [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow)
