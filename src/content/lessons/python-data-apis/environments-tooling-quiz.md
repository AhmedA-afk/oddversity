---
title: "Quiz: Environments & Notebooks"
track: "python-data-apis"
status: live
summary: "A six-question self-check on venv vs. global installs, reading pip freeze output, what activation actually changes, notebook-vs-script judgment calls, and the classic wrong-kernel "
duration: "12 min read"
---

You know the vocabulary by now — venv, activate, `pip freeze`, kernel. This is where you find out whether you can actually use it: read each scenario the way you'd hit it in a real terminal, commit to an answer, then check your reasoning against the explanation underneath.

If any of these feel shaky, they lean on ideas from [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) and [setting up venv and Jupyter together](/learn/python-data-apis/setting-up-venv-and-jupyter) — worth a revisit before you move on.

## Question 1

You open a brand-new terminal, `cd` into your project (which already has a `.venv` folder sitting in it), and run:

```bash
pip install requests
```

You did **not** run `source .venv/bin/activate` first. Where does `requests` actually get installed?

- **A.** Into `.venv/lib/...`, because pip notices the `.venv` folder in the current directory and targets it automatically.
- **B.** Into whatever Python `pip` currently resolves to on your system — most likely your global/system Python's site-packages — because pip has no awareness of a nearby `.venv` unless that venv is active.
- **C.** Nowhere — the install fails with an error since no venv is active.
- **D.** Into both the global site-packages and `.venv`, so it ends up usable either way.

<details><summary>Answer</summary>

**Correct: B.** `pip` isn't a project-aware tool that goes looking for `.venv` folders — it's a dumb pointer follower. It installs into whatever Python interpreter the `pip` command on your `PATH` currently belongs to. If you haven't activated the venv, that's almost always your system or user-level Python, not the one sitting in `.venv/bin/python`. The folder existing on disk means nothing to pip until you either activate it or call it directly (`.venv/bin/pip install requests` or `.venv/bin/python -m pip install requests`).

**A** is the single most common misconception about venvs — that they're "smart" and pip checks for them. It doesn't. Directory proximity is irrelevant; only which interpreter is currently resolved matters.

**C** assumes pip enforces isolation for you. It doesn't refuse to run without an active venv — it just quietly installs somewhere you probably didn't intend, which is arguably worse than an error because you won't notice until later.

**D** isn't how installs work at all — a single `pip install` targets exactly one Python's site-packages, never two.

</details>

## Question 2

Your `requirements.txt` has two lines:

```text
requests==2.31.0
pandas==2.2.0
```

You create a fresh venv, activate it, run `pip install -r requirements.txt`, then run `pip freeze`. The output looks something like this (your exact versions may differ slightly):

```text
certifi==2024.2.2
charset-normalizer==3.3.2
idna==3.6
numpy==1.26.4
pandas==2.2.0
python-dateutil==2.8.2
pytz==2024.1
requests==2.31.0
six==1.16.0
urllib3==2.2.1
```

Ten lines came out of a two-line install. What's going on?

- **A.** `pip freeze` is buggy or is picking up leftovers from a different, previously-created venv.
- **B.** `requests` and `pandas` each depend on other packages (`urllib3`, `idna`, `numpy`, `pytz`, and so on) — `pip freeze` lists every package actually present in the environment, direct installs and transitive dependencies alike, not just what you named in `requirements.txt`.
- **C.** You must have accidentally run extra `pip install` commands you forgot about.
- **D.** `pip freeze` pads its output with commonly-used packages for compatibility reasons.

<details><summary>Answer</summary>

**Correct: B.** `requirements.txt` says what *you* asked for; `pip freeze` reports what's actually *installed* — and installing `requests` pulls in everything requests needs to function (`urllib3`, `certifi`, `idna`, `charset-normalizer`), and installing `pandas` pulls in its own runtime dependencies (`numpy`, `python-dateutil`, `pytz`, and `six` as a transitive dependency of `python-dateutil`). This gap between "what I typed" and "what freeze shows" is the most common source of confusion when people first read freeze output — expecting a mirror of their own file instead of a full manifest of the environment.

**A** assumes a tool malfunction before checking the simpler explanation — always check "did my dependencies have dependencies" first.

**C** is possible in general but isn't what's happening here; a fresh venv with exactly one `pip install -r` command doesn't need a forgotten-command theory to explain this output.

**D** describes behavior no package manager has — freeze reflects reality, it doesn't decorate it.

</details>

## Question 3

You run `which python` and get `/usr/bin/python3`. Then you run:

```bash
source .venv/bin/activate
```

and `which python` now returns `/path/to/project/.venv/bin/python`. What did `activate` actually just do?

- **A.** It installed a fresh copy of the Python interpreter into `.venv`.
- **B.** It rewrote your project's code so imports resolve against the venv's packages specifically.
- **C.** It modified your shell's `PATH` (and set a couple of environment variables, like `VIRTUAL_ENV`) so that `python` and `pip` now resolve to the copies inside `.venv/bin` first — nothing about your code, or any already-installed package, changed.
- **D.** It copied every globally-installed package into the venv so they're available without reinstalling.

<details><summary>Answer</summary>

**Correct: C.** Activation is entirely a shell-session effect. It prepends `.venv/bin` to `PATH`, sets `VIRTUAL_ENV`, and tweaks your prompt — that's it. No files in your project change, no packages move, nothing gets installed or copied. It's the same reason `deactivate` is instant: there's no state to undo beyond restoring `PATH`. The mental model worth keeping is "activation redirects which binaries a bare `python`/`pip` command finds," full stop — see the [intuition behind isolated environments](/learn/python-data-apis/why-isolated-environments-intuition) if that click hasn't happened yet.

**A** confuses activation with venv *creation* — `python -m venv .venv` is the step that copies (or links) an interpreter into `.venv/bin`. Activation happens after that, on an already-existing venv, and does no interpreter installation of its own.

**B** would be a wild thing for a shell script to do to your source files, and it doesn't — imports resolve based on which interpreter runs them, not on any rewriting.

**D** describes `--system-site-packages`, an opt-in flag you pass at venv-creation time if you deliberately want global packages visible inside the venv. It's not the default, and it's absolutely not something `activate` does on its own — a default venv stays isolated from global site-packages.

</details>

## Question 4

Which of these four tasks is the best fit for a Jupyter notebook rather than a plain `.py` script?

- **A.** A nightly job that reads new CSVs dropped into a folder, cleans them, and loads them into a database — triggered on a schedule with no human watching.
- **B.** A small REST API service that accepts a request, calls an LLM, and returns JSON.
- **C.** Your first pass through a dataset you've never seen before: checking null counts, plotting a couple of distributions, and trying three different `groupby` approaches to see which one actually answers your question.
- **D.** A command-line tool teammates run with different arguments to reprocess historical data on demand.

<details><summary>Answer</summary>

**Correct: C.** This is exactly the shape notebooks are built for: short feedback loops where you don't know your next step until you see the output of your last one. Run a cell, look at the plot, decide whether to filter differently, run again — state persists between cells so you're not re-loading a large dataframe every time you tweak one line. Once you know what the cleaning logic *should* be, that logic moves into a script.

**A** needs to run unattended on a schedule with no human clicking "run cell" — that's a script invoked by cron or a scheduler, full stop. See how this looks end to end in the [whole-game data pipeline walkthrough](/learn/python-data-apis/python-data-pipeline-whole-game).

**B** is a long-running process with a defined interface (requests in, JSON out) — that's a script/service, not something you'd want gated behind a "run all cells in order" mental model.

**D** is reusable, parameterized, and run by other people — notebooks are personal, top-to-bottom-in-your-head tools; a CLI script with `argparse` is what teammates can actually run without opening Jupyter.

</details>

## Question 5

In your terminal, with the venv activated, `pip show pandas` succeeds and prints version info. But in Jupyter, your first cell:

```python
import pandas as pd
```

raises:

```text
ModuleNotFoundError: No module named 'pandas'
```

pandas is definitely installed in your venv — you just confirmed it. What's the most likely cause, and the fix?

- **A.** pandas is corrupted; reinstall with `pip install --force-reinstall pandas`.
- **B.** The notebook is running on a kernel backed by a different Python interpreter than your venv's — check the kernel name in the top-right corner of the notebook (or Jupyter Lab's kernel selector) and switch to the kernel tied to `.venv`, installing one if it doesn't exist yet.
- **C.** Jupyter doesn't support pandas inside notebook cells; move this code into a `.py` script instead.
- **D.** You need to `import pandas` twice — the first import only initializes the module name.

<details><summary>Answer</summary>

**Correct: B.** A notebook's kernel is a separate Python process, and picking it is a separate decision from having activated a venv in your terminal — they aren't automatically the same interpreter. If you never registered your venv as a kernel, Jupyter falls back to whatever kernel is available (often a base/system Python), which has never heard of the pandas you installed. The fix is to register the venv explicitly:

```bash
python -m ipykernel install --user --name=myproject-venv --display-name "Python (myproject venv)"
```

then pick `Python (myproject venv)` from the kernel menu and restart the kernel. Confirm it worked by running `import sys; print(sys.executable)` in a cell — it should print a path inside `.venv`, matching what `which python` shows in your activated terminal. The [venv + Jupyter setup guide](/learn/python-data-apis/setting-up-venv-and-jupyter) walks through getting this right from the start so you don't hit it later.

**A** treats a working install as broken. `pip show pandas` already told you the package is fine — the problem is which interpreter Jupyter is running, not the package itself.

**C** is simply false — pandas in notebooks is one of the single most common combinations in data work; if this were true half the ecosystem wouldn't function.

**D** isn't how Python imports work — a `ModuleNotFoundError` means the interpreter searched its available paths and found nothing named `pandas`; repeating the same failing import changes nothing.

</details>

## Question 6

You `pip install pandas` while your venv is active, then run `deactivate`, close your laptop, and come back the next day. You `cd` back into the project and run `source .venv/bin/activate` again. Is pandas still there?

- **A.** No — `deactivate` uninstalls anything added during that session; you'll need to reinstall it.
- **B.** Yes — the venv is just a folder on disk (`.venv/lib/python3.x/site-packages/...`). Activating and deactivating only change what your shell's `PATH` points to; neither one adds, removes, or touches any installed package.
- **C.** Only if you ran `pip freeze > requirements.txt` before deactivating.
- **D.** It depends on whether you shut your computer down completely in between.

<details><summary>Answer</summary>

**Correct: B.** This falls straight out of the same fact from question 3: activation is a `PATH` switch, nothing more. `deactivate` just restores your shell to pointing at whatever it pointed at before — it has no mechanism for touching files, and it doesn't have one for uninstalling anything either. Packages installed into `.venv` live there as ordinary files on disk until something explicitly uninstalls them (`pip uninstall`) or the folder itself is deleted. Reactivating any time later — this session, tomorrow, next month — finds pandas exactly where you left it.

**A** would make venvs nearly useless for actual work — imagine losing your entire dependency set every time you closed a terminal.

**C** confuses two unrelated things: `pip freeze > requirements.txt` writes a *record* of what's installed to a text file, for reproducing the environment elsewhere or later. It has zero effect on the environment itself — skipping it doesn't put your packages at risk.

**D** brings hardware into a question that's purely about a folder's contents. Shutting down your computer doesn't delete files on your disk any more than closing a book deletes the pages.

</details>

> Notice the thread running through 1, 3, and 6: almost every venv "mystery" collapses back to the same one question — *which Python is currently running, and how did it get resolved?* `which python` (or `where python` on Windows) answers it in one line, every time.

**Related:** [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) · [Why isolated environments — the intuition](/learn/python-data-apis/why-isolated-environments-intuition) · [Setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) · [The whole-game data pipeline](/learn/python-data-apis/python-data-pipeline-whole-game) · [Secrets and config management](/learn/python-data-apis/secrets-and-config-management)
