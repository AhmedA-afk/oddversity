---
title: "Virtual environments and dependency files"
phase: foundations
module: python-for-the-field
kind: lesson
summary: Why your script breaks on the customer's machine, and the four commands that fix it. Virtual environments, pinned requirements, lock files, and how to install anything at all inside an air-gapped network.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Create, activate and rebuild a virtual environment, and explain what it actually changes.
  - Produce a dependency file that reproduces the same versions on someone else's machine.
  - Install a full dependency tree onto a machine with no internet access.
artifact: A requirements.txt with pinned versions and a vendor/ directory of wheels, proving your project installs offline.
---

There is a category of deployment failure that has nothing to do with your code. The script runs on your laptop. It fails on the customer's server with an error inside a library you did not write. Someone suggests upgrading the library. That breaks a different tool on the same server, which belongs to a team you have not met. Half a day gone.

Virtual environments exist so this conversation never happens. It is a small topic with a large payoff, and it is worth doing correctly from your first project rather than after your first incident.

## What the problem actually is

By default, `pip install` puts a package into a single system-wide location shared by every Python program on the machine. Two consequences.

One version of a library serves everything. Your project needs `requests` 2.31 and the customer's backup tool needs 2.19, and only one of them can be installed.

You may not be allowed to write there anyway. On a hardened Linux box you are not root, and `pip install` fails with a permissions error. The tempting fix, `sudo pip install`, is the one that modifies the operating system's own Python and is how you break a customer's server on day one. Do not do it. If you learn nothing else from this lesson, learn that.

## The four commands

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install requests
deactivate
```

On Windows PowerShell the activation line is `.venv\Scripts\Activate.ps1`.

`python3 -m venv .venv` creates a directory containing its own `python` and its own `site-packages`. Nothing is installed globally, nothing needs root, and deleting the directory undoes everything.

Activation prepends that directory's `bin` to your `PATH`, so `python` and `pip` now resolve to the copies inside it. That is the entire mechanism. It is a path manipulation, not magic, and knowing that lets you debug it: when a package you just installed is not found, run `which python` and `which pip` and confirm they point inside `.venv`.

Add `.venv/` to `.gitignore`. You commit the recipe, never the environment. It contains compiled artefacts for your operating system and processor and is worthless on any other machine.

If activation is inconvenient, in a cron job or a systemd unit for example, call the interpreter by its full path instead. It works identically:

```bash
/opt/fieldkit/.venv/bin/python -m fieldkit.export --input /data/day.csv
```

## Pinning, and why exact versions

```bash
pip freeze > requirements.txt
```

That writes every installed package at its exact version:

```
certifi==2026.6.15
charset-normalizer==3.4.1
idna==3.10
requests==2.32.4
urllib3==2.3.0
```

Rebuild it anywhere with `pip install -r requirements.txt`.

Two habits distinguish a file that helps from one that lies.

**Pin exactly, with two equals signs.** `requests>=2.31` is a promise that whatever version exists on the day the customer installs will be fine. It will not always be fine, and the failure lands months later when you are not there.

**Freeze from a clean environment.** If you ever installed something into this venv to try it out, `pip freeze` records it, and now your requirements file installs a machine-learning framework onto a locked-down server for no reason. Delete `.venv`, recreate it, install only what the project imports, freeze again.

The distinction worth carrying forward: a project's direct dependencies belong in `pyproject.toml`, and the fully resolved set of every transitive dependency at an exact version belongs in `requirements.txt`. The first says what you need. The second says what you tested. Tools like `pip-tools`, `uv` and Poetry formalise this into a source file plus a lock file, and if the customer's team already uses one, use theirs. Fitting into their conventions is worth more than the merits of yours.

Include hashes when the environment is sensitive:

```bash
pip install --require-hashes -r requirements.txt
```

A requirements file with hashes fails loudly if a package on the index has been replaced, which is the supply-chain question every enterprise security review will ask you about.

## Python versions are a dependency too

The venv is built from whichever `python3` invoked it, and it does not pin that. If the customer's box has 3.9 and you developed on 3.12, syntax you used casually will fail to parse. Record the requirement, in `pyproject.toml` as `requires-python`, in the README in words, and check it at startup if the cost of being wrong is high:

```python
import sys
if sys.version_info < (3, 11):
    raise SystemExit(f"needs Python 3.11+, found {sys.version.split()[0]}")
```

That error message is worth more than it looks. The alternative is a traceback deep inside a library that tells the customer's engineer nothing.

## Installing where there is no internet

This is where the lesson becomes FDE-specific rather than general Python hygiene. Deployments regularly happen inside a VPC with no egress, behind a proxy that only allows an approved list of hosts, or in a genuinely air-gapped enclave. Air-gapped and highly regulated environments appear explicitly in postings for this role. `pip install requests` will simply hang or fail.

The pattern is to download on a connected machine and carry the artefacts in.

On a machine with internet, matching the target's platform and Python version:

```bash
pip download -r requirements.txt -d vendor/ \
  --platform manylinux2014_x86_64 --python-version 3.11 \
  --only-binary=:all:
```

Transfer `vendor/` by whatever route the customer permits, then on the target:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --no-index --find-links vendor/ -r requirements.txt
```

`--no-index` forbids reaching for the network at all, which is what makes this a test rather than a hope. Run that install on a disconnected machine before you travel. Discovering on site that one package has no wheel for the target platform and needs a compiler you are not allowed to install is a bad afternoon, and it is entirely avoidable by rehearsing.

Two variations you will meet. Some enterprises run an internal package mirror such as Artifactory or Nexus; you point pip at it with `--index-url` and your problem becomes getting your dependency approved rather than transferred. And where there is a proxy, `pip` respects `HTTPS_PROXY`, and a TLS-intercepting proxy additionally needs its certificate, which the TLS lesson in this phase covers.

## What this lets you do in the field

Install your tool on a machine you have never seen, with no internet, without touching the system Python, and prove beforehand that it will work. That is a specific, unglamorous capability that separates people who demo from people who deploy. It also makes the handover honest: the customer's engineer runs four commands from your README and has a working environment, rather than an afternoon of dependency archaeology.

## What an interviewer can test

Two ways. A take-home reviewer clones your repository and follows your README; a missing or unpinned dependency file is visible in the first minute. And a deployment-flavoured system design question, common in loops for this role, may ask how you would install a Python service into an air-gapped environment. The answer above, download wheels for the target platform, transfer, install with no index, and rehearse it on a disconnected machine, is the answer they are looking for, and very few candidates have it ready.
