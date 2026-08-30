---
title: "Orientation: Check Your Map"
track: "ai-foundations"
status: live
summary: "Six scenario-based MCQs (self-check quiz) for the Orientation module's 'Check Your Map' page, testing AI/ML/DL nesting, narrow vs. general AI, and foundation-model-vs-application d"
duration: "7 min read"
---

## 1. Which ring does this actually belong in?

You're mapping four systems onto the AI ⊃ ML ⊃ DL diagram in your head. Which one sits inside the ML ring but outside the DL ring?

A. A hand-coded set of if/else rules a developer wrote for loan approval, with no data-driven fitting of any kind.
B. A gradient-boosted tree ensemble (like XGBoost) fit on historical loan data, using engineered features such as debt-to-income ratio.
C. A convolutional neural network trained end-to-end on raw satellite images to flag flood risk.
D. A large transformer language model pretrained on web text via next-token prediction.

<details><summary>Answer</summary>

**Correct: B.** Gradient-boosted trees learn their parameters (split points, leaf weights) from data by minimizing a loss — that clears the bar for ML. But there's no stack of layers learning hierarchical representations here, just an ensemble of trees over features a human picked. That's ML without DL. See [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) and [AI, ML, DL as nested fields](/learn/ai-foundations/ai-ml-dl-as-nested-fields) for the exact boundary.

**A** is tempting because it's clearly a decision-making system, which feels AI-ish. But nothing was learned from data — a person wrote the rules directly. That puts it in the outer AI ring, outside ML entirely, not inside it.

**C** is deep learning: a CNN is a stack of learned layers that builds up its own representations (edges, then textures, then shapes) straight from pixels. It's inside the DL ring, not "ML but not DL."

**D** is also deep learning — a transformer is layers of learned attention and projection, trained on data. Same ring as C.

</details>

## 2. Spot the misconception: "a thermostat isn't real AI"

Someone on your team says: "A thermostat that switches on the heat below a setpoint isn't real AI — real AI has to learn." What's the flaw in that claim?

A. The thermostat isn't AI at all, because AI requires software and a thermostat is essentially hardware.
B. The thermostat qualifies as a foundation model, because the same control logic generalizes across many rooms.
C. The thermostat fits the standard working definition of AI — a system that perceives its environment and takes action to pursue a goal — it just isn't machine learning, because no parameters were fit from data.
D. The thermostat counts as deep learning, because its if-then control logic resembles a decision layer inside a neural network.

<details><summary>Answer</summary>

**Correct: C.** "AI" is the broad, functional category: goal-directed behavior based on sensing the environment. A thermostat clears that bar trivially. What it doesn't do is learn — no data was used to fit any parameter — so it sits in the outer AI ring only, nowhere near ML or DL. This is exactly the gap [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) is built to close: "AI" is a much lower bar than people assume, and "learns from data" is what actually separates ML from the rest of it.

**A** gets the reasoning backwards twice: most thermostats do run software, but that's irrelevant anyway — the AI/not-AI line has nothing to do with hardware versus software, it's about whether the system makes goal-directed decisions from sensed input.

**B** misuses "foundation model," which has a specific meaning: a large model pretrained on broad data that gets adapted to many *different downstream tasks*. Deploying the same fixed control logic in many rooms is just deployment, not model reuse across tasks — and there's no pretraining or learning here at all.

**D** is pattern-matching on the surface word "if-then." Deep learning specifically means multiple stacked layers that learn their own representations from data. A thermostat has neither layers nor learning — it has one hardcoded comparison.

</details>

## 3. Spot the misconception: "it does everything, so it must be general"

A colleague says: "Our LLM writes Python, drafts emails, translates French, and answers trivia — that's basically general intelligence at this point." What's the strongest correction?

A. It is general intelligence, because handling more than one task is what "general" means.
B. It can't be narrow AI, because narrow AI only describes models trained on a single dataset, and this model trained on many.
C. It's a foundation model, so by definition it's general intelligence.
D. Breadth of tasks isn't the same as general intelligence — it's still narrow AI running one very flexible learned skill (predicting likely next tokens), without autonomous goal-setting, grounded world-understanding, or the ability to pick up genuinely novel skills the way a human transfers experience across domains.

<details><summary>Answer</summary>

**Correct: D.** This is the single most common map error in this module: mistaking task *breadth* for intelligence *generality*. [Narrow AI vs. general AI](/learn/ai-foundations/narrow-ai-vs-general-ai) and [narrow vs. general AI in practice](/learn/ai-foundations/narrow-vs-general-ai-in-practice) both hammer this: an LLM's apparent versatility comes from one training objective (predict the next token) applied over an enormous, diverse corpus — it's still one mechanism, not a system that sets its own goals or transfers understanding the way general intelligence would. See also [what LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) for where that flexibility actually breaks.

**A** restates the misconception as if it were the definition. "General" in AGI doesn't mean "does several tasks" — it means human-like flexibility: learning genuinely new domains without being pretrained on them, reasoning about novel situations, setting your own objectives. Task count isn't the axis.

**B** invents a rule that doesn't exist. Narrow vs. general has nothing to do with how many datasets went into training. GPT-style models train on some of the most diverse data ever assembled and are still narrow by the standard definition — the axis is the *nature* of the resulting capability, not the training set's variety.

**C** conflates two unrelated categories. "Foundation model" is an engineering and deployment term — a large pretrained model reused across downstream tasks. It says nothing about whether the resulting system has general intelligence; you can build a foundation model that's narrow (this one) just as easily as the term implies nothing either way.

</details>

## 4. The model you didn't build vs. the product you did

Your team ships a customer-support tool: it calls GPT-4 through an API, adds a system prompt containing your return policy, retrieves relevant help-center articles, and wraps it in a chat UI. Which statement correctly separates the foundation model from the application?

A. The whole system — prompt, retrieval, and UI included — counts as one foundation model, since it's packaged into a single shipped product.
B. GPT-4 is the foundation model: the large model pretrained on broad data whose weights you never touch. Everything you built around it (prompt, retrieval, UI) is the application layer, and it inherits GPT-4's capabilities and failure modes rather than replacing them.
C. Your retrieval-augmented chat tool is the foundation model, because it's the piece users actually interact with.
D. GPT-4 stops being a foundation model the moment you call it through an API, because API access implies it's been fine-tuned for your specific use case.

<details><summary>Answer</summary>

**Correct: B.** The foundation model is wherever the heavy, general-purpose learning happened — the pretraining run that produced the weights. Everything you stack on top (prompt engineering, retrieval, UI, guardrails) is application work that shapes *how* that model is used, not a new model. That also means your app inherits GPT-4's blind spots — you can reduce them with good retrieval, but you can't prompt your way out of a capability the base model doesn't have. [Foundation models, explained](/learn/ai-foundations/foundation-models-explained) covers this split in depth; [what is RAG and when to use it](/learn/rag/what-is-rag-and-when-to-use-it) covers exactly the retrieval layer in your example.

**A** collapses a meaningful distinction. Bundling a foundation model into a shipped product doesn't make the product *itself* the foundation model — the term tracks where the general-purpose learning happened, not where the deployment happened. This matters practically: swap Claude in for GPT-4 behind the same prompt and retrieval, and you've changed the foundation model without touching "the product" people describe.

**C** has the relationship backwards. The chat tool is the application built *on top of* a foundation model — swap the base model out and you still have "the same app," just running on different underlying capability. That's only coherent if the app and the model are distinct layers.

**D** confuses inference-time prompting with a training-time process. Calling a model via API just sends it a prompt and gets a completion back — no weights change unless you explicitly run a separate fine-tuning job. It's still the identical foundation model, just being asked something different each time. See [training vs. inference](/learn/ai-foundations/training-vs-inference) if that boundary still feels fuzzy.

</details>

## 5. What actually makes something "deep"

Two teams both build cat-vs-dog image classifiers. Team A hand-engineers features — edge density, color histograms, aspect ratio — and feeds them into logistic regression. Team B feeds raw pixels into a convolutional neural network with several stacked layers. Which statement is accurate?

A. Both systems are deep learning, because both were trained on labeled data.
B. Team A's system is deep learning, because logistic regression is technically a one-layer neural network, and any neural network counts as DL.
C. Team A's system is ML but not DL; Team B's is both. The defining difference is that Team B's network learns its own hierarchy of representations — edges, then textures, then object parts — directly from pixels, instead of relying on features a human decided on in advance.
D. Team B's system isn't ML at all, because deep learning is a separate field from machine learning that doesn't involve learning from data.

<details><summary>Answer</summary>

**Correct: C.** "Trained on labeled data" describes supervised learning broadly — it doesn't distinguish ML from DL. What makes Team B's system *deep* specifically is architecture: multiple stacked layers, each learning a representation built on the layer before it, with no human deciding in advance what "edge density" or "texture" should mean. Team A's logistic regression is real ML — it fits weights from data — but the features themselves came from a person, and there's no layered representation-learning happening. [What is a neural network](/learn/ai-foundations/what-is-a-neural-network) and [why nonlinearity matters](/learn/ai-foundations/why-nonlinearity-matters) go into why stacking layers is what buys you this, and why it doesn't work without nonlinear activations between them.

**A** picks the wrong criterion. "Trained on labeled data" is a description of *supervised learning*, which both teams are doing — it doesn't touch the ML-vs-DL distinction at all, which is about architecture, not about whether labels were used.

**B** applies the "one layer counts" argument too generously. Logistic regression can technically be viewed as a network with one layer and no hidden layers, but "deep" specifically implies multiple stacked hidden layers building hierarchical representations. One layer over human-picked features doesn't have anywhere to build a hierarchy.

**D** has the field hierarchy backwards: deep learning is a *subfield* of machine learning, not a separate field from it. It's ML with a specific architectural commitment (deep neural networks), and it absolutely learns from data — typically needing more of it than classical ML approaches like Team A's.

</details>

## 6. Put the whole map together

Which of these four descriptions correctly places a system in the AI/ML/DL nesting *and* correctly calls it narrow or general?

A. An AlphaGo-style game engine: deep learning (it learns board evaluation from self-play), and narrow AI (superhuman only within the rules of its one game).
B. A rule-based expert system for tax filing: deep learning, and general AI, since it can handle any tax scenario its rules were written to cover.
C. A GPT-style language model: not AI at all, since it's "just predicting the next word" rather than "really understanding" language.
D. A linear regression model predicting house prices from square footage: general AI, because it generalizes to houses it wasn't trained on.

<details><summary>Answer</summary>

**Correct: A.** Both halves check out independently: it's deep learning because it learns evaluation functions through layered networks trained on self-play data, and it's narrow because that superhuman skill doesn't transfer one inch outside its one game — the same network can't play a different game, let alone do anything else. That combination — very deep, very narrow — is the norm for most impressive AI systems, not the exception. [Narrow AI vs. general AI](/learn/ai-foundations/narrow-ai-vs-general-ai) walks through exactly this pattern.

**B** fails on both counts. A rule-based expert system involves no learning from data at all — it's authored logic, so it isn't ML, let alone DL. And covering many pre-written scenarios within one fixed domain (tax filing) is still narrow: "handles the cases someone anticipated" isn't the same as "generalizes across domains it was never designed for," which is what "general" requires.

**C** attacks the wrong question. Whether a next-token predictor "really understands" language is a genuinely open, contested question — but it isn't what determines AI-or-not. By the standard working definition (a system that takes in input and produces goal-directed output), an LLM clearly is AI, and clearly is ML and DL given how it's built and trained. Rejecting the label over a philosophical dispute about understanding is a category error, not a technical one.

**D** makes the most common vocabulary collision in this whole module: it conflates *statistical* generalization with *general intelligence*. A regression model "generalizing" to unseen houses just means it makes reasonable predictions on new inputs drawn from a similar distribution — the ordinary, minimum-bar goal of any ML model, covered in [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting). That has nothing to do with AGI-style generality, which is about flexibility across fundamentally different domains and tasks. Same English word, two unrelated concepts — worth burning into memory now, because it comes back constantly.

</details>

## If a question tripped you up, go here first

- **Missed Q1 or Q5** (the nesting, or what "deep" means mechanically): [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning), [AI, ML, DL as nested fields](/learn/ai-foundations/ai-ml-dl-as-nested-fields), [what is a neural network](/learn/ai-foundations/what-is-a-neural-network).
- **Missed Q2 or Q3** (the misconceptions): [narrow AI vs. general AI](/learn/ai-foundations/narrow-ai-vs-general-ai), [narrow vs. general AI in practice](/learn/ai-foundations/narrow-vs-general-ai-in-practice).
- **Missed Q4** (foundation model vs. application): [foundation models, explained](/learn/ai-foundations/foundation-models-explained), [choosing a model](/learn/ai-foundations/choosing-a-model).
- **Missed Q6** (the generalization/general-intelligence collision): [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) — this one word-collision is worth re-reading until it's automatic.

If you got all six without hesitating, the map is solid enough to build on — the next stretch of the track starts assuming you have it.

**Related:** [AI vs. ML vs. deep learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) · [narrow AI vs. general AI](/learn/ai-foundations/narrow-ai-vs-general-ai) · [foundation models, explained](/learn/ai-foundations/foundation-models-explained) · [what LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) · [how modern AI fits together](/learn/ai-foundations/how-modern-ai-fits-together) · [what is RAG and when to use it](/learn/rag/what-is-rag-and-when-to-use-it)
