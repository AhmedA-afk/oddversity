---
title: The feedback loop is the job
phase: orientation
module: what-it-is
kind: lesson
summary: The single thing that separates a Forward Deployed Engineer from a consultant is that what you learn in the field has to change the product. Here is why that loop exists, why companies drop it, and how to tell in an interview whether a company has it.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - State, in one sentence, what distinguishes an FDE from a solutions engineer or implementation consultant.
  - Explain how Palantir's Foundry came out of the loop, and what "generalising too early" costs.
  - Ask three questions in an interview that reveal whether a company's FDE team actually feeds product.
artifact: A one-paragraph definition of the role in your own words, in your journal. You will rewrite it after Phase 06 and compare.
sources:
  - https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87
  - https://nabeelqu.co/reflections-on-palantir
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
  - https://review.firstround.com/so-you-want-to-hire-a-forward-deployed-engineer/
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://tedmabrey.substack.com/p/sorry-that-isnt-an-fde
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
---

Ask ten people what a Forward Deployed Engineer is and you will get "an engineer who sits with the customer". That is true and it is not the definition. Solutions engineers sit with customers. Implementation consultants sit with customers. Sales engineers, customer engineers, professional-services teams: all of them sit with customers, and several of them write code.

The definition is one sentence. **An FDE is an engineer who ships inside the customer's environment and whose findings are required to change the product.** The second half is the job. Drop it and you have a consultant with a newer title.

## Where the loop came from

Palantir wrote the distinction down in 2019. Its core engineers, the "Devs", build "one capability, many customers". Its Forward Deployed Software Engineers, the "Deltas", deploy "one customer, many capabilities". Deltas sat in Business Development, not Product Development, and went on site three to four days a week.

Nabeel Qureshi, who was a Delta for eight years, describes what actually happened on those sites. FDEs did the "cruft work" by hand: pulling data out of hostile systems, cleaning it, joining it, wiring it into something a user could look at. Product Development engineers watched what the field kept doing manually and automated it. Magritte for ingestion, Contour for visualisation, Workshop for building apps: each came out of that loop. Foundry, the product Palantir now sells, is what the loop produced.

Two things follow. The field work was not the product, it was the *discovery* for the product. And the company only got a product because someone was required to look at the cruft and generalise it.

## Why companies drop the loop

The loop is expensive and slow, and it is the first thing that gets cut when an FDE team is measured on delivery.

Ramp's engineering team, which grew its FDE group from two to sixteen people in about eighteen months, ranks "generalise work" as a core principle and warns that the alternative is "product engineering scoping out mega-projects that took months to deliver". OpenAI's head of FDE puts a number on it: aim for roughly a fifth of an engagement's components to be reusable the first time, and about half by the third engagement. He also names the failure mode on the other side, "generalising too early", which produces a platform nobody asked for.

First Round's guide for founders hiring FDEs states the test plainly: the distinction between an FDE and a services engineer "lies in whether those services feed back into product development". A founder quoted there, Jake Stauch of Serval, is blunter: "The way I see an FDE is as an actual member of the software engineering team. Don't just force them into implementation."

The cleanest line comes from Ritika Singh of DataGOL, quoted in a piece on how FDE hiring goes wrong:

> Shipping without extracting the pattern makes you a very expensive contractor. Extracting patterns without shipping makes you an analyst.

Hold both halves. You have to ship, in their environment, on their data, under their deadline. And you have to come back with the pattern.

## What "feeding product" looks like day to day

It is not a quarterly review. In the accounts this path is built on, it looks like:

- **A written record.** A weekly document of what customers said, in their words, with the request tagged by which customer it came from. HappyRobot's FDE playbook logs every feature request by origin so the fifth customer asking for the same thing is visible as a pattern, not five surprises.
- **Specific, not vague, feedback to the people who can act.** OpenAI's FDEs are expected to hand research "specific problem details rather than vague customer issues". "The model is bad at tables" is useless. "Given these 20 labelled examples of supplier invoices, it mis-reads the tax column when the column header wraps" is a bug report someone can fix.
- **A memo per project.** Which parts of this build were specific to this customer, which parts three other customers would need, and which parts should become a configuration option rather than code. You will write one of these for every capstone in this path.
- **Making yourself unnecessary.** OpenAI's head of FDE says that if an FDE is needed again for the same problem, "the initial solution was incomplete". That is an odd incentive for a career, and it is the correct one for the role.

## The rebuttal to the critics, and its limit

Engineers outside the role call it a rebranded solutions architect, a consultant in a fresh uniform, "military-branded marketing fluff". Read those threads; Phase 00 links them. They are often right about the specific company they are describing.

The honest defence is not that FDEs do not do services work. They do, most of the week. The defence is that the services are *required* to change the product, and that an FDE team without that requirement is a services team regardless of what the postings say. Ted Mabrey, Palantir's head of commercial, made this argument against the companies copying the title: most "are replicating the form but not the function".

So the critics are describing the form. The role is the function. Your job, in the interview and in the seat, is to find out which one you are looking at.

## Three questions that reveal whether the loop exists

Ask these, in this order, of anyone hiring for the title.

1. **"What is the last thing the FDE team shipped that changed the core product?"** A real answer names a feature, a default, an SDK method, an eval set. A vague answer ("we give lots of feedback") means the loop is aspirational.
2. **"Who does the FDE team report to?"** Engineering or an applied-AI leader is the common pattern at the labs and most AI startups. Reporting into sales is not disqualifying, but it predicts quota-shaped incentives; across a thousand postings analysed in late 2025, none carried a quota, and that is a feature of the role worth protecting.
3. **"How many FDEs are there relative to product engineers?"** A team that is mostly FDEs is a consultancy that sells software, whatever it calls itself. One practitioner's rule: if a company has significantly more FDEs than product engineers, that is what it is.

Write your own one-paragraph definition of the role now, before you know any more. You will rewrite it after the field phase and see what changed.
