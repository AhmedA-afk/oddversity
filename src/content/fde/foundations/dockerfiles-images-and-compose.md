---
title: "Dockerfiles, images, and compose for a two-service app"
phase: foundations
module: containers-and-one-cloud
kind: lesson
summary: "A Dockerfile is the recipe, an image is the frozen result, and compose is how you run more than one of them together. This lesson builds a real two-service app so the difference stops being abstract."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Write a Dockerfile that builds a small Python service into a working image, using layer caching correctly.
  - Explain the difference between an image and a running container, and what state survives a restart.
  - Run a two-service app (an API and a database) with docker compose, including a healthcheck.
artifact: A Dockerfile, a docker-compose.yml, and a working two-service app you can `docker compose up` from a clean checkout.
---

A container packages an application together with everything it needs to run — its dependencies, its runtime, its configuration — so that "works on my machine" stops being a meaningful complaint, because the machine it runs on is now the same one everywhere: the image. A **Dockerfile** is the set of instructions that builds that image. The **image** is the frozen, versioned result — a file, effectively, that doesn't change once built. A **container** is a running instance of an image, the way a running process is an instance of a program on disk. You can run the same image as a container ten times, and each one starts from the identical frozen state and diverges from there.

## A Dockerfile, built carefully

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

Read this top to bottom as instructions that each produce a layer, and note the specific order, which is not arbitrary. `FROM` picks a base image — `python:3.12-slim` gives you Python without the full Debian desktop tooling the non-slim image carries, which matters for image size and, later, for what you have to bundle in an air-gapped install. `WORKDIR` sets the working directory inside the image for every instruction after it. `COPY requirements.txt .` copies *only* the dependency file first, before the rest of the code, and `RUN pip install` runs against just that file — this ordering exists because Docker caches each layer, and only rebuilds a layer (and everything after it) if the files it depends on changed. If you copied the entire codebase before installing dependencies, changing a single line of application code would invalidate the cache and force a full dependency reinstall on every build — copying `requirements.txt` first means dependency installation is only re-run when dependencies actually change, which is the difference between a ten-second rebuild and a two-minute one during active development.

`COPY . .` after that brings in the rest of the code. `EXPOSE 8000` documents which port the container listens on (it doesn't actually publish the port — that happens at `docker run` or in compose). `CMD` is what runs when the container starts, and note `--host 0.0.0.0` — the same binding lesson from the networking module applies inside a container exactly as it does on a bare machine; binding to `127.0.0.1` inside a container makes it unreachable from outside the container too, even with the port published.

```bash
docker build -t notes-api:latest .
docker run -p 8000:8000 notes-api:latest
```

`-p 8000:8000` maps host port 8000 to container port 8000 — the first number is the host side, the second is the container side, and they don't have to match (`-p 9000:8000` would expose it on host port 9000 while the app inside still thinks it's on 8000).

## What survives, what doesn't

A running container has a writable layer on top of the image, and anything written there — a log file, a temp file, a row inserted into a SQLite file inside the container — disappears the moment the container is removed (`docker rm`), not just stopped. This surprises people the first time a database "loses" all its data on a routine restart: the data was never anywhere durable to begin with. **Volumes** are the fix — a directory on the host, or a Docker-managed volume, mounted into the container, that persists independently of the container's lifecycle.

`.dockerignore`, alongside the Dockerfile, works like `.gitignore` and matters for the same layer-caching reason: without one, `COPY . .` picks up your local `.venv`, `.git` directory, and any local `.env` file with real secrets in it, bloating the image and, in the `.env` case, potentially baking a secret into a layer that ends up in a registry.

```
# .dockerignore
.venv/
.git/
__pycache__/
*.pyc
.env
```

## Multi-stage builds, briefly

For anything beyond a small script, a multi-stage build keeps the final image lean by using one stage to build (with compilers, dev headers, everything needed to build) and a second, separate stage that only copies the finished artifact:

```dockerfile
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/install -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /install /usr/local/lib/python3.12/site-packages
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

The final image never contains the build tools, only the installed packages and your code — smaller, and with a narrower attack surface, both of which matter more than they sound like they should when you're bundling this for an air-gapped install later in this path.

## Compose: running more than one service together

Real services rarely run alone. A compose file describes a set of services, their networking, and their dependencies, and starts them together:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: notes
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://app:devpassword@db:5432/notes
    depends_on:
      db:
        condition: service_healthy

volumes:
  db-data:
```

Three things worth noticing. First, `db-data:/var/lib/postgresql/data` is the volume that makes the database's data survive a `docker compose down` and back `up` — without it, every restart starts from an empty database. Second, `api` reaches the database at hostname `db`, not `localhost` — compose creates a private network where each service is reachable by its service name, which is a different, correct model from the port-mapping-to-localhost pattern of a single container. Third, `depends_on` with `condition: service_healthy` (not just `depends_on: [db]`) waits for the `healthcheck` to actually pass, not just for the container to start — Postgres accepts TCP connections for a moment before it's actually ready to serve queries, and an API that connects immediately on `db` starting, without waiting for the healthcheck, can fail on its first request every single time you bring the stack up.

```bash
docker compose up --build
docker compose down          # stop and remove containers, keep volumes
docker compose down -v       # also remove volumes — deletes the data
```

## The FDE version of this lesson

The Dockerfile you write for a customer is not just "make it run" — it's what you hand over when you leave, and the next person maintaining it (possibly at the customer, possibly you six months later on a different engagement) reads the layer order and the `.dockerignore` as evidence of whether this was built carefully or copy-pasted from a tutorial. In an interview, being asked "why did you copy requirements.txt before the rest of the code" and having a real answer — not "that's just how the tutorial did it" — is a small, specific tell that you understand what you're shipping rather than reproducing it.
