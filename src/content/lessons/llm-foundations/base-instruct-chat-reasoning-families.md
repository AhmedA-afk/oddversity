---
title: "Base vs Instruct vs Chat vs Reasoning Models"
track: "llm-foundations"
status: live
summary: "Same architecture, different post-training — how to recognize a base, instruct, chat, or reasoning model from its behavior, not its name."
duration: "7 min read"
---

[Model Families](/learn/llm-foundations/model-families-and-variants) names the four checkpoints you'll run into. This lesson is the diagnostic version: what to actually type at each one to tell them apart, and which training stage each behavior traces back to.

## Base

**How it works:** straight out of pretraining (see [Pretraining Explained](/learn/llm-foundations/pretraining-explained)) — a pure next-token predictor with no post-training at all.

**Diagnostic:** give it "Here is a haiku about the ocean:" and it reliably continues, since that's a well-represented completion-shaped pattern. Give it "What's 15% of 60?" cold, and it might just as easily continue with another question, a fake attribution ("— asked on a math forum"), or drift into unrelated text, because nothing in its training ever anchored "question" to "answer it directly."

**Best for:** few-shot pattern completion, raw text continuation, or as the substrate every other family is built from.

**Failure mode:** unreliable at being addressed directly; needs careful prompting, often with few-shot examples, to behave assistant-like at all.

## Instruct

**How it works:** base model plus [SFT](/learn/llm-foundations/supervised-fine-tuning-mechanics) on (instruction, response) pairs — learns the shape of directly answering a single instruction.

**Diagnostic:** "What's 15% of 60?" reliably gets "9" or a short worked calculation, no wandering. Hand it a multi-turn exchange referencing something said two turns ago, though, and weaker instruct-only tuning can lose track — its training examples were mostly single instruction-response pairs, not extended dialogues.

**Best for:** single-shot API-style tasks — extraction, classification, rewriting, one-off Q&A — where you want a direct answer to one instruction, no conversational framing.

**Failure mode:** comparatively weak multi-turn coherence, and no particular tuning toward the more subjective preferences — tone, safety calibration — that need comparison-based data to instill.

## Chat

**How it works:** instruct-level SFT plus training on genuinely multi-turn conversation data, usually plus a preference-optimization pass ([RLHF or DPO](/learn/llm-foundations/rlhf-reward-models-and-ppo)) tuned specifically for what makes a conversation feel helpful, safe, and coherent across turns.

**Diagnostic:** it remembers what you asked two messages ago, asks a clarifying question instead of guessing when a request is ambiguous, and declines harmful requests conversationally rather than either refusing everything cautiously or complying with everything literally.

**Best for:** the actual product surface most people interact with — a conversational assistant that needs to sustain context and hold a calibrated stance across many turns.

**Failure mode:** the preference-optimization pass that gives it this polish is also where alignment side effects like sycophancy and over-refusal creep in (see [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy)) — chat-tuned models are the family most shaped by, and most exposed to, that stage's failure modes.

## Reasoning

**How it works:** trained, often with reinforcement learning against verifiable outcomes — a correct final answer, a passing test — rather than only preference labels, to emit an extended chain of intermediate reasoning before producing a final answer. See [How Reasoning Models Are Trained](/learn/llm-foundations/how-reasoning-models-are-trained) for the training mechanics.

**Diagnostic:** give it a genuinely multi-step problem and it visibly "thinks out loud" for many tokens, exploring, backtracking, checking its own intermediate steps, before committing to a final answer. Give it a trivial one-line factual lookup and that same habit can show up as unnecessary deliberation where a chat model would just answer.

**Best for:** problems where getting the right answer benefits from decomposing into steps and checking intermediate work — multi-step math, code that needs to satisfy explicit constraints, planning tasks.

**Failure mode:** real latency and token cost on every response, including ones that didn't need it — see [Chain of Thought and Test-Time Compute](/learn/llm-foundations/chain-of-thought-and-test-time-compute). It isn't a strictly-better replacement for a chat model, it's a different tradeoff point.

## Decision table

| Family | Trained with | Recognize it by | Best for |
|---|---|---|---|
| Base | Pretraining only | Continues text; ignores "being asked" | Raw completion, few-shot pattern tasks |
| Instruct | + SFT on instruction/response pairs | Answers one instruction directly, weak across turns | Single-shot API tasks: extract, classify, rewrite |
| Chat | + multi-turn SFT + preference optimization | Holds context across turns, calibrated refusals | Conversational products |
| Reasoning | + RL against verifiable outcomes, long chain-of-thought | Visible extended "thinking" before the final answer | Multi-step math, code, planning |

## How to choose

Pick the lightest family that solves the task. Reaching for a reasoning model on a lookup task burns latency and cost for no measurable gain, and reaching for a bare instruct model when you need multi-turn memory means re-inventing conversation state yourself. When in doubt, start with a chat-tuned model — the best-rounded default for most product surfaces — and move to a reasoning variant specifically when you can point to a class of problems where step-by-step deliberation demonstrably changes whether you get a right answer.

**Related:** [Model Families: Base, Instruct, Chat, Reasoning](/learn/llm-foundations/model-families-and-variants), [From Base Model to Assistant](/learn/llm-foundations/from-base-model-to-assistant-pipeline), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo), [How Reasoning Models Are Trained](/learn/llm-foundations/how-reasoning-models-are-trained)
