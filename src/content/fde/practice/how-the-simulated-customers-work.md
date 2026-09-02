---
title: How the simulated customers work
phase: practice
module: simulated-customers
kind: reference
summary: Six fictional companies, each with a stakeholder cast whose incentives conflict, a data pack you generate yourself with a Python script, and a one-to-five-day bootcamp that ends in a demo and a written decision. This page explains the format, how to run it alone or with a partner, and what each one leaves in your portfolio.
duration: 10 min
updated: "2026-09-02"
outcomes:
  - Run a bootcamp brief end to end without an instructor, playing each stakeholder from their written brief.
  - Generate a reproducible messy data pack offline from a seeded Python script.
  - Say what a bootcamp must produce to count as done, and grade your own against the shared rubric.
artifact: A `bootcamps/` folder in your portfolio repo with one subfolder per customer, each containing the generated pack, your code, the demo recording, and the decision memo.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
  - https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying
  - https://www.lennysnewsletter.com/p/inside-palantir-nabeel-qureshi
---

Every other part of this path can be practised alone. This part cannot, because the thing you are practising is what happens between you and people who want different outcomes from the same project. There is no customer to lend you, so this module supplies six.

They are fictional. Meridian Co-operative Bank, Arogya Hospital Group, SuryaTex Manufacturing, Northlake Wealth, Halden Logistics and the Bhairavgarh district administration do not exist, and no person named in any brief is real. The situations are composites of patterns that appear in public FDE accounts and in ordinary enterprise IT. Treat them as flight simulators: the aircraft is not real, the stall is.

## Why the format is a bootcamp

Palantir's AIP bootcamps are the clearest public example of a compressed customer engagement: a one-to-five-day sprint with a fixed shape. Day 0 is preparation. Day 1 connects the data and builds the ontology. Days 2 and 3 build the workflow and the app. Days 4 and 5 are the demo and the decision. Palantir reported running over a thousand of them by the end of 2024.

The shape is worth copying even if you never touch Foundry, for one reason: it forces the ontology before the app and the demo before the opinion. Most engineers, given messy customer data, start writing transformations. The bootcamp structure makes you name the entities first and put something in front of a user by the middle of the week.

Nabeel Qureshi, who spent eight years as a Palantir FDE, has said that around 95 percent of enterprise data problems are about access, cleaning and joining rather than analysis. Every pack in this module is built to make that true for you specifically.

## The six customers

| Bootcamp | Customer | Domain | Days | The constraint that shapes everything |
|---|---|---|---|---|
| 01 | Meridian Co-operative Bank | Re-KYC backlog, India | 5 | On-prem, RBI inspection date, core banking vendor support clause |
| 02 | Arogya Hospital Group | Bed flow and discharge, India | 5 | Patient data never leaves the network, nightly vendor extract only |
| 03 | SuryaTex Manufacturing | Quality and shipment risk, India | 3 | An EU buyer's traceability audit, no reliable network at two units |
| 04 | Northlake Wealth | Advisor research access, US | 5 | Supervision and citation, entitlements, a security review |
| 05 | Halden Logistics | Freight exceptions, EU | 4 | GDPR, a DPIA, and a works council that will block driver scoring |
| 06 | Bhairavgarh district administration | Citizen grievances, India | 3 | Air-gapped state data centre, RTI exposure, no cloud model |

Run them in that order if you are following the schedule. Bootcamp 01 assumes only the foundations phases. Bootcamps 04 and 05 assume you have done the deployment phase. Bootcamp 06 assumes you can build something useful with no internet egress at all.

## What every brief contains

The seven parts are the same every time, so you learn the shape rather than the story.

1. **The company and the situation.** Two or three paragraphs. What they sell, how big they are, what broke, and the date that is forcing the conversation. There is always a date.
2. **The cast.** Four to six named stakeholders. Each has a role, what they want, what they are afraid of, and one line they actually say. The wants conflict. That is the point: the COO wants a number to move, compliance wants an audit trail, IT wants nothing touching production, and the person doing the work wants fewer phone calls.
3. **What you are handed, and how it lies.** The systems, the exports, and the specific defects: encodings that break a naive read, duplicate identifiers, timestamps from two clocks, a column that means two different things depending on who filled it in, scanned documents, a schema that made sense in 2009.
4. **The constraints.** Residency, on-prem, single sign-on, a security review, a regulation, a language. These are not decoration. In several briefs the obvious architecture is illegal.
5. **The day-by-day plan.** What to do on each day and what has to exist by the end of it.
6. **The demo and the decision memo.** Who you demo to, in what order, and the memo template you fill in afterwards.
7. **The rubric.** How to grade the result, including the ways a technically correct build still fails.

## The data pack

Each bootcamp carries a Python script that writes the customer's data pack to disk. The scripts use only the standard library, take a fixed seed, and produce the same files every time. Copy the block into a file, run it with `python`, and you have a few hundred rows of exports with the defects injected deliberately.

This matters for three reasons. You can work offline, on a plane or in a room with no internet, which is the actual working condition of the job. Nobody has to host a dataset for you. And because the flaws are injected on purpose, you can check your own work: when you think you have found all the duplicate identifiers, read the generator and see whether you did.

Two rules about the packs.

**Do not read the generator before Day 1.** Run it, look at the files the way you would look at a customer's export, and find the problems the way you would have to find them in the field. Read the source afterwards as your answer key.

**Never substitute real data.** Do not point these exercises at an employer's export, a public dataset containing personal information, or anything you signed an agreement about. The whole reason the customers are fictional is so that the artifact is publishable.

Scanned documents are represented as the text an OCR pass would produce, with characteristic OCR damage, rather than as image PDFs. You still have to deal with the damage; you skip installing an OCR stack.

## Running it solo

This is the default and it works better than it sounds.

Before Day 1, read the cast once and write each stakeholder's brief onto its own index card or note: role, want, fear, quoted line. During the bootcamp, when you need an answer that only the customer has, pick up the card and answer **in character**, out loud, and write the answer into your discovery log with a timestamp. If two cards would answer differently, write both answers down and note that you have a conflict. Do not resolve it silently in your head. Half the value of the exercise is noticing that you were about to.

Three disciplines make solo runs honest:

- **Timebox hard.** A day is a day. If Day 1 ends without an ontology, Day 2 starts anyway, with the gap recorded. Sliding the schedule turns a bootcamp into a side project.
- **Write before you build.** Every day starts with three sentences on what you will have by the end of it, and ends with three sentences on what you actually have. Keep the file. It is the raw material for the memo and it is the part interviewers ask about.
- **Demo out loud to a camera.** Record it. A demo you narrate to yourself in your head always goes well.

## Running it with a partner

Better if you can arrange it. Two people, alternating.

One person is the FDE for the whole bootcamp. The other holds the entire cast and answers as whichever stakeholder was asked, staying in character including the evasions. The customer player should read the brief in full; the FDE should read only the company and situation section and the list of systems, and discover the rest by asking. The customer player is allowed, and encouraged, to volunteer a constraint late, on Day 3, the way real ones do.

Then swap for the next bootcamp. Playing the compliance officer who has to sign for a machine's decision teaches you more about compliance officers than reading about them.

A group of three or four can run it as a workshop: one FDE, two or three stakeholders, and a scribe who keeps the discovery log. The scribe role is underrated. It is also, in a real engagement, frequently yours.

## What a bootcamp leaves behind

Each one produces the same five artifacts, and they are the reason the module exists at all.

| Artifact | What it is | Why it counts |
|---|---|---|
| Discovery log | Dated notes of every question, answer and conflict | Shows you asked before you built |
| Ontology sketch | The entities, their keys, their links, and the joins that do not work | The most transferable thing in the folder |
| Working demo | A recorded walkthrough, five to eight minutes, of a thing a named user could use | The closest analogue to an FDE take-home |
| Decision memo | One page: what to build, what not to, what it costs, what could kill it | The document that separates an engineer from a contractor |
| Generalise-vs-one-off note | Which parts were this customer, which parts would be the next three | The feedback loop, written down |

Put them in a public repository, one folder per customer, with the generator script committed alongside so anyone can reproduce the pack. Say clearly in the README that the customers are fictional and the data is synthetic. An interviewer who opens that folder can see you doing the job.

## Grading

Every bootcamp carries its own rubric, but four failures repeat across all six and are worth knowing in advance.

**Solving before scoping.** You built the thing the loudest stakeholder asked for on Day 1 and never found out that the bottleneck was somewhere else. This is the most common rejection pattern in real FDE interviews too.

**Ignoring a constraint until it is fatal.** The architecture works and cannot be deployed, because the data cannot leave the country, or the vendor contract forbids the query, or the works council has not been consulted.

**A demo to the wrong audience.** You showed the executive sponsor a dashboard and never put it in front of the person whose day it changes. Adoption dies there.

**No decision.** You produced a prototype and a list of options. The memo has to recommend one thing, name what you are declining to build, and state what would have to be true for you to be wrong.
