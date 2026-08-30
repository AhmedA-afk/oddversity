---
title: "System-Prompt Bloat and Conflicting Rules"
track: "prompt-engineering"
status: live
summary: "System prompts accrete rules until they contradict each other, and the model resolves the conflict silently, not necessarily your way."
duration: "7 min read"
---

System prompts start clean and grow one patch at a time — a new bullet every time a new edge case bites. Nobody re-reads the whole document once it's a page long, and the model ends up resolving contradictions nobody noticed were there, however it happens to weigh them.

### The mistake: Patching contradictions instead of resolving them

A rule gets added early — "always cite a source for factual claims." Months later, for an unrelated complaint, another gets added — "keep responses under 3 sentences." Nobody checks whether a claim that genuinely needs a citation can fit both.

**Why it's wrong.** Each rule was locally reasonable the day it was added. Nobody re-reads the whole prompt as one document once it's grown past a page — contradictions accumulate the way merge conflicts do in code nobody re-reviews as a whole.

**Symptom.** Inconsistent behavior that looks arbitrary: the model sometimes cites a source, sometimes doesn't, on comparable questions — because it's silently picking one rule over the other based on wording differences in each user turn, not a resolution anyone actually designed.

**Fix.** Every new rule addition should include a pass over the existing prompt asking "does this contradict anything already here?" When two rules genuinely conflict, state an explicit priority — "brevity wins; drop the citation if it doesn't fit in three sentences" — rather than leaving the model to guess. Treat this the way [Prompt Versioning and Change Management](/learn/prompt-engineering/prompt-versioning-and-change-management) treats any other reviewed edit, not a quick unreviewed patch.

### The mistake: A standalone rule for every observed failure, never consolidated

Each bug report becomes its own bullet — "don't say X," "always do Y when Z happens," "if asked about W, do V" — until the prompt is dozens of increasingly specific, unrelated one-off rules.

**Why it's wrong.** Each rule is individually cheap. The *set* becomes a wall of special cases the model has to hold simultaneously, with no organizing structure to help it prioritize or generalize to a case that's similar but not identical to any single rule.

**Symptom.** Rules from six months ago quietly stop being followed as new ones pile on top — not because any single rule is bad, but because there's more competing content to weigh than signal per rule, and older or lower-precedence-seeming rules get crowded out.

**Fix.** Consolidate specific one-off rules into general principles wherever a pattern emerges. Three separate "don't discuss competitor A/B/C" rules become one "only discuss our own product's features" — the same reframe [Before/After: Turning Prohibitions Into Positive Instructions](/learn/prompt-engineering/rewrite-dont-into-do) walks through directly. A shorter prompt with fewer, higher-level rules generalizes to cases you haven't seen yet; a long list of specific patches never does.

### The mistake: Mixing durable rules with one-off exceptions in the same list

A temporary fix — "for this week's promotion, mention discount code SAVE20" — gets added to the same bulleted list as permanent behavioral rules, and never gets removed once the promotion ends.

**Why it's wrong.** It conflates two different lifecycles — standing behavior versus a dated, temporary instruction — in one undifferentiated list, so nobody can tell at a glance what's safe to prune later.

**Symptom.** The system prompt accumulates stale, expired instructions indefinitely, because removing anything feels risky when nothing in the document indicates what's still relevant.

**Fix.** Keep separate sections — or separate templates entirely — for standing rules versus time-bound ones, and give every temporary addition an explicit expiry note in the source, even if the model itself never sees that metadata. [Prompt Templates and Variables](/learn/prompt-engineering/prompt-templates-and-variables) covers structuring a prompt this way instead of as one flat, undifferentiated list.

### The mistake: Assuming more rules always means more control

Every ambiguity gets "fixed" with one more bullet point, on the theory that an additional explicit instruction is always net-positive, rather than asking whether the prompt's actual structure is the real problem.

**Why it's wrong.** Every additional instruction is competing for token space and attention, not a free addition — see [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state) and [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem) for two separate versions of the same underlying point. Past a certain density, a new rule doesn't add control — it dilutes the rules already there and makes all of them slightly less reliably followed.

**Symptom.** The prompt keeps growing, average adherence to any *individual* rule keeps dropping, and the team's usual response to that drop is to add a rule enforcing the rule — worsening the exact problem it's trying to fix.

**Fix.** Treat system-prompt length as a budget, not a diary. When a new rule seems needed, look for an existing rule to merge it into first, and periodically prune anything nobody can point to a live case for. [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics) is how you check whether removing a candidate rule actually changes any output in your eval set before deciding it's still earning its place.

### The mistake: Never testing which rule actually wins a conflict

Two rules genuinely conflict, and nobody checks which one the model actually follows — the team just assumes it "does the right thing" because both rules are technically present in the prompt.

**Why it's wrong.** The model has to resolve every conflict somehow, and it does so via whatever weak signal happens to be present — ordering, specificity, phrasing — not a documented decision your team actually made.

**Symptom.** The resolution is inconsistent across similar-looking requests, and nobody can explain, when asked, which rule is "supposed" to win in the disputed case.

**Fix.** Find the actual conflicts on purpose — a quick self-review, or a second pass by someone who didn't write the latest patch — and pick a winner explicitly, in writing, inside the prompt itself. Stating "brevity wins over citation" doesn't remove the tension between the two rules; it resolves it in a specific, chosen direction the model can actually follow instead of guess at.

## Pre-flight checklist

- Has anyone re-read the whole system prompt as one document recently, not just the newest addition?
- Do any two rules describe behavior that can't both be satisfied on a plausible real request — and if so, is there an explicit stated priority?
- Are there three or more specific one-off rules that could consolidate into one general principle?
- Is anything in the prompt actually a dated, temporary instruction that's overstayed its relevance?
- Has the prompt's length grown without anyone checking whether adherence to the older rules has dropped?
- For the two most likely conflicts, have you actually tested which rule wins — or are you assuming?

## A quick before/after

Before — six rules, one live conflict, three redundant negatives:

```
- Always cite a specific source for any factual claim.
- Keep every response to 3 sentences or fewer.
- Don't discuss pricing.
- Don't discuss competitors.
- Don't discuss the product roadmap.
- If asked something you can't answer, apologize and end the response.
```

After — four rules, the conflict resolved explicitly, the negatives consolidated:

```
- Answer only using the current product documentation provided in context.
- Cite a source when one is available; if fitting it would exceed 3
  sentences, keep the answer brief and drop the citation.
- Only discuss this product's own current, shipped features — not
  pricing, competitors, or roadmap items.
- If you can't answer from the documentation provided, say specifically
  what's missing and point to [support link].
```

Six rules become four. The citation-versus-brevity conflict is resolved explicitly instead of left implicit. Three negatives collapse into one positive scope line. The bare-apology refusal becomes a positive next step.

**Related:** [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem), [Before/After: Turning Prohibitions Into Positive Instructions](/learn/prompt-engineering/rewrite-dont-into-do), [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state), [Prompt Versioning and Change Management](/learn/prompt-engineering/prompt-versioning-and-change-management), [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics)
