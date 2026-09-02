---
title: "Helm into a cluster you do not administer"
phase: deploy
module: vpc-byoc-and-customer-kubernetes
kind: lesson
summary: Shipping a Helm chart into a customer's Kubernetes cluster means writing for a platform team that will not give you cluster-admin, runs a policy engine that rejects your defaults, and mirrors your images into their own registry. This page is the chart that survives that.
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Write a Helm chart whose values file exposes exactly the knobs a customer platform team needs and nothing else.
  - Make a chart install cleanly under a restricted PodSecurity standard, a namespaced RBAC grant, and a mirrored private registry.
  - Debug a failed install in someone else's cluster using only the output of kubectl commands you are permitted to run.
artifact: A published Helm chart with a documented values.yaml, a values-restricted.yaml for hardened clusters, and a NOTES.txt that tells the operator how to verify the install.
sources:
  - https://www.getmaxim.ai/bifrost/resources/enterprise-deployment
  - https://omnistrate.com/blog/byoc-anywhere-the-spectrum-of-bring-your-own-cloud-deployments
  - https://jobs.ashbyhq.com/Sierra/d9c0aa93-e35d-4752-9cef-4c39dcad5365
---

The BYOC pattern that vendor writeups describe most often for Kubernetes is: you publish a Helm chart, optionally an operator with custom resources, and the customer's platform team installs it into a namespace in a cluster you will never have admin on.

That last clause is the whole lesson. Every default Helm chart on the internet is written by someone with cluster-admin on a cluster they built. Yours will be installed by a stranger with a policy engine, an image scanner, a namespace quota, and an opinion about `hostPath`.

## What you will not be given

Assume all of these until told otherwise:

- **No cluster-admin.** You get a namespace and a `RoleBinding` in it.
- **No `ClusterRole` creation.** Anything needing cluster-scoped RBAC — CRDs, admission webhooks, a `ClusterRole` for node metrics — is a separate approval, possibly a separate quarter.
- **No CRDs by default.** If your chart installs CRDs, split them into a separate chart or a `crds/` directory the platform team applies deliberately.
- **No internet from the nodes.** Images come from their registry, not yours.
- **No privileged containers, no `hostNetwork`, no `hostPath`, no running as root.** A cluster running the restricted Pod Security Standard will reject your pod before it schedules.
- **No `LoadBalancer` services.** Ingress goes through their controller, on their hostname, with their certificate.

Write the chart for that cluster and it will also work in a permissive one. Write it for a permissive cluster and you will rewrite it in week three.

## The values file is the product

The `values.yaml` is your API to the customer's platform team. It is the file they will read, diff, put in their GitOps repo and argue about. Everything about your chart is judged from it.

Two rules. **Expose every environment-shaped thing.** And **expose nothing else.** A chart with 300 values is unreviewable; a chart with 12 forces a fork.

```yaml
# values.yaml — Atlas, the retrieval service
image:
  # Set to the customer's mirror. Never assume our registry is reachable.
  repository: ghcr.io/oddversity/atlas
  tag: "2.4.1"
  digest: ""           # if set, takes precedence over tag
  pullPolicy: IfNotPresent
imagePullSecrets: []    # e.g. [{ name: harbor-pull }]

replicaCount: 2

resources:
  requests: { cpu: "500m", memory: "1Gi" }
  limits:   { cpu: "2",    memory: "4Gi" }

serviceAccount:
  create: true
  name: ""
  annotations: {}       # IRSA / Workload Identity goes here

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 10001
  fsGroup: 10001
  seccompProfile: { type: RuntimeDefault }

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }

database:
  # Either point at an existing Postgres or let the chart run one (dev only).
  host: ""
  port: 5432
  name: atlas
  sslMode: require
  existingSecret: ""            # keys: username, password
  existingSecretUserKey: username
  existingSecretPasswordKey: password

model:
  provider: bedrock             # bedrock | azure-openai | vertex | openai-compatible
  endpoint: ""                  # required for openai-compatible / private endpoints
  region: ap-south-1
  existingSecret: ""            # omitted entirely when using IRSA

networking:
  httpProxy: ""
  httpsProxy: ""
  noProxy: "cluster.local,.svc,10.0.0.0/8,169.254.169.254"
  extraCaCertsConfigMap: ""     # ConfigMap holding the corporate root CA

ingress:
  enabled: false
  className: ""
  host: ""
  annotations: {}
  tls: { enabled: true, secretName: "" }

nodeSelector: {}
tolerations: []
affinity: {}
topologySpreadConstraints: []

telemetry:
  otlpEndpoint: ""              # empty means no egress; the chart must still work
```

Look at what that file assumes. Their registry. Their pull secret. Their existing database secret. Their proxy. Their CA. Their ingress class. Their node selectors and tolerations, because their cluster has tainted node pools you have never heard of. And a telemetry endpoint that is allowed to be empty, because a customer will refuse to let your traces leave.

The `nodeSelector`, `tolerations`, `affinity` and `topologySpreadConstraints` passthroughs look like boilerplate. They are the difference between "installs" and "the platform team has to fork your chart", and forked charts never get upgraded.

## Things that get your chart rejected

**Hardcoded registry.** If `image.repository` cannot be overridden for every image including init containers, sidecars and the migration job, the chart is unusable in an air-gapped or mirrored environment. Grep your templates for any image reference that does not come from values.

**Secrets created by the chart from plaintext values.** Never do this:

```yaml
# BAD — the password now lives in their GitOps repo in plaintext
stringData:
  password: {{ .Values.database.password }}
```

Support `existingSecret` and make it the documented path. Let the chart create a secret only for a local development mode, and say so in the comment.

**A `ClusterRole` you do not need.** Audit what you actually read. If your service watches ConfigMaps in its own namespace, that is a `Role`, not a `ClusterRole`. Every cluster-scoped permission you ask for is a separate conversation with a person who does not know you.

**Missing `PodDisruptionBudget` and probes.** Their platform team drains nodes on a schedule. Without a PDB, your two replicas both go at once during a routine node rotation and you get paged for their maintenance. Without a proper readiness probe, a rolling update sends traffic to a pod still loading a model into memory.

**`latest`, or a mutable tag.** Pin by digest where you can. In a customer environment, "it worked yesterday" needs to mean the same bytes.

**Long, blocking init containers.** A migration job that takes eight minutes and holds the release lock will hit their Helm timeout and leave the release in `pending-upgrade`, which is a state the platform team will have to `helm rollback` out of at an inconvenient hour.

## The restricted-cluster values file

Ship a second values file for hardened clusters and test against it in CI. This is the file that means a platform engineer does not have to discover your requirements by trial and error.

```yaml
# values-restricted.yaml — PodSecurity "restricted", mirrored registry, no egress
image:
  repository: harbor.northline.internal/vendors/oddversity/atlas
  digest: "sha256:8c1f...e3a9"
imagePullSecrets: [{ name: harbor-pull }]

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 10001
  seccompProfile: { type: RuntimeDefault }
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }

# readOnlyRootFilesystem means every writable path must be an emptyDir
extraVolumes:
  - name: tmp
    emptyDir: {}
extraVolumeMounts:
  - name: tmp
    mountPath: /tmp

networking:
  extraCaCertsConfigMap: corp-root-ca
  httpsProxy: "http://proxy.northline.internal:3128"
  noProxy: ".northline.internal,.svc,cluster.local,10.0.0.0/8"

model:
  provider: openai-compatible
  endpoint: "https://llm-gateway.northline.internal/v1"

telemetry:
  otlpEndpoint: ""
```

`readOnlyRootFilesystem: true` is the one that catches people. Your application writes somewhere — a cache directory, a tokenizer download, `/tmp` for a file upload, a `.cache/huggingface` path. Find every one of them in a test run and mount an `emptyDir`, or your pod crash-loops in their cluster and works fine on your laptop.

## Debugging in a cluster where you can barely see

You will get a Slack message: "the install failed". You have `get`, `describe`, and `logs` in one namespace. That is enough, if you work in order.

```bash
NS=atlas

# 1. What state is the release in?
helm -n $NS status atlas
helm -n $NS get values atlas          # what they ACTUALLY set, not what you sent

# 2. Which pods, and why not running?
kubectl -n $NS get pods -o wide
kubectl -n $NS describe pod <pod>     # Events at the bottom are the answer 80% of the time

# 3. Events for the whole namespace, newest last
kubectl -n $NS get events --sort-by=.lastTimestamp | tail -30

# 4. The container's own view
kubectl -n $NS logs <pod> -c <container> --previous
```

The `describe` events map almost one-to-one onto causes:

| Event | What it actually means |
|---|---|
| `ImagePullBackOff`, `401 Unauthorized` | Wrong or missing `imagePullSecrets`, or the image was never mirrored |
| `FailedCreate ... violates PodSecurity "restricted"` | Your securityContext is missing a field; the message names it |
| `0/12 nodes are available: 12 Insufficient cpu` | Your resource requests exceed their namespace quota or node shape |
| `0/12 nodes ... had untolerated taint` | You did not pass through `tolerations` |
| `CreateContainerConfigError` | A referenced Secret or ConfigMap key does not exist |
| `Readiness probe failed: connection refused` | App still starting, or listening on the wrong interface (`127.0.0.1` instead of `0.0.0.0`) |
| Pod runs, then `CrashLoopBackOff` with a TLS error | Corporate CA not trusted; see the previous lesson |
| Pod runs, healthy, but calls hang for 60s then fail | Egress blocked; DNS resolves, TCP does not connect |

Run `helm get values` before you theorise. Half of all "your chart is broken" reports are a values file where `image.tag` is quoted wrong, `existingSecret` points at a secret in another namespace, or someone set `replicaCount: 5` against a quota of two.

## Dry-run everything, on their inputs

Before you ask a platform team to apply anything:

```bash
helm template atlas ./charts/atlas -f values-restricted.yaml > /tmp/rendered.yaml
kubectl apply --dry-run=server -f /tmp/rendered.yaml   # runs their admission controllers
```

`--dry-run=server` is the important one: it goes through their admission webhooks, their policy engine (Kyverno, Gatekeeper), their quota. `--dry-run=client` only checks that your YAML is YAML. If they will run one command for you before the change window, make it that one.

Also run `helm lint`, and run `helm upgrade --dry-run` from the currently installed version rather than from scratch. Charts that install cleanly and upgrade badly are a specific and common failure: an immutable field changed (a `Deployment` selector, a `Job` spec, a PVC size), and Kubernetes rejects the patch. Your customer then has a half-upgraded release and a change window closing in twenty minutes.

## Upgrades, which is where the relationship is actually tested

A first install is a good day. The tenth upgrade, on a Tuesday, into a cluster that has drifted, with an operator who has never met you, is the real test.

- **Version-skew policy in writing.** Which chart versions upgrade to which. Whether they can skip versions. Whether a database migration is forward-only.
- **A rollback that works.** `helm rollback` reverts manifests, not migrations. If your migration dropped a column, rollback gives them an old image against a new schema and a broken service. Write migrations expand-then-contract: add the new column, deploy code that writes both, backfill, deploy code that reads new, drop the old column a release later. This is more work and it is the only rollback story that is true.
- **A pre-upgrade check.** A `helm test` or a documented `curl /healthz/detail` that reports version, schema revision and dependency reachability. Give the operator a way to answer "did that work?" without you.
- **`NOTES.txt` that is actually useful.** Not "Thank you for installing atlas!". Print the exact commands to verify the install, the URL to hit, and what a healthy response looks like.

```
Atlas {{ .Chart.AppVersion }} installed into namespace {{ .Release.Namespace }}.

Verify:
  kubectl -n {{ .Release.Namespace }} rollout status deploy/{{ include "atlas.fullname" . }} --timeout=180s
  kubectl -n {{ .Release.Namespace }} run curl --rm -it --image=curlimages/curl --restart=Never -- \
    curl -sS http://{{ include "atlas.fullname" . }}:8080/healthz/detail

A healthy response reports: {"status":"ok","schema":"0042","model_endpoint":"reachable"}
If model_endpoint is "unreachable", egress to {{ .Values.model.endpoint | default "the model provider" }} is blocked.
```

That last line saves a support call. It tells the operator, in their terminal, at the moment of failure, which team inside their own company to talk to.

## The FDE point

Nobody hires you because you can write a Helm chart. They hire you because you can get software running in an environment whose rules you did not set, without cluster-admin, without the ability to see, and without making the platform team feel like they have taken on a liability.

The chart is how you demonstrate that. A values file that anticipates their proxy, their CA, their registry and their taints tells a platform engineer that you have been in a cluster like theirs before. That impression, formed in the first ten minutes of reading your chart, determines how the rest of the deployment goes.
