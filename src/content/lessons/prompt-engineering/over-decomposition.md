---
title: "Over-Decomposition: Too Many Stages"
track: "prompt-engineering"
status: live
summary: "Every stage you add is a round trip, a cost, and a chance for the handoff to drop something — five ways that gets out of hand."
duration: "7 min read"
---

Decomposition earns its keep when a real seam exists. Past that point, every extra stage is pure overhead wearing the costume of rigor — more latency, more tokens, more places for a silent mistake to compound. Here's where that actually happens.

### The mistake: one stage per verb in the task description

**Why it's wrong:** describing a task in steps ("read it, identify the parties, identify the payment terms, identify the termination clause, identify the liability clause, assess risk, write the summary") feels like a natural pipeline outline, but several of those steps grade against the exact same rubric — "find this clause and label it" is one job repeated four times, not four jobs.

**Symptom:** a seven-stage contract-review pipeline:

1. Read the contract
2. Identify the parties
3. Identify the payment terms
4. Identify the termination clause
5. Identify the liability clause
6. Assess overall risk level
7. Write a client summary

Stages 2-5 are the same job — structured extraction — run four times with four round trips. Stage 1 isn't a stage at all; it produces no output, it's just context every later stage re-reads anyway. That's really two jobs: extract, then synthesize.

**Fix:** collapse same-rubric steps into one call that returns all four fields in a single structured object, then a second call that assesses risk and writes the summary from that object:

```json
{
  "parties": ["Acme Corp", "Northwind Logistics"],
  "payment_terms": "Net 30, 2% late fee after 15 days",
  "termination_clause": "Either party may terminate with 60 days' notice",
  "liability_clause": "Liability capped at total fees paid in the prior 12 months"
}
```

Two calls instead of seven, and the extraction stage is still just as inspectable — you can see exactly which field, if any, came back wrong — without paying for four separate round trips to get there. See [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt) for the rubric test that would have caught this before it was built.

### The mistake: a "double-check" stage with no new rubric

**Why it's wrong:** appending a verification stage that re-asks the same question with the same information isn't independent verification — it's the same coin flip, run twice, dressed up as a safety check. If the first stage was wrong because the input was genuinely ambiguous, the second stage sees the identical ambiguity and usually agrees.

**Symptom:** the check stage's verdict matches the original stage's verdict almost every time, on both correct and incorrect answers alike — a rubber stamp, not a check, because it was never given anything to disagree with.

**Fix:** either give the verification stage something the first stage didn't have — the actual source document to check the claim against, a different, stricter rubric — or admit this is a variance problem, not a correctness problem, and reach for real [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling) instead: multiple independent samples of the *same* honest call, aggregated, rather than a second stage pretending to be independent.

### The mistake: ignoring compounding error across handoffs

**Why it's wrong:** every handoff between stages is a place where the next stage can misread, drop, or misinterpret what the previous one produced — and that risk compounds multiplicatively, not additively, as stages pile up.

**Symptom:** say, illustratively, each handoff has a 97% chance of the next stage faithfully using everything it needs from the previous one's output (a number to demonstrate the shape of the problem, not a measured rate — check your own pipeline's actual rate before trusting any number here). A seven-stage pipeline has six handoffs: `0.97^6 ≈ 0.833`, roughly 83% of runs make it through clean. A two-stage pipeline has one: `0.97^1 = 0.97`. The difference between 97% and 83% end-to-end isn't from either stage getting worse at its own job — it's purely from having six more chances for something to drop between stages.

**Fix:** count your handoffs before you count your stages. Every boundary between calls is a cost you're paying in reliability, not just latency, so a stage only earns its place if what it adds is worth more than one more chance for the game of telephone to lose a detail.

### The mistake: re-sending the whole growing context at every stage

**Why it's wrong:** cost and latency scale with the total tokens moved, not the number of calls. A pipeline that re-sends the original document plus every prior stage's full output at each new hop can be re-paying for the same tokens five or six times over by the last stage.

**Symptom:** token costs balloon far faster than the stage count alone would suggest — a seven-stage pipeline can easily cost well more than seven single calls' worth of tokens, once you account for every stage re-reading everything that came before it.

**Fix:** pass forward only the structured fields the next stage actually needs, not the accumulated history — see [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages) for exactly what that trim looks like in practice.

### The mistake: never benchmarking against a simpler version

**Why it's wrong:** a pipeline's stage count usually gets decided once, at design time, and then never revisited — even after the task turns out to be simpler than it looked, or a newer model handles more of it reliably in one pass.

**Symptom:** nobody on the team can say what would actually break if two adjacent stages were merged, because merging them has never been tried and measured.

**Fix:** periodically run a merged version against your eval set — the same discipline covered in [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs). Keep the extra stage only if reliability or inspectability actually drops without it; if the merged version matches, that's a stage you were paying for out of habit, not necessity.

## Pre-flight checklist

- [ ] Each stage's job differs by *rubric*, not just by the verb used to describe it.
- [ ] A verification stage has genuinely different evidence or criteria than the stage it's checking — not just another roll of the same dice.
- [ ] You've counted the handoffs in your pipeline and can say what each one is buying you.
- [ ] Every stage forwards only the fields the next one needs, not the full accumulated history.
- [ ] The current stage count has been tested against a merged version at least once, on your actual eval set.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages), [Self-Consistency Sampling](/learn/prompt-engineering/self-consistency-sampling)
