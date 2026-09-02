---
title: "Lab: the service that works on your laptop and nowhere else"
phase: foundations
module: networking-inside-a-customer
kind: lab
summary: "Build the service from the earlier HTTP lab, watch it fail the moment someone else tries to reach it, and fix it for the right reason instead of by accident. This is the single most common networking bug you will hit in the field."
duration: "2 h"
updated: "2026-09-02"
outcomes:
  - Diagnose why a service reachable at localhost is unreachable from another machine on the network.
  - Distinguish a binding problem, a host firewall problem, and a routing problem using the correct command for each.
  - Fix the binding address correctly and reopen exactly the port needed, not the whole box.
artifact: A short incident-style write-up in your journal — symptom, hypothesis, test, fix — for the specific cause you find, since it may not be the same one your classmate finds.
---

You've already built a small HTTP API and consumed it from another machine, in the earlier lab in this path. This lab reproduces the bug you almost certainly avoided there by accident, and this time you diagnose it deliberately: a service that works perfectly when you curl it from the same machine, and is completely unreachable from anywhere else. This is close to the most common "it works on my machine" bug that exists, and it has exactly three possible causes, in a specific order worth checking.

## Setup

A minimal server, deliberately built with the bug this lab is about:

```python
# server.py
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

```bash
pip install fastapi uvicorn
python server.py
```

## Steps

**1. Confirm it works locally.** From the same machine:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

It does. This is expected, and it's also exactly why the bug is easy to ship — the most obvious test passes.

**2. Find your machine's actual IP on the network** you'll test from a second machine (a colleague's laptop, a phone hotspot with your machine tethered, or a second terminal inside a different Docker network namespace if you don't have a second physical machine available):

```bash
ip addr show      # Linux: look for an inet address on your active interface, not 127.0.0.1
ifconfig          # macOS / older Linux
```

Note the address — something like `192.168.1.47`.

**3. Try reaching it from the second machine**, using that IP:

```bash
curl http://192.168.1.47:8000/health
```

This will fail — either it hangs and times out, or it refuses the connection immediately. Note which, since it's a clue: a hang usually means a firewall silently dropping packets; an immediate refusal usually means nothing is listening on that interface at all.

**4. Check what's actually listening**, back on the server machine:

```bash
ss -tlnp | grep 8000
```

```
LISTEN  0  128  127.0.0.1:8000  0.0.0.0:*  users:(("python3",pid=...))
```

There's the first, and usually the actual, cause: the server bound to `127.0.0.1`, the loopback interface, which only accepts connections that originate from the same machine. `curl http://localhost:8000` from the server itself worked precisely because `localhost` resolves to `127.0.0.1` — but a request arriving from `192.168.1.47` over the real network interface never reaches a socket that's only listening on loopback. This is the single most common cause of this bug, and it's why step 1 passing tells you almost nothing.

**5. Fix the binding address**, and only the binding address, for now:

```python
uvicorn.run(app, host="0.0.0.0", port=8000)
```

`0.0.0.0` means "listen on every network interface this machine has," not a specific IP. Restart the server and repeat step 3.

**6. If it still fails after fixing the binding**, the second-most-likely cause is a host firewall. Check it:

```bash
sudo ufw status                    # Ubuntu/Debian, if ufw is in use
sudo firewall-cmd --list-all       # RHEL/CentOS/Fedora, if firewalld is in use
sudo iptables -L -n                # low-level, works almost everywhere
```

If port 8000 isn't explicitly allowed, open exactly that port, not the firewall entirely:

```bash
sudo ufw allow 8000/tcp
```

**7. If it still fails after both of those**, the third cause is routing or a network-level block between the two machines specifically — a router client-isolation setting on a Wi-Fi network (common on guest networks, which block devices on the same network from reaching each other deliberately), or, if you're testing across a cloud VPC instead of a physical LAN, a security group not allowing inbound on that port from your test machine's IP. Confirm basic reachability first, independent of your service entirely:

```bash
ping 192.168.1.47          # is the machine reachable on the network at all
nc -zv 192.168.1.47 8000   # is specifically this port reachable, independent of HTTP
```

**8. Confirm the fix from the second machine**, and record which of the three causes it actually was — don't assume it was the binding address until you've checked, since the whole point of this lab is that any of the three can produce the identical symptom from where you're standing.

## Definition of done

- `curl` from a second machine (or network namespace) against your server's real IP returns `{"status":"ok"}`.
- You can state, specifically, which of the three causes it was — binding address, host firewall, or network/routing — and how you confirmed it rather than guessed it.
- You've reverted anything you opened more broadly than necessary — if you tested with the firewall fully disabled to isolate the cause, you've re-enabled it and opened only the one port the service needs.

## How this goes wrong

**Fixing the wrong layer first, by luck.** If you disable the firewall entirely before checking the binding address, and the service then works, you'll conclude "it was the firewall" when it was actually still bound to `127.0.0.1` and the firewall was never the cause — you just also happened to fix nothing, or you got confused by a stale process still bound to the old address on a different port. Change one thing at a time, and confirm with `ss -tlnp` before and after.

**Binding to `0.0.0.0` and forgetting it's now reachable from everywhere, permanently.** This is the security half of the lesson: the fix that makes the demo work is the same change that, left in place on a real deployment without a firewall in front of it, exposes the service to the entire network or, worse, the public internet if the box has a public IP. In the field, "listen on all interfaces" is a step toward a working service, not the final state — the final state is listening on all interfaces *and* a firewall or security group that only allows the specific traffic that should reach it.

**Debugging the client instead of the server.** A natural instinct when a `curl` from another machine fails is to suspect the second machine's network setup. Check the server's own binding first (`ss -tlnp` on the machine actually running the service) before spending time on the client side — it's usually faster to rule out and it's the more common cause.
