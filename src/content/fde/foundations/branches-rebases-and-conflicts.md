---
title: "Branches, rebases, and conflicts you resolve calmly"
phase: foundations
module: git-and-other-peoples-repos
kind: lesson
summary: "A merge conflict is Git telling you two people changed the same lines and it will not guess which one is right. Here is how to read the markers, how to choose between merge and rebase in someone else's repository, and how to abort safely when you are out of time."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Read a conflict marker and say precisely which side is yours and which is theirs.
  - Resolve a multi-file conflict during a rebase, continuing or aborting deliberately.
  - Choose merge or rebase based on the customer repository's rules rather than personal taste.
artifact: A short conflict-resolution note in your journal recording the repo convention, the abort command, and the one thing you check before force-pushing.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Conflicts feel like failure. They are not. A conflict is Git declining to guess. Two commits changed overlapping lines, Git has no way to know which change is correct, so it stops and hands you both versions. The only genuinely bad outcome is panicking and resolving it wrong, quietly, in a file nobody reviews.

## Getting your branch up to date: two options

Your branch was created from `main` four days ago. `main` has moved. Before you open a pull request you need your work to sit on top of current `main`, because otherwise the reviewer is reading a diff against a version of the codebase that no longer exists.

**Merge** brings `main` into your branch:

```bash
git checkout feature/invoice-tax
git fetch origin
git merge origin/main
```

This creates a merge commit with two parents. Your existing commits keep their IDs. Nothing that anyone else has already pulled is rewritten. It is always safe.

**Rebase** replays your commits on top of `main`:

```bash
git checkout feature/invoice-tax
git fetch origin
git rebase origin/main
```

This creates *new* commits with new IDs whose parent is the tip of `main`. History becomes a straight line and the pull request diff is clean. Because the commit IDs changed, if you had already pushed this branch you now have to force-push, which rewrites what everyone else fetched.

The rule that keeps you out of trouble: **rebase your own unshared branch, merge anything shared.** If a colleague has pulled your branch, or CI has published artifacts from it, or it is a long-lived integration branch, do not rewrite it.

In a customer repository the choice is often not yours. Some organisations require linear history and reject merge commits at the branch protection rule. Others forbid force-push entirely, which effectively forbids rebase after the first push. Find out on day one, before you have thirty commits to untangle. The fastest way is to look:

```bash
git log --oneline --graph -20 origin/main
```

If that graph is a straight vertical line with no forks, the team rebases or squash-merges. If it is a braid of merge commits, they merge. Match what you see. Do not import your preferences into someone else's repo.

## Reading a conflict

When Git cannot merge automatically it writes both versions into the file with markers.

```text
def compute_tax(amount, state):
<<<<<<< HEAD
    rate = STATE_RATES.get(state, 0.18)
=======
    rate = lookup_rate(state) or DEFAULT_RATE
>>>>>>> feature/invoice-tax
    return round(amount * rate, 2)
```

Three markers, and the meaning of the labels depends on what you ran.

- The block after the seven less-than signs is **ours**: the side you were sitting on when the operation started.
- The block after the seven equals signs, ending at the seven greater-than signs, is **theirs**: the side being applied.

During a `git merge`, "ours" is your branch and "theirs" is what you are merging in. **During a `git rebase` this inverts**, because a rebase replays your commits onto their branch: "ours" is now the upstream branch you are landing on, and "theirs" is your own commit being replayed. This inversion catches out experienced engineers. When you are unsure, do not reason about it, ask:

```bash
git status              # tells you which operation is in progress
git log --oneline -1 MERGE_HEAD    # during a merge, the commit being merged
```

Resolving means editing the file so that it contains the code you want and **no markers at all**, then staging it. There is no rule that says you must pick one side. Frequently the correct answer is a third thing that takes the intent of both.

```python
def compute_tax(amount, state):
    rate = lookup_rate(state) or STATE_RATES.get(state, DEFAULT_RATE)
    return round(amount * rate, 2)
```

Then:

```bash
git add app/tax.py
git rebase --continue      # or: git merge --continue
```

A rebase stops once per conflicting commit, so you may resolve, continue, and immediately hit another conflict. That is normal on a branch with many commits, and it is the main practical argument for keeping branches short.

## The three commands that make this stress-free

**Abort.** At any point during a merge or rebase, before it completes:

```bash
git rebase --abort      # or: git merge --abort
```

Everything returns to exactly how it was. There is no partial state left behind. Knowing this cold is what lets you start a rebase twenty minutes before a call without anxiety.

**See what you are actually resolving.** In a conflicted file, the three-way view is more informative than the two-way markers:

```bash
git checkout --conflict=diff3 app/tax.py
```

This rewrites the markers to include the *common ancestor* version in the middle. Now you can see what each side changed relative to the original, which usually makes the correct resolution obvious. Where the two-way view shows two plausible lines, the three-way view shows that one side merely reformatted and the other side fixed a bug.

**Stop re-resolving the same conflict.** If you rebase a long branch repeatedly you will hit identical conflicts each time. Turn on the resolution cache once:

```bash
git config --global rerere.enabled true
```

Git records how you resolved a given conflict and replays that resolution when it sees the same one again.

## What goes wrong in the field

**Resolving by deleting.** Under time pressure, people take one side wholesale to make the error go away, and silently drop a fix a customer's engineer made last week. The tell is a pull request that removes lines nobody discussed. Before you finish any conflict resolution, run the diff of your resolution against both parents and read it. If a behaviour disappeared, you made a decision; make it on purpose.

**Force-pushing over a colleague.** Rebase then force-push is routine on your own branch. It destroys work when someone else has committed to that branch in the meantime. Use the safe variant, always:

```bash
git push --force-with-lease
```

This refuses to push if the remote branch has moved since you last fetched it. Plain `--force` does not check. Make `--force-with-lease` the only one your fingers know.

**Conflicts in generated files.** Lock files, compiled assets, and migration files conflict constantly and are almost never resolved by hand. The correct move for a lock file is usually to take either side and regenerate it with the package manager. For a database migration that conflicts on a sequence number, the correct move is to renumber yours to the end, because the other migration has already run in someone's environment.

**A conflict in a file you have never read.** This is the common case in a customer repo. Do not guess. Running `git log -p --follow` on that path shows who changed it and why, and the commit message on the other side is frequently the whole answer. If it is still unclear after five minutes, ask the author in one message that includes the two versions and your proposed resolution. That message takes two minutes to write and is far cheaper than a silent wrong merge in a system you are a guest in.

## Practice

In your scratch repo, create two branches from the same commit, change the same line differently in each, and merge them. Resolve with `diff3` markers on. Then redo the whole thing as a rebase and observe that "ours" and "theirs" have swapped. Abort one of them halfway to see that abort really does restore everything.

Ten minutes now, and conflicts stop being an event.
