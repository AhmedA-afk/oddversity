---
title: "One cloud: accounts, IAM, regions, and the bill"
phase: foundations
module: containers-and-one-cloud
kind: lesson
summary: "You don't need to know three clouds. You need to be dangerous in one, understand identity and access management well enough to ask for exactly what you need, and never be the reason a customer's bill has an unexplained spike."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain the difference between an IAM user, a role, and a policy, and why roles are almost always the right answer in a customer's account.
  - Set a least-privilege IAM policy for a specific task instead of requesting broad access.
  - Set up a billing alert, and name the two or three services most likely to produce a surprise bill.
---

Pick one cloud and go deep. AWS, GCP, and Azure differ in naming and console layout, but the underlying concepts — identity and access management, virtual networks, managed compute, managed databases, regions — are close enough across all three that depth in one transfers most of the way to the others. This lesson uses AWS terms as the concrete example, since it's the most commonly required in the postings this path is built against, but the concepts hold regardless of which one a given customer runs.

## Accounts, and why a customer will never give you their root account

A cloud account is the billing and isolation boundary — everything inside it shares one bill and, by default, is reachable by anyone with sufficient permission inside it. Enterprises almost never operate as a single account; they use an **organisation** with many accounts (one per environment, one per team, sometimes one per customer for a multi-tenant vendor), so a mistake or breach in one account doesn't automatically expose everything else. When you're brought onto an engagement, you should expect — and should explicitly ask for, in the SOW — a scoped account or a scoped role inside their existing account structure, never the account owner's root credentials, which is both bad security practice and a request the customer's security team should refuse on principle.

## IAM: users, roles, and policies

**A policy** is a JSON document describing what actions are allowed on what resources:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::customer-data-export/*"
    },
    {
      "Effect": "Allow",
      "Action": "rds:DescribeDBInstances",
      "Resource": "*"
    }
  ]
}
```

This policy allows reading and writing objects in exactly one S3 bucket, and describing (not modifying) RDS instances — nothing else. It's a useful pattern to internalise: name the specific actions (`s3:GetObject`, not `s3:*`) and the specific resource (one bucket's ARN, not `*`) whenever you're the one drafting the ask.

**A user** is a long-lived identity with its own credentials — historically the default way people accessed AWS, and increasingly discouraged in favour of roles, because long-lived credentials (access keys that don't expire) are a standing liability if leaked, sitting in a `.env` file or a CI system indefinitely.

**A role** is an identity that something assumes temporarily — a person federating in via SSO, an EC2 instance, a container task — and gets short-lived, automatically-expiring credentials for the duration. This is the correct default for almost everything you'll do on a customer engagement: request a role scoped to exactly the services and actions your work needs, assumed via their SSO, rather than a permanent user with standing keys. If a customer's process still hands out access keys directly, treat them the way you'd treat any other credential that doesn't expire — never commit them, never put them in a Dockerfile, and ask whether a role-based alternative exists before defaulting to the key.

## Regions, and why they're not just a latency knob

A region is a physically separate set of data centres (`ap-south-1` for Mumbai, `us-east-1` for Virginia, and so on). Beyond latency, region choice is a compliance decision as much as a performance one: data residency requirements — the DPDP Act's expectations for Indian personal data, HIPAA-adjacent requirements for US healthcare data, GDPR for EU personal data — can constrain which region you're allowed to put a workload in at all, independent of which one is fastest for your users. This lesson is a preview; the data module later in this path covers residency rules properly. The practical habit to form now: never assume you can pick the nearest or cheapest region without asking whether the customer has a residency constraint that overrides that choice.

## The bill, and what actually causes the surprise

The specific services that most often produce an unexpected bill, worth knowing by name before you provision anything:

- **NAT gateways.** Billed per hour *and* per gigabyte processed, and easy to forget you've left running in a test VPC — a common source of a bill that's mysteriously nonzero on an account nobody's actively using.
- **Data transfer between regions or out to the internet.** Cheap or free within a region, non-trivial across regions, and can add up quickly for anything moving significant data volume — worth checking before architecting a system that routes data across regions by default.
- **Idle managed databases and unattached storage volumes.** A managed Postgres instance you spun up for a lab and forgot to tear down bills continuously whether or not anything connects to it; the cloud lab later in this module ends with an explicit teardown step for exactly this reason.
- **Forgotten load balancers.** Billed hourly regardless of traffic, and easy to leave behind after a demo.

Set a billing alert before you provision anything, not after:

```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

Where `budget.json` defines a monthly limit (say, $20 for a personal learning account) and `notifications.json` defines an email alert at 80% of that limit. In a customer's account, you won't be setting this up yourself — it'll already exist — but you should ask where it is and what it's set to, so you know what threshold triggers a conversation before it triggers a surprised finance team.

## Tags, and being a good guest in someone else's account

Tagging every resource you create — `Owner: yourname`, `Project: claims-triage-pilot`, `Ephemeral: true` — costs a few seconds per resource and is the difference between a customer's cloud team being able to answer "what is this $340 charge and can we delete it" in thirty seconds versus opening a support ticket to trace an untagged resource back to whoever created it. Ask what the customer's tagging convention is before you start; most organisations with real cloud governance already have one, and following it is a small, visible signal that you're not going to be the reason their cost-allocation reports break.

## The FDE version of this lesson

The interview version of this shows up as "how would you request access to a customer's AWS account to do X" — and the answer that reads as experienced is specific: a role, scoped to the named services and actions the task actually requires, assumed via SSO, not "give me admin and I'll figure it out." In the field, this same habit — asking for precisely what's needed, tagging what you create, watching the bill — is what earns broader access over the course of an engagement instead of a customer's security team tightening the leash after the first surprise.
