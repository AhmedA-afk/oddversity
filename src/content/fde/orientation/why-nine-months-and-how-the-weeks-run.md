---
title: Why nine months, and how the weeks run
phase: orientation
module: how-this-path-works
kind: lesson
summary: Nine months is a deliberate, aggressive target built around roughly twelve to fifteen hours a week, four stages, and a practice track that starts in week eight and never stops. Here is how the weeks actually run, and exactly what to skip if you can already code.
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Name the four stages of this path and the week range each one covers.
  - Explain why the weekly decomposition drill starts in week 8 and runs every week after, rather than waiting until Phase 06.
  - Decide, honestly, which weeks you can skip if you already write production code, and which you cannot.
artifact: A filled-in personal schedule in your journal, marking which weeks you will run as written and which you will fast-track, with the checkpoint you will use to justify each skip.
---

Nine months is not a number this path backed into. It is a bet, stated up front so you can argue with it.

## The honest premise

Vendors who coach the transition into this role estimate 6 to 12 months for someone already working as a software or solutions engineer, and 18 to 24 months for someone starting from a genuinely non-technical background. This path targets nine months, at roughly twelve to fifteen hours a week, which is close to five hundred hours total. That is fast for zero, and realistic for someone with some existing technical footing who commits the hours consistently rather than in bursts.

If you are further from zero than the path assumes, do not compress the schedule to force nine months. Compress the wrong weeks — Foundations, most often, because it is the part that looks most like things you can find elsewhere — and you will arrive at the field phase able to write code but unable to run a discovery conversation, which is the actual gate in every interview loop this path is built toward.

## The four stages

The path runs in four stages, and they are not evenly weighted, because the job is not evenly weighted.

**Stage 1, Foundations, weeks 1 to 12.** From nothing to "deployed a service unaided." Python, SQL, the shell, Git, HTTP, containers, one cloud, enough networking to debug inside a network you do not control. Sequenced for the field rather than for a CS degree: SQL and shell come before algorithms, because a live decomposition round and a debugging-under-pressure round both assume you already have these, and neither is a "study for it later" skill.

**Stage 2, Build, weeks 13 to 24.** Engineering craft under a deadline, enterprise data that lies to you, and AI application work where the eval comes before the build. This is where the path stops looking like a generic software course: the emphasis is calibration, restraint, messy exports, ontology modelling, and eval-driven development, not "how to call an LLM API," which you will have mostly picked up by week 21 anyway.

**Stage 3, The field, weeks 25 to 32.** Deploy into someone else's environment — a VPC, a customer-managed Kubernetes cluster, an air-gapped enclave — then run discovery, scoping and bootcamps against simulated customers, and close the loop by turning what you built into a memo about what generalises. This stage exists because nothing else in the learning landscape provides it: no course found in the research behind this path supplies a customer to practise discovery and decomposition against, and this tier is the one every FDE interview loop tests hardest.

**Stage 4, Hireable, weeks 33 to 36.** The interview loops company by company, the take-home with a recorded walkthrough, and the evidence portfolio assembled from everything the first three stages left behind.

## The week-by-week shape

| Weeks | Focus | Practice running alongside |
|---|---|---|
| 1 | Orientation, field kit, first journal entry | — |
| 2–5 | Python for the field, SQL without Googling | — |
| 6–8 | Shell and Linux, Git in other people's repos, HTTP and auth | First decomposition drill in week 8 |
| 9–12 | Containers, one cloud, networking; deploy a service unaided | Weekly drill |
| 13–16 | Engineering craft: ship, debug, make reliable, calibrate | Weekly drill, Bootcamp 01 |
| 17–20 | Enterprise data, connectors, domain modelling, identity and residency | Weekly drill, Bootcamp 02 |
| 21–24 | AI application engineering, eval first | Weekly drill, Capstones 01 and 04 |
| 25–27 | Deploying into someone else's environment | Weekly drill, Bootcamp 03, Capstone 02 |
| 28–31 | The customer: discovery to adoption | Bootcamps 04, 05 and 06, Capstone 03 |
| 32 | From one customer to product | Capstone 05, memos for every capstone |
| 33–36 | Getting hired: loops, take-home, portfolio, routes | Mock loops from the drill bank |

Two things about this table are easy to miss on a first read. The weekly decomposition drill starts in week 8, four weeks before Foundations even ends, and runs continuously from there — not because you are ready for it by week 8, but because live decomposition is the highest-weighted round in every interview loop covered later in this path, and a skill practised weekly for twenty-eight weeks looks nothing like the same skill crammed in for three. And the capstones and bootcamps are not sequenced last: Capstones 01 and 04 land in week 21 to 24, inside the AI-engineering stage, while Capstone 03 and three of the six bootcamps land during the field stage. The practice phase is cross-cutting on purpose. It is where the evidence portfolio actually gets built, and evidence takes weeks to accumulate, not days.

## What to skip if you already code

Be specific about what "already code" means before you skip anything. The bar is not "I have written Python." It is closer to: you can write a script that calls a paginated API with real error handling, you can join three tables and explain why your row count changed, you can read a stack trace and find the actual line, and you have deployed something to a cloud provider yourself, not watched someone else do it in a video.

If that describes you, here is what to fast-track, and how to check honestly rather than assume:

- **Skip weeks 2–5 (Python for the field)** if you can pass the lab at the end of that module cold: write a script pulling paginated, authenticated API data with retries and a timeout, without looking anything up beyond the API's own docs.
- **Skip weeks 6–8's SQL portion** if you can answer "second-highest value per category" with a window function, from memory, against a schema you have never seen, in under five minutes.
- **Skip the shell and Git modules** if `grep`, `awk`, `tail -f`, `ssh`, and resolving a rebase conflict are all things you do without opening a search tab.
- **Do not skip weeks 9–12 (containers, one cloud, networking) unless you have personally stood up a VPC, an IAM role and a container service, not just used one someone else configured.** This is the single most common gap even among otherwise strong engineers, and it is where the FDE-specific version of "unaided" gets tested.

What you cannot skip, no matter how strong your engineering background is: the weekly decomposition drill starting week 8, the entire field stage (weeks 25 to 32), and every capstone's eval-first requirement. These are the parts of the job that a normal software engineering career does not teach, and skipping them because the code around them looks familiar is the exact mistake this path exists to prevent. A strong engineer who fast-tracks Foundations correctly can realistically compress this path toward six months. A strong engineer who fast-tracks the field stage because "I've talked to customers before" usually finds out in an actual interview loop that talking to customers and running a scoped 45-minute decomposition under a rubric are not the same skill.

If you skip a module, write down in your journal what you used to justify it — the specific lab you passed, the specific thing you built before. Phase 08's evidence portfolio review will ask you to show that work, not just claim the skip was fair.
