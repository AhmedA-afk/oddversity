---
title: "Firewalls, proxies and allowlists: what the customer will not tell you"
phase: foundations
module: networking-inside-a-customer
kind: lesson
summary: "A locked-down corporate network will block your outbound calls, intercept your TLS, and route everything through a proxy nobody documented — and the customer's IT team will not volunteer any of this until you ask the right question."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Distinguish what a firewall, a proxy, and an allowlist each actually control, and diagnose which one is blocking a given failure.
  - Configure and debug an HTTP(S) proxy, including the environment variables most tools already respect.
  - Write the specific questions to ask a customer's IT team before an engagement, instead of discovering the answers by trial and error on-site.
---

Most enterprise networks you'll deploy into are not the open internet you developed against. There is a firewall deciding what can talk to what, often a proxy every outbound request has to pass through, and an allowlist deciding which external domains are even reachable at all — and none of these three are the same control, so "it's blocked" is not yet a diagnosis, only a symptom.

## Three different things that can say no

**A firewall** controls which connections are allowed based on source, destination, and port — "this box can accept inbound on 443, nothing else" or "outbound to the internet is blocked except to these specific IP ranges." In cloud environments you'll meet this as **security groups** (AWS: attached to an instance or service, define allowed inbound/outbound by port and source) and **network ACLs** (subnet-level, stateless, evaluated in rule order). The distinction that trips people up: security groups are *stateful* — allow inbound on 443 and the response traffic is automatically allowed back out, no matching outbound rule needed. Network ACLs are *stateless* — you need explicit rules in both directions, and forgetting the return-traffic rule is a classic cause of "the request goes out but the response never comes back."

**A proxy** sits in the path and forwards your traffic on your behalf, often required rather than optional in a locked-down network — direct outbound connections are blocked, and everything has to go through the proxy, authenticated. This is invisible to code that doesn't know to look for it, which is why "works on my laptop, fails on the customer's server" so often turns out to be a missing proxy configuration rather than a firewall rule at all.

**An allowlist** is a policy decision about which specific external domains or IPs are reachable at all, even through the proxy — `api.anthropic.com` might be allowed while every other external domain silently is not, and you find out only when your request times out or gets a proxy-generated error page instead of a real response.

## Working with a proxy

Most HTTP clients and command-line tools respect a small set of environment variables:

```bash
export HTTP_PROXY="http://proxy.customer-bank.internal:8080"
export HTTPS_PROXY="http://proxy.customer-bank.internal:8080"
export NO_PROXY="localhost,127.0.0.1,.internal.customer-bank.example"
```

`NO_PROXY` matters as much as the other two — without it, calls to internal services also get routed through the proxy, which either fails outright (the proxy has no route to an internal-only hostname) or works but adds needless latency and a dependency on the proxy being up for traffic that never needed to leave the network.

Authenticated proxies embed credentials in the URL (`http://user:pass@proxy.customer-bank.internal:8080`) or require a separate auth header depending on the proxy type — ask, don't guess, since a wrong guess here often produces a generic-looking connection failure with no hint that authentication was the actual problem.

```python
import requests

proxies = {
    "http": "http://proxy.customer-bank.internal:8080",
    "https": "http://proxy.customer-bank.internal:8080",
}
response = requests.get("https://api.example.com/data", proxies=proxies, timeout=10)
```

Python's `requests` also respects the environment variables automatically if you don't pass `proxies` explicitly — worth knowing, because it means a script that "just worked" in one environment can fail in another purely because the environment variables weren't set there, with no code difference at all.

## Diagnosing which layer is actually blocking you

```bash
curl -v https://api.example.com/health
```

`-v` (verbose) is the single most useful flag here: it shows you the DNS resolution, the TCP connection attempt, the TLS handshake, and the HTTP exchange as separate stages, and where it fails tells you which layer to blame.

- **Connection hangs, then times out, no TLS handshake shown at all** → almost always a firewall silently dropping the packets, or a network with no route — the connection is never even accepted.
- **Connection refused, immediately** → something is listening on that host/port and actively rejecting, or nothing is listening there at all (compare with the DNS lesson — you might be connecting to the wrong IP entirely).
- **TLS handshake fails, certificate errors** → likely a proxy doing TLS interception, unpacking and re-signing traffic with its own certificate — covered properly in the TLS lesson later in this module, but worth flagging here since it presents as a network problem first.
- **Connects fine, gets an HTTP response, but it's clearly not from the real server** (a login page, a "this site is blocked by policy" page) → the allowlist, not the firewall — you reached *a* server, just not the one you asked for.

```bash
nc -zv api.example.com 443     # can I even open a TCP connection to this host:port
telnet api.example.com 443     # older equivalent, often still available when nc isn't
```

`nc -zv` (zero-I/O mode, verbose) answers the narrowest possible question — is this port reachable at all — without any of the HTTP or TLS layers on top, which is useful for isolating whether the problem is "no route to this host at this port" versus something further up the stack.

## The questions to ask before you're on-site, not after

Every one of these should be in the SOW conversation or the pre-engagement technical call, not discovered by trial and error on day one:

- Is outbound internet access available directly, or only through a proxy? If a proxy, what's the address, and does it require authentication?
- Is there a domain allowlist? If so, what's the process for adding a new domain, and how long does it take? (This alone can be a multi-day approval cycle at a regulated customer — worth knowing before you plan a five-day bootcamp around a service that needs a domain added.)
- Does the proxy perform TLS interception (a corporate root CA injected into the trust store)?
- What ports are open outbound, beyond 443? (Some customer networks block everything except 443 and DNS — a service needing a raw database port open to an external managed database will not work without an explicit exception.)
- Is there a static egress IP we can share with a vendor for their allowlist, or does outbound traffic come from a pool of changing IPs?

Asking these before you arrive turns a day of on-site trial and error into a checklist you're confirming, and it's the kind of preparation a customer's IT team notices and credits you for, because most engineers don't do it.

## The FDE version of this lesson

An interviewer testing this will describe a service that works from your laptop and fails the moment it's deployed inside "the customer's network," and want to see you separate firewall, proxy, and allowlist as three distinct hypotheses rather than one vague "network issue" — then use `curl -v` to find out which one it actually is instead of guessing. In the field, the same discipline is what keeps a locked-down deployment from turning into a week of "try this, see if it works" instead of a diagnosed, specific ask to the customer's IT team.
