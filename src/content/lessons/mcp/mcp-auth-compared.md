---
title: "MCP Auth Approaches Compared"
track: "mcp"
status: live
summary: "Five ways an MCP server gets credentials — environment variables, OAuth with refresh, delegated user tokens, service accounts and per-request bearer tokens — with what each protects and what it cannot."
duration: "10 min read"
---

"Authentication for an MCP server" is really two questions that people collapse into one:

1. **Who is calling the server?** Only exists as a question over a network transport.
2. **As whom does the server act on a downstream API?** Exists always.

Getting these confused is why servers end up with a credential in a tool argument. Below are the five arrangements you will actually meet.

## 1. Environment credentials, single identity

The server reads an API key from its environment and acts as one fixed identity for everyone.

```python
API_KEY = os.environ["SERVICE_API_KEY"]
```

**Protects:** the credential from the model — it is never in a schema, an argument, or a transcript.

**Does not protect:** anything about who is calling. Every user of this server has the full authority of that key.

**Use when:** stdio, single user, and the key belongs to that user. This is the correct answer for most local servers and it is not a compromise.

**Fails when:** the server becomes shared. One key for many people means no per-user scoping and no revocation short of rotating for everyone.

## 2. OAuth with refresh, acting for one user

The server holds an access token and a refresh token for a third-party API and mints new access tokens before expiry.

**Protects:** long-lived access without storing the user's password, and a revocable grant.

**Does not protect:** you from the classic failure — access tokens are typically short-lived, and a server that fetches one at startup goes silent an hour later. The 401 is often swallowed by a tool that returns an empty result, so the model reports "nothing found" instead of "authentication failed".

**Use when:** the server calls an API on behalf of one identified user over time.

**The non-negotiable detail:** refresh *ahead* of expiry, and persist a rotated refresh token if the provider issues one. Waiting for a 401 is one round trip too late and some providers do not give you a clean one.

```python
def valid(self) -> str:
    if time.time() > self.expires_at - 60:      # refresh early
        self._refresh()
    return self.access
```

## 3. Delegated user tokens, per request

The client passes the end user's token to the server, which uses it downstream. The server holds no long-lived credential of its own.

**Protects:** per-user scoping for free — the downstream API enforces exactly what that user may do, and revocation is immediate.

**Does not protect:** against a server that logs the token, or one that caches a result from user A and serves it to user B.

**Use when:** a hosted multi-user server sits in front of an API that already has a per-user permission model.

**Fails when:** the token audience is wrong. A token minted for one service should not be accepted by another; validate the audience rather than assuming a valid signature means a valid recipient.

## 4. Service account, server-side authorisation

The server holds one privileged credential but decides per request what the caller may do, using its own authorisation layer.

**Protects:** a clean separation — a powerful downstream credential, narrow effective permissions.

**Does not protect:** you from your own bugs. Every authorisation decision is now code you wrote, and a missed check is a full privilege escalation because the underlying credential is broad.

**Use when:** the downstream system has no per-user model, or performance requires connection pooling under one identity.

**The non-negotiable detail:** scope inside the tool, not around it.

```python
@mcp.tool()
def search_notes(query: str) -> list[dict]:
    """Search your notes."""
    principal = current_request().state.principal
    return _search(query, owner=principal.user_id)     # scoped, always
```

## 5. Per-request bearer token to the server itself

The transport-level answer to "who is calling": the client presents a token, middleware verifies it, and the request carries a principal.

**Protects:** the server's own endpoint from anonymous callers.

**Does not protect:** anything downstream by itself — it establishes identity, and you still have to use it.

**Use when:** any HTTP transport. There is no version of a network-reachable server where this is optional.

## Side by side

| | Env credential | OAuth + refresh | Delegated token | Service account | Bearer to server |
|---|---|---|---|---|---|
| **Answers "who is calling"** | No | No | Yes | Partly | Yes |
| **Answers "as whom downstream"** | One identity | One user | The caller | One identity | No |
| **Per-user scoping** | None | None | Automatic | Your code | Enables it |
| **Revocation** | Rotate for everyone | Revoke the grant | Immediate | Rotate for everyone | Revoke the token |
| **Main hazard** | Shared authority | Silent expiry | Token audience and caching | A missed check | Assuming it is enough |
| **Typical fit** | Local stdio | Local, one user, third-party API | Hosted multi-user | Hosted, no per-user model | Any HTTP server |

## Choosing

- **Local, single user, no third-party API** → environment credential. Done.
- **Local, single user, third-party API** → environment credential plus OAuth with proactive refresh.
- **Hosted, multi-user, downstream has per-user permissions** → bearer to the server, then delegated tokens downstream.
- **Hosted, multi-user, downstream has no per-user model** → bearer to the server, then a service account with per-caller scoping written into every tool.

## The rule that survives all five

**A credential is never a tool parameter.** Tool arguments are chosen by a model that has been reading text you do not control, and they appear in schemas, transcripts and logs. Credentials come from the environment or from a verified request context — never from the model.

---

Next: [auth, worked](/learn/mcp/mcp-auth-worked-example) builds the refresh path against a real expiry, and [common mistakes](/learn/mcp/mcp-auth-common-mistakes).
