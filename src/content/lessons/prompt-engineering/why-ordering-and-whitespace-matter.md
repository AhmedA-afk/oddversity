---
title: "Why Ordering and Whitespace Change the Output"
track: "prompt-engineering"
status: live
summary: "You can swap two paragraphs without changing a single word and get a different answer -- because the model reads in order, not all at once."
duration: "5 min read"
---

You can swap two paragraphs in a prompt without touching a single word and get a meaningfully different answer back. That's not a quirk. It's the model doing exactly what it always does: reading in order, and building each new token on everything that came before it.

## The analogy

Think of a juror listening to witnesses at trial. Testimony heard first sets a frame — it shapes how the juror interprets everything that comes afterward. Testimony heard last is freshest at the moment deliberation starts. A skilled lawyer treats witness order as a real decision, not paperwork, because a juror doesn't get to rewind and re-weigh everything with perfect, order-independent fairness once the verdict is due.

A model producing your next answer is a bit like that juror rendering a verdict the instant the last word is read. It takes in your prompt in order, and it has to act — generate the next token — right after, with no separate step where it steps back and reconsiders everything holistically before deciding what matters most.

## A mental simulation, step by step

Take a classification prompt with one hard constraint and three examples, and put the constraint in two different places.

**Constraints above the examples:**

```text
Constraint: never mention pricing in the response.

Example 1: [...]
Example 2: [...]
Example 3: [...]

[the real input to classify]
```

**Constraints right before the input:**

```text
Example 1: [...]
Example 2: [...]
Example 3: [...]

Constraint: never mention pricing in the response.

[the real input to classify]
```

Walk through the first version step by step. The model reads the constraint. Then it reads three examples — and suppose one of them, written carelessly, happens to include a price in its sample output. By the time the model reaches the real input, it has seen "mentioning a price" modeled concretely, in an example, more recently than it read the abstract rule against doing so. Nothing malicious happened; the ordinary tendency to pattern-match the most recent, most concrete demonstration can simply outweigh a rule read further back.

In the second version, the constraint is the last thing read before the actual task. There's no example sitting between the rule and the moment it needs to apply. This is the same directional effect [instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency) derives mechanically from causal attention — this lesson is the intuition for why that mechanism feels the way it does when you're staring at two versions of a prompt trying to decide which one to ship.

## The wrong intuition (and the correction)

The natural wrong intuition: "the model reads the whole prompt at once, like a person skimming a page, so section order is just cosmetic organization — a courtesy for human readers, not something that changes what the model actually does with the content."

That's backwards. The model doesn't skim and reorganize impressions the way a person glancing over a document might. It consumes tokens in strict sequence, and every token it generates is conditioned on the exact sequence read so far — there's no separate holistic pass that flattens order back out. Order is closer to the order a lawyer calls witnesses than to the order of headings in a report meant purely for a reader's convenience: it's a real lever with a real, directional effect on the outcome, not decoration.

## When the analogy breaks

The comparison is useful, not exact, and it breaks in specific places:

- **The model doesn't forget the way a juror's memory can fade.** Everything still inside the context window gets fresh attention at every generation step — nothing is literally lost the way hours-old testimony can fade from human memory. The positional effect is about *how much weight* different positions tend to get, not about content disappearing.
- **The model isn't persuaded.** A juror can be swayed by rhetorical skill or emotional appeal; the model's output is a statistical continuation shaped by pattern and position, not by anything resembling being convinced of something.
- **Repetition works differently.** Stating a constraint once near the top and again right before the input — bracketing it — gets most of the benefit of both positions at once, cheaply. Asking a juror to hear the same testimony twice doesn't double its influence the same clean way; for a model, deliberate repetition is a genuinely effective, low-cost fix that has no easy courtroom equivalent.
- **Explicit structural labeling can override pure position.** A rule wrapped in something like `<critical_constraint>` tags and stated as always taking precedence can partly overcome an unfavorable position, because the model also responds to stated salience, not just recency. Juries have no built-in mechanism for "weigh this specific testimony as decisive regardless of when you heard it" the way a model can respond to an explicit instruction that says exactly that.

Treat the analogy as a way to feel why order matters before you've read the mechanism, not as a literal model of how attention works — for that, [why prompts steer next-token prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) and [prompting as conditioning](/learn/prompt-engineering/prompt-as-conditioning-intuition) are the more precise pictures.

**Related:** [Instruction Position and Recency](/learn/prompt-engineering/instruction-position-and-recency), [Why Prompts Steer Next-Token Prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction), [Prompting as Conditioning](/learn/prompt-engineering/prompt-as-conditioning-intuition), [Prompting Is Not Deterministic Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming)
