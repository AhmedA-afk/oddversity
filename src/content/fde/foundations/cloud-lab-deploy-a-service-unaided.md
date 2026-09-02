---
title: "Lab: deploy a production-quality service yourself, unaided"
phase: foundations
module: containers-and-one-cloud
kind: lab
summary: "Take the two-service app from the Dockerfiles lesson and put it on a real cloud, wired the way a customer deployment should be: a managed database with no public IP, a container service reached only through a load balancer, and least-privilege access throughout."
duration: "3 h"
updated: "2026-09-02"
outcomes:
  - Deploy a containerised API backed by a managed Postgres database to a real cloud account, unassisted.
  - Wire private networking so the database has no public IP and is reachable only from the application.
  - Tear the whole thing down cleanly and confirm nothing keeps billing after you're done.
artifact: A working, publicly reachable URL (up for the duration of the lab), plus a short architecture note in your journal naming every resource you created and why.
---

Everything in this module so far — Dockerfiles, IAM and least privilege, managed Postgres and private networking — has been building toward this. This lab is the first time you do the whole thing yourself, on a real cloud account, with nobody checking your work as you go. Use the free tier; the point is not spending money, it's proving you can stand this up from nothing.

## What you're deploying

The notes API from the earlier HTTP lab, now backed by a real managed Postgres instead of an in-memory dict, running as a container service instead of `python server.py` on your laptop.

```python
# server.py — same shape as the HTTP lab, now with a real database
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import asyncpg
import os
import uuid

app = FastAPI()
VALID_API_KEY = os.environ["API_KEY"]
DATABASE_URL = os.environ["DATABASE_URL"]

class NoteIn(BaseModel):
    text: str

@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    async with app.state.pool.acquire() as conn:
        await conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (id UUID PRIMARY KEY, text TEXT NOT NULL)"
        )

def check_auth(x_api_key: str | None):
    if x_api_key != VALID_API_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid API key")

@app.post("/notes", status_code=201)
async def create_note(note: NoteIn, x_api_key: str | None = Header(default=None)):
    check_auth(x_api_key)
    note_id = str(uuid.uuid4())
    async with app.state.pool.acquire() as conn:
        await conn.execute("INSERT INTO notes (id, text) VALUES ($1, $2)", note_id, note.text)
    return {"id": note_id, "text": note.text}

@app.get("/health")
async def health():
    return {"status": "ok"}
```

## Steps

**1. Create an isolated account or project.** If you're using an existing personal cloud account, create a fresh project/account boundary for this lab specifically, so teardown is unambiguous — deleting the project deletes everything in it, with nothing left to hunt for afterward.

**2. Set a billing alert before creating anything else** — a low threshold (a few dollars) with an email notification, per the previous lesson.

**3. Create the VPC and subnets**: one private subnet for the database and the container service, one public-facing entry point for the load balancer. Most cloud providers' container platforms (Cloud Run, App Runner, ECS Fargate) can manage much of this for you with sensible defaults — use the managed path rather than hand-rolling a VPC from scratch for this lab; the point is the architecture, not proving you can configure raw networking primitives by hand.

**4. Create the managed Postgres instance**, in the private subnet, with no public IP, and note its connection details. Store the admin credentials in the cloud's secrets manager rather than writing them down anywhere else.

**5. Create an IAM role for the container service** that can read exactly that one secret and nothing else — the least-privilege pattern from two lessons ago, not a broad role because it's faster to set up.

**6. Build and push the image** to the provider's container registry:

```bash
docker build -t notes-api:latest .
docker tag notes-api:latest <registry-url>/notes-api:latest
docker push <registry-url>/notes-api:latest
```

**7. Deploy the container service**, configured to:
- run the pushed image,
- sit in the private subnet, reachable only via the load balancer, not directly from the internet,
- read `DATABASE_URL` and `API_KEY` from the secrets manager at startup, not as plain environment variables typed into the console,
- expose a health check on `/health` that the platform polls to know the service is actually ready, not just started.

**8. Confirm the public URL works:**

```bash
curl https://<your-service-url>/health
curl -X POST https://<your-service-url>/notes \
  -H "X-API-Key: <your-key>" \
  -H "Content-Type: application/json" \
  -d '{"text": "deployed from nothing"}'
```

**9. Confirm the database genuinely has no public IP** — check the instance's networking configuration directly in the console or CLI, don't just trust that you configured it that way; this is the step people skip and the one most worth not skipping.

**10. Write the architecture note**: every resource you created (VPC, subnets, database instance, container service, load balancer, IAM role, secret), one line each, and why it's shaped the way it is.

**11. Tear it all down.** Delete the container service, the database instance, the load balancer, and — if you created one specifically for this lab — the project itself, which is the most reliable way to guarantee nothing keeps billing. Confirm via the billing console, a day later, that the charge stopped.

## Definition of done

- A publicly reachable URL served your API for at least long enough to demo it — `/health` returns 200, `/notes` accepts an authenticated POST and persists it in the real database.
- You confirmed, directly, that the database has no public IP — not "I configured it that way," but "I checked and it's true."
- The container service's IAM role is scoped to exactly the secret it needs, not broad account access.
- Everything is torn down, and you've confirmed via the billing dashboard (not just "I clicked delete") that nothing is still running.

## How this goes wrong

**Giving the container service broad IAM permissions because the narrow policy didn't work on the first try.** The instinct under time pressure is to widen the policy until the error goes away, then move on without narrowing it back. This is exactly how a lab meant to teach least privilege teaches the opposite habit. If a scoped policy fails, read the actual error — it usually names the missing action — and add precisely that, not `*`.

**Forgetting the healthcheck, and the service restart-looping.** Many managed container platforms will kill and restart a container that doesn't respond healthy within a startup window. If your app takes a few seconds to connect to the database on startup and the platform's health check timeout is shorter than that, you'll see an endless restart loop that looks like a deployment failure but is actually a timing mismatch — worth checking the platform's specific health check timeout settings rather than assuming your code is broken.

**Leaving something running.** This is the most expensive version of "how this goes wrong," literally. A managed database instance left running after the lab is the single most common source of an unexpected bill from an exercise like this. Set the billing alert in step 2 specifically so this mistake gets caught in days, not weeks.
