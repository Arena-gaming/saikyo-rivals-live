# saikyo-rivals-live

"Coming soon" holding page for [saikyo-rivals.com](https://saikyo-rivals.com), the marketing site for Saikyo Rivals (formerly Arena Gaming / Project Arena).

Static site, deployed via GitHub Pages. Built from `Saikyo_Rivals_Claude_Website_Design_Build_Specification_v2_Animations.docx` (Neo-Tokyo cyberpunk visual system: dark charcoal, white + red brand, restrained rain/neon-flicker ambience, `prefers-reduced-motion` respected).

## Files

- `index.html` — the page itself (self-contained: inline CSS/JS, no images embedded as base64 anymore — see Features strip below)
- `hero-bg.jpg` — cropped hero background (from the approved concept art in the design spec)
- `CNAME` — custom domain for GitHub Pages
- `robots.txt`, `sitemap.xml` — basic SEO groundwork

## Features strip (Compete / Win / Rival / Become Saikyo)

This section is real HTML text + inline SVG icons (crossed swords, trophy, rival duo, torii gate), not an image. It was originally shipped as a flattened JPEG which turned out to have a hard resolution ceiling (an upscale artifact baked into the source), causing persistent blur no amount of re-sharpening could fix. Rebuilt as native markup on 7 September 2026 — permanently crisp at any resolution/zoom, and dropped the page size from ~220KB to ~27KB. Don't reintroduce this section as a flattened image.

## Notify-me form

**Has a real working backend as of 7 September 2026** — do not reintroduce the old `mailto:` placeholder. The form POSTs the entered email to a Google Apps Script web app (`NOTIFY_URL` in `index.html`'s inline script), which appends a Timestamp + Email row to the Google Sheet "Saikyo Rivals - Notify Me Signups" (https://docs.google.com/spreadsheets/d/1yrytE4vYg6yJV3MYPMlpbtm1kibYKbqXux5Ck7AtS7s). This was wired up separately from the Claude sessions that maintain this file (credit unclear — likely ChatGPT or manual setup) and confirmed working via live test rows already in the sheet.

## Search visibility

Google Search Console is set up for `https://saikyo-rivals.com/` (verified via HTML meta tag in `index.html`'s `<head>` — don't remove the `google-site-verification` meta tag or verification is lost). Sitemap submitted and accepted, homepage confirmed indexed and served correctly over HTTPS as of 7 September 2026.

**Not done yet:** `arenagaming.live` (a separate repo/domain, `Arena-gaming/arena-gaming-live`) still serves its own old placeholder page and was never migrated to redirect to or mirror this site, despite that being the original plan once this page went live. Search Console has not been set up for that domain.

## Going live

1. GitHub Pages is enabled on this repo, custom domain set to `saikyo-rivals.com` (see `CNAME`).
2. At Namecheap, point the domain's DNS at GitHub Pages:
   - Apex (`saikyo-rivals.com`): four `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www`: `CNAME` → `arena-gaming.github.io`
3. Once DNS propagates, enable "Enforce HTTPS" in the repo's Pages settings (same as was done for arenagaming.live).

Confirmed live and working (DNS, HTTPS, notify-me backend, search indexing) as of 7 September 2026.
