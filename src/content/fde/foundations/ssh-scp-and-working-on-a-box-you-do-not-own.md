---
title: "ssh, scp, and working on a box you do not own"
phase: foundations
module: shell-and-linux
kind: lesson
summary: "Every customer engagement starts with getting a working, secure shell onto a machine that belongs to someone else, and behaving like a guest once you are there. This lesson covers key-based auth, config shortcuts, tunnelling through a bastion, and the etiquette that keeps a customer's security team comfortable with you."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Set up key-based SSH access and an ssh config entry so a customer's jump-host chain becomes a single short command.
  - Move files reliably with scp and rsync, including resuming an interrupted transfer.
  - Explain, and follow, the discipline expected when you are working on infrastructure you do not own.
---

The first practical skill on almost every engagement is unglamorous: get a working, secure terminal onto a machine somewhere inside the customer's network, reliably, without asking a colleague to re-explain the connection chain every time. This lesson is that skill, plus the etiquette that matters once you are actually on someone else's box.

## Key-based auth, not passwords

Password authentication over SSH is disabled on most production infrastructure you will touch, and you should prefer disabling it on anything you control. Generate a key pair once:

```bash
ssh-keygen -t ed25519 -C "your-name@your-company"
# writes ~/.ssh/id_ed25519 (private, never shared) and id_ed25519.pub (public, safe to share)
```

The private key never leaves your machine. The public key gets added to the target's `~/.ssh/authorized_keys`, either by you (`ssh-copy-id user@host`) or, on a customer's infrastructure, by whoever administers access there — which is usually a ticket, not a command you run yourself.

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host
ssh user@host
```

## The ssh config file, so you stop typing the same flags

Real customer environments rarely offer a single public-facing box. More often it is a bastion (jump host) with access to an internal network, and the actual target machine is only reachable from inside. Doing this by hand every time is error-prone; `~/.ssh/config` makes it one short command:

```
# ~/.ssh/config
Host customer-bastion
    HostName bastion.customer-vpc.example.com
    User youruser
    IdentityFile ~/.ssh/id_ed25519

Host customer-app
    HostName 10.20.30.40
    User svc-deploy
    IdentityFile ~/.ssh/id_ed25519
    ProxyJump customer-bastion
```

With this in place:

```bash
ssh customer-app
```

connects through the bastion automatically — `ProxyJump` handles the hop, and you never type the bastion's address again. This file is worth building for every customer on day one; it is the difference between a thirty-second reconnect and re-deriving a three-hop chain from a wiki page each morning.

## scp and rsync, and the difference that matters

`scp` copies a file or directory, full stop:

```bash
scp local_report.csv customer-app:/tmp/report.csv
scp customer-app:/var/log/app.log ./app.log
```

`rsync` is almost always the better choice once a transfer might be large, might fail partway, or might need to run again with only the changes:

```bash
rsync -avz --progress ./dataset/ customer-app:/data/incoming/
```

`-a` (archive: preserves permissions, timestamps, recurses directories), `-v` (verbose), `-z` (compress in transit). The property that matters most in the field: if the connection drops mid-transfer, re-running the same `rsync` command resumes efficiently — it only sends what changed or is missing — where re-running `scp` starts the whole transfer over from nothing. On a customer's network, where a VPN or proxy dropping mid-transfer is common, this difference decides whether moving a large dataset takes one attempt or five.

## Port forwarding, when you need to reach something you cannot reach directly

A common situation: a database or internal dashboard is reachable only from inside the customer's network, and you need a local tool (a SQL client, a browser) to talk to it. SSH local port forwarding tunnels a local port through the SSH connection to a port only reachable from the far side:

```bash
ssh -L 5433:internal-db.customer.local:5432 customer-bastion
```

This makes `localhost:5433` on your machine behave as if it were `internal-db.customer.local:5432` on the far side of the bastion, for as long as that SSH session stays open. Point your SQL client at `localhost:5433` and it reaches a database it otherwise could not see at all — no VPN client install, no firewall rule change, just the tunnel you already have permission to open because you can already SSH to the bastion.

## Working on a box you do not own

The technical mechanics above are the easy half. The discipline that actually matters on a customer engagement:

**Leave no trace you would not want found.** Do not leave test scripts, scratch files, or `sudo` history you cannot explain sitting on a customer's production box. A `~/scratch/` directory you forget to clean up, discovered by their security team during an audit six months later, damages trust in a way no technical mistake does.

**Never run a destructive command you have not first run read-only.** `rm`, `DROP TABLE`, `systemctl restart` on a service you do not fully understand — read the state first (`ls`, `SELECT COUNT(*)`, `systemctl status`) before you act on it. This applies doubly on a box you have access to but do not administer: the blast radius of a mistake on infrastructure you do not own is someone else's incident, not just yours.

**Use `sudo` for the one command that needs it, not for the whole session.** `sudo systemctl restart app` rather than `sudo -i` and working as root for the rest of the day. Every command you run as root without needing to is a command a customer's audit log will later ask you to justify.

**Assume the session is logged.** Many customer environments run session recording (`script`, `auditd`, a bastion-level session recorder) as standard practice, particularly in regulated industries — banking, healthcare, defence. This is not a reason to be nervous; it is a reason to work exactly as carefully as you would if someone were watching, because on a meaningful fraction of engagements, someone genuinely is, and that is a normal, expected part of working inside a customer's perimeter, not a sign of distrust specific to you.

## The FDE version of this lesson

An interviewer testing operational fluency will sometimes hand you a scenario with a bastion, an internal box, and a task, and watch how you get there — not whether you eventually succeed, but whether your `ssh config`, your choice of `rsync` over `scp` for a large or flaky transfer, and your instinct to read before you write look like someone who has actually worked inside someone else's infrastructure before. In the field, this is also the first impression a customer's IT team forms of you: whether the person they just gave access to treats their production systems with the same care they would want on their own.
