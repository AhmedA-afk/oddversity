---
title: "Pipeline vs Single Call: Cost, Latency, Reliability"
track: "prompt-engineering"
status: live
summary: "Five ways to spend extra calls on a hard task, and the arithmetic for when the extra calls actually pay for themselves."
duration: "8 min read"
---

More calls always buys you *something* — more reliability, more inspectability, more room for a step to get its own settings. It also always costs you tokens and latency. The question is never "should I add calls," it's which of five different ways to spend them actually matches your failure mode.

## A. Single monolithic call

One prompt, one pass, asked to do everything and produce whatever shape of answer comes out.

- **How it works:** all instructions, all sub-tasks, and all formatting rules live in one prompt; the model produces the whole answer as one continuous generation.
- **When it wins:** the task is genuinely one job — see [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt) for the signals that say it isn't — and a rough answer is tolerable. Cheapest and fastest option by construction.
- **Failure mode:** when it breaks, you can't tell which part broke. A wrong final answer could be a misread, a bad judgment call, or a formatting slip, and you have one opaque generation to debug all three from.
- **Relative cost:** the baseline — call it 1x tokens, 1x latency, 1 round trip. Every other approach below is measured against this.

## B. Single call, strict output contract

Still one call, but the output shape is [pinned down as a contract](/learn/prompt-engineering/structured-output-contracts) — exact keys, types, and enums — so the result is machine-checkable even though it's still one pass.

- **How it works:** same single generation as A, with the prompt specifying an exact schema and the response validated against it before use.
- **When it wins:** the task really is one job, but the *consumer* is code, not a person, so the failure mode you actually care about is a parse or contract failure, not a reasoning failure.
- **Failure mode:** a well-formed, contract-passing answer can still be wrong on the merits — a strict schema catches shape problems, not judgment problems. See [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts) for that distinction.
- **Relative cost:** roughly 1x tokens and 1 round trip on success, closer to 2x on the rare case a [single repair attempt](/learn/prompt-engineering/validation-and-repair-loop) fires.

## C. Two-stage pipeline

The job splits into exactly two jobs with different grading criteria — classify then extract, extract then generate, draft then verify.

- **How it works:** call one produces a structured intermediate result; call two consumes only that structured result (not the raw input re-explained) to produce the final answer. See [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages) for what should and shouldn't cross that boundary.
- **When it wins:** the two jobs have genuinely different success criteria and you need to see which one is at fault — the [classify-then-extract pipeline](/learn/prompt-engineering/classify-then-extract-pipeline) is the canonical shape.
- **Failure mode:** stage one's error propagates silently into stage two if stage two has no way to flag "the input I got doesn't look right" — a bad seam, not a bad idea, if the interface between stages is underspecified.
- **Relative cost:** roughly 1.5-2.5x the tokens of a single call — each stage re-pays its own prompt overhead and its own portion of context, offset by the fact that stage two's input (a small structured object) is usually far shorter than the raw source stage one read.

## D. Multi-stage pipeline (3+ stages)

The full [resume-screener shape](/learn/prompt-engineering/monolith-to-pipeline-worked): parse, then score, then explain — three or more calls, each independently testable and independently tunable.

- **How it works:** each stage has one job, one rubric, and (often) its own model settings — a deterministic extraction stage at temperature 0, a warmer generation stage for the final write-up.
- **When it wins:** each stage genuinely benefits from its own settings, its own model, or its own eval — and you need to tune or re-run one stage (say, the scoring rubric) without touching the others.
- **Failure mode:** [over-decomposition](/learn/prompt-engineering/over-decomposition) — stages added because the task felt complex, not because a new job with a new rubric actually appeared. Each added stage compounds latency and adds one more place small errors can chain.
- **Relative cost:** scales roughly linearly with stage count — three stages is roughly 3x the round trips of one call, though each stage's re-sent context can be much smaller than the full original input if state is passed cleanly.

## E. Single call, sampled N times (self-consistency)

Not decomposition at all — the same one-job prompt, run multiple times, with the majority or highest-agreement answer kept.

- **How it works:** run the identical call N times at a nonzero temperature, then aggregate — a majority vote for a classification, a consistency check across N reasoning paths for [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling).
- **When it wins:** the task is one job with some run-to-run variance on hard cases, and the variance itself (not a missing sub-task) is the reliability problem.
- **Failure mode:** it does nothing for a systematic error — if every sample makes the same mistake because the prompt itself is wrong, voting N wrong answers together just produces a confident, wrong majority.
- **Relative cost:** roughly Nx tokens and Nx compute, though calls can run concurrently so wall-clock latency can stay close to 1x if you parallelize them.

## Decision table

| Approach | Round trips | Relative tokens | Debuggability | Best for |
|---|---|---|---|---|
| A. Monolithic call | 1 | 1x | Low — one opaque failure | Simple, low-stakes tasks |
| B. Single call + contract | 1 (rarely 2) | 1x-2x | Medium — shape failures are visible | Code-consumed output, one real job |
| C. Two-stage pipeline | 2 | 1.5x-2.5x | High for two failure classes | A task with exactly two distinct jobs |
| D. Multi-stage pipeline | 3+ | ~Nx (N = stages) | Highest — one failure class per stage | Independently tunable sub-problems |
| E. Sampled N (self-consistency) | N | ~Nx | Low for systematic errors, high for variance | One job with run-to-run variance |

Token counts here are relative multiples of a single call's cost, not fixed numbers — see [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) for how those multiples turn into an actual bill on your specific model and prompt lengths.

## How to choose

Start at A and move right only when you have a specific reason, not a vague sense that the task is "complex":

- Move to **B** the moment code, not a person, consumes the output — this one is close to free, so there's rarely a reason to skip it.
- Move to **C** or **D** only when [the actual signals](/learn/prompt-engineering/when-to-split-a-prompt) are present: distinct sub-tasks with different rubrics, conflicting formats, or a step that needs its own reasoning depth. If you can't name what each stage's rubric would be, you're not decomposing a real seam.
- Move to **E** when the single call's *content* is right often enough but inconsistent run to run — sampling fixes variance, not a wrong approach repeated identically.

The break-even test is simple: run a small eval of the single-call version first. If it already clears your bar, every added call is pure cost. If it fails in a way you can attribute to one identifiable sub-task, that's the stage to split off — not the whole prompt. And weigh the latency budget of where this runs: a pipeline that's worth it for a nightly batch job, where three extra seconds is free, can be premature for a live chat turn where a user is watching the clock.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Over-Decomposition: Too Many Stages](/learn/prompt-engineering/over-decomposition), [Worked Example: A Classify-Then-Extract Pipeline](/learn/prompt-engineering/classify-then-extract-pipeline), [Self-Consistency Sampling](/learn/prompt-engineering/self-consistency-sampling), [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost)
