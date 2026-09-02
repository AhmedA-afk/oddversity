---
title: "Two archetypes: Applied-AI FDE and platform FDE"
phase: orientation
module: what-it-is
kind: lesson
summary: Twenty-eight real postings split cleanly into two jobs that share a title. One wants agents, evals and retrieval; the other wants Spark, Terraform and Postgres. Choosing between them changes what you study for the next nine months.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Classify any FDE posting as Applied-AI or platform/infra from its requirements list in under a minute.
  - State the experience floors each archetype actually posts, and which is reachable from zero.
  - Decide which archetype this path prepares you for first, and what you would add to switch.
artifact: A two-column note in your journal with five real postings you found this week sorted into the two archetypes, with the phrase that decided each one.
sources:
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
  - https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0
  - https://jobs.lever.co/palantir/636fc05c-d348-4a06-be51-597cb9e07488
  - https://openai.com/careers/forward-deployed-software-engineer-nyc-new-york-city/
  - https://job-boards.greenhouse.io/databricks/jobs/8739465002
  - https://www.databricks.com/company/careers/professional-services-operations/ai-engineer---fde-forward-deployed-engineer-8099751002
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
  - https://careers.kula.ai/sarvam-ai/32675
  - https://vercel.com/careers/forward-deployed-engineer-5752684004
  - https://www.linkedin.com/jobs/view/forward-deployed-engineer-agentic-platform-at-cohere-4319336681
  - https://builtin.com/job/forward-deployment-engineer/7406694
---

Read enough FDE postings and you stop seeing one job. Twenty-eight were fetched and read line by line for this path, and they fall into two piles that share almost nothing except the word "customer".

## The split

**Applied-AI FDE.** Anthropic, Cohere, Glean, Harvey, Retool, Sarvam, Snowflake Cortex, Databricks AI-FDE, Palantir's Forward Deployed AI Engineer, Baseten, Vercel's AI track, OpenAI's FDE template. The requirement that defines this pile is production LLM work: agents, evaluation frameworks, retrieval, and increasingly MCP servers named as a deliverable.

**Platform and infrastructure FDE.** Palantir's FDSE, Databricks' Senior FDE, Sierra's deployed infrastructure role, Shield AI, C3.ai, HackerRank, and, notably, OpenAI's *FDSE* template. The defining requirement is full-stack or infrastructure depth: Postgres or MySQL, Spark internals, Terraform, container orchestration, cloud networking, sometimes a vendor certification.

The clean tell is that OpenAI runs both. Its Forward Deployed Engineer posting asks for five years including customer-facing work and systems "powered by LLMs or generative models". Its Forward Deployed Software Engineer posting asks for seven years of full-stack engineering and relational databases, and does not require LLM work at all.

| | Applied-AI FDE | Platform / infra FDE |
|---|---|---|
| Named by | Anthropic, Cohere, Glean, Harvey, Retool, Sarvam, Snowflake Cortex, Databricks AI-FDE, Palantir FDAIE | Palantir FDSE, Databricks Sr FDE, Sierra, Shield AI, C3.ai, HackerRank, OpenAI FDSE |
| Core requirement | agents, evals, RAG; MCP servers as a deliverable in three postings | full-stack or infra depth: Postgres, Spark, Terraform, K8s, cloud networking |
| Language | Python first, TypeScript second | Python, TypeScript, plus Scala (Databricks) or C++ (Shield AI) |
| Experience floor posted | 2–5 years at startups, 4+ at the labs | 1+ (Palantir entry track) to 7+ (OpenAI FDSE, Shield AI) |
| Certification | none seen | Databricks certification required on one posting |
| What you demo | an agent with an eval harness | a deployment that survives someone else's security review |

## What the counts across all twenty-eight say

Only two requirements clear 60%.

- **Customer-facing or consulting experience: 22 of 28.** Required outright in 15.
- **Python named: 18 of 28.**

Then it drops off. Production LLM experience is required in 13 and mentioned in 4 more. The word "ambiguity" or a close synonym appears in 15. Agents appear in 11, evaluation frameworks in 9, retrieval in 9, and prompt engineering in only 4. That last number is the interesting one: in 2026 postings, prompt engineering has been absorbed into agent and eval language. Only Anthropic, Glean and Sarvam still name it separately.

Degrees are a hard gate in 7 of 28, and three of those say "or equivalent". Founder or zero-to-one framing appears in 11 and is the main senior signal.

The lesson in the numbers is blunt: **agents plus evals is the current Applied-AI bar, and "I can prompt well" is not a qualification.** Phase 04 of this path is built around exactly that, with the eval before the build.

## How to classify a posting in one minute

Read the hard requirements list only. Ignore the responsibilities section, which is copied between companies and says the same thing everywhere (embed, scope, build, ship, codify patterns, feed product).

Ask three questions.

1. **Does it require production LLM work, or does it mention AI only in the responsibilities?** Required means Applied-AI. Mentioned means platform.
2. **What is the second technical noun after Python?** If it is "agents", "evaluation", "RAG" or "vector", Applied-AI. If it is "Postgres", "Spark", "Terraform", "Kubernetes" or "VPC", platform.
3. **Is there a certification or a named vendor stack?** Databricks certification, C3 AI Platform, Hivemind SDK, Next.js. That is platform, and it means part of your first year will be spent learning a product rather than a discipline.

Two worked examples.

Anthropic asks for four years in technical customer-facing roles, production LLM experience covering prompt engineering, agents, evaluation and deployment, Python plus ideally TypeScript or Java, and a bachelor's degree or equivalent. It names MCP servers, sub-agents and agent skills as deliverables. Applied-AI, unambiguously.

Databricks' senior role asks for six years of data engineering or data platforms, expertise in one cloud, deep Apache Spark including runtime internals, CI/CD, MLOps, and a Databricks certification. Platform, unambiguously, even though the same company also runs an AI-FDE role that is Applied-AI.

## The archetypes have different doors

This is the part that should change your plan.

The **platform pile contains the only genuine entry-level doors**. Palantir's FDSE posting asks for "1+ years of relevant, post-college work experience" and lists preferred degree fields rather than requiring one. Baseten's closed EMEA posting asked for one year. C3.ai asks for two. ElevenLabs ran a recent-graduate FDE posting that accepted student clubs and side projects as customer-facing evidence.

The **Applied-AI pile at the frontier labs does not have an entry door**. Anthropic's floor is four years of customer-facing technical work. OpenAI's is five, or seven on the FDSE template. Those are not filters you can talk your way past in your first year.

But the Applied-AI pile at startups does. Harvey's founding FDE posting asked for two years of building production software with zero-to-one ownership. Sarvam asks for two to five years of shipping production systems. Scale's GenAI role says two years preferred.

So the realistic sequence from zero is: build to the Applied-AI startup bar, which is roughly two to three years of shipped production work plus real agent and eval experience, and treat the frontier labs as a later move rather than a first job. Phase 08 covers this in detail. It is not a discouraging conclusion, it is the difference between applying for nine months and getting an interview.

## Which one this path builds

This path builds an **Applied-AI FDE with enough platform depth not to be helpless**.

The reasoning is in the postings. Applied-AI is where the startup-level doors are, where India-located postings are most explicitly agentic (Sarvam names MCP servers, LangGraph, multi-agent architectures and evaluation pipelines; Razorpay requires "daily fluency with AI coding tools and agents"), and where an artifact you build alone can be genuinely convincing. You cannot fake six years of Spark internals in a portfolio. You can absolutely build an agent with a defensible eval harness and a deployment story.

The platform depth is not optional, though, and this path does not treat it as such. Phase 01 puts you through containers, one cloud, a VPC, IAM, managed Postgres and reading a Helm chart. Phase 05 makes you deploy the same artifact into a VPC, then a customer-managed Kubernetes cluster, then an air-gapped VM. That is roughly the floor at which a platform-flavoured interviewer stops assuming you have never seen production.

If you decide later that platform is your pile, the switch is not expensive from here. Add Terraform properly, add one distributed data engine, and get the vendor certification the posting names. What you cannot easily add later is the customer-facing evidence, which is why it is threaded through every phase.

## Do this now

Find five live FDE postings this week. Any five. Classify each one using the three questions, and write down the exact phrase that decided it. Note the stated experience floor next to each.

You will notice two things. Most postings are not for you yet. And the ones that are will be at companies you have not heard of, which is the normal shape of a first FDE seat.
