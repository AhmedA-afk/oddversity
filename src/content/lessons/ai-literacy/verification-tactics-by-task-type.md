---
title: "How to verify different kinds of AI output"
track: "ai-literacy"
status: live
summary: "A deep, practitioner-voiced lesson teaching learners to match their verification effort to the kind of AI output in front of them — facts, summaries, code, advice, or creative writ."
duration: "9 min read"
---

Not every AI output deserves the same amount of suspicion. A made-up statistic and a mediocre poem are both "wrong" in some sense, but treating them the same way wastes your time on one and leaves you exposed on the other. The skill isn't verifying everything equally hard — it's recognizing what kind of claim you're holding and picking the check that actually catches its failure mode.

Below are five approaches, one per task type, each with how it works, when it's the right tool, how it fails, and roughly how much it costs you in time. Real outputs often mix types — keep that in mind, and see the worked example near the end.

## Facts and figures: check a source

**How it works:** Treat any specific, checkable claim — a date, a statistic, a name, a "this law says," a "the study found" — as an assertion that needs a citation, even if the AI didn't give you one. Ask it directly: "where does that number come from?" Then go find that source yourself, or a comparable one, independently. You're not asking the AI to grade its own homework; you're looking the fact up the way you would if a stranger told it to you at a party.

**When it wins:** Any time the value of the answer depends on one specific number or fact being correct — a statistic in a report, a historical date, a legal threshold, a product spec, a price. These are exactly the claims that sound most authoritative and are cheapest for a model to get subtly wrong, because a plausible-sounding wrong number costs it nothing to produce.

**Failure mode:** The AI invents a source that doesn't exist, cites a real source that doesn't actually say that, or states a real number that's out of date. All three read identically confident. See [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) for why this happens rather than being a rare glitch.

**Relative cost:** Low to medium — usually one search or lookup per claim. Cheap enough that "just check it" is almost always the right call for anything you'll repeat or rely on. Full method: [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) and a worked run-through in [fact-check an AI answer step by step](/learn/ai-literacy/fact-check-an-ai-answer-step-by-step).

## Summaries: spot-check against the original

**How it works:** A summary's whole job is to stand in for a longer document, so the check is: does it actually stand in for it? Read the original once — or at least skim it — and compare claim by claim. Look for three specific distortions: something added that wasn't in the source, something important dropped (especially a caveat, exception, or dissenting detail), and something subtly reversed in meaning (a "might" turned into a "will," a minority finding presented as the conclusion).

**When it wins:** Meeting notes, article summaries, "TL;DR" requests, condensed research findings — anything where the summary will be read *instead of* the source by you or someone else.

**Failure mode:** The summary is fluent, well-organized, and wrong in a way that's easy to miss precisely because it reads so cleanly. A single dropped "except in cases where..." can flip a summary from accurate to actively misleading, and nothing about the prose signals that it happened.

**Relative cost:** Scales with document length, but you rarely need to re-read the whole thing line by line. Check the start, the end, any number, any quote, and anything the summary treats as a headline conclusion — those are where distortion does the most damage.

## Code and formulas: run it

**How it works:** Don't read code or a spreadsheet formula and decide by eye whether it looks right — execute it. Run the code, or drop the formula into the actual spreadsheet, feed it a case where you already know the correct answer, and check that it comes out right. Then try one edge case: an empty input, a zero, a negative number, the last row instead of the first.

If you don't write code yourself, you can still do this: recreate the calculation with a small example by hand (say, 3 rows instead of 3,000), check that the AI's formula gets the same answer, and only then trust it on the full dataset. Or ask the AI to walk the calculation through one row in plain language and check that logic against your own arithmetic.

**When it wins:** Any formula, script, or calculation whose output you're going to use or share — a spreadsheet macro, a "here's the SQL for that," a unit conversion, a tax or interest calculation.

**Failure mode:** It works perfectly on the example you tried and fails silently on a case you didn't — an off-by-one error, a formula that breaks on a blank cell, code that handles the happy path and quietly mishandles everything else. This is where [when AI gets numbers and math wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong) is worth reading — the errors are rarely the kind you can catch just by reading the formula.

A minimal example of the difference between reading and running:

```python
# looks right at a glance
def average(numbers):
    return sum(numbers) / len(numbers)

# run it on the edge case you're actually worried about
average([])  # ZeroDivisionError — this is the bug reading it wouldn't catch
```

**Relative cost:** Low if you can execute it directly — running code is usually faster than carefully reading it. Medium if you're recreating it by hand in a spreadsheet or on paper. Either way, cheaper than shipping a wrong number.

## Advice and recommendations: sanity-check against judgment and one source

**How it works:** Two checks, not one. First, run it against your own situation: does this actually fit my constraints, my budget, my body, my contract — or is it generic advice that assumes a default case I'm not in? Second, cross-reference it against one source you'd trust if a person gave you the same advice — a doctor, a licensed advisor, a current official guide, a domain expert you know. You're not fact-checking every sentence; you're checking whether the recommendation survives contact with one outside opinion and your own context.

**When it wins:** "Should I do X," "what's the best approach for," "is this a good idea" — anything where the output is a judgment call rather than a lookup, and where being wrong costs you money, health, time, or a relationship.

**Failure mode:** The advice is generically sound but silently wrong for you — it assumes a jurisdiction, a body, a budget, or a set of rules that don't match your case, and nothing in the confident tone signals that mismatch. It can also be quietly out of date, presenting last year's rule or rate as current.

**Relative cost:** Medium — it takes more than a single lookup, but the stakes are usually higher, too. This is the category where skipping verification most often turns into an expensive lesson. [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) covers how to read the model's own hedging (or lack of it) as one input into this check, not a substitute for it.

## Creative writing: judge on taste

**How it works:** There's no source to check a poem against. The verification move here is simply: read it and decide if it's good and if it does what you asked. Does it match the tone you wanted? Is the joke funny? Does the name sound right out loud? This is legitimately the whole check — you're the expert on your own taste, and no external source outranks that.

**When it wins:** Brainstorming, first drafts, names, taglines, jokes, style exercises — anything whose success criterion is "do I like this," not "is this true."

**Failure mode:** The real risk isn't a wrong fact — it's two other things. One, a factual claim smuggled into an otherwise creative piece (a toast that name-drops a real event or date, a story that states a real historical detail) — that fragment still needs the source-check treatment even though it's sitting inside creative prose. Two, overreliance quietly flattening your own voice into the model's default style if you stop editing and start just accepting.

**Relative cost:** Lowest of the five — reading and reacting is the whole job. Spend the time you save here on the categories that actually need it.

## Decision table

| Task type | Verification move | Effort |
|---|---|---|
| Facts and figures | Check an independent source for the specific claim | Low–medium: one lookup per claim |
| Summaries | Spot-check against the original for additions, drops, or reversed meaning | Low–medium: scales with length, but skim strategically |
| Code and formulas | Run it on a known case, then an edge case | Low if you can execute it; medium by hand |
| Advice and recommendations | Sanity-check against your context, plus one expert source | Medium: stakes are usually higher here |
| Creative writing | Judge on taste; fact-check only real claims embedded inside it | Lowest: read and react |

## How to choose

Most requests are mixed — ask "should I read this whole paper, and here's what it says" and you've got a summary, a fact, and a recommendation stacked in one answer. Work through this in order and apply the relevant test to each piece separately:

1. **Is there a specific, checkable claim in here** — a number, date, name, or quote? Check its source, regardless of what else is going on in the response.
2. **Does this stand in for a longer original** I could read myself? Spot-check it against that original before you rely on it instead of the source.
3. **Does this produce something that runs or computes** — code, a formula, a calculation? Run it on a case you already know the answer to.
4. **Is this telling me what to do?** Weigh it against your own situation and one outside source before acting on it.
5. **Is this just meant to read well or sound good**, with nothing riding on it being "true"? Read it and trust your own reaction — that's the whole check.

The failure to avoid isn't under-verifying — it's applying the wrong check, like fact-checking a poem's meter or reading a spreadsheet formula by eye instead of running it. Match the move to the task, and reserve your heaviest effort for the outputs where being wrong actually costs something. For a single end-to-end pass that puts all five moves together on one real task, see [run a real task end-to-end with verification](/learn/ai-literacy/run-a-real-task-end-to-end-with-verification), and for a fast pre-flight pass before you rely on any answer, [the verification checklist](/learn/ai-literacy/the-verification-checklist).

**Related:** [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [Fact-check an AI answer step by step](/learn/ai-literacy/fact-check-an-ai-answer-step-by-step) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [When AI gets numbers and math wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [The verification checklist](/learn/ai-literacy/the-verification-checklist)
