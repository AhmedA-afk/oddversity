---
title: A week in the life, from four people who do it
phase: orientation
module: what-it-is
kind: lesson
summary: Palantir, OpenAI, Ramp and Cognition have all published first-person or named accounts of the work. Same title, very different weeks. Read all four before you decide the job sounds appealing.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Describe four published accounts of FDE work and name the concrete difference between them.
  - Predict, from a company's product and customer type, what an FDE week there will look like.
  - Name the three things every account has in common regardless of company.
artifact: A journal entry answering, honestly, which of the four weeks you would want and which you would dread.
sources:
  - https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1
  - https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87
  - https://nabeelqu.co/reflections-on-palantir
  - https://newsletter.eng-leadership.com/p/inside-openais-forward-deployed-engineer
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://www.aol.com/articles/openai-exec-explains-growing-team-080035434.html
  - https://builders.ramp.com/post/fde-summer-internship
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://finance.biggo.com/podcast/a5f316b781abb2dc
  - https://www.firstresonance.io/blog/a-day-in-the-life-of-a-forward-deployed-systems-engineer-fdse-c
  - https://getperspective.ai/blog/state-of-forward-deployed-engineering-2026-survey-report-1500-fdes
---

Job descriptions describe the job the company wishes it were hiring for. First-person accounts describe the job. Four have been published, from four very different companies, and reading them side by side is the fastest way to understand that the title covers a wide range of weeks.

## One: Palantir, an FDSE called Brian

Palantir published a day-in-the-life post in 2020 from an FDSE working on a US Department of Defense data-integration project. It is the most engineering-heavy of the four accounts.

Most of his day was "designing, writing and testing workflows" and configuring the platform to unlock new functionality. Meetings and stand-ups were "limited intentionally". The rest of the time went to learning about other deployments and shared internal projects. He stresses "rapid cycles between creating solutions and seeing them in action" with the actual end users.

He was remote at the time, during the pandemic, which is not the normal shape. Palantir's own 2019 description of the role has Deltas dividing time between the customer's premises (meetings, monitoring, debugging, deploying) and the office (code changes, pull requests, planning, internal coordination), with responsibilities shifting month to month between development and scoping. Qureshi, who did the job for eight years, describes going on site three to four days a week, in a separate podcast appearance says four to five, and calls it "a ton of travel".

**What defines this week:** the customer is one large institution, the deployment is long, the code is inside a platform you did not write, and a great deal of the value is in the plumbing. Qureshi's number for what that plumbing actually is: "95% of enterprise data problems involve access, cleaning and joining data, not analysis."

## Two: OpenAI, described by the head of the team

Colin Jarvis runs OpenAI's FDE team, which started at two people and which he described in August 2026 as around 140, with a separate deployment organisation of roughly 200 handling support and scale.

His description of a day is the opposite end of the spectrum from Brian's. An FDE "might spend the full day talking with the payments team to understand what specific things are important to them so that the migration would be successful", and then shift to "writing tests, migration code, or building progress UIs". On-site time is about 50%, varying sharply by region: he cites roughly 80% for FDEs based in the UAE and Japan, and two to three weeks a month in Europe and the US.

The engagement arc he describes has four parts, and it is worth learning because it is the arc this entire path is sequenced against:

1. Deep domain embedding on-site.
2. Pick a problem where solving it is worth tens of millions to billions, not a problem that is merely annoying.
3. Build the core solution, typically six to eight weeks.
4. Extended pilots and eval refinement, four months or more, then codify the learnings into reusable product.

The Morgan Stanley engagement is the published example: six to eight weeks of technical setup, then months of pilots with advisors, ending at roughly 98% adoption. Note the ratio. The engineering was the short part.

What his team builds, in his own listing: evaluation frameworks and labelled datasets, guardrails and verification mechanisms, data access layers and metadata translation layers, and agent systems with tool integration. His slogans are "eating pain and excreting product" and "doing what doesn't scale". His definition of success is uncomfortable and correct: if an FDE is needed again for the same problem, "the initial solution was incomplete".

**What defines this week:** the customer is enormous, the problem selection matters more than the build, and the eval is a first-class deliverable rather than a testing afterthought.

## Three: Ramp, an intern's summer

Ramp published an account of a summer internship on its FDE team, and it is the most useful of the four for someone starting out, because it shows the tempo at a company where the customer is a business user rather than an institution.

Week one: assigned to an enterprise customer's Bill Pay problem. Day three: shipped first code. Then several weeks on an algorithm to match hotel bookings to transactions, reaching what the post describes as over 80% true-positive match rate. Later: automatic receipt retrieval using browser and voice agents. The operating rule quoted in the post is "ship good work as fast as possible, gather feedback from customers for iteration".

Ramp's team grew from two to sixteen FDEs in about eighteen months, and seven of the sixteen were previously founders. Its stated principles are "always be scoping", which it glosses as questioning all requirements, generalising work, extreme ownership, and winning when customers win. The reason the team exists is stated plainly: before it, "product engineering would scope out mega-projects that took months to deliver".

**What defines this week:** short cycles, concrete numeric outcomes, and code shipped within days rather than weeks. This is the closest of the four accounts to what your bootcamps in Phase 09 simulate.

## Four: Cognition, the deployed-engineering lead

Jia Wu leads deployed engineering at Cognition, which sells an AI software engineer. His number is the one that makes people reconsider the role: **four to five hours a day on customer calls.**

The deliverables he describes are event-triggered autonomous agent runs, test generation, alert triage and backlog clearance, and legacy system migrations including COBOL and JCL. His diagnosis of what the job actually is deserves to be quoted:

> The problem isn't writing code faster, that's only 20% of the problem. The problem really just becomes how do you test this code, how do you review and deploy this code, and how do you maintain this code across the enterprise.

He also describes the deployed team as the source of "the highest fidelity evaluation set", because real customer codebases break agents in ways no internal benchmark does.

**What defines this week:** you are on calls more than in an editor, and the engineering that remains is mostly about verification and operations rather than generation.

## A fifth, briefly, because not every FDE works at a lab

First Resonance publishes manufacturing software and ran an account of a forward-deployed systems engineer's work. The texture is different again: same-day patching of a data parser after a vendor changed field names without warning, adding barcode validation, chunking logs to fix a user-interface adoption cliff, and at a micro-nuclear customer, working around a broken Excel macro in an ingestion pipeline and wiring calibration compliance into digital travelers for a regulatory audit.

No agents. No frontier models. Just someone inside a factory making software survive contact with a real process. Most FDE seats in the world look more like this than like Morgan Stanley, and the skills are the same ones.

## What is common to all of them

Strip the company names away and three things survive.

**The customer's reality sets the agenda.** A vendor changed a field name. The payments team has an opinion. The advisors will not adopt it. None of these are in a backlog you control.

**Verification is the hard part, not generation.** Cognition says testing, reviewing, deploying and maintaining is 80% of the problem. OpenAI puts evals and labelled datasets at the top of the build list. Ramp measures a match rate. This is why Phase 04 of this path puts the eval before the build, and why every capstone is graded on the eval first.

**Somebody has to convert the work into product.** Palantir's Deltas fed configurations back and they became features. Jarvis codifies learnings into reusable frameworks. Ramp names generalising as a principle. Without this, all four weeks collapse into contracting.

## The aggregate, caveated

One vendor-run survey of self-reported FDEs, published in 2026 without response-rate or selection-bias disclosure, puts the median week at 45 hours split roughly 31% customer meetings, 26% writing or reviewing code, 16% travel and on-site, 11% internal coordination and 9% research synthesis. The same survey reports that only 6% of respondents said they were mostly building greenfield product.

Treat those figures as directional, from an interested party. They are consistent with the four accounts, which is the most that can be said for them.

## Do this now

Write a short honest journal entry. Which of the four weeks would you want, and which would you dread?

If your answer is that Cognition's four to five hours of daily calls sounds unbearable, that is worth knowing in week one rather than in month nine. It does not disqualify you. It tells you to aim at the platform and infrastructure end of the role, or at a company where the customer is a developer rather than an executive. If Brian's week sounds like the best job you have heard of, note that too, and note that it comes with three or four days a week away from home.
