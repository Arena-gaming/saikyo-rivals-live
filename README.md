# saikyo-rivals-live

"Coming soon" holding page for [saikyo-rivals.com](https://saikyo-rivals.com), the marketing site for Saikyo Rivals (formerly Arena Gaming / Project Arena).

Static site, deployed via GitHub Pages. Built from `Saikyo_Rivals_Claude_Website_Design_Build_Specification_v2_Animations.docx` (Neo-Tokyo cyberpunk visual system: dark charcoal, white + red brand, restrained rain/neon-flicker ambience, `prefers-reduced-motion` respected).

## Files

- `index.html` — the page itself (self-contained: inline CSS/JS)
- `hero-bg.jpg` — cropped hero background (from the approved concept art in the design spec)
- `CNAME` — custom domain for GitHub Pages
- `robots.txt`, `sitemap.xml` — basic SEO groundwork

## Notify-me form

The email capture form has no backend yet — submitting it opens a pre-filled `mailto:` to arenagaminguk1@gmail.com with the entered address. This avoids needing new credentials/services to ship the page tonight. Swap in a real mailing-list backend (a Supabase table on the existing project, or a service like Mailchimp/ConvertKit) when ready.

## Going live

1. GitHub Pages is enabled on this repo, custom domain set to `saikyo-rivals.com` (see `CNAME`).
2. At Namecheap, point the domain's DNS at GitHub Pages:
   - Apex (`saikyo-rivals.com`): four `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www`: `CNAME` → `arena-gaming.github.io`
3. Once DNS propagates, enable "Enforce HTTPS" in the repo's Pages settings (same as was done for arenagaming.live).
