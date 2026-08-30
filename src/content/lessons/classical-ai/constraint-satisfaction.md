---
title: "Solve constraint problems by making rules explicit"
track: "classical-ai"
status: live
summary: "A constraint satisfaction problem represents variables, possible values, and rules that relate them."
duration: "3 min read"
---

## The short answer

A constraint satisfaction problem represents variables, possible values, and rules that relate them. Search assigns values while detecting contradictions early. This makes the reasoning inspectable: when no solution exists, you can identify which constraints conflict instead of receiving an unexplained score.

## The model

Define variables such as `exam -> room`, domains such as available rooms, and
constraints such as “two exams cannot share a room at the same time.” Choose an
assignment order that exposes the most restricted variable first, then backtrack
when a partial assignment cannot be completed.

## Four examples

### Example A: timetable

Variables are classes, values are time-room pairs, and constraints prevent teacher
and room collisions. A valid schedule is not necessarily a good one; add a soft
preference for fewer gaps.

### Example B: configuration

Choose compatible package versions. A conflict such as “A requires B < 2” can be
reported directly, which is more useful than trying random combinations.

### Boundary case: no solution

If there are five classes and only four non-overlapping slots, return the
conflicting set or relax a named soft constraint. Do not silently violate a hard
rule.

### Counterexample: greedy first fit

Assigning the first available slot may leave the most constrained class with no
option. Search order is part of the design, not a cosmetic optimization.

## An illustrative story

A volunteer coordinator kept repairing a rota by hand. Once “must have first-aid
certification” and “cannot work two shifts in a row” became explicit constraints,
the hard cases became explainable and the remaining preferences could be
negotiated.

## Two ways to see it

### Algorithm view

Prune impossible partial assignments and use heuristics to find a solution sooner.

### Stakeholder view

Separate non-negotiable rules from preferences so people can see what must change
when the problem is infeasible.

## Hands-on

Model a three-day study plan with tasks, time slots, prerequisites, and a daily
hour limit. Implement backtracking, add one heuristic, and print the first
conflicting constraints when no plan exists.

## Checkpoint

- [ ] Variables, domains, and hard/soft constraints are distinct.
- [ ] An infeasible case produces an explanation.
- [ ] You can name one heuristic and its tradeoff.

## What this does not solve

Constraints are only as good as the assumptions encoded. They do not infer a
missing preference or resolve uncertainty about the world.

## Continue, go deeper, apply it

- Continue: Uncertainty and decision
- Go deeper: Search and planning
- Apply it: build a constraint-based scheduler with a “relax this preference” control.
