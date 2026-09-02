---
title: "systemd, cron, and the job that runs at 3am"
phase: foundations
module: shell-and-linux
kind: lesson
summary: "Every customer engagement eventually needs something to run on a schedule with nobody watching. This lesson covers cron and systemd timers, when to use each, and the handful of ways a scheduled job fails silently that a customer's ops team will blame on you at 3am."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Write a correct cron schedule and explain the five fields from memory.
  - Write a systemd timer and service unit pair, and explain why systemd timers are the better default on a modern Linux box.
  - List the three most common reasons a scheduled job works interactively but fails unattended, and check for each one before shipping.
---

Cron and systemd timers solve the same problem — run this thing at this time, unattended — and you will meet both in the field: cron because it is older, simpler, and still everywhere; systemd timers because most modern Linux distributions now prefer them and a customer's platform team may already standardise on them. You need both.

## cron, and the five fields

A crontab line has five time fields, then the command:

```
# minute  hour  day-of-month  month  day-of-week   command
   0       2        *          *         *          /opt/export/nightly_export.sh
```

Read left to right: minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-6, Sunday is 0). The line above runs at 02:00 every day. A few patterns worth having memorised, because you will write them from memory in the field:

```
*/15 * * * *     # every 15 minutes
0 */4 * * *      # every 4 hours, on the hour
0 9 * * 1-5      # 9am, Monday through Friday
0 0 1 * *        # midnight on the first of every month
```

Edit a user's crontab with `crontab -e`; a system-wide job usually goes in `/etc/cron.d/` as its own file, which is the better choice for anything managed by configuration rather than edited by hand, because `/etc/cron.d/` files can be version-controlled and deployed like any other config file.

## Where cron jobs die silently

Cron runs with a minimal environment — no shell profile loaded, a stripped `PATH`, no interactive shell context. A script that works perfectly when you run it by hand can fail under cron for reasons that have nothing to do with the script's logic:

```
# fragile — relies on `python3` being on cron's minimal PATH
0 2 * * * python3 /opt/export/run.py

# robust — absolute path to the interpreter, explicit working directory
0 2 * * * cd /opt/export && /usr/bin/python3 /opt/export/run.py >> /var/log/export.log 2>&1
```

Two habits prevent most cron failures: always use absolute paths (for the interpreter and for anything the script itself shells out to), and always redirect both stdout and stderr somewhere durable (`>> /var/log/export.log 2>&1`) — cron emails output to the local user by default on many systems, which is frequently not configured and silently discards everything, meaning a script that fails under cron can fail with zero visible evidence anywhere.

## systemd timers: the modern equivalent, with real advantages

A systemd timer pairs with a systemd service unit — the timer defines the schedule, the service defines what runs:

```ini
# /etc/systemd/system/nightly-export.service
[Unit]
Description=Nightly export job

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /opt/export/run.py
User=export-svc
```

```ini
# /etc/systemd/system/nightly-export.timer
[Unit]
Description=Run nightly-export.service daily at 2am

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nightly-export.timer
```

`OnCalendar` schedules are more readable than cron's five fields once you learn the syntax (`*-*-* 02:00:00` means every day at 02:00; `Mon..Fri *-*-* 09:00:00` means weekdays at 9am), and two properties make systemd timers the better default for anything that matters: `Persistent=true` means a job missed because the machine was off or rebooting runs as soon as the system comes back up, which plain cron never does — a machine down from 1am to 3am simply loses that day's 2am cron job forever. And every run is captured in the structured journal automatically:

```bash
journalctl -u nightly-export.service --since today
systemctl list-timers   # see every scheduled timer and its next run time
```

`systemctl list-timers` alone is worth switching for — there is no cron-native equivalent that shows every scheduled job on a box and when it will next fire, and on an unfamiliar customer machine, seeing every scheduled job at a glance is exactly the visibility you want before you change anything.

## Checking a job's health after it runs

Whichever mechanism runs the job, the job itself should report its own outcome, not just complete silently — covered fully in the nightly-export lab in this module. At minimum:

```python
import sys, logging
logging.basicConfig(filename="/var/log/export.log", level=logging.INFO)
try:
    run_export()
    logging.info("export succeeded")
except Exception:
    logging.exception("export failed")
    sys.exit(1)   # non-zero exit — a monitor or wrapper script can check this
```

A `systemd` service that exits non-zero shows up as `failed` in `systemctl status` and can trigger an `OnFailure=` unit to send an alert — a capability cron does not have natively, and one more reason systemd timers are worth learning even where a customer's older infrastructure still runs on cron.

## The FDE version of this lesson

You will be handed both. Older customer infrastructure, especially anything migrated from a physical datacentre years ago, tends to run on cron; modern cloud-native platforms tend to standardise on systemd timers or a scheduler layered on Kubernetes (a CronJob, covered separately). Reading an unfamiliar customer's existing crontab or timer units accurately — without accidentally scheduling a duplicate job, without missing that a job already exists under a different name doing something similar — is the actual skill. The failure this lesson is built around is not "I don't know cron syntax." It is the 3am page for a job that "always worked," where the honest answer turns out to be that it silently stopped working weeks ago, because nothing was checking, and nobody noticed until the report built on it was visibly wrong.
