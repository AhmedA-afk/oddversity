---
title: Reading a codebase in an afternoon
phase: craft
module: debugging-unfamiliar-systems
kind: lesson
summary: A fast, repeatable way to get useful working knowledge of a system you did not write, in the hours you actually have before a fix or a demo is due.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Produce a working mental model of an unfamiliar service's entry points and data flow inside an afternoon.
  - Build a data dictionary from a legacy schema without a design document to work from.
  - Decide, honestly, when "good enough" understanding has been reached and it is time to change code.
artifact: A one-page notes file for a codebase you did not write, covering entry points, data flow, and the three riskiest places to change something, produced in under three hours.
sources:
  - https://github.com/goday-org/FDE-Handbook
  - https://finance.biggo.com/podcast/cb47ec147e982d4d
---

Kevin Bai, who built Rippling's forward deployed team after years at Palantir, puts the working reality plainly: FDEs "never write software from scratch." The job is almost always extending, patching, or integrating with a platform someone else built, sometimes years before you arrived. You inherit code the way a locum doctor inherits a patient chart: mid-story, with gaps, and with a decision due before you finish reading.

This lesson is a method for getting useful, not complete, understanding of a codebase in an afternoon. Complete understanding is not the goal and rarely the available option. Useful understanding is: you can predict what a change will affect, you know where the risk lives, and you can explain the system's shape to someone else in five minutes.

## Start from what runs, not what is written

The instinct is to open the repository and start reading files top to bottom. Do not. Start from execution.

1. **Find the actual entry points.** Not the file structure, the running process. What starts when the service boots? What handles an incoming request? `grep` for the framework's route decorators, the `main` function, or the process manager's config, whichever applies.
2. **Run it, if you possibly can.** A README that lies is common; a service that starts anyway tells you more in one command than an hour of reading. If it will not start, the reason it will not start is itself the first useful finding, because it usually points at an undocumented dependency.
3. **Read the tests before the implementation.** Tests are a description of intended behaviour written by someone who understood the system when they wrote them. A test suite with real assertions, not just smoke checks, is a faster map than the source.

## Follow one request end to end

Pick the single most important thing the system does, the one operation a customer would actually notice if it broke, and trace it from the outside in: the request that arrives, the first function that touches it, every system it calls out to, and where the response comes from. Do this with a debugger, with log statements, or by adding a single `print` at each hop if nothing else is available.

This single trace is worth more than reading every file, because it tells you the actual shape of the system rather than its aspirational shape. Layered architecture diagrams in a README frequently describe how the system was supposed to be built. The trace tells you how it actually behaves, including the shortcut someone took under their own deadline two years ago.

## The data dictionary in a day

A large share of unfamiliar-codebase work in the field is a legacy database with no current documentation: a schema built by a vendor's own team, extended for a decade, with column names that stopped meaning what they say. Producing a data dictionary is the single highest-leverage document you can write in this situation, because it becomes the shared reference everyone else on the account uses too.

```sql
-- get the shape fast: tables, row counts, and last-write time
SELECT table_name,
       (xpath('/row/cnt/text()', xml_count))[1]::text::int AS approx_rows
FROM (
  SELECT table_name,
         query_to_xml(format('SELECT count(*) AS cnt FROM %I.%I', table_schema, table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
) t;
```

For each table that matters, record: what a row represents in plain business language, which columns are actually populated versus always null, which foreign keys are enforced versus implied by naming convention only, and which column names lie about their contents (a `status` column that actually stores a free-text note is not rare). Do this for the five or six tables that carry the real workload, not all forty in the schema. A partial dictionary you finish beats a complete one you do not.

## git log and blame as an oral history

`git log --follow` on a file and `git blame` on the confusing lines are the closest thing you will get to interviewing the original author, who is usually unavailable. A commit message that says "workaround for vendor API bug, remove after Q3" tells you something a docstring never will: this code is deliberately ugly, on purpose, for a reason that may or may not still hold.

```bash
git log --oneline --follow -- path/to/confusing_file.py | head -20
git blame -L 40,60 path/to/confusing_file.py
```

Read commit messages for the words "temporary", "hack", "TODO", and "workaround." They mark the parts of the system someone already knew were fragile, which makes them the parts most likely to break when you touch them, and the parts most useful to ask the customer's own engineers about directly.

## Deciding "good enough"

The goal for this exercise is not mastery, it is a specific, testable claim: "I can predict what this change will affect, and I know the two places most likely to break if I get it wrong." When you can say both sentences honestly about the part of the system you are about to touch, stop reading and start working. Verify the claim with the smallest change you can make and observe, before committing to the larger one.

Under-reading is the more common failure among engineers new to this work, not over-reading, because the deadline pressure pushes toward action before orientation. But over-reading is real too: three hours spent understanding a module you will never touch is three hours not spent shipping the fix the customer is waiting on. The afternoon budget in this lesson's title is not a suggestion. It is meant to force the choice.

## Do this now

Take a codebase you have never worked in, ideally one from an earlier lab in this path or an open-source project with real users. In under three hours: find and run the entry point, trace one real request end to end, and write a data dictionary for whichever tables that request touches. Keep the notes file. You will use the same method, under worse conditions, in [Lab: the vendor changed a field name overnight](/roles/forward-deployed-engineer/craft/debugging-lab-the-vendor-changed-a-field-name).
