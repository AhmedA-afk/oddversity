---
title: "TLS, certificates, and the corporate proxy that breaks everything"
phase: foundations
module: http-apis-and-auth
kind: lesson
summary: "The single most common reason your script works from your laptop and fails inside a customer's network is a TLS certificate their proxy inserted into every connection. This lesson explains what TLS actually verifies, and the exact fix when a corporate proxy breaks it."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Explain what a TLS certificate chain proves, in plain terms, without hand-waving "it's encryption".
  - Diagnose a certificate verification error and identify whether the cause is an expired cert, a misconfigured chain, or a corporate proxy's own CA.
  - Add a customer's corporate CA certificate to a script's trust store correctly, instead of disabling verification.
---

You write a script on your own laptop, it calls an internal API over HTTPS, it works. You run the same script, unmodified, inside a customer's network, and it fails with something like `SSLCertVerificationError: certificate verify failed`. This happens on a meaningful fraction of enterprise engagements, and the fix that works is never "just disable verification" — that fix creates a real security hole and, worse, it hides the actual, fixable problem.

## What TLS actually verifies

When your script connects to `https://api.example.com`, TLS does two separate things: it encrypts the traffic, and — separately, and more relevantly here — it verifies that the server on the other end is actually who it claims to be. That second part is what a **certificate** is for. The server presents a certificate; your client checks that certificate against a chain of trust back to a **root certificate authority (CA)** your machine already trusts (a list baked into your OS or your Python installation's `certifi` package). If the chain checks out and the certificate has not expired and the domain name matches, the connection proceeds. If any of those checks fail, your HTTP client refuses the connection and raises a verification error — correctly, because the alternative is silently trusting a connection that might not be who it claims to be.

## The three distinct causes of a verification error

**1. An expired or misconfigured certificate on the server itself.** The server's own certificate genuinely lapsed, or its chain is incomplete (missing an intermediate certificate). Nothing you can fix client-side; the fix belongs to whoever runs that server.

```bash
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```

This prints the certificate's actual validity window — the fastest way to confirm or rule out expiry as the cause before you spend time on anything else.

**2. A corporate proxy performing TLS inspection.** This is the far more common cause inside enterprise customer networks. Many corporate networks route all outbound HTTPS traffic through a proxy that terminates the original TLS connection, inspects the plaintext, and re-encrypts it with a certificate signed by the company's own internal CA — a deliberate, sanctioned practice (usually for security monitoring and data-loss prevention), not an attack, even though it has the same shape as one. Your script, connecting from inside that network, sees a certificate signed by a CA it has never heard of, because your machine's trust store does not include the customer's internal CA — and correctly refuses to trust it.

**3. A client-side trust store that is simply out of date or incomplete** — rarer, but worth ruling out on an older or minimally-provisioned machine, particularly a fresh Docker container that never received an updated `ca-certificates` package.

## Diagnosing which one you have

```bash
curl -v https://api.example.com/ 2>&1 | grep -i "subject\|issuer\|SSL certificate problem"
```

Read the `issuer` line. If it names the actual API provider or a well-known public CA (Let's Encrypt, DigiCert, Google Trust Services), you likely have cause 1 or 3. If it names something like `CN=CustomerCorp Internal CA` or the customer's own company name, you have found cause 2 — a corporate proxy sitting in the middle, and that single line of output is usually enough to confirm it.

## The correct fix: add the customer's CA to your trust store

Ask the customer's IT team for their internal root CA certificate (a `.pem` or `.crt` file — this is a completely normal, expected request on an engagement inside a proxied network, not an unusual one). Then point your tooling at it explicitly, rather than disabling verification:

```bash
# curl
curl --cacert /path/to/customer-internal-ca.pem https://api.example.com/
```

```python
# Python requests
import requests
response = requests.get("https://api.example.com/", verify="/path/to/customer-internal-ca.pem")
```

```bash
# System-wide, on a Debian/Ubuntu box you're deploying to inside their network
sudo cp customer-internal-ca.pem /usr/local/share/ca-certificates/customer-internal-ca.crt
sudo update-ca-certificates
```

```bash
# Python's certifi bundle specifically (some libraries use their own bundle, not the OS one)
cat customer-internal-ca.pem >> $(python3 -c "import certifi; print(certifi.where())")
```

Note the last one is a workaround worth flagging rather than silently doing forever: appending to `certifi`'s bundle gets overwritten the next time `certifi` is upgraded, so anything you deploy long-term should set `REQUESTS_CA_BUNDLE` or `SSL_CERT_FILE` as an environment variable pointing at a combined bundle you control, rather than mutating a library's installed file.

## What not to do, and why it matters

```python
# NEVER do this
response = requests.get(url, verify=False)
```

`verify=False` disables certificate checking entirely — your script will now happily connect to anything, including an actual attacker performing a real man-in-the-middle attack, with no warning at all. It also usually just relocates the problem: the script "works" in the moment, but it is now silently trusting every connection it makes, in a customer's environment, with a security posture you would never sign off on if you thought about it for ten seconds. `verify=False` shipped in code a customer's security team later finds during a review is exactly the kind of finding that ends an engagement's trust, and rightly so — always find and configure the specific CA, never blanket-disable the check.

## The FDE version of this lesson

This is one of the most common "works on my laptop, fails at the customer" bugs you will hit, and it is also one of the fastest to diagnose correctly if you know what you are looking at: read the `issuer` line, recognise a corporate CA, ask for the certificate, configure it explicitly. An interviewer who asks "your script fails with an SSL error only inside the customer's network, what do you check" is testing exactly this sequence, and the wrong answer — reaching for `verify=False` under deadline pressure — is common enough among candidates that getting this one right, calmly, is a real signal.
