---
title: "Secrets, service accounts, and their registry"
phase: deploy
module: vpc-byoc-and-customer-kubernetes
kind: lesson
summary: In someone else's environment you hold no long-lived credentials, your images live in their registry, and your service authenticates as an identity their platform team controls. This page covers workload identity, secret backends, image mirroring and the credential-rotation conversation you should start in week one.
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Configure a workload identity (IRSA, Azure Workload Identity, GKE Workload Identity) so your service holds no static credential at all.
  - Choose between a Kubernetes Secret, an external secrets operator and a CSI-mounted vault, and defend the choice to a security reviewer.
  - Mirror a release into a customer's private registry, including signatures and SBOMs, and pin by digest.
artifact: A credential inventory for one service — every secret it needs, where each lives, who rotates it, and what happens when each expires — written as a table a customer's security team can review.
sources:
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
  - https://www.getmaxim.ai/bifrost/resources/enterprise-deployment
  - https://vinvashishta.substack.com/p/what-skills-do-you-need-to-get-a
---

There is a question every security reviewer asks eventually, in some phrasing: **"What credentials of ours does your vendor hold, and what happens when one of your employees leaves?"**

The best possible answer is "none". The second best is "one, it is short-lived, it is scoped to this, and here is the rotation procedure". Most engineers arrive with a worse answer than that because they have only ever worked in an environment where they were also the person who created the secrets.

## The hierarchy of credentials, best to worst

1. **Workload identity with no secret at all.** The pod authenticates to the cloud by virtue of running as a particular Kubernetes service account in a particular namespace in a particular cluster. Nothing to leak, nothing to rotate, nothing to store.
2. **A short-lived token minted on demand** from an identity the customer controls: an OIDC federation, a `sts:AssumeRole` with a one-hour session, a vault-issued dynamic database credential.
3. **A long-lived secret in the customer's secret manager,** read at runtime, never in your repository or theirs.
4. **A long-lived secret in a Kubernetes Secret object,** which is base64, not encryption, and readable by anyone with `get secrets` in the namespace.
5. **A long-lived secret in a values file in a git repository.** This is a finding. It will be found.

Work down the list only as far as the environment forces you.

## Workload identity, the version that works

On EKS, the mechanism is IRSA (IAM Roles for Service Accounts). The cluster has an OIDC provider; you annotate a Kubernetes service account with a role ARN; the pod gets a projected token; the AWS SDK exchanges it for temporary credentials automatically.

```yaml
serviceAccount:
  create: true
  name: atlas
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::444455556666:role/atlas-runtime
```

The role's trust policy, on their side, binds it to exactly one service account:

```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::444455556666:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "oidc.eks.ap-south-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": "system:serviceaccount:atlas:atlas",
      "oidc.eks.ap-south-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:aud": "sts.amazonaws.com"
    }
  }
}
```

The `:sub` condition is the load-bearing line. Without it, any service account in the cluster can assume the role. With it, only the `atlas` service account in the `atlas` namespace can. Reviewers look for it. Point at it yourself before they ask.

The equivalents are the same idea with different nouns: Azure Workload Identity annotates the service account with a client ID and federates to an Entra app registration; GKE Workload Identity binds a Kubernetes service account to a Google service account with `roles/iam.workloadIdentityUser`. In all three, your chart's job is the same: expose `serviceAccount.annotations` as a passthrough and let their platform team fill it in.

Then verify from inside the pod, because a misconfigured federation fails silently until the first API call:

```bash
kubectl -n atlas exec deploy/atlas -- env | grep AWS_
# AWS_ROLE_ARN, AWS_WEB_IDENTITY_TOKEN_FILE should both be set
kubectl -n atlas exec deploy/atlas -- \
  python -c "import boto3;print(boto3.client('sts').get_caller_identity()['Arn'])"
```

If that prints the role ARN, you are done and there is no secret anywhere in the system for either party to lose. Get to this state whenever the environment allows it. It removes an entire section from every future questionnaire.

## When there must be a secret

There usually must be at least one: a database password if their Postgres does not do IAM auth, an API key for a system that predates OIDC, a licence key. Three patterns, in descending order of what reviewers like.

**Secrets CSI driver.** The secret is mounted as a file from the customer's vault (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) at pod start. It never becomes a Kubernetes Secret object. Rotation happens in the vault; the pod picks it up on restart or on a rotation poll.

```yaml
volumes:
  - name: secrets
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: atlas-db
```

**External secrets operator.** An operator syncs from their vault into a Kubernetes Secret, which your pod then consumes normally. Slightly weaker (the secret does exist in etcd) but it is what many platform teams already run, and using what they already run is worth more than being marginally purer.

**A Kubernetes Secret the customer creates themselves.** Your chart references it by name via `existingSecret` and never creates it. This is the floor. It is acceptable if their etcd is encrypted at rest and RBAC on the namespace is tight, and you should ask whether both are true rather than assuming.

Your chart must support all three, and it must never require the plaintext-in-values path. Read the secret from a file path where you can, not an environment variable: environment variables show up in `kubectl describe pod`, in crash dumps, in child processes, and in the logs of any library that helpfully prints its config on startup.

```python
import os
from pathlib import Path


def read_secret(name: str) -> str:
    """Prefer a mounted file; fall back to an env var; fail loudly."""
    path = os.environ.get(f"{name}_FILE")
    if path:
        return Path(path).read_text().strip()
    value = os.environ.get(name)
    if value:
        return value
    raise RuntimeError(
        f"{name} is not configured. Set {name}_FILE to a mounted secret path "
        f"or {name} in the environment."
    )
```

The `_FILE` convention costs you nine lines and lets a customer choose the mechanism their platform already supports. That flexibility is what makes a chart installable across ten customers instead of one.

## The registry: your images, their copy

In any serious enterprise environment your images will not be pulled from your registry. They will be mirrored into theirs — Harbor, ECR, Artifactory, ACR — after passing an image scanner. Design for this from the first release.

**Every image reference must be overridable.** Application image, init containers, sidecars, migration jobs, and any third-party image you bundle (the Postgres you ship for dev, the Redis, the nginx). One un-overridable `docker.io/library/redis:7` will fail the install in a cluster with no route to Docker Hub, and the error will look like a network problem rather than a packaging one.

**Publish a manifest of what a release contains.** A plain file the customer's platform team runs against their mirroring tool:

```
ghcr.io/oddversity/atlas@sha256:8c1f...e3a9
ghcr.io/oddversity/atlas-migrate@sha256:41bd...77c2
docker.io/library/redis@sha256:9a2f...10de
```

Then mirroring is a loop, not a scavenger hunt:

```bash
while read -r src; do
  name=$(basename "${src%@*}")
  dst="harbor.northline.internal/vendors/oddversity/${name}@${src#*@}"
  crane copy "$src" "harbor.northline.internal/vendors/oddversity/${name}:$(date +%Y%m%d)"
  echo "mirrored $src"
done < images.txt
```

**Pin by digest, not tag.** A tag is a pointer someone can move. A digest is the bytes. In a regulated environment the customer will be asked to prove that what runs in production is what passed the scan, and only a digest answers that.

**Sign your images and publish an SBOM.** `cosign sign` with keyless signing, and a CycloneDX or SPDX SBOM per image. Their scanner will produce its own SBOM anyway; yours matters because it lets them verify provenance and lets you both talk about the same CVE list. When their scanner flags eleven criticals in your base image, having already shipped the SBOM and a documented base-image update cadence turns a two-week blocker into a scheduled patch.

Expect the scan to fail the first time. Every image built on a full distro base has open CVEs. Reduce the surface before you ship: distroless or Alpine or `-slim`, no compilers in the runtime layer, a multi-stage build that leaves the build toolchain behind. Then have an answer ready for the ones that remain: which are reachable in your code path, which are in a package you can drop, and what your patch SLA is. "We rebuild on the latest base weekly and ship a patch release within N days of a critical in a reachable path" is a sentence that ends the conversation. Choose your own N and honour it.

## The credential inventory

Make this table for every deployment, before the security review, and hand it over unprompted.

| Credential | Where it lives | Who can read it | Lifetime | Rotation | Blast radius if leaked |
|---|---|---|---|---|---|
| Pod identity (IRSA role) | Nowhere; federated token | The `atlas` SA only | 1 hour | Automatic | Read of `atlas/*` secrets and `s3://northline-atlas-docs` |
| Postgres password | Customer Secrets Manager, CSI-mounted | The `atlas` SA, their DBAs | 90 days | Their rotation lambda; pod restarts on change | Read/write of the `atlas` schema |
| Model endpoint key | Not used — IAM auth to Bedrock | n/a | n/a | n/a | n/a |
| Registry pull secret | K8s Secret, created by their platform team | `atlas` namespace | 12 months | Their process | Pull of our images only, read-only robot account |
| Our support access | Customer-initiated screenshare; no standing access | n/a | Per session | n/a | None |

That last row is the one that surprises people, and it is the one that most improves how a CISO reads the rest of the table. "We hold no standing access to your environment" is a strong position. Take it if you can. If you cannot — if you genuinely need a break-glass path for incidents — define it explicitly: a role they enable on request, time-boxed, logged to their CloudTrail, with a named approver on their side. A documented break-glass procedure is respected. An undocumented `kubectl` context on your laptop is a finding.

## The rotation conversation, in week one

Ask in the first technical call: **"What is your rotation policy for the credentials this will use, and what breaks when one rotates?"**

You want to know this early because rotation is where deployments fail six months after you leave, when the person who could fix it is gone. A database password rotates, the pod does not reload it, the service dies at 3 a.m., and nobody knows the vendor's restart procedure.

Design for it: read secrets at request time or watch the mounted file for changes, rather than reading once at process start. Fail with a message that names the credential. Put the rotation behaviour in the runbook. Then test it — actually rotate the credential in staging and watch what happens — before you claim it works.

## What an interviewer will probe

Expect a question shaped like: *"You've deployed our agent into a bank's cluster. Their security team asks what credentials you hold. Walk me through your answer."*

The weak answer describes a secrets manager. The strong answer starts with "ideally none", explains workload identity and why the `:sub` condition matters, names the one credential that genuinely has to exist and why, states its lifetime and rotation, and finishes with the break-glass procedure and who approves it. Then it mentions that the images are mirrored into the customer's registry, pinned by digest, signed, with an SBOM.

That is not a security specialist's answer. It is an FDE's answer, and it is the difference between being trusted with a production namespace and being given a sandbox.
