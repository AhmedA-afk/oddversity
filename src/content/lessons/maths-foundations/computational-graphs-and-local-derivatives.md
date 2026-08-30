---
title: "Computational graphs and local derivatives"
track: "maths-foundations"
status: live
summary: "A computational graph turns a formula into nodes for values and operations, with edges carrying dependencies."
duration: "3 min read"
---

## The short answer

A computational graph turns a formula into nodes for values and operations, with edges carrying dependencies. The forward pass computes and caches values; the backward pass applies each local derivative and accumulates contributions at shared nodes. In AI, this graph is the inspectable bridge from a loss equation to automatic differentiation.

## Why this matters

Most backward bugs are graph bugs: a missing edge, stale cache, overwritten intermediate, or forgotten contribution from a reused value. Drawing the graph makes the chain rule operational and gives a place to attach tests.

## How it works

For `u=x+y`, `v=u²`, and `L=v`, the local derivatives are `∂L/∂v=1`, `∂v/∂u=2u`, and `∂u/∂x=∂u/∂y=1`. The backward signal at `u` is `2u`; it reaches both x and y. At a node used twice, contributions add.

## Worked examples and variations

### Example A: multiply and add

**Input:** `L=(x+y)²` at `(2,1)`. **Mechanism:** `u=3`, local backward gives `dL/du=6`, then `dL/dx=dL/dy=6`. **Output:** both gradients are 6. **Inspect:** the shared addition sends the same upstream signal to both inputs. **Decision:** compare with direct expansion.

### Example B: reused parameter

**Input:** `L=w·x+w·y`. **Mechanism:** the same `w` has two paths; contributions are `x` and `y`, so `dL/dw=x+y`. **Output:** at `x=2,y=3`, gradient 5. **Inspect:** overwriting rather than accumulating gives 2 or 3. **Decision:** use additive accumulation for shared nodes.

### Boundary case: disconnected input

**Input:** `L=(x+1)²` with an unrelated parameter `w`. **Mechanism:** no graph path connects `w` to L. **Output:** `dL/dw=0` or an explicitly unused result. **Inspect:** absence of a path is different from a computed zero slope. **Decision:** check connectivity before debugging numerical values.

### Counterexample: stale forward cache

**Input:** update `x` after computing `u=x+y`, then reuse old `u` in backward. **Mechanism:** local derivative `2u` no longer matches the current forward pass. **Output:** an inconsistent gradient. **Inspect:** log a forward version or recompute check. **Decision:** invalidate caches after mutation.

## Two ways to see it

### Builder view

Represent each node as `(value, parents, local backward rule, version)`. A topological order gives a deterministic forward and reverse traversal.

### Systems or numerical view

Graph engines trade memory for speed by caching intermediates. In-place mutation, control flow, and stateful operations complicate that trade-off; an apparently correct scalar can come from a stale graph.

## Hands-on

Build a tiny graph engine supporting add, multiply, and square. Run forward, backward, and a finite-difference comparison.

**Failure state:** overwrite a shared-node gradient and mutate an input after forward. **Test:** the reused-parameter case must require summation, and a version check must reject stale caches. **Reset:** clear the graph, recompute forward values, and rerun.

## Checkpoint

- [ ] Draw the graph for `(x+y)²`.
- [ ] Explain why shared-node gradients add.
- [ ] Identify the derivative for an input with no path to the loss.
- [ ] State why cached values must match the current forward pass.

## What this does not solve

A correct graph can still encode a wrong loss or data contract. It also does not choose forward or reverse mode; that depends on input/output dimensions and resource constraints.

## Continue, go deeper, apply it

- Continue: Forward-mode automatic differentiation
- Go deeper: Reverse-mode autodiff and backpropagation
- Apply it: Gradient checking and debugging
