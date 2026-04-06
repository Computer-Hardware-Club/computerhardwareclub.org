# Site Maintenance

## What to update most often

- Officer names and roles in `about/index.html`
- Meeting details and contact links in `index.html`
- Club photos in `images/club/`

## How deployment works

- Source files are committed in the repo root.
- `build.mjs` assembles the deployable site in `dist/`.
- GitHub Actions deploys `dist/` to GitHub Pages.
- `CNAME` keeps the custom domain pointed at `computerhardwareclub.org`.


## Adding content safely

- Reuse existing page sections before creating new layout patterns.
- Keep image filenames descriptive and lowercase when adding new assets.
- Prefer relative links so the site works both locally and on GitHub Pages.
- If a page should be public, make sure it is linked from the site.

## Common checks

```bash
npm run verify
```

Review the generated `dist/` output only when debugging the build. It is not source-of-truth content.
