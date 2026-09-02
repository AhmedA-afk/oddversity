---
title: "How to run a decomposition drill, and the rubric"
phase: practice
module: decomposition-drills
kind: reference
summary: The decomposition round is the highest-weighted interview in the FDE loop and the one most candidates fail. This page defines the 45-minute drill format, the six-part method, the five-criterion rubric, and how to file each attempt as a portfolio artifact.
duration: 10 min
updated: "2026-09-02"
outcomes:
  - Run a 45-minute decomposition drill solo or with a partner playing the customer.
  - Score any decomposition against five criteria and identify which one you are weakest on.
  - File each attempt as a one-page memo that an interviewer or a hiring manager could read.
artifact: "A drill log: one dated one-page memo per attempt, with the score and the one thing you would do differently."
sources:
  - "https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde"
  - "https://www.tryexponent.com/guides/palantir-forward-deployed-engineer-interview"
  - "https://www.tryexponent.com/guides/databricks-forward-deployed-engineer-interview"
  - "https://www.tryexponent.com/experiences/eleven-labs-solutions-architect-interview-ce0689"
  - "https://www.teamblind.com/post/update-interview-experience-palantir-new-grad-fdse-interview-dtncjyze"
  - "https://fde.academy/blog/the-forward-deployed-engineer-roadmap"
---

Every FDE loop has a round where someone describes a messy business problem and watches what you do with it. Palantir calls it Decomposition and runs it as one of three 60-minute onsite rounds. Databricks added one in 2026: five to fifteen minutes of clarifying questions, then a design. ElevenLabs runs it as a case: "Imagine I'm the CTO of an airline. When planes break or schedules change, our operators reschedule everything manually." A Palantir new-grad candidate described the round on Blind as "they give a sample data set and ask how can you use this data to do something".

Exponent's guide calls decomposition the single most important filter in the FDE process, and lists "jumping to a solution in the decomposition round" second on its list of rejection patterns. The candidate who wrote up the ElevenLabs loop drew the same lesson in one line: "Don't jump straight to some shiny AI answer. Ask how the customer solves it today."

That is the whole skill. It is trainable and almost nobody trains it, because practising it needs a customer and nobody supplies one. The twelve drills in this module are the customers.

Ignore the "40% pass rate" figure that circulates on prep sites. No source shows a data set behind it. Practise because the round is real, not because a number said so.

## The format

**Forty-five minutes, timed, once a week, from week 8 of the plan onward.**

- **Solo.** Read only the brief and the quoted stakeholders. Set a timer. Write as you go; no editing after the bell. Where you would ask a question, write the question down and answer it with your own assumption, marked as an assumption. Then read the reveal.
- **With a partner.** Give them the brief and the stakeholder quotes, plus the "what is actually going on" section, which you must not read. They play the loudest stakeholder. Their instructions: answer only what is asked, answer it in the stakeholder's own interest, volunteer nothing, and if the candidate proposes a build in the first ten minutes, say "sounds great, how long?" and let them dig the hole. Ten minutes of feedback afterwards, scored against the rubric below.

The partner version is worth a great deal more than the solo version, and the difference is the part interviews test: pulling information out of someone who is not trying to help you. Trade drills with someone else on the same path and alternate roles.

## The six-part method

Same six moves, every drill, in this order. The order is the point; a strong answer that arrives in the wrong order still reads as jumping to a solution.

| Minutes | Move | What you produce |
|---|---|---|
| 0–8 | **Clarify** | Questions, asked out loud, about how the work is done today. Who does it, how many times a day, what happens when it goes wrong. No solution language yet. |
| 8–15 | **Stakeholders and success metrics** | The cast, what each one is measured on, who owns the decision, and one number that would move if this worked, with its current value. |
| 15–23 | **Inputs and data** | Where the data physically lives, who grants access, what shape it is in, what is missing, and how it lies. |
| 23–33 | **Decompose** | The problem split into components with dependencies. Which parts are data plumbing, which are logic, which need a model, which need a human. |
| 33–40 | **Walking-skeleton MVP** | The thinnest end-to-end path a real user touches, and when. Not a subset of features: a whole thin slice. |
| 40–45 | **Risks and what you would build first** | The three things that would kill this, how you would find out early, what you would refuse, and the single component you start on Monday. |

Two notes on the moves people rush.

**Clarify means how, not what.** "How does the operator decide today?" beats "what accuracy do you need?" every time. The first question surfaces tacit rules that were never written down. The second gets you a made-up number.

**A walking skeleton is thin, not small.** Ten documents through the real ingestion path, the real permission check, the real model call and the real reviewer screen, is worth more than a perfect extraction stage with no reviewer. Thin slices find the integration problems, which are the ones that eat the timeline.

## The rubric

Score each criterion 0 to 3. Fifteen points total.

| # | Criterion | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| 1 | **Clarified before solving** | Proposed a build in the first five minutes | Asked a few questions, mostly about technology | Mapped the current process end to end before designing | Also found the step the stakeholder did not mention, by asking how it fails |
| 2 | **Stakeholders, incentives, decision owner** | Treated the room as one voice | Named the people | Named what each is measured on | Named who can kill the project, who benefits, and how their incentives conflict |
| 3 | **Success metric with a baseline** | No metric, or a model metric only | A business metric with no current value | A metric, its current value, and how you would measure it | Also what that metric trades against, and who accepts the trade |
| 4 | **Data and access reality** | Assumed the data is available and clean | Named the systems | Named the systems, the owner of access, and the format | Also how the data lies, and a check you would run in week one to find out |
| 5 | **Staged plan, risks, restraint** | One big build, one date | A phased plan without dependencies | A walking skeleton, a dependency order, named risks | Also what you would not build, what you would test before committing, and what you refused to promise |

**Ten or above with no zero is a pass.** A zero on any criterion is a fail regardless of the total, because in a real room a zero on criterion 4 means the project stalls for six weeks on an access ticket and a zero on criterion 5 means you promised a date you cannot hit.

Track your scores by criterion, not just the total. Nearly everyone has one criterion they lose points on every single week. Engineers usually lose 2 and 3. People from consulting or sales usually lose 4.

## Recording the attempt

Every drill leaves an artifact. One page, in the same file every week, dated. The template:

```
Drill 07 — 2026-09-14 — 45 min, with partner (Ravi as the ops director)

Stated problem:      one sentence, in their words
Real problem:        one sentence, in yours
Decision owner:      name and role
Success metric:      metric, today's value, target, who accepts it
Data:                systems, access owner, the lie
Components:          5 to 8 bullets in dependency order
Week-one slice:      what a real user touches, and which user
Would not build:     the thing they asked for that I would push back on
Top risk:            and the cheap test that would surface it
Score:               3/2/1/3/2 = 11
Do differently:      one sentence
```

Twelve of those in a file is a portfolio artifact in its own right. It shows a hiring manager a habit rather than a claim, and it is the raw material for the "tell me about a time you scoped something ambiguous" question, which every loop asks in some form. One roadmap for the role sets a milestone of decomposing a live problem in under fifteen minutes; you get there by having done it forty times on paper first.

## Common failure patterns

- **Solving the stated problem.** The brief is what someone thinks the answer is, wearing the clothes of a problem. "We need an AI chatbot for grievances" is a proposed solution. The problem is behind it.
- **Accepting the metric you were handed.** Every metric trades against another one. Ask which.
- **Designing for a system you have not confirmed exists.** Half the drills here contain an integration the stakeholder assumes is available and is not.
- **Silence.** In the interview version, thinking quietly reads as being stuck. Narrate. Say "I'm going to spend the next few minutes on how this works today before I propose anything," and then do it.
- **"We".** Say "I decided", "I asked", "I was wrong about". Exponent lists "we" instead of "I" as a rejection pattern in its own right.
- **Finishing early.** If you have five minutes left, spend them on what you would refuse and what you would not promise. That is the part that separates an engineer who has been in a customer room from one who has not.

## The rotation

Twelve drills, one a week, in any order. Six are Indian, six global or mixed. Run each one once solo, and re-run your three worst a month later with a partner; the second attempt on the same brief is where you find out whether the habit stuck or you just remembered the answer. Each drill hides a different trap, and no two traps repeat.
