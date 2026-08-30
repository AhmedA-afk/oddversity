---
title: "Black-Box vs. White-Box Detection"
track: "hallucinations"
status: live
summary: "What kind of model access you have decides which detection techniques are even on the table — a capability table for picking."
duration: "6 min read"
---

Before you pick a detection technique, answer a more basic question: what can you actually see? A team calling a hosted API and a team running open weights on their own GPUs are not choosing between detection methods on equal footing — one of them has a door closed that the other can walk through.

## What it is

**Black-box detection** works from the model's inputs and outputs alone — the prompt you sent and the text (and maybe logprobs) that came back. You never see inside the computation. **White-box detection** requires access to the model's internals: full logit distributions over the whole vocabulary, hidden-state activations, attention patterns, or the ability to train a probe against them. The distinction matters because it's not a preference, it's a constraint — most teams don't get to choose freely, their deployment already decided it for them.

## The mental model

Access comes in layers, and each layer unlocks a specific set of techniques from the [four signal sources](/learn/hallucinations/detection-landscape-overview):

| Access level | What you get | Techniques it unlocks | Typical scenario |
|---|---|---|---|
| Black-box, single call | completion text only | none reliably alone — needs pairing with sampling or an external check | A hosted API called once per request |
| Black-box + logprobs | text plus per-token log-probabilities | token-probability confidence, perplexity-style scoring | APIs that expose a logprobs parameter |
| Black-box + multi-sample | N completions of the same prompt | self-consistency, ChainPoll-style polling | Any hosted API — just costs N× the calls |
| White-box (open weights) | full logit distribution, hidden states, attention, the ability to fine-tune a probe | entropy over the entire vocabulary, linear probes on internal representations, attention-based grounding signals | A self-hosted open-weight model |

Notice that logprob access sits in a gray zone: it doesn't require model weights, but it isn't guaranteed by every hosted API either — some expose it only on certain endpoints, some cap it to the top few tokens, some don't expose it at all for chat-style completions. Treat "logprobs available" as its own capability check, not something you can assume alongside plain black-box access.

## Why it works this way

Most production teams build on a hosted frontier model, and a hosted API is deliberately a black box by design — the provider is selling you a text-in, text-out service, not the weights. That single fact shapes the entire practical detection landscape: research on hallucination detection often leans on internals (linear probes trained on hidden states, entropy over the full output distribution) because researchers frequently have open-weight access, but a team shipping against a hosted API usually can't reach for any of that. This is why the bulk of production detection work — and the bulk of this module — leans on black-box methods: [self-consistency](/learn/hallucinations/self-consistency-detector-impl), [self-verification](/learn/hallucinations/self-verification-chain-impl), [ensemble cross-checking](/learn/hallucinations/ensemble-cross-check-impl), [LLM-as-judge](/learn/hallucinations/llm-as-judge-for-faithfulness), and external grounding checks all work with nothing more than API calls.

## A concrete example (shown)

**Team A** calls a hosted model through a standard chat API, no logprobs exposed on the endpoint they're using. Their options are the top two rows of the table: resample the same question a few times and check agreement ([self-consistency](/learn/hallucinations/self-consistency-detector-impl)), or run a second model call that checks the first ([self-verification](/learn/hallucinations/self-verification-chain-impl), [LLM-as-judge](/learn/hallucinations/llm-as-judge-for-faithfulness)). Both cost extra calls; neither requires anything from the provider beyond what a normal API key already grants.

**Team B** self-hosts an open-weight model. They can add a cheap confidence layer that reads the full logit distribution at generation time — no extra calls needed, since the information is already computed as a byproduct of the forward pass that produced the answer. They could also train a lightweight probe on hidden states to predict hallucination risk directly, though that requires labeled examples and its own evaluation work before it's trustworthy.

Same underlying problem, genuinely different toolkits, because the access is different.

## Where it shows up

This split is the first filter to apply before reaching for [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared) — half the row in that comparison table (anything requiring logprobs or internals) is simply unavailable if you're on a black-box-only hosted API. Knowing that up front saves you from designing a detection stage around a signal you can't actually get.

## Watch out for

- **Assuming your vendor exposes logprobs.** Many hosted chat APIs don't, or only on specific models or endpoints — check the actual API surface before designing a technique around it, don't assume parity across providers or even across a single provider's model lineup.
- **Confusing training-time visibility with inference-time visibility.** Being able to fine-tune a model, or seeing its loss curve during training, is not the same as having logprob or hidden-state access at inference time for a deployed model.
- **Underestimating the engineering cost of white-box methods.** Probes and internals-based scoring aren't free just because you have the access — they need labeled training data and their own validation before you'd trust them, which is real work most teams underbudget.

**Related:** [The Detection Landscape: What We Can and Can't Observe](/learn/hallucinations/detection-landscape-overview), [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability), [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl), [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared)
