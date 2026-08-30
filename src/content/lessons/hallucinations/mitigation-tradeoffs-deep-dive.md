---
title: "Deep Dive: The Coverage-Faithfulness-Abstention Triangle"
track: "hallucinations"
status: live
summary: "Aggressive grounding and abstention cut hallucination but also cut coverage — the right operating point depends on the task."
duration: "8 min read"
---

*This is the deferred rigor behind every mitigation in this module. Read it once you've built a grounding, constraint, or abstention mechanism and are deciding how aggressively to tune it — this is optional depth about picking an operating point, not a new technique.*

## The triangle

Every mitigation in this module trades against the same three quantities:

- **Coverage** — the fraction of questions the system actually attempts to answer, rather than refusing or hedging.
- **Faithfulness** — of the answers it does give, the fraction that are actually supported by evidence.
- **Abstention rate** — the fraction of questions it declines, which is mechanically `1 - coverage`, but worth naming separately because it's the *lever* you pull, while coverage is the *outcome* you get.

You cannot maximize all three simultaneously, and every mitigation you've built in this module — strict grounding, cite-or-abstain prompting, confidence-gated refusal — is really a dial that trades coverage for faithfulness. Turn any of them up (stricter grounding requirements, lower confidence threshold before abstaining) and faithfulness rises while coverage falls. Turn them down and the reverse happens. There is no setting where both are maximized at once, because the queries in the middle — genuinely ambiguous, partially supported by evidence, low-but-not-zero confidence — are exactly where the tradeoff bites.

## Why this tradeoff is structural, not a bug to engineer away

This isn't a limitation of any one technique in this module — it falls out of the fact that confidence and correctness are correlated but not identical, the same gap covered in [confidence and uncertainty signals](/learn/hallucinations/confidence-and-uncertainty-signals). A perfect mitigation stack would only abstain on questions it would have gotten wrong and only answer questions it gets right. Real mitigation stacks operate on a noisy confidence signal, not ground truth, so wherever you set the abstention threshold, some genuinely answerable questions fall below it (coverage lost for no faithfulness gain) and some genuinely unanswerable ones sit above it (faithfulness lost for no coverage gain). Moving the threshold trades one error type for the other — it doesn't eliminate both.

This is the same logic as a classifier's precision-recall tradeoff, applied to "should I answer this at all." Strict grounding requirements are one way of raising the threshold; permissive grounding with a light "say unknown" instruction is one way of lowering it. Every recipe in [system-prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes) sits somewhere specific on this dial, whether or not it was tuned deliberately.

## Two systems, two different correct answers

**A support bot answering questions from a policy knowledge base.** A wrong answer here has real cost — a customer acts on an incorrect refund window or a fabricated policy detail, and the business is on the hook for it. This system should sit toward the high-faithfulness, lower-coverage corner: strict grounding (Recipe 1 from [system-prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes)), citation requirements, and a bias toward abstaining and escalating to a human — see [escalation design for uncertain answers](/learn/hallucinations/escalation-design-for-uncertain-answers) — whenever confidence is anything less than clear. A customer occasionally getting "let me connect you with a specialist" instead of an instant answer is a fine price for near-zero fabricated policy claims.

**A brainstorming tool helping someone draft marketing taglines.** There's no ground-truth source to be faithful to — the task is generative by design, not extractive. Demanding citations or abstaining on anything not directly grounded would make the tool useless for its actual purpose. This system should sit toward the high-coverage corner, with essentially no abstention and no grounding requirement, because "hallucination" in the strict sense barely applies to a task with no factual claim being made — this is the case covered in [when hallucination is desirable](/learn/hallucinations/when-hallucination-is-desirable).

Most real systems sit somewhere between these two poles, and the honest exercise is figuring out which corner your *specific* task is closer to, not applying a fixed default. A code-generation assistant, an internal analytics Q&A tool, and an open-ended research assistant each want a different point on the triangle, which [mitigation by task type](/learn/hallucinations/mitigation-by-task-type) works through concretely.

## Tying the choice back to the task's factuality demands

The right operating point isn't a preference — it follows from how much a wrong answer costs versus how much an unanswered question costs, the same per-task calculus covered in [hallucination risk factors](/learn/hallucinations/hallucination-risk-factors). A useful diagnostic: ask what happens if the system is wrong and confident, versus what happens if it's right but declines to answer. If the first is much worse, bias the dial toward faithfulness and abstention. If the second is much worse — a tool whose entire value is fast, always-available output — bias toward coverage, and invest instead in making users aware of the tool's actual reliability, the UX question covered later in this track under [the UX of uncertainty](/learn/hallucinations/ux-of-uncertainty).

## What this doesn't mean

This tradeoff is not an argument for giving up on faithfulness, or for treating any operating point as equally defensible. It's an argument for choosing the operating point deliberately, instrumented and measured, rather than inheriting whatever coverage-faithfulness balance your default prompt happened to produce. The measurement side of this — actually quantifying where your system sits on the triangle instead of reasoning about it qualitatively — is what the next module in this track builds toward.

**Related:** [Confidence and Uncertainty Signals](/learn/hallucinations/confidence-and-uncertainty-signals), [When Hallucination Is Desirable](/learn/hallucinations/when-hallucination-is-desirable), [Escalation Design for Uncertain Answers](/learn/hallucinations/escalation-design-for-uncertain-answers), [Mitigation by Task Type](/learn/hallucinations/mitigation-by-task-type)
