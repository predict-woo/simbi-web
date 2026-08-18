# simbi-web

Landing page and documentation for [Simbi](https://github.com/predict-woo/simbi),
served at [getsimbi.app](https://getsimbi.app).

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build),
deployed as a static-assets Worker on Cloudflare.

## Layout

- `src/pages/index.astro`: landing page (`/`)
- `src/components/`, `src/lib/`, `src/styles/`: landing page building blocks
  (drafting-frame components, seeded rail generation, design tokens)
- `src/assets/`: app icon and screenshot used by the landing page
- `src/content/docs/docs/*.md`: documentation pages, served at `/docs/*`
- `astro.config.mjs`: Starlight config (title, sidebar, links)
- `wrangler.jsonc`: Cloudflare Workers deploy config

## Writing docs

Add a markdown file under `src/content/docs/docs/` with a `title` in its
frontmatter and it becomes a page at the matching `/docs/…` route. The sidebar
is generated automatically; use `sidebar.order` frontmatter to control
ordering.

## Commands

```bash
pnpm install      # install dependencies
pnpm dev          # dev server at localhost:4321
pnpm build        # static build to ./dist
pnpm deploy       # build and deploy to Cloudflare
```
