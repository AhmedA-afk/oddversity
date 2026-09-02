---
title: The custom-to-self-serve funnel
phase: product
module: the-feedback-loop-in-practice
kind: lesson
summary: Every manual step you perform for a customer is a candidate for productisation. The funnel runs manual, runbook, script, configuration, self-serve, and each stage has a different owner and a different test for moving on.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Place any piece of deployment work on the manual-to-self-serve funnel and name what would move it one stage.
  - Instrument a deployment so you can say how many hours of FDE time each engagement actually costs.
  - Argue for the one step worth automating next, using time and repetition rather than elegance.
artifact: A funnel table for your current project listing every manual step, its stage, hours per engagement, and the trigger that would move it.
sources:
  - https://decagon.ai/blog/how-decagon-is-redefining-forward-deployment
  - https://finance.biggo.com/podcast/25bf3c9c39d661d1
  - https://nabeelqu.co/reflections-on-palantir
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
  - https://a16z.com/services-led-growth/
  - https://www.ycombinator.com/library/Mt-the-fde-playbook-for-ai-startups-with-bob-mcgrew
---

The previous page was about a single project: which of its parts should outlive the customer. This page is about the thing you are building across projects, which is a machine for needing fewer of you.

Bob McGrew's framing of the model, in his talk on the FDE playbook for AI startups, is "doing things that don't scale, at scale". The second half is where the funnel comes from. Doing things that do not scale is fine for one customer and fatal as a business, so the manual steps have to be walking, engagement by engagement, toward something a customer can do without you in the room.

## The five stages

Every task in a deployment sits at one of five stages. The stage is not about how hard the task is; it is about who can do it and how much of your attention it consumes.

**1. Manual, undocumented.** You do it. It lives in your head and your shell history. Everything starts here and most things should stay here for at least two customers, because the first version of a step is usually the wrong shape.

**2. Runbook.** Written down well enough that a colleague on another account can do it without calling you. Cheap to produce, and the single highest-leverage move most FDEs skip. A runbook also makes the next stage possible, because you cannot automate a process you have never described.

**3. Script.** Automated for you and your team, not for customers. Idempotent, checked into the repository, no secrets in it, runs the same on a laptop and in a container. The customer never sees it.

**4. Configuration.** The customer or their administrator changes the behaviour without an engineer. A settings page, a YAML file they own, a role mapping. This is the first stage where the customer's own people can move without you, and it is the stage most deployments never reach because it requires product to accept a surface.

**5. Self-serve.** The customer does the whole thing on their own from the product, and your team finds out it happened by looking at telemetry. New customers reach value without an engagement.

A useful discipline: nothing skips a stage. Attempts to jump from manual to self-serve produce the configurable engine nobody asked for, which is the same failure mode as generalising too early.

## Where the funnel came from

Palantir's Foundry is the largest worked example. Nabeel Qureshi, eight years an FDE there, describes the loop plainly: FDEs went to customer sites, did a lot of cruft work manually, and product engineers built tools that automated the cruft work. Magritte handled ingestion, Contour handled visualisation, Workshop handled building the little apps. Each of those is a manual step that walked the funnel. Gergely Orosz's survey of the role adds the timing: until roughly 2016 Palantir had more FDEs than traditional software engineers, and after Foundry shipped, more FDEs moved to core product work. The headcount ratio is the funnel's scoreboard.

The modern version is smaller and faster. Decagon split the FDE job into Agent Builders who configure agents inside the platform and Agent Software Engineers who productise what enterprises keep asking for, and reports that its Agent Development model cut the custom engineering work per agent by about 80%, with a promotional-policy change going from a full sprint to an afternoon. That is one vendor describing its own product, so treat the number as the company's claim rather than an independent measurement. The structural point stands regardless: they moved policy changes from stage 3 to stage 4, and the unit of work changed size.

## Instrument first, argue second

You cannot make this case with adjectives. Before you propose automating anything, spend one engagement writing down time.

Keep a plain tally. Task, stage, minutes, how many times you did it, whether it recurred at the previous customer.

```markdown
| Task                                   | Stage | Min | ×  | Seen before |
|----------------------------------------|-------|-----|----|-------------|
| Map their AD groups to our roles       | 1     | 240 | 1  | yes (3/3)   |
| Re-run ingestion after schema drift    | 1     | 45  | 11 | yes (2/3)   |
| Regenerate eval set after policy edit  | 2     | 90  | 4  | yes (3/3)   |
| Explain redaction to their DPO         | 1     | 120 | 2  | yes (2/3)   |
| Write the fixed-width parser           | 1     | 480 | 1  | no          |
```

Now the argument writes itself. The 45-minute task you did eleven times is 8 hours; it recurs across customers; it is at stage 1; it is the thing to automate. The 480-minute parser is expensive and unique, so it stays at stage 1 forever and that is correct.

This table is also the answer to a very common interview question about how you decide what to automate. "It felt repetitive" is not an answer. "It was 8 hours of my time in one engagement and it had recurred at two of the previous three customers" is.

## Triggers for moving a stage

Write the trigger down in advance so the decision is not made by whoever is most annoyed that week.

- **Manual to runbook:** you have done it twice, or you are about to go on leave, or a second FDE joins the account. Cost: an hour.
- **Runbook to script:** the step recurs within a single engagement more than about five times, or a mistake in it has already caused an incident. Cost: a day.
- **Script to configuration:** two named customers need the same behaviour with different values, and their administrators are competent to set it. Cost: a product surface, review, documentation, and support forever. This is the expensive door.
- **Configuration to self-serve:** new customers are configuring it correctly without an engagement, and the support load for it is near zero.

Notice that the last two triggers are about the customer's capability, not yours. A configuration surface handed to an organisation that has no one to operate it produces support tickets, not leverage. In an Indian public-sector or co-operative-bank deployment where the branch has no dedicated IT staff, stage 4 may be the wrong destination entirely, and the correct terminal stage is a script your delivery partner runs. Say so in the memo rather than pretending the funnel always ends at five.

## The margin argument, honestly stated

a16z's essay on services-led growth is the reason many companies started FDE teams: accept services-shaped cost early to earn a moat and a product later. The critics' version, which you should also hold, is that a services business with a software logo is still a services business. The funnel is the mechanism that decides which one you are in, and it is measurable. If the hours per engagement are flat across your first three customers, nothing is walking the funnel, and no amount of enthusiasm about the loop changes that.

So keep the tally, publish it, and let the trend be the argument.

## Do this now

For your current project, list every task you performed more than once. Assign each a stage and an honest minute count. Circle the single task with the highest minutes-times-recurrence that is still at stage 1. That is the one thing you propose next, and it goes at the top of your generalise-or-one-off memo.
