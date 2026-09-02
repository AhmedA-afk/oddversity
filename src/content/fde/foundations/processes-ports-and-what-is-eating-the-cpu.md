---
title: "Processes, ports, and what is eating the CPU"
phase: foundations
module: shell-and-linux
kind: lesson
summary: "A production box is unresponsive and someone from the customer is watching you SSH in. This lesson is the small set of commands that find the runaway process, the process holding a port, and the safe way to stop either one."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Find the process consuming the most CPU or memory on a box using top or ps, without a GUI.
  - Find which process is listening on a given port, and which process is making an outbound connection to somewhere it shouldn't.
  - Stop a process the right way — SIGTERM before SIGKILL — and explain why the difference matters.
artifact: "A short runbook entry, in your journal, titled \"the service is unresponsive\": the exact command sequence you'd run first, second, and third."
---

Every running program on Linux is a process, identified by a process ID (PID), with a parent, an owner, a state, and a measurable share of CPU and memory. When something is wrong and you don't yet know what, processes are usually where you start looking, because "what is the machine actually doing right now" is a more concrete question than "what does the log say," and it's the one that finds a runaway loop or a stuck job before the log even mentions it.

## Seeing what's running

```bash
ps aux                          # every process, full detail, one-shot snapshot
ps aux --sort=-%cpu | head -10  # top 10 by CPU
ps aux --sort=-%mem | head -10  # top 10 by memory
top                             # live, auto-refreshing view, sorted by CPU by default
htop                            # nicer top, if it's installed — not always guaranteed on a customer box
```

`ps aux` columns worth knowing: `PID` (you'll need it to signal the process), `%CPU` and `%MEM`, `STAT` (process state — `R` running, `S` sleeping, `D` uninterruptible sleep, usually waiting on disk I/O, `Z` zombie), and `COMMAND` (what was actually run, including arguments, which often tells you exactly which of several instances of the same program this is).

A `D`-state process that's been there a while is worth noticing specifically: it means the process is blocked waiting on I/O and cannot be killed with a normal signal until that I/O completes or times out — a symptom of a disk problem, a hung NFS mount, or a database waiting on a lock, not something `kill -9` will fix.

A `Z` (zombie) process has finished but its exit status hasn't been collected by its parent yet. Zombies consume no CPU or memory beyond a process table entry; a large number of them usually points at a bug in the parent process, not something to chase individually.

`top` (press `q` to quit, `M` to sort by memory instead of CPU, `k` to kill a PID from inside `top` itself) is what you actually use for "what's happening right now" on a box you're SSH'd into with no GUI. Watch it for ten seconds before concluding anything — a process at 100% CPU for one sample might just be doing legitimate work that finishes; a process pinned there for minutes is the runaway.

## What's listening on a port

```bash
ss -tlnp                     # TCP, listening, numeric, show the process
ss -tlnp | grep 8080         # narrow to one port
lsof -i :8080                # alternative, often more available, same question
```

`ss` is the modern replacement for `netstat` (still around on many boxes, syntax is close enough: `netstat -tlnp`). The flags: `-t` TCP, `-l` listening sockets only, `-n` numeric (don't resolve hostnames/ports to names — faster, and avoids DNS lookups hanging the command on a network with broken DNS), `-p` show the owning process.

```
$ ss -tlnp | grep 8080
LISTEN  0  128  0.0.0.0:8080  0.0.0.0:*  users:(("python3",pid=18422,fd=6))
```

This tells you three things worth reading carefully: the port is bound to `0.0.0.0` (every interface, reachable from outside the box — not `127.0.0.1`, which would only be reachable locally), the process is `python3` with PID `18422`, and it's already running — so "address already in use" errors when you try to start your own service on 8080 are explained: something else got there first.

For the reverse question — "what is this box connecting *out* to" — useful when you suspect something is calling somewhere it shouldn't:

```bash
ss -tnp | grep ESTAB          # established outbound/inbound TCP connections
```

## Stopping something safely

```bash
kill 18422           # sends SIGTERM: "please shut down"
kill -9 18422         # sends SIGKILL: "die immediately, no cleanup"
kill -l               # list all signal names/numbers
```

`SIGTERM` (the default, signal 15) asks the process to shut down and gives it the chance to close database connections, flush buffers, finish writing a file, and exit cleanly — well-written services catch this signal and do exactly that. `SIGKILL` (signal 9) is not a request; the kernel terminates the process immediately with no chance to clean up, which can leave a half-written file, a database connection the server thinks is still open, or a lock that never gets released.

The right order, almost always: `kill` (SIGTERM) first, wait a few seconds, check with `ps -p 18422` whether it's actually gone, and only reach for `kill -9` if it's still there — meaning it's ignoring SIGTERM, usually because it's genuinely stuck rather than just slow to shut down. Killing with `-9` as the first move, out of impatience, is exactly how you turn a slow shutdown into a corrupted file or an orphaned lock that causes the *next* problem.

For a process managed by `systemd`, prefer the service manager over signalling the PID directly:

```bash
systemctl status myapp        # is it running, since when, recent log lines
systemctl restart myapp       # stop then start, the way it's meant to be managed
journalctl -u myapp -n 50     # last 50 log lines for this specific service
```

`systemctl restart` matters over a manual `kill` + relaunch because `systemd` will also reset restart counters, reapply resource limits, and log the restart in a place the next person (possibly you, at 3am) will look first.

## The actual sequence when "the service is unresponsive"

1. `systemctl status myapp` — is it even still running, and what does it say about itself.
2. `top` for ten seconds — is something (this service or something else entirely) pinning the CPU or memory.
3. `ss -tlnp | grep <port>` — is the process actually listening on the port it's supposed to be, or did it crash and something else grabbed the port, or is it bound to the wrong interface.
4. If it's genuinely hung: `kill` (SIGTERM) via `systemctl restart`, wait, confirm with `systemctl status` again.
5. Only after: look at logs (previous lesson) to find out *why*, so the next occurrence doesn't repeat the same five minutes.

## The FDE version of this lesson

This is the single most common "stay calm during the demo crisis" scenario in the field, covered properly later in this path: something is unresponsive, a stakeholder is standing there, and the fix has to be both fast and safe. Reaching for `kill -9` on the first try, on the wrong process, because you didn't check `ps` first, is the kind of mistake that turns a thirty-second fix into a data-corruption incident report. The sequence above — status, then top, then port check, then a graceful stop — is slower by about ten seconds than guessing, and it is the ten seconds that keeps you from making the outage worse in front of the person deciding whether to trust you with the next one.
