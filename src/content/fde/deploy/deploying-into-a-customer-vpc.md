---
title: "Deploying into a customer VPC"
phase: deploy
module: vpc-byoc-and-customer-kubernetes
kind: lesson
summary: The customer gives you a role in their AWS account and a subnet with no internet gateway. This page covers the cross-account trust you will actually be granted, the network shapes that break your assumptions, and how to hand over Terraform that a stranger's platform team will approve.
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Write a cross-account IAM role and trust policy with an external ID, and explain to a customer's security engineer why each permission is there.
  - Diagnose why your service cannot reach the model API from a private subnet, and name the three fixes in order of what security will accept.
  - Ship a Terraform module a customer's platform team can read, plan and own, with no credentials of yours inside it.
artifact: A Terraform module and an IAM policy pair (trust policy plus permission policy) in your portfolio repo, with a README written for the customer's platform engineer rather than for you.
sources:
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
  - https://omnistrate.com/blog/byoc-anywhere-the-spectrum-of-bring-your-own-cloud-deployments
  - https://www.teamblind.com/post/palantir-forward-deployed-software-engineer-wrrdog4v
---

Your first VPC deployment will go like this. The customer's platform lead creates you an IAM role. You assume it, run `terraform plan`, and get eleven access-denied errors. You ask for more permissions. Their security engineer asks what each one is for. You do not know, because you copied the policy from a tutorial. The call ends and you have lost a week.

Everything in this page exists to stop that call from happening.

Sierra's Forward Deployed Infrastructure Engineer posting describes this work directly: deployment architecture covering VPCs, permissioning and provisioning; upgrades, scaling and incident support; and navigating enterprise stakeholders "from platform engineers to CISOs". Palantir FDEs describing the job on Blind list "managing AWS infrastructure, network administration, container / docker / linux admin" alongside data integration. This is not adjacent to the role. For the infrastructure flavour of the role, it is the role.

## The three things you are being handed

Before any code, establish what you actually have. Write it in the channel so it is on the record.

1. **An identity.** Usually a cross-account IAM role you assume from your account, or an OIDC federation from your CI. Occasionally, and worse, a long-lived access key in an email.
2. **A network location.** A VPC ID, some subnet IDs, and a security group. Ask whether the subnets are public, private-with-NAT, or private-isolated. The three behave completely differently and the customer will often not know which they gave you.
3. **A change process.** Who approves a `terraform apply` against production, how long it takes, and whether you can apply it yourself or must hand the plan to them.

If you have all three in writing on day one, you are ahead of most engagements.

## Cross-account access, done properly

The standard shape is: the customer creates a role in their account; the trust policy says only your account's specific principal may assume it; your service assumes it and gets short-lived credentials.

The trust policy, on their side:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111122223333:role/vendor-deployer" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "sts:ExternalId": "cust-northline-8f3a1c" }
    }
  }]
}
```

Two details that make the difference between a five-minute approval and a fortnight of argument.

**The external ID.** It is a shared secret the customer sets and you store per-customer. It exists to prevent the confused-deputy problem: if you deploy for fifty customers and one of them learns another's role ARN, the external ID stops them from tricking your service into assuming it. Generate one per customer, never reuse, never let the customer choose "1234". A security engineer who sees you propose an external ID unprompted will assume you have done this before, which is the impression you want.

**Naming the principal, not the account.** `"AWS": "arn:aws:iam::111122223333:root"` trusts every principal in your account. `arn:aws:iam::111122223333:role/vendor-deployer` trusts one role. Always ask for the second, even though it means telling them the exact role you deploy from. If you cannot commit to a stable role name on your side, you are not ready to ask for their production account.

For CI, prefer OIDC over any stored key. GitHub Actions can federate directly into their account with a trust policy conditioned on your repository and branch, which means there is no long-lived secret anywhere for either party to lose. If a customer's security team pushes back on cross-account roles entirely, OIDC-from-CI is the fallback that most often gets approved, because nothing persists.

**Never accept a long-lived access key.** If someone emails you one, the correct response is a short message: "I'd rather not hold a static credential for your production account. Can we do a cross-account role with an external ID instead? It's the same amount of work for you and I can't leak what I don't have." You will be thanked for this once, in month four, when it comes up in the security review.

## The permission policy nobody argues with

The policy that gets approved is the one where every statement has a reason a non-expert can read. Write it scoped, and write the reasons next to it.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RunTheServiceTasks",
      "Effect": "Allow",
      "Action": ["ecs:UpdateService", "ecs:DescribeServices", "ecs:RegisterTaskDefinition"],
      "Resource": "arn:aws:ecs:ap-south-1:444455556666:service/northline-prod/atlas-*"
    },
    {
      "Sid": "ReadOurOwnImages",
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
      "Resource": "*"
    },
    {
      "Sid": "ReadAppSecrets",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-south-1:444455556666:secret:atlas/*"
    }
  ]
}
```

Three rules that survive review:

- **Resource-scope everything you can.** `ecs:UpdateService` on `*` is a red flag on sight. On `service/northline-prod/atlas-*` it is a boring line item. `ecr:GetAuthorizationToken` genuinely cannot be resource-scoped; say so in the README rather than making them find out.
- **No `iam:*`, ever, in the steady-state role.** Creating roles is a one-time bootstrap the customer does themselves from a template you supply. If your deployer can create IAM roles, it can escalate to administrator, and any competent reviewer will say so.
- **Split bootstrap from steady state.** One policy for the initial install, applied by their admin, discarded after. A much smaller one for ongoing operation. Ship both, labelled.

Expect to be asked for a permissions boundary, an SCP-compatible policy, or a `aws:RequestedRegion` condition pinning you to one region. Say yes to all three. They cost you nothing and they buy trust.

## The network, which is where you will actually lose the week

The customer says "we've given you a private subnet". This means one of three things, and you must determine which before you debug anything.

**Private with NAT gateway.** Outbound to the internet works, inbound does not. Your container can reach a model API, a package registry, your telemetry endpoint. Rare in regulated environments and increasingly rare everywhere, because NAT gateways cost money and leak egress.

**Private, isolated, with VPC endpoints.** No route to the internet at all. AWS service traffic goes through interface endpoints (`com.amazonaws.ap-south-1.ecr.dkr`, `.ecr.api`, `.secretsmanager`, `.logs`, `.sts`) and an S3 gateway endpoint. Anything not on that list does not resolve or does not connect. This is the common regulated shape, and it is the one that breaks people.

**Private, egress through a forward proxy.** Everything goes out via `proxy.corp.internal:3128`, often with authentication, always with an allowlist. Your code must honour `HTTPS_PROXY` and `NO_PROXY`, and many SDKs quietly do not, or do for HTTP and not for gRPC.

Here is the checklist to run on day one, from inside the network, not from your laptop:

```bash
# 1. Does DNS resolve at all, and to what?
getent hosts api.anthropic.com
getent hosts <account>.dkr.ecr.ap-south-1.amazonaws.com

# 2. Does TCP connect? (curl proves both DNS and routing)
curl -sS -o /dev/null -w '%{http_code} %{time_connect}s\n' https://sts.ap-south-1.amazonaws.com/

# 3. Is a proxy in play, and does it terminate TLS?
env | grep -i proxy
openssl s_client -connect api.anthropic.com:443 -servername api.anthropic.com </dev/null 2>/dev/null | openssl x509 -noout -issuer
```

That third command is the one that finds the problem people spend two days on. If the issuer is the customer's internal CA rather than a public one, the proxy is doing TLS interception, and every HTTP client in your stack needs to trust that CA. Python needs the bundle at `REQUESTS_CA_BUNDLE` or `SSL_CERT_FILE`; Node needs `NODE_EXTRA_CA_CERTS`; the JVM needs it in a truststore; Go reads the system store but only if you baked the cert into the image. Your container is probably built `FROM python:3.12-slim`, which trusts none of it.

The fix, in the Dockerfile:

```dockerfile
COPY corp-root-ca.crt /usr/local/share/ca-certificates/corp-root-ca.crt
RUN update-ca-certificates
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
```

Ask for the CA bundle in the first week. It is a boring request that platform teams answer in an hour, and asking for it late costs you days.

## When the model API is not reachable

The most common hard blocker in an AI deployment into a private VPC: your service cannot reach the inference endpoint. There are three fixes and security will accept them in this order, worst to best.

1. **Allowlist the vendor's hostname on the proxy.** Fastest, most fragile. Vendor IPs change, the allowlist is per-hostname, and someone will ask why customer data is crossing to a third party at all.
2. **Use the cloud-native private endpoint.** Bedrock via a VPC interface endpoint, Azure OpenAI via a private endpoint, Vertex via Private Service Connect. Traffic never traverses the public internet; it stays on the cloud provider's backbone inside their account. This is the answer that gets approved in banks, and it is why "which cloud is the model on" is a first-call question, not a detail.
3. **Self-host the model inside the perimeter.** Highest cost, no external dependency, and the only option once you go further down the spectrum. Covered later in this phase.

Have a view on which one you are proposing before the security call, and know the second one exists. An FDE who says "we can use the Bedrock VPC endpoint in your account, so no data leaves your VPC boundary" has changed the temperature of the room.

## Handing over Terraform they will actually approve

You are not writing Terraform for yourself. You are writing it for a platform engineer who will read every line, run `plan` themselves, and own it after you leave.

- **No provider credentials in the code.** The provider block takes a role ARN they configure. No `access_key` fields, no baked-in profile names.
- **Everything in variables, defaults that are safe.** `vpc_id`, `subnet_ids`, `kms_key_arn`, `image_tag`, `log_retention_days`. If a variable has no sensible default, make it required rather than guessing.
- **No remote state in your account.** Their state, their S3 bucket, their lock table. You having their state file is a finding.
- **Pin every version.** Provider versions, module versions, image tags by digest. `latest` in a customer environment is an outage waiting for a Tuesday.
- **A `plan` that reads clean.** Run it yourself and read the output as they will. Twelve resources with clear names is approvable. Ninety resources including things named `this` is not.
- **A README with a "what this creates and why" table.** One row per resource, one sentence each. This document does more for approval speed than the code does.

Test the whole thing against a scratch account configured to look like theirs: private subnets, no internet gateway, an SCP denying region drift, a permissions boundary. If your module only works in an account where you are administrator, you have not tested it.

## What to write down before you leave the engagement

The VPC deployment is not done when it runs. It is done when someone else can operate it. Leave behind:

- The runbook: how to restart it, how to roll back to the previous image digest, how to rotate the database credential, who to call.
- The exact set of network dependencies, by hostname and port, with what breaks if each is blocked.
- The permission policy with the reason column intact, so their next security review does not start from zero.
- The upgrade procedure and the change-window assumption baked into it.

That handover document is the artifact. In an interview, "I deployed into a customer VPC" is a claim. "Here is the cross-account role I designed, here is the reason column that got it approved in one review, and here is the runbook their platform team used to roll it back at 2 a.m. without me" is evidence.
