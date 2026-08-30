---
title: "Quiz: Reasoning and Chain-of-Thought"
track: "prompt-engineering"
status: live
summary: "Six scenarios on choosing a reasoning technique, spotting cargo-cult reasoning, and reading a self-consistency vote."
duration: "9 min read"
---

## 1. The tight-SLA classifier

You need to label incoming chat messages `urgent`/`normal` from an explicit statement in the text, under a strict low-latency requirement. What's the best default technique?

- **A.** Chain-of-thought with a "let's think step by step" trigger.
- **B.** Zero-shot direct labeling.
- **C.** Tree-of-thought with three branches.
- **D.** Self-consistency with nine samples.

<details><summary>Answer</summary>

**Correct: B.** The label is decidable from an explicit statement with no real composition, and latency is the binding constraint — see [when chain-of-thought hurts](/learn/prompt-engineering/when-cot-hurts-accuracy). **A** adds reasoning tokens that can talk the model out of a correct snap read, and adds latency for no benefit. **C** tree-of-thought is for discrete branching search, not classification with no search space. **D** nine samples multiplies both cost and latency exposure for a task that doesn't need voting to begin with.

</details>

## 2. Accuracy dropped, responses got longer

A team adds "think step by step" to a sentiment classifier. Their eval shows accuracy drop slightly, and responses are roughly 40 times longer. What's the most likely explanation?

- **A.** The model is broken and needs fine-tuning.
- **B.** Forced deliberation gave the model room to construct and follow a rationalized alternate reading of otherwise-clear text, and the added length is a direct cost of the extra reasoning tokens.
- **C.** Sentiment classification always benefits from more reasoning, so adding even more tokens will fix it.
- **D.** Self-consistency is required to fix this.

<details><summary>Answer</summary>

**Correct: B.** This is exactly the mechanism in [when chain-of-thought hurts](/learn/prompt-engineering/when-cot-hurts-accuracy): reasoning tokens condition the final answer on whatever the model wrote, including a manufactured countervailing reason a snap read never needed. **A** nothing here indicates a broken model — the behavior is a predictable prompting effect. **C** contradicts the observed result; more reasoning on a task that doesn't need it doesn't reliably help and can hurt further. **D** self-consistency assumes some reasoning is worth ensembling — the fix here is removing reasoning, not voting over more of it.

</details>

## 3. Reading the self-consistency cost curve

At per-sample accuracy p = 0.7 with independent errors, what's true about going from N = 5 to N = 15 samples in self-consistency voting?

- **A.** Accuracy roughly doubles.
- **B.** Accuracy keeps improving, but by a shrinking amount per added sample, while cost keeps scaling linearly with N.
- **C.** Accuracy stays exactly the same, because voting only matters up to N = 3.
- **D.** Cost decreases as N grows, because samples run in parallel.

<details><summary>Answer</summary>

**Correct: B.** This is the diminishing-returns curve derived in [self-consistency: sampling and voting](/learn/prompt-engineering/self-consistency-sampling-explained) — majority-vote accuracy keeps rising toward 1 but each added sample buys less than the last, while token cost rises linearly regardless. **A** accuracy is already well above 0.5 and bounded by 1, so it can't double. **C** the derivation shows continued (shrinking) gains well past N = 3. **D** parallel samples can keep wall-clock latency flat, but token cost — what you pay for — still scales with N; parallelism doesn't make the calls free.

</details>

## 4. Real decomposition vs cargo-cult theater

Which of these is a genuinely useful check, rather than cargo-cult reasoning theater?

- **A.** Asking the model to restate the question in its own words before answering.
- **B.** Asking a fresh, independently-sampled pass to check a claim against retrieved evidence the first pass never saw.
- **C.** Adding "let's think step by step" to a single-fact lookup.
- **D.** Asking the same context to "double-check your work" with no new information supplied.

<details><summary>Answer</summary>

**Correct: B.** It's genuine because it introduces information the first pass didn't have — retrieved evidence — which is the actual requirement for a check to catch anything, per [cargo-cult reasoning](/learn/prompt-engineering/cargo-cult-reasoning). **A** restating the question isn't a computed intermediate result; it's narration. **C** a lookup has no sub-steps to decompose. **D** re-reading the same context with nothing new tends to rubber-stamp the original answer rather than catch an error in it.

</details>

## 5. Planning puzzle: shared dead ends

A task requires arranging six delivery stops into a route respecting three hard constraints, where choosing the wrong first stop makes the rest of the route infeasible. Which technique fits best?

- **A.** Plain zero-shot.
- **B.** Self-consistency over five independent full chain-of-thought attempts.
- **C.** Tree-of-thought, branching on next-stop choices and pruning infeasible partial routes.
- **D.** Native extended thinking only, with no other technique.

<details><summary>Answer</summary>

**Correct: C.** This is exactly the shape [tree-of-thought: when the complexity pays off](/learn/prompt-engineering/tree-of-thought-when-worth-it) describes: a discrete search where an early wrong move dead-ends the whole attempt, and partial routes can be checked against the constraints. **A** has no mechanism to satisfy three hard constraints at once without search. **B** underperforms here specifically because a bad first stop isn't independent, scattered noise — it's a shared dead end every attempt starting from it hits alike, so voting across full attempts doesn't correct it. **D** may help on a reasoning model but doesn't provide the explicit backtracking-with-constraint-checking that branch-and-prune gives you.

</details>

## 6. Matching three tasks to the cheapest technique that clears the bar

Three tasks: (1) tagging emails `spam`/`not spam`, mostly easy historical cases; (2) a two-step compound-interest calculation feeding a financial report, where a wrong number is costly; (3) solving a four-number "reach 24" arithmetic puzzle for a game feature. Which pairing of (task → technique) is most defensible?

- **A.** (1) zero-shot, (2) chain-of-thought + self-consistency, (3) tree-of-thought.
- **B.** (1) tree-of-thought, (2) zero-shot, (3) self-consistency.
- **C.** (1) self-consistency, (2) tree-of-thought, (3) zero-shot.
- **D.** (1) chain-of-thought, (2) tree-of-thought, (3) zero-shot.

<details><summary>Answer</summary>

**Correct: A.** Spam tagging is a simple classification with no composition or search — zero-shot, per [which reasoning technique when](/learn/prompt-engineering/reasoning-technique-decision-guide). The compound-interest calculation has real composition, a short checkable numeric answer, and high stakes — chain-of-thought plus self-consistency is the right cost-for-reliability trade. The 24-puzzle is exactly the discrete branching-search case from [tree-of-thought: when the complexity pays off](/learn/prompt-engineering/tree-of-thought-when-worth-it) — an early wrong move dead-ends the attempt, which tree-of-thought is built to recover from. **B** wastes branching search on a task with nothing to search. **C** wastes voting on simple classification and drops search on the one task that needs it. **D** under-invests in the costly numeric task and skips search on the puzzle that needs it most.

</details>

**Related:** [Which Reasoning Technique When](/learn/prompt-engineering/reasoning-technique-decision-guide), [When Chain-of-Thought Hurts](/learn/prompt-engineering/when-cot-hurts-accuracy), [Cargo-Cult Reasoning](/learn/prompt-engineering/cargo-cult-reasoning), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained), [Tree-of-Thought: When the Complexity Pays Off](/learn/prompt-engineering/tree-of-thought-when-worth-it)
