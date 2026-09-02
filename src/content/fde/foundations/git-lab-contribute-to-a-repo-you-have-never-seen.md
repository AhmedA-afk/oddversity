---
title: "Lab: contribute a fix to a repo you have never seen"
phase: foundations
module: git-and-other-peoples-repos
kind: lab
summary: "Find a real open-source project you have never used, understand its contribution rules, fix one small genuine thing, and get it reviewed by strangers. This is the closest free simulation of your first week inside a customer's codebase."
duration: 4 h
updated: "2026-09-02"
outcomes:
  - Orient yourself in an unfamiliar repository in under thirty minutes using its own files.
  - Ship a small, reversible change that follows conventions you did not set.
  - Respond to review from someone who has no obligation to be gentle, and land the change.
artifact: A merged or open pull request in a public repository you did not create, linked from your portfolio, plus a one-page write-up of what you had to learn before you could write a single line.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

You will spend most of your career as a Forward Deployed Engineer writing code in repositories other people built, under conventions you did not choose, reviewed by engineers who were not consulted about hiring you. There is no way to practise that at home except by doing it in public.

This lab is four hours. Most of it is not coding.

## Choosing a target

Rules for the repository you pick:

- **You have never contributed to it, and ideally have never used it.** The point is to feel the disorientation.
- **It is active.** Commits within the last month, and merged pull requests from outside contributors within the last three months. A dead project will not review you.
- **It has a `CONTRIBUTING.md` and CI.** You want the friction.
- **It is not enormous.** A hundred-thousand-line framework will eat your four hours in build configuration. Something in the range of a few thousand to fifty thousand lines is right.
- **It is in a language you can read.** Python is fine. So is a documentation-heavy repo where the fix is in code samples.

Good hunting grounds: the `good first issue` and `help wanted` labels on GitHub, the issue trackers of Python libraries you have used in the Python module, and CLI tools you already have installed. Avoid the very largest projects with hundreds of open first-issue PRs; your review will never come.

A legitimate contribution can be small. A broken code sample in the README, a docstring that documents a parameter that was renamed two releases ago, an error message that does not say which file failed, a test that silently passes because of an inverted assertion. These are real fixes and they are reviewed like real fixes.

## Steps

**1. Orient before you clone (20 minutes).**
Read, in this order: the README, `CONTRIBUTING.md`, the last twenty merged pull requests, and the CI configuration. Write down four things in your journal before going further: how they name branches, whether they squash or merge, which command runs the tests, and who reviewed the last three outside contributions.

**2. Get it running (45 minutes, and this is the part that overruns).**

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
```

Then follow *their* setup instructions exactly, even where you would do it differently. If they say Poetry, use Poetry. Run their test suite and get it green before you change anything:

```bash
python -m pytest -q
```

If the suite is red on a clean checkout, that is itself worth knowing and sometimes worth reporting. Do not start work on top of a broken baseline without saying so.

**3. Find one small real problem (30 minutes).**
Either take an existing issue labelled for newcomers, or find your own from step 2: something that confused you during setup is very often a genuine documentation bug and you are, right now, the only person in the world with fresh eyes on it.

Comment on the issue, or open one, saying in two sentences what you intend to change. This is the equivalent of checking with a customer's tech lead before touching their code. It takes two minutes and it prevents you spending three hours on something they have already decided against.

**4. Branch and change (60 minutes).**

```bash
git checkout -b fix/readme-install-command
```

Use their naming convention, not this one. Change as little as possible. Do not reformat surrounding code. Do not fix the three other things you noticed; note them for separate pull requests.

If the project has tests, add or adjust one so the fix is demonstrated by a test that fails without your change. Verify that claim literally: stash your fix, run the test, watch it fail, restore the fix, watch it pass.

**5. Verify with their tooling (20 minutes).**
Run the formatter, the linter and the full test suite, exactly as CI will.

```bash
git diff --stat
```

Read your own diff line by line before anyone else does. Every line should be one you can defend. Delete stray debug prints, reverted experiments and whitespace churn.

**6. Open the pull request (20 minutes).**
Use the four-section description from the previous lesson: what, why, how verified, risk and rollback. On a small open-source fix, "risk and rollback" may be one line, and that is fine; write it anyway, because the habit is what you are building.

**7. Respond to review (rest of the time, over days).**
Reply to every comment. Make requested changes promptly. If maintainers are silent for a week, one polite follow-up, then leave it. An open pull request that follows the rules is still evidence.

## Definition of done

You are finished when all of these are true.

- A pull request exists in a repository you did not create, from a branch named the way that repository names branches.
- The diff is under 200 changed lines and touches the smallest reasonable number of files.
- CI is green on your branch, on their pipeline, not just locally.
- The description has all four sections, and the verification section names the exact command you ran and what you saw.
- You have replied to every review comment, including any you disagreed with, and you disagreed by asking a question rather than by asserting.
- Your write-up exists: one page covering what you had to learn before writing a line, what their conventions were, how long setup took, and one thing about the project's process you would adopt or avoid in a customer engagement.

Merged is better than open, but merge timing is not under your control and does not gate this lab.

## How this could go wrong

**You pick a project that is too big and spend four hours on a build.** Time-box step 2 at ninety minutes. If it is not running by then, abandon it and pick another. Knowing when to abandon is itself the skill; on an engagement you would escalate at that point rather than burn a day silently.

**Your editor reformats the whole file.** This is the single most common way a first contribution gets rejected. Check `git diff --stat` before committing; if a one-line fix shows 240 changed lines, your formatter is fighting theirs. Configure your editor to use the repo's settings, or turn off format-on-save for this project.

**You fix five things.** A pull request that fixes a typo, renames a variable, adds a dependency and refactors a function is unreviewable. Maintainers close these. One change per pull request.

**You argue.** A maintainer says "we prefer not to do it this way." You have two good options: do it their way, or ask why in one message and then do it their way. There is no third option that ends well, and the same is true in a customer's repository where the stakes are higher.

**You ghost.** Opening a pull request and disappearing when review arrives is worse than not opening one. Only start this lab in a week where you can respond within a day.

**You cannot get anything merged anywhere.** Fine. Do the lab against a project's documentation instead, or against a small tool with an active single maintainer. The learning is in the orientation and the conventions, and those happen whether or not a stranger presses the green button.

## Why this is in the path

Deployed-engineer sources describe the foundation skill as Git *in someone else's repository*, not Git in the abstract. The distinctive thing about the job is that you arrive with no context, no credibility and a deadline, and you have to produce a change that a wary local engineer is willing to own after you leave. Four hours in a stranger's open-source project is the cheapest rehearsal available for exactly that, and unlike most rehearsals it leaves a public artifact with your name on it.
