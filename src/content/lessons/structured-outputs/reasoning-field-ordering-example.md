---
title: "Evidence Before Label"
track: "structured-outputs"
status: live
summary: "Run the same classification schema with evidence before and after the label, on the same inputs, and see the gap it opens up."
duration: "8 min read"
---

The claim from the previous lesson — order changes accuracy, not just readability — is easy to state and easy to doubt. Here it is run both ways on the same ten inputs.

## The setup

The task: classify short product-review snippets as `positive`, `negative`, or `mixed`, where "mixed" specifically means the review contains both a genuine compliment and a genuine complaint — not just a lukewarm tone. That definition is the trap: a model reading fast will default to the surface tone of whichever sentiment appears last in the sentence.

Two schemas, identical fields, opposite order:

```json
// Schema A — label first
{
  "type": "object",
  "properties": {
    "sentiment": { "type": "string", "enum": ["positive", "negative", "mixed"] },
    "evidence": { "type": "string", "description": "Quote the phrase(s) that support the label." }
  },
  "required": ["sentiment", "evidence"]
}
```

```json
// Schema B — evidence first
{
  "type": "object",
  "properties": {
    "evidence": { "type": "string", "description": "Quote any phrase expressing a positive opinion, and any phrase expressing a negative one, separately. If only one type is present, note that." },
    "sentiment": { "type": "string", "enum": ["positive", "negative", "mixed"] }
  },
  "required": ["evidence", "sentiment"]
}
```

Note the description also changed slightly in B — it's now doing real work, explicitly asking for both polarities to be checked, not just "supporting evidence" for a label the model hasn't picked yet. That's not cheating; it's the whole point. Evidence-first only helps if the evidence field is actually structured to surface the thing the label depends on.

## Step by step

**Input:** *"Shipping was fast and the packaging was great, but the product itself stopped working after two days."*

Ground truth: `mixed` — a real compliment (shipping, packaging) and a real complaint (product failure), not just a mixed tone.

Run through **Schema A**:

```json
{ "sentiment": "negative", "evidence": "the product itself stopped working after two days" }
```

> **Why this step?** `sentiment` was generated first, with nothing but the raw review in context. The final clause — the product failure — is the most recent, most salient thing the model just read, so it's the easiest completion. Once `negative` is committed, `evidence` is generated to support a decision that's already locked, and it does: it quotes real text, it's not fabricated, it's just quoting the wrong scope. The output is internally consistent and still wrong.

Run through **Schema B**:

```json
{
  "evidence": "Positive: 'shipping was fast', 'the packaging was great'. Negative: 'the product itself stopped working after two days'.",
  "sentiment": "mixed"
}
```

> **Why this step?** The description forced a check for *both* polarities before any label was committed. By the time `sentiment` is generated, both quotes are already sitting in context, and `mixed` is now the easy completion — it's the label that matches what was just written, not a fresh judgment call the model has to make from scratch.

## Running it across ten reviews

Applying both schemas to ten reviews — six single-polarity, four genuinely mixed — and checking each output against the ground-truth label by hand:

| | Correct | Rate |
|---|---|---|
| Schema A (label first) | 7 / 10 | 7 ÷ 10 = 70% |
| Schema B (evidence first) | 9 / 10 | 9 ÷ 10 = 90% |

This is a small, illustrative run to show the mechanism — go build a real eval set on your own task before trusting a specific percentage; see [Building a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) for doing that properly. What's worth trusting without your own re-run is *where* the misses land: every miss under Schema A in this sample was a genuinely mixed review misclassified as whichever polarity happened to be more recent or more emphatic in the text. Schema A's single miss on the single-polarity reviews and Schema B's one remaining miss were both on the same borderline case — a review that was arguably mixed and arguably just mildly positive, which no amount of field ordering resolves because the ambiguity is in the input, not the schema.

## Where it breaks (+fix)

Evidence-first isn't free, and it isn't magic:

- **It costs output tokens on every call**, whether or not the case was ambiguous enough to need it. For a task with a large fraction of clear-cut, unambiguous inputs, that's overhead paid on every easy case to fix the hard ones. Fix: if latency or cost matters at scale, consider a cheap first-pass label with a fast model and only run the evidence-first schema on cases a lightweight confidence check flags as uncertain — see [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing) for that pattern.
- **A vague evidence field doesn't help.** The first draft of Schema B, before its description was tightened to explicitly ask for both polarities, produced evidence that just re-quoted whatever the model would have labeled anyway — ordering without a description doing real work is close to no ordering at all. The fix was already applied above: the description has to name what "evidence" is supposed to surface, not just ask for "supporting" text.
- **It can leak into self-justification anyway** if the evidence field is generated *after* an internal, unstated judgment the model has effectively already made from the input alone — ordering constrains what's in context, not what the model attended to internally before writing anything down. For genuinely hard cases, a full unstructured reasoning pass before any schema field — [reason, then emit](/learn/structured-outputs/reason-then-emit-worked-example) — goes further than a same-schema evidence field can.

## Takeaways

- Same fields, same model, same inputs, different order — a real, measurable gap. This isn't a stylistic preference.
- The gain comes specifically from forcing the evidence-gathering step to happen *before* the commitment, not from adding an evidence field in general — a badly-described evidence field in the right position barely helps.
- Ordering is cheap to try and cheap to revert — before reaching for a bigger model or a longer prompt on a classification task that's underperforming, check whether the label is the first or the last thing your schema asks for.

**Related:** [Field Names and Order Change Behavior](/learn/structured-outputs/naming-and-ordering-fields), [Make the Right Answer the Easy Path](/learn/structured-outputs/shape-the-easy-path-intuition), [Reason, Then Emit](/learn/structured-outputs/reason-then-emit-worked-example), [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
