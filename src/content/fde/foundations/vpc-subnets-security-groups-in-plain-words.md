---
title: "VPCs, subnets and security groups in plain words"
phase: foundations
module: containers-and-one-cloud
kind: lesson
summary: "The most common reason your deployed service is unreachable is not the application. It is a subnet with no route to the internet, or a security group that never allowed the port. This lesson builds the mental model of a VPC well enough to debug that, fast."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Draw, from memory, the parts of a VPC that decide whether a request from the internet ever reaches your service.
  - Explain the difference between a public and a private subnet in terms of routing, not just naming convention.
  - Diagnose "connection timed out" versus "connection refused" as two different classes of networking problem, and check the right layer for each.
---

A service you deployed is unreachable. Before you touch the application code, most of the time the actual cause is one of a small number of networking misconfigurations, all inside the customer's cloud account, none of them visible from inside the container. This lesson gives you the mental model to find those causes fast, on any of the major clouds — the concepts are close enough to identical across AWS, GCP, and Azure that this model transfers directly.

## A VPC is a private network you own inside the cloud

A **VPC** (Virtual Private Cloud) is an isolated, private network carved out for your account, with an IP address range you choose (a CIDR block, like `10.0.0.0/16`). Nothing outside your VPC can reach anything inside it by default — that isolation is the entire point. Everything you deploy — a database, a container service, a load balancer — lives inside a VPC, and reachability from the outside world is something you have to deliberately open up, layer by layer.

## Subnets: dividing the VPC, and the public/private distinction

A VPC is divided into **subnets**, smaller IP ranges within the VPC's overall range, usually one set per availability zone for resilience. The distinction that matters most in the field is not the name "public" or "private" — that is just a label someone chose — it is the **route table** attached to that subnet:

- A subnet is effectively **public** if its route table sends traffic destined for the internet (`0.0.0.0/0`) to an **internet gateway** — a component attached to the VPC that provides two-way access to and from the public internet.
- A subnet is effectively **private** if it has no such route — nothing inside it can be reached directly from the internet, and by default it cannot reach the internet either, unless a **NAT gateway** is configured to allow *outbound* traffic only (a private subnet resource can call out to fetch a package or call an external API, but nothing can call in).

This is why "which subnet is this database actually in" is one of the first useful questions in any deployment debugging session — a database sitting in a subnet with no internet gateway route is, by design, unreachable from anywhere outside the VPC, and that is usually correct: a customer's compliance posture very often requires databases to sit in private subnets specifically so they cannot be reached directly from the internet at all.

## Security groups: the stateful firewall on the resource itself

A **security group** is a set of allow rules attached directly to a resource (an EC2 instance, a container task, a load balancer) — it is a firewall, but scoped to the resource, not the subnet. A typical rule: "allow inbound TCP on port 443 from anywhere" or, more restrictively, "allow inbound TCP on port 5432 only from the security group attached to the application servers."

Security groups are **stateful**: if you allow an inbound request, the corresponding outbound response is automatically allowed back out, without a separate rule. This is different from a **network ACL** (NACL), the subnet-level equivalent, which is **stateless** — you must explicitly allow both the inbound and the outbound direction, and NACLs are evaluated in numbered rule order, first match wins, unlike security groups where all matching allow rules are combined. In practice you will touch security groups far more often than NACLs; NACLs exist mostly as a coarse, subnet-wide backstop most teams set once and rarely revisit.

## The path a request actually takes

For a request from the public internet to reach your service, every one of these has to allow it:

1. **Internet gateway** attached to the VPC, and a route in the subnet's route table pointing to it.
2. **Security group** on the load balancer or the resource itself, allowing inbound traffic on the relevant port from the relevant source.
3. **NACL** on the subnet, if one has been customised (often left at its permissive default, but worth checking).
4. **The application itself**, actually listening on the expected port and interface (`0.0.0.0`, not just `127.0.0.1` — a mistake covered in the containers lesson in this module).

A failure at any single layer produces the same symptom from the caller's side — the connection does not work — which is exactly why debugging "the service is unreachable" is a process of checking these layers in order, not guessing.

## Reading the error to narrow down which layer

The specific failure mode you get back is a real clue, not noise:

- **Connection times out** (no response at all, eventually gives up): almost always a networking-layer problem — a security group not allowing the port, a route missing, a NACL blocking it. The request never got a chance to reach the application, so the application had no opportunity to reject it.
- **Connection refused**, immediately: the network path is fine — a security group and route allowed the packet through — but nothing is listening on that port on the target machine. This points at the application itself: it crashed, it is not started yet, or it bound to the wrong port or interface.
- **A TLS or HTTP-level error** (certificate problem, 502 from a load balancer): the network path and the listening process are both fine; the problem is one layer up, at the TLS handshake or the application's own response, covered in the TLS lesson elsewhere in this module.

This one distinction — timeout versus refused — is worth internalising cold, because it immediately tells you whether to go check cloud console networking settings or to go check the application's own logs, and picking the wrong one first wastes real time on a live customer call.

## The FDE version of this lesson

"I deployed it and I can't reach it" is one of the most common messages you will send or receive in the first week of any cloud engagement, and the fix is very rarely in application code. It is a route table, a security group rule, or a subnet choice made by a customer's platform team for reasons — compliance, defence in depth — that predate your involvement and that you need to work within, not around. Being able to reason through the path a request takes, layer by layer, and read a timeout versus a refusal as different diagnoses, is what turns "it's broken, someone from platform needs to look at it" into a specific, actionable ask: "the security group on this instance does not allow inbound 8080 from the load balancer's security group, can that be added."
