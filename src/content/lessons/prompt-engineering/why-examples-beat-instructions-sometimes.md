---
title: "Why a Good Example Outperforms a Paragraph of Rules"
track: "prompt-engineering"
status: live
summary: "One worked example can encode formatting and edge-case handling that a page of written rules will still leave ambiguous."
duration: "6 min read"
---

Assemble a bookshelf from a page of written instructions — "insert bolt A into panel B, oriented so the flat side faces outward, then attach bracket C at a 90-degree angle" — and you'll still hit a step where the words run out and you're staring at two panels that both technically satisfy the sentence. Hand the same person one photo of the finished, correctly-assembled shelf, and every one of those gaps closes at once, without a single additional sentence.

## The analogy: a photo versus a page of instructions

A furniture diagram in words has to enumerate every decision separately — which way is "outward," how tight is "snug," what does "aligned" mean when nothing in the sentence names what it's aligned *to*. Each new rule is a chance to under-specify something or to quietly contradict a rule two steps earlier. A photo of the assembled result doesn't enumerate anything. It just *is* a single, fully consistent point that satisfies every constraint simultaneously — orientation, spacing, angle, finish — whether or not anyone wrote a rule for each one.

## Walking through it step by step

Picture assembling the shelf from rules alone. Step 4 says "attach the shelf pins evenly spaced along the panel." Evenly spaced according to what — the panel's visible edge, or the inset line printed on it? The rule doesn't say, because whoever wrote it pictured one specific case and didn't realize the sentence was ambiguous until someone else read it differently. Step 7 says "the back panel should sit flush." Flush with the frame, or flush with the side panels, which happen to sit slightly proud of the frame in this specific model? Two more judgment calls, two more places an entirely rule-following assembler can end up with a wrong-but-rule-compliant shelf.

Now put the photo next to the same two steps. The pin spacing is just *there*, visibly measured against the inset line, because that's what the real finished shelf shows. The back panel's flush line is visibly the frame line, not the side-panel line, because that's how the one correct instance actually looks. No enumeration happened. The photo didn't need to anticipate that "flush with what" would be ambiguous — a single concrete instance is inherently unambiguous about every property it actually has, even the ones nobody thought to write a rule for.

This is exactly what happens with a citation format. Here's a plausible six-rule instruction:

```text
1. List authors as Last, F. M., separated by commas, with "&" before the final author.
2. Put the year in parentheses immediately after the author list.
3. Write the title in sentence case, not title case.
4. Italicize the journal name, in title case.
5. Italicize the volume number; the issue number goes in parentheses, not italicized.
6. Use an en dash with no surrounding spaces for the page range.
```

Six rules, each individually reasonable, and there's already a gap: nothing here says whether a comma follows the year's closing parenthesis, whether the volume and issue sit right next to each other with no space, or exactly where the italics run stops relative to the comma after it. Now the single worked example:

```text
Smith, J. R., & Alvarez, K. (2021). Attention is not the only thing you need. *Journal of Applied Linguistics*, *14*(3), 220–239.
```

Every one of the six rules is satisfied here, visibly, all at once — and so are the things the rules never got around to specifying: comma placement after the year, no space between the italic volume and the non-italic issue, and exactly where each italic run starts and ends. A model completing a fourth citation from this one example inherits all of that, correctly, without ever being told the parts the rules missed.

## Correcting the wrong intuition

The tempting assumption is that examples are just a compressed, informal version of rules — so a sufficiently detailed, sufficiently explicit set of rules should be strictly better, since it's more precise and leaves nothing to infer. That gets the mechanism backwards. Rules are discrete and additive: each new one is a separate constraint that has to be individually correct, individually complete, and non-contradictory with every rule already written, and the more of them you add, the more surface area there is for exactly one to be vague or to clash with another. A worked example isn't a list of constraints at all — it's a single point that automatically satisfies whatever constraints it happens to satisfy, with no separate step where those constraints have to be checked against each other. There's no seam where two examples-worth of formatting can contradict each other, because a single example is just one internally consistent artifact. This is also why an example generalizes cleanly through [in-context learning](/learn/prompt-engineering/in-context-learning-for-prompters): the model is completing a pattern it can see whole, not resolving a rulebook.

## When the analogy breaks

An example only teaches what it demonstrates — it can't communicate a rule that has cases the example never touched. The citation example says nothing about what happens with four authors ("et al." at what threshold?) or a source type it isn't — a website, a book chapter, a dataset. For genuinely combinatorial cases like that, you still need either more examples covering each variant, or an actual written rule for the part no single example can show. The photo analogy has the same limit: it teaches you *this* shelf, not what to do if your kit is missing a bracket.

The analogy also breaks when the task isn't formatting at all but a reasoning procedure — getting a correct number out of a word problem, say. A citation format is a single static shape a photo can fully capture; a multi-step calculation is a *process*, and one finished-looking example can hide exactly which arithmetic steps produced it. See [Examples for Format vs Examples for Reasoning](/learn/prompt-engineering/examples-for-format-vs-reasoning) for where showing the steps, not just the shape, becomes the thing that matters.

And it breaks one more way: an example can accidentally teach something you never meant to demonstrate, the same way a photo of one specific shelf color might mislead someone into thinking the color is part of the assembly instructions. See [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage) for exactly this failure mode.

**Related:** [In-Context Learning: Teaching by Example at Inference Time](/learn/prompt-engineering/in-context-learning-for-prompters) · [Examples for Format vs Examples for Reasoning](/learn/prompt-engineering/examples-for-format-vs-reasoning) · [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage) · [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting)
