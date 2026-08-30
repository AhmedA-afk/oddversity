---
title: "MCP Transports: Common Mistakes"
track: "mcp"
status: live
summary: "Five transport mistakes — reaching for HTTP by default, binding to every interface, in-memory sessions behind a load balancer, and assuming a clean shutdown."
duration: "8 min read"
---

## 1. Choosing HTTP because it feels more real

**You probably think** stdio is a toy and a proper server listens on a port.

**Why it breaks:** for a local integration, HTTP buys you nothing the user asked for and costs you an authentication system, an authorisation model, transport security, an origin policy and a deployment. With stdio, "who may call this tool" is answered by the operating system for free. The moment you move to HTTP, that answer becomes yours to build, and until you build it the endpoint is open.

**The correct model:** stdio unless the server must be reachable by someone who is not sitting at that machine. Remote access is a requirement, not an upgrade.

**How to spot it live:** you wrote an HTTP server and have not yet written an auth check. That is not a to-do; it is a live exposure.

## 2. Binding to every interface

**You probably think** `0.0.0.0` is the normal thing to bind to.

**Why it breaks:** it is normal for a service behind a firewall in a deployment you control. For a server running on a laptop it means every device on the coffee-shop Wi-Fi can reach your tools. Combined with no auth — see mistake 1 — that is a complete compromise of whatever the server touches.

**The correct model:** bind local HTTP servers to `127.0.0.1`. Validate the `Origin` header against an allowlist rather than reflecting whatever arrived, so a web page the user happens to visit cannot drive the server through their browser.

```python
mcp.run(transport="streamable-http", host="127.0.0.1", port=8765)
```

**How to spot it live:** from another device on the same network, try to reach the port. If it answers, so can anything else.

## 3. In-memory sessions behind more than one replica

**You probably think** session state in a dictionary is fine because it works.

**Why it breaks:** it works with one instance. Add a second behind a load balancer and requests for one session scatter across replicas that have never seen it. Initialisation succeeds on replica A, the next call lands on replica B, and the client gets an unknown-session error — intermittently, under load, and never in testing.

**The correct model:** decide statefulness deliberately. Either put session state in shared storage, or make the server stateless so any replica can serve any request. Both are fine; the failure comes from not choosing.

**How to spot it live:** errors that appear only in production, only sometimes, and vanish when you scale to one instance.

## 4. Assuming a graceful shutdown

**You probably think** your cleanup code runs when the session ends.

**Why it breaks:** a stdio client can disappear without ceremony — a crash, a force quit, a closed laptop. If your server spawned subprocesses, opened connections, or took locks, those can outlive it. Do that a few times a day and the machine accumulates orphans while the user concludes the tool is slow.

**The correct model:** handle termination signals, close what you opened, and assume the shutdown will be rude.

```python
import atexit, signal

def cleanup(*_):
    pool.close()
    for proc in children:
        proc.terminate()

atexit.register(cleanup)
signal.signal(signal.SIGTERM, cleanup)
signal.signal(signal.SIGINT, cleanup)
```

**How to spot it live:** `ps` after a day of use. Count how many of your servers are still running.

## 5. Treating a dropped stream as impossible

**You probably think** a long response either completes or errors.

**Why it breaks:** over HTTP it can also just stop. Proxies enforce idle timeouts, load balancers cap connection lifetime, mobile networks change address mid-request. A ninety-second tool call over a public network will be cut sometimes, and the client sees a truncated stream rather than a failure.

**The correct model:** for anything slow, stream progress rather than going silent, keep individual responses short enough to survive a typical proxy timeout, and make retries safe — a repeated call should not repeat a side effect.

**How to spot it live:** failures correlated with duration rather than with input. If your slowest tool is also your flakiest, this is why.

---

Next: [the transports cheatsheet](/learn/mcp/mcp-transports-cheatsheet), and [check yourself](/learn/mcp/mcp-transports-quiz).
