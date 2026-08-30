---
title: "Worked Example: Scoring a Prompt for Hallucination Risk"
track: "hallucinations"
status: live
summary: "Three real-shaped prompts scored against a five-axis risk checklist, turned into a rubric you can run before a request hits the model."
duration: "6 min read"
---

[Hallucination risk factors](/learn/hallucinations/hallucination-risk-factors) names the axes that make a prompt more or less dangerous. This lesson does the part that actually makes the checklist useful: scoring three concrete prompts against it, side by side, so you can see how the axes combine instead of just listing them.

## The setup

The checklist has five axes, each scored 0 (low risk), 1 (medium), or 2 (high risk):

- **Obscurity** - how well-represented is this fact or entity in training data?
- **Recency** - does this require information from after (or close to) the model's knowledge cutoff?
- **Specificity demanded** - does the answer require an exact number, date, name, or citation, with no tolerance for "approximately"?
- **Verifiability** - if the model got this wrong, could anyone downstream easily catch it, or does it disappear into an unchecked answer?
- **Pressure to please** - does the question's phrasing presuppose an answer or lead the model toward confirming something, rather than neutrally asking?

*All company and product names below are invented for this exercise - nothing here refers to a real business.*

## Step by step

**Prompt A - long-tail entity lookup:** "What was the founding date and first CEO of Whitmore & Sons Cannery?"

| Axis | Score | Why |
|---|---|---|
| Obscurity | 2 | A small, invented business - if it existed, it would have near-zero training coverage |
| Recency | 0 | Nothing time-sensitive; a historical founding fact doesn't decay |
| Specificity demanded | 2 | Both a date and a named person - two independent precise facts |
| Verifiability | 0 | Nobody downstream likely fact-checks a throwaway detail like this |
| Pressure to please | 0 | Neutral phrasing, no presupposition beyond the entity's existence |
| **Total** | **4 / 10** | |

> **Why this step?** Obscurity and specificity are both maxed out here, which is exactly the combination [next-token-mechanics-of-fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication) predicts is worst: thin training signal plus a demand for an exact answer, with nothing to fall back on. Verifiability being low is what makes this dangerous in practice - a wrong answer here is likely to go unchecked, not just wrong.

**Prompt B - multi-constraint query:** "Give me a Python function under 15 lines that parses ISO 8601 durations, has no external dependencies, matches the return type of Java's `Duration.parse`, and cites the RFC section it implements."

| Axis | Score | Why |
|---|---|---|
| Obscurity | 1 | ISO 8601 duration parsing is documented, but cross-referencing it against Java's specific return type is a narrower ask |
| Recency | 0 | Stable, long-settled specifications |
| Specificity demanded | 2 | Four independent hard constraints stacked - line count, dependency-free, type parity with another language, and a specific RFC citation |
| Verifiability | 1 | The code itself is runnable and checkable, but the RFC citation is easy to skip verifying |
| Pressure to please | 1 | Asking for a citation invites the model to supply one even if it isn't confident which section actually applies |
| **Total** | **5 / 10** | |

> **Why this step?** This is [multi-hop-compounding-hallucination](/learn/hallucinations/multi-hop-compounding-hallucination) in miniature - each constraint is a separate place the model can silently drop or fake compliance, and the RFC citation in particular is exactly the shape of claim from [anatomy-of-a-hallucination](/learn/hallucinations/anatomy-of-a-hallucination): plausible, structurally valid, easy to state, hard to verify without actually opening the RFC.

**Prompt C - leading question:** "Since your training data confirms Whitmore & Sons had record profits in their third year, what caused the dip in year four?"

| Axis | Score | Why |
|---|---|---|
| Obscurity | 2 | Same invented small entity as Prompt A |
| Recency | 0 | Not time-sensitive |
| Specificity demanded | 1 | Asks for a causal explanation, not an exact number, but still wants a confident-sounding answer |
| Verifiability | 0 | Same as A - nothing downstream is likely to check this |
| Pressure to please | 2 | The question presupposes both the record-profit year and the year-four dip as established facts, inviting the model to accept the premise and build on it rather than question it |
| **Total** | **5 / 10** | |

> **Why this step?** This is the pattern in [adversarial-and-leading-prompts](/learn/hallucinations/adversarial-and-leading-prompts): the danger isn't primarily the obscurity here, it's that the phrasing already asserts something false as background fact. A model that doesn't push back on the premise will confidently explain a "dip" that was never established to have happened at all.

## Where it breaks (and the fix)

The raw totals above rank B and C above A, which undersells A's actual danger - a 4/10 total looks moderate, but the *combination* of maxed-out obscurity and specificity with zero verifiability is arguably the most dangerous shape on this list, since a wrong answer here isn't just likely, it's likely to ship unnoticed. A pure sum treats every axis as equally and independently weighted, which flattens exactly the compounding effect the checklist exists to catch. The fix: don't just sum the axes - flag any prompt where **obscurity and specificity are both high while verifiability is low** as a hard stop regardless of total score, since that combination is where fabrication is both most likely and least likely to be caught before it does damage.

## Takeaways

The reusable rubric: score every incoming prompt shape on the five axes above, sum for a rough total, but treat a high-obscurity, high-specificity, low-verifiability combination as an automatic escalation regardless of the sum. Route anything that trips that combination toward grounding or human review before it ever reaches an ungated model call - the routing logic this feeds into is covered in [uncertainty-in-practice-triage](/learn/hallucinations/uncertainty-in-practice-triage) and [escalation-design-for-uncertain-answers](/learn/hallucinations/escalation-design-for-uncertain-answers).

**Related:** [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [Adversarial and Leading Prompts](/learn/hallucinations/adversarial-and-leading-prompts), [Multi-Hop Compounding Hallucination](/learn/hallucinations/multi-hop-compounding-hallucination), [Uncertainty in Practice: Triage](/learn/hallucinations/uncertainty-in-practice-triage)
