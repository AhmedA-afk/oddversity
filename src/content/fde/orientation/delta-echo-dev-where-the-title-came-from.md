---
title: "Delta, Echo, Dev: where the title came from"
phase: orientation
module: what-it-is
kind: lesson
summary: Palantir invented the role, named it after the NATO alphabet, and split it into an engineer and a non-engineer. Knowing which of those two a company is actually hiring for tells you more than the job title does.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain the Dev, Delta and Echo split and which of the three writes production code.
  - Describe how Foundry emerged from field work, and what that says about where a product comes from.
  - Spot the Delta/Echo split re-created under new names at ElevenLabs, Glean, Decagon, Sierra and HappyRobot.
artifact: A short note in your journal naming which side of the Delta/Echo line you are aiming for, and why.
sources:
  - https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87
  - https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1
  - https://nabeelqu.co/reflections-on-palantir
  - https://www.barry.ooo/posts/fde-culture
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
  - https://posthog.com/blog/forward-deployed-engineer
  - https://a16z.com/services-led-growth/
  - https://www.semafor.com/article/07/11/2025/how-a-generic-sounding-tech-job-will-transform-ai
  - https://www.ycombinator.com/library/Mt-the-fde-playbook-for-ai-startups-with-bob-mcgrew
  - https://en.wikipedia.org/wiki/Forward_Deployed_Engineer
---

The title sounds military because it is borrowed. Palantir's Business Development teams were named after letters of the NATO phonetic alphabet, and the engineering team inside Business Development was the Delta team. Palantir's own 2019 blog post says exactly that: the name is "a throwback to Palantir's early days, when each team in Business Development was named after a letter in the NATO alphabet".

That detail matters more than it looks. The engineers were not in Product Development. They were in Business Development, on purpose.

## Three names

Palantir's post draws the line in one phrase that is worth memorising, because interviewers use it.

- **Dev** is a Software Engineer in Product Development. Devs "develop and engineer Palantir's software platforms", owning platform components end to end. Their orientation is **one capability, many customers**.
- **Delta** is a Forward Deployed Software Engineer in Business Development. Deltas "deploy software platforms to customers", customising for one client's critical business problem. Their orientation is **one customer, many capabilities**.
- **Echo** is a Deployment Strategist. Typically not an engineer. Owns the relationship, the adoption, the change management, the institutional politics. Barry McCardel, who spent nearly five years at Palantir as an Echo, is the clearest public account of that seat.

A Delta passed the same technical interview as a Dev. That is the load-bearing fact. The title lives in Business Development but the bar is an engineering bar, and every company that has since copied the model either kept that rule or quietly broke it, and you can tell which by reading their posting.

## Why the role had to exist

Two mechanisms, both documented.

The first is access. PostHog's explainer gives the practical trigger: Palantir found that even simple demos for intelligence customers "could require weeks of NDAs and security clearances". If you cannot get the customer's data out to your engineers, you send your engineers in to the data. Everything else follows from that constraint. The travel, the on-site cadence, the security questionnaires, the air-gapped deployments in Phase 05 of this path: they are all downstream of "the data cannot leave".

The second is discovery. Qureshi's account of his eight years there describes FDEs going on site into manufacturing, healthcare, aerospace and cybersecurity, learning business processes in detail, and doing "cruft work" by hand. Product Development engineers watched what the field kept doing manually and built tools that automated it. His summary of how the flagship product appeared: FDEs went to customer sites, did a lot of manual cruft, and PD engineers built tools that automated the cruft. Magritte for ingestion, Contour for visualisation, Workshop for building web apps.

Foundry, the platform Palantir now sells, is what that loop produced. It was not designed and then deployed. It was extracted.

McCardel describes the same thing from the strategist's side: field teams operated as R&D labs and Foundry was "born of necessity" in deployments before it migrated into the core platform. He is also honest about what it cost. "We were doing projects for free," he writes, and margins on some deployments were "literally negative infinity".

That is the trade the whole model rests on. You accept services-shaped economics early to buy knowledge you cannot get any other way, and you convert that knowledge into product. Qureshi frames the payoff in margin terms: Palantir reached what he cites as 80% gross margins in 2023, against Accenture's 32%.

## How big it was

Gergely Orosz reports that until roughly 2016, Palantir employed more FDEs than traditional software engineers. After Foundry shipped, more FDEs moved to core product work.

Sit with the sequence. A company was majority field engineers, the field engineers generated the product, and once the product existed the balance shifted. If you are ever asked in an interview why an FDE-heavy company is not automatically a consultancy, that is the honest answer: it depends entirely on whether the ratio is a phase or a permanent state.

## The spread

Ramp's engineering blog gives the timeline. The role "remained niche for 10+ years", Scale AI and C3.ai picked it up in the late 2010s, and it is now common at OpenAI, Anthropic, Databricks, Ramp and early-stage AI startups.

The essay that turned it into a hiring wave is Joe Schmidt's a16z piece from June 2025, "Trading Margin for Moat". Its argument is that AI startups should accept lower early gross margins in exchange for owning the customer's workflow, on the Salesforce and ServiceNow and Workday precedent. Its most-quoted line: enterprises buying AI "are like your grandma getting an iPhone: they want to use it, but they need you to set it up". Worth knowing that the a16z essay does not discuss Palantir's Delta and Echo history at all. The origin story and the current wave are two separate things that got welded together afterwards.

Semafor documented the copying in July 2025, naming OpenAI, Anthropic and H Company, whose ex-Palantir CEO put the thesis plainly: it is good to have the best technology, and it is "definitely not enough to build a successful company". Wikipedia's entry now lists AWS, OpenAI and Anthropic as employers of the title, and notes AWS invested a billion dollars into a unit focused on embedding engineers with customers.

Bob McGrew, an early Palantir executive who later became OpenAI's Chief Research Officer, gave a 2025 talk to Y Combinator on the playbook. The summaries of it describe the model as institutionalising "doing things that don't scale". His advice to founders thinking of copying it, per those summaries, was essentially: don't, because it is dangerously easy to turn into a low-margin consulting firm.

## The split, re-created everywhere

The most useful thing about knowing the Delta/Echo distinction is that you can now see it under new names. It has been rebuilt at:

- **ElevenLabs**, as "Forward Deployed Engineer - Software Engineer" and "Forward Deployed Engineer - Strategist". The Strategist posting asks only for "Basic Python proficiency" and accepts student projects as customer-facing evidence.
- **Glean**, as Forward Deployed Engineers working in a pod alongside Forward Deployed Product Managers.
- **Decagon**, as an Agent Builder FDE alongside Agent Product Managers and Agent Strategy Managers.
- **Sierra**, as Agent Engineers and Agent Product Managers, with a separate Forward Deployed Infrastructure Engineer for the deployment side.
- **HappyRobot**, as Deployment Strategists for commercial strategy and change management, and FDEs for building.

This is not trivia. It changes which posting you apply to. If a company has both, the strategist track will look easier to enter and will not put you on an engineering ladder. If a company has only one and it is strategist-shaped in everything but name, the posting will talk about workshops, enablement and stakeholder alignment and will be vague about what you build.

There is also a third variant to recognise: the infrastructure FDE. Sierra's role is the clearest published example, and Palantir engineers on forums describe stretches of AWS administration, network administration and container work. That is a real seat and a real ladder, and it is not the same job as building an agent for a law firm.

## What to take from this

Two things.

First, the origin explains the shape. The travel exists because data cannot move. The product feedback loop exists because the field was the only place the knowledge lived. Neither is decoration.

Second, you now have a question to ask any company using the title: which of the three are you hiring? A company that cannot answer clearly is usually hiring an Echo and calling it a Delta because Delta attracts better engineers.

Write one line in your journal: which side you are aiming for, and why. This path builds a Delta. If after reading Phase 06 you decide you would rather be an Echo, that is a legitimate answer and you should know it early, because the preparation is different.
