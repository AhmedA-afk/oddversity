---
title: "Files, permissions, and the user you are not"
phase: foundations
module: shell-and-linux
kind: lesson
summary: "You will spend a surprising fraction of your first customer engagements as a low-privilege user asking why something can't read a file it should be able to read. This lesson is the permission model and the five commands that answer that question."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Read the output of `ls -la` and state exactly who can read, write, or execute a file.
  - Use `chmod`, `chown`, and `sudo -l` to diagnose and fix a permission problem without over-granting access.
  - Explain why you should ask for a scoped service account instead of root, and what to do when you only have one.
artifact: A one-page cheat sheet, in your own words, mapping symptoms ("permission denied", "operation not permitted", a container that can't write its own logs) to the command you'd run first.
---

You will rarely be root on a customer's machine, and you shouldn't want to be. What you'll actually be is a service account, or a named user with a specific role, that can do exactly the things someone decided it should be able to do — and your job, more often than it sounds like it should be, is figuring out which of those things it currently can't, and why.

## The model

Every file and directory on a Linux system has an owner (a user), a group, and three sets of permissions — for the owner, for the group, and for everyone else. `ls -la` shows all of it:

```
$ ls -la /var/log/app/
drwxr-x---  2 app-svc  app-grp   4096 Sep  1 09:14 .
-rw-r-----  1 app-svc  app-grp  18234 Sep  1 09:14 export.log
```

Reading the permission string left to right: the first character is the type (`d` for directory, `-` for a regular file, `l` for a symlink). The next nine characters are three groups of three — owner, group, other — each `rwx`: read, write, execute. `-rw-r-----` means the owner (`app-svc`) can read and write, the group (`app-grp`) can only read, and everyone else has nothing. If your service is running as a different user, in a different group, this file is invisible to it, and the error will be a flat "permission denied" with no further explanation.

For a directory, `x` means something slightly different from a file: it means "can enter this directory and access things inside it by name," not "can execute it." A directory with `r` but not `x` lets you list filenames but not open any of them — a common, confusing intermediate state.

## chmod, chown, and reading the numbers

`chmod` sets permissions, either symbolically (`chmod g+r file` adds read for the group) or numerically. The numeric form is worth being fluent in because it's what you'll see in scripts, Dockerfiles, and deployment docs: each of `rwx` is a bit, `r=4, w=2, x=1`, summed per group.

```bash
chmod 640 export.log     # owner: rw- (6), group: r-- (4), other: --- (0)
chmod 750 /var/log/app/  # owner: rwx (7), group: r-x (5), other: --- (0)
```

`chown` changes ownership, and usually needs elevated privilege to run against files you don't already own:

```bash
sudo chown app-svc:app-grp export.log
```

`umask` sets the default permissions new files get when created, which explains why a script that writes a file sometimes produces something with permissions nobody expects — the umask of the process that created it, not anything the script author chose deliberately.

## The diagnostic sequence for "permission denied"

When something fails with a permission error and you're not sure why, this order gets you to the answer fastest, without guessing:

```bash
whoami                        # who am I actually running as
id                             # my uid, gid, and every group I belong to
ls -la /path/to/the/file       # who owns it, what mode, what group
namei -l /path/to/the/file     # walk the full path, showing perms on every parent directory
```

`namei -l` is the one people forget and need most. A file can have perfectly permissive mode bits and still be unreachable because a parent directory three levels up is `700` and owned by someone else. `ls -la` on the file alone won't show you that; walking the path will.

If the file is owned by a group you're not in, `id` will tell you immediately — and the fix, if you have the authority to make it, is adding your user to that group (`sudo usermod -aG app-grp yourname`), not loosening the file's permissions for everyone.

## sudo, su, and the account you should actually be asking for

`sudo` runs a single command as another user (root, by default) and logs that it happened. `su` switches your whole shell to another user. In a customer environment, `sudo -l` tells you what you're specifically permitted to run as someone else — worth checking early, because it's a map of what you can already do without asking anyone:

```bash
sudo -l
# (may show something like:)
# User app-deploy may run the following commands on host-03:
#     (app-svc) NOPASSWD: /usr/bin/systemctl restart myapp
#     (root) /usr/bin/less /var/log/**
```

That output tells you exactly the shape of access you have, which is usually narrower than "full root" by design and for good reason. When you need more, the right ask in a customer engagement is never "can I get root" — it's "can this service account read `/var/log/app/` and write to `/opt/app/output/`," stated as specifically as the permission model itself. A customer's security team will grant a scoped request in an afternoon and sit on a root request for a week, correctly.

## Files, permissions, and containers

This comes up constantly once you're running things in Docker (the next module covers this properly): a container often runs as a numeric UID that doesn't correspond to any named user inside the image, and files it writes to a mounted volume are owned by that UID on the host too. A container running as UID 1000 writing to a volume, followed by a host process running as a different user trying to read those files, produces exactly the "permission denied" pattern above, and `id` inside the container plus `ls -la` on the host is how you confirm it.

## The FDE version of this lesson

The scenario an interviewer or a customer will actually hand you is close to: "the deploy script can't write its log file, here's SSH access, go." The wrong move is asking for root to make the error go away. The right move is `whoami`, `id`, `namei -l` on the target path, in under a minute, followed by a specific, scoped fix or a specific, scoped request. That sequence — diagnose precisely, ask for precisely what's needed — is also, not coincidentally, what makes a customer's security team trust you with more access over time instead of less.
