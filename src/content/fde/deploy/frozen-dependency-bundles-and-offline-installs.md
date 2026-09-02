---
title: "Frozen dependency bundles and offline installs"
phase: deploy
module: on-prem-and-air-gapped
kind: lesson
summary: "Every package manager assumes a reachable index, and none of them are reachable inside a perimeter with no route out. This page is the actual procedure: a pip wheelhouse, a signed container bundle, and an install script that verifies before it runs anything."
duration: 18 min
updated: "2026-09-02"
outcomes:
  - Build a pip wheelhouse and a container image bundle that install cleanly with zero network access.
  - Sign and verify a release bundle end to end, and explain to a security reviewer why the verification step runs before install, not after.
  - Write an install script an on-site operator with no internet and no vendor on the phone can run unattended.
artifact: A signed, versioned offline install bundle for one of your own services, with an INSTALL.md a stranger could follow without you.
sources:
  - https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
---

The lesson before this one lists everything that breaks with no route out. This one is the answer for the two categories that show up in almost every stack: Python dependencies and container images. Get these two right and most of the rest of an offline install is repetition of the same pattern.

The rule that makes all of this work: **build the bundle on a machine with internet, verify it on a machine without one, and never let the install step reach outward to fetch anything it was not given.**

## The pip wheelhouse

A wheelhouse is a directory of `.whl` files that satisfies a `requirements.txt` with no index lookup. Build it on a connected machine that matches the target's Python version and OS/CPU architecture as closely as possible — a wheel built for `manylinux_x86_64` will not help you on an `aarch64` box, and this mismatch is the single most common cause of "it worked on my laptop."

```bash
# on a connected build machine, matching the target platform
mkdir wheelhouse
pip download \
  --dest wheelhouse \
  --platform manylinux2014_x86_64 \
  --python-version 3.11 \
  --implementation cp \
  --only-binary=:all: \
  -r requirements.txt

# freeze the exact set you are shipping, hashes included
pip freeze --path wheelhouse > requirements.lock.txt
pip hash wheelhouse/*.whl >> manifest.sha256
```

`--only-binary=:all:` refuses to fall back to a source distribution, because a source distribution may try to compile against a system library that does not exist on the target box, or trigger its own network call during `setup.py build`. If a package has no wheel for your target platform, resolve that on the connected machine, not in the enclave.

On the target machine, with no network at all:

```bash
python -m venv /opt/atlas/venv
/opt/atlas/venv/bin/pip install \
  --no-index \
  --find-links=/opt/atlas/wheelhouse \
  -r requirements.lock.txt
```

`--no-index` is the important flag. Without it, pip will still try to reach PyPI before falling back, and in an enclave that means a long, silent hang while it retries a DNS lookup that will never resolve.

## The container bundle: save, transfer, load

`docker pull` fails closed with no registry reachable. The pattern is `save` on the connected side, transfer the tarball across the boundary through whatever approved channel exists, `load` on the isolated side.

```bash
# connected machine: pull, tag, and flatten the images you need
docker pull ghcr.io/oddversity/atlas:2.4.1
docker pull postgres:16.4
docker pull otel/opentelemetry-collector-contrib:0.108.0

docker save \
  ghcr.io/oddversity/atlas:2.4.1 \
  postgres:16.4 \
  otel/opentelemetry-collector-contrib:0.108.0 \
  -o atlas-bundle-2.4.1.tar

sha256sum atlas-bundle-2.4.1.tar > atlas-bundle-2.4.1.tar.sha256
```

On the isolated machine, after the transfer and before anything else runs:

```bash
sha256sum -c atlas-bundle-2.4.1.tar.sha256   # fails loudly if one byte moved
docker load -i atlas-bundle-2.4.1.tar
docker tag ghcr.io/oddversity/atlas:2.4.1 \
  registry.northline.internal/vendors/oddversity/atlas:2.4.1
docker push registry.northline.internal/vendors/oddversity/atlas:2.4.1
```

That last pair of commands matters as much as the load: the image now lives in the customer's own registry, addressed by their hostname, which is what your Helm chart's `image.repository` value should point at. See the earlier lesson on Helm charts for why every image reference, including init containers and migration jobs, has to be overridable to a customer registry.

## Signing the bundle, not just hashing it

A SHA-256 checksum proves the bytes were not corrupted in transit. It does not prove the bytes came from you. In an environment where an attacker who can get media across the boundary once has a much longer window before anyone notices, that distinction is the whole point of the control. Sign with `cosign`, using a key held outside the customer's network:

```bash
cosign sign-blob --key cosign.key \
  --output-signature atlas-bundle-2.4.1.tar.sig \
  atlas-bundle-2.4.1.tar

# on the receiving side, before anything is loaded or installed:
cosign verify-blob \
  --key cosign.pub \
  --signature atlas-bundle-2.4.1.tar.sig \
  atlas-bundle-2.4.1.tar
```

The public key (`cosign.pub`) travels with the customer permanently, ideally handed over once, out of band, and checked into their own configuration management. The signature and the artifact travel together on every release. If `cosign verify-blob` fails, the install script should exit before touching anything, and the failure should be loud enough that an operator with no context still knows not to proceed.

Do the same for the wheelhouse: sign `manifest.sha256`, not each wheel individually, and verify that manifest before running the offline pip install.

## The install script an operator can run without you

The person running this on site is frequently not you, and may have no way to reach you synchronously. Write the script to be self-checking, in order, and to fail with a message that tells them what to do next rather than a stack trace.

```bash
#!/usr/bin/env bash
set -euo pipefail

BUNDLE=atlas-bundle-2.4.1.tar
echo "==> Verifying bundle signature"
cosign verify-blob --key /opt/atlas/keys/cosign.pub \
  --signature "${BUNDLE}.sig" "${BUNDLE}" \
  || { echo "SIGNATURE INVALID. Do not proceed. Contact vendor before re-attempting."; exit 1; }

echo "==> Verifying checksum"
sha256sum -c "${BUNDLE}.sha256" \
  || { echo "CHECKSUM MISMATCH. Bundle is corrupt or incomplete. Re-transfer before retrying."; exit 1; }

echo "==> Loading container images"
docker load -i "${BUNDLE}"

echo "==> Installing Python dependencies (offline)"
/opt/atlas/venv/bin/pip install --no-index \
  --find-links=/opt/atlas/wheelhouse \
  -r /opt/atlas/requirements.lock.txt

echo "==> Running smoke test"
/opt/atlas/venv/bin/python -m atlas.selftest \
  || { echo "SELF-TEST FAILED. See /opt/atlas/logs/selftest.log. Do not mark install complete."; exit 1; }

echo "==> Install verified. Ship the confirmation to the customer contact and archive this log."
```

Every failure path ends in an instruction, not silence. That is the actual deliverable: not the tarball, the confidence that a stranger who has never met you can run this once, correctly, at 6 a.m. before your call window opens.

## What still needs an update path

A frozen bundle answers "how does version one get in." It does not answer "how does version two get in six months from now," which is a separate, harder conversation about cadence, approval time, and who signs off on each release crossing the boundary. That is the subject of the lesson on continuous delivery into many customer sites later in this phase — treat this bundle as the unit that pattern repeats, not as a one-time event.

## Where this goes wrong

The most common failure is building the wheelhouse on the wrong platform and only discovering it on site, with no network to fix it. The second most common is forgetting a transitive dependency that only gets pulled at runtime — a tokenizer model, a font, a locale file some library downloads lazily on first use. Run your full test suite against the offline install, on a machine with its network interface physically disabled, before you ship the bundle. If it passes there, it will pass in the customer's enclave.
