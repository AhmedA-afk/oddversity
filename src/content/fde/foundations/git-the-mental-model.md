---
title: "Git: the mental model that makes the commands obvious"
phase: foundations
module: git-and-other-peoples-repos
kind: lesson
summary: "Git looks like forty unrelated commands until you know what a commit, a branch and HEAD actually are. Three objects and one pointer explain nearly all of it, and they are what let you recover when you break a customer's repository."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Explain what a commit, a branch and HEAD are, and why a branch is cheap.
  - Move a change between the working tree, the index and a commit on purpose rather than by trial and error.
  - Recover a commit you think you destroyed, using reflog.
artifact: A scratch repository in which you have deliberately lost and recovered a commit, with the commands you used saved in your journal.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Most people learn Git as a phrasebook. `git add .`, `git commit -m`, `git push`, and when something goes wrong, delete the folder and clone again. That works until the day you are on a customer's laptop, on their VPN, in their monorepo, and deleting the folder means losing four hours of work that exists nowhere else because you have not been allowed to push yet.

Git is small underneath. Learn the model once and the commands stop needing to be memorised.

## Three things and one pointer

**A commit is a snapshot of the whole tree, plus a parent.** Not a diff. Git stores the full state of every tracked file at that moment (deduplicated by content, so this is cheaper than it sounds), together with an author, a message, and the identifier of the commit that came before it. The diffs you read in a pull request are computed on demand by comparing two snapshots. This is why `git show` is fast and why a commit can never "lose" a file that was in it.

**A branch is a movable label pointing at one commit.** That is the entire implementation: a file containing a forty-character commit ID. `main` is not a place where code lives; it is a sticky note stuck to one snapshot. When you commit, the label moves forward to the new snapshot. Creating a branch writes forty bytes, which is why branching is free and why nobody should be precious about it.

**HEAD is the pointer that says where you are.** Normally HEAD points at a branch name, and that branch points at a commit. When HEAD points straight at a commit instead of at a branch, Git calls that "detached HEAD", and the only thing that is unusual about it is that new commits have no label following them, so they are easy to lose track of.

Add one more idea and you have the whole picture:

**The index (the staging area) is a proposed next commit.** There are three states of a file at any moment: what is on disk (working tree), what is staged (index), and what is in the last commit (HEAD). Most confusing Git moments are just uncertainty about which of the three you are looking at.

```bash
git status              # differences: HEAD vs index, and index vs working tree
git diff                # working tree vs index (what you have NOT staged)
git diff --staged       # index vs HEAD (what you HAVE staged)
git diff HEAD           # working tree vs HEAD (everything uncommitted)
```

Run those four in a dirty repo, in that order, once. The output pattern will make the three-state model concrete faster than any diagram.

## The commands, re-read through the model

Once you accept "commits are snapshots, branches are labels, HEAD is where I am", the command surface collapses.

- `git checkout -b fix/invoice-tax` creates a new label at the current commit and points HEAD at it. Nothing is copied. Modern Git spells this `git switch -c fix/invoice-tax`; both work.
- `git commit` writes a new snapshot whose parent is the current commit, then moves the current branch label to it.
- `git merge other` makes a commit with two parents. History keeps its true shape: both lines of work happened.
- `git rebase main` replays your commits, one at a time, on top of `main`, creating new commits with new IDs. History becomes a straight line, and the old commits still exist for a while even though no label points at them.
- `git reset --soft HEAD~1` moves the branch label back one commit and leaves index and working tree alone. Your changes are still staged. This is the "I wrote a bad commit message" or "these should have been two commits" tool.
- `git reset --hard HEAD~1` moves the label back and overwrites index and working tree to match. This is the one that destroys uncommitted work, and the only Git command in daily use that can.
- `git revert abc1234` makes a *new* commit that undoes the changes of an old one. Nothing is rewritten. This is what you use on a shared branch, because it is additive.

The distinction between `reset` and `revert` is the one to say out loud in an interview: reset rewrites history, revert adds to it. On any branch other people have pulled, you revert.

## Why an FDE cares more than most engineers

Vinoo Ganesh, who ran Palantir's Project Frontline and trained several hundred deployed engineers, puts Git in the non-negotiable foundation list for the role, and specifically frames it as working in other people's repositories rather than your own.

That framing matters. In a customer engagement you are usually a guest:

- The repo has a branching convention you did not choose and a CODEOWNERS file that routes your change to a reviewer in another timezone.
- Force-pushing is often disabled on protected branches, sometimes for compliance reasons, and finding that out during a demo window is bad.
- There may be no push access at all on day one. Your work lives locally, or on a fork, until access is granted, which makes local history hygiene the only thing standing between you and lost work.
- Their CI runs checks you have never seen, and a commit that fails a licence-header check at 6pm is your problem, not theirs.

None of that requires advanced Git. It requires being unrattled.

## The safety net: reflog

Here is the thing that turns Git from frightening to boring. Every time HEAD moves, for any reason, Git writes a line into the reflog. Commits that no label points at are not deleted immediately; by default they survive for weeks.

So the commit you "destroyed" with a bad reset is almost certainly still there.

```bash
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~1
# def5678 HEAD@{1}: commit: add tax column to invoice export
```

`def5678` is the work you thought was gone. Get it back:

```bash
git checkout -b rescue def5678
```

You now have a branch pointing at the snapshot. Nothing was lost, because commits are immutable snapshots and only the labels moved.

Do this once, deliberately, before you ever need it.

## Practice: break it on purpose

Twenty minutes, in a throwaway directory.

```bash
mkdir git-practice && cd git-practice
git init
printf 'one\n' > notes.txt
git add notes.txt && git commit -m "first"
printf 'two\n' >> notes.txt
git commit -am "second"
git log --oneline --graph --all
```

Now:

1. `git reset --hard HEAD~1`. Confirm with `cat notes.txt` that the second line is gone.
2. `git reflog`. Find the commit ID of "second".
3. `git checkout -b rescue <that id>`. Confirm the line is back.
4. Make a branch, commit on it, and `git rebase main` it. Run `git log --oneline` on both branches and notice the commit IDs differ even though the content is identical. That is rebase making new snapshots.

Write the four commands you used into your journal. When a customer's engineer says "I think I lost my work", you want that recall to be instant rather than something you look up while they watch.

The next lesson takes the same model into the part that actually causes stress: rebases and conflicts.
