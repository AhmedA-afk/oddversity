---
title: "Generalise or one-off: the memo"
phase: product
module: the-feedback-loop-in-practice
kind: lesson
summary: For every piece of a deployment you have to decide whether it stays bespoke, becomes a configuration option, or becomes product. This is the judgement, the cost of getting it wrong in either direction, and the memo that records the call.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Sort every component of a deployment into bespoke, configurable, or product, with a stated reason.
  - Argue against generalising a component you personally built, using the cost of a wrong guess.
  - Write a one-page memo a product engineer can act on without having met the customer.
artifact: A generalise-or-one-off memo for one project, listing every component, its classification, the evidence, and the two calls you are least sure about.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://finance.biggo.com/podcast/cb47ec147e982d4d
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://review.firstround.com/so-you-want-to-hire-a-forward-deployed-engineer/
  - https://newsletter.eng-leadership.com/p/inside-openais-forward-deployed-engineer
  - https://tedmabrey.substack.com/p/sorry-that-isnt-an-fde
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
---

At the end of a deployment you are holding a pile of code that works for exactly one company. Some of it should stay that way forever. Some of it is the next release of your product wearing a customer's logo. Telling the two apart is the judgement the role is actually paid for, and it is the one thing on this path that no amount of engineering skill substitutes for.

There are two ways to get it wrong and they cost different things.

**Generalising too early** is the one practitioners name most often. Colin Jarvis, who leads OpenAI's forward deployed function, calls it the biggest error in the work: you build the configurable engine after one customer, ship a platform nobody asked for, and then spend a year maintaining abstractions that fit one real case and zero hypothetical ones. The tell is that your configuration options have exactly one value each in production.

**Never generalising** is the quieter failure and it is worse for you personally. Ritika Singh's line, quoted in Deep Engineering's piece on FDE hiring, is the summary: shipping without extracting the pattern makes you a very expensive contractor. Ted Mabrey's argument against companies copying the FDE title is the organisational version of the same point: most are replicating the form and not the function. A team that never generalises is a services team that costs product-engineering salaries.

## The three buckets

Every component you built goes in exactly one.

**Bespoke.** Stays with the field team, lives in the customer's repository or a per-customer directory in yours, and is allowed to be ugly. Kevin Bai, who came from Palantir to Anthropic and built Rippling's FDE team, describes the split this way: bespoke code stays with the FDEs, and the patterns that generalise get absorbed into the platform. Typical residents of this bucket: the parser for one bank's fixed-width core-banking export, the SAML quirk that only their identity provider has, the CSS that matches their brand guide, the cron that runs at 02:30 because that is when their nightly batch lands.

**Configurable.** The behaviour is common; the values are not. This is where a hard-coded thing becomes a setting: which fields are personally identifiable, what the escalation threshold is, which language the reviewer sees first, how many days of history to index. The test for this bucket is that you can name a second customer, from your own notes, who needs the same behaviour with a different value. Not an imagined customer. A named one.

**Product.** The capability itself is missing from the platform and more than one customer has hit the wall. This bucket costs the most to enter and should be the smallest. It requires a real requirement written by you, evidence from more than one origin, and a named engineer on the other side who agrees to own it.

## The evidence bar for each bucket

Write the bar down and hold yourself to it, because after four weeks on site you will be emotionally attached to your own abstractions.

| Bucket | What you must be able to show | What is not enough |
|---|---|---|
| Bespoke | Nothing. This is the default. | — |
| Configurable | Two named customers, from your customer-learning document, with different values for the same knob | "Someone will probably want this" |
| Product | Two or more customers blocked by the absence, plus a rough cost of the workaround, plus a named owner in product | One very loud customer |

The default matters. A component is bespoke until you produce evidence, not the other way round. That single rule prevents most premature platforms.

## The reuse targets, and what they are for

Jarvis states targets: roughly 20% reusable components in the first engagement, and about 50% by the third. Read them as an instrument, not a quota. They tell you whether your team is on the services slope or the product slope. If engagement three is still 20% reusable, either the customers are genuinely unrelated, in which case say so and change the segment you sell to, or nobody is extracting patterns, in which case you are a consultancy.

Do not game them. Counting your logging wrapper as "reusable" three times does not make the third engagement cheaper.

## The memo

One page. Written at the end of the engagement, ideally while the customer is still reachable to check a claim. First Round's guide for founders hiring FDEs makes the distinction between an FDE and a services engineer turn on whether services feed back into product development; this memo is the physical form of that feedback for a single project.

```markdown
# Generalise-or-one-off — Meridian Co-op KYC review assistant
FDE: <you>. Engagement: 2026-06-10 to 2026-08-22. Reuse estimate: 35%.

## Components

| Component | Bucket | Reason | Evidence |
|---|---|---|---|
| Core-banking fixed-width parser | Bespoke | Layout is specific to their 1998 core; vendor is EOL | none |
| Redaction of Aadhaar/PAN before the model call | Product | 3 of 4 India engagements blocked without it; DPDP exposure | Meridian, Arogya, SuryaTex entries |
| Reviewer queue with dual-language panes | Configurable | Same layout, different language pair | Meridian (kn/en), Halden (nl/en) |
| Eval harness for extraction accuracy | Product | Rebuilt from scratch on every engagement | all four |
| Brand theming | Bespoke | It is a brand | none |

## The two calls I am least sure about
1. Dual-language panes may be a layout preference, not a requirement.
   If Halden drops it at rollout, downgrade to bespoke.
2. The redaction step might belong in the customer's network, not our
   product. If so it is a reference architecture, not a feature.

## What I recommend product does next quarter
Own the eval harness. It is the component every engagement rebuilds,
it is the one customers ask to see during security review, and it is
the cheapest of the three to lift.

## What I recommend product does NOT do
Build a configurable ingestion framework. Four engagements, four
unrelated source systems, zero shared structure. Keep it bespoke.
```

The "what I am least sure about" section is not humility decoration. It is the part that survives contact with reality, because it tells the reader which of your claims to re-check in six months.

The "do not do" section is equally load-bearing. Ramp's team lists "always be scoping" and "question all requirements" among its principles; the same scepticism applies to your own output. A memo that recommends generalising everything you touched is a memo about your ego.

## How this reads in an interview

You will be asked, in some form, what you built that outlasted the customer. The memo is the answer, and it is a better answer than a demo, because it shows you can argue against your own work. Two follow-ups are near-certain: which call did you get wrong, and how did you find out. Have both ready. "I generalised the ingestion layer after one customer and the second customer's data made every abstraction wrong, so I deleted it and we shipped bespoke parsers" is a strong answer. It is a much stronger answer than a component nobody has stress-tested.

Write the memo for your current project before you read the next page. Even if the project is a capstone with a fictional customer, the muscle is the same, and the fictional customers in this path are built with a second and third customer in mind precisely so the evidence bar can be met honestly.
