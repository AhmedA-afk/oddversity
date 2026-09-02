---
title: "What a container is, and is not"
phase: foundations
module: containers-and-one-cloud
kind: lesson
summary: "A container is not a lightweight virtual machine, and treating it like one causes real bugs. This lesson covers what a container actually shares with the host, what an image really is, and the two mistakes — bind to localhost, treat the filesystem as permanent — that break deployments every time."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain the difference between a container and a virtual machine in terms of what each actually isolates.
  - Explain the difference between an image and a container, and why "restart the container" and "rebuild the image" are not the same fix.
  - Name the two most common container misconceptions that cause a deployment to fail, and why each happens.
---

Most people's first mental model of a container is "a lightweight VM" — and it is a useful enough approximation to get started, but it is wrong in ways that cause real, specific bugs once you are deploying things for a living. This lesson replaces that model with a more accurate one, because the accurate model is what predicts the failures you will actually hit.

## A container shares the host's kernel; a VM does not

A virtual machine virtualises hardware: it runs a complete, separate operating system, with its own kernel, on top of a hypervisor. Booting a VM means booting an entire OS — seconds to minutes, and a meaningful chunk of memory just for the OS itself.

A container does not do this. It runs as an isolated **process** on the host machine's existing kernel, using two Linux kernel features to create the illusion of isolation: **namespaces** (which give the process its own view of things that are normally shared — its own process ID space, its own filesystem mount points, its own network interfaces, so it cannot see or affect other containers' processes or files) and **cgroups** (control groups, which limit how much CPU, memory, and I/O the process is allowed to consume, so one container cannot starve the others on the same host). The container is a regular Linux process from the host's point of view — you can see it in the host's own `ps aux` output — wrapped in enough isolation that it behaves, from the inside, as if it had the machine to itself.

This is why containers start in milliseconds, not seconds, and why you can run dozens of them on a machine that could only run a handful of full VMs: there is no second kernel to boot, no second OS's memory overhead. It is also why a container is fundamentally less isolated than a VM — a serious kernel vulnerability can, in principle, let a process escape its container's isolation and reach the host, in a way that a VM's hardware-level virtualization boundary makes much harder. This is exactly why genuinely hostile-environment deployments (multi-tenant customer data, regulated workloads) often run containers *inside* VMs rather than trusting container isolation alone — belt and suspenders, covered further in the deploy phase of this path.

## An image is a recipe; a container is a running instance

A **Dockerfile** describes how to build an **image**: a read-only, layered snapshot of a filesystem plus metadata about how to run it.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

`docker build` turns this into an image — a static artifact, stored in layers, that does nothing on its own. `docker run` takes that image and starts a **container** — a live, running process based on that image's filesystem, with its own writable layer on top. You can start many containers from the same image simultaneously, each an independent running instance, the same way many separate processes can be started from the same compiled binary.

This distinction explains a mistake worth naming explicitly: "restart the container" and "rebuild the image" are different operations that fix different problems. Restarting a container discards its running state and any writes made to its writable layer, and starts a fresh container from the *same* image — it does nothing if the bug is in the image itself (wrong dependency version, stale application code baked in at build time). Rebuilding the image re-runs the Dockerfile against current source and dependencies, producing a new image — the actual fix when the problem is "the code or dependency inside the image is wrong," which a restart alone can never address.

## Two misconceptions that break real deployments

**"The container's filesystem is like a normal disk — writes persist."** They do not, by default. A container's writable layer is destroyed when the container is removed (not just stopped — `docker rm`, or the container being replaced during a redeploy). A script that writes output files inside the container's own filesystem, expecting them to still be there after a redeploy, will lose that data silently the next time the container is recreated. The fix is an explicit **volume** — a directory mounted from the host or from persistent cloud storage into the container, which does survive the container's lifecycle:

```bash
docker run -v /host/data:/app/data myimage
```

Anything that must persist — a database's data files, uploaded documents, anything you cannot afford to lose — belongs in a mounted volume, never in the container's own writable layer alone.

**"127.0.0.1 inside the container means the same thing it does on my laptop."** A container has its own network namespace, and `localhost`/`127.0.0.1` inside it refers to the container's own loopback interface, not the host machine's. A service inside a container that binds to `127.0.0.1` is reachable only from *within that same container* — not from the host, not from another container, not from outside at all — which is a specific, common cause of "the service is running (I can see the process) but nothing can connect to it." The fix, covered in the http lab earlier in this module in a different context, is the same principle: bind to `0.0.0.0` inside the container so it accepts connections from any interface, and let the container's port mapping (`-p 8080:8080`, or the equivalent in a Kubernetes manifest) control what is actually exposed to the outside.

## The FDE version of this lesson

Both misconceptions above produce the exact same customer-facing symptom — "it works when I run it directly, and breaks the moment it's containerised" — and both are diagnosed by understanding what a container actually is, not by guessing. A customer engagement almost always involves either deploying your own service as a container into their environment, or debugging one of theirs that a colleague built and left behind. Knowing precisely what a container isolates, what an image versus a running container actually is, and which two things (network binding, filesystem persistence) most often break during that transition is the difference between a five-minute fix and a half-day of guessing.
