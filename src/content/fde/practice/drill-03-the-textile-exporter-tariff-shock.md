---
title: "Drill 03: the textile exporter and the tariff shock"
phase: practice
module: decomposition-drills
kind: drill
summary: A knitwear exporter has six weeks before a buyer negotiation and wants a system that reprices every order against a new tariff schedule. Forty-five minutes to work out what you can honestly promise by a date you did not choose.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Answer "how long will it take?" without either guessing or refusing.
  - Identify the dependencies that make an estimate unknowable, and price them as a first task.
  - Design a manual fallback that meets the business deadline even if the build slips.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Kaveri Weaves Exports is a Tiruppur knitwear manufacturer, about 1,900 employees, roughly 60 percent of revenue from the United States and most of the rest from the EU. A new import duty schedule has been announced that changes the rate depending on fabric composition and country of origin of the yarn. The Managing Director calls you in:

> "Every one of our US buyers wants to renegotiate. I meet the biggest three in six weeks. I need a system that takes every open order, works out the new duty, tells me which ones are now loss-making, and suggests where to reroute production. Six weeks. Our IT partner says it's just a calculation."

You are given access to the ERP, a mid-market system the company runs on a hosted instance managed by a local implementation partner, and a shared drive with buyer contracts.

## The room

**Vasanth Kumar Nadar, Managing Director.** Second-generation owner. Decides everything.

> "I am not interested in a pilot. In six weeks I am sitting across from a buyer who does 40 percent of my volume and he will ask me for a number. I need the number to be right, because if I am wrong by two percent on that account I have given away my year."

**Priya Ramanathan, CFO.**

> "We have never actually costed duty per order. Duty is a line item the clearing agent bills us for, after the shipment. I can tell you what we paid last year in total. I cannot tell you what we paid on style 4471 to Ohio."

**Sundar Rajan, GM Merchandising.** Twenty-two years in the business, owns the buyer relationships.

> "Sir is asking for a machine. I can tell you today which buyers will absorb the duty and which will walk. It is in this book." (He holds up a physical diary.) "But if you put it in a system, every merchant in Tiruppur will know my pricing in a month."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

Three dependencies sit between the brief and any working system, and none of them is under the company's control.

**Classification.** The duty rate depends on the tariff classification of the finished garment and on the origin of the yarn. Classification is done today by an external clearing agent, a customs house agent who is not an employee, from a shipment file, per shipment, using judgement built up over years. The ERP holds a product code that maps to classification inconsistently, because two different merchandisers set up the item masters over an eight-year period and used different conventions. There is no clean mapping table. There is a person.

**Contracts.** The question "who bears the duty" is answered by the Incoterms and a duty clause in each buyer contract. The contracts are PDFs on the shared drive, some scanned, in at least four different templates because they are the buyers' paper, not Kaveri's. Roughly a fifth of them have been amended by an email agreement that lives in Sundar's inbox and nowhere else.

**Yarn origin.** The origin of the yarn in a given production lot is recorded in the ERP only when the yarn was imported directly. Domestically purchased yarn, which is most of it, carries no origin field, and the actual origin sits on the supplier's invoice.

The six weeks is a real, immovable business date. It is also not a software date. Nobody has told the MD that the number he wants requires a classification decision on about 300 active styles, a duty-bearing determination on around 40 contracts, and an origin determination the company does not currently record.

The thing he actually needs in six weeks is not a system. It is a defensible duty exposure figure for the three buyers he is meeting.

## What a strong decomposition covers

- **Separating the business deadline from the software deadline.** The buyer meeting is fixed. The system is not what the meeting needs.
- **The narrowing.** Three buyers, not all of them. Their open orders, their styles, their contracts. That is perhaps 40 styles and three contracts, which is a week of careful manual work with the clearing agent sitting next to you, and it produces a number the MD can defend line by line.
- **An honest answer to "how long".** Not a date for the whole thing. A date for a **discovery spike**: five working days to establish whether style-to-classification can be derived from existing data at all, and how many contracts are machine-readable. Then a real estimate. Say explicitly that any number you give today would be invented.
- **Naming the human dependency.** The clearing agent is on the critical path and is not an employee. Get him engaged, paid and scheduled in week one, or the project stops.
- **Data reality.** Item masters with two conventions. Missing yarn origin. Contract PDFs in buyer templates. Amendments in an inbox. State that the first deliverable is a coverage report: for how many open orders can we determine all three inputs today, and where does it break.
- **The decomposition.** Style-to-classification mapping. Yarn origin capture. Contract duty-bearing extraction. Duty calculation. Margin recomputation. Only then, much later, any reroute suggestion.
- **The walking skeleton.** A spreadsheet-shaped tool for the top three buyers, populated half automatically and half by hand, with every number traceable to its source document. It meets the meeting.
- **Sundar.** His diary is a real asset and his fear is a real objection. Access controls and the question of who can see pricing are part of the design, not an afterthought.

## A model 45 minutes

- **0 to 8.** How is duty calculated and paid today, on one actual shipment last month? Who decides the classification? Where does the number come from?
- **8 to 15.** The MD's meeting, the CFO's missing cost line, Sundar's ownership of buyer knowledge and his exposure. What decision gets made in six weeks, by whom.
- **15 to 23.** The three inputs, and for each one, does it exist in a system, in a document, or in a person.
- **23 to 33.** Components, with the coverage report first.
- **33 to 40.** Three buyers, forty styles, half by hand, every cell traceable.
- **40 to 45.** The honest estimate conversation, the clearing agent as a scheduling risk, and the fallback if the extraction does not work at all.

## The trap in this one

**Promising a timeline.** The room is built to extract a date from you. A powerful owner, a fixed meeting, an IT partner who has already said it is just a calculation, and a question asked in a tone that makes "I don't know yet" feel like weakness.

Give the date and one of two things happens. You miss it, and the relationship is finished in week seven regardless of what you built. Or you hit it by building a calculator on top of a classification mapping you guessed at, the MD quotes a wrong number to his largest buyer, and you have caused a commercial loss that dwarfs your fee.

The FDE answer is neither a date nor a refusal. It is a smaller commitment you can actually keep, plus a named unknown with a price attached:

> "I can't give you a date for the system today, because the duty number depends on three inputs and I don't yet know whether two of them exist in your data at all. What I will commit to is this: in five working days I will tell you exactly how many of your open orders we can compute today and where it breaks. And separately, for your three buyers in six weeks, I will get you a defensible number even if we have to do half of it by hand with your clearing agent. Then we talk about the system."

Note what that does. It gives him something on his date. It converts an unanswerable question into a scoped five-day task. And it never says no.

## The rubric, applied

A weak attempt says "six weeks is tight but doable if we get the data by Friday", designs a duty engine, and never discovers the clearing agent. That is 1/2/1/1/0.

A pass distinguishes the meeting from the system, commits only to a spike, names the external human dependency, delivers a manual path to the six-week date, and refuses to state a number the data cannot support. That is 3/2/3/3/3.

The tell for criterion 5 is whether the words "I don't know yet, and here is what it costs to find out" appear anywhere in your forty-five minutes. If they never do, you promised something.
