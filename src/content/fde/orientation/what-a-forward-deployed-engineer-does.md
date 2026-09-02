---
title: What a Forward Deployed Engineer actually does
phase: orientation
module: what-it-is
kind: lesson
summary: The role in one paragraph, then the thirteen responsibilities that paragraph hides and the week they actually add up to. Written from what the companies themselves publish, not from what recruiters say.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Describe the role in one paragraph without using the words "customer-facing" as the differentiator.
  - Name the thirteen responsibilities and say which four dominate a calendar.
  - Recognise, from a job description, whether the company means "embedded builder" or "post-sale support".
artifact: A one-page note in your journal listing which of the thirteen responsibilities you have already done in any job, any project, any club, and which you have never touched.
sources:
  - https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87
  - https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
  - https://openai.com/careers/forward-deployed-engineer-(fde)-sf-san-francisco/
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://bloomberry.com/blog/i-analyzed-1000-forward-deployed-engineer-jobs-what-i-learned/
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
  - https://getperspective.ai/blog/state-of-forward-deployed-engineering-2026-survey-report-1500-fdes
---

Here is the whole job in one paragraph.

A Forward Deployed Engineer is a software engineer who embeds inside a customer's organisation, often on-site for part of the week, and takes a vendor's platform or model from "we signed the contract" to "it runs our workflow in production". You scope the problem with the customer, usually discovering that the problem they described is not the problem worth solving. You do the data plumbing. You write production code inside their environment, on their infrastructure, against their legacy systems. You build the evaluation that proves the thing works well enough for someone to stake a decision on it. You drive adoption until people actually use it. Then you go back to your own company and change the product so the next customer needs less of you.

Everything below is that paragraph unpacked.

## The thirteen responsibilities

These come from the companies' own postings and their leaders' own accounts, not from a recruiter's summary. Every one of them appears in at least three independent sources.

**Getting in and finding the real problem**

1. Embed with the customer for weeks to months, on-site or virtual. Palantir's Deltas went on site three to four days a week. OpenAI states travel up to 50%. Anthropic states about 25%.
2. Discovery and scoping: interrogate the stated problem, find the higher-value one behind it, and push back. Ramp lists "Always be scoping" as a team principle and glosses it as "question all requirements".
3. Rapid prototyping and demos. A working thing early, not a deck.

**Building**

4. Write production code inside the customer's environment. This is the line that separates the role from pre-sales. Across a thousand postings analysed by one recruiting-data blog in late 2025, 37% named writing production code explicitly.
5. Data plumbing: ingestion, cleaning, joining, ETL. Nabeel Qureshi, eight years an FDE at Palantir, puts it at "95% of enterprise data problems involve access, cleaning and joining data, not analysis".
6. Systems integration with whatever the customer already runs: SSO, document management, a twenty-year-old Oracle schema, a SOAP endpoint nobody maintains, occasionally a COBOL migration.
7. Deploy and operate in constrained environments. Sierra's forward-deployed infrastructure role is entirely about "VPC configuration and infrastructure provisioning" inside customer-owned clouds, upgrades, rollbacks and incident support.
8. Build evals and guardrails. OpenAI's head of FDE calls the practice "eval-driven development" and lists "evaluation frameworks and labeled datasets" first among the things his team builds.
9. Ship the AI-specific artifacts when the product is an AI product: agents, MCP servers, prompt chains, retrieval layers, fine-tunes. Anthropic's posting names "MCP servers, sub-agents, and agent skills" as deliverables.

**Making it stick, then making it product**

10. Drive adoption and trust: pilots, training, workshops, executive updates. The Morgan Stanley engagement OpenAI describes ran six to eight weeks of engineering and then about four months of pilots before roughly 98% of advisors were using it.
11. Feed field learnings back to product and research, and generalise the one-off into something reusable.
12. Own the relationship and spot the next deployment.
13. Operate autonomously under ambiguity. Palantir's own AI-engineer posting compares the job to being a hands-on startup CTO.

Roughly, 2, 4, 5 and 11 fill the calendar. 10 and 12 decide whether the engagement is judged a success.

## The week the paragraph hides

Nobody's week looks like an even split across thirteen bullets. The published accounts differ sharply, and the difference is informative.

Palantir's 2019 description of a Delta's time: "some weeks writing and reviewing code like typical engineers, other weeks scoping projects with clients". The 2020 first-person account from an FDSE called Brian says most of his day was "designing, writing and testing workflows" and that meetings were "limited intentionally".

OpenAI's head of FDE describes days where an engineer spends the whole day with the payments team understanding what matters to them, and writes nothing, then shifts to writing tests, migration code and progress UIs.

Cognition's deployed-engineering lead reports four to five hours a day on customer calls.

One vendor survey of self-reported FDEs, published in 2026 with no response-rate or selection-bias discussion, reports a median 45-hour week split roughly 31% customer meetings, 26% writing or reviewing code, 16% on-site and travel. Treat that as directional only. It is the only aggregate number that exists and it comes from a company selling to the audience it surveyed.

The honest version: the split varies by company, by phase of the engagement, and by how much of the customer's politics has landed on you this month. Early in an engagement you are mostly in rooms. In the middle you are mostly in an editor. At the end you are mostly in front of people who need to be persuaded to change how they work.

## What you are accountable for

This is the part that surprises people who arrive from a normal engineering seat.

OpenAI's stated measures are production adoption, measurable workflow impact, and eval-driven feedback that changes product and model roadmaps. Ramp's three prioritised outcomes are serving existing customers, making onboarding more efficient, and expanding product capability to increase the addressable market. Notice that none of these is "shipped the feature".

You are accountable for an outcome inside an organisation you do not control, using authority you do not have, on a timeline someone else set. A branch manager at a co-operative bank does not report to you and can quietly decide that the new KYC screen is not worth learning. That is your problem, not the customer's.

The compensating fact, from the same posting data: across a thousand FDE postings, none carried a sales quota, and about 70% included equity. The role is measured on outcomes but paid like engineering.

## What it is not

It is not customer support with a nicer title, and it is not pre-sales. Pre-sales engineers hand off at the contract. Implementation consultants hand off at go-live and are billed by the hour. An FDE hands off after deployment and then does one more thing that neither of the others does: changes the product.

It is also not a role where you can be weak at engineering and strong at people. Every source insists the FDE clears the same technical bar as the product engineers. Palantir put its FDSEs through the same technical interview as its core engineers. Anthropic asks for production LLM experience on top of four years of customer-facing technical work. Ramp describes engineering fundamentals as "a bar to pass, not over-indexed" and then ranks drive, customer empathy and communication above it, which only makes sense once you have passed the bar.

The two failure profiles a hiring loop is built to catch are the excellent engineer who freezes in a room of sceptical stakeholders, and the fluent consultant who cannot ship. This path is built to make you neither.

## Do this now

Open your journal. List the thirteen responsibilities. Next to each, write one line: something you have actually done that resembles it, in any job, any internship, any student club, any side project. Write "none" where there is none, and resist the urge to stretch.

Most people starting this path will have honest entries against 4, 5 and 6 and nothing against 2, 10 and 11. That is the normal shape of the gap, and the second half of this path exists to close it. Keep the page. You will grade yourself against it again in Phase 08.
