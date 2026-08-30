---
title: "Classical AI: search, planning, and the shape of a decision"
track: "classical-ai"
status: live
summary: "Classical AI makes decisions by representing states, actions, goals, and costs, then searching for a path or plan."
duration: "3 min read"
---

## The short answer

Classical AI makes decisions by representing states, actions, goals, and costs, then searching for a path or plan. It is valuable because the assumptions are explicit: you can inspect the state space, constrain actions, and explain why a plan was chosen. Modern AI systems still use these ideas whenever they route, schedule, retrieve, plan, or decide among tools.

## Worked example: a delivery route

State: current location and undelivered packages. Action: drive to a connected location. Goal: all packages delivered. Cost: time or distance.

Breadth-first search finds the shallowest route when each step costs the same. Uniform-cost search handles different distances. A* adds a heuristic estimate of the remaining distance. A bad heuristic can make search slower or, if it overstates cost, change the guarantee you thought you had.

## A small story

An agent kept choosing a cheap-looking tool sequence that could not finish the job. The team blamed the model until they drew the state graph: the planner had no representation of “permission granted” or “result verified.” The missing state, not the wording, caused the loop.

## More examples and variations

- **Breadth-first:** finds the shallowest route when each step has equal cost.
- **Uniform-cost:** prefers the cheapest route when edges have different costs.
- **A\*:** uses a heuristic to search faster when the estimate is useful and appropriately bounded.
- **Counterexample:** a fast-looking heuristic can return a bad route if it overstates cost.

## Two ways to see it

### Algorithm view

Search is a procedure over an explicit graph with correctness and cost properties.

### Agent view

Planning is a contract about what states exist, which actions are allowed, and how completion is recognized.

## Hands-on

Implement BFS, uniform-cost, and A* on a small grid. Add a blocked cell and a misleading heuristic. Compare path length, nodes expanded, and whether the goal is reached.

## Checkpoint

- [ ] Define state, action, goal, and cost before writing the search.
- [ ] Explain what your heuristic assumes.
- [ ] Add a “not enough information” or unreachable-goal state.

## What this does not solve

Explicit planning struggles when the world is noisy, partially observed, or too large to model accurately. A language model can suggest actions, but the application still needs state and authorization checks.

## Continue, go deeper, apply it

- Continue: Problem framing and baselines
- Go deeper: Reasoning and decomposition
- Apply it: model an AI agent as a state machine before adding a framework.
