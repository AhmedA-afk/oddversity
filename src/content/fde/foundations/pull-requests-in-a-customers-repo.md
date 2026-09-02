---
title: "Pull requests in a customer's repo: small, reviewable, reversible"
phase: foundations
module: git-and-other-peoples-repos
kind: lesson
summary: "In a customer's repository your pull request is read by people who did not hire you, do not know your context, and can block your deadline. Small, reversible changes with a description that answers a reviewer's real questions get merged; large ones sit."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Scope a change so a reviewer can approve it in under fifteen minutes.
  - Write a pull request description that answers what changed, why, how it was verified, and how to undo it.
  - Read a repository's conventions from its own files before your first commit.
artifact: A pull request description template in your journal, plus a checklist of the six things to read in an unfamiliar repository before opening one.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
---

A pull request in your own repository is a formality. A pull request in a customer's repository is a negotiation with people who have no obligation to prioritise you, are already sceptical that the vendor's engineer understands their codebase, and are the ones who get paged at 2am if your change is wrong.

Accounts of the job describe pull-request review as an ordinary part of the week for deployed engineers, not an afterthought. That is worth taking seriously, because the pull request is where two things get decided at once: whether your code lands, and whether this team believes you are careful.

## Read the repo before you write in it

Before your first commit, spend twenty minutes finding out how this team works. The repository will tell you, if you look at it rather than at the code.

1. **`CONTRIBUTING.md`, `README`, and any `docs/` directory.** Branch naming, commit message format, how to run the tests. If the repo asks for Conventional Commits, use them; a change that ignores the stated convention signals you did not read the file.
2. **`git log --oneline -50`.** How large is a typical commit? Are messages one line or a paragraph? Is history linear (they rebase or squash) or braided (they merge)?
3. **`CODEOWNERS`.** Which humans are required to approve which paths. This tells you who to talk to before you write, not after.
4. **The CI configuration** (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`). Which checks run, and how long they take. If the suite takes forty minutes, your review loop is measured in hours and you should batch differently.
5. **The last five merged pull requests.** The single best source of truth. What did an accepted change look like? How much description did it have? Did reviewers ask for tests?
6. **Linter and formatter configuration.** Nothing wastes a review like a diff that is ninety percent whitespace because your editor reformatted a file on save. Install the repository's formatter before you touch anything.

## Small, for a reason that is not aesthetic

"Keep pull requests small" is standard advice everywhere. In an engagement it has a specific mechanism behind it.

A reviewer's attention is not linear in diff size. A hundred-line change gets read line by line. An eight-hundred-line change gets skimmed and approved, or, more often in a customer environment, gets left alone until the reviewer has a free afternoon, which is next week. You do not have next week.

Small also means **reversible**, and reversibility is what buys you permission to move fast in a system you do not own. A reviewer who can see that your change is one file, behind a flag, with an obvious revert, will merge it on a Tuesday. The same reviewer will not merge a change that touches the authentication middleware, the database schema and the export job in one commit, because they cannot undo any part of it independently.

Practical decomposition rules that hold up in the field:

- **Separate mechanical from meaningful.** If your change requires renaming a function used in thirty places, do the rename in its own pull request that changes no behaviour, and say so in the title. Then the real change is a twelve-line diff.
- **Schema changes ship before code that uses them.** Additive migration first (add the nullable column), then the code that writes to it, then the code that reads from it, then the backfill, then the constraint. Each step is independently revertible. A single pull request doing all five cannot be rolled back at all once it has run in their environment.
- **New behaviour goes behind a flag or a new endpoint.** Adding `/v2/invoices` next to the existing endpoint is a much smaller ask than changing what `/invoices` returns, and it lets the customer test on their schedule.

## The description a reviewer actually needs

The reviewer's questions are always the same four. Answer them in that order and you will rarely get a "what is this?" comment.

```text
## What
One or two sentences. What behaviour is different after this merges.

## Why
The ticket, the incident, or the conversation. Name the person who asked
if it came from a conversation: "raised by Priya in Tuesday's ops sync".

## How it was verified
The exact commands or steps you ran, and what you saw. Screenshots for UI.
"Ran the nightly export against a copy of the Feb data: 41,882 rows, tax
column non-null on all of them. Previously 3,110 nulls."

## Risk and rollback
What could break, what is behind a flag, and the one command that undoes it.
```

That last section is the one most engineers skip and the one that most changes how a customer's team reacts to you. Naming your own risk is not weakness; it is the thing that makes a reviewer trust the rest of your assessment. "The only path that touches production data is the backfill script, which is not run by this PR. Revert is `git revert` of this merge commit; no migration to unwind" is a sentence that gets code merged.

Keep the tone plain. Do not sell. The description is for a colleague, not a stakeholder.

## Reviews are where you learn the system

You are new. The reviewer knows why that odd branch in the payment path exists. Treat every comment as free domain knowledge and reply to all of them, including the ones you disagree with.

Some habits that work:

- **Reply to every comment, even with "done".** Silence reads as ignored.
- **When you disagree, ask rather than assert.** "I kept the retry here because the upstream API returns 502 under load. Is there a reason to prefer failing fast?" The answer is often "yes, and here is the incident from last year", which you needed to know.
- **Do not force-push during an active review** unless the team asks for it. Force-pushing destroys the reviewer's ability to see what changed since their last look. Push follow-up commits, and squash at merge time if the repo squashes.
- **Ask for a review explicitly, once, in their channel**, with a one-line summary and the link. Not five reminders.

## Getting access before you need it

The single most common blocker on a first engagement is not technical. It is that on day three you have code to push and no permission to push it, and the person who can grant it is on leave.

On day one, ask for four things in writing, in one message: repository read access, the ability to push a branch or a fork, the ability to open a pull request, and the name of the person who reviews changes to the area you will touch. Then verify each one immediately by actually doing it, with a trivial no-op branch if necessary. Access that has been granted in a ticket and access that works are different states of the world, and you want to discover the gap on day one rather than on the day of the demo.

If push access to the main repository is genuinely not going to happen, fork early and keep your fork synced daily. A three-week-old fork is a merge problem all by itself.

## What good looks like

By the end of this module you should be able to walk into a repository you have never seen, spend twenty minutes reading how the team works, open a change of under two hundred lines that follows their conventions, describe it in four sections, and answer review comments the same day. That is a demonstrable skill and it comes up in interviews as "tell me about contributing to a codebase you did not own". The lab that follows makes you do exactly that in a real open-source repository, where the reviewers are strangers and the standards are public.
