---
title: "Auth, Worked: The Token That Expires at 3am"
track: "mcp"
status: live
summary: "A working OAuth integration traced through the exact moment it fails, why the failure is silent, and the refresh path that fixes it — including the rotated refresh token that locks you out on the second day."
duration: "10 min read"
---

This is the most expensive bug in MCP work, and it is expensive precisely because everything about it looks fine for the first hour.

## Hour zero: it works

The server calls a third-party API using an OAuth access token.

```python
import os, requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("calendar")
ACCESS_TOKEN = os.environ["CALENDAR_ACCESS_TOKEN"]

@mcp.tool()
def list_events(day: str) -> list[dict]:
    """List calendar events for one day, in ISO format (2026-08-30)."""
    r = requests.get(
        "https://api.example.com/v1/events",
        params={"day": day},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
        timeout=10,
    )
    if r.status_code != 200:
        return []                      # ← the line that will cost you a night
    return r.json()["events"]
```

**Output:** the assistant lists the day's events. You ship it.

## Hour one: it stops, and says nothing

The access token expires. The API starts answering:

```
HTTP/1.1 401 Unauthorized
{"error": "invalid_token", "error_description": "Access token expired"}
```

Your tool returns `[]`. The model receives an empty list, which is a perfectly ordinary result, and tells the user: **"You have no events that day."**

That is the whole failure. Not an error, not a crash — a confident, wrong, plausible answer, produced by a system that is working exactly as written.

Two things conspired:

1. **The token expired**, which was always going to happen. Access tokens are short-lived by design.
2. **The error was swallowed**, so a failure became a result.

Fix the second one first, because it is one line and it makes the first one visible.

```python
    if r.status_code == 401:
        raise ValueError("calendar authorization expired — token refresh failed")
    r.raise_for_status()
```

**Output after this change:** the assistant now says the calendar lookup failed to authorise. Still broken, but honestly broken — and you find out in minutes instead of from a user in a week.

## The refresh path

Along with the access token, the authorisation grant gave you a **refresh token**, which is long-lived and exchanges for new access tokens.

The naive version reacts to a 401. Do not do that: it costs a wasted round trip on every expiry, and some providers return a shape you cannot cleanly distinguish from a permissions error. Refresh *before* expiry.

```python
import threading, time

class Token:
    def __init__(self, access: str, refresh: str, expires_at: float):
        self.access, self.refresh, self.expires_at = access, refresh, expires_at
        self._lock = threading.Lock()

    def valid(self) -> str:
        # 60s of headroom: clocks drift and requests take time.
        if time.time() > self.expires_at - 60:
            with self._lock:
                if time.time() > self.expires_at - 60:   # re-check inside the lock
                    self._refresh()
        return self.access

    def _refresh(self) -> None:
        r = requests.post(
            TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": self.refresh,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        self.access = data["access_token"]
        self.expires_at = time.time() + data["expires_in"]
        # Some providers rotate the refresh token. Miss this and you are
        # locked out on the *next* refresh, roughly a day later.
        if "refresh_token" in data:
            self.refresh = data["refresh_token"]
            save_refresh_token(self.refresh)             # persist it
```

Then every call goes through `valid()`:

```python
headers={"Authorization": f"Bearer {token.valid()}"}
```

**Output:** the server keeps working overnight, and the refresh happens invisibly a minute before each expiry.

## Day two: the second failure

You ship the refresh logic without `save_refresh_token`. It works all day. The next morning, every call fails with `invalid_grant`.

Here is why. Your provider rotates refresh tokens: each refresh returns a *new* refresh token and invalidates the old one. You held the new one in memory and used it happily. Then the process restarted — a reboot, a redeploy, a client relaunch — and reloaded the *original* refresh token from the environment. That one was invalidated hours ago.

The account is now locked out until a human re-authorises.

**The fix is two parts:** keep the rotated token, and persist it somewhere that survives a restart.

```python
def save_refresh_token(value: str) -> None:
    path = Path(os.environ["TOKEN_STORE"])
    path.write_text(value)
    path.chmod(0o600)
```

Not every provider rotates. Handle it anyway — the code is three lines and the failure mode is a locked account.

## The trace, end to end

| Time | What happens | What the user sees |
|---|---|---|
| 0:00 | Token valid, tool returns events | Correct answer |
| 1:00 | Token expired, 401 swallowed | **"You have no events"** — wrong, confident |
| 1:00 (fixed) | 401 raised as an error | "The calendar lookup failed to authorise" |
| 0:59 (refreshed) | Proactive refresh, new access token | Correct answer, no interruption |
| Day 2, restart | Stale refresh token reloaded | `invalid_grant`, account locked out |
| Day 2 (persisted) | Rotated token loaded from store | Correct answer |

## What to take from this

The token expiry is not the interesting part — it is scheduled, documented and inevitable. The interesting part is that **a swallowed error turns an outage into a lie**, and that the lie is fluent enough to reach a customer.

Whenever a tool has an `except` that returns an empty result, ask what the model will tell the user when that branch runs.

---

Next: [auth approaches compared](/learn/mcp/mcp-auth-compared) for choosing an arrangement, and [common mistakes](/learn/mcp/mcp-auth-common-mistakes).
