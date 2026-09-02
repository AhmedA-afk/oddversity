---
title: "The Palantir FDSE loop: decomposition and learning rounds"
phase: career
module: the-loops
kind: lesson
summary: Palantir's Forward Deployed Software Engineer loop runs recruiter call, technical screen, three onsite rounds drawn from a pool, then a hiring-manager round, and two of those rounds, Decomposition and Learning, are where candidates report actually getting cut.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Describe each stage of the Palantir FDSE loop and what it is testing.
  - Explain what the Decomposition round wants from you, using a real candidate's account of the prompt.
  - Explain what the Learning round wants, and the specific way one candidate was cut from it.
artifact: A one-page prep sheet listing the five possible onsite rounds, what each tests, and one thing you would practise for each.
sources:
  - https://www.tryexponent.com/guides/palantir-forward-deployed-engineer-interview
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
  - https://www.teamblind.com/post/update-interview-experience-palantir-new-grad-fdse-interview-dtncjyze
  - https://www.teamblind.com/post/palantir-fdsedelta-commercial-decomplearning-interview-jaaduce7
  - https://www.jointaro.com/interviews/companies/palantir/experiences/forward-deployed-software-engineer-new-york-ny-august-15-2025-no-offer-positive-816dddf1/
  - https://www.jointaro.com/interviews/companies/palantir/experiences/forward-deployed-software-engineer-united-states-november-9-2025-no-offer-negative-a89581e3/
  - https://www.aol.com/news/engineer-worked-palantir-8-years-052341159.html
---

Palantir has been running Forward Deployed Software Engineer, internally "Delta", loops since the early 2010s, and it is the loop most other companies' FDE processes are compared against. Exponent's guide, compiled from Glassdoor data, puts the average difficulty at 3.4 out of 5, 59% of candidates reporting a positive experience, and 28 days average time to hire. That is a comparatively fast, comparatively humane loop by big-tech standards. It is also one where a specific pair of rounds does most of the filtering.

## The five stages

1. **Recruiter call, 30 minutes.** Motivation and mission fit. One candidate on Taro described this stage as "more like a thoughtful conversation than a checklist."
2. **Technical screen.** Either a live pairing session (CodePair or Karat) or a HackerRank online assessment: a coding problem, a SQL query, and an API task.
3. **Virtual onsite, three 60-minute rounds**, drawn from a pool of five. You do not know in advance which three you will get.
4. **Hiring-manager round, 60 minutes.** Revisits whichever onsite round you were weakest in, plus team matching.
5. Elapsed time is typically three to four weeks.

## The pool of five onsite rounds

- **Decomposition.** Break a vague, real-world problem into components. Design the data model and the APIs. Write little to no code.
- **Learning.** You are handed an unfamiliar system or codebase and asked to extend it, inside 60 minutes, with documentation available.
- **Coding.** Data-structures-and-algorithms style, but framed around an end user, with 15-20 minutes of behavioural questions embedded in the same session.
- **Re-engineering.** Find and fix bugs in an unfamiliar block of 300-plus lines.
- **System Design.** Heavily weighted toward data pipelines.

Two of these, Decomposition and Learning, are frequently paired into a single virtual onsite. A Blind thread from March 2025 titled "Palantir FDSE/Delta Commercial Decomp/Learning interview" confirms that pairing was still standard that year.

## What Decomposition actually asks for

A new-grad candidate's account on Blind describes the round as "system design, high-level design focus, they give a sample data set and ask how can you use this data to do something." That phrasing matters more than it looks. You are not asked to solve a stated problem. You are handed raw material, a dataset, a vague ask, and the round is scoring how you turn it into a scoped plan: what question is worth answering first, what you would need from the customer to answer it, and what you would build to test the answer before committing to it. Diagrams and a data model carry more weight than working code.

This is the same skill the FDE-DIGEST names as the single highest-weighted round across Palantir, OpenAI, Anthropic, and Databricks, and the most common reason candidates are rejected industry-wide is jumping to a solution before finishing the scoping. Treat every minute you spend decomposing instead of building as time well spent, even when the silence feels uncomfortable.

## What Learning actually asks for, and how one candidate lost it

The same Blind account describes Learning as "not exactly debugging, they will show the modules they have written and you need to enhance them," with library documentation supplied, in Python, Java, or TypeScript depending on the pairing. The premise is realistic: on a customer site you inherit systems you did not write and have hours, not weeks, to become useful inside them.

A Taro account from November 2025 (no offer, negative) is the concrete cautionary story. The candidate cleared a coding-plus-decomposition round they described as easy, then reached the onsite Learning round, which "unexpectedly required specific SQL query knowledge" that had to be written correctly with no way to run it and check the output. They were cut there. The lesson is specific, not general: SQL you can write cold, without a REPL to lean on, is table stakes for this round, and "I would normally test this against the database" is not an acceptable substitute in a Palantir Learning round.

A more successful account, also on Taro (August 2025, positive, no offer given but a strong process), describes the technical round as algorithmic on the surface, but says "the real test was in how I debugged and adapted my solution in real time." Recruiters and interviewers both asked directly, "Why Palantir? Why FDSE specifically?", a question worth having a real, specific answer to rather than a generic one about liking hard problems.

## How to prepare, given this shape

Because you cannot predict which three of the five rounds you will get, prepare for all five, but weight your practice toward Decomposition and Learning:

- For **Decomposition**, practise turning a one-paragraph, ambiguous business problem into a data model and a staged plan in 45-60 minutes, out loud, before you write anything. This path's weekly decomposition drills exist for exactly this.
- For **Learning**, practise reading someone else's medium-sized codebase cold and shipping one working change inside an hour, with documentation open but no chance to ask the original author. Practise writing SQL, including window functions and joins, without a database in front of you to check your work.
- For **Coding** and **Re-engineering**, standard interview prep applies, but narrate your reasoning; Palantir's rounds fold behavioural signal into the technical ones rather than isolating it.
- For **System Design**, default to data-pipeline framing: ingestion, joins, freshness, and what happens when a source changes shape underneath you, rather than a generic web-service design.

Historically, Palantir's earliest interviews under its founders were far less structured: Nabeel Qureshi, who spent eight years as a Delta, described them to Business Insider as roughly 90-minute conversations on a spontaneously chosen, often philosophical topic, functioning as a "vibe check" for independent-minded people willing to push back, people with broad interests, and intensely competitive people. The current loop is far more standardised, but that original bar, someone who argues with you rather than agrees with you, is still visibly what the Decomposition and Learning rounds are trying to surface.
