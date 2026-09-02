---
title: "Lab: diagnose the dead service from logs alone"
phase: foundations
module: shell-and-linux
kind: lab
summary: "A service is down, a stakeholder is watching over your shoulder, and you are not allowed to just restart it and hope. This lab builds the discipline of diagnosing from evidence — logs, process state, ports — before touching anything."
duration: "2 h"
updated: "2026-09-02"
outcomes:
  - Diagnose why a systemd-managed service is down using only journalctl, ps, and ss, without guessing.
  - Distinguish a crashed process from one that is running but not listening, from one that is listening but misconfigured.
  - Narrate a live diagnosis out loud in a form a non-technical stakeholder could follow, before you fix anything.
artifact: "A written incident timeline for the scenario below: what you checked, in what order, what each check told you, and the actual root cause."
---

The instinct under pressure is to restart the service and see if the problem goes away. Sometimes it does, and you have learned nothing about why it happened, which means it happens again — often during the next customer demo. This lab forces the other instinct: read the evidence first, form a hypothesis, confirm it, and only then act. It is also, almost verbatim, the shape of a debugging round in an FDE interview loop.

## The scenario

A small API service, managed by systemd, has stopped responding. A teammate reports "the app is down" with no further detail. You have SSH access to the box. You do not yet know whether the process crashed, is running but stuck, or is running fine but something upstream (DNS, a firewall rule, a full disk) is blocking traffic to it.

## Set up the scenario to practice on

```bash
# a minimal service that will fail for a config reason
cat > /opt/demo-service/app.py <<'EOF'
import os
import http.server

PORT = int(os.environ["DEMO_PORT"])  # will KeyError if DEMO_PORT is unset

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

http.server.HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
EOF

sudo tee /etc/systemd/system/demo-service.service <<'EOF'
[Unit]
Description=Demo service
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/demo-service/app.py
Restart=on-failure
RestartSec=5
# Environment=DEMO_PORT=8090   <- deliberately left commented out

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now demo-service
```

With `DEMO_PORT` unset, the service will crash on startup, restart every five seconds under systemd's `Restart=on-failure`, and crash again — a crash loop, which looks different from both "never started" and "running but unresponsive," and each of those three looks different in the evidence.

## Steps

**1. Confirm the actual state before assuming anything.** Do not trust the report "the app is down" — check what systemd itself believes:

```bash
sudo systemctl status demo-service
```

Read the output carefully: is it `active (running)`, `failed`, or `activating (auto-restart)`? Each tells a different story. `activating (auto-restart)` — which this scenario produces — means systemd is actively trying and failing repeatedly, which is a different problem than a service that started fine and hung.

**2. Read the actual logs, not just the status line.** `systemctl status` truncates; go to the full journal:

```bash
sudo journalctl -u demo-service --since "10 minutes ago"
```

You should see the Python traceback: `KeyError: 'DEMO_PORT'`. This is the moment the exercise is built around — the evidence already contains the root cause. The temptation is to restart the service anyway "just in case." Resist it; a restart will produce the identical crash within five seconds, and you will have burned time confirming what the log already told you.

**3. Check whether anything is actually listening**, to confirm your read of the logs against independent evidence:

```bash
ss -tlnp | grep 8090
```

Nothing will be listening, because the process never got past the line that reads `DEMO_PORT`. This cross-check matters because in a real incident the log and the network state can disagree — a process can log "started successfully" and still not be listening, if it bound to the wrong interface, which is a different bug with a different fix.

**4. Check process state to rule out "running but stuck."** For contrast, kill the demo and imagine a variant where the process is genuinely running but the handler hangs (a real, common failure): a `ps` that shows the process alive, combined with an `ss` that shows it listening, combined with no response to `curl`, points at a hung handler rather than a startup crash — a different diagnosis entirely, reached the same way, by cross-checking process state, socket state, and actual response.

```bash
ps aux | grep app.py
curl -m 3 http://localhost:8090/
```

**5. Fix the actual cause, not the symptom.** Uncomment the `Environment=` line, reload, and restart:

```bash
sudo sed -i 's/# Environment=DEMO_PORT=8090/Environment=DEMO_PORT=8090/' /etc/systemd/system/demo-service.service
sudo systemctl daemon-reload
sudo systemctl restart demo-service
sudo systemctl status demo-service
curl http://localhost:8090/
```

**6. Confirm it stays up**, not just that it started once:

```bash
sleep 15
sudo systemctl status demo-service   # should show active (running), not activating
journalctl -u demo-service --since "1 minute ago"   # no repeated crash entries
```

**7. Write the incident timeline.** In plain language, in order: what was reported, what `systemctl status` showed, what the journal showed, what you cross-checked with `ss`, what the root cause was, what the fix was, and how you confirmed it held. This is the document a customer's ops lead would actually want after an incident, and it is what an interviewer is listening for when they ask you to narrate a debugging session out loud.

## Definition of done

- You identified the crash-loop state from `systemctl status` before reading any logs.
- You found the root cause (`KeyError: DEMO_PORT`) from `journalctl`, and cross-checked it against `ss` showing nothing listening, before attempting any fix.
- You applied the fix that addresses the actual cause (the missing environment variable), not a workaround (such as hardcoding the port inside `app.py`, which would hide the fact that the service depends on an environment variable someone needs to know about).
- You confirmed the fix held over time (`sleep 15` then re-check), not just that one restart succeeded.
- You produced a written timeline a non-technical stakeholder could follow.

## How this goes wrong

**Restarting first, reading logs second.** The single most common mistake under pressure. Every restart without first reading the logs both wastes the seconds it takes to fail again and, worse, can wipe out the evidence — if the service ever does start successfully, the crash logs that explained the original failure are now buried under new, unrelated log lines, and on a system without persistent journal storage a service restart can outright discard old journal entries.

**Fixing the symptom instead of the cause.** Hardcoding `PORT = 8090` directly into `app.py` would make this specific crash stop, and it would hide the actual issue — this service depends on an environment variable that was never set in the deployment, which likely means the same missing-config problem exists in every other environment (staging, the customer's cluster) provisioned from the same incomplete template. Fixing only the box in front of you, without asking why the config was missing, ships the same bug to the next environment.

**Reporting "it's fixed" without proof it stays fixed.** A crash-looping service that restarts every five seconds can look briefly healthy for a few seconds right after any `systemctl restart`, whether or not the actual cause was addressed — reporting success from that brief window, without waiting to see whether it holds, is a false all-clear that surfaces again the next time someone checks, usually during the demo you were trying to protect.
