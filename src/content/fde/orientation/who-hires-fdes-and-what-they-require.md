---
title: Who hires FDEs and what they require
phase: orientation
module: the-market
kind: lesson
summary: The skills matrix from twenty-eight real postings. Customer-facing evidence and Python are near-universal, degrees mostly are not, and the requirement everyone underestimates is written into the word "ambiguity".
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Name the two requirements that appear in more than 60% of FDE postings, and what the other requirements actually cluster into.
  - Explain what counts as customer-facing evidence at the low end and the high end of the market.
  - Build a target list of employer types rather than a list of dream companies.
artifact: "A one-page gap analysis in your journal: each requirement from the matrix, marked have / partial / none, dated today."
sources:
  - "https://bloomberry.com/blog/i-analyzed-1000-forward-deployed-engineer-jobs-what-i-learned/"
  - "https://job-boards.greenhouse.io/anthropic/jobs/5302966008"
  - "https://openai.com/careers/forward-deployed-engineer-(fde)-sf-san-francisco/"
  - "https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0"
  - "https://builtin.com/job/forward-deployed-engineer-recent-graduate/6637309"
  - "https://job-boards.greenhouse.io/databricks/jobs/8739465002"
  - "https://careers.kula.ai/sarvam-ai/32675"
  - "https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited/jobs/4723067005"
  - "https://vercel.com/careers/forward-deployed-engineer-5752684004"
  - "https://simplify.jobs/p/48069f52-92e9-4ac6-93aa-ab63e0e50b5c/Forward-Deployed-Engineer"
  - "https://www.paraform.com/blog/forward-deployed-engineer-demand-quadrupled"
  - "https://en.wikipedia.org/wiki/Forward_Deployed_Engineer"
  - "https://fortune.com/2026/05/28/ai-slashes-white-collar-jobs-salesforce-ceo-marc-benioff-one-department-still-hiring-sales/"
---

Twenty-eight FDE postings were fetched and read line by line for this path, and every requirement was counted the same way: "required" means it appeared in the must-have list, "preferred" means it appeared only in nice-to-haves or in the responsibilities. Nothing below is estimated. If a number looks low, it is because the postings say so.

## Who is hiring

Five distinct groups, and they want different things.

**Frontier labs.** OpenAI, Anthropic. Highest published bands, highest experience floors, most competitive. Anthropic asks for four or more years in a technical customer-facing role. OpenAI's FDE template asks for five, its FDSE template for seven.

**AI-native product companies.** Cohere, Glean, Harvey, Retool, Decagon, Sierra, Hebbia, Baseten, ElevenLabs, Cognition, Sarvam. This is where the accessible doors are. Harvey's founding FDE posting asked for two years with zero-to-one ownership. Sarvam asks for two to five.

**Platform vendors with delivery organisations.** Palantir, Databricks, Snowflake, Scale AI, C3.ai, Vercel. Palantir's FDSE posting asks for one or more years of post-college experience, which makes it one of very few genuine early-career doors into the role at a large company.

**Non-AI product companies that adopted the model.** Ramp, HackerRank, Razorpay, SigNoz. The title is used because the function is real, not because the company sells models.

**Large incumbents building practices.** AWS put a billion dollars into a unit focused on embedding engineers with customers. Salesforce has said it is trying to hire a thousand FDEs. Google Cloud's leadership has said it is ramping the hiring. These are the least documented and the most numerous.

On demand: several independent counts agree the direction, disagree on the size, and none should be quoted as fact. Indeed data shared with Business Insider put postings roughly 729% above the prior year by April 2026. One recruiting-data blog counted 1,165% year on year for January to October 2025. A staffing platform reported roughly 350% growth from Q1 2025 to Q1 2026 and said 59% of its FDE-hiring clients were Seed to Series A. The useful part of that last figure is not the growth rate, it is where the hiring is: early-stage companies.

## The matrix

Counts are out of 28 fetched postings.

| Requirement | Required | Preferred or mentioned | Total |
|---|---|---|---|
| Customer-facing or consulting experience | 15 | 7 | **22 / 28** |
| Python named | 14 | 4 | **18 / 28** |
| Years of experience stated | 22 | — | **22 / 28** |
| Production LLM experience | 13 | 4 | **17 / 28** |
| Ambiguity tolerance named | 11 | 4 | **15 / 28** |
| Travel expectation stated | — | — | **15 / 28** |
| APIs and integrations named | 11 | — | **11 / 28** |
| Full-stack explicitly required | 11 | — | **11 / 28** |
| Agents or agentic workflows | 10 | 1 | **11 / 28** |
| Degree requirement | 7 | 4 | **11 / 28** |
| Founder or 0-to-1 framing | 4 | 7 | **11 / 28** |
| TypeScript or JavaScript | 8 | 2 | **10 / 28** |
| Evaluation frameworks | 7 | 2 | **9 / 28** |
| RAG or retrieval | 4 | 5 | **9 / 28** |
| Data engineering, SQL, Spark, pipelines | 4 | 5 | **9 / 28** |
| Cloud, Terraform, containers | 5 | 3 | **8 / 28** |
| ML fundamentals, MLOps, model deployment | 5 | 2 | **7 / 28** |
| Vertical domain experience | 0 | 7 | **7 / 28** |
| Security, compliance, guardrails | 2 | 3 | **5 / 28** |
| Prompt engineering | 3 | 1 | **4 / 28** |
| MCP servers named | 3 | 0 | **3 / 28** |
| AI-coding-tool fluency required | 1 | 2 | **3 / 28** |
| Vendor certification | 1 | 0 | **1 / 28** |
| Security clearance | 0 | 0 | **0 / 28** |

## Reading it

**Only two things clear 60%.** Customer-facing experience and Python. Everything else is a cluster, not a universal.

That should change how you spend the next nine months. If you optimise for the long tail of technologies you will study everything and be hired for nothing. If you optimise for the two universals plus one archetype's cluster, you are targeting the actual filter.

**"Ambiguity" is a requirement, not a personality note.** It appears in 15 of 28, almost always as the lead soft skill, and it is stated in language that is testable: Hebbia wants comfort with "messy, underspecified problems", Retool wants someone who thrives "where none yet exist", Sierra wants you to "navigate ambiguity with enterprise stakeholders, from platform engineers to CISOs", Cognition asks for "high tolerance for ambiguity and intensity".

The reason this matters: the highest-weighted round in most FDE interview loops is a decomposition round where you are handed a deliberately vague enterprise problem. Ambiguity in the posting is a pointer to that round. This path runs a decomposition drill every week from week 8 for exactly that reason.

**Agents beat evals beat retrieval beats prompting.** Agents in 11, evals in 9, RAG in 9, prompt engineering in 4. In 2026 language, "production LLM experience" means you have built something agentic and can prove it works. Three postings, Anthropic and Vercel and Sarvam, name MCP servers as a deliverable outright.

**Degrees are mostly optional.** A hard gate in 7 of 28, and three of those say "or equivalent". The strict ones are defence (Shield AI), C3.ai, Baseten and Retool. Palantir lists preferred fields rather than requiring a degree. If you do not have a degree, this is one of the more open engineering markets available to you, and the evidence portfolio in Phase 09 is what replaces the credential.

**Certification is rare but not free.** One posting in twenty-eight required a vendor certification, and it was Databricks. If you target one platform vendor, budget for its certification. Do not collect them speculatively.

## What "customer-facing experience" actually means

This is the gate, so it is worth being precise about what clears it. The postings themselves define a range.

At the **low end**, ElevenLabs' recent-graduate posting accepted "student clubs/side projects" as customer-facing experience. That is not a typo and it is not unusual for new-grad tracks. What it means in practice is that you must be able to describe a situation where a non-technical person needed something from you, you worked out what they actually needed, and you delivered it.

In the **middle**, Vercel asks for six years of engineering plus two years of customer-facing technical work. Razorpay wants demonstrated end-to-end ownership of shipped products with customer contact.

At the **high end**, Anthropic asks for four or more years in a technical customer-facing role, and then explicitly names two substitutes: a software engineer with consulting experience, or a former technical founder.

That last line is the single most useful sentence in the whole corpus of postings. **The accepted substitutes for an FDE title are: founder, consulting plus code, or solutions engineering where you actually built the proofs of concept.** Every one of those is something you can construct deliberately. None of them requires anyone to have given you the title first.

One recruiting platform's framing of why the market is like this: postings grew roughly 300% in 2024 while the pool of qualified candidates grew about 50%, because "traditional software engineers and solutions architects lack the requisite hybrid skillset". Treat the specific numbers as vendor data. The structural claim is consistent with everything else here: the shortage is of the combination, not of either half.

## Travel is stated, not implied

Fifteen of twenty-eight postings state a travel expectation, and it clusters at 20% to 50%. OpenAI states up to 50%, with three days a week in an office on top. Anthropic states about 25%. Palantir states up to 25%, described as flexible to personal preference. Glean states 25 to 50%. Cohere states 20 to 40%. Databricks' senior role states 20%, and its India-remote role states travel to customers once every four to eight weeks. Vercel is the only one that quantifies it usefully in days: three to four days every other month.

If travel is a hard constraint for you, that Vercel line and the Databricks India cadence are the two shapes to look for. They exist. They are just rarer than the 25 to 50% band.

## Build a target list, not a dream list

Your target list should have four rows, and companies you have never heard of should outnumber the ones you have.

1. **India-HQ agentic startups.** Sarvam and Razorpay are the two verified, agent-heavy examples. Their requirements are as demanding as any US posting.
2. **Platform vendors with India delivery teams.** Databricks runs a remote-India FDE role. This category is where the certification path pays.
3. **Early-stage AI companies anywhere with a two-to-three-year floor.** Harvey's founding posting, Scale's GenAI role, Sarvam. Most of this category is invisible on job boards until you follow the companies directly.
4. **Non-AI product companies adopting the model.** SigNoz, HackerRank, Ramp-shaped companies. Less glamorous, same skills, often less competition.

A practical warning from the posting data: nine of the twenty-eight postings had been removed or closed within the previous fourteen months. Treat any FDE listing older than about ninety days as probably gone, and verify before you spend an evening on an application.

## Do this now

Copy the matrix into your journal. Against each row write "have", "partial", or "none", with one line of evidence for anything that is not "none". Date it.

Almost everyone starting from zero will write "none" against customer-facing, production LLM, agents, evals, and cloud, and "partial" against Python. That page is your baseline. Phase 08 asks you to fill in the same page again, and the difference between the two pages is what you will actually be able to talk about in an interview.
