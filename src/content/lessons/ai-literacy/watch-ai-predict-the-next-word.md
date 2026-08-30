---
title: "Watch AI build a sentence, one word at a time"
track: "ai-literacy"
status: live
summary: "A click-by-click worked example of a model completing 'The capital of Australia is,' then a second run on a lookalike prompt showing how the identical weighing mechanism can produc."
duration: "14 min read"
---

Every sentence a language model produces is really a chain of small, separate bets — one per word. Slow that process down and you can watch a sentence get built one bet at a time, including the exact spot where a confident bet turns out to be wrong.

## The setup

We'll use a prompt this module keeps coming back to:

`The capital of Australia is`

[How language models produce text](/learn/ai-literacy/how-language-models-produce-text) covered the pipeline in general — tokenize, score, pick, repeat. Here we run that loop by hand, on this exact prompt, and watch two things:

1. what the scored list of candidates actually looks like at each step, and
2. what happens later, on a lookalike prompt, when the highest-scoring word isn't the correct one.

Two honesty notes before the numbers. Real models score across a vocabulary of tens of thousands of tokens (see [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding) for the token-splitting mechanics) — we're only showing the top handful, since those are the only ones with enough weight to matter. And the percentages below are illustrative: shaped to make the mechanism visible, not measured from any specific model's actual output. The mechanism is real; the exact numbers are a teaching aid.

## Step by step

### Step 1 — the prompt becomes a scored list, not a lookup

Feed in `The capital of Australia is` and the model doesn't search for "Australia's capital" anywhere. It assigns a score to every possible next token, which shakes out — near the top — like this:

```
Canberra              ██████████████████████████████  61%
Sydney                ████████████                     24%
Melbourne             █████                              9%
(everything else)     ███                                6%
```

> **Why this step?** This is the whole idea of the module made concrete: "generating text" is "assigning a number to every possible next word, then turning those numbers into percentages." Canberra wins not because the model looked anything up, but because in its training text, "capital of Australia is Canberra" is a far more common pattern than the alternatives. Sydney and Melbourne show up at all because they're large, famous Australian cities that get mentioned constantly near the words "Australia" and "capital" — just not usually as the answer to this specific pattern.

### Step 2 — one word gets picked, not "the best sentence"

The model doesn't plan a sentence. It picks one token from that list — usually the top-scoring one — and the rest of the list is gone.

```
The capital of Australia is Canberra
```

> **Why this step?** This is where variety enters the picture. Always taking the top score (greedy decoding) gives the same output every time. Occasionally letting the model take the second- or third-place option instead — the setting sometimes exposed as "temperature" — is why the same prompt can read slightly differently on two runs. Neither approach checks whether Canberra is correct; both are just rules for reading the same scored list.

### Step 3 — the chosen word becomes new context, and the model scores again

`Canberra` is now part of the input. The model re-scores from scratch, conditioned on everything written so far:

```
The capital of Australia is Canberra

,                     █████████████████████████████████████████  45%
.                     ████████████████████████████               30%
 in                   ███████████████                             15%
(everything else)     ██████████                                  10%
```

> **Why this step?** Nothing carries over from Step 1 except the text itself. There's no separate memory of "I already answered the geography question, now I'm doing punctuation." A comma goes through the identical score-then-pick loop the word "Canberra" just went through.

### Step 4 — repeat until the sentence is done

Here's that same loop as a small script — three steps, using the numbers above so nothing is hidden — just "pick the top, tack it on, feed it back in":

```python
sentence = "The capital of Australia is"

# Pretend per-step scores, matching the bars above (illustrative, not a real model's output)
steps = [
    {" Canberra": 61, " Sydney": 24, " Melbourne": 9, " (other)": 6},
    {",": 45, ".": 30, " in": 15, " (other)": 10},
    {" not": 50, " the": 20, " home": 15, " (other)": 15},
]

for step_scores in steps:
    next_token = max(step_scores, key=step_scores.get)
    sentence += next_token
    print(sentence)
```

Running it prints:

```
The capital of Australia is Canberra
The capital of Australia is Canberra,
The capital of Australia is Canberra, not
```

> **Why this step?** Watching the loop as three tiny dictionaries removes any mystery from the word "autoregressive": nothing but repeatedly picking from a list and appending. Keep repeating that exact loop — score, pick, append, repeat — a few dozen more times, and you land on a finished sentence such as: "The capital of Australia is Canberra, not Sydney as many assume." Nothing new happened at word fifty that didn't happen at word one.

## Where it breaks

Change the prompt slightly:

`The capital of Switzerland is`

Same mechanism, but this time the correct answer — Bern — isn't the country's most famous or most-mentioned city. Zurich is. Zurich shows up constantly in text about Switzerland — banking, airports, sports, tourism — so "Switzerland" and "Zurich" end up sitting much closer together in the training patterns than you'd expect for a wrong answer. Most of that closeness comes from ordinary text about Switzerland in general, not from anyone actually stating a false capital.

```
Zurich                ██████████████████████████  52%
Bern                  ████████████████████████    44%
Geneva                █                              2%
(everything else)     █                              2%
```

(Illustrative again — a close, wrong-leaning race built to show the mechanism, not a measurement of any specific model on any specific date. Different models and prompts land differently, and often correctly.)

If the model takes the top score here, you get a fluent, confident, wrong sentence: "The capital of Switzerland is Zurich." Nobody lied. There is no step in this pipeline where the model knows the truth and chooses to say something else — that would require a belief to override, and a scored list of tokens doesn't hold beliefs. It weighed patterns, exactly like it did for Canberra, and this time the wrong pattern was heavier. This is the mechanical core of what gets called a hallucination — see [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) — and it's also why the output reads just as confident either way: fluency is scored token by token; correctness isn't scored at all. That gap is most of the story behind [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) even when it's wrong.

### The fix isn't "try harder" — it's changing what gets weighed

Two moves actually work, because they change the input to the scoring step instead of hoping the model tries harder:

1. **Check it independently when it's checkable.** A capital city is a one-search fact. Treat "the capital of X is Y" the way you'd treat any other unsourced claim — see [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources).
2. **Put the fact in the context instead of just asking for it.** Prompt with "According to Switzerland's federal government, the capital is Bern. What is the capital of Switzerland?" and you've changed what's sitting right next to the question at scoring time. Now "Bern" is the closest, most recent, most reinforced pattern, and it wins for a structural reason instead of a hopeful one. That's the [data → model → output loop](/learn/ai-literacy/data-model-output-loop) at work — better input produced the better output, not a smarter model.

What doesn't fix it: telling the model to "be careful" or "double-check itself" without giving it anything new to check against. That changes the wording of the output, not the weights sitting behind it.

## Takeaways

- Every generated word is one weighted pick from a scored list over the model's whole vocabulary — not a lookup, and not a plan for the sentence as a whole.
- The correct answer usually wins because it's the dominant pattern in the training text, not because anything checked it against reality.
- When a wrong-but-common pattern is the dominant one instead, the identical mechanism produces a fluent, confident, wrong answer — no belief was overridden, because there was no belief to begin with.
- Fluency and correctness are scored by completely different processes. A sentence typed with total confidence is not evidence that it's true — treat "capital of / largest / first person to" facts as unverified until checked, especially ones with a famous wrong runner-up.
- The reliable fix is upstream of the sentence: put the true fact in the context, or verify independently. Asking the model to "be careful" doesn't touch a single weight.
- Try it yourself: pick a close pair you already know — Canberra/Sydney, Bern/Zurich, or one from your own field — and ask a model directly. See whether the famous wrong answer wins.

**Related:** [How language models produce text](/learn/ai-literacy/how-language-models-produce-text) · Watch AI predict the next word · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [Catch a hallucination: worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification)
