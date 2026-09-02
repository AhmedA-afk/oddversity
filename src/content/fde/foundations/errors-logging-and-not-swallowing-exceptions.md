---
title: "Errors, logging, and never swallowing an exception"
phase: foundations
module: python-for-the-field
kind: lesson
summary: "The single most expensive mistake a junior engineer makes in a customer's environment is catching an exception and doing nothing with it. This lesson shows what to catch, what to log, and what to let crash."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - "Explain why a bare `except: pass` is worse than letting the program crash."
  - Set up Python's `logging` module with levels, a formatter, and enough context to debug a failure you cannot reproduce.
  - Decide, for a given failure, whether the correct move is to retry, fall back, or stop and page someone.
artifact: A revised version of the nightly export script from the previous lab, with logging that would let you explain a 3am failure without re-running anything.
---

Here is the failure mode that costs the most, in the field: not a crash, but silence. A script runs every night, hits a bad row, catches the exception, and moves on. Nobody sees an error because there was no error, as far as the program was concerned. Three weeks later someone in finance asks why the numbers have been off since the 12th, and the answer is buried in a `try/except` block that swallowed it.

You already wrote a script in the previous lab that calls a paginated API with auth and retries. This lesson is about what that script does when something goes wrong that a retry cannot fix.

## The sin, in code

```python
def load_customer(record):
    try:
        return {
            "id": record["id"],
            "email": record["email"].lower(),
            "signup_date": parse_date(record["signup_date"]),
        }
    except Exception:
        pass
```

This function will never raise. It will also, silently, return `None` for any record missing a key, any malformed email, any date in a format `parse_date` does not expect. The caller gets a list with holes in it and no way to know how many, or which records, or why. `except Exception: pass` is not error handling. It is deleting the evidence.

The fix is not "add a log line and move on" either, though that is a step up. The fix is deciding, for each kind of failure, what the correct behaviour actually is.

## Three questions before you write `except`

1. **Do I know exactly which exception I am catching?** `except Exception` catches everything, including `KeyboardInterrupt`'s cousins, typos in your own code (`AttriubteError` from a misspelled attribute), and bugs you have not found yet. Catch the specific type: `except KeyError`, `except ValueError`, `except requests.exceptions.Timeout`. If you cannot name the exception, you do not yet understand the failure well enough to handle it.
2. **What is the correct response — retry, skip-and-record, or stop?** A timed-out HTTP call might deserve a retry with backoff. A malformed record in a batch of ten thousand might deserve skip-and-record, so the batch finishes and you get a report of what was skipped. A missing database credential deserves neither: it should stop the program immediately, because continuing will fail on every subsequent call anyway and waste an hour before anyone notices.
3. **Will the next person who reads this log line know what to do?** "Error occurred" tells nobody anything. "Skipped record id=48213: signup_date 'N/A' is not a valid date, expected YYYY-MM-DD" tells the next person exactly what to fix, in the source system or in your parser.

## Logging, not `print`

`print` goes to stdout, has no levels, no timestamps unless you add them by hand, and disappears the moment the terminal closes unless you redirect it yourself. `logging` gives you levels, timestamps, and a single place to configure where output goes, whether that is a container's stdout (for `docker logs` and whatever log aggregator the customer runs), a rotating file, or both.

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("nightly_export")

def load_customer(record):
    try:
        return {
            "id": record["id"],
            "email": record["email"].lower(),
            "signup_date": parse_date(record["signup_date"]),
        }
    except KeyError as exc:
        logger.warning("Skipping record, missing field %s: %r", exc, record)
        return None
    except ValueError as exc:
        logger.warning("Skipping record %s, bad value: %s", record.get("id", "?"), exc)
        return None
```

The levels matter. `DEBUG` is for you, mid-investigation, and should be off in normal runs. `INFO` is "the program is doing what it should" — started, connected, processed 4,000 records. `WARNING` is "something is wrong but the program is continuing" — a skipped record, a retry. `ERROR` is "an operation failed" — this batch did not complete. `CRITICAL` is "the program cannot continue" — no database connection, no credentials. If everything you log is `INFO`, nobody will find the warning that mattered when the log has ten thousand lines in it.

## Re-raising with context

Sometimes you catch an exception not to handle it, but to add information before it propagates. Python's `raise ... from` keeps the original traceback attached, which matters when someone else has to debug this later:

```python
def fetch_page(session, url, params):
    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as exc:
        raise RuntimeError(
            f"API rejected page request for {url} with params {params}"
        ) from exc
```

Now the traceback shows both the original `HTTPError` (with the status code and response body) and the higher-level message that explains what the program was trying to do when it happened. Bare `raise` inside an `except` block also re-raises the original, which is correct when you are only logging and not adding context — but if you catch, log, and then swallow without re-raising or returning a sentinel, you are back to the original sin, just with a log line first.

## Fail loud versus fail soft

Not every failure should stop the world. The judgement call is specific to what the code does and who is depending on it.

- **Fail loud** (let it crash, or explicitly `sys.exit(1)` with a clear message) when continuing would produce silently wrong output — a missing exchange rate in a billing script, a failed authentication that would otherwise retry against a locked-out account, a schema mismatch that means every subsequent row will also fail.
- **Fail soft** (log a warning, skip the item, keep going) when the failure is local to one item and the rest of the batch is still valid — one malformed row in ten thousand, one customer's webhook that times out while the others succeed.

A nightly export that reads ten thousand rows and skips forty because of bad dates should finish, and its log — or better, a structured summary at the end — should say "10,000 read, 9,960 loaded, 40 skipped, see WARNING lines for ids." A script that cannot reach the database at all should not spend twenty minutes discovering that on row one, log a warning for each failed row, and exit 0 as if nothing happened. That is the difference between a script you can trust unattended and one that needs a human watching it every night, which defeats the point of automating it.

## The FDE version of this lesson

In an interview, this shows up as "walk me through what happens if this API call fails." The answer that gets a nod is not "I'd add a try/except" — it is naming the specific exception, the specific response (retry, skip, or stop), and what gets logged so that whoever is on call at 3am does not have to reproduce the failure to understand it. In the field, this is the difference between a customer trusting you to run something unattended in their environment and a customer insisting someone watch every job by hand, which is a trust you do not get back easily once you have lost it.
