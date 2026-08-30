---
title: "Virtual Environments: One Sandbox per Project"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough of what a Python virtual environment actually is — its own interpreter reference, its own site-packages, its own PATH — using the concrete break of one machi"
duration: "12 min read"
---

Your legacy ETL script needs pandas 1.5. The new pipeline you're building this week needs pandas 2.2. Both live on the same laptop. If there's only one Python and one place `pip install` can write to, you cannot have both versions installed at the same time — the second install just overwrites the first. A virtual environment is the thing that makes "both at once" stop being a contradiction.

## What it is

A virtual environment is a directory that gives one project three things of its own:

- **An interpreter reference** — not a full duplicate copy of Python, just a pointer back to a base install, tagged so tools can treat it as a distinct environment.
- **Its own `site-packages` folder** — the actual directory `pip install` writes into. Empty when the environment is new.
- **A PATH override** — an activation step that puts this environment's `python` and `pip` in front of every other one on your machine, so typing `python` finds *this* copy first.

That's it. You're not getting a different language. You're getting an empty shelf for packages, plus a switch that makes `python` and `pip` look at that shelf instead of the one every other project shares.

Run this and look at what you get:

```bash
python3 -m venv .venv
find .venv -maxdepth 3
```

```
.venv/
├── pyvenv.cfg
├── bin/
│   ├── python -> /usr/bin/python3.11   # a symlink, not a copy
│   ├── pip
│   └── activate                         # the script that rewires PATH
└── lib/
    └── python3.11/
        └── site-packages/               # empty — this is where installs land
```

`pyvenv.cfg` is small and worth reading once:

```
home = /usr/bin
include-system-site-packages = false
version = 3.11.6
```

That `home` line is the pointer back to the base interpreter. `include-system-site-packages = false` is the isolation switch — it means this environment will *not* fall back to the machine-wide `site-packages` when it can't find a package, which is exactly the property you want.

## The mental model

Picture the global Python install as a single shared toolbox in a shed everyone on the machine uses. Every project that runs `pip install` is reaching into the same shed. If project A needs the 1.5 wrench and project B needs the 2.2 wrench, and there's only one hook for "the wrench," somebody's project breaks the moment the other one installs.

A virtual environment isn't a separate shed (a separate Python build) — it's a separate, personal toolbox that happens to borrow the same underlying tools (the interpreter binary) but keeps its own inventory (`site-packages`). Give every project its own toolbox and the collision disappears, because there's no longer a shared hook to fight over.

The other way to hold this in your head is via `sys.path`. Every `import` statement searches a list of directories in order, and `site-packages` is on that list. Which `site-packages` shows up depends on which `python` you ran — and that's exactly what activating a virtual environment changes.

```python
import sys
print(sys.executable)   # which python binary is actually running
print(sys.prefix)       # the environment this interpreter considers "home"
print(sys.path[:3])     # first few places it searches for imports
```

Run that once with a venv activated and once without, and the three lines print different things — same code, different environment.

## Why it works this way

Two mechanisms do all the work, and neither is magic.

**PATH resolution.** When you type `python` in a terminal, the shell doesn't know anything about virtual environments — it just walks the directories listed in the `PATH` environment variable, in order, and runs the first `python` it finds. Activating a venv does one simple thing:

```bash
source .venv/bin/activate
echo $PATH
# .venv/bin comes first now, ahead of /usr/bin, ahead of everything else
which python
# /home/you/project/.venv/bin/python
```

That's the entire trick behind "activation." It's a PATH edit plus a `VIRTUAL_ENV` variable set for anything that wants to check, plus a `deactivate` function to undo it. Nothing is installed, nothing is copied — your shell just looks in a different place first.

**pip installs relative to the running interpreter.** `pip` isn't a standalone thing that installs "system-wide" by default — it installs packages into the `site-packages` directory that belongs to whichever `python` invoked it (technically, `sys.executable`). Once PATH points `python` at `.venv/bin/python`, `pip install pandas` writes into `.venv/lib/python3.11/site-packages/`, not into `/usr/lib/python3.11/site-packages/`. Deactivate, and that install becomes invisible again, because nothing on the new PATH points at it.

Put together: **the unit of isolation is the project, not the machine**, because dependencies are a property of the code you're running, not of the hardware it happens to run on. A shared global `site-packages` makes every project's dependency list depend on the install order of every *other* project that ever touched that machine — which is a bad, silently time-dependent bug factory.

## A concrete example

Here's the actual break from the top of this page, reproduced.

Without a venv, both projects fight over one shared install:

```bash
python3 -m pip install "pandas==1.5.3"   # legacy-etl is happy now
python3 -m pip install "pandas==2.2.2"   # this REPLACES 1.5.3 machine-wide
python3 -c "import pandas; print(pandas.__version__)"
# 2.2.2 — legacy-etl's pandas is just gone
```

And it's not just a version number — pandas removed the long-deprecated `DataFrame.append` method in the 2.0 release. If `legacy-etl`'s code calls `.append()`, it now fails on a machine that used to run it fine:

```python
import pandas as pd
df = pd.DataFrame({"x": [1, 2]})
df.append({"x": 3}, ignore_index=True)
# AttributeError: 'DataFrame' object has no attribute 'append'
```

Nothing in `legacy-etl`'s code changed. The floor moved.

Now with one `.venv` per project:

```bash
mkdir -p ~/projects/legacy-etl ~/projects/new-pipeline

cd ~/projects/legacy-etl
python3 -m venv .venv
source .venv/bin/activate
python -m pip install "pandas==1.5.3"
python -c "import pandas; print(pandas.__version__, pandas.__file__)"
# 1.5.3 /home/you/projects/legacy-etl/.venv/lib/python3.11/site-packages/pandas/__init__.py
deactivate

cd ~/projects/new-pipeline
python3 -m venv .venv
source .venv/bin/activate
python -m pip install "pandas==2.2.2"
python -c "import pandas; print(pandas.__version__, pandas.__file__)"
# 2.2.2 /home/you/projects/new-pipeline/.venv/lib/python3.11/site-packages/pandas/__init__.py
deactivate
```

Two different absolute paths for `pandas.__file__`, each nested under its own project's `.venv`. Neither install ever touched the other's `site-packages`, because neither one was ever on PATH at the same time as the other. `legacy-etl`'s `.append()` call keeps working forever, regardless of what version `new-pipeline` installs next month — that's the whole payoff, and it's the working assumption behind everything you'll do with [pandas dataframes](/learn/python-data-apis/pandas-dataframes-fundamentals) from here on: the version installed in front of you is the version your code actually sees.

For a slower first-principles walk through *why* this isolation matters before you touch the commands, see [why isolated environments make sense](/learn/python-data-apis/why-isolated-environments-intuition); for the fuller command reference (recreating environments from a lockfile, `--system-site-packages`, deactivating cleanly), see Python environments and venv.

## Where it shows up

- **The first command in any new project.** Before you write a line of code: `python3 -m venv .venv && source .venv/bin/activate`. It costs two commands and prevents this entire class of bug.
- **`requirements.txt` / `pyproject.toml`.** These files exist because you're expected to *rebuild* the environment, not carry it around. `pip freeze > requirements.txt` captures what's on the shelf; `pip install -r requirements.txt` into a fresh `.venv` rebuilds an identical shelf on another machine, or in CI.
- **CI pipelines.** Every job typically creates a brand-new venv from scratch and installs from the lockfile — that's the same isolation trick, applied to guarantee a clean, reproducible install every single run instead of trusting whatever happened to accumulate on a shared runner.
- **Jupyter kernels.** A notebook kernel is tied to one specific interpreter, which means one specific venv — see [setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) for how the kernel registration step connects the two.
- **Containers.** A Docker image is the same idea taken further — instead of isolating `site-packages` on a shared OS, you isolate the whole filesystem. The reasoning is identical: don't let one project's dependencies become another's problem.

## Watch out for

**Forgetting to activate.** `pip install` "succeeds" whether or not a venv is active — it just quietly installs somewhere you didn't intend. Make checking a reflex, not an afterthought:

```bash
which python     # should point inside .venv/, not /usr/bin
python -m pip -V # confirm which environment pip will write into
```

**Committing `.venv/` to git.** It contains absolute paths and platform-specific binaries baked in at creation time — it will not work on a teammate's machine or even a different OS, and it bloats the repo for no benefit. Put `.venv/` in `.gitignore` and commit `requirements.txt` (or `pyproject.toml`) instead — the *recipe*, not the *baked result*. Anyone rebuilds their own `.venv` from that recipe in seconds.

**A mismatched Jupyter kernel.** Activating a venv in your terminal doesn't automatically make Jupyter use it — a notebook can silently keep running against a stale or global kernel while your shell insists the right environment is active. If `import pandas` in a notebook shows a version you didn't install, check the kernel, not the terminal.

## Where next

Once per-project isolation feels automatic, the next layer is making that environment reproducible and safe to hand to a teammate or a CI runner: locking exact versions, and keeping secrets out of the code that ships alongside it. Try the [environments & tooling quiz](/learn/python-data-apis/environments-tooling-quiz) to check the mental model, then move on to loading configuration and API keys without hardcoding them.

**Related:** Python environments and venv · [why isolated environments make sense](/learn/python-data-apis/why-isolated-environments-intuition) · [setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) · [pandas dataframes fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) · [environments & tooling quiz](/learn/python-data-apis/environments-tooling-quiz)
