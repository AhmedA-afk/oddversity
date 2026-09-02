---
title: 'Discovery: "how do you do it today?"'
phase: field
module: discovery-and-decomposition
kind: lesson
summary: The documented process and the real process are different, and the gap between them is where your project lives. This is how to run a discovery conversation that finds the real one, with the questions to ask and the ones that waste the hour.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Run a 45-minute discovery conversation from a written question set instead of improvising.
  - Produce a "how it works today" baseline with a per-step time, volume and owner.
  - Spot the three signals that mean the stated problem is not the real problem.
artifact: A one-page current-state baseline for one workflow, with a timed step list and named owners, in your journal.
sources:
  - https://www.tryexponent.com/experiences/eleven-labs-solutions-architect-interview-ce0689
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://conikeec.substack.com/p/the-forward-deployed-engineer-playbook
---

An FDE candidate wrote up an ElevenLabs interview in which the case round opened like this: "Imagine I'm the CTO of an airline. When planes break or schedules change, our operators reschedule everything manually." The lesson he took away, in his own words, was "Don't jump straight to some shiny AI answer. Ask how the customer solves it today."

That is the whole of discovery in one instruction, and it is harder to follow than it reads. The customer has usually already told you what to build. They have a slide. Someone has written "AI-powered rescheduling assistant" on it. Asking how they do it today feels like stalling.

It is not stalling. It is the only way to find out three things you cannot get from the slide: what the work actually costs them, which step is the expensive one, and who will be affected if you change it.

## The documented process is not the process

Every enterprise has a process document. It was written when the system was procured, it describes what the vendor's diagram said would happen, and the people doing the work have since built a layer of spreadsheets, WhatsApp groups, saved email filters and one heroic macro on top of it.

Perspective AI's account of Palantir's field practice puts a number on how much of an FDE's week goes into this: it estimates FDEs spend 30 to 40 percent of their week on conversational customer discovery. Treat the figure as one vendor's analysis rather than a measurement, but the ordering matches every practitioner account: the discovery is not a phase before the work, it is a large fraction of the work.

Ramp's forward deployed team lists "always be scoping" as a principle and glosses it as "question all requirements". Chetan Conikee's FDE playbook names an "Insertion" phase before anything is built, whose entire job is to learn how the organisation really runs.

Here is the shape of the gap, from a case you will meet again in the bootcamps. A co-operative bank says its KYC re-verification backlog is a document-classification problem: too many scanned files, not enough people to read them. Ask how it works today and you find the classification takes four minutes per case. Then the officer opens the core banking screen, retypes six fields, waits for a batch job that runs at 18:00, and comes back tomorrow to find out whether it failed. The classification is four minutes. The retyping and the overnight round trip are two days. If you build a classifier you will have automated the four minutes.

That is not a hypothetical failure mode. It is the ordinary one.

## The question set

Print this. Do not improvise the first five conversations; you will drift into design.

**Open with the walk-through, not the problem.**

1. "Take me through the last one of these you did. Not the general case, the last one. What time did it start?"
2. "What did you have open on your screen when you started?"
3. "Where did that number come from? Who gave it to you?"
4. "What happened between that step and the next one? Did you wait?"
5. "What do you do when it goes wrong? Walk me through the last time it went wrong."

**Then quantify.**

6. "How many of these happen in a day? In a month-end week?"
7. "How long does the whole thing take, door to door? How long is it in someone's hands?"
8. "How many people do this? Are they all doing it the same way?"
9. "What is the cost of getting one wrong? Who finds out?"
10. "How long does it take a new joiner to become useful at this?"

**Then the workarounds, which is where the real system lives.**

11. "Is there a spreadsheet? Can I see it?"
12. "Is there a step you do outside the system because the system does not support it?"
13. "What do you do when the system is down?"
14. "What would you do if I gave you two more people?"
15. "What would you do if I took one away?"

**Then the boundaries.**

16. "Who else touches this? Before you, after you?"
17. "Who has to approve a change to this?"
18. "Has anyone tried to fix this before? What happened?"
19. "If this worked perfectly for six months, what would be different for you?"
20. "What would make you not use it?"

Question 18 is the highest-yield question in the list and almost nobody asks it. There is nearly always a previous attempt. Finding out why it died tells you which constraint is real.

Question 20 is the second. People will tell you the truth about what would make them abandon a tool, and they will not volunteer it.

## Three signals that the stated problem is not the real problem

**The time does not add up.** They describe a process that should take twenty minutes and report a two-day turnaround. The eighteen hours of waiting are the project. Ask what it is waiting for.

**Only one person can do it.** If the answer to "how many people do this" is "well, really only Priya does the complicated ones", you have found a knowledge bottleneck, not a throughput bottleneck. Automating the easy cases will not help; Priya was never doing those.

**The metric they quote is not one they own.** A head of operations who quotes a customer-satisfaction number is describing something several steps downstream of their own work. Ask which number their own manager asks about. That is the one your project will be judged on.

## Getting past the demo request

The demo request will come in the first ten minutes and it will sound reasonable: "can you show us how it would work with our data?" Saying no makes you look slow. Saying yes ends discovery.

Say both:

> "Yes, and I want to build it against a real case rather than a made-up one, so let me first watch you do three of them. Give me an hour today and I will have something on your data by the end of the week."

You have now bought discovery time by promising a demo, which is a trade you should be happy to make. Perspective AI's account of Palantir's practice describes a working application by day three as the norm. That is achievable precisely because the first day is spent watching, not guessing.

## What to write down, and in what shape

Discovery that stays in your head is not discovery. The artifact is a one-page current-state baseline, and it looks like this:

| Step | Who | System | Time | Volume/day | Failure mode |
|---|---|---|---|---|---|
| Receive re-KYC list | Branch ops | Email from HO | 5 min | 1 batch | List arrives late on month-end |
| Pull customer file | Officer | DMS + physical | 12 min | 60 | Scan missing for pre-2019 accounts |
| Classify document | Officer | Manual | 4 min | 60 | Ambiguous address proofs |
| Key into CBS | Officer | Core banking | 9 min | 60 | Six fields retyped, transposition errors |
| Nightly validation | Batch | CBS | 18 h wait | — | Silent failure, no per-record reason |
| Rework | Officer | CBS | 15 min | ~9 | Officer discovers failure next morning |

Two things follow immediately from that table and neither of them is a classifier. The nightly batch and the retyping are 80 percent of the elapsed time. Both are cheaper to attack.

Add three lines under the table:

- **The number the sponsor is judged on.** Name it, and its current value.
- **The constraint nobody will move.** The regulator's retention rule, the core banking vendor's change window, the union agreement.
- **The previous attempt and why it died.**

Send this back to the customer within 24 hours with the sentence "please correct anything I got wrong". You will get corrections, and the corrections are more discovery. You have also just established that you write things down, which is most of what a customer means by trust in week one.

## What this looks like in an interview

The decomposition round is scored partly on whether you do this. Exponent's guide to FDE interviews lists jumping to a solution in the decomposition round among the top rejection patterns. The behaviour that scores is spending the first five to fifteen minutes on questions like the ones above, out loud, and saying why you are asking them.

You are not asking questions to seem thorough. You are asking because the interviewer has, like the real customer, described the four-minute step and not the eighteen-hour one.

Run the question set against one workflow you already know well: something at your current job, in a college society, in a family business. Write the table. You will find at least one step whose duration you had never measured.
