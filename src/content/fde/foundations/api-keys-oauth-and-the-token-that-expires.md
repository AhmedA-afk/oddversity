---
title: "API keys, OAuth 2.0, and the token that expires at the worst time"
phase: foundations
module: http-apis-and-auth
kind: lesson
summary: "Every enterprise integration you build will authenticate somehow, and the customer's identity team will decide how. Learn the four OAuth flows you will actually meet, what a JWT is, and why the demo that worked yesterday returns 401 today."
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Walk through the client credentials and authorization code flows out loud, naming every party and every hop.
  - Decide which flow a given integration needs, and what to ask the customer's identity team for.
  - Handle token expiry, refresh and clock skew in code so a long-running job does not die at hour three.
artifact: A reusable Python token-cache helper that refreshes before expiry, in your public repo.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://www.krishnaik.in/liveclass2/Forward_Deployed_Engineer?id=14
---

OAuth flows are on the short list of things practitioner sources say a deployed engineer must be able to explain without looking up, and one commercial FDE bootcamp builds an entire capstone around OAuth 2.0 with role-based access control. There is a reason. Authentication is the first thing you touch in a customer's environment and the thing most likely to be owned by a team that does not report to your sponsor.

## The simple case: API keys

A long-lived secret string, sent on every request.

```bash
curl -H "Authorization: Bearer sk_live_9f2b..." https://api.vendor.com/v1/items
```

Simple, and that is the whole of its appeal. The problems are structural: a key does not expire, does not identify a human, is usually all-or-nothing in scope, and once it appears in a Slack message or a `.env` file committed by accident, it is compromised forever until someone rotates it.

Practical rules. Keys go in environment variables or the platform's secret store, never in code, never in a notebook, never in a screenshot during a demo. Use separate keys per environment so revoking staging does not take down production. Ask, on day one, who can rotate the key and how long rotation takes, because the answer in a bank is not "immediately".

## OAuth 2.0, in one paragraph

OAuth exists to solve a specific problem: letting an application act on a resource without holding the user's password. Four parties. The **resource owner** (a person, usually), the **client** (your application), the **authorization server** (the identity provider: Okta, Entra ID, Auth0, Google, Keycloak), and the **resource server** (the API holding the data). The client obtains a short-lived **access token** from the authorization server and presents it to the resource server. That is the entire idea; the flows are just different routes to getting the token.

Note the split that trips people up: OAuth 2.0 is about *authorisation* — what an application may do. **OpenID Connect** is a thin layer on top that adds *authentication* — who the user is — via an additional `id_token`. When a customer says "we use SSO", they usually mean OIDC on top of OAuth, and the piece you need is often the ID token's claims for identity plus the access token for API calls.

## The two flows you will actually use

### Client credentials: machine to machine

Your service talks to their API. There is no user. This is the flow for a nightly export, a sync job, a backend integration.

```text
your service  --(client_id + client_secret, scope)-->  authorization server
your service  <--(access_token, expires_in)---------   authorization server
your service  --(Authorization: Bearer ...)--------->  resource server
```

```bash
curl -sS -X POST https://login.example.com/oauth2/v1/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "scope=invoices.read"
```

The response contains an `access_token`, a `token_type` of `Bearer`, and `expires_in` in seconds, commonly 3600. There is normally no refresh token in this flow; when the token expires you simply request another.

What to ask the customer's identity team, in one message: the token endpoint URL, a client ID and secret for a service principal, the exact scopes needed, whether the client is confidential or public, and whether there is an IP allowlist on the token endpoint. That last one is why your call works from your laptop on their VPN and fails from the container in their VPC.

### Authorization code with PKCE: on behalf of a user

Your application needs to act as a specific person, seeing only what that person may see. This is the flow behind every "Sign in with..." button, and it is what a permissioned retrieval system needs when a wealth advisor must only see their own book of business.

1. Your app redirects the user's browser to the authorization server, with `client_id`, `redirect_uri`, `scope`, `state`, and a `code_challenge`.
2. The user authenticates there. Your app never sees the password.
3. The authorization server redirects back to your `redirect_uri` with a short-lived **authorization code** and the `state` you sent.
4. Your app exchanges that code, plus the `code_verifier`, at the token endpoint for an access token and usually a refresh token.

Two of those parameters exist purely to stop attacks and both are commonly omitted by people who are learning. `state` is a random value you generate and verify on return; it prevents cross-site request forgery. PKCE (`code_challenge` and `code_verifier`) prevents a stolen authorization code from being redeemed by an attacker. Use both, always, including for confidential clients.

The implicit flow, where a token comes straight back in the URL fragment, is obsolete. If a customer's documentation still describes it, that documentation is old, and it is a reasonable thing to raise politely.

## What is inside the token

Most enterprise access tokens are JWTs: three base64url segments separated by dots, `header.payload.signature`. The payload is readable by anyone. It is not encrypted; it is *signed*, which means it cannot be altered without detection but can be read by anyone who intercepts it.

You can inspect one locally, which is far better practice than pasting a customer's token into a website:

```python
import base64, json

def decode_jwt_payload(token: str) -> dict:
    payload = token.split(".")[1]
    padded = payload + "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))
```

Claims worth knowing: `exp` (expiry, Unix seconds), `iat` (issued at), `iss` (issuer), `aud` (audience: which API this token is for), `sub` (subject), and `scope` or `roles`. A very large share of "it returns 403 and I do not know why" resolves to the `aud` claim naming a different API than the one you are calling, or a scope you were never granted. Decode the token and read it before you open a ticket.

Decoding is for diagnosis. **Never trust an unverified token in your own service.** If you are the resource server, verify the signature against the issuer's published keys using a real library, and check `exp`, `iss` and `aud`. Do not hand-roll this.

## The token that expires at the worst time

Here is the field failure. Your export job authenticates at the start, then runs for four hours across ninety thousand paginated records. At hour one the token expires. Every subsequent request returns 401. If your retry logic treats 401 as fatal, the job dies at 2am; if it retries blindly without refreshing, it hammers the API and gets rate-limited too.

Fix it once, in a helper you carry between engagements.

```python
import time
import requests

class TokenCache:
    """Fetches and caches a client-credentials token, refreshing before expiry."""

    def __init__(self, token_url: str, client_id: str, client_secret: str,
                 scope: str, skew_seconds: int = 60) -> None:
        self.token_url = token_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.scope = scope
        self.skew = skew_seconds
        self._token: str | None = None
        self._expires_at: float = 0.0

    def get(self) -> str:
        if self._token is None or time.time() >= self._expires_at - self.skew:
            self._fetch()
        return self._token

    def _fetch(self) -> None:
        response = requests.post(
            self.token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": self.scope,
            },
            timeout=15,
        )
        response.raise_for_status()
        body = response.json()
        self._token = body["access_token"]
        self._expires_at = time.time() + float(body.get("expires_in", 3600))
```

Three details are load-bearing. The **skew** means you refresh sixty seconds early rather than at the exact moment of expiry, which covers clock drift between your machine and theirs and the time your request spends in flight. The **timeout** means a hung token endpoint does not hang your job forever. And expiry is tracked as an absolute time, not a countdown, so a paused process does not think its token is still fresh.

Then, in the request layer, treat a single 401 as "refresh and retry once", and a second consecutive 401 as fatal. Retrying a 401 forever is how you get an account locked in someone else's environment.

## What to ask for, and when

Credentials in an enterprise are a lead-time item. On day one, in writing, ask for: the environment (which tenant, which URL), the flow they expect you to use, a service principal with the specific scopes named, who approves scope changes, the expiry policy, and whether there is an allowlist on the token endpoint or the API. Then test each credential the day you receive it, from the machine that will actually use it in production, not from your laptop.

Credentials that work from your laptop and not from the deployment target is one of the two or three most common surprises in a first deployment, and the networking module explains why.
