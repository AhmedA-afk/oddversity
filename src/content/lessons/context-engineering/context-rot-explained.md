---
title: "Context Rot Explained"
track: "context-engineering"
status: live
summary: "Accuracy can peak well below the token limit and decline from there, even when every added token is genuinely on-topic."
duration: "7 min read"
---

You added more supporting material to the prompt and the answers got worse, not better. That's not a fluke — it's the default behavior of long contexts once you cross a point that's usually far short of the model's advertised limit.

## What it is

Context rot is the decline in a model's accuracy and reliability as its input context grows, even when every added token is on-topic and even when you're nowhere near the model's hard token limit. It's a different failure from truncation or an out-of-context error — those happen when content gets cut off or refused. Rot happens while everything technically fits and technically got read; the model just gets worse at finding, weighing, and using the right parts of it.

The deep mechanics — why attention dilutes rather than deletes, and how position compounds it — are covered in [Context Rot](/learn/context-engineering/context-rot). This lesson is about making the pattern concrete enough that you recognize it in your own evals before it costs you a shipped regression.

## The mental model

Split the context window into two limits instead of one:

- **The hard limit** — the token count the model will accept at all. This is the number everyone tracks.
- **The soft limit** — the point past which the model's ability to *use* what's in the window starts declining. This is the number that actually determines quality, and it isn't fixed. It moves depending on how much of the content is genuinely load-bearing versus filler, and where the load-bearing content sits.

Rot lives in the gap between those two limits. "Did it fit" is the wrong question. "Did it fit *and stay usable*" is the one that predicts what ships well.

## Why it works this way

Attention is computed across every included token on every generation step. Adding more tokens doesn't add more attention capacity — it redistributes the same fixed capacity across a bigger set of candidates. Nothing gets deleted; everything gets diluted. A fact that would be retrieved reliably in a 2,000-token prompt becomes measurably harder to retrieve correctly at 50,000 tokens, even though both technically contain it.

Position makes this worse. Models are strongest at the very start and very end of context and weakest in the middle — see [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) — so the same amount of added volume hurts more when it lands between the edges than when it's appended at one of them. If you want the plain-language version of *why* dilution happens at all, [Why More Tokens Can Hurt](/learn/context-engineering/why-more-tokens-hurt) walks through it with an analogy instead of architecture.

## A concrete example (shown)

Take a task: given a folder of internal API changelog entries, find the one that deprecates a specific function and state its migration path. The target entry is present at every context size tested below — what changes is how much other real, same-domain changelog material surrounds it. This isn't garbage padding; it's plausible, on-topic material, which is what makes the result worth paying attention to.

| Context size | What's included | Accuracy (illustrative) |
|---|---|---|
| ~1k tokens | Target entry only | 84% |
| ~8k tokens | Target + a few dozen neighboring entries | 93% *(peak)* |
| ~16k tokens | Target + more neighboring entries | 87% |
| ~32k tokens | Target + most of the changelog | 76% |
| ~64k tokens | Target + the full changelog | 59% |

These numbers are illustrative — they're meant to show the *shape* of the curve you should expect to measure on your own task, not a published benchmark. Notice the peak isn't at the smallest size: a little neighboring context genuinely helps here, because seeing adjacent entries helps the model disambiguate which function is actually being deprecated. Past roughly 8k tokens, the extra entries stop adding new discriminating signal and start being pure haystack — more candidates to search through for no additional benefit, and accuracy falls accordingly.

That peak-then-fall shape is the signature of context rot. If you only ever tested at 1k or only ever tested at 64k, you'd miss it entirely — you'd see either "more context looks fine" or "this task is just hard," and neither conclusion is right.

## Where it shows up

- **RAG systems that retrieve top-50 chunks "to be safe"** instead of a tightly filtered top-5 — see [Retrieval vs Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing).
- **Long agent transcripts that never get pruned**, where old tool output and dead-end reasoning accumulate turn over turn.
- **"Just attach the whole document" habits** in support tools and copilots, where dumping everything feels safer than curating.

## Watch out for

- **Mistaking "it fits" for "it's fine."** The hard limit and the usable limit are different numbers, and only one of them is visible in your token counter.
- **Assuming the padding has to be irrelevant to hurt you.** The example above used only on-topic, same-domain material — relevance doesn't protect you from dilution.
- **Testing only at demo-sized prompts.** A prompt that looks great at 500 tokens can be well past its peak by the time production traffic pushes it to 30,000.

## Where next

Once the shape of the curve makes sense, the next question is *why* the mechanism works the way it does at a more intuitive level — see [Why More Tokens Can Hurt](/learn/context-engineering/why-more-tokens-hurt). To catch rot happening in a live session rather than an offline eval, see [Detecting Context Degradation](/learn/context-engineering/detecting-context-degradation). And before trusting that any given piece of context is worth its tokens at all, see [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps).

**Related:** [Context Rot](/learn/context-engineering/context-rot), [Why More Tokens Can Hurt](/learn/context-engineering/why-more-tokens-hurt), [Lost in the Middle](/learn/context-engineering/lost-in-the-middle), [Detecting Context Degradation](/learn/context-engineering/detecting-context-degradation), [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps)
