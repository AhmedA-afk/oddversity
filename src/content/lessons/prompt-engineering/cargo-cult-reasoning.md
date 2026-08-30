---
title: "Cargo-Cult Reasoning: Steps That Don't Help"
track: "prompt-engineering"
status: live
summary: "Five reflexive reasoning habits that inflate tokens without improving accuracy, and the leaner fix for each."
duration: "8 min read"
---

[Reasoning and decomposition](/learn/prompt-engineering/reasoning-and-decomposition) makes the general point: decomposition helps when a task has separable decisions with real evidence behind them, and hidden reasoning text is not itself proof of anything. These are the specific, recurring ways teams reach for reasoning as a reflex instead of a diagnosis — and what to do instead of each one.

### The mistake: appending "think step by step" to everything

**Why it's wrong:** reasoning tokens only help when there's real computation being deferred. On a task with no decomposable sub-steps — a lookup, a single-fact classification, picking a label from an explicit statement in the text — the model just narrates around an answer it would have given immediately. See [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does) for why the mechanism requires genuine intermediate values, not just any preceding text.

**Symptom:** response length balloons for a task whose gold answer is one word, one number, or one label; latency complaints appear on endpoints that should be near-instant; when you actually run an eval, accuracy is flat between the trigger-phrase version and the plain version.

**Fix:** reserve the trigger for tasks with a genuine multi-step structure. Default to a bare instruction and measure before adding reasoning — see [prompt evaluation basics](/learn/prompt-engineering/prompt-evaluation-basics).

### The mistake: faux self-critique that never changes the answer

**Why it's wrong:** "Now double check your answer" is only useful if the check draws on something the first pass didn't have — a different vantage point, an external fact, a rerun with different sampling. Asking the same context to re-read its own just-written answer usually reproduces the same reasoning and rubber-stamps it, because nothing new entered the context to catch the error.

**Symptom:** the "verification" step says "yes, this is correct" even on cases you independently know are wrong; the critique text reads as boilerplate confirmation that never engages with specifics.

**Fix:** make the check genuinely independent — a fresh sample at nonzero temperature and a vote (see [self-consistency: sampling and voting](/learn/prompt-engineering/self-consistency-sampling-explained)), a rule-based validator, or a prompt that hands the checker new information the first pass never saw.

### The mistake: reasoning that pads tokens without decomposing anything

**Why it's wrong:** a paragraph that restates the question in different words, before answering, *looks* like chain-of-thought syntactically — it's text before the answer — but doesn't do the mechanical thing that makes CoT work. None of its sentences are computed intermediate results the final answer actually depends on; they're filler.

**Symptom:** delete the reasoning paragraph, keep only the final answer, and accuracy doesn't change; the "reasoning" doesn't contain any number or fact the final answer actually uses.

**Fix:** ask for the specific intermediate artifact the task needs — a subtotal, an extracted list, a classification of the evidence — rather than an open-ended "explain your thinking." This is the artifact-first framing from [reasoning and decomposition](/learn/prompt-engineering/reasoning-and-decomposition).

### The mistake: trusting a long, confident trace as proof of correctness

**Why it's wrong:** a fluent multi-step trace and a correct answer are two different things. A model can narrate a wrong step exactly as confidently as a right one, and the length or polish of the explanation carries no information about whether it's true.

**Symptom:** reviewers approve outputs because "the reasoning looked thorough," without checking the final answer against a known-correct case.

**Fix:** score outputs against ground truth, not against how convincing the trace reads — see [rubric and LLM judge](/learn/prompt-engineering/rubric-and-llm-judge) for scoring that inspects the actual answer, and use self-consistency or an external check when correctness genuinely matters.

### The mistake: defaulting to self-consistency or tree-of-thought "just in case"

**Why it's wrong:** both techniques trade a real, at-least-linear cost multiplier for reliability gains that only materialize on tasks with the right shape — a short checkable answer for voting, a discrete branching search for tree-of-thought. Applying either to open-ended generation, or to a task with only one real path through it, spends the budget without the mechanism that would make it pay off. See [tree-of-thought: when the complexity pays off](/learn/prompt-engineering/tree-of-thought-when-worth-it) for exactly how narrow that fit is.

**Symptom:** infrastructure cost scales up with adopted "reasoning best practices," but eval accuracy doesn't move; nobody can name the specific task property the extra sampling or branching is supposed to be fixing.

**Fix:** use [which reasoning technique when](/learn/prompt-engineering/reasoning-technique-decision-guide) to match technique to task shape before reaching for the expensive ones, and gate any reasoning technique behind a measured eval delta, never habit alone.

## Pre-flight checklist

- [ ] Does this task actually decompose into sub-steps a competent human couldn't skip? If not, don't add chain-of-thought.
- [ ] Does the "check your work" step receive any information the first pass didn't have? If not, it won't catch anything.
- [ ] Can you point to a specific intermediate artifact the final answer is built from, or is it restated narration?
- [ ] Have you verified the answer against ground truth, rather than judging the trace's fluency?
- [ ] Does the task have a short, checkable answer (self-consistency) or a discrete branching structure (tree-of-thought), before reaching for either?

**Related:** [Reasoning and Decomposition](/learn/prompt-engineering/reasoning-and-decomposition), [When Chain-of-Thought Hurts](/learn/prompt-engineering/when-cot-hurts-accuracy), [Which Reasoning Technique When](/learn/prompt-engineering/reasoning-technique-decision-guide), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained), [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics)
