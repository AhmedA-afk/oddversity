---
title: "DNS, and why it is always DNS"
phase: foundations
module: networking-inside-a-customer
kind: lesson
summary: "Every network problem looks like DNS until proven otherwise, and often it actually is. This lesson covers how resolution actually works, the record types you'll meet in the field, and the commands that prove or disprove the DNS theory in under a minute."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Explain what happens between typing a hostname and getting an IP address, including where caching happens.
  - Use dig and /etc/hosts to test a DNS theory without waiting for a real record change to propagate.
  - Recognise the specific symptoms of split-horizon DNS and stale TTLs in a customer environment.
artifact: A short written note comparing dig output for a working hostname and a broken one, from a real diagnosis you did or a documented scenario.
---

"It's always DNS" is a running joke in operations because it's close to literally true: DNS sits underneath almost everything that talks to anything else, it fails silently rather than loudly, and its failures produce symptoms — timeouts, "connection refused," a service that "just doesn't come up" — that look exactly like a dozen other problems until you specifically check it.

## What actually happens when a program resolves a hostname

When your code, or `curl`, or a browser needs to reach `api.customer-bank.example`, roughly this happens:

1. Check the local resolver cache (and `/etc/hosts`, which is checked first and can override everything else — a fact you'll use deliberately in a minute).
2. If not cached, ask the configured DNS resolver (often the customer's internal DNS server, or a public one like `8.8.8.8`, depending on the network).
3. That resolver, if it doesn't already have the answer cached, walks the hierarchy: a root server points it to the `.example` TLD server, which points it to the authoritative server for `customer-bank.example`, which finally returns the actual record.
4. The answer comes back with a **TTL** (time to live) — how long it's allowed to be cached before it must be looked up again.

Every step in that chain is a place things go wrong, and almost none of them produce an error message that says "DNS problem." They produce a timeout, or a connection to the wrong server, or — the specific one that costs people hours — a connection that *used to work* and now doesn't, because a record changed and something in the chain is still serving the cached old answer.

## Record types worth knowing cold

| Type | Points to | Field example |
|---|---|---|
| A | An IPv4 address | `api.customer-bank.example → 203.0.113.44` |
| AAAA | An IPv6 address | `api.customer-bank.example → 2001:db8::44` |
| CNAME | Another hostname (an alias) | `app.customer-bank.example → customer-bank.cloudprovider.net` |
| MX | The mail server for a domain | `customer-bank.example → mail.customer-bank.example, priority 10` |
| TXT | Arbitrary text — commonly domain verification, SPF/DKIM | `v=spf1 include:_spf.provider.com ~all` |
| SRV | A service's host and port together | Used by some enterprise protocols, LDAP among them |

`CNAME` is the one that causes the most confusion because it's a pointer to another *name*, not directly to an IP — resolving it means following the chain one more hop, and a `CNAME` cannot coexist with other record types on the same name, a rule that trips people up when they try to put both a `CNAME` and a `TXT` verification record on the same subdomain.

## Testing without waiting for propagation

You do not need to wait for a real DNS change to test a theory. Two tools, used together, cover almost every field situation:

```bash
dig api.customer-bank.example
dig api.customer-bank.example +short          # just the answer, no verbose output
dig api.customer-bank.example @8.8.8.8        # ask a specific resolver directly, bypassing local cache/config
dig -x 203.0.113.44                            # reverse lookup: IP to hostname
```

`dig` shows you the actual answer a specific resolver gives, which matters because different resolvers can legitimately give different answers — the customer's internal DNS server might resolve `api.internal.customer-bank.example` to a private IP that only makes sense from inside their network, while a public resolver has no record of it at all, or a different one.

`/etc/hosts` lets you override resolution locally, for testing, without touching any real DNS record:

```
# /etc/hosts
203.0.113.99   api.customer-bank.example
```

Add a line like this, and every program on your machine that resolves that hostname gets your override instead of the real DNS answer — useful for testing "does my code actually work against the new server" before the real DNS cutover happens, or for confirming "is this actually a DNS problem" by pointing directly at the IP and seeing if the failure disappears.

## Split-horizon DNS: the customer-specific trap

Many enterprises run **split-horizon DNS**: the same hostname resolves to different answers depending on whether the query comes from inside or outside the corporate network. `portal.customer-bank.example` might resolve to an internal load balancer's private IP from inside their office, and to a completely different public-facing IP (or not resolve at all) from the outside. This is deliberate — internal services often shouldn't be reachable from the public internet — but it produces a specific, confusing symptom: "it works when I'm on the office VPN and fails from anywhere else," which looks like a firewall problem, a VPN problem, or a code problem, and is actually just DNS answering two different questions correctly.

The tell is comparing `dig` output from two vantage points — your laptop off-VPN versus on-VPN, or a request from inside a container versus from the host. If the IPs differ, you've found it.

## The TTL trap

DNS answers are cached for their TTL — could be 300 seconds, could be 86400 (a day), set by whoever manages the zone. Right after a DNS record change, some resolvers along the chain are still serving the old answer until their cached copy expires. This is the actual mechanism behind "we cut over the DNS an hour ago and half our users are still hitting the old server" — it's not broken, it's just not fully propagated yet, and the fix is patience (or, if you control it, lowering the TTL well before a planned cutover so the old answer expires from caches faster).

`dig api.customer-bank.example` shows the TTL in its answer section — a low or zero TTL right after a change tells you propagation should be fast; a TTL of 86400 tells you to expect stragglers for up to a day.

## The FDE version of this lesson

The interview and field version of this is the same sentence: "it works from my machine, not from theirs" — and the fastest correct move is `dig` from both vantage points before touching firewall rules, proxy settings, or code. Most engineers reach for the firewall first because it feels more concrete; the ones who reach for DNS first, because they've internalised how often it actually is DNS, save the customer an hour of chasing the wrong layer.
