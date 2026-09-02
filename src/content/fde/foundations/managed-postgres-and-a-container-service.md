---
title: "A managed Postgres and a container service"
phase: foundations
module: containers-and-one-cloud
kind: lesson
summary: "Most customer deployments come down to the same two building blocks: a managed database you don't operate yourself, and a container service that runs your code without you managing servers. This lesson is the vocabulary and the connection pattern between them."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain what "managed" actually buys you over self-hosting a database, and what it doesn't.
  - Wire a container service to a managed database over private networking, with credentials handled correctly.
  - Explain why connection pooling matters specifically for container services, and not usually for a single long-running process.
artifact: A connection diagram, in your journal, of the private-networking path between a container service and a managed database — no public IP anywhere in the path.
---

A huge fraction of what you'll actually deploy for a customer, across very different industries, reduces to the same two pieces: a managed relational database holding the data, and a container service running the application logic that talks to it. Knowing this pattern well, generically, is more valuable than memorising any one cloud's exact console flow, because the shape is the same everywhere.

## What "managed" actually buys you

A self-hosted Postgres — one you install and run yourself, on a VM or in a container you operate — makes you responsible for patching the OS and Postgres itself, configuring backups and testing that they actually restore, handling failover if the instance goes down, and tuning storage as data grows. A **managed** Postgres (RDS on AWS, Cloud SQL on GCP, the equivalent on Azure) hands most of that to the provider: automated backups with point-in-time recovery, patching on a schedule you approve rather than perform, a **read replica** or **Multi-AZ** failover option that swaps to a standby automatically if the primary fails, and storage that scales without you provisioning a bigger disk by hand.

What it doesn't buy you: schema design, query performance (the indexing and EXPLAIN lesson earlier in this path is on you regardless of who manages the underlying instance), connection management (below), and cost discipline — a managed instance sized for peak load and left running continuously is exactly the "idle managed database" the previous lesson named as a common source of surprise billing.

## Private networking: no public IP in the path

The default, and correct, pattern is that the database has **no public IP at all** — it lives inside a private subnet of a VPC, reachable only from resources inside that same VPC (or explicitly peered to it), never from the open internet. Your container service lives in the same VPC, reaches the database over its private address, and nothing outside that network can even attempt to connect, regardless of credentials. This is a stronger guarantee than "the database requires a password" — a database with a public IP and a strong password is still a target for every automated scanner on the internet; a database with no public IP isn't reachable by them at all.

```
Internet
   │
   ▼
[Load balancer / API Gateway]  (public subnet)
   │
   ▼
[Container service: your app]  (private subnet)
   │
   ▼
[Managed Postgres]             (private subnet, no public IP)
```

The container service is the only thing that talks to the database directly. The load balancer is the only thing exposed to the internet, and only on the ports your application actually needs (443, typically).

## Credentials: not in the image, not in plain environment variables in source control

The connection string — host, port, database name, username, password — should never be baked into the Docker image (anyone who pulls the image gets the credentials) and should never be committed as plain text alongside application code, even in a `.env` file that's meant to be local-only, because `.env` files end up committed by accident often enough that it's worth not depending on discipline alone. The standard pattern is a secrets manager (AWS Secrets Manager, GCP Secret Manager) that the container service is granted permission to read at startup, via the IAM role from the previous lesson, not via a static key:

```python
import boto3
import json

def get_db_credentials(secret_name: str) -> dict:
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

creds = get_db_credentials("customer-prod/db-credentials")
DATABASE_URL = (
    f"postgresql://{creds['username']}:{creds['password']}"
    f"@{creds['host']}:{creds['port']}/{creds['dbname']}"
)
```

The container's IAM role has permission to read that one secret, and nothing else — the same least-privilege pattern from the previous lesson, applied to a specific, sensitive resource.

## Connection pooling: why it matters more for containers

A single long-running server process typically opens a small, stable number of database connections and reuses them. A container service that scales — spinning up additional instances under load, as most managed container platforms do automatically — can multiply that: ten container instances, each opening twenty connections on its own pool, is two hundred connections against a database that might have a hard limit well below that (Postgres's default `max_connections` is often 100, and managed offerings frequently set it lower still on smaller instance sizes). Hitting that ceiling produces a specific, unhelpful error — connections refused, seemingly at random, worse under exactly the load spikes when the service most needs to work.

The standard fix is a connection pooler sitting between the application and the database — **PgBouncer** is the common one for Postgres — that maintains a smaller, bounded pool of real database connections and multiplexes many more application-level connections onto it. Cloud providers increasingly offer this as a managed add-on (RDS Proxy on AWS) rather than something you run and patch yourself.

```python
# in application code, keep your own client-side pool small and bounded too
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=2,
    pool_timeout=10,
)
```

Setting an explicit, modest `pool_size` per container instance, rather than letting a default of "as many as needed" grow unbounded, is the client-side half of avoiding the multiplied-connections problem — worth doing even before you've introduced a pooler in front of the database.

## TLS to the database

Managed Postgres offerings support (and often require) TLS for connections, even over private networking — private doesn't mean the traffic should be unencrypted, particularly for anything touching regulated data. `sslmode=require` (or `verify-full` for certificate validation, the stronger option) in the connection string is the usual setting; check the specific provider's default, since some ship with TLS optional and it's easy to miss that it isn't enforced.

## The FDE version of this lesson

This exact pair — a managed database, a container service, wired together over private networking with credentials from a secrets manager — is close to the literal shape of the hands-on lab that follows this module, and it's also close to the literal shape of a huge share of real FDE deployments: a hospital chain's operations dashboard, a textile exporter's inventory tool, a US wealth manager's advisor portal. Knowing the pattern cold, and being able to explain *why* each piece is private, pooled, and credential-managed the way it is — not just that it should be — is what separates "I followed a tutorial" from "I understand what I built" in the interview that will ask you to defend it.
