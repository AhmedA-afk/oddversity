---
title: "Where to Put the Instruction: Position and Recency Effects"
track: "prompt-engineering"
status: live
summary: "Why the same instruction gets followed more reliably after a long document than before it, and what that implies for long-context prompts."
duration: "7 min read"
---

Put an instruction before a page of context and the model has to carry it across everything that follows. Put the same instruction after, and it's the last thing read before generation starts. Those are not the same prompt, even though every word in them is identical.

*This is deferred rigor — worth reading once the habit of sectioning your prompts is already in place, not before.*

## The setup: same instruction, two positions

Take one instruction — "Summarize this document in exactly two sentences, and be sure to mention the Q3 deadline" — and one longer document: an internal wiki page covering three unrelated things (a reorg announcement, a product roadmap update, and, in one paragraph near the middle, a Q3 deadline for a compliance filing).

**Instruction first:**

```text
Summarize this document in exactly two sentences, and be sure to
mention the Q3 deadline.

[... 400 words covering the reorg, the roadmap, and the compliance
filing with its Q3 deadline mentioned once, in passing, in paragraph
four ...]
```

**Instruction last:**

```text
[... the same 400 words ...]

Summarize the document above in exactly two sentences, and be sure to
mention the Q3 deadline.
```

Every word is identical. Only the position of the instruction relative to the document changed.

## What "position" actually means, mechanically

A model generates text autoregressively: each next token is predicted conditioned on every token that came before it, through causal self-attention. Attention only looks backward — a token being generated can attend to everything already in the context, but nothing can attend forward to content that hasn't been read yet.

That has a direct consequence for where an instruction sits. If the instruction comes first, it has to survive as *relevant* across everything that follows — by the time the model starts generating the summary, the instruction is 400 words back in the context, competing for attention weight with everything read since. If the instruction comes last, it's the most recent thing in the context the instant before generation starts — nothing has been read since it, and nothing has had a chance to dilute its salience.

This isn't the same claim as "the model forgets" — attention weights are recomputed fresh at every generation step over the full window, so the earlier instruction is technically still "there." But attention to a token's content is not distributed uniformly across a long context. [Context window mechanics](/learn/llm-foundations/context-window-mechanics) describes this as the "lost in the middle" pattern: content near either edge of the context — the very start or the very end — tends to get leveraged more reliably than a proportionally similar stretch buried deep in a long middle section. An instruction placed immediately before generation sits at the strongest possible edge for the specific thing it needs to influence: the next tokens the model writes.

## Running it

On the instruction-first version, a plausible summary mentions the reorg and roadmap — the content that opens the document, closer to the instruction giving the initial framing — and drops the Q3 deadline, which sat in paragraph four of a document the model read in full after the instruction was already several hundred tokens behind it.

On the instruction-last version, the same document, the same instruction, produces a summary that reliably includes the Q3 deadline — the instruction was the last thing read, immediately before the two sentences had to be written, with no intervening content to compete against it for that specific task.

Neither outcome is a guarantee for any single run — this is a positional tendency, not a deterministic law, and [prompting is not deterministic programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) applies here as everywhere else. But the direction of the effect — recency helping the instruction survive to the moment it's needed — is consistent enough to design around.

## The precise tradeoff

Position is not the only lever, and overstating it leads to a different mistake: assuming "just put it last" fixes any instruction, regardless of how it's worded. Two things are true at once:

1. **For short prompts, position barely matters.** A 50-word prompt has no "lost in the middle" — everything is near an edge already. The effect is specifically about long context: the more content sitting between an instruction and the point of generation, the more that instruction benefits from being restated close to the end instead of relying on its opening placement alone.
2. **Repetition can outweigh position.** An instruction stated once at the top and restated once at the bottom — bracketing the content rather than choosing one end — gets both the framing benefit of coming first (so the model reads the document already knowing what it's looking for) and the recency benefit of coming last (so the instruction is fresh at generation time). For anything long enough that this lesson applies at all, bracketing beats picking a single side.

## A rule of thumb for long inputs

Below roughly a page of content, put the instruction first — it's simpler to read, and there's no meaningful decay to design around. Once a prompt carries a genuinely long document, retrieved context, or a long conversation history, restate the instruction immediately before the content that depends on it, even if a fuller version already appeared at the top. The [sectioning](/learn/prompt-engineering/sectioning-a-prompt-into-blocks) habit of always closing a prompt with an output block is a specific case of this rule: format and task constraints belong at the end precisely because that's the position closest to where they're needed.

## Optional depth: this is not "everything belongs at the end"

Don't over-correct into stripping context down or moving *everything* to the bottom. Context that frames how to interpret the document — background, definitions, the policy a decision depends on — still benefits from coming first, because the model needs it before it starts reading the content it's supposed to explain. The recency effect is specifically about the instruction that governs what happens the instant generation begins, not a blanket argument that later is always better. [Why ordering and whitespace matter](/learn/prompt-engineering/why-ordering-and-whitespace-matter) builds the broader intuition this lesson's mechanism sits inside.

**Related:** [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics), [Why Ordering and Whitespace Change the Output](/learn/prompt-engineering/why-ordering-and-whitespace-matter), [Sectioning a Prompt into Blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks), [Reading a Model Failure](/learn/prompt-engineering/reading-a-model-failure), [Prompting Is Not Deterministic Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming)
