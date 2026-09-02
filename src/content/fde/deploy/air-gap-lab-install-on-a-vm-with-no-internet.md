---
title: "Lab: install on a VM with no internet"
phase: deploy
module: on-prem-and-air-gapped
kind: lab
summary: "Build the offline bundle from the previous two lessons, then install it on a virtual machine with its network interface physically disabled, the way an operator inside a real perimeter would. If the install script needs the internet even once, this lab fails it before a customer does."
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Produce a signed, versioned offline bundle containing a Python wheelhouse and a set of container images.
  - Install and run a working service on a VM with zero network access, using only that bundle.
  - Write an install report an operator with no context could hand to a customer as evidence the install succeeded.
artifact: A signed offline install bundle, an install log from a truly disconnected VM, and a one-page install report suitable for a customer's change record.
---

This lab produces the artifact the previous two lessons described. There is no shortcut version: the pass condition is that the install works with the VM's network adapter disabled, not merely "unplugged from the internet but still able to resolve DNS on the local network," which is a different and easier thing that will not catch the bugs that matter.

## Scenario

You are the FDE for a district administration piloting Atlas, a document-triage service, inside a government data centre with no internet connectivity by policy. This is the on-prem engagement previewed in the practice phase's district-administration bootcamp; the deployment constraints are the same ones you will meet there. The customer's IT lead has given you one VM: 4 vCPU, 8 GB RAM, Ubuntu 22.04, and has told you plainly that once it is handed over for install, no one will touch it who has internet access. Whatever you bring has to be complete.

## Setup

1. Provision two VMs locally (or two isolated containers with `--network none` available as a fallback if you cannot run VMs): a **build VM** with internet access, and a **target VM** with none. Match their OS and architecture.
2. On the build VM, install Docker and Python 3.11, and clone or write a small service to deploy — a FastAPI app with one endpoint and a Postgres dependency is enough; use your own project if you have one, or a minimal service with a `/healthz` route and one route that writes and reads from Postgres.
3. Confirm the target VM genuinely has no route out: `curl -m 5 https://pypi.org` and `docker pull hello-world` must both fail before you begin. If either succeeds, disable the network interface (`sudo ip link set eth0 down` or the VM platform's equivalent) and reconfirm.

## Steps

1. **Build the wheelhouse on the build VM.** Follow the previous lesson exactly: `pip download` with `--platform`, `--python-version`, `--only-binary=:all:` matching the target, then `pip freeze --path` and a SHA-256 manifest.
2. **Build and save the container images.** `docker build` your service image, `docker pull` Postgres and any sidecar you use, then `docker save` all of them into one tarball with a checksum file alongside it.
3. **Sign the bundle.** Generate a `cosign` keypair if you do not have one (`cosign generate-key-pair`), sign the tarball and the wheelhouse manifest, and keep the private key only on the build VM — it should never cross onto the target.
4. **Package the transfer.** Combine the wheelhouse, the container tarball, the signatures, the checksums, and the public key into a single directory. This whole directory is what "crosses the boundary" — simulate the transfer with `scp` to the target VM, or by copying to a USB image and mounting it there, whichever is closer to how you would actually move it.
5. **Verify before touching anything.** On the target VM, with the network interface confirmed down, run `cosign verify-blob` against every signed artifact and `sha256sum -c` against every manifest. Do not proceed past a failure.
6. **Install offline.** Create the venv, `pip install --no-index --find-links=`, `docker load`, tag the images to a locally-run registry (`docker run -d -p 5000:5000 registry:2` works as a stand-in for the customer's real one), and push.
7. **Run the service with everything pointed inward.** Bring up your service and Postgres with `docker compose` or plain `docker run`, using only images and packages that came from the bundle. Confirm `/healthz` returns 200 and the read/write route works, with the network interface still down.
8. **Write the install report.** One page: what was installed, which bundle version and its checksum, the verification output, the smoke-test result, and the exact commands the customer's own staff would run to confirm the service is healthy after you leave.

## Definition of done

- The target VM's network interface was down for every step from transfer onward, and you have terminal output proving it (a failed `curl` or `ping` timestamped before the install run).
- `cosign verify-blob` and `sha256sum -c` both ran and passed on the target VM before install, and the output is captured in your log.
- The service is reachable and functional on the target VM, backed by Postgres, using no package or image that was not in the bundle.
- The install report is written for someone who was not in the room: a customer IT lead could hand it to their auditor as evidence of what happened.

## How this goes wrong

**The wheelhouse was built on the wrong platform.** A wheel built on your ARM laptop for a package with C extensions will not install on an x86_64 target, and `pip install --no-index` will simply say no matching distribution was found, with the target VM offering no way to fix it. Catch this on the build VM by cross-checking the wheel filenames against the target's platform tag before you transfer anything.

**A dependency loads lazily at runtime, not at import.** Some libraries — tokenizers, font renderers, locale data — fetch a resource on first use rather than at install. Your service will pass a quick smoke test and then fail three minutes later on the first real request. Run your actual test suite, not just a health check, on the disconnected VM before calling the install done.

**The registry tag was never rewritten.** If your Compose file or Helm values still reference `ghcr.io/oddversity/atlas` instead of the local registry you pushed to, the pull will hang trying to reach a host that does not resolve, and it will look identical to a DNS problem. Grep your manifests for the original registry hostname as a final check.

**The install "worked" because DNS quietly leaked.** If your isolation was a firewall rule rather than a disabled interface, a misconfigured allow rule can let just enough traffic through that a demo succeeds and a real deployment fails, because the demo network was never actually air-gapped. This is why the lab requires the interface down, not just outbound rules blocked — it is the only test that cannot lie to you.
