---
title: "Abstention as a First-Class Behavior"
track: "hallucinations"
status: live
summary: "I don't know is a policy the system must explicitly reward and design for, not a default a model falls into on its own."
duration: "6 min read"
---

[Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) explains why guessing wins by default: standard accuracy scoring gives zero credit to both a wrong answer and an honest abstention, so expected-value math favors the guess. This lesson treats what follows from that: abstention has to be built and measured as a deliberate capability, with its own metrics, not left as a side effect of a politely worded prompt.

## What it is

Abstention is the model, or the system wrapping it, declining to give a direct answer — returning "unknown," requesting more information, or routing to a human — when confidence falls below a justified bar. Treating it as first-class means three things have to exist on purpose: an incentive (training or scoring) that doesn't drive its expected value to zero, a measurable trigger for when to invoke it, and a defined place for the abstained case to go, which is exactly what [Escalation Design: Handing Off to a Human When Confidence Drops](/learn/hallucinations/escalation-design-for-uncertain-answers) builds.

## The mental model

Think of every answer the system could give as sitting on a coverage dial: turn the dial to "answer everything," and you get full coverage but you inherit every low-confidence guess along with the high-confidence ones. Turn the dial toward "abstain more," and coverage drops, but the questions still being answered are disproportionately the ones the system was actually sure about — so accuracy on the *answered* subset rises. Abstention doesn't make the model smarter; it makes the system selective about which of the model's answers it's willing to ship.

## Why it works this way — the accuracy/coverage tradeoff

Raising the confidence bar required to answer directly filters out exactly the lower-confidence cases — which are, if your confidence signal is any good, also the cases more likely to be wrong. That's the entire mechanism, and it shows up as a clean tradeoff curve. Illustrative numbers, showing the shape rather than any specific measured system:

| Confidence threshold to answer | Coverage (% answered) | Accuracy on answered set |
|---|---|---|
| 0.0 (answer everything) | 100% | ~72% |
| 0.5 | ~85% | ~80% |
| 0.7 | ~60% | ~90% |
| 0.9 | ~25% | ~97% |

There's no universally "correct" point on this curve — a threshold of 0.9 looks great on accuracy but abstains on three out of every four questions, which may be useless for a product that needs to actually answer things. Picking a point is a business decision made with the people who own the cost of a wrong answer versus the cost of an unnecessary abstention — the same framing [Escalation Design](/learn/hallucinations/escalation-design-for-uncertain-answers) uses for its threshold, because abstention and escalation are the same lever pointed at different destinations (a canned "I don't know" versus a human handoff). The numbers themselves have to come from measured calibration, not a guess — see [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams).

## A concrete example

A long-tail question with genuinely no reliable signal in the model — an obscure regulatory detail nobody documented well — produces, across five resampled answers, five different specific-sounding claims. Left alone, the system picks one of those five at random-ish and ships it with full confidence, because nothing in the pipeline treats "all five disagree" as a reason to stop. With abstention built in as a checked step, that same disagreement (measured as high semantic entropy — see [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive)) triggers a designed response: "I don't have reliable information to answer this confidently" — a specific, intentional output, not a fallback nobody wrote.

## Where it shows up

Support bots asked long-tail questions outside their documentation, medical or legal assistants where a wrong confident answer is costly, and any retrieval-backed system where the retrieved context sometimes just doesn't contain the answer.

## Watch out for

- **Over-rewarding abstention until the system hedges on things it actually knows.** Push the incentive too far and coverage collapses — a system that's never wrong because it almost never answers is not more trustworthy, it's just less useful, echoing the UX point in [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know).
- **Setting one static threshold and assuming it generalizes.** A threshold measured on one question domain doesn't necessarily transfer to another — remeasure per domain, the way [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage) does.
- **Treating abstention as purely a prompting concern.** A model that's willing to say "I don't know" still needs somewhere for that case to go — a review queue, a fallback answer, a retry with more context. Without that destination, abstention is just a more honest way of failing, not a fix.

## Where next

The mechanics for actually eliciting this behavior from a hosted model, without retraining it, are built in [Implementation: Eliciting Abstention Without Retraining](/learn/hallucinations/teaching-abstention-via-prompting-impl). The routing logic that decides where an abstained or low-confidence case goes is worked through end to end in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage).

**Related:** [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Escalation Design: Handing Off to a Human When Confidence Drops](/learn/hallucinations/escalation-design-for-uncertain-answers), [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Implementation: Eliciting Abstention Without Retraining](/learn/hallucinations/teaching-abstention-via-prompting-impl), [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage)
