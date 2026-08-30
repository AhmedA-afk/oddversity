---
title: "Which Kind of Learning Is This?"
track: "ai-foundations"
status: live
summary: "A 6-question self-check quiz that tests whether learners can name supervised, unsupervised, self-supervised, and reinforcement learning from real scenarios (fraud labels, recommend"
duration: "18 min read"
---

You've studied supervised, unsupervised, self-supervised, and reinforcement learning one at a time. The actual skill is different: someone hands you a raw problem with no paradigm label attached, and you have to name it — and defend the name when someone pushes back. That's what this page checks.

## Before you start: the three questions that actually decide it

Every one of the 27 pages before this one is really answering one of three questions. Once you can run through them fast, naming a paradigm stops being a guessing game.

1. **Is there a target at all** — something specific the model outputs that gets checked against an answer? No target anywhere, just a search for structure (clusters, dimensions, "what's normal") → [unsupervised learning](/learn/ai-foundations/unsupervised-learning).
2. **If yes — where did that target come from?** A human, a lab result, an external process resolving a real-world question (a chargeback, a diagnosis, a sale price) → [supervised learning](/learn/ai-foundations/supervised-learning-explained). Carved directly out of the raw data's own structure — the next token, the masked word, the next item in a sequence — with no separate annotation step → [self-supervised learning](/learn/ai-foundations/self-supervised-learning).
3. **Is the model making one-shot predictions, or a sequence of decisions in an environment** where its own choices shape what it sees next, scored by a reward rather than a per-example correct answer? → [reinforcement learning](/learn/ai-foundations/reinforcement-learning-basics).

Notice what's *not* on that list: the algorithm, the architecture, whether the data is numeric, how big the dataset is. All four paradigms run on neural networks, all four can use gradient descent, all four can chew through a billion rows. None of that tells you the paradigm. Only the shape of the feedback does.

## Warm-up: call these ten before you check

Read each one and make a call — supervised, unsupervised, self-supervised, or reinforcement learning — before opening the answer key.

| # | Scenario |
|---|----------|
| 1 | A bank has three years of transactions where fraud analysts marked each one confirmed-fraud or confirmed-legitimate; a model scores new transactions against that history. |
| 2 | A retailer's raw session logs show which items land in the same basket; the team wants to discover product categories nobody defined ahead of time. |
| 3 | The same session logs, but now the team wants to predict the very next item a shopper will add, using the item they actually added next (already sitting in the log) as the answer key. |
| 4 | A language model trained on a scrape of public web text, learning to guess the next token from the tokens before it. |
| 5 | A robot arm in simulation tries thousands of grasp motions and gets +1 when it successfully lifts the object, 0 otherwise. |
| 6 | An email client trains a spam filter on messages users have personally clicked "report spam" on. |
| 7 | A telecom clusters customers by usage pattern into groups, with no predefined segment names, purely to see what natural groupings exist. |
| 8 | A model predicts a house's sale price from square footage and location, trained on past listings with known sale prices ([classification vs. regression](/learn/ai-foundations/classification-vs-regression) matters here — this one's continuous). |
| 9 | A chess engine plays millions of games against itself, updating its policy based on which moves led to wins. |
| 10 | An SRE team trains a model on 18 months of server metrics with zero labeled incidents; it learns the shape of "normal" and flags anything that falls far outside it. |

<details>
<summary>Answer key</summary>

1. **Supervised (classification)** — the label came from an external adjudication process (the chargeback investigation), not from the transaction's own structure.
2. **Unsupervised** — no target defined anywhere; the goal is to discover a grouping, not predict a value.
3. **Self-supervised** — a target exists (the next item), but it's carved automatically out of the sequence's own order, not hand-labeled.
4. **Self-supervised** — same mechanism as #3, at web scale: the next token is the target, taken directly from the text.
5. **Reinforcement learning** — sequential actions scored by a delayed reward, not a per-attempt correct answer.
6. **Supervised (classification)** — the user's own click is the label, but it's still an external signal assigned to the example, not derived from the email's structure.
7. **Unsupervised** — clustering with no predefined target.
8. **Supervised (regression)** — a continuous target (price) taken from real past sales.
9. **Reinforcement learning** — self-play, reward from the game outcome, no per-move ground truth.
10. **Unsupervised (anomaly / density estimation)** — no incident labels exist; the model just learns the normal distribution and flags deviation from it.

</details>

If you called all ten correctly, the six questions below will still slow you down — they ask you to defend the call against a plausible wrong reason, not just state it.

## The real test: six scenarios, justify your answer

### 1. The fraud model

A payments company scores every transaction with a fraud model. Every training row has a label: confirmed-fraud (closed chargeback) or confirmed-legitimate (90 days, no dispute filed). Which paradigm is this, and why?

A. Self-supervised — the label was generated automatically once 90 days passed; no analyst sat down and tagged every row by hand.
B. Supervised — every example has a ground-truth target assigned by an external process (the chargeback outcome), and the model is trained to predict that target.
C. Unsupervised — the model still has to work out on its own which transaction features actually matter for "fraud."
D. Reinforcement learning — the model gets "rewarded" for catching fraud and "punished" for missing it or raising false alarms.

<details>
<summary>Answer</summary>

**Correct: B.** The defining feature of supervised learning isn't *who* typed the label in — it's that a target came from *outside the data's own structure* (a chargeback investigation, a human reviewer, a lab result) and the model is scored against that target example by example.

**A** — The "automatic" part is a red herring. Self-supervised specifically means the target is carved out of the *input's own structure* (like the next word in a sentence). A 90-day dispute window isn't part of the transaction's structure; it's an external process resolving an outside-world question ("did this actually turn out to be fraud?"). That external resolution is exactly what makes it supervised — whether a human clicks a button or a timer does.

**C** — Learning its own internal representations doesn't change the paradigm. Plenty of supervised models, deep nets especially, learn rich internal features on the way to their prediction. Paradigm is about where the *target* comes from, not whether representation learning happens under the hood.

**D** — The setup borrows reward-shaped language ("catching," "missing"), but there's no environment where the model's decisions change future inputs, and no policy optimized over a sequence of actions — it's one-shot classification per transaction. Reusing reward vocabulary doesn't make something RL.

</details>

### 2. The trap: same logs, two goals

Two teams pull from the exact same clickstream table — timestamped add-to-basket events. Team Structure wants to find product categories the catalog doesn't already have; nobody has decided in advance what the groups are. Team Predict wants a model that, given a shopper's basket so far, predicts the next item they'll add — using the item they actually added next (already sitting in the log) as the answer.

```python
# Same purchase log, sliced two different ways
sessions = [
    ["diapers", "wipes", "formula"],
    ["diapers", "beer", "chips"],
    ["wipes", "formula", "diapers"],
]

# Team Structure: no target anywhere. Just count what co-occurs.
from collections import Counter
co_occurs = Counter()
for session in sessions:
    for a in session:
        for b in session:
            if a != b:
                co_occurs[(a, b)] += 1
# used to answer "which items group together?" -- there is no prediction target

# Team Predict: carve a target out of the sequence's own order.
examples = []
for session in sessions:
    for i in range(1, len(session)):
        context, target = session[:i], session[i]   # target = what actually came next
        examples.append((context, target))
# used to answer "given this partial basket, what's added next?" -- now there's a label,
# and it came from the data's own order, not from a human annotator
```

Which pairing is correct?

A. Team Structure is doing unsupervised learning; Team Predict is doing self-supervised learning.
B. Both teams are doing supervised learning — it's all "real" business data with real outcomes attached.
C. Both teams are doing unsupervised learning — nobody hand-labeled a single row for either team.
D. Team Structure is doing self-supervised learning; Team Predict is doing supervised learning.

<details>
<summary>Answer</summary>

**Correct: A.** Same table, two different problems built on top of it. Team Structure never defines a target at all — there's no "correct answer" to score against, just a search for whatever grouping the co-occurrence pattern reveals. That's unsupervised learning. Team Predict *does* define a target — the next item — but nobody tagged it; it's produced automatically by holding out part of each sequence and using what actually happened next as the label. That mechanism is exactly what self-supervised learning is, the same trick next-token prediction runs on text.

**B** — "Real business data with real outcomes" describes almost every table a company owns; it isn't a useful test. Team Structure specifically has no target variable anywhere in its setup, so it can't be supervised regardless of how "real" the underlying data is.

**C** — This is the trap most people fall into: *absence of a human labeler* is necessary but not sufficient for "unsupervised." Team Predict has no human labeler either, but it does have a target, constructed mechanically from the sequence — that extra ingredient is what earns self-supervised its own name instead of getting lumped in with unsupervised.

**D** — Exactly backwards. Team Structure has nothing to carve a target out of, so "self-supervised" doesn't apply to it at all. Team Predict's label came from the data's own order rather than a person, so it's self-supervised rather than supervised in the traditional hand-annotated sense — even though, mechanically, its training loss looks just like ordinary supervised classification. That resemblance is exactly why this direction of the trap is easy to fall into.

</details>

### 3. Next-word prediction, with no annotator in sight

A language model trains on scraped web text with zero human annotators involved — at every position in every document, it predicts the next token from the tokens before it, and gets corrected against the token that's actually there. Given that literally nobody labeled anything, why call this self-supervised rather than unsupervised?

A. "Self-supervised" is just a more modern term for the same thing as unsupervised learning.
B. The model uses a neural network, and neural networks always imply supervised learning.
C. A genuine prediction target exists at every position (the actual next token), and the model trains against it with an ordinary classification loss — the mechanics are supervised, only the *source* of the label (the text's own structure, not a person) is different.
D. The internet is enormous, and unsupervised learning is only used on small datasets.

<details>
<summary>Answer</summary>

**Correct: C.** Unsupervised learning has no target at all — it's asking "what structure is in here?" Self-supervised learning has a real target (next token, masked word, rotated-image angle...) and trains with the same cross-entropy-style loss you'd use in ordinary supervised classification. The only thing that changes is *where the label came from*: instead of a person tagging it, you construct it by hiding part of the input and asking the model to reconstruct or predict that hidden part.

**A** — Tempting, because the two terms do get blurred in casual conversation. But they describe genuinely different setups — one has a target, one doesn't — and collapsing them erases exactly the distinction this question is testing.

**B** — Architecture doesn't determine the paradigm. Neural networks show up in supervised, unsupervised, self-supervised, and reinforcement setups alike — a convnet used to cluster images with no target is still unsupervised, network or not.

**D** — Scale is a *consequence* of self-supervised learning being cheap to run at web scale (no annotation bottleneck), not the definition of it. You can run true unsupervised clustering on a billion rows and self-supervised pretraining on a small corpus — dataset size never tells you the paradigm.

</details>

### 4. The robot arm, two ways

Two robotics teams both end up with a working grasping policy for the same arm. Team Clone recorded 10,000 human-teleoperated grasp demonstrations — each one a sequence of joint angles a person drove to a successful pick — and trained a model to output the same joint angles a human used in similar situations. Team Explore let the arm attempt grasps on its own in simulation, with no demonstrations, getting a reward only when the object was successfully lifted, and updated its policy from that reward alone. Which pairing is right?

A. Team Clone is reinforcement learning (it's the same arm, so it's the same paradigm); Team Explore is unsupervised.
B. Team Clone is supervised learning — imitation learning, with each recorded state paired to the human's action as the label; Team Explore is reinforcement learning — trial-and-error guided only by reward.
C. Both are reinforcement learning — any robotics task where a physical action is being learned counts as RL by definition.
D. Team Clone is self-supervised (the "label" comes from the robot's own joint sensors); Team Explore is supervised (the reward is really just a label in disguise).

<details>
<summary>Answer</summary>

**Correct: B.** Team Clone has a labeled dataset in the classic sense: for each recorded state there's a specific correct action (whatever the human operator did), and the model is trained to reproduce it — that's supervised learning, specifically the flavor called imitation learning or behavior cloning. Team Explore has no correct-action labels anywhere; the arm tries things, and only a sparse, delayed reward (did the object end up lifted?) says whether the whole attempt was good. Learning from the *consequences* of your own actions, rather than from a labeled correct answer per state, is what reinforcement learning is.

**A** — Identical hardware doesn't matter. The same physical arm can be trained by completely different paradigms depending on what data and feedback loop you set up. Team Clone has explicit action labels from a demonstration, which is a supervised setup by definition, not RL.

**C** — This is the misconception the "robot arm" example usually gets used to create: a physical, sequential-looking task doesn't automatically mean RL. If you have a fixed dataset of (state, correct action) pairs and you're just fitting a function to reproduce it, with no ongoing interaction or reward, that's supervised imitation learning.

**D** — Joint-sensor readings being the *input features* doesn't make something self-supervised; self-supervised specifically means the target is carved out of unlabeled data's own structure, and here the target is a human's deliberate action choice, not something mechanically derived from an unlabeled sequence. And a reward isn't "a label in disguise": a label states the correct answer for *this exact example*; a reward only says how good an entire trajectory of decisions turned out, often long after the decisions that mattered — which is precisely why RL needs machinery (credit assignment across a sequence) that supervised learning never had to build.

</details>

### 5. "It's still just gradient descent"

An SRE team trains a model on 18 months of CPU, memory, and latency metrics with zero labeled incidents — it learns the shape of "normal" and flags anything that falls far outside it. A colleague argues this can't really be "a different paradigm" from supervised learning, since it's still a neural network doing gradient descent on real production data. What's the strongest response?

A. The colleague is right — once you're using gradient descent, everything is effectively supervised learning under the hood.
B. The paradigm depends on whether a target the model is scored against exists at all, and where it came from — not on the optimizer, the architecture, or the fact that the data is "real."
C. It depends on whether the metrics are numeric (like latency) or categorical (like status codes) — numeric data always implies unsupervised learning.
D. It depends on the size of the dataset — 18 months of metrics is unsupervised-scale, whereas a smaller, curated set would have been supervised.

<details>
<summary>Answer</summary>

**Correct: B.** Gradient descent, backprop, network depth — these are optimization and modeling tools that show up across every paradigm. What actually distinguishes them is the shape of the feedback the model trains against: a per-example target from an external source (supervised), no target at all — just structure to uncover (unsupervised), a target mechanically carved from the input itself (self-supervised), or a reward over a sequence of actions (reinforcement learning). Here there's no target of any kind — nobody says what "the answer" is for any given row — so it's unsupervised, specifically anomaly/density estimation, regardless of running on a neural net.

**A** — This collapses a genuinely useful distinction. If "uses gradient descent" made something supervised, unsupervised deep learning — autoencoders, embedding models, neural clustering — wouldn't exist as a category. It does, and it's a large one.

**C** — Data type affects preprocessing and loss-function choice, not whether a target exists. You can run supervised learning on purely numeric features (house-price regression is exactly that) and unsupervised learning on categorical data (clustering support tickets by category).

**D** — Dataset size affects what's practical, not the paradigm. Small unlabeled datasets are still unsupervised. If this same team later labels a few hundred confirmed incidents and retrains to predict "incident vs. not," it becomes supervised at that point — not because the dataset changed size, but because a target now exists that didn't before.

</details>

### 6. "RLHF is just supervised learning with extra steps"

A team fine-tunes a pretrained language model in two stages ([pretraining vs. fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning)). Stage 1: they collect prompt/ideal-response pairs written by human annotators and train the model to reproduce those responses directly. Stage 2: for the same prompts, they generate several candidate responses from the model, have humans rank which response is better, train a separate reward model on those rankings, then update the language model's policy so it produces responses the reward model scores highly ([RLHF and instruction tuning](/learn/ai-foundations/rlhf-and-instruction-tuning)). A teammate says "both stages are basically the same thing — supervised learning with human involvement." What's wrong with that claim?

A. Nothing — both stages involve human judgment, and human involvement is what defines supervised learning, so the teammate is right.
B. Stage 1 is supervised learning (each prompt paired with one target output to imitate directly); Stage 2 is reinforcement learning (the model's own sampled outputs are optimized against a learned reward signal, not cloned from a fixed target).
C. Stage 2 is also supervised learning, just with a "moving target" — since the reward model is itself trained with labels, anything downstream of it inherits the supervised label too.
D. Stage 1 is self-supervised, because the ideal responses were assembled from pieces of the pretraining corpus; Stage 2 is supervised, because human rankers directly assigned a label to each response.

<details>
<summary>Answer</summary>

**Correct: B.** Stage 1 is ordinary supervised fine-tuning: one input, one designated correct output, direct imitation — mechanically identical to any other labeled-pairs setup. Stage 2 is what earns RLHF ("reinforcement learning from human feedback") a distinct name rather than a synonym for supervised learning: there's no single correct output being cloned. The model generates its own candidates, a reward model scores them, and the policy is updated to make higher-reward outputs more likely — an optimize-against-a-signal loop over the model's *own sampled behavior*, which is reinforcement learning's structure, not imitation of a fixed label.

**A** — Human involvement shows up in supervised learning, in training the Stage-2 reward model, and even in *designing* self-supervised objectives (someone decided "predict the next token" was the task). It's present almost everywhere in practice, which is exactly why it can't be the thing that defines a paradigm. What defines supervised learning specifically is a fixed target per example that the model directly imitates.

**C** — This blurs two different training loops together. Yes, the reward model is trained with supervised learning (human rankings are its labels). But the language model in Stage 2 is never shown "the correct response" for a prompt — it samples its own outputs and gets pushed toward whichever ones score higher, a fundamentally different objective (policy-style updates on sampled behavior) than fitting to a fixed label.

**D** — Backwards on both counts. Stage 1's target responses were deliberately written by annotators for this exact task — a hallmark of supervised learning, not self-supervised (self-supervised targets come from an *existing* input's own structure, like a masked word, not from a person writing fresh text for the purpose). Stage 2 does involve a human ranking step, but that ranking trains the reward model; the language model itself is then optimized against that reward through sampling and policy updates — reinforcement learning's structure, not direct per-example supervision.

</details>

## The one idea worth keeping

None of these six questions were really about spotting a keyword ("reward," "label," "cluster") in the scenario. They were about tracing *where the target came from* and *what the goal actually is* — because the same raw table can honestly serve any of the four paradigms depending on what you're trying to do with it:

| Goal on the same customer-transaction table | Paradigm | What creates the target |
|---|---|---|
| Predict whether a customer churns next month | Supervised | An external, confirmed outcome (did they actually leave?) |
| Find natural customer segments, no predefined groups | Unsupervised | Nothing — you're searching for structure |
| Predict a customer's next purchase, from their own future purchase | Self-supervised | The sequence's own next value, carved out automatically |
| Decide which offer to show to maximize value across many future interactions | Reinforcement learning | Reward accumulated over a sequence of decisions, not one row's label |

The table never tells you the paradigm. The goal does — and once you've internalized that, "which kind of learning is this?" stops being a trick question and starts being the first thing you check before you write a single line of training code.

**Related:** [Supervised learning, worked example](/learn/ai-foundations/supervised-learning-worked-example) · [Unsupervised clustering, worked example](/learn/ai-foundations/unsupervised-clustering-worked-example) · [Self-supervised next-token example](/learn/ai-foundations/self-supervised-next-token-example) · [Reinforcement learning gridworld example](/learn/ai-foundations/reinforcement-learning-gridworld-example) · [RLHF and instruction tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) · [Classification vs. regression](/learn/ai-foundations/classification-vs-regression)
