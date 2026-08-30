---
title: "How Modern AI Fits Together"
track: "ai-foundations"
status: live
summary: "Whole-game overview lesson for Oddversity's AI Foundations Orientation module: traces 'why does ChatGPT answer this way?' down through AI > ML > deep learning > training > foundati"
duration: "4 min read"
---

This track won't teach you to build the next frontier model, and it isn't a coding bootcamp — it teaches you the mechanism well enough that "AI" stops being either magic or a chatbot with a search engine bolted on, and starts being a specific, traceable pipeline you can reason about.

## The big picture

Take a concrete question: you type "What's the capital of France?" into ChatGPT, and it says "Paris." Every layer below answers one part of *why it did that, that way*.

1. **It's AI** — a system whose output looks like it needed intelligence. That label alone tells you almost nothing about the mechanism; it's the category, not the explanation. See [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) and, before you assume fluent text implies general reasoning, [narrow vs. general AI](/learn/ai-foundations/narrow-ai-vs-general-ai) — this system is (very) narrow.
2. **Specifically, it's ML.** Nobody wrote `if "capital of France" in query: return "Paris"`. The behavior was *learned* from examples rather than hand-coded as rules — that's the entire ML/AI distinction, and the three terms nest inside each other rather than compete: see [AI, ML, and DL as nested fields](/learn/ai-foundations/ai-ml-dl-as-nested-fields).
3. **The learner is a deep neural network** — layers of weighted sums followed by nonlinear functions, stacked deep enough to approximate very complicated input→output mappings. Mechanically: [what is a neural network](/learn/ai-foundations/what-is-a-neural-network).
4. **How did it get its weights? Training.** Define a loss function that scores how wrong the model's predictions are, then use gradient descent — computed efficiently via backpropagation — to nudge billions of weights downhill on that loss, repeated over an enormous number of examples. See [loss functions](/learn/ai-foundations/loss-functions-explained), [gradient descent](/learn/ai-foundations/gradient-descent-explained), and [backpropagation](/learn/ai-foundations/backpropagation-explained).
5. **Trained on what, for what objective?** The base model is trained with self-supervised learning: predict the next chunk of text, over a huge, broad corpus, with no human-labeled "correct answers" needed. That produces a [foundation model](/learn/ai-foundations/foundation-models-explained) — general enough to be adapted many directions — built from [the data it learned from](/learn/ai-foundations/the-data-the-model-learned-from), not a database it looks facts up in.
6. **Why does it act like a helpful assistant, not a raw autocomplete?** A freshly pretrained foundation model just continues text — it doesn't reliably answer, refuse, or format anything. Getting from "text completer" to "ChatGPT" takes another training pass: supervised fine-tuning on demonstrations, then [RLHF](/learn/ai-foundations/rlhf-and-instruction-tuning) on top of [pretraining](/learn/ai-foundations/pretraining-vs-finetuning). This mostly reshapes *behavior and tone*, not the underlying factual knowledge.
7. **What happens the instant you hit send?** None of the above is running anymore — the weights are frozen. This is [inference, not training](/learn/ai-foundations/training-vs-inference): your text is tokenized, run through the network in one forward pass, and turned into a probability distribution over possible next tokens ([tokens, context, and cost](/learn/ai-foundations/tokens-context-cost)). The model picks one, appends it, and repeats.

Step 7 is easy to see in miniature. This is the actual shape of a decoding step — not the real vocabulary size (that's in the tens of thousands+) or real logits, just the mechanism:

```python
import numpy as np

# toy "logits" — raw scores a model might produce for the next token
# after seeing "The capital of France is"
vocab = ["Paris", "London", "a", "the", "banana"]
logits = np.array([4.2, 1.1, 0.3, 0.5, -2.0])

# softmax turns scores into a probability distribution
probs = np.exp(logits) / np.exp(logits).sum()
for tok, p in sorted(zip(vocab, probs), key=lambda x: -x[1]):
    print(f"{tok:10s} {p:.3f}")

print("greedy pick:", vocab[np.argmax(probs)])
```

That's the whole trick, run once per output token. It's also why the model can say something fluent and *wrong* with total confidence: when there's no clean "Paris" in the distribution, the exact same machinery still produces a top-probability token. Nothing in the pipeline checks it against reality — see [what LLMs can't do](/learn/ai-foundations/what-llms-can-and-cannot-do) and [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate).

Stacked together, the chain looks like this:

```
"Why does ChatGPT say 'Paris'?"
              |
              v
  AI              -- output that looks like it needed intelligence
   \_ ML            -- behavior learned from data, not hand-coded
       \_ Deep learning -- the learner is a neural network
              |
              v   HOW did it get its weights?
  Training  -- loss + gradient descent + backprop, over training data
              |
              v   TRAINED ON WHAT, for what objective?
  Self-supervised pretraining on huge text corpora
              |
              v
  Foundation model  -- broad, general-purpose, not yet "helpful"
              |
              v   WHY does it act like an assistant?
  Fine-tuning + RLHF on top of the foundation model
              |
              v
  LLM (chat-tuned)  -- the model behind ChatGPT
              |
              v   WHAT happens the instant you hit send?
  Inference  -- frozen weights: tokenize -> forward pass -> next-token
               probabilities -> pick one -> repeat
              |
              v
        "Paris."   (or a fluent, confident wrong answer — same mechanism)
```

Every module after this one is a zoom-in on exactly one box in that stack: **Learning Paradigms** zooms into "behavior learned from data" (which flavor of learning, and how each differs); **Neural Networks** zooms into "the learner is a neural network"; **Training & Optimization** zooms into the loss/gradient/backprop box; **Generalization** zooms into what happens when that training goes wrong; **Embeddings** zooms into how meaning gets turned into the numbers a network operates on; **Foundation Models & LLMs** zooms into the pretraining→fine-tuning→RLHF chain; **Capabilities & Evaluation** zooms into the output box — what to trust and what to check; **Safety & Interpretability** zooms into whether you can trust *why* it produced that output at all; **Practical Models** zooms into the decision you actually have to make (which model, self-hosted or API, at what cost).

## What trips people up

| Idea | Common confusion | Where to learn it |
|---|---|---|
| AI / ML / DL nesting | Treating them as three competing technologies instead of nested subsets — all DL is ML, all ML is AI, never sideways | [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) · [nested fields](/learn/ai-foundations/ai-ml-dl-as-nested-fields) |
| Narrow vs. general AI | Fluent, broad-sounding chat gets mistaken for progress toward general intelligence, rather than a narrow system that's very good at one thing (predicting text) | [narrow vs. general AI](/learn/ai-foundations/narrow-ai-vs-general-ai) · [in practice](/learn/ai-foundations/narrow-vs-general-ai-in-practice) |
| What a "model" is | Picturing a database or a program with logic branches, instead of a fixed function applied to a fixed set of learned numbers (parameters) | [what a model actually is](/learn/ai-foundations/what-a-model-actually-is) |
| Training vs. inference | Assuming the model "thinks" or "looks things up" while answering, rather than running frozen weights that were learned once, earlier, offline | [training vs. inference](/learn/ai-foundations/training-vs-inference) |
| Foundation model vs. LLM | Using the terms interchangeably — an LLM is a foundation model specialized to text/tokens; foundation models also exist for images, audio, and more | [foundation models](/learn/ai-foundations/foundation-models-explained) · [how LLMs work](/learn/ai-foundations/how-llms-work) |
| What the model "knows" | Believing it stores and retrieves facts like a database, rather than having compressed statistical patterns from training data into its weights | [the data it learned from](/learn/ai-foundations/the-data-the-model-learned-from) |
| Hallucination | Treating it as a rare bug or a separate "make stuff up" mode, when it's the exact same next-token mechanism that produces every other answer | [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate) · [what LLMs can't do](/learn/ai-foundations/what-llms-can-and-cannot-do) |
| RLHF / fine-tuning | Assuming RLHF teaches new facts, when it mostly reshapes tone, refusal behavior, and formatting on top of what pretraining already encoded | [RLHF and instruction tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) · [pretraining vs. fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning) |
| Benchmarks | Reading a benchmark score as a ground-truth capability score, rather than a proxy that can be gamed, saturated, or simply miss what you care about | [benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss) |
| Scaling laws | "Bigger model = better, unconditionally," instead of a predictable relationship that still runs into data, compute, and evaluation limits | [scaling laws](/learn/ai-foundations/scaling-laws) |
| Agents vs. chatbots | Calling anything that calls a function or a tool an "agent," blurring a real difference in autonomy and control flow | [agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots) |

## A reading path

The modules build vocabulary in order — skimming ahead usually means re-deriving a term two pages later that was already defined. If you've written ML code before, modules 2–4 will feel like review; skim for the specific vocabulary (loss, gradient, overfitting, embedding) rather than skipping, because the safety and practical modules assume you have those words ready without re-explanation.

1. **Orientation (here)** — lock in the nesting and what a model literally is: [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning), [what a model actually is](/learn/ai-foundations/what-a-model-actually-is), then check yourself with the [orientation quiz](/learn/ai-foundations/orientation-quiz).
2. **Learning Paradigms** — [supervised](/learn/ai-foundations/supervised-learning-explained), [unsupervised](/learn/ai-foundations/unsupervised-learning), [self-supervised](/learn/ai-foundations/self-supervised-learning), and [reinforcement learning](/learn/ai-foundations/reinforcement-learning-basics): every later module assumes you know which one is in play.
3. **Neural Networks** — [what is a neural network](/learn/ai-foundations/what-is-a-neural-network) and [why nonlinearity matters](/learn/ai-foundations/why-nonlinearity-matters): the actual function being learned.
4. **Training & Optimization** — [loss functions](/learn/ai-foundations/loss-functions-explained), [gradient descent](/learn/ai-foundations/gradient-descent-explained), [backpropagation](/learn/ai-foundations/backpropagation-explained): how the weights get there. Don't skip this one even if it feels basic — everything downstream leans on this vocabulary.
5. **Generalization** — [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff), [overfitting](/learn/ai-foundations/generalization-and-overfitting), [train/val/test splits](/learn/ai-foundations/train-validation-test-splits): why a trained model can still be useless.
6. **Embeddings** — [what embeddings are](/learn/ai-foundations/what-embeddings-are): the representation trick underneath everything from search to LLMs.
7. **Foundation Models & LLMs** — [foundation models](/learn/ai-foundations/foundation-models-explained), [how LLMs work](/learn/ai-foundations/how-llms-work), [pretraining vs. fine-tuning](/learn/ai-foundations/pretraining-vs-finetuning), [RLHF](/learn/ai-foundations/rlhf-and-instruction-tuning), [scaling laws](/learn/ai-foundations/scaling-laws): this module is where "ChatGPT" specifically gets explained.
8. **Capabilities & Evaluation** — [what LLMs can't do](/learn/ai-foundations/what-llms-can-and-cannot-do), [hallucination](/learn/ai-foundations/why-llms-hallucinate), [benchmarks](/learn/ai-foundations/benchmarks-and-what-they-miss), [agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots): where you learn to be skeptical in the right places.
9. **Safety & Interpretability** — [alignment and safety basics](/learn/ai-foundations/ai-alignment-and-safety-basics), [the black-box problem](/learn/ai-foundations/interpretability-black-box-problem): "it works" isn't the same claim as "we understand why" or "it's safe."
10. **Practical Models** — [choosing a model](/learn/ai-foundations/choosing-a-model), [open-weight vs. closed](/learn/ai-foundations/open-weight-vs-closed-models), [the hardware stack](/learn/ai-foundations/ai-hardware-stack): turning all of this into an actual decision.
11. **Capstone** — [build, train, and evaluate a classifier](/learn/ai-foundations/capstone-build-train-evaluate-a-classifier): the fastest way to find out what you actually absorbed versus what you only recognized.

That route, at a glance:

```
[ 1. Orientation ]               <- you are here
        |
        v
[ 2. Learning Paradigms ]        <- supervised / unsupervised / self-supervised / RL
        |
        v
[ 3. Neural Networks ]           <- the function being learned
        |
        v
[ 4. Training & Optimization ]   <- loss, gradient descent, backprop
        |
        v
[ 5. Generalization ]            <- why a trained model can still fail
        |
        v
[ 6. Embeddings ]                <- meaning, as numbers
        |
        v
[ 7. Foundation Models & LLMs ]  <- pretraining, fine-tuning, RLHF, scaling — this IS ChatGPT
        |
        v
[ 8. Capabilities & Evaluation ] <- what it can/can't do, hallucination, benchmarks, agents
        |
        v
[ 9. Safety & Interpretability ] <- alignment, the black-box problem
        |
        v
[ 10. Practical Models ]         <- choosing a model, open vs. closed, hardware, cost
        |
        v
[ 11. Capstone ]                 <- build, train, and evaluate one yourself
```

**Related:** [orientation quiz](/learn/ai-foundations/orientation-quiz) · [attention mechanism explained](/learn/llm-foundations/attention-mechanism-explained) · [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding) · [what is a vector](/learn/maths-foundations/what-is-a-vector)
