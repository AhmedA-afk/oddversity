---
title: Setting up your field kit
phase: orientation
module: how-this-path-works
kind: lab
summary: Configure the laptop, accounts, cloud free tier, public repository and journal you will use for the next nine months, and write your first journal entry before you write a line of code.
duration: "3 h"
updated: "2026-09-02"
outcomes:
  - Confirm a working terminal setup with Python, Git, and Docker, verified by running each, not by installing and trusting it worked.
  - Create one cloud account with MFA enabled, a non-root user for daily work, and a billing alert set before you provision anything.
  - Start a public repository holding your evidence portfolio index and your first-person journal, with a real first entry in each.
artifact: A working laptop setup, a cloud account with a billing alert, a public repository with a README and a first journal entry, all confirmed by commands you ran yourself, not by a checklist you skimmed.
---

Every lab, drill, bootcamp and capstone in this path assumes four things exist before you start: a laptop you can trust, one cloud account you understand the cost of, a public place to put your work, and a habit of writing down what happened. This lab builds all four. Do it now, properly, and you will not think about it again until Phase 05 asks you to reach for more of the cloud account than the free tier gives you.

## What you're building

Not a perfect setup. A working one, with every piece confirmed by running something, because "I installed it" and "it works" are different claims, and the gap between them is where week-one debugging actually happens on a real engagement.

## Steps

**1. Confirm the terminal you'll actually work in.**

If you are on Windows, install WSL2 and do all of this path's work inside it, not in PowerShell — most of the tooling an FDE touches (Docker, `ssh`, `grep`, `awk`) assumes a Linux shell, and learning the translation layer now is cheaper than debugging it later. If you are on macOS or native Linux, you already have one; confirm it opens fast and you know how to get to it without hunting.

```bash
echo $SHELL
```

**2. Install and confirm Python.**

```bash
python3 --version
python3 -m venv --help
```

Both should return output, not "command not found." If Python is missing or ancient, install a current version through your platform's package manager (`apt`, `brew`, or the WSL distribution's package manager), not by downloading an installer from a random site.

**3. Install and confirm Git, and generate an SSH key if you don't have one.**

```bash
git --version
ls -la ~/.ssh
# if no id_ed25519 or id_rsa exists:
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Add the public key to your GitHub account now. You will use SSH, not HTTPS with a pasted password, for every repo in this path, because that is the habit you want before Phase 01's Git module, not after.

**4. Install and confirm Docker.**

```bash
docker --version
docker run hello-world
```

The second command should pull a tiny image and print a success message. If it fails on permissions (a common Linux issue: your user isn't in the `docker` group), fix that now — Phase 01's containers module assumes this already works.

**5. Pick a code editor and confirm one extension: a terminal integrated into it.** VS Code is the default choice for this path because its extensions cover Python, Docker and remote SSH sessions well, but any editor is fine if you already have real muscle memory in it. The point is not the editor. It is that you can edit a file and run a command against it without switching windows, because that loop is what you will do thousands of times.

**6. Create one cloud account, and only one.**

Pick AWS, GCP, or Azure based on their free tiers, and commit to it for the whole path — Phase 01's cloud module and several later labs assume consistency, not that you're relearning IAM concepts on a second provider. AWS is the most common choice for this path's labs and has the most widely available free tier; GCP and Azure work equally well if you already have a reason to prefer one.

Do these three things in order, before you provision anything:

- **Enable MFA** on the root account immediately after signup.
- **Create a non-root IAM user** (or equivalent) with the permissions you actually need, and use it for every command from here on. Never do daily work as root or as the account owner.
- **Set a billing alert.** A low threshold — the equivalent of a few dollars — that emails you the moment you cross it. This is not optional. Free-tier limits are real but easy to exceed by accident (an instance left running, a bucket that grew), and the point of the alert is that you find out from an email, not from a bill.

```bash
# AWS example: confirm the CLI is configured against the IAM user, not root
aws sts get-caller-identity
```

The output should show the IAM user's ARN, not an account root ARN.

**7. Create your public repository.**

One repo, public, that will hold two things you will use for the next nine months: your evidence portfolio index from the previous lesson, and your journal. Initialise it now.

```bash
mkdir fde-field-kit && cd fde-field-kit
git init
echo "# FDE Field Kit — [your name]" > README.md
mkdir portfolio journal
touch portfolio/index.md
touch journal/2026-09-02.md
git add .
git commit -m "Initialise field kit: portfolio index and journal"
```

Push it to GitHub as a public repository. Public, not private, is deliberate: this repo is itself the first artifact in your evidence portfolio, and a hiring manager should be able to watch it grow over the next nine months, which is a different, stronger signal than a private repo you unveil at the end.

**8. Write your first journal entry, in first person, today.**

Not a to-do list. An honest paragraph. Two prompts to answer in it, both pulled from earlier orientation pages: your own one-paragraph definition of what a Forward Deployed Engineer is, in your own words, before you know much more — and, against the thirteen responsibilities from "What a Forward Deployed Engineer actually does," which ones you have genuinely done before, in any job, project or club, and which you have never touched. Write "none" where it's none. This entry is the baseline you compare against in Phase 08, and a baseline that flatters you is useless to you later.

## Definition of done

- `python3`, `git`, `docker run hello-world`, and your editor's integrated terminal all run successfully, confirmed by output you can see, not by "the installer said it worked."
- SSH key generated and added to GitHub; you can `git push` over SSH without typing a password.
- One cloud account: MFA enabled on the root account, a non-root IAM user configured and confirmed as the identity your CLI uses, and a billing alert set and confirmed (trigger a small test if the provider allows it, or verify the alert configuration is actually saved, not just filled into a form that silently failed to submit).
- A public GitHub repository exists with a README, an empty `portfolio/index.md` ready for Phase 09's artifacts, and a `journal/` entry for today, written in first person, answering both prompts honestly.

## How this could go wrong

**Doing daily work as the cloud account root or owner.** It works, right up until it doesn't — a leaked root credential is a compromised billing account, not a compromised IAM user you can revoke in seconds. Every later lab in this path assumes you're already in the habit of least-privilege access; build that habit now, when the stakes are a free-tier sandbox, not a customer's VPC.

**Skipping the billing alert because "I'll stay in the free tier."** People who say this are the ones posting free-tier horror stories. The alert costs two minutes to set up and the alternative costs real money and a bad afternoon.

**Treating the journal as private.** If you write it knowing no one will ever read it, it will read like nothing when Phase 08 asks you to mine it for a first-person case study. Write every entry as if a hiring manager might eventually see it, because by week 36, one might.

**Choosing a cloud provider you'll switch away from later.** Foundations, Deploy, and several capstones assume familiarity accumulates on one provider. Switching mid-path means relearning IAM, networking and billing concepts you already paid to learn once. Pick one now and only revisit the choice if you have a genuine, specific reason.
