---
title: Saying no with an alternative
phase: field
module: stakeholders-and-saying-no
kind: lesson
summary: A bare no reads as unwillingness. A no with a costed alternative reads as judgement, and it is the version customers actually accept. This page gives the structure of that sentence and three worked examples.
duration: 10 min
updated: "2026-09-02"
outcomes:
  - Turn a three-month custom-feature request into a configuration change the customer prefers, in one conversation.
  - State a no in a form that includes the cost of saying yes, not just a refusal.
  - Recognise the two situations where the right answer really is a bare no.
artifact: Three "no, and here is what instead" scripts, written for real requests you have received or expect to receive, each naming the cost of the original ask.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
---

Managing meeting time and saying no are described, in accounts of how the role works day to day, as essential rather than optional skills — not a soft add-on to the engineering work but load-bearing parts of it. The reason is structural: a customer with an FDE in the room will generate more requests than a five-day bootcamp or a fixed SOW can absorb, because the whole point of having you there is that things which were previously "too hard to ask for" are now possible. Every one of those requests needs an answer, and "yes" to all of them is how a five-day engagement becomes a six-month one nobody scoped.

Vinoo Ganesh's account of the traits that separate effective FDEs names pushback explicitly as one of them — not stubbornness, but the ability to say no in a form the customer actually accepts.

## The shape of a no that works

A bare no is a wall. The customer hears "the vendor won't", concludes you are inflexible or under-resourced, and either escalates around you or quietly downgrades their trust. The version that works has three parts, always in this order:

1. **Name what they actually need**, not what they asked for. These are usually different — the request is a feature, the need underneath it is an outcome.
2. **State the real cost of the request as asked**, specifically, in time or risk, not as a vague "that would take a while".
3. **Offer something that meets the underlying need at a fraction of the cost**, and say so plainly.

```text
"You've asked for [the request]. What I think you actually need is
[the underlying need], because [evidence for that read]. Building
[the request] as specified would take [specific cost] because
[specific reason]. Here's what gets you the same outcome by
[date]: [the alternative]."
```

## Worked example: the configurable engine that becomes a spreadsheet column

**The ask:** "Can you build us a rules engine so branch managers can define their own confidence thresholds per document type?"

**What it actually needs:** three branch managers who currently disagree about one threshold, and want the flexibility to disagree without escalating to IT every time.

**The no:**

> "A configurable rules engine is a two-to-three-week build, plus an admin UI, plus testing every combination of threshold and document type — and once it exists, someone owns it forever. What I think you need is fewer thresholds to argue about. Let me set the threshold per document type, in a spreadsheet you can edit, reviewed monthly. If that spreadsheet approach breaks down after a quarter, we'll know exactly what a real engine needs to handle, instead of guessing now."

The spreadsheet ships in a day. The rules engine, if it is ever built, gets built against three months of evidence about what the thresholds actually need to do — the exact discipline behind the reusable-vs-one-off judgement covered in the product phase.

## Worked example: the three-month custom integration

**The ask:** "Can this also write directly into our CRM, not just the file drop?"

**What it actually needs:** the sales team wants to see re-KYC status without opening a second system.

**The no:**

> "A direct CRM write is a real integration — a service account, error handling for when the CRM is down, a schema that survives the CRM's next upgrade. That's a project on its own, and it's not in this SOW. What actually gets sales what they want fastest: the daily aged-case report I'm already building for compliance, with a CRM-friendly export, so they can see status without us touching the CRM at all. If that's not enough after a month of use, we'll have a specific list of what a real integration needs to do, not a guess."

## Worked example: the dashboard nobody asked to be measured by

**The ask:** "Can you also build us an executive dashboard showing all of this in real time?"

**What it actually needs:** the sponsor wants something to show their boss before the pilot's four-month adoption window closes.

**The no:**

> "A real-time dashboard is a maintained product — someone owns the queries, the refresh, what happens when a metric looks wrong at 8am before a board meeting. That's more commitment than a five-day engagement should create. What I can hand you this week: the same numbers, exported weekly to a page you control, that you can screenshot into whatever you're presenting. If the board wants this live and permanent, that's a real conversation for phase two, with someone lined up to own it after I'm not here weekly."

## The two situations where a bare no is the right answer

Not every no needs an alternative. Two cases where offering one is a mistake:

- **A request that would violate a constraint you do not control** — a data-residency rule, a regulatory requirement, a security policy from [IT, security, and the business owner: three conversations](/roles/forward-deployed-engineer/field/it-security-and-the-business-owner-three-conversations). Here the honest answer is "I can't, and here's who can tell you why", not a workaround that quietly reintroduces the same risk.
- **A request that is actually reasonable and simply out of the current SOW's scope.** Here the right move is not a substitute, it is the change-control process from [Writing a statement of work](/roles/forward-deployed-engineer/field/writing-a-statement-of-work): log it, estimate it, get sign-off. Inventing a workaround for something that should just be scoped properly trains the customer to route around your process.

## Why the alternative has to be real

An alternative offered to soften a refusal, without any intention of delivering it, is discovered within a week and costs more trust than the bare no would have. The spreadsheet, the export, the weekly screenshot: each of those is something you actually build, this week, not a placeholder to end the conversation. The whole value of this move is that the customer gets something real for what they gave up. Take that away and it is just a more polished refusal.
