---
title: "How Text Becomes Its Own Answer Key"
track: "ai-foundations"
status: live
summary: "A worked example that turns 'the cat sat on the ___' into a labeled training pair by hand, scales the same trick across a paragraph to show why raw text becomes free supervision, t"
duration: "16 min read"
---

You already know the trick from grade-school fill-in-the-blank worksheets. The surprising part is that it's also the entire mechanism behind training a language model on raw, unlabeled text — no human annotator required.

## The setup (specific)

Start with one sentence, no metadata attached to it:

```
the cat sat on the mat
```

That's it. It's a string. Compare this to what [supervised learning](/learn/ai-foundations/supervised-learning-explained) normally needs: a dataset of `(input, label)` pairs that a human built on purpose — a photo someone tagged `"cat"`, an email someone marked `"spam"`. This sentence has no such column. There is no label sitting next to it.

Except there is, if you're willing to hide part of the sentence from yourself. Take everything up to the last word as the input, and the last word as the label:

```
X = "the cat sat on the"
y = "mat"
```

You didn't add anything. You didn't ask anyone to annotate anything. You took six words that already existed and drew one line through them. That line is the entire trick this page is about — this is the concrete mechanism behind what [self-supervised learning](/learn/ai-foundations/self-supervised-learning) means in the abstract: the supervision was never missing, it was just still attached to the input.

## Step by step

**Step 1 — Start from plain text.**

```python
sentence = "the cat sat on the mat"
tokens = sentence.split()
print(tokens)
# ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

Six tokens, zero labels. Nothing here is training data yet in the supervised sense — it's just a sequence.

> **Why this step?** It's worth pausing on how little this is. A labeled dataset usually costs someone hours of tagging. This cost nothing, because nobody has *removed* anything yet — the "answer" is still sitting in the sequence in plain sight.

**Step 2 — Pick a cut point; the word right after it becomes the label.**

```python
i = 5
context, target = tokens[:i], tokens[i]
print(context, "->", target)
# ['the', 'cat', 'sat', 'on', 'the'] -> mat
```

This is exactly `"the cat sat on the ___"`. The blank isn't a special placeholder the dataset shipped with — it's just index `5`, and you chose to look away from it before calling it "input."

> **Why this step?** This is the whole manufacturing process compressed into one line. `tokens[:i]` is the input a model gets to see; `tokens[i]` is the label it's graded against. No separate label file, no annotation UI — the split *is* the supervision.

**Step 3 — Slide the cut point to get more than one pair from the same sentence.**

```python
def make_training_pairs(tokens):
    return [(tokens[:i], tokens[i]) for i in range(1, len(tokens))]

for context, target in make_training_pairs(tokens):
    print(context, "->", target)
```

```
['the'] -> cat
['the', 'cat'] -> sat
['the', 'cat', 'sat'] -> on
['the', 'cat', 'sat', 'on'] -> the
['the', 'cat', 'sat', 'on', 'the'] -> mat
```

One six-word sentence just produced **five** training examples, not one.

> **Why this step?** This is the part that's easy to undersell. You didn't write five sentences — you wrote one, and the sliding cut turned its length into a multiplier. A dataset's size is no longer "however many examples someone labeled," it's "however many tokens exist," which is a very different number.

**Step 4 — Scale it to a paragraph.**

```python
paragraph = (
    "the cat sat on the mat and watched the rain fall outside "
    "the window everyone knows the great wall of china is "
    "visible from space"
)
tokens = paragraph.split()
pairs = make_training_pairs(tokens)

print(len(tokens), "tokens ->", len(pairs), "training pairs")
# 25 tokens -> 24 training pairs

print(pairs[4])
# (['the', 'cat', 'sat', 'on', 'the'], 'mat')
print(pairs[-1])
# ([...everything before it...], 'space')
```

A single 25-word paragraph — something you'd write in about ten seconds — just yielded 24 labeled examples, including the exact `mat` pair from before, buried inside it as pair #5.

> **Why this step?** This is the "why the whole internet" part of the argument, stated as arithmetic instead of a slogan. Every additional token you add to the corpus isn't just more text to read — it's simultaneously one more `(context, label)` pair, for free. Scale the paragraph to a book, a website, a decade of forum posts, and the pair count scales linearly right along with it, with no annotation team in the loop.

**Step 5 — Turn the label into something a loss function can grade.**

A label is only useful once you can score how wrong a guess was. Say the model outputs a probability for every word in a small vocabulary:

```python
import numpy as np

vocab = ["the", "cat", "sat", "on", "mat", "rug",
         "and", "watched", "rain", "fall"]
word_to_id = {w: i for i, w in enumerate(vocab)}

predicted_probs = np.array([0.05, 0.02, 0.03, 0.02, 0.55,
                             0.20, 0.03, 0.03, 0.04, 0.03])

target_id = word_to_id["mat"]
loss = -np.log(predicted_probs[target_id])
print(f"loss: {loss:.2f}")   # loss: 0.60
```

`0.60` nats is the [cross-entropy loss](/learn/ai-foundations/loss-functions-explained) for putting 55% of the probability mass on the correct label. That number is what gradient descent actually pushes on — the blank you drew in Step 2 only matters because it can be plugged into an equation like this one.

> **Why this step?** "Manufactured label" is a nice phrase, but it doesn't train anything by itself. This step is the wire connecting the label back to ordinary supervised machinery — same loss, same gradients, same optimizer as any other classification problem, just with a vocabulary-sized set of classes instead of `spam` / `not spam`.

**Step 6 — Scale the trick itself, not just the paragraph.**

Two things change once you leave the toy example behind. Real tokenizers don't split on whitespace — they use subword units via [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding), so `"watched"` might become two or three tokens, not one. And the corpus isn't one paragraph, it's on the order of trillions of tokens. Run the exact `make_training_pairs` loop from Step 3 across that instead of six words, and you've just described [pretraining](/learn/ai-foundations/pretraining-vs-finetuning) a language model — the raw, next-token objective that comes before any instruction-following behavior is layered on top.

> **Why this step?** Nothing new is invented between your six-word sentence and a frontier model's pretraining run — it's the same cut-and-reveal loop, industrialized. That's the honest version of "LLMs are trained on the whole internet": the internet didn't need to be labeled, it needed to be sliced.

## Where it breaks

**Failure 1: the "one true label" fiction.** Go back to `"the cat sat on the ___"`. `mat` is what actually followed in this sentence, but `rug`, `floor`, `couch`, and `step` are all completely reasonable. The loss function doesn't know that — it only knows what was observed once, here:

```python
alt_probs = np.array([0.05, 0.02, 0.03, 0.02, 0.20,
                       0.55, 0.03, 0.03, 0.04, 0.03])
alt_loss = -np.log(alt_probs[word_to_id["mat"]])
print(f"loss if the model preferred 'rug' instead: {alt_loss:.2f}")
# loss if the model preferred 'rug' instead: 1.61
```

A model that confidently (55%) predicted `rug` — arguably just as sensible a sentence — gets penalized almost 3x harder than one that predicted `mat`, purely because `mat` is what this one sentence happened to contain. A single `(context, label)` pair is a genuinely noisy, ambiguous training signal by itself.

*The fix isn't a smarter label — it's more of them.* Somewhere else in a large corpus there's `"the dog sat on the rug"`, `"she sat on the floor"`, `"he sat on the couch"`. None of those pairs is "more correct" than yours; averaged across millions of them, the gradient updates blend into something that approximates the real distribution of plausible next words, rather than treating any single observed word as absolute ground truth. This is exactly why scale isn't a nice-to-have for this method — it's the only thing that turns a noisy per-example signal into a usable one.

**Failure 2: the label doesn't know true from false.** Look at the second half of the paragraph you scaled up in Step 4: `"...the great wall of china is visible from ___"` cuts to the label `space` — a widely repeated claim online that happens to be false. The slicing process manufactured that pair with zero regard for whether it's true, grammatical, or even coherent; it only ever asks "what token literally came next here?" Whatever sits in [the data the model learned from](/learn/ai-foundations/the-data-the-model-learned-from) — typos, sarcasm, outdated facts, popular myths — gets reproduced as a confidently-labeled training example exactly like `"mat"` was. This is a direct, mechanical reason models trained this way can [hallucinate](/learn/ai-foundations/why-llms-hallucinate) with total fluency: fluent and true were never the same objective here.

The partial fix at the pretraining stage is dilution, not correction — enough independent, correct mentions of a fact elsewhere in a large, diverse corpus can statistically outweigh one popular myth, but nothing guarantees it, and systematic biases in the source text don't dilute away just because the corpus is big. The real fix happens one stage later, when the model is optimized against actual human judgments of correctness instead of raw next-token statistics — which is a different training signal, not more of the same one.

## Takeaways

- Any stretch of text already contains its own labels — self-supervision doesn't add information, it just decides where to draw the line between "input" and "label" on data that already exists.
- The number of free training pairs scales with corpus length, not annotation budget. That's the actual reason "the whole internet" became a usable dataset the moment someone wrote a loop like `make_training_pairs`.
- A single `(context, label)` pair is a weak, ambiguous signal — it records only what happened to come next, not what would have been equally valid. The fix is never a better label; it's overwhelming volume from independent contexts so the noise in any one example washes out.
- The masking process has no fact-checker and no grammar-checker. It faithfully turns whatever is in the source text — true or false, careful or careless — into an equally confident training pair.
- Run this exact mechanism across trillions of tokens with subword tokens and a much wider context window, and you have described language model pretraining, not an analogy for it.

**Related:** [Self-supervised learning](/learn/ai-foundations/self-supervised-learning) · [Supervised learning, explained](/learn/ai-foundations/supervised-learning-explained) · [How LLMs work](/learn/ai-foundations/how-llms-work) · [RLHF and instruction tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) · [Scaling laws, worked example](/learn/ai-foundations/scaling-laws-worked-example) · [Context window mechanics](/learn/llm-foundations/context-window-mechanics)
