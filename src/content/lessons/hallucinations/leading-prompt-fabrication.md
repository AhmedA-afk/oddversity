---
title: "Worked Example: False Premises and Leading Questions"
track: "hallucinations"
status: live
summary: "A false medical premise gets a fabricated mechanism, and a nonexistent document section gets invented content — both from the model's reluctance to object."
duration: "6 min read"
---

Two prompts, two different tasks, one shared failure: the model treats "you asked about X" as proof that X is a real thing worth answering about, instead of a claim worth checking first.

## The setup

Case A is a factual false premise embedded in a question. Case B is a false premise embedded in an instruction — asking for a summary of something that isn't in the document at all.

## Step by step

**Case A — "Why does aspirin cure diabetes?"**

Aspirin does not cure diabetes; there is no established mechanism by which it does. The question's phrasing — "why does X" rather than "does X" — presupposes the claim is settled and asks only for an explanation.

> Model output to watch for: *"Aspirin's anti-inflammatory action reduces the low-grade inflammation associated with insulin resistance, which is thought to improve the body's response to insulin and help manage blood sugar levels."*

> **Why this is a hallucination, not an explanation:** every clause in that sentence borrows something real — aspirin genuinely has anti-inflammatory effects, insulin resistance genuinely involves inflammation-related pathways — and assembles them into a mechanism for a claim ("cures diabetes") that was never true to begin with. This is the same move as a fabricated citation: real components, real-sounding shape, no actual referent. The model accepted "why" as license to explain rather than treating it as a claim to evaluate, exactly the mechanism described in [adversarial and leading prompts](/learn/hallucinations/adversarial-and-leading-prompts) — a "why did X happen" question is statistically almost always asked about something that did happen, so the model inherits that assumption along with the phrasing.

**Case B — "Summarize the section about supply chain resilience."**

The source document (a fictional quarterly update) covers revenue, hiring, and product launches. It has no section on supply chain resilience — the phrase doesn't appear anywhere in it.

> Model output to watch for: *"The section on supply chain resilience notes that the company is diversifying its supplier base to reduce dependency on single sources."*

> **Why this is a hallucination, not a summary:** this is an extrinsic fabrication in the strict sense from [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination) — there's no source content to check this against at all, because the section doesn't exist. The instruction's confident framing ("the section about X") functions exactly like a leading question: it tells the model a section exists, and the model produces content to match rather than checking whether the premise — that such a section is even there — holds up. This is the same failure traced in [summarization unfaithfulness](/learn/hallucinations/summarization-unfaithfulness), one step earlier: there, the source existed and got misrepresented; here, the thing being "summarized" was never there to misrepresent.

## Where it breaks (and the fix)

Both cases share the same root mechanism: a model predicts the most likely continuation of the text in front of it, not the most truthful one, and the statistically likely continuation of a confidently-phrased premise is an answer that treats the premise as settled — because that's how real conversations overwhelmingly work. People rarely ask "why did X happen" unless X happened, and rarely ask to summarize a section that isn't there. The model has learned that regularity from enormous amounts of ordinary text, and it transfers even when the premise this time is false.

The reluctance to reject a premise isn't a knowledge gap — a model that "knows" aspirin doesn't cure diabetes can still answer the "why" question as posed, because rejecting the premise requires a different behavior than answering it, and nothing about the prompt requested that behavior. The fix has to ask for it explicitly:

- **Instruct premise-checking before answering.** A system-prompt line like "if a question or instruction contains a claim you cannot confirm — including that a referenced section, fact, or event exists — state that before proceeding" changes the default from compliance to scrutiny.
- **Give explicit permission to contradict the framing.** "That's not accurate" and "that section doesn't appear in this document" need to be available, low-friction responses, not responses the model has to fight its own training to produce.
- **Ground anything checkable.** For Case B specifically, requiring the model to quote the source section before summarizing it — the same technique from [citation hallucination](/learn/hallucinations/citation-hallucination) — makes the absence immediately visible: it can't quote a section that isn't there.

## Takeaways

- A false premise inside a question ("why does X") and a false premise inside an instruction ("summarize the section about X") are the same failure wearing different grammar — both get accepted by default because acceptance is the statistically normal move.
- Fabricated content built on a false premise reuses real, true components assembled around a false center — which is exactly what makes it read as more convincing than an honest hedge would.
- The mitigation is behavioral, not informational: the model usually has the knowledge to reject the premise. It needs explicit permission and instruction to actually do it, not more facts.

**Related:** [Leading Questions and False Premises That Induce Hallucination](/learn/hallucinations/adversarial-and-leading-prompts), [Teaching a Model to Say 'I Don't Know'](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Worked Example: When a Summary Betrays Its Source](/learn/hallucinations/summarization-unfaithfulness), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination)
