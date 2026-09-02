---
title: "Drill: ten customer requests, size each one in two minutes"
phase: craft
module: calibration-and-restraint
kind: drill
summary: "Ten realistic customer requests, from a co-operative bank to a global logistics IT director. Size each one, in two minutes, as script, small service, real project, or do-not-build, then check your reasoning against the rubric and the argued answers."
duration: 40 min
updated: "2026-09-02"
outcomes:
  - Size a customer request into one of four categories in under two minutes, using a fixed set of signals rather than instinct alone.
  - Recognise the specific phrasing patterns that signal a "do not build" request in disguise as a normal one.
  - Defend a sizing decision against a plausible counter-argument for a bigger or smaller build.
artifact: A ten-row sizing sheet in your journal, with your category and one-sentence justification for each request, timed against a two-minute clock per row.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Set a timer for two minutes per request. Read it once, decide a category, write one sentence justifying it, and move on. Do not go back and revise earlier answers once you have read a later one; the point of the two-minute limit is to practise the speed at which these calls actually get made, not to produce a polished analysis. The rubric and argued answers are below the requests; do not read them until you have sized all ten.

## The four categories

- **Script.** A one-off or infrequent task, run by you or one named person, with a cheap cost if wrong.
- **Small service.** A recurring, scoped need with a clear owner and interface, built for the currently known cases, not speculative ones.
- **Real project.** Requires durable infrastructure: auth, a data model that outlives one request, multiple stakeholders, or compliance exposure if done casually.
- **Do not build.** The request is better solved by a process change, a policy decision, an existing vendor feature, or belongs to the product team rather than a one-off engagement, at least not now.

## The ten requests

**1. Suhas Vaidya, COO, Nandini Co-operative Bank (140 branches, Maharashtra):**
> "Can you write something that pulls yesterday's failed UPI transactions into one CSV every morning, before our 9 a.m. ops call?"

**2. Priya Deshmukh, Head of Compliance, a US wealth management firm:**
> "We need every instance of an advisor overriding a model recommendation logged permanently, with the ability for our audit team to search it by advisor, date, and client."

**3. Rajan Mehta, Finance Lead, a mid-size textile exporter:**
> "Every quarter, someone on my team spends two days manually re-typing our shipment numbers between our accounting software and the buyer's procurement portal. Can that be automated?"

**4. Meera Kulkarni, IT Head, an eleven-hospital network in Maharashtra:**
> "We want patients across all eleven hospitals to book, cancel, or reschedule appointments over WhatsApp, with a handoff to a human receptionist if the bot can't resolve it."

**5. An operations analyst at a European logistics firm, mid-audit:**
> "For this week's regulator audit, I just need last month's driver hours totalled by depot. One-time thing, they want it by Thursday."

**6. Head of Ops, a mid-size airline:**
> "Whenever a flight is delayed more than two hours, can the system automatically text every passenger on the connecting flight that they might miss it?"

**7. VP of Security, a global SaaS company with enterprise customers:**
> "Our biggest customers keep asking for their own SOC 2 evidence exports. Can you build a self-serve dashboard where any customer can generate one on demand?"

**8. Operations Manager, a US outpatient clinic:**
> "We get faxed prior-authorisation requests all day. Can you build something that reads them and auto-approves the ones that meet our criteria?"

**9. District Development Officer, a state government office (India):**
> "About twice a month we get a new signed PDF circular from the state office. Can you turn each one into structured data we can search?"

**10. IT Director, a global logistics customer, mid-scoping-call:**
> "Rather than building three separate connectors for our three current systems, could you build something generic, so that whatever data source we add in the future just plugs in without new code?"

## The rubric

Score each answer 0-2 on four criteria, 8 points total.

1. **Category fit (0-2).** Does the chosen category match the signals in the request: who runs it, how often, what breaks if it is wrong.
2. **Justification quality (0-2).** Is the one-sentence reason specific to this request, or a generic label that would apply to almost anything ("this seems important" is not a justification).
3. **Speed discipline (0-2).** Was the two-minute limit respected, or did the sizing require going back and forth, which on a real call you will not have time for.
4. **Trap avoidance (0-2).** Did the answer notice the specific wording pattern that makes this request larger or smaller than its surface phrasing suggests.

A strong run scores 6 or higher across most of the ten. Scoring low on trap avoidance specifically, even with a plausible category chosen, is worth reviewing closely: it means the right answer was reached by luck rather than by reading the request correctly.

## Answers, argued

**1. Script.** One person, a daily but low-stakes pull, and a wrong or delayed result costs a redo, not a decision made on bad data. A cron job and a CSV export closes this. Building an ongoing dashboard for a request phrased as "before our 9 a.m. call" over-solves a need that is really "I need this number, reliably, once a day."

**2. Real project.** The word "permanently" and "audit team" are the signals: this is a durable, searchable, compliance-relevant record with a data model that has to outlive any single request and be defensible under regulatory review. A script that appends to a spreadsheet fails the moment someone asks it a real audit question. This needs proper storage, access control, and a retention policy, not a quick build.

**3. Small service.** Recurring (quarterly), scoped to two known systems, with a clear, bounded interface: read from one, write to the other. It is not a script because "someone remembers to run it quarterly" is exactly the kind of manual step this request exists to remove. It is not a real project because there is no compliance exposure and no third system waiting to be added; building for a currently unconfirmed fourth system would be the calibration mistake from the previous lesson.

**4. Real project.** Multi-channel (WhatsApp plus human handoff), spans eleven sites, and directly touches patient scheduling, which carries real consequences if it fails silently (a missed appointment, a duplicate booking). This needs durable infrastructure, monitoring, and a rollback plan, not a fast build. Treat any request that touches patient-facing scheduling across multiple sites as a real project by default, and argue down from there only with strong evidence the scope is genuinely narrower.

**5. Script.** "For this week's audit," "one-time thing," and a hard Thursday deadline are explicit one-off signals. Build a query, run it once, hand over the CSV. Resist the pull to make it a recurring report unless someone separately confirms this audit cadence repeats; that confirmation has not happened here.

**6. Small service.** Recurring and automated, but scoped: one clear trigger (a delay event), one clear action (a text to a defined passenger set), no new data model beyond what the airline's existing systems already hold. It edges toward real project only if the messaging system also has to handle opt-outs, multi-language content, and regulatory SMS consent per country, in which case ask which of those apply before finalising the size; the two-minute call is "small service, confirm consent handling before building."

**7. Do not build**, at least not as posed. A generic self-serve compliance-evidence dashboard for "any customer" is a product feature request wearing an engagement's clothing: it needs product ownership, a security review of its own, and a roadmap commitment, not a bespoke build inside one account. The right response is to scope down to the actual, current ask (one customer's specific evidence need, this quarter) or to route the broader idea to the product team as a generalisable pattern, per [Restraint, now that building is cheap](/roles/forward-deployed-engineer/craft/restraint-when-ai-makes-building-cheap).

**8. Do not build**, as stated. "Auto-approves" on prior authorisations is a request to make an unsupervised clinical-adjacent decision with real financial and care consequences if wrong, in a heavily regulated US healthcare context. The defensible version keeps a human in the loop: flag and pre-fill the ones that meet clear mechanical criteria, and route everything else, with every auto-flagged case still requiring sign-off. Say this to the stakeholder directly, the way the compliance officer in the co-operative bank scenario elsewhere in this path had to be told the same thing about identity decisions.

**9. Script**, leaning small service if the twice-monthly cadence is confirmed to continue indefinitely. Low frequency, one clear owner, and a document-to-structured-data conversion that can be a bounded script triggered manually when a new circular arrives. It is not a real project unless the office later asks for a searchable historical archive across years of circulars, which is a different, larger request than what was actually asked.

**10. Do not build**, and this is the classic configurable-engine trap from the previous lesson, restated almost verbatim. Three known systems exist right now. Build three connectors for those three, cleanly. A generic plug-in framework for hypothetical future sources is exactly the "two-week configurable engine" Vinoo Ganesh's calibration story warns against, built speculatively against a future nobody has confirmed. If a fourth and fifth source materialise later with a genuinely common shape, generalise then, from real cases instead of a guess made on a scoping call.

## Common failure patterns

**Sizing by stated urgency instead of actual scope.** A hard deadline ("by Thursday") signals nothing about whether the underlying need is one-off or recurring; requests 5 and 1 both have deadlines and both are still scripts because of who runs them and what breaks if wrong, not because of when they are due.

**Missing the liability signal in "auto."** Any request using the word "auto-approve," "auto-decide," or "automatically" attached to a decision with real consequences (identity, medical authorisation, financial disbursement) deserves a second look before sizing, because the honest answer is often "not fully automated, ever," regardless of how the request was phrased.

**Building the generic version because it sounds more capable.** Request 10 is the purest form of this trap: the stakeholder is explicitly asking for the bigger, more impressive-sounding system, and the correct professional answer is to say no to that framing and build the three concrete connectors instead.

**Treating "do not build" as refusal rather than redirection.** A do-not-build answer that stops at "no" is a weak answer. [Saying no with an alternative](/roles/forward-deployed-engineer/field/saying-no-with-an-alternative) is the skill that pairs with this drill: every do-not-build call above comes with a scoped-down version that still delivers real value this week.
