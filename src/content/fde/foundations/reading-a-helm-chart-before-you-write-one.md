---
title: "Reading a Helm chart before you ever write one"
phase: foundations
module: containers-and-one-cloud
kind: lesson
summary: "Almost every customer with a Kubernetes cluster already has Helm charts for it. Your first job is reading one accurately, not writing one from scratch — this lesson is the map from chart layout to rendered manifest to a running change you can trust."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Navigate a Helm chart's directory layout and explain what each file contributes to the final Kubernetes manifests.
  - Use helm template and helm get values to see exactly what a chart will deploy before it touches a cluster.
  - Trace a value from values.yaml through a template to the running resource it configures, in a chart you did not write.
artifact: "A written walkthrough, in your journal, of one real open-source Helm chart — which values you would change to deploy it for a fictional customer, and why."
---

By the time you are deploying anything into a customer's Kubernetes cluster, someone at that customer has almost certainly already written Helm charts for their existing services. Your job in week one is rarely "write a chart from a blank directory." It is "read their chart, understand what it actually deploys, and change one value safely without breaking the twelve other things that chart also controls." Being fluent at reading charts before you can write one well is the more valuable skill, and it is the one this lesson covers.

## What Helm actually is

Kubernetes manifests — Deployments, Services, ConfigMaps, Ingresses — are YAML, and hand-writing one per environment (dev, staging, prod, each customer's cluster) means the same 200 lines copy-pasted with three fields changed. Helm is a templating and packaging tool on top of that: a **chart** is a directory of YAML templates plus a `values.yaml` file of the fields that vary. `helm install` renders the templates with a given set of values and applies the result to the cluster. A **release** is one installed instance of a chart — you can install the same chart twice, with different values, as two releases.

## The chart layout

A typical chart looks like this:

```
mychart/
  Chart.yaml          # name, version, description
  values.yaml          # default values, the ones templates reference
  templates/
    deployment.yaml
    service.yaml
    configmap.yaml
    _helpers.tpl        # reusable template snippets
  charts/               # bundled sub-charts (dependencies)
```

`Chart.yaml` is metadata — chart name, version, and the app version it packages. It rarely matters for reading a chart correctly; `values.yaml` and `templates/` are where the actual behaviour lives.

`values.yaml` is a plain YAML file of defaults:

```yaml
replicaCount: 2
image:
  repository: myregistry.internal/orders-service
  tag: "1.4.2"
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 512Mi
service:
  port: 8080
```

Nothing in `values.yaml` is applied to the cluster directly. It is only ever a set of variables that templates in `templates/` reference using Go template syntax:

```yaml
# templates/deployment.yaml (excerpt)
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

`.Values.replicaCount` pulls from `values.yaml` (or an override, covered below); `.Chart.Name` pulls from `Chart.yaml`. Reading a chart is mostly this: for each template file, find every `{{ .Values.X }}` reference and trace it back to where `X` is defined or overridden.

## Seeing the real output before it touches a cluster

The single most useful command for reading an unfamiliar chart is one that never contacts a cluster at all:

```bash
helm template myrelease ./mychart --values custom-values.yaml
```

This renders every template with the given values and prints the exact Kubernetes YAML that would be applied — no cluster connection required, no risk of touching anything. Run this before every `helm install` or `helm upgrade` against a customer's cluster, and read the output. It is the difference between guessing what a chart does and knowing.

To see what values are currently driving an already-installed release:

```bash
helm get values myrelease --all
```

`--all` matters — without it, Helm shows only the values you explicitly overrode at install time, not the full merged set including chart defaults, which hides most of what is actually configured.

To see the diff between what is live and what a values change would produce, without applying it:

```bash
helm diff upgrade myrelease ./mychart --values custom-values.yaml
```

(`helm diff` is a plugin, not built in — `helm plugin install https://github.com/databus23/helm-diff` — and it is worth installing on your first day at any customer running Kubernetes, because it turns "I think this change is safe" into "I can see exactly which lines change.")

## Overrides, and the order they apply in

Values come from four places, applied in this order, later ones winning:

1. The chart's own `values.yaml` (the defaults).
2. A parent chart's values, for a chart used as a dependency.
3. A `-f custom-values.yaml` file passed at install or upgrade time.
4. `--set key=value` flags on the command line, which win over everything.

```bash
helm upgrade myrelease ./mychart \
  -f values-prod.yaml \
  --set image.tag=1.4.3 \
  --set replicaCount=4
```

This is where reading a chart under deadline pressure goes wrong: a customer's platform team hands you a chart plus a `values-prod.yaml` they maintain separately, and if you do not check for a stray `--set` in their deploy script overriding one of those values, you will read the wrong effective configuration and debug the wrong thing. `helm get values --all` on the live release is the source of truth, not any single file.

## Subcharts and shared conventions

Larger charts bundle dependencies as subcharts in a `charts/` directory or declared in `Chart.yaml` under `dependencies:`. Values for a subchart are namespaced under its name in the parent's `values.yaml`:

```yaml
# parent values.yaml
postgresql:
  auth:
    database: orders
  primary:
    persistence:
      size: 20Gi
```

If a customer's platform is built on a common base chart (an internal "app template" many companies standardize on), expect deeply nested values and `_helpers.tpl` files defining shared naming conventions — `{{ include "mychart.fullname" . }}` generating consistent resource names across every service. Read `_helpers.tpl` early; it explains naming you will otherwise find mysterious everywhere else in the chart.

## The FDE version of this

You will rarely be handed a clean slate. You will be handed a customer's existing Helm setup, asked to deploy your service into it, or to add one environment variable to an existing deployment's `values-prod.yaml` without breaking the other nine services that share the same base chart. The habit that prevents an incident is mechanical: `helm template` before every change to see the literal output, `helm diff upgrade` before every apply to see exactly what will change, and `helm get values --all` before you touch anything, so your mental model of "what is currently configured" matches reality instead of just the one file you happened to open first. An interviewer testing Kubernetes fluency for an FDE seat is far more likely to hand you an existing chart and ask you to change one value safely than to ask you to write a chart from scratch — reading accurately, under time pressure, in an unfamiliar chart is the actual skill being tested.
