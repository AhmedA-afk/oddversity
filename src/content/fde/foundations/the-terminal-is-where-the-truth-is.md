---
title: "The terminal is where the truth is"
phase: foundations
module: shell-and-linux
kind: lesson
summary: "A dashboard shows you what someone decided to display. A terminal on the actual machine shows you what is actually happening. This lesson is the case for shell fluency, and the handful of navigation commands you should never have to think about."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Navigate an unfamiliar Linux filesystem confidently using cd, ls, pwd, and find, without a GUI.
  - Read a file safely on a live production box, choosing correctly between cat, less, head, and tail.
  - Explain, concretely, why a dashboard can say a service is healthy while the terminal shows otherwise.
---

A customer's monitoring dashboard says the service is healthy. A customer stakeholder says the export ran fine last night. A colleague says they already checked the logs and found nothing. Every one of these can be true and still wrong, because a dashboard only shows what someone decided to instrument, a person's memory of "fine" can be stale by a day, and "checked the logs" can mean anything from a careful read to a glance. The terminal, on the actual machine, showing the actual process list and the actual file contents, is the one source that cannot be wrong about what is currently true on that machine. This module starts here because everything else in it — grep, ps, systemd, ssh — is built on the assumption that you trust the terminal over every secondhand summary of what it would show.

## Where you are, and how to move

```bash
pwd                 # print working directory — where am I, right now
ls                   # list what's in this directory
ls -la               # list, including hidden files (dotfiles), with permissions and sizes
cd /var/log          # change directory, absolute path
cd ../..             # change directory, relative — two levels up
cd -                 # jump back to the previous directory
cd ~                 # home directory
```

`cd -` is worth building into muscle memory early — it is the fastest way to bounce between two directories (a log directory and a config directory, say) without retyping either path.

## Finding a file you know exists somewhere

```bash
find /opt -name "*.log"                 # by name, from a starting point
find / -mmin -60 2>/dev/null            # modified in the last 60 minutes, anywhere, errors suppressed
find /var -type d -name "customer-*"    # directories only, matching a pattern
```

`find`'s `2>/dev/null` matters on a real box: without it, a search starting from `/` will spew "permission denied" for every directory you cannot read, burying the results you actually wanted in noise.

On modern systems, `locate` (if installed and its index is current) is faster for a simple filename search across the whole filesystem, at the cost of possibly being a few hours stale:

```bash
locate nightly_export.py
```

## Reading a file, choosing the right tool for its size and your intent

Four different commands for "look at a file's contents," each right for a different situation:

```bash
cat small_config.yaml       # dump the whole file — fine for anything short
less large_app.log          # page through, search with /, scroll with arrows, quit with q
head -n 50 output.csv       # just the first 50 lines — check a file's shape before loading it
tail -n 100 error.log       # just the last 100 lines — the most recent entries
tail -f error.log           # follow the file live as new lines are appended — the log-under-pressure command
```

Using `cat` on a multi-gigabyte log file floods your terminal and gives you nothing useful — the wrong tool for the job, and a habit worth breaking early. `less` (which, despite the name, can page through files of any size efficiently because it does not load the whole file into memory at once) is almost always the better default for anything you have not already sized with `head` or `ls -la`.

## Why the terminal outranks the dashboard

A dashboard is built by someone who decided, in advance, what was worth measuring. It cannot show you the thing nobody thought to instrument — a disk quietly filling up on a partition nobody graphed, a process that is technically running but has stopped making progress, a log line that only appears once and never got turned into a metric. A terminal session on the actual box has no such limitation: `df -h` shows the disk regardless of whether anyone built a disk-usage panel; `tail -f app.log` shows exactly what the application is saying right now, in its own words, not summarised through whatever a dashboard's designer chose to surface.

This is not an argument against dashboards — they are faster for the common case, and a good one is exactly what lets you skip the terminal ninety percent of the time. It is an argument for treating a dashboard as a hypothesis about what is happening, and the terminal as the place you go to confirm it, especially the moment a dashboard's story stops matching what a stakeholder is describing.

## A worked instinct: someone says "the export ran fine last night"

Do not accept this claim; check it.

```bash
ls -la /opt/export/output/          # did a file actually appear, with a timestamp from last night?
tail -50 /opt/export/export.log     # what does the job's own log say about its own run?
stat /opt/export/output/orders_latest.csv   # exact modification time, size — is the size plausible?
```

Three commands, thirty seconds, and you either have independent confirmation or you have just found the actual problem before it reaches a customer meeting. "Fine" as reported by a person is a claim. A timestamped file of a plausible size, confirmed by a log line that says so, is evidence.

## The FDE version of this lesson

An FDE spends a disproportionate share of the working day in a terminal, on machines that are not their own, under time pressure, with a stakeholder who wants an answer they can trust. The habit this lesson is building is not command memorisation — it is the reflex to verify on the actual machine before repeating what you were told, because the customer meeting where a wrong secondhand claim gets stated as fact, and then contradicted by reality ten minutes later, is the meeting that costs you credibility for the rest of the engagement.
