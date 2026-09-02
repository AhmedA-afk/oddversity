---
title: "SSO, SAML, OIDC, and the customer's identity provider"
phase: data
module: identity-permissions-residency
kind: lesson
summary: "You will not build authentication, you will wire into someone else's. Here is what SAML and OIDC actually exchange, why the failures cluster in the same three places, and how to read a SAML response when a login fails and nobody can tell you why."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Explain the SAML and OIDC login flows well enough to diagnose a failure without a diagram in front of you.
  - Read a SAML assertion or decode a JWT to find the actual claims a customer's IdP is sending.
  - Name the three most common reasons an SSO integration works in staging and fails in the customer's production tenant.
artifact: A minimal OIDC login flow, working end to end against a real identity provider's test tenant, with the claims it receives logged in full.
---

An enterprise customer will not let you build a login page. They have an identity provider — Azure AD (Entra ID), Okta, Ping, ADFS, or, at a public-sector or defence account, something homegrown — and every application in their environment, including yours, authenticates against it. Your job is not to build authentication. It is to wire into theirs correctly, and to be the person in the room who can read the error when it fails.

Two protocols cover almost every case: SAML, older and still common in large enterprises and government, and OIDC (built on OAuth 2.0), newer and now the default for most SaaS integrations. You need both, because the customer's IdP configuration, not your preference, decides which one you are debugging at 6 p.m. before a demo.

## What is actually being exchanged

Strip away the acronyms and both protocols do the same job: your application (the "relying party" in OIDC, the "service provider" in SAML) needs proof, signed by someone the customer's IT department trusts, that the person in the browser is who they say they are, and it needs a few facts about that person — an email, a name, sometimes a group membership.

**SAML** does this with XML. The user is redirected to the IdP, logs in there, and the IdP posts back a signed XML document called an assertion, containing the user's identity and any attributes the IdP is configured to release. Your application never sees a password; it only ever sees the signed assertion. The trust between your app and the IdP is established beforehand through metadata exchange — each side registers the other's certificate and endpoint URLs — which is why a new SAML integration always starts with a metadata file changing hands, not with code.

**OIDC** does the same job with JSON and REST calls instead of XML and browser redirects with form posts. The user is redirected to the IdP, logs in, and your application receives an authorization code it exchanges server-side for an **ID token** — a signed JWT containing claims about the user — and often an access token for calling further APIs. The trust is established through a client ID, a client secret, and the IdP's published metadata (its "discovery document," a well-known JSON URL listing every endpoint you need).

Neither protocol authenticates the user for you in any deep sense. Both hand you a signed statement from a system the customer already trusts, and your job is to verify the signature, read the claims, and map them onto whatever your application calls a user.

## Reading a SAML assertion

You will not write SAML from scratch. You will use a library — most languages have a mature one — and configure it against the customer's metadata. What you will do by hand, more than you expect, is read a raw SAML response when a login fails, because the error your library surfaces is often just "authentication failed" with no further detail.

A SAML response, once base64-decoded, is XML like this (trimmed):

```xml
<saml:Assertion>
  <saml:Subject>
    <saml:NameID Format="emailAddress">r.iyer@suryatex.example</saml:NameID>
  </saml:Subject>
  <saml:AttributeStatement>
    <saml:Attribute Name="department">
      <saml:AttributeValue>Operations</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="groups">
      <saml:AttributeValue>App-Advisors-APAC</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
  <saml:Conditions NotBefore="2026-09-02T09:00:00Z" NotOnOrAfter="2026-09-02T09:05:00Z"/>
</saml:Assertion>
```

Three things worth locating on sight, because they explain the most common failures: the `NameID`, which is the identity your application will map to a user record; the `AttributeStatement`, which carries everything else — department, group membership, employee id — and which the customer's IdP admin controls and can silently stop sending; and `Conditions`, the assertion's validity window, deliberately short. A base64-decoded SAML response can be pasted into any XML viewer or a browser extension built for the purpose (search "SAML tracer" for your browser) during a live debugging session, which turns "login is broken" into "the `groups` attribute is empty" in under a minute.

## Reading an OIDC ID token

The ID token is a JWT — three base64url-encoded segments separated by dots: header, payload, signature. The payload is the part you read.

```python
"""Decode (not verify) a JWT payload for debugging. Never skip verification in real code."""
import base64
import json

def decode_jwt_payload(token: str) -> dict:
    payload_b64 = token.split(".")[1]
    padded = payload_b64 + "=" * (-len(payload_b64) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))

# Paste a token captured from a failed login and inspect it directly:
# decode_jwt_payload(id_token)
# -> {"sub": "a1b2c3", "email": "r.iyer@suryatex.example",
#     "groups": [], "iss": "https://login.microsoftonline.com/...",
#     "exp": 1756800300}
```

That decode is unverified — fine for reading a claim during debugging, never acceptable in application code, where you must verify the signature against the IdP's published public key (most OIDC libraries do this for you if configured with the discovery URL) and check `exp`, `iss`, and `aud` before trusting anything in the payload.

Notice `"groups": []` in the example. That is the single most common finding in an SSO debugging session: the login succeeds, the token is valid, and the claim your application logic depends on is simply empty, because the customer's IdP admin has not configured that attribute or claim to be released to your application yet. This is a configuration change on their side, and it is worth knowing the exact term for what to ask for — in Azure AD, an "optional claim" or a "group claim" on the app registration; in Okta, an attribute statement on the SAML app or a custom scope on the OIDC app — because "can you send us the group membership" gets a slower, vaguer response than "can you add a group claim to the app registration."

## The three failures that recur

**Clock skew.** SAML's `Conditions` window and OIDC's `exp` claim are both narrow, deliberately, and a customer's IdP server clock a few minutes off from yours produces a signature or expiry failure that looks nothing like a clock problem in the error message. If a login fails intermittently and inconsistently, check the clocks before anything else.

**A claim the customer's IdP admin forgot to configure.** Covered above. It is not a bug in your code; it is a one-line configuration change on their side, and finding it fast depends on you being able to decode the token yourself rather than waiting for their identity team to investigate.

**Certificate rotation.** SAML trust is anchored to a certificate that expires and gets rotated, sometimes without the customer's IdP team notifying every relying party. A previously-working integration that starts failing signature validation on a specific date, with no code change on either side, is almost always this. Ask for the customer's certificate rotation schedule during setup, not after the first outage.

## What you can now do

You can explain SAML and OIDC well enough to know which one you are looking at from the login flow alone, decode a token or an assertion yourself during a live incident instead of waiting on the customer's identity team, and diagnose the three failures — clock skew, a missing claim, a rotated certificate — that account for most SSO incidents in the field. The next lesson uses the claims this page gets you access to — a user's identity and group membership — to decide what that user is actually allowed to see.
