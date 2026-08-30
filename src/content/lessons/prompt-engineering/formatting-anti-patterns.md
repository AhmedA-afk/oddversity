---
title: "Formatting Anti-Patterns: Over-Fencing and Inconsistent Tags"
track: "prompt-engineering"
status: live
summary: "Five structural habits -- unclosed tags, stacked delimiter styles, shouting, decoration, inconsistent names -- that add noise a model has to parse."
duration: "6 min read"
---

Good structure makes a prompt easier to parse. Bad structure that *looks* thorough — five nested delimiter styles, a wall of ALL-CAPS, a decorative banner around every section — makes it harder, and it's easy to mistake the second for the first because both look deliberate.

## The mistake: mismatched or unclosed tags

**Why it's wrong:** The entire advantage of an XML-style tag over a markdown header is an unambiguous, paired boundary. A typo breaks that guarantee completely — you're left with something that looks structured but provides none of the reliability structure was supposed to buy.

**Symptom:**

```text
<examples>
<example><input>...</input><output>...</output></example>
<example><input>...</input><output>...</output></example>
</example>
```

The closing tag reads `</example>`, not `</examples>`. Content after this point has no clean signal for whether it's still "inside" the examples section or not.

**Fix:** Close every tag with its exact opening name, and keep a small, memorized set of tag names you reuse across prompts — `instructions`, `context`, `examples`, `output_format` — the way [sectioning a prompt into blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks) does, so a mismatch is easier to spot on sight because you know what the pair is supposed to look like.

## The mistake: five nested delimiter styles in one prompt

**Why it's wrong:** Mixing markdown headers, quotes, code fences, XML tags, and horizontal rules in the same prompt doesn't add structure — it adds five competing conventions for "boundary," and the model has to guess which one is doing the real work versus which ones are just visual habit.

**Symptom:**

````text
## Instructions
"Please follow the rules below:"
```
<rules>
---
1. Be concise
---
</rules>
```
````

A markdown header, a quote, a code fence, an XML tag, and a horizontal rule — all fencing the same one sentence.

**Fix:** Pick one primary delimiter style per prompt and use it consistently. [XML vs. Markdown vs. JSON](/learn/prompt-engineering/xml-markdown-json-formatting-tradeoffs) gives a decision table for choosing it; once chosen, resist reaching for a second style "just to be safe."

## The mistake: ALL-CAPS SHOUTING for emphasis

**Why it's wrong:** There's no learned signal that maps typographic volume to instruction importance. "MAKE SURE YOU NEVER DO THIS" doesn't carry more weight than a plain sentence saying the same thing — if anything, heavy caps usage is associated in ordinary text with heated or low-quality writing, which is not the tone you want the response modeling.

**Symptom:** A prompt sprinkled with all-caps clauses — "DO NOT UNDER ANY CIRCUMSTANCES," "THIS IS VERY IMPORTANT" — where the shouted rule still gets missed about as often as it would have if it were written plainly, because volume was never the lever that mattered.

**Fix:** Make importance structural instead of typographic — its own line, its own labeled constraint, placed where [position and recency](/learn/prompt-engineering/instruction-position-and-recency) actually favor it. "Important: refunds require manager approval" as a normal sentence in its own constraint line does the job caps were trying to do.

## The mistake: decorative formatting the model has to parse

**Why it's wrong:** Emoji section headers, ASCII banners, and rows of asterisks add tokens and visual noise without adding a structural signal beyond what a plain header already provides. The model still has to find the actual boundary underneath the decoration — and decoration occasionally leaks into the model's own output style, since it's now part of the pattern it's completing.

**Symptom:**

```text
🔥🔥🔥 INSTRUCTIONS 🔥🔥🔥
=========================
Do the task.
=========================
```

versus:

```text
## Instructions
Do the task.
```

Both mark the same boundary. Only one of them is free.

**Fix:** Strip decoration back to the minimal marker that does the job — a plain header or a plain tag. Save actual formatting effort for the content that needs emphasis, not the chrome around it.

## The mistake: inconsistent names for the same kind of section

**Why it's wrong:** If one prompt calls its background block `<context>`, another calls the same kind of thing `<background>`, and a third uses a plain `## Notes` header, you lose the exact benefit that sectioning is supposed to buy: a predictable place to look. This bites hardest in a shared prompt library, where a template gets copied and modified and the naming quietly drifts each time.

**Symptom:** A teammate maintaining several related prompts has to re-derive "which block is the context block here" on every single one, because the name isn't stable across the set — the opposite of the [beginner mistake](/learn/prompt-engineering/beginner-prompting-mistakes) of not naming sections at all, but just as costly once a library grows past a couple of prompts.

**Fix:** Fix a small vocabulary of section names up front and reuse it everywhere, even when a given prompt's content is unusual enough that a more specific name feels tempting. Consistency beats specificity here — the goal is that both you and the model can predict where to look, echoing the same rule [XML tags vs. Markdown](/learn/prompt-engineering/xml-tags-vs-markdown) makes about tag naming.

## Pre-flight checklist

- [ ] Every opening tag has a matching, correctly spelled closing tag.
- [ ] The prompt uses one primary delimiter style, not several stacked together.
- [ ] Emphasis is structural — position, a labeled constraint line — not typographic.
- [ ] Section markers are the minimal thing that does the job, with no decorative wrapping.
- [ ] Section names match the small, fixed vocabulary used across your other prompts.

**Related:** [Prompt Anti-Patterns](/learn/prompt-engineering/prompt-anti-patterns), [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting), [XML Tags vs. Markdown](/learn/prompt-engineering/xml-tags-vs-markdown), [Sectioning a Prompt into Blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks), [Instruction Position and Recency](/learn/prompt-engineering/instruction-position-and-recency), [Beginner Prompting Mistakes](/learn/prompt-engineering/beginner-prompting-mistakes)
