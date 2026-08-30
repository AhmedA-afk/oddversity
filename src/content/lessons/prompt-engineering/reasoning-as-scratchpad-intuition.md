---
title: "Reasoning as a Scratchpad for a Token Predictor"
track: "prompt-engineering"
status: live
summary: "Why writing intermediate steps lets a next-token predictor build an answer it could not have produced in one jump."
duration: "6 min read"
---

Try dividing 4,368 by 24 in your head, all at once, no scratch paper. Most people can't hold it — not because the arithmetic is conceptually hard, but because you'd need to track several partial results simultaneously with nowhere to put them down. Now do it on paper: write 24 into 43, bring down the 6, subtract, bring down the 8. Each line only needs the line before it. That's the whole intuition behind chain-of-thought.

## The analogy

Long division on paper works by converting one hard problem into a sequence of small, mechanical ones, where each step reads the *written* result of the last step rather than a remembered one. You don't need to hold "4368 divided by 24" in working memory all at once — you only ever need to look at the digit you just wrote down and the next digit to bring down. The paper is doing the remembering for you.

A model generating text is in a structurally similar position. It predicts one token at a time, and — as covered in [next-token prediction](/learn/llm-foundations/next-token-prediction) — every token it predicts becomes part of the context for predicting the next one. There's no separate hidden notepad it can scribble on and erase; the *only* place it can carry forward an intermediate result is by actually writing it down as a token. Writing "182" as an intermediate quotient in a division problem is not different in kind from writing "182" as the answer — but for the model, having written it, that digit is now sitting in the context exactly like a number on paper, ready for the next step to read.

## Walking it through

Take the earlier example: 4368 ÷ 24.

1. The model writes "24 goes into 43 once, remainder 19" — this is a token sequence now sitting in context.
2. To compute the next digit, it doesn't need to re-derive the whole problem — it reads "remainder 19," brings down "6" to make 196, and writes "24 goes into 196 eight times, remainder 4."
3. It brings down the 8 to make 48, and writes "24 goes into 48 exactly twice, remainder 0."
4. It assembles the digits it wrote at each step — 1, 8, 2 — into the final answer: 182.

Every step after the first is *easier* than the original problem, because it only has to operate on the small piece of state that was just written, not re-solve the whole division from scratch. That's the mechanical payoff: not "more thinking" in some abstract sense, but the concrete ability to condition each token on a written intermediate result instead of needing to have computed the whole thing in a single forward pass.

## The wrong intuition to correct

The tempting wrong picture is: the model already "knows" 4368 ÷ 24 = 182 internally, and the written steps are just a translation of that internal answer into an explanation for the reader's benefit. If that were true, you could delete the steps and keep the accuracy — but you generally can't. On problems genuinely too complex for a single forward pass, forcing a one-token or one-line answer measurably increases errors, precisely because there's no scratchpad token available to carry the intermediate result. The written steps aren't decoration around an answer that already exists; removing them removes the mechanism that produces the answer at all. This is the same point made in [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does): the steps are computation, not commentary.

## When the analogy breaks

Long division is a fixed, guaranteed-correct algorithm — if you follow the steps faithfully, you get the right answer every time. A model's reasoning steps carry no such guarantee. It can misapply a rule at step three and then follow that mistake just as confidently through step ten, because nothing about the mechanism forces the steps to be *correct*, only that each one conditions on the last. Paper doesn't second-guess itself or introduce a plausible-sounding wrong turn; a language model can. That's why [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling-explained) exists as a separate technique — it doesn't make any single scratchpad more reliable, it runs several independent scratchpads and votes, because the scratchpad-writing process itself isn't error-corrected the way arithmetic-on-paper is.

The analogy also breaks for tasks that don't decompose into an algorithm at all. Long division has a fixed procedure to write down. A lot of tasks — snap classification, matching a tone, picking the more natural phrasing — don't have hidden sequential sub-steps to externalize, so there's no scratchpad benefit to capture, and forcing one can even hurt. See [when chain-of-thought hurts](/learn/prompt-engineering/when-cot-hurts-accuracy) for what that looks like in practice.

**Related:** [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained), [When Chain-of-Thought Hurts](/learn/prompt-engineering/when-cot-hurts-accuracy)
