---
title: "Pretraining vs. Fine-Tuning: Two Different Jobs"
track: "ai-foundations"
status: live
summary: "A concept lesson separating expensive, once-per-model self-supervised pretraining from cheap, targeted fine-tuning, using a general-education vs on-the-job-training mental model, w"
duration: "14 min read"
---

Ask a freshly pretrained base model a question and it might answer with more questions, or wander into a Wikipedia-style tangent, instead of helping you. Ask the same underlying network a question after a comparatively tiny additional training pass, and it answers like an assistant. Same architecture, wildly different behavior — because pretraining and fine-tuning are solving two different problems, at two very different price points.

## What it is

**Pretraining** teaches a neural network the statistical structure of language (and increasingly code, math, and other modalities) from a huge, largely unlabeled corpus, using a self-supervised objective — almost always some version of "predict the next token given everything before it." Nobody hand-writes labels for this task; the label for each example is just whatever text already comes next. That's what makes the scale possible: [self-supervised learning](/learn/ai-foundations/self-supervised-learning) turns raw text into an effectively unlimited supply of training examples. This phase produces a **base model** — something that has absorbed grammar, facts, reasoning patterns, and a rough model of the world, but has no built-in notion that it's supposed to be "helpful" or answer in any particular format. It runs once per model generation, and it's the expensive part: many accelerators, weeks to months of wall-clock time, and a training set that dwarfs anything a company will ever assemble for a downstream task.

**Fine-tuning** starts from that already-trained base model and keeps training it — on a much smaller, curated dataset — to reshape behavior, not to teach language from scratch. Because the hard part (language, world knowledge, reasoning) is already baked into the weights, fine-tuning needs orders of magnitude less data and compute: thousands to low millions of examples instead of broad-internet-scale corpora, and hours to days instead of weeks.

Two specific fine-tuning steps matter enough to name separately. **Instruction-tuning** is supervised fine-tuning (SFT) on (instruction, response) pairs — it teaches the base model to act like something answering you, rather than autocompleting a document. **RLHF** (reinforcement learning from human feedback) goes further: instead of imitating fixed example responses, the model is optimized against a learned reward signal built from human preferences between candidate outputs, nudging it toward the kind of answer people actually prefer. Both are fine-tuning steps layered on top of a pretrained base — see [RLHF and instruction-tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) for how each is actually implemented.

## The mental model

Think general education vs. on-the-job training.

Pretraining is everything before your first day at a job: years of school. Nobody sat you down and taught you specifically how to write the weekly status report your current employer wants — you learned to read, write, reason, and pull context from an enormous, unlabeled stream of experience. That process was slow, expensive, and deliberately broad; whoever "designed" your general education wasn't optimizing for your future employer's house style.

Fine-tuning is onboarding: a new-hire packet, a style guide, a couple of weeks shadowing someone. It's cheap precisely because you already know how to read and reason — onboarding just points those existing skills at "how we do it here." Nobody re-teaches you the alphabet.

Instruction-tuning is the part of onboarding where you're shown worked examples: "when a customer asks X, here's a good response." Fixed examples to imitate. RLHF is more like a manager's feedback on the job: you produce something, they tell you it was too blunt, or that a colleague's version was better, and you adjust — not by memorizing a script but by learning from *comparisons* between outputs. Note what doesn't change anywhere in this story: the architecture. A transformer stays a transformer through every stage — see [how LLMs work](/learn/ai-foundations/how-llms-work) for the parts that hold still. What changes across pretraining and fine-tuning is only the values sitting inside the weight matrices.

## Why it works this way

Pretraining needs to be huge because next-token prediction is a *weak* supervisory signal per example — one token of feedback — so the model needs an enormous number of examples, spread across enormously diverse contexts, before grammar, factual associations, and rarer reasoning patterns reliably show up in the weights. This is also the empirical basis for [scaling laws](/learn/ai-foundations/scaling-laws): loss keeps dropping in a fairly predictable way as you add more data and compute to this phase, which is exactly why frontier labs keep investing in bigger pretraining runs rather than declaring "enough."

Fine-tuning works with tiny data for the opposite reason: it isn't starting from random weights. It's starting from a point deep inside a very good region of weight-space that pretraining already found. A gradient step from there only has to *nudge* the model toward a new objective, not discover language from zero. That's also why fine-tuning is fragile in a way pretraining rarely is: because you're making a local update near a good optimum, pushing too hard — too high a learning rate, too many epochs, too narrow a dataset — can overwrite what pretraining learned. This is usually called **catastrophic forgetting**, and it's the direct reason real fine-tuning recipes use small learning rates, few epochs, and often update only a small slice of the parameters (adapter- or LoRA-style methods) instead of every weight in the network.

## A concrete example

Here's that whole story in miniature, small enough to run in a couple of seconds. We'll build a tiny bigram model over a handful of characters — literally a matrix `W` where `W @ one_hot(current_char)` gives logits over the next character — and train it by hand with plain gradient descent on cross-entropy loss. No frameworks, no autograd, just the actual math.

```python
import numpy as np

# A tiny "language": lowercase letters, space, and a few punctuation marks
vocab = sorted(set("abcdefghijklmnopqrstuvwxyz .!?"))
stoi = {ch: i for i, ch in enumerate(vocab)}
V = len(vocab)

def encode(text):
    return [stoi[c] for c in text if c in stoi]

def one_hot(idx, size):
    v = np.zeros(size)
    v[idx] = 1.0
    return v

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def train_bigram(text, W, lr, epochs):
    """One gradient descent step per character-pair, by hand."""
    ids = encode(text)
    for _ in range(epochs):
        for i in range(len(ids) - 1):
            x = one_hot(ids[i], V)
            y_true = ids[i + 1]
            probs = softmax(W @ x)
            grad_logits = probs.copy()
            grad_logits[y_true] -= 1.0          # d(cross-entropy)/d(logits)
            W -= lr * np.outer(grad_logits, x)  # d(logits)/dW = x
    return W

def perplexity(text, W):
    ids = encode(text)
    nll = 0.0
    for i in range(len(ids) - 1):
        probs = softmax(W @ one_hot(ids[i], V))
        nll -= np.log(probs[ids[i + 1]] + 1e-9)
    return np.exp(nll / max(len(ids) - 1, 1))

# "Pretraining": broad, generic text, several passes, starting from zero weights
pretrain_text = (
    "the cat sat on the mat. the dog ran in the park. "
    "she likes to read books. he walked to the store. "
    "birds fly in the sky. water is wet. the sun is hot. "
) * 20

W_base = train_bigram(pretrain_text, np.zeros((V, V)), lr=0.1, epochs=3)

# "Fine-tuning": tiny, narrow, domain-specific text, starting from W_base
finetune_text = "invoice total due on the fifteenth. payment terms net thirty. " * 3

W_finetuned = train_bigram(finetune_text, W_base.copy(), lr=0.05, epochs=5)
W_scratch = train_bigram(finetune_text, np.zeros((V, V)), lr=0.05, epochs=5)

for name, W in [
    ("pretrained only", W_base),
    ("pretrained + fine-tuned", W_finetuned),
    ("scratch on invoice text only", W_scratch),
]:
    g = perplexity(pretrain_text[:200], W)
    i = perplexity(finetune_text, W)
    print(f"{name:32s}  generic ppl={g:6.2f}  invoice ppl={i:6.2f}")
```

Perplexity is roughly "how surprised the model is by the next character" — lower is better. Run this and the pattern the analogy predicts is what shows up: `pretrained only` hasn't seen invoice text yet, so it's mediocre on invoice perplexity but reasonable on generic perplexity. `pretrained + fine-tuned` improves noticeably on invoice text while staying close to its pretrained self on generic text — a small, cheap nudge on top of everything it already knew. `scratch on invoice text only` can match or even beat the fine-tuned model on invoice perplexity specifically — there's only a few dozen characters of pattern to memorize — but it's dramatically worse on generic text, because it never learned general language, only the one narrow pattern it was shown.

Now bump the fine-tune step's `epochs` from `5` to something like `200` and rerun. You'll watch `pretrained + fine-tuned` keep improving on invoice text while its generic-text perplexity gets measurably *worse*. That's catastrophic forgetting, live, in about twelve lines of numpy.

## Where it shows up

Every consumer chat assistant you've used is a pretrained base model with an instruction-tuning pass and an RLHF (or similar preference-optimization) pass stacked on top, in that order — which is why the assistant you talk to barely resembles the raw base checkpoint researchers report perplexity numbers for. Open-weight base models are released specifically so other people can add that fine-tuning layer for their own purposes without redoing the expensive part — see [open-weight vs. closed models](/learn/ai-foundations/open-weight-vs-closed-models) for what "open" actually gets you here. Domain-specific deployments — a support-ticket classifier, a contract-clause tagger, a code-review assistant — are almost always built by fine-tuning an existing foundation model on a company's own labeled examples, not by pretraining a comparable model from zero, which is out of reach for nearly everyone. And teams frequently fine-tune a *smaller* model to hit a task's latency and cost budget instead of calling a much larger general-purpose model on every request.

## Watch out for

**Catastrophic forgetting.** You just watched it happen above. Fine-tune too aggressively — high learning rate, too many epochs, a dataset that's narrow in topic or style — and the model gets better at your task while getting quietly worse at everything else. The fix is the boring one: small learning rates, few epochs, and often training only a small adapter on top of frozen weights rather than every parameter in the network.

**Fine-tuning isn't a substitute for knowledge the model never had.** Fine-tuning on your product's support emails doesn't reliably give the model facts that are absent from both its pretraining data and your fine-tuning set — in the gaps, it will still confidently produce something plausible-sounding rather than say "I don't know" (see [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate)). If the actual need is "the model should know these specific documents," that's usually a retrieval problem, not a fine-tuning one.

**Instruction-tuning and RLHF shape behavior, not alignment.** A model that reliably follows instructions and avoids obviously bad outputs learned that from imitating examples and optimizing against a preference signal — both of which can have blind spots, be gamed, or fail to generalize the way you'd hope. "Fine-tuned to be helpful" and "aligned" are related but not the same claim; see [specifying what we want](/learn/ai-foundations/alignment-specifying-what-we-want) for why the gap matters.

## Where next

For the mechanics behind the two named fine-tuning steps here, go to [RLHF and instruction-tuning](/learn/ai-foundations/rlhf-and-instruction-tuning). To see the self-supervised next-token objective worked through on real text rather than a two-symbol toy, try [the self-supervised next-token worked example](/learn/ai-foundations/self-supervised-next-token-example). And if you're weighing whether a task calls for prompting, fine-tuning, or retrieval in the first place, [choosing a model: a decision framework](/learn/ai-foundations/choosing-a-model-decision-framework) picks up exactly where this lesson leaves off.

**Related:** [/learn/ai-foundations/how-llms-work](/learn/ai-foundations/how-llms-work) · [/learn/ai-foundations/foundation-models-explained](/learn/ai-foundations/foundation-models-explained) · [/learn/ai-foundations/self-supervised-next-token-example](/learn/ai-foundations/self-supervised-next-token-example) · [/learn/ai-foundations/choosing-a-model-decision-framework](/learn/ai-foundations/choosing-a-model-decision-framework) · [/learn/rag/what-is-rag-and-when-to-use-it](/learn/rag/what-is-rag-and-when-to-use-it)
