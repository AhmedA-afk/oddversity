---
title: "Lab: interview the simulated customer"
phase: field
module: discovery-and-decomposition
kind: lab
summary: A three-hour lab in which you run three recorded discovery interviews against the simulated customers from the practice phase, playing each stakeholder from a written brief, and produce a corrected current-state baseline. This is where the question set stops being a list and becomes a habit.
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Run a 30-minute discovery interview without proposing a solution.
  - Extract a timed, owned, quantified current-state baseline from a hostile or vague interviewee.
  - Detect the gap between the stated problem and the expensive step, and say so out loud.
artifact: Three recorded interviews (audio or transcript), one corrected baseline page per customer, and a self-scored rubric sheet.
sources:
  - https://www.tryexponent.com/experiences/eleven-labs-solutions-architect-interview-ce0689
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
  - https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Discovery is a physical skill. You can know the twenty questions and still, twelve minutes into a real conversation, hear yourself say "so what you probably want is a dashboard". The only fix is repetition against someone who is not cooperating.

This lab gives you that. The three interviews below use the simulated customers described in [How the simulated customers work](/roles/forward-deployed-engineer/practice/how-the-simulated-customers-work) and run against the bootcamp briefs. You need a partner, or a model instructed to hold a role and not be helpful.

## What you need

- A recorder. Audio is fine; a transcript is better because you will count things in it.
- Either a human partner who will read a role brief and stay in character, or a language model given the same brief with the instruction to answer only what is asked, to volunteer nothing, and to become vague when asked anything numeric it has not been given.
- The twenty-question set from [Discovery: how do you do it today](/roles/forward-deployed-engineer/field/discovery-how-do-you-do-it-today), printed.
- The baseline table template.

Budget: three hours. Three interviews of 30 minutes, 20 minutes of write-up each, 30 minutes of scoring at the end.

## Rule zero

**You may not propose anything.** Not a system, not a tool, not an approach, not "have you considered". If the interviewee asks what you would build, the only permitted answer is a version of "I do not know yet, and I would rather show you something in a week than guess now. Can I ask two more things about how it works today?"

Every proposal you make costs you a point in the rubric. Count them in the transcript afterwards; that number is the whole point of the lab.

## Interview 1: Meridian Co-operative Bank, the branch officer (30 min)

Interviewee role: **Sunita, senior branch officer, 11 years at the bank.** She has been asked to spend half an hour with "the vendor". She has done this before with a previous vendor and it went nowhere. She is polite, busy, and answers exactly what she is asked.

Brief for the person playing her (do not read this yourself before the interview; have your partner read it, or paste it to the model as a system instruction):

```text
You are Sunita, senior branch officer at Meridian Co-operative Bank.
Answer only what is asked. Do not volunteer. Do not offer solutions.
Facts you know, released only when asked directly:
- You process re-KYC cases. About 60 a day, up to 110 in the last week of a month.
- Classifying a document takes about 4 minutes.
- After that you retype six fields into the core banking screen. About 9 minutes.
- A validation batch runs at 18:00. You find out about failures the next morning.
- About 9 cases a day fail and come back. Fixing one takes 15 minutes.
- Pre-2019 accounts often have no scan at all. You call the customer. This is the worst part.
- You keep a personal spreadsheet of pending cases because the system's queue is wrong.
- Audit asks about cases aged over 90 days. There are "a few hundred". You do not know exactly.
- Two years ago a vendor built something. It needed a login nobody could get. It died.
- If asked what would make you not use a new tool: "if I still have to key into CBS after."
If asked anything not on this list, say you do not know and suggest who might.
If the interviewer proposes a solution, say "okay" and stop elaborating for two turns.
```

Run it. Do not look at the brief while interviewing.

## Interview 2: Arogya Hospital Group, the sponsor (30 min)

Interviewee role: **Dr. Rakesh Menon, Group COO.** He has fifteen minutes of real attention and a strong prior about what the problem is. He will describe bed flow as a prediction problem. It is not; it is a discharge-summary and pharmacy-clearance problem, and he does not know that because he has never watched a discharge.

```text
You are Dr. Rakesh Menon, Group COO, Arogya Hospital Group (4 hospitals).
You open by saying: "We need AI to predict bed availability. We're turning away
admissions at 11am and have empty beds by 4pm."
You are confident and slightly impatient. You speak in outcomes, not steps.
Facts, released only when asked:
- Average discharge takes 6 hours from doctor's decision to bed free.
- The steps: doctor decides -> discharge summary typed by a junior -> pharmacy
  clearance -> billing clearance -> housekeeping turnaround.
- You do not know the time of each step. If asked, say "you'd have to ask the ward".
- You are measured on occupancy percentage and on ALOS (average length of stay).
- The board asks about turnaround time to the media after a complaint last year.
- The HIS vendor charges for every integration and the contract renews in March.
- Nurses already use a WhatsApp group to tell housekeeping a bed is free.
If asked "has anyone tried to fix this": a consultant did a study, produced a
report, nothing changed. You have the report somewhere.
If the interviewer proposes prediction, agree enthusiastically. That is the trap.
```

The scoring question for this interview: did you get from "predict bed availability" to "nobody knows how long the discharge summary takes" inside 30 minutes, and did you say so?

## Interview 3: Halden Logistics, the blocker (30 min)

Interviewee role: **Katrin Sørensen, Data Protection Officer.** She is not your sponsor and she did not ask for this project. She can stop it. She is not obstructive, she is precise, and she has been burned by a vendor who said "the data never leaves your systems" and was wrong.

```text
You are Katrin Sørensen, DPO at Halden Logistics (EU, road freight).
You did not request this project. You are polite, precise, and unhurried.
Positions you hold:
- Driver location and hours data is personal data. Any processing needs a
  documented lawful basis and a record in the processing register.
- You need a DPA and a list of sub-processors before anything is connected.
- You will ask where the model runs and whether the data leaves the EU.
- You will ask what happens to the data after the pilot ends.
- You will ask whether a driver can be individually identified in the output,
  and whether the output could be used in a disciplinary process.
- If the vendor says "we anonymise it", ask exactly how, and whether route plus
  timestamp could re-identify one driver on a rural route. (It can.)
- A previous vendor told you data stayed in-region and it did not. You checked.
If the interviewer is vague, you say you cannot sign off and ask for it in writing.
If the interviewer is specific and admits uncertainty, you become helpful and
tell them about the works council, which they did not know they needed.
```

The scoring question: did you find out about the works council? You only get told if you are honest about what you do not yet know.

## Steps

1. **Set up.** Load the brief into your partner or model. Start the recorder. Set a 30-minute timer.
2. **Interview 1.** Open with the walk-through question, not the problem question. Take notes on paper.
3. **Write up (20 min).** Fill the baseline table: step, who, system, time, volume, failure mode. Add the three lines: the metric the sponsor is judged on, the constraint nobody will move, the previous attempt and why it died. Mark every cell you could not fill.
4. **Interviews 2 and 3**, same loop.
5. **Send the corrections.** For each customer, write the "please correct anything I got wrong" mail. Have your partner reply in character with two corrections. Real customers always correct at least two things.
6. **Score yourself** against the rubric below, from the transcript, not from memory.

## Definition of done

- Three transcripts exist.
- Three baseline pages exist, each with at least eight populated rows and every blank cell explicitly marked as unknown rather than left empty.
- For each customer you can state, in one sentence, the difference between the problem as stated and the expensive step.
- You have counted your solution-proposals in each transcript.

## Rubric

Score each interview out of 10.

| Signal | Points |
|---|---|
| Opened with a concrete walk-through ("the last one you did"), not an abstract question | 1 |
| Asked for a number and got one, at least four times | 2 |
| Asked question 18 ("has anyone tried this before, what happened") | 1 |
| Asked question 20 ("what would make you not use it") | 1 |
| Found the workaround (spreadsheet, WhatsApp group, side process) | 1 |
| Named the metric the interviewee is personally judged on | 1 |
| Identified a step where time is spent waiting, not working | 1 |
| Said out loud that the stated problem may not be the expensive one | 1 |
| Zero unprompted solution proposals | 1 |
| Deduct 1 per solution proposal after the first | — |

Seven and above is a working interview. Below five, run the same brief again next week; you will be surprised how much you now ask on the first pass.

## How this could go wrong

**Your partner is too helpful.** The most common failure. A cooperative interviewee hands you the baseline and you learn nothing. If your partner is volunteering, stop and re-read them rule zero of the brief: answer only what is asked.

**You interview the brief, not the person.** If you have read Sunita's brief yourself, you will ask questions shaped to its answers. Have someone else load it, or use a model and do not read the system prompt.

**You confuse rapport with discovery.** Twenty warm minutes that produce no numbers is a failed interview. Warmth is a means. The baseline table is the output.

**You treat Katrin as an obstacle.** The DPO interview is the one people run badly, because they arrive wanting a yes. She is a source. She knows which data actually exists, who owns it, and what the last vendor did wrong. Interview her the same way you interviewed Sunita.

**You skip the write-up.** The value is in filling the table and seeing the blanks. An interview you did not write up did not happen.

Run this lab again before each simulated bootcamp, using that bootcamp's stakeholder cast. It takes an hour the second time and it is the cheapest preparation available for the decomposition round of any FDE loop.
