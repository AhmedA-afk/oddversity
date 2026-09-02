---
title: "The first two weeks on site: a script"
phase: field
module: discovery-and-decomposition
kind: lesson
summary: A day-by-day script for the first ten working days inside a customer, built around the rule that you owe them something running before you owe them a plan. What to ask, what to build, what to send, and what to refuse.
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Run days one to ten from a written plan rather than reacting to whoever books your calendar.
  - Ship something a user can open by day three, on their data.
  - Send a written baseline and a two-week scope note that the sponsor corrects rather than approves.
artifact: A ten-day engagement plan template, filled for one simulated customer, with the day-three demo named.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://conikeec.substack.com/p/the-forward-deployed-engineer-playbook
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
---

Vinoo Ganesh's guide to forward deployed engineering lays out a week-by-week playbook for building customer instinct, and its first move is the one everyone skips: weeks one and two are for listening and for shipping something small, not for planning.

Colin Jarvis, who runs OpenAI's FDE function, describes an FDE spending a full day with a customer team understanding what matters to them before writing anything. Perspective AI's account of Palantir's practice describes a working application by day three as the standard. Those two are not in tension. The day of listening is what makes the day-three application worth showing.

Here is a script for ten working days. It assumes you are on site or in daily calls, that the contract exists, and that nobody has told you what to do.

## Before day one

Three things, none of which require the customer.

**Read their public self.** Annual report or investor deck, the last two quarters. Regulator filings if they have them. The press release announcing the project you are on, if there was one. You are looking for the sentence the CEO used, because that sentence is what your sponsor has to report against.

**Learn twenty words of their vocabulary.** In a co-operative bank: CBS, re-KYC, NPA, CASA, branch ops, HO. In a hospital group: discharge summary, TAT, IP versus OP, MRD. In logistics: POD, exception, dwell. Using their word instead of yours is worth more in week one than any technical demonstration, and using the wrong one marks you as a visitor for a month.

**Write down what you think the answer is, and seal it.** You will be wrong, and comparing at day ten is the fastest way to calibrate how wrong your instincts are on this kind of customer. Keep the note.

## Day 1: Sit behind someone

Not a kickoff meeting. A chair, next to the person who does the work, for two hours.

Ask for a "walk me through the last one" (the question set is on the discovery page) and then be quiet. Take notes on paper; a laptop makes people perform. Note the things they do not mention because they are automatic: the second monitor with the spreadsheet, the WhatsApp message to a colleague, the copy-paste out of the ERP into Notepad to strip formatting.

End day one with a list of every system you saw on screen, and who owns each one. That list is your access request and it is due tonight.

**Send tonight:** a short mail to the sponsor and IT with the access you need, each item with a one-line reason. Read access, named systems, sample exports. Ask for a named person per system. Access requests take longer than the build; start them on day one, every time.

## Day 2: Two more chairs, and the data

Sit with a different person doing the same job, ideally at a different site or shift. You are testing whether the process you saw on day one is the process or one person's version of it. It usually is not the process.

In the afternoon, get whatever data has arrived and look at it with your own eyes before you write any code. Open the CSV. Count the rows. Look at the last twenty. Check the encoding, the date formats, the nulls in the column everyone said was mandatory.

Then attempt the one join that the whole design depends on. If the DMS export and the core banking export do not have a shared key, you need to know on day two, not in week three.

**Send tonight:** three lines to the sponsor. What you saw, one thing that surprised you, one thing you need. Do this every night for two weeks. It costs four minutes and it is the single most effective trust-building habit in the job.

## Day 3: Ship something that opens

Something small, real, and on their data. Candidates, in order of preference:

- The report the sponsor's own manager asks for, which currently takes an analyst 45 minutes each morning, produced by a script in 20 seconds.
- A count that nobody has: how many cases are aged over 90 days, broken down by branch.
- The join from day two, made into a table they can filter.

It does not need to be the product. It needs to be evidence that you turn conversation into working output. Vinoo Ganesh's account of the role includes replacing an analyst's recurring manual Excel routine across three systems with a pipeline; that class of thing is exactly right for day three.

Show it to the person you sat with on day one first, before the sponsor. If they say "that's not how we'd look at it", you have learned something and lost nothing.

## Day 4: The stakeholder map

Now go get the people you have not met. Half an hour each, separately, never together:

- **IT / infrastructure.** What can be deployed here, and how. Ports, egress, VMs, whether anything containerised has ever run in this environment. Ask what the last vendor did that annoyed them.
- **Security or compliance.** What data may leave the perimeter, what the retention rules are, whether they have a questionnaire for you. In India, ask specifically about DPDP Act obligations and any sectoral regulator guidance that applies; in the EU, about the lawful basis and the DPA; in US healthcare, about the BAA.
- **The business owner one level above your sponsor.** Not to go over anyone's head; to hear the sentence they use about this project.

Fill in the stakeholder table from the decomposition method: role, wants, measured on, can veto.

## Day 5: The written baseline

Half a day of writing, and it is the most valuable half day of the fortnight.

Produce the one-page current-state baseline: the step table with times, volumes, owners and failure modes; the metric the sponsor is judged on; the constraint nobody will move; the previous attempt and why it died.

Send it with one sentence: **"Please correct anything I got wrong."** Not "please approve". Approval invites silence; correction invites engagement, and the corrections are free discovery.

End week one with a 30-minute readout. Ten minutes of what you saw, five of the day-three thing running, ten of questions, five of what you will do next week. No slides beyond the baseline page.

## Days 6 to 8: The skeleton

Run the decomposition method properly, on paper, with the sponsor if they will sit for 45 minutes. Then build the walking skeleton: the thinnest slice that touches every layer on real data.

Prioritise, in this order: the component most likely to be impossible, then the component the sponsor's metric depends on, then everything else. In the re-KYC example, that means proving the write-back route before improving the extraction.

Keep the nightly three-line mail going. Include failures. "The CBS write-back is file-drop only and runs once a day, so same-day closure is not achievable through that route; I am asking the vendor whether there is an alternative" is a better mail than a week of good news followed by a surprise.

## Day 9: Instrument and write the scope note

Add usage instrumentation to whatever you have built before anyone touches it. Who opened it, how often, which cases they overrode. You will need this in month three when someone asks whether it is being used, and you cannot add it retroactively.

Then write the two-week scope note: two pages, not a contract. What the problem is, what you will build in the next four weeks, what success looks like as a number, what is explicitly out, and what you need from them by when. This is the input to the statement of work, not a replacement for it.

## Day 10: The readout, and the ask

Thirty to forty-five minutes with the sponsor and, if you can get them, IT and one user.

Structure it as: here is what happens today (the baseline, corrected by them); here is the one thing that is now running; here is what I propose for the next four weeks and the number it moves; here are the three things I need from you and the date I need them.

End with the ask, explicitly, with names and dates. An engagement that stalls in month two almost always stalls on an access request or an approval that was mentioned but never owned.

## What to refuse in the first two weeks

**A roadmap.** You do not have the information. Offer four weeks with a defined outcome and a review, and say why.

**A commitment to the architecture.** "We'll use a vector database" on day four is a promise made before you know whether the corpus is 400 documents or four million.

**A second use case.** It will arrive by day six, from someone who heard you were good. Write it down visibly, thank them, and say it is a candidate for phase two after the first outcome lands. Adding it now is how a four-week engagement becomes a six-month one with nothing shipped.

**Direct database write access on day one, even if offered.** Take read access. Ask for the write path to be designed with their team. You do not want to be the person who wrote to production in week one of a system you do not understand.

## The ten-day plan template

```text
Customer:                        Sponsor:
Sealed prediction (day 0):

D1  sit with ______ (2h)         | send: access list
D2  sit with ______ | data eyes  | send: 3 lines
D3  SHIP: ______________________ | show to user first
D4  IT ___ | security ___ | +1 ___
D5  baseline page sent "correct me" | week-1 readout
D6-8 decomposition + skeleton    | riskiest component first
D9  instrument + 2-page scope note
D10 readout + the ask (who, what, by when)

Refused this fortnight:
Open access requests (owner, date asked, date needed):
```

Fill it for one of the simulated customers in the practice phase before you run that bootcamp. Compare your sealed day-0 prediction against the day-10 baseline. The distance between them is the thing this fortnight exists to close.
