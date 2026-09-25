# saikyo-rivals-live

"Coming soon" holding page for [saikyo-rivals.com](https://saikyo-rivals.com), the marketing site for Saikyo Rivals (formerly Arena Gaming / Project Arena).

Static site, deployed via GitHub Pages. Built from `Saikyo_Rivals_Claude_Website_Design_Build_Specification_v2_Animations.docx` (Neo-Tokyo cyberpunk visual system: dark charcoal, white + red brand, restrained rain/neon-flicker ambience, `prefers-reduced-motion` respected).

## Files

- `index.html` — the coming-soon homepage (self-contained: inline CSS/JS, no images embedded as base64 anymore — see Features strip below)
- `about.html` — "How Saikyo Rivals Works" page, added 25 September 2026 (see dated section below). Same inline-CSS-per-file pattern as `index.html`, not a shared stylesheet.
- `contact.html` — "Get In Touch" page, added 25 September 2026 (see dated section below). Same inline-CSS-per-file pattern, no shared stylesheet.
- `hero-bg.jpg` — cropped hero background (from the approved concept art in the design spec)
- `CNAME` — custom domain for GitHub Pages
- `robots.txt`, `sitemap.xml` — basic SEO groundwork

## Features strip (Compete / Win / Rival / Become Saikyo)

This section is real HTML text + inline SVG icons (crossed swords, trophy, rival duo, torii gate), not an image. It was originally shipped as a flattened JPEG which turned out to have a hard resolution ceiling (an upscale artifact baked into the source), causing persistent blur no amount of re-sharpening could fix. Rebuilt as native markup on 7 September 2026 — permanently crisp at any resolution/zoom, and dropped the page size from ~220KB to ~27KB. Don't reintroduce this section as a flattened image.

## Notify-me form

**Has a real working backend as of 7 September 2026** — do not reintroduce the old `mailto:` placeholder. The form POSTs the entered email to a Google Apps Script web app (`NOTIFY_URL` in `index.html`'s inline script), which appends a Timestamp + Email row to the Google Sheet "Saikyo Rivals - Notify Me Signups" (https://docs.google.com/spreadsheets/d/1yrytE4vYg6yJV3MYPMlpbtm1kibYKbqXux5Ck7AtS7s). This was wired up separately from the Claude sessions that maintain this file (credit unclear — likely ChatGPT or manual setup) and confirmed working via live test rows already in the sheet.

`about.html`'s "Be First to Know" button links to `/#notifyForm` rather than duplicating this form/script — there's only one notify-me backend wired up, and it lives on the homepage. Don't build a second one on another page.

## Search visibility

Google Search Console is set up for `https://saikyo-rivals.com/` (verified via HTML meta tag in `index.html`'s `<head>` — don't remove the `google-site-verification` meta tag or verification is lost). Sitemap submitted and accepted, homepage confirmed indexed and served correctly over HTTPS as of 7 September 2026.

**Not done yet:** Search Console has not been set up for `arenagaming.live`. Lower priority now — as of 25 September 2026 that domain's repo (`Arena-gaming/arena-gaming-live`, separate from this one) serves a redirect straight to `saikyo-rivals.com/`, so it no longer needs its own indexing.

## Going live

1. GitHub Pages is enabled on this repo, custom domain set to `saikyo-rivals.com` (see `CNAME`).
2. At Namecheap, point the domain's DNS at GitHub Pages:
- Apex (`saikyo-rivals.com`): four `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `www`: `CNAME` → `arena-gaming.github.io`
3. Once DNS propagates, enable "Enforce HTTPS" in the repo's Pages settings (same as was done for arenagaming.live).

Confirmed live and working (DNS, HTTPS, notify-me backend, search indexing) as of 7 September 2026.

## 2026-09-16: Favicon added, Google re-indexing requested

The "Coming Soon" page had no favicon at all, which is why Google's search
result and browser tabs were showing a generic globe/placeholder icon.
This is now fixed.

What was added (root of this repo):
- `favicon.ico` - multi-size (16/32/48), classic uncompressed BMP-format
frames for maximum decoder compatibility. Verified to decode correctly
(confirmed via createImageBitmap pixel readback, not just file-header
parsing - an earlier PNG-compressed ICO build from Pillow reported correct
dimensions but failed to rasterize in some decode paths, so BMP frames
were used instead for safety).
- `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`
(180x180).

All generated from the approved red glowing 最 ("strongest") mark used
elsewhere in the brand system, cropped to a clean square.

`index.html`'s `<head>` now links all of these:
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

Also requested re-indexing of `https://saikyo-rivals.com/` via Search
Console's URL Inspection tool on 16 September 2026 (confirmed: "Indexing
requested - URL was added to a priority crawl queue") to speed up Google
picking up the new icon. The page was already confirmed indexed and served
over HTTPS beforehand. The search-result icon itself can still take days to
refresh even after the recrawl - this is expected, not a sign anything is
broken.

Conclusion: favicon task is complete. Don't redo this or regenerate a new
icon set unless the brand mark itself changes.

## 2026-09-25: About page added, nav wired up, site-wide footer + copyright notice added

First real second page on this site. Previously the nav bar (Home/About/Features/Games/Roadmap/Contact) was entirely placeholder `href="#"` links with no destinations — this starts filling that in.

**`about.html` — "How Saikyo Rivals Works"** (new file, root of repo):
- Same Neo-Tokyo visual system as `index.html` (dark charcoal/white/red, Orbitron headings, Noto Sans JP kanji accents, same topbar/nav/brand-mini markup and CSS values) but its own trimmed-down inline `<style>` block — it does **not** include the homepage's hero photo, rain canvas, neon-sign flicker, or manhole-steam CSS/JS, since there's no hero photo on this page. Don't copy those blocks over if extending this page; they're dead weight here.
- Sections: page header (kicker + title), "What Saikyo Rivals Is" prose, a 4-step "How It Works" grid (Register → Enter → Compete → Get Verified), a bordered "Verified Results, Always" doctrine callout, a "Launch Title" section on VALORANT (`id="launch"`, linked from the nav's Games item), and a CTA button back to the homepage's notify form.
- No page-specific JS beyond the footer year (see below) — intentionally static, no rain/neon effects to keep it lightweight.

**Nav hrefs fixed** (`index.html` and `about.html`, both `.nav-wrap` blocks): Home → `/`, About → `/about.html`, Features → `/#features`, Games → `/about.html#launch`. Contact was fixed later the same day to `/contact.html` — see the section below. **Roadmap is still an `href="#"` placeholder** — no page exists for it yet, left as-is intentionally rather than guessed at.

**Site-wide footer + copyright notice** (new `.site-footer`/`.footer-inner`/`.footer-brand`/`.footer-copy` CSS, added to both `index.html` and `about.html`): a thin bar under a `1px solid var(--line)` top border, brand wordmark left, `© <year> Saikyo Rivals. All rights reserved.` right. The year is set by a one-line inline script (`document.getElementById('year').textContent=new Date().getFullYear()`) so it never needs a manual yearly edit — don't hardcode a static year over this. Rights holder is written as "Saikyo Rivals" (no legal entity exists yet); update to the actual registered company name once Jamie/Carl incorporate.

Both files committed directly to `main` and confirmed live at `saikyo-rivals.com/` and `saikyo-rivals.com/about.html` post-deploy.

**Not done yet:** Roadmap page (nav link still inert — Contact was built later the same day, see below), and the Features strip section on the homepage isn't cross-linked from `about.html` (or vice versa) beyond the shared nav.

## 2026-09-25: Contact page added, sitemap.xml completed

Second new page today. `sitemap.xml` was also updated in this same pass to list `about.html` (missed in the entry above) and the new `contact.html`.

**`contact.html` — "Get In Touch"** (new file, root of repo):
- Same Neo-Tokyo visual system and trimmed inline `<style>` block as `about.html` (no hero photo, rain, or neon-flicker CSS/JS — same reasoning as before).
- Sections: page header (kicker + title), a short intro paragraph explaining there's no support desk yet, a two-card "channels" grid linking out to the real live X (`@saikyorivals`) and Instagram (`@saikyorivals`) accounts, a bordered callout noting a support inbox and Discord are coming later and warning against trusting other contact details claiming to be us, and a closing CTA back to the homepage's notify form.
- **Deliberately does not include an email address or contact form.** No real support/business email or form backend exists yet (Jamie hasn't supplied one — see `Docs/legal/LEGAL_REVIEW_PACK.md` in `Arena-Platform-` for that open item), so rather than inventing one, this page routes people to the two social accounts that are actually live and checked, plus the existing notify-me signup. Don't add a `mailto:` or a form here until a real inbox/backend exists — replace this note when that happens.
- Discord and YouTube icons in the topbar `.social` row are still `href="#"` placeholders (same as every other page) — not linked from this page's content either, for the same reason.

**Nav hrefs**: Contact → `/contact.html` in both `index.html` and `about.html`'s `.nav-wrap` blocks (was `href="#"`). Roadmap is now the only remaining placeholder nav link.

**`sitemap.xml`**: now lists all three live pages (`/`, `/about.html`, `/contact.html`).

Committed directly to `main` in one commit ("Add Contact page and wire up Contact nav link") alongside the updated `index.html`, `about.html`, and `sitemap.xml`. Confirmed live at `saikyo-rivals.com/contact.html` post-deploy.
