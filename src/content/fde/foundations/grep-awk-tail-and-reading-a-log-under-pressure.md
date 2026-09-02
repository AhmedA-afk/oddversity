---
title: "grep, awk, tail -f: reading a log while someone watches"
phase: foundations
module: shell-and-linux
kind: lesson
summary: "Log-reading fluency is one of the clearest field skills there is: it's the difference between finding the failing request in twenty seconds with the customer's ops lead standing behind you, and scrolling a file for five minutes in silence."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Filter, count, and extract fields from a live log using grep and awk without looking up flags.
  - Follow a log in real time with tail -f and combine it with grep for a live filtered view.
  - Turn a vague complaint ("it's slow sometimes") into a specific count of errors by endpoint, by hour, from raw log lines.
artifact: A three-line pipeline, saved in your journal, that answers a real question you had about a real log — your own service, or a sample nginx/app log.
---

Every customer engagement eventually comes down to someone saying "it's broken" or "it's slow" with no more detail than that, and a log file that's the only source of truth in the room. The engineers who look competent in that moment aren't the ones who know a hundred `grep` flags — they're the ones who reach for the same five or six tools fluently enough that finding the answer takes less time than the person watching expects it to.

## grep: finding lines

```bash
grep "500" access.log                 # lines containing "500"
grep -i "error" app.log               # case-insensitive
grep -v "health-check" access.log     # invert: lines NOT matching
grep -n "timeout" app.log             # show line numbers
grep -c "500" access.log              # count matching lines, don't print them
grep -E "50[0-9]" access.log          # extended regex: any 5xx status
grep -A 3 -B 1 "Traceback" app.log    # 3 lines After, 1 line Before each match
```

`-A`/`-B`/`-C` (context) are the ones people forget and need constantly — a single matching line is rarely the whole story; the stack trace is the ten lines after it, and the request that triggered it is the line before. `grep -E` (or `egrep`) gives you real regex, which matters the moment you need "any of these status codes" or "a UUID-shaped string" rather than one literal substring.

## awk: pulling out fields

`awk` treats each line as a set of whitespace-separated fields — `$1`, `$2`, and so on, with `$0` meaning the whole line. For a standard nginx access log line like:

```
203.0.113.44 - - [01/Sep/2026:14:22:07 +0530] "GET /api/claims/4471 HTTP/1.1" 500 812
```

```bash
awk '{print $1, $9}' access.log
# 203.0.113.44 500
```

`$1` is the IP, `$9` is the status code in this log format (count fields by hand once for whatever format you're actually looking at — they're not universal). To filter by field value instead of by regex on the whole line:

```bash
awk '$9 == 500' access.log                          # only 500s
awk '$9 >= 500' access.log                           # any 5xx and above
awk '{print $9}' access.log | sort | uniq -c | sort -rn   # count by status code, most common first
```

That last pipeline — extract a field, `sort`, `uniq -c`, `sort -rn` — is the single most useful three-command combination in this whole lesson. It turns any column of repeated values into a ranked frequency count: status codes, endpoints, IP addresses, whatever field you point it at.

```bash
awk -F'"' '{print $2}' access.log | awk '{print $1, $2}' | sort | uniq -c | sort -rn | head -10
```

That finds the ten most common method+path combinations in the log — `-F'"'` splits on quotes to isolate the `"GET /api/claims/4471 HTTP/1.1"` portion, then a second `awk` pulls the method and path out of it. Building a pipeline like this in front of someone, one piped stage at a time, checking the output after each stage, is exactly how you'd actually do it live — you don't write the whole thing blind.

## tail -f: watching it happen

```bash
tail -f app.log                       # follow the file as new lines are appended
tail -n 200 app.log                   # last 200 lines, no following
tail -f app.log | grep --line-buffered "ERROR"   # follow, filtered live
```

`--line-buffered` matters when piping `grep` into a following `tail` — without it, `grep`'s output buffering can delay what you see by several seconds or until the buffer fills, which defeats the point of watching something live. `less +F filename` is a good alternative to `tail -f` when you might need to stop following and scroll back without losing your place — `Ctrl-C` drops out of follow mode into normal `less`, and `Shift-F` re-enters it.

For services under `systemd`, the equivalent live view is `journalctl -u myservice -f`, and `journalctl -u myservice --since "10 minutes ago"` for a bounded window instead of the whole history.

## The scenario: "it's slow sometimes," in real time

Someone from the customer's ops team says the API has been slow intermittently since this morning, standing next to you, wanting an answer now. A reasonable sequence:

```bash
# how many 5xx in the last hour, roughly
grep "01/Sep/2026:1[45]:" access.log | awk '$9 >= 500' | wc -l

# which endpoints are erroring, ranked
grep "01/Sep/2026:1[45]:" access.log | awk '$9 >= 500 {print $7}' | sort | uniq -c | sort -rn

# is it one IP hammering one endpoint, or spread out
awk '$9 >= 500 {print $1}' access.log | sort | uniq -c | sort -rn | head -5

# watch it live while you talk
tail -f access.log | grep --line-buffered -E '" (5[0-9]{2}) '
```

Four commands, each answering one narrowing question, each one informing the next. This is the actual shape of live debugging under pressure: not one clever regex that finds the answer instantly, but a short sequence of simple filters, each checked before deciding the next one.

## Two habits that separate fluent from fumbling

**Pipe into `wc -l` or `head` before you trust a command against a huge file.** `grep "error" app.log` on a ten-gigabyte log with no filter on time range will scroll for a while and produce more output than anyone can read. Narrow first (`grep` a timestamp prefix, or use `tail -n 100000` to bound the search), then refine.

**Say what you're checking, out loud, before you run it.** "Let me count 5xx by endpoint in the last hour" followed by the command reads as method. Running commands silently and announcing only the final answer reads as either luck or, if it takes a few tries, floundering. The narration is not for show — it's what lets the person watching correct you ("actually the timestamps are UTC, not IST") before you go down the wrong path for five minutes.

## The FDE version of this lesson

This exact skill — grep, awk, tail, live, on an unfamiliar log format — is called out explicitly as a Tier 1 emphasis that standard CS curricula skip and FDE interviews test directly, often as part of a debugging round where the interviewer hands you a log file cold. The bar is not knowing every flag. It's not needing to look any of them up while someone is watching the terminal over your shoulder, because in the field that someone is a customer deciding, in real time, whether to trust you with more access.
