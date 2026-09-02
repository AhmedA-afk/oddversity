---
title: "Lab: the same artifact, three environments"
phase: deploy
module: vpc-byoc-and-customer-kubernetes
kind: lab
summary: "Take one container image and ship it three ways: into a customer VPC by Terraform, into a customer Kubernetes cluster by Helm, and onto a single self-managed VM with no orchestrator at all. The image never changes. Only the values file, the IAM shape, and your assumptions do."
duration: 4 h
updated: "2026-09-02"
outcomes:
  - Deploy one unmodified container image into three structurally different customer environments without rebuilding it.
  - Point the same application at a customer-supplied Postgres, a customer-managed secret, and a customer registry in each environment.
  - Produce a one-page comparison of what changed between environments and what stayed constant, suitable for a platform team that will ask exactly that question.
artifact: A single container image deployed three ways (Terraform-provisioned VPC service, Helm chart into a cluster, and a Compose-based VM install), plus a comparison table of what each environment required.
---

Customers do not agree on a deployment model, and the mistake that costs the most time in a real engagement is building three separate versions of the same product because you built each environment's version first and generalised never. This lab forces the discipline the earlier lessons argued for: one image, three ways in.

## Scenario

Atlas, the retrieval service from the earlier Helm and VPC lessons, has three prospective customers at three different points on the deployment spectrum, and your manager wants one demo image that proves it runs in all three before any of the three deals closes.

- **Meridian Co-operative Bank** wants a managed instance inside their AWS account: a VPC, a subnet with no internet gateway, and a cross-account role for you to provision through.
- **SuryaTex Manufacturing** has a Kubernetes platform team who will install a Helm chart into a namespace they control, on a cluster running a restricted Pod Security Standard.
- **A district administration** office has one VM, no Kubernetes, and a preference for the smallest possible moving-parts count: Docker Compose, not an orchestrator.

## Steps

1. **Build one image and tag it once.** `docker build -t atlas:lab-1 .` Do not rebuild it for any of the three environments below. If a step seems to require rebuilding, that is a configuration problem, not an image problem — fix it with an environment variable or a mounted config file instead.
2. **Environment one: VPC via Terraform.** Reusing the module shape from the VPC lesson, provision a minimal VPC (or reuse an existing one locally), a private subnet, a security group allowing only the traffic your service needs, and an IAM role with a trust policy scoped to a single principal. Run the container as an ECS task or a plain EC2 instance running Docker — either is fine for this lab. Point it at a locally-run Postgres standing in for the customer's managed database, using a secret pulled from a secrets manager rather than baked into the task definition.
3. **Environment two: Helm into a cluster.** Stand up a local cluster (kind or minikube is sufficient) with a restricted Pod Security Standard enabled on the target namespace. Install the chart from the Helm lesson using `values-restricted.yaml`: no privileged containers, `readOnlyRootFilesystem: true`, an `existingSecret` for the database credential, and the image pulled from a local registry standing in for the customer's mirror.
4. **Environment three: a single VM, Compose only.** On a plain VM (or a container standing in for one), write a `docker-compose.yml` that runs the same image alongside Postgres, using an `.env` file for configuration and a bind-mounted TLS certificate rather than any cloud-native secret store. No orchestrator, no cluster — this is the shape a small on-prem customer with no platform team actually has.
5. **Verify all three independently.** The same smoke test — a script that calls `/healthz` and confirms a real read/write against Postgres — must pass unmodified against all three. If your smoke test needs environment-specific logic, your environments are not actually running the same artifact.
6. **Write the comparison.** One table: environment, how config was injected, how the secret was supplied, how the image was pulled, and what would break first if this customer's environment tightened one notch (fewer IAM permissions, a stricter Pod Security Standard, no outbound network on the VM).

## Definition of done

- One image tag, unmodified, running successfully in all three environments.
- All configuration differences live in values files, environment variables, or mounted config — never in application code or a second Dockerfile.
- The same smoke test script, with no environment-specific branches, passes against all three.
- A comparison table exists and could be handed to a platform engineer from any of the three fictional customers with no further explanation needed.

## How this goes wrong

**Configuration leaks into the image.** The most common failure is a database hostname or a feature flag hardcoded at build time because it was faster during environment one. It works until environment three has a different hostname, and by then it is buried in a layer you have to rebuild and re-push everywhere. Everything environment-shaped belongs in the values file, per the Helm lesson's rule: expose every environment-shaped thing, and expose nothing else.

**The smoke test quietly becomes three smoke tests.** If you find yourself writing an `if environment == "vpc"` branch in your test script, stop — that branch is telling you the artifact is not actually the same across environments, and the lab has failed its own premise even if each environment individually "works."

**Secrets management gets skipped for environment three.** It is tempting to hardcode a password into the Compose file because it is "just a lab" and there is no cloud secrets manager to reach for. Do not. Use a `.env` file excluded from version control and treat it exactly as you would a customer's `existingSecret` — the discipline is the point, and a real on-prem customer's security reviewer will ask the same question about a Compose deployment that a cloud customer's reviewer asks about a Kubernetes one.

**The IAM role in environment one is broader than the task needs.** Grant only what the smoke test actually exercises, then try to break it by removing one permission at a time until something fails — that failure tells you exactly what was load-bearing and gives you a defensible, minimal policy to show a customer's security engineer instead of a policy copied from a tutorial.
