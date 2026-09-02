---
title: "Salesforce and CRM objects: the fields that are always wrong"
phase: data
module: enterprise-connectors
kind: lesson
summary: "A CRM is not a database of facts, it is a database of what salespeople were asked to type in. Here is the object model you need, the fields that lie by design, and a working pattern for pulling records through the API without hitting a limit."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Navigate the standard Salesforce object model (Account, Contact, Opportunity, and custom objects) without a data dictionary in hand.
  - Pull records through the REST and Bulk APIs correctly, respecting governor limits.
  - Name the three fields in any CRM export that are most likely to be wrong, and why.
artifact: A working query against a sandbox or mock CRM export that joins Account, Contact, and Opportunity into one clean table.
---

Every enterprise account has a CRM, and Salesforce is the one you will meet most often, alongside HubSpot, Dynamics, and Zoho. The object model differs in naming across vendors but not in shape, so this lesson uses Salesforce and the pattern carries.

The thing to internalise before writing any code: a CRM is filled in by people whose job is to sell, not to maintain a database. Every field you pull is either something the system computed, something a salesperson typed to satisfy a required-field rule, or something nobody has updated since the deal closed. Your job is to tell those three apart.

## The object model in five minutes

Standard objects, and what they actually mean in most orgs:

- **Account.** A company or organisation. In practice, often duplicated — three Accounts for the same customer because three salespeople each created one rather than searching first.
- **Contact.** A person, linked to an Account. Email is usually reliable. Title and department are usually stale, because nobody updates a Contact when someone gets promoted unless a deal depends on it.
- **Lead.** A person or company before they are qualified as a real prospect. Converts into an Account, Contact, and Opportunity, or it does not, and unconverted Leads accumulate for years.
- **Opportunity.** A deal in progress, with a **Stage** field (a picklist, customer-configured) and an **Amount**. This is the object most worth interrogating before you trust it.
- **Custom objects.** Anything the customer's admin built for their own process — a `Renewal__c`, a `Site_Visit__c`, a `Claim__c`. These carry the actual business logic of the account and are undocumented more often than not.

Every object also carries system fields worth knowing: `CreatedDate` and `LastModifiedDate` (both in UTC, which matters when a report is built against IST business days), `OwnerId` (who is accountable, which sharing rules key off), and `RecordTypeId` (the same object behaving as several different forms depending on which record type is set — a Salesforce pattern that trips up anyone assuming one object means one shape).

## The Stage field is the one to interrogate first

Every org's Opportunity **Stage** picklist looks standard — Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost — and every org's Stage means something slightly different in practice, because sales teams redefine stages informally faster than anyone updates the picklist's help text.

Ask, with a specific person's name attached to the answer: what does it take for a deal to move from Proposal to Negotiation? Two regional teams inside the same org will often give different answers, which means a report that treats Stage as a clean funnel is averaging two different processes. This is the same discipline as the transformation rules from the ETL lesson: write down who told you, and when.

Other fields that are reliably wrong in the specific way described:

- **Amount**, before a deal is late-stage. Early-stage Amounts are frequently a placeholder the rep entered to get past a required-field validation rule, not a forecast.
- **Close Date**, for the same reason: often a round number (end of quarter) rather than a real estimate.
- **Industry** and **Employee count** on Account, usually populated once by a data-enrichment tool at account creation and never refreshed.

## Pulling data through the API

Two APIs, two purposes. The REST API for small, targeted pulls and single-record operations; the Bulk API for anything over a few thousand rows, because REST pagination against a large object will burn your daily API call limit before you finish.

```python
"""Pull Opportunities via the Salesforce REST API (small volumes) with SOQL and pagination."""
import requests

def get_session(instance_url, access_token):
    return {"base": f"{instance_url}/services/data/v60.0",
            "headers": {"Authorization": f"Bearer {access_token}"}}

def query(session, soql):
    """Run a SOQL query and follow nextRecordsUrl until done."""
    url = f"{session['base']}/query?q={requests.utils.quote(soql)}"
    records = []
    while url:
        resp = requests.get(url, headers=session["headers"], timeout=30)
        resp.raise_for_status()
        body = resp.json()
        records.extend(body["records"])
        next_path = body.get("nextRecordsUrl")
        url = f"{session['base'].split('/services')[0]}{next_path}" if next_path else None
    return records

SOQL = """
SELECT Id, Name, StageName, Amount, CloseDate, Account.Name, Owner.Name
FROM Opportunity
WHERE LastModifiedDate = LAST_N_DAYS:7
"""

if __name__ == "__main__":
    session = get_session("https://yourinstance.my.salesforce.com", "TOKEN")
    rows = query(session, SOQL)
    print(f"pulled {len(rows)} opportunities")
```

Notice the query filters on `LastModifiedDate`, which is the CRM equivalent of the watermark pattern from the ETL lesson: pull what changed, not the whole object, once your initial load is done. And it dot-walks to `Account.Name` and `Owner.Name` in one query rather than joining client-side, which SOQL supports directly for a small number of relationship hops.

For anything larger — a full Account or Opportunity history export — use the Bulk API 2.0 instead: submit a job, poll for completion, download the result as CSV. It exists specifically because REST pagination against millions of rows will exhaust your org's daily API call allocation, which is shared across every integration the customer runs, not just yours.

## Governor limits are a design constraint, not an error to catch

Salesforce enforces limits per org, per day, and per transaction: total API calls in 24 hours, records per Bulk API batch, concurrent long-running queries. These are not a rate limit you retry past; they are a hard ceiling shared with every other integration in the org, including the customer's own nightly jobs. Ask, in week one, what else calls this API and how close to the ceiling the org already runs. A pipeline that trips the daily limit at 2 p.m. does not just fail its own run, it can break the customer's other integrations for the rest of the day, and that is the kind of incident that ends an engagement's goodwill.

## What you can now do

You can navigate a CRM's object model without a data dictionary, pull records efficiently through the right API for the volume, and name — before a customer's business owner does — which three fields in the export you were just handed are the ones worth double-checking before they go in a report.
