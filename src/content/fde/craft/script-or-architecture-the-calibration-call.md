---
title: "Script or architecture: the calibration call"
phase: craft
module: calibration-and-restraint
kind: lesson
summary: "The judgement call that separates an FDE from an engineer who over-engineers every request: deciding, fast and defensibly, when a one-time SQL query is the right answer and when it is a two-week configurable engine in disguise as a shortcut."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - State the calibration question in one sentence and apply it to a live request in under two minutes.
  - Name the specific signals that predict whether a request is really a one-off or really a recurring need in disguise.
  - Defend a calibration decision out loud, to a stakeholder who assumed the bigger version was obviously correct.
artifact: A one-paragraph calibration memo for a real or lab request, stating your size decision and the two facts that justify it.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Vinoo Ganesh names calibration as a distinct, trainable trait, separate from technical skill, and tells a cautionary story to make the point concrete: a customer asks for a deduplication capability, and the engineer builds a **configurable deduplication engine**, generalised, parameterised, built to handle cases nobody has asked for yet, when a one-time SQL query would have closed the actual request in an afternoon.

This is not a story about laziness winning over craft. The engineer who builds the configurable engine is usually the more skilled one in the room. The failure is not in the code, it is in answering the wrong question. "Can I build a general system for this" is almost always yes. "Should I, for this request, right now" is a different question, and it is the one that determines whether you deliver in a day or in two weeks, and whether either duration was warranted.

## The calibration question

Before writing any code in response to a request, ask: **if I build the smallest possible version of this, what does it cost me later if I am wrong?**

If the answer is "I redo an afternoon's work," build the smallest version. If the answer is "I have baked in a limitation that costs the customer weeks to unwind, or that a second and third customer will hit the same wall against within a month," the calibration shifts toward more structure now. The mistake in both directions is expensive: over-building wastes your time and delays the thing the customer actually needed today; under-building on something that will clearly recur creates rework that costs more than building it right once would have.

## Signals that predict which way to go

None of these alone is decisive. Weigh them together.

| Signal | Points toward script | Points toward architecture |
|---|---|---|
| Who runs it | You, once, this week | Someone else, repeatedly, unattended |
| Time horizon | A specific deadline, then done | Indefinite, ongoing |
| Blast radius if wrong | You silently redo it | A customer's decision or a downstream system is affected |
| Has this exact shape appeared before | No, first time you've heard this ask | Yes, this is the third customer asking the same thing |
| Cost of the smaller version being wrong | Cheap, an afternoon | Expensive, days to unwind |
| Is the requester actually asking for generality | No, describing one specific problem | Yes, explicitly wants a platform |

The cautionary story's dedup request almost certainly failed the "has this exact shape appeared before" test in reverse: nobody had asked for a second, third, or fourth version of it yet, and the engineer generalised anyway, on spec, against a future that had not been confirmed to exist.

## The size that most under-experienced engineers skip

Between "quick script" and "reusable platform" sits a third option that this path treats as its own category throughout this phase: a small, focused service. Neither a one-off you throw away nor a general engine you maintain forever, but a bounded piece of code with a clear interface, built for the actual, currently known set of cases, and extended only when a second real case shows up and asks for it.

This is the calibration default for most FDE work, because most enterprise requests are neither truly one-off nor truly platform-shaped. They are "this specific business process, done properly, for this specific customer, this quarter." Build for that scope, explicitly, and say so.

## Defending the smaller call

The harder skill is not making the calibration decision privately, it is defending it out loud when a stakeholder assumes bigger is obviously better, because "obviously better" is often just "sounds more impressive in the room."

A defensible answer names the trade-off plainly: "I could build this as a configurable engine that handles any deduplication rule you might ever want, and that would take roughly two weeks. Or I can write a script today that solves exactly the case you described, and if a second team needs something similar next month, we build the general version then, informed by two real cases instead of guesses about a third that might never arrive." Most stakeholders, given that framing, choose the smaller option, because most of them are also under a deadline and had not actually asked for a platform, they had asked for their problem to go away.

## When the bigger call is right

Calibration is not a bias toward small. Sometimes the signals genuinely point the other way: three customers have asked for the same reconciliation logic in the last month, the vendor's own roadmap confirms this becomes a permanent integration point, or the cost of the smaller version failing is a compliance exposure, not an afternoon's rework. In those cases, the configurable version is the correctly calibrated choice, and building the script instead would be the miscalibration.

The skill is not "always build small." It is answering the actual question, with actual evidence, in the two minutes you usually have before someone expects an answer.

## Do this now

Take three requests you have received in this path so far, real or from a lab, and write a two-sentence calibration memo for each: your size decision, and the two signals from the table above that justify it. Then read [Drill: ten customer requests, size each one in two minutes](/roles/forward-deployed-engineer/craft/calibration-drill-ten-requests-ten-sizes) and run the full drill against a clock.
