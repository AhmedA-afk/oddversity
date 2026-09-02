---
title: "The incident write-up: a template and a worked example"
phase: craft
module: reliability-and-observability
kind: reference
summary: A short, reusable incident write-up template, plus one fully worked example against the vendor field-rename failure from the debugging lab, showing what each section should actually contain rather than what it should be titled.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Write an incident report in under thirty minutes using a fixed structure, while the details are still fresh.
  - Distinguish a root cause from a contributing factor, and a symptom from either.
  - Turn an incident's action items into something that gets tracked, not a paragraph nobody revisits.
artifact: One incident write-up, filed against a real or lab failure, using the template below, kept as evidence of reliability practice in your portfolio.
---

Most incident write-ups fail for one of two reasons: they are written days later, once the details have blurred into a defensive summary, or they are written immediately but with no fixed structure, so the useful facts are scattered across a paragraph of prose written to explain rather than to document.

The template below fixes both problems. Fill it in within an hour of the incident closing, in this exact order, and keep every section short. A four-paragraph incident report that gets read is worth more than a two-page one that does not.

## The template

```markdown
# Incident: <one-line description>

**Date:**
**Duration:** <time from detection to resolution>
**Severity:** <impact on the customer, in their terms, not yours>
**Reported by:**
**Author:**

## Summary
One or two sentences. What broke, for whom, for how long.

## Timeline
UTC or IST, stated explicitly. Every entry is an observed fact, not an
interpretation.

| Time | Event |
|---|---|
| | |

## Impact
Who was affected, what they could not do, and any data implication.
State a number if you have one (records affected, requests failed).
State "unknown, still investigating" if you do not, rather than guessing.

## Root cause
The specific technical reason, stated as a fact you can point to
(a commit, a log line, a config value), not a general category like
"a bug" or "bad data."

## Contributing factors
What made this worse than it needed to be, or made it take longer to
find. Often process, not code: no alert existed, the runbook was
missing this case, nobody had access to the right dashboard.

## Detection
How was this found. By an alert, by a customer report, by chance.
If "by chance," that is itself a finding.

## Resolution
What was actually done to restore service. Link the fix (a diff,
a commit hash) if one exists.

## Action items
Each one has an owner and a form that can be verified as done, not
"improve monitoring" but "add a schema-drift alert on the inventory
ingestion job, owner: you, by Friday."
```

## What separates a root cause from a contributing factor

This is the section most write-ups get wrong, usually by stopping one level too shallow. "The vendor changed a field name" is a trigger, not a root cause, because a trigger you do not control will happen again regardless of what you do about it. The root cause is the reason your system could not absorb that trigger without failing: a parser with no tolerance for an unrecognised field, and no warning path short of a hard failure.

A contributing factor is something that made the incident worse or slower to resolve without being the reason it happened at all: no alert fired until store managers noticed at 9 a.m., or the on-call engineer had no access to the vendor's status page. Fixing a contributing factor makes the next incident shorter. Fixing the root cause makes this specific incident less likely to recur.

## A fully worked example

This continues the scenario from [Lab: the vendor changed a field name overnight](/roles/forward-deployed-engineer/craft/debugging-lab-the-vendor-changed-a-field-name).

```markdown
# Incident: Nightly inventory sync failed, morning report empty for 60 stores

**Date:** 2026-08-31 (overnight run) / discovered 2026-09-01
**Duration:** ~4 hours (02:00 job failure to 06:20 fix deployed)
**Severity:** All 60 store morning inventory reports were empty; no
reordering decisions could be made from the system until the fix landed.
No data loss; the source feed was still available once the parser was fixed.
**Reported by:** Store operations lead, via phone, 06:05
**Author:** [FDE on the account]

## Summary
The nightly inventory sync job failed at 02:00 because the vendor's
API changed a field name (`sku_code` to `item_code`) without notice.
The morning inventory report was empty for all 60 stores until the
parser was patched and the job re-run at 06:20.

## Timeline
| Time (IST) | Event |
|---|---|
| 02:00 | Nightly sync job runs, fails with `KeyError: 'sku_code'` |
| 02:01 | Job failure logged; no alert configured for this job |
| 06:05 | Store operations lead reports empty morning report by phone |
| 06:20 | Root cause identified: vendor renamed `sku_code` to `item_code` |
| 06:50 | Parser patched to accept both field names |
| 07:05 | Regression tests added for both payload shapes |
| 07:20 | Job re-run manually; staging table populated for all 60 stores |
| 07:35 | Morning report regenerated and verified against store counts |

## Impact
All 60 stores had no inventory report available from 02:00 until 07:35.
No reordering decisions were possible from the system in that window;
stores fell back to manual stock checks. No data was lost or corrupted.

## Root cause
The ingestion parser used a strict schema with no tolerance for an
unrecognised or renamed field, and failed the entire batch on the
first unparseable record rather than isolating it.

## Contributing factors
No alert was configured for this job's failure; the first signal was
a phone call from a store operations lead four hours after the job
failed. No schema-drift check existed to catch a vendor field change
before it caused a hard failure.

## Detection
By customer report, not by monitoring. This is itself a finding: a
job this important to daily operations had no failure alert.

## Resolution
Parser patched to accept both `sku_code` and `item_code`, normalising
to one internal field. See commit a1b2c3d. Job re-run manually for the
missed night; no duplicate records introduced.

## Action items
- Add a failure alert on the nightly inventory job, paging on-call
  within 5 minutes of a non-zero exit code. Owner: [FDE]. Done 2026-09-01.
- Add a schema-drift warning that logs any unrecognised field without
  failing the batch. Owner: [FDE]. Done 2026-09-01 (see lab).
- Ask the vendor's support contact whether a changelog or notification
  channel exists for schema changes. Owner: [FDE]. Due 2026-09-05.
```

## Filing it where it gets used

An incident write-up that lives only in your own notes helps nobody. File it somewhere the customer's team can find it too, even a shared folder or the repository's `incidents/` directory, and reference it by name in the runbook entry for the same failure. The next person who hits `KeyError: 'sku_code'`, possibly you on a different engagement entirely, should be able to find this document by searching the error message.

## Do this now

Write one incident report against a real failure from this phase's labs, using the template above, within thirty minutes of the failure being resolved. If nothing has broken yet, that is itself worth noting: an engagement with zero incidents after several weeks either means excellent engineering or means nobody is watching closely enough to notice the small ones.
