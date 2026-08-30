---
title: "Why Parsing Prose Always Breaks"
track: "structured-outputs"
status: live
summary: "Regex-scraping a model's prose is memorizing one newspaper's layout and expecting tomorrow's edition to match it."
duration: "6 min read"
---

Regex-parsing a model's free-text answer is like memorizing the exact layout of today's newspaper front page, then using that memorized layout to find tomorrow's headline. It works today because the shape happened to line up — not because you found a reliable way to locate a headline.

## The analogy, run as a simulation

You ask a model: "What did you think of this product review?" It answers:

```text
Overall, I'd say this is a positive review — the reviewer loved the
battery life and the camera, though they did mention the price felt a
bit steep. I'd rate it around 4 out of 5.
```

You write extraction code against exactly this wording:

```python
import re
rating = int(re.search(r"(\d) out of 5", text).group(1))
sentiment = "positive" if "positive review" in text else "negative"
topics = re.findall(r"loved the (\w+(?: \w+)?)", text)
```

Run it: `rating = 4`. Good. `sentiment = "positive"`. Good. `topics = ["battery life"]` — already short one item, because the pattern only matches text immediately following "loved the," and "and the camera" doesn't repeat that phrase. It "worked," but only because the newspaper's front page happened to have the headline where you expected.

Now ask about a different review. The model, answering the exact same question correctly, phrases it differently:

```text
This one's mixed, honestly — great screen, mediocre battery, and the
price is fair for what you get. I'd call it a solid 3/5.
```

Every regex breaks at once, on a rewording that changed nothing about the answer's *correctness*: `"3/5"` doesn't match `r"(\d) out of 5"`, so `rating` throws on `None.group(1)`. `"positive review"` never appears, so `sentiment` silently defaults to `"negative"` — wrong, and wrong silently. `"loved the"` never appears, so `topics` comes back empty. The model didn't do anything differently; your pattern only ever matched one specific sentence shape, not the meaning underneath it.

## The wrong intuition, and the correction

The natural response is: "I just need a better regex, or more examples of phrasing to cover." **That's the wrong intuition.** The fragility isn't a skill gap in your pattern-writing — it's structural. Prose has effectively unlimited equivalent phrasings for the same meaning ("solid 3/5," "I'd give it three stars," "middling, call it a 3"), and a pattern matches literal text, not meaning. You are not writing a rating-extractor; you are writing a today's-exact-wording-extractor, and the model owes you nothing about tomorrow's wording.

The fix isn't a smarter pattern — it's not asking for prose in the first place. Request the object directly:

```json
{"sentiment": "mixed", "topics": ["screen", "battery", "price"], "rating": 3}
```

Parsing that is one line — `json.loads(text)` — and it doesn't care whether the model's internal reasoning used the word "solid" or "decent" or "fair," because none of that reasoning ever entered the field values. You've moved the extraction problem from "guess the model's wording" to "ask for the answer," which is a strictly easier and more stable problem. See [From Prose to Parsed, Step by Step](/learn/structured-outputs/from-prose-to-parsed-worked-example) for the full worked conversion, staged end to end.

## When the analogy breaks

The newspaper analogy makes it sound like the fix is simply "get the exact right layout, permanently" — but a `{sentiment, topics, rating}` object isn't magic just because it's JSON. If `sentiment` isn't constrained to an enum, or `topics` has no bound on length, the model can still drift *inside* the object's fields in ways a loose schema won't catch, and you still need the checks covered in [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) — schema conformance and semantic correctness don't come free just because you stopped scraping prose. What structured output kills outright is the specific failure mode in this lesson: a correct answer, differently worded, breaking your extraction code for no reason related to correctness at all.

**Related:** [From Prose to Parsed, Step by Step](/learn/structured-outputs/from-prose-to-parsed-worked-example) · [Why Structured Output](/learn/structured-outputs/why-structured-output) · [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) · [JSON Mode Basics](/learn/structured-outputs/json-mode-basics)
