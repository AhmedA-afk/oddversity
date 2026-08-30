# Launch runbook

Everything between the current build and a site that can hold a public presence.
Work top to bottom. Items marked **blocking** must be done before the domain is
pointed at anything.

---

## Already in place

These shipped with the production-readiness pass and need no further work.

| Area | What exists |
|---|---|
| **Discovery** | `sitemap-index.xml` with per-page `lastmod` derived from source file mtimes, priorities and change frequencies by page type |
| **Crawlers** | `robots.txt` allowing 16 named answer-engine and training crawlers explicitly |
| **Machine index** | `/llms.txt`, generated at build so it cannot drift from the site |
| **Feeds** | `/rss.xml` covering guides and articles in one stream |
| **Structured data** | One JSON-LD `@graph` per page: `WebSite`, `Organization`, `Person` (once configured), plus `Article` / `LearningResource` / `Course` (with `hasPart` syllabus) / `FAQPage` / `HowTo` / `ItemList` / `BreadcrumbList` |
| **Social cards** | 47 per-page cards — one per track, guide, article and section hub — with a generic fallback that engages automatically for anything not yet generated |
| **Icons** | `favicon.ico`, SVG favicon, apple-touch-icon, 192/512 PWA icons plus maskable variants |
| **Installability** | `site.webmanifest` with shortcuts, theme colours and categories |
| **Type** | Self-hosted woff2, latin subsets only, with metric-matched fallback faces so the swap causes no layout shift |
| **Third parties** | **Zero.** No font CDN, no tag manager, no embeds, no analytics by default |
| **Security headers** | `_headers`: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, plus cache policy per asset class |
| **Trust pages** | `/privacy` and `/terms`, both written to describe what the site actually does |
| **Contact** | `/.well-known/security.txt`, `humans.txt` |
| **Redirects** | `_redirects` with canonical-host rule (commented) and stable short paths |
| **Quality gates** | `npm run check:links` fails the build on any dead internal link |
| **Audits** | Lighthouse 100 / 100 / 100 / 100 — accessibility, best practices, SEO, agentic browsing — on mobile and desktop |

---

## 1. Fill in the config — **blocking**

Everything a human must supply lives in one file: **`src/data/site.ts`**. Nothing
here is guessed, and every empty field is simply omitted from the markup rather
than rendered blank.

- [ ] `author.name` — the byline. **This is the single highest-value field.**
      Authorship signals attach to a person, not a logo; with it set, every page
      emits `Person` schema and an `author` meta tag instead of falling back to
      the organisation.
- [ ] `author.sameAs` — profile URLs that corroborate the byline. Real ones only.
- [ ] `social.x` / `github` / `linkedin` / `mastodon` — drive `twitter:site` and
      the organisation's `sameAs`.
- [ ] `contact.email` — surfaced on `/privacy`; also used for `Organization.email`.
- [ ] `contact.security` — if omitted, `security.txt` points at `/about`.
- [ ] `repo.url` — enables "edit this page" links.
- [ ] Confirm `url` matches the domain you are actually launching on.

## 2. Domain and DNS — **blocking**

> **`oddversity.com` is a placeholder.** It was set across the codebase
> during the rename but has not been checked for availability or registered.
> Confirm it — or pick the actual domain — and change `url` in
> `src/data/site.ts`. Everything else (canonicals, schema `@id`s, the sitemap,
> the feed, `llms.txt`, `robots.txt`) derives from that one value.

- [ ] Confirm the domain is available, then register it.
- [ ] Decide apex vs `www` and **uncomment the canonical redirect** in
      `public/_redirects`. Serving both without a redirect splits every signal
      the site earns.
- [ ] TLS certificate issued and HTTPS enforced.
- [ ] Verify `Strict-Transport-Security` is being sent. Only add `preload` to
      that header once **every** subdomain is confirmed HTTPS-only — it is
      difficult to reverse.

## 3. Verify the headers actually land — **blocking**

`_headers` is a Cloudflare Pages / Netlify convention. Other hosts ignore it.

- [ ] `curl -sI https://oddversity.com | grep -i -E 'content-security|strict-transport|x-frame'`
- [ ] If the host ignores `_headers`, port the rules to its own mechanism before launch.
- [ ] If you later enable analytics, **add the vendor's domain to `script-src`
      and `connect-src`** in the CSP or the script will be blocked silently.

## 4. Register with search and answer engines

- [ ] Google Search Console — verify, submit `sitemap-index.xml`.
- [ ] Bing Webmaster Tools — verify, submit the sitemap. This also feeds several
      AI answer engines.
- [ ] Request indexing for the home page, `/learn`, `/guides` and `/reference`.
- [ ] Confirm `https://oddversity.com/llms.txt` resolves and reads correctly.

## 5. Check how it looks when shared

- [ ] Paste a track URL, a guide URL and an article URL into a social preview
      debugger. Each should show its **own** card, not the generic one.
- [ ] Confirm the favicon appears in a browser tab and in a bookmark list.
- [ ] Install to a phone home screen and confirm the maskable icon is not cropped badly.

## 6. Content pass before the door opens

- [ ] Re-run `npm run og` so newly added tracks, guides and posts have cards.
- [ ] `npm run illustrations` if any role page was added; review every image
      against `docs/visual-system.md` before shipping.
- [ ] `npm run prelaunch` — regenerates cards, builds, and fails on dead links.
- [ ] Spot-check that no lesson summary is truncated mid-sentence; they are the
      meta descriptions.
- [ ] Read `/privacy` against reality one more time. If analytics is on, the page
      must name the provider.

## 7. Decide on analytics — optional

Off by default, and `/privacy` currently says so in as many words. If you turn it
on, that page updates itself from the same config — but the CSP does not.

- [ ] Set `analytics.provider` and `analytics.id` in `src/data/site.ts`.
- [ ] Add the vendor domain to `script-src` and `connect-src` in `_headers`.
- [ ] Re-read `/privacy` and confirm it now describes what is actually collected.

## 8. After launch

- [ ] Watch Search Console coverage for the first fortnight; 1,100+ pages take
      time to index and errors surface early.
- [ ] Add a `lastVerified` habit for the fastest-moving pages — provider
      behaviour, pricing and security guidance age first.
- [ ] Re-run Lighthouse against the live origin. Local numbers exclude real
      network conditions and CDN behaviour.

---

## Regenerating assets

```bash
npm run fonts     # re-download webfonts + recompute fallback metrics
npm run icons     # favicon, apple-touch-icon, PWA icons
npm run og        # per-page social cards + the availability manifest
npm run assets    # all three

npm run prelaunch # og + build + link check, the gate before deploying
```

`npm run og` must be re-run after adding a track, guide or article. If it is
forgotten, those pages fall back to the generic card — degraded, never broken.
