---
title: "MCP Auth and Security: Common Mistakes"
track: "mcp"
status: live
summary: "Six auth mistakes — credentials as tool arguments, reacting to 401s instead of refreshing, unscoped tools on a shared server, and trusting a signature without checking the audience."
duration: "9 min read"
---

## 1. A credential as a tool parameter

**You probably think** passing an API key as an argument is flexible — different callers, different keys.

**Why it breaks:** a tool argument is chosen by the model, appears in the tool schema, travels in the conversation, and lands in every trace and log along the way. You have taken a secret and put it in the one place in the system with the widest distribution.

**The correct model:** credentials come from the process environment or from a verified request context. The model never sees one and never chooses one.

```python
# Wrong
@mcp.tool()
def fetch(url: str, api_key: str) -> str: ...

# Right
API_KEY = os.environ["SERVICE_API_KEY"]

@mcp.tool()
def fetch(url: str) -> str: ...
```

**How to spot it live:** grep your tool signatures for `key`, `token`, `secret`, `password`.

## 2. Waiting for a 401 to refresh

**You probably think** reacting to the failure is the natural design.

**Why it breaks:** every expiry costs a wasted round trip, concurrent requests all fail at once and stampede the refresh endpoint, and some providers return a shape you cannot cleanly distinguish from a permissions error — so you retry a request that was never going to succeed.

**The correct model:** refresh proactively, with headroom, behind a lock.

```python
if time.time() > self.expires_at - 60:
    with self._lock:
        if time.time() > self.expires_at - 60:
            self._refresh()
```

**How to spot it live:** a burst of 401s in your logs at regular intervals matching the token lifetime.

## 3. Dropping a rotated refresh token

**You probably think** the refresh token is fixed and only the access token changes.

**Why it breaks:** many providers rotate — each refresh returns a new refresh token and invalidates the old one. If you hold the new one only in memory, everything works until the process restarts and reloads the original from the environment. That one was invalidated hours ago, and the account is locked out until a human re-authorises.

**The correct model:** persist the rotated token to storage that survives a restart.

```python
if "refresh_token" in data:
    self.refresh = data["refresh_token"]
    save_refresh_token(self.refresh)
```

**How to spot it live:** works all day, `invalid_grant` the morning after a deploy or reboot.

## 4. A shared server with unscoped tools

**You probably think** authentication middleware is the security work, and the tools are unchanged.

**Why it breaks:** middleware establishes *who* is calling. It does nothing about *what they get*. A tool that queried the whole table when it ran locally as one user still queries the whole table when it runs for a thousand — and the code looks correct while doing it.

**The correct model:** scope inside the tool, using the authenticated principal, on every query.

```python
@mcp.tool()
def search_notes(query: str) -> list[dict]:
    """Search your notes."""
    principal = current_request().state.principal
    return _search(query, owner=principal.user_id)
```

**How to spot it live:** two accounts, one query. If B sees A's data, every tool needs auditing.

## 5. Verifying the signature but not the audience

**You probably think** a valid token is a valid token.

**Why it breaks:** a token minted for another service, by the same issuer, will verify perfectly against the same public key. If you do not check that the token was issued *for you*, any service sharing an identity provider can be used to obtain credentials that your server accepts.

**The correct model:** verify issuer, audience and expiry, not just the signature.

```python
claims = jwt.decode(
    token, key, algorithms=["RS256"],
    audience="https://notes.example.com/mcp",     # this server
    issuer="https://auth.example.com/",
)
```

**How to spot it live:** try a token issued for a sibling service. If it works, this is why.

## 6. Treating the system prompt as an access control

**You probably think** "never delete without confirming" in the instructions is a rule.

**Why it breaks:** the model reads content you do not control — documents, tickets, web pages, tool results — and that content can carry instructions. There is no reliable way for a model to distinguish an instruction in its context from an instruction in its system prompt. The instruction is a strong prior, not a boundary.

**The correct model:** the control is that the destructive path is unreachable without a check your code enforces, showing the resolved arguments to a human.

```python
if not ctx.approval.granted("email:external", to=recipient):
    raise ApprovalRequired(f"external recipient {recipient} needs confirmation")
```

Keep the system-prompt instruction too — it is cheap and it raises the bar. Just do not count it.

**How to spot it live:** put an injection attempt in a document the agent reads and assert the tool was not called. If you have never run that test, you do not know.

---

Next: [the auth cheatsheet](/learn/mcp/mcp-auth-cheatsheet), and [check yourself](/learn/mcp/mcp-auth-quiz).
