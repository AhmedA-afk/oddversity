---
title: "SharePoint, Drive, and document stores as a source of truth"
phase: data
module: enterprise-connectors
kind: lesson
summary: "The system the customer calls a source of truth is often a paperwork process. SharePoint and Drive are frequently the real source of truth, and treating them as an unglamorous connector rather than a filing cabinet is what makes a pipeline hold."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Explain why a document library is a data source with its own schema, not a folder you browse.
  - Pull a filtered set of files from a SharePoint or Drive library through its API, with pagination handled.
  - Name the four failure modes that make document-store pipelines break after you leave.
artifact: A script that lists and downloads a filtered set of files from a document library, logging what it found and what it skipped.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments"
---

Colin Jarvis, who runs OpenAI's Forward Deployed Engineering team, names the layer between raw data and business logic as the underrated place his teams spend substantial time, and he names two systems specifically: data warehouses and SharePoint. That second one surprises people who expect the interesting data to live in a database. In practice, a large share of the documents that decide an outcome — a signed contract, a pricing exception, a policy wording, a vendor's latest spec sheet — live in a document library that someone set up in 2019 and nobody has reorganised since.

You will meet three variants of the same problem: SharePoint (Microsoft 365), Google Drive/Workspace, and a bespoke on-prem document management system. This lesson treats SharePoint as the worked example, because it is the one you will meet most in enterprise accounts, and the patterns carry over.

## Why the folder view lies to you

Open a SharePoint library in the browser and you see folders and files, which invites you to think of it as a filesystem. It is not one. Under the folder view sits a list with columns, metadata, versions, content types, and permissions that do not follow the visible folder structure at all.

Three things the browser view hides:

- **Sensitivity labels and permission inheritance can break at any level.** A folder can look public while one file inside it was individually shared with a smaller group, or the reverse. You cannot infer access from the folder you can see; you have to query it.
- **"Final" is not a version number.** The pricing sheet is `Pricelist_FINAL_v3.xlsx`, sitting next to `Pricelist_FINAL_v3_reallyfinal.xlsx` uploaded by someone else three weeks later, both still in the library because nobody deletes anything. Real version history exists in the platform's metadata even when the filenames pretend otherwise; use it before trusting a filename.
- **Sync clients create duplicates that are not duplicates.** A user's OneDrive sync can leave a locally-edited copy that never made it back up, so the "same" file differs between the desktop and the library depending on when someone last had a network connection.

The rule that follows: treat the library as a queryable API with a schema, and pull through the API, not through a mapped drive or a manual export.

## Pulling files through Microsoft Graph

Microsoft Graph is the API surface for SharePoint and OneDrive. The pattern you need is: authenticate as an app (not a user, so the pipeline does not break when someone changes their password), list items in a drive with pagination, filter by what you actually want, and download.

```python
"""List and download files from a SharePoint document library via Microsoft Graph."""
import os
import requests

GRAPH = "https://graph.microsoft.com/v1.0"


def get_token(tenant_id, client_id, client_secret):
    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    resp = requests.post(url, data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://graph.microsoft.com/.default",
    }, timeout=30)
    resp.raise_for_status()
    return resp.json()["access_token"]


def list_files(token, site_id, drive_id, folder_path, wanted_ext=(".xlsx", ".csv", ".pdf")):
    """Yield file items under a folder, following @odata.nextLink pagination."""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{GRAPH}/sites/{site_id}/drives/{drive_id}/root:/{folder_path}:/children"
    while url:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        body = resp.json()
        for item in body.get("value", []):
            if "file" not in item:
                continue  # a subfolder, not a file
            if item["name"].lower().endswith(wanted_ext):
                yield item
        url = body.get("@odata.nextLink")


def download(token, download_url, dest_path):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(download_url, headers=headers, timeout=60)
    resp.raise_for_status()
    with open(dest_path, "wb") as fh:
        fh.write(resp.content)


if __name__ == "__main__":
    token = get_token(os.environ["TENANT_ID"], os.environ["CLIENT_ID"], os.environ["CLIENT_SECRET"])
    found = list(list_files(token, os.environ["SITE_ID"], os.environ["DRIVE_ID"], "Pricelists"))
    print(f"found {len(found)} matching files")
    for item in found:
        print(item["name"], item["lastModifiedDateTime"], item["size"])
```

Two details earn their place. The app registration uses client-credentials auth (an app identity, not a signed-in user), because a pipeline authenticated as a person breaks the day that person changes teams or resets a password. And the filter happens on the `name` and extension, not on a folder assumption, because the folder structure is the first thing a customer's admin reorganises without telling you.

Google Drive follows the same shape with the Drive API: a service account, `files.list` with a `q` filter, pagination via `nextPageToken`. The operational lessons below apply to both.

## What breaks a document-store pipeline after you leave

**Someone moves the folder.** A reorganisation is a routine act of office life, not an edge case. Query by a stable identifier (drive ID and item ID) where you can, and if you must resolve a human-readable path, resolve it fresh on every run rather than caching an item ID from week one.

**A file is checked out or locked.** SharePoint lets a user check out a file for editing; while checked out, some API calls see the last-saved version, some see nothing. Log which version you actually read (the `eTag` or version number), not just the filename.

**Permissions differ from the ones the pipeline's service account was granted.** The app identity you authenticate as needs its own access grant to the library, separate from any human's. This is usually a week-one blocker: raise it on day one, alongside the extraction blockers from the previous lesson, because provisioning an app registration and consenting its permissions often needs the customer's identity team, not the business owner who invited you.

**The library is the version of the truth, and the "real" system is a mirror someone forgot to keep in sync.** This is the one that costs the most time to discover. A customer will tell you their ERP is the master data source. Three weeks in, you find the actual pricing exceptions live in a spreadsheet on SharePoint that finance edits directly, and the ERP number is stale for anyone with a negotiated rate. Ask, explicitly and early, "if these two disagree, which one wins" — and write the answer down with a name attached, the same discipline as the transformation rules from the ETL lesson.

## What you can now do

You can treat a document library as a data source with a schema and an access model, not a folder to browse by hand, and you can pull a filtered, paginated set of files through its API with an identity that will still work after the person who invited you changes roles. That is the difference between a script that runs once in a demo and a connector the customer's own team can rely on.
