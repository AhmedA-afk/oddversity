---
title: "RBAC, row-level security, and who sees what"
phase: data
module: identity-permissions-residency
kind: lesson
summary: "Once you know who a user is, the next question is what rows they may see. Here is how to map an identity provider's groups to application roles, enforce the boundary at the database rather than in application code, and prove it with a test that fails loudly."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Design a role mapping from IdP groups to application permissions, distinct from the customer's own org chart.
  - Implement row-level security in Postgres so a query cannot return a row the caller is not permitted to see, even if the application code has a bug.
  - Write a permission test that fails the build when a boundary is crossed, rather than trusting a code review to catch it.
artifact: A Postgres schema with row-level security policies and a passing test suite that proves two different users see two different result sets from the same query.
---

The previous lesson got you a verified identity and a set of claims — an email, a department, a group membership. This lesson is about the next question, which is the one that actually protects the customer: given who this user is, which rows of which tables are they allowed to see, and where does that rule live so it cannot be bypassed by a mistake three files away.

The concrete case that recurs across FDE accounts, in wealth management, insurance, and healthcare alike: an advisor, an adjuster, or a clinician should see only their own book of clients, claims, or patients, and a colleague's data must be invisible, not merely hidden by the UI.

## RBAC is a mapping you own, not the customer's org chart

Role-based access control means users have roles, and roles have permissions. The trap is assuming the customer's IdP groups already are your roles. They rarely are cleanly — an IdP group like `App-Advisors-APAC` mixes a function (advisor) with a region (APAC) for reasons that made sense to whoever set up the identity system, and a group like `Finance-L2-Approvers` encodes an approval level your application may not even have a concept of yet.

Build an explicit mapping layer instead of branching application logic on raw group names:

```python
# One place, one file, that translates the customer's IdP groups into
# roles your application actually understands. When the customer
# renames a group (and they will), this is the only file that changes.
IDP_GROUP_TO_ROLE = {
    "App-Advisors-APAC": "advisor",
    "App-Advisors-EMEA": "advisor",
    "App-Ops-Managers": "manager",
    "App-Compliance-Readonly": "compliance_viewer",
}

def resolve_roles(idp_groups: list[str]) -> set[str]:
    return {IDP_GROUP_TO_ROLE[g] for g in idp_groups if g in IDP_GROUP_TO_ROLE}
```

A user with no matching group resolves to an empty role set, which should mean no access, not a default role. The failure mode to design against from day one is a new hire showing up with a group your mapping does not recognise and silently getting full access because someone wrote the permission check as "if not restricted, allow" instead of "if not explicitly allowed, deny."

## Enforce the boundary in the database, not just in application code

Application-level filtering — adding `WHERE advisor_id = current_user_id` to every query in your codebase — works until someone adds a new query and forgets the clause, or until an admin tool, a reporting script, or an AI agent's generated SQL bypasses the application layer entirely. The failure is silent: the query runs, returns rows, and nothing errors, it just leaks.

Postgres row-level security (RLS) moves the boundary into the database itself, so a forgotten `WHERE` clause cannot leak data because the database enforces the filter regardless of what SQL was sent.

```sql
-- Enable RLS on the table. Once enabled, no row is visible to a normal
-- role until a policy explicitly grants it, even to a SELECT * with no
-- WHERE clause at all.
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- The application connects as a role that is NOT the table owner
-- (owners bypass RLS by default), and sets the current user's id
-- per-session via a Postgres session variable.
CREATE POLICY advisor_sees_own_book ON claims
    FOR SELECT
    USING (assigned_adjuster_id = current_setting('app.current_user_id')::int);

CREATE POLICY manager_sees_team ON claims
    FOR SELECT
    USING (
        assigned_adjuster_id IN (
            SELECT adjuster_id FROM team_membership
            WHERE manager_id = current_setting('app.current_user_id')::int
        )
    );
```

The application sets `app.current_user_id` once per request, right after authenticating the user, and every subsequent query in that session is automatically filtered:

```python
import psycopg2

def query_as_user(conn, user_id: int, sql: str, params=()):
    with conn.cursor() as cur:
        cur.execute("SET LOCAL app.current_user_id = %s", (str(user_id),))
        cur.execute(sql, params)          # RLS applies automatically from here
        return cur.fetchall()
```

`SET LOCAL` scopes the setting to the current transaction, which matters in a connection-pooled application: without it, a stale value from a previous request could leak into the next one that reuses the same pooled connection.

## Multiple policies stack as OR, and that is worth stating out loud

Postgres evaluates multiple permissive `SELECT` policies on the same table as an OR — a row is visible if any policy allows it. This is the right default for the advisor-and-manager case above (a manager sees their own assignments and their team's), but it is also where a badly written policy quietly grants more access than intended, because adding a new policy for one purpose can widen access for everyone rather than narrowing it further. When you add a policy, ask explicitly whether it should be permissive (widen access) or restrictive (narrow it, evaluated as AND) — Postgres supports both, and the default is permissive.

## Test the boundary, do not trust the review

A permission bug does not show up in a demo, because a demo is usually run by one user who is supposed to see everything they see. It shows up three weeks after handover, when a customer's own auditor logs in as two different advisors and compares results. Write the test that catches this before they do.

```python
def test_advisor_cannot_see_colleague_claims(db_conn):
    seed_claim(db_conn, claim_id=1, assigned_adjuster_id=100)
    seed_claim(db_conn, claim_id=2, assigned_adjuster_id=200)

    rows_as_100 = query_as_user(db_conn, user_id=100, sql="SELECT id FROM claims")
    assert [r[0] for r in rows_as_100] == [1]     # not 2, and not both

    rows_as_200 = query_as_user(db_conn, user_id=200, sql="SELECT id FROM claims")
    assert [r[0] for r in rows_as_200] == [2]
```

This test belongs in the same CI gate as everything else that blocks a merge, for the same reason the eval gate does in the AI phase of this path: a permission boundary that only the FDE remembers to check by hand is a boundary that erodes the first time someone else touches the codebase under deadline pressure.

## What you can now do

You can build an explicit, auditable mapping from a customer's identity groups to your application's roles, enforce a data-visibility boundary at the database layer so it cannot be bypassed by a forgotten `WHERE` clause or a tool that queries around your application code, and prove the boundary holds with a test that fails the build rather than a manual check that only you remember to run. The next lesson turns to a related but distinct question: not who sees what inside one deployment, but where the data is allowed to live and move at all.
