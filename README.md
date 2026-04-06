# Computer Hardware Club Website

Static website for the Computer Hardware Club at Oregon State University. The source lives in this repository under the club GitHub organization and is deployed to [computerhardwareclub.org](https://computerhardwareclub.org) with GitHub Pages.

## What this repo is for

- Publish the public club website
- Keep club information, officer details, and contact links easy to update
- Give officers and contributors a documented, reviewable workflow for website changes

## Project structure

- `index.html` and `about/index.html`: site pages
- `styles/main.css`: site styling
- `scripts/site.js`: front-end behavior
- `images/`: site assets
- `404.html` and `500.html`: error pages
- `build.mjs`: creates the deployable `dist/` directory
- `tests/site-build.test.mjs`: regression check for the static site bundle
- `.github/`: collaboration and deployment workflow files
- `docs/site-maintenance.md`: maintenance notes for club contributors

## Local development

Prerequisite: Node.js 20 or newer.

```bash
npm test
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000` to preview the source site locally. `npm run build` generates `dist/`, which is the deployable GitHub Pages artifact.

## Deployment

GitHub Pages is configured to deploy from the Actions workflow in `.github/workflows/deploy-pages.yml`. The custom domain is set by `CNAME`.

The expected deployment flow is:

1. Open a branch from `main`.
2. Make the change and run `npm run verify`.
3. Open a pull request.
4. Merge after review.
5. GitHub Actions rebuilds the site and deploys `dist/` to Pages.

## Collaboration

Start with `CONTRIBUTING.md` for contribution expectations and `CODE_OF_CONDUCT.md` for community standards.

## Notes

- `dist/` is generated and should not be edited by hand.
- `node_modules/` is local-only and is not part of the repository.
- If the club wants a public open-source license, add one intentionally rather than guessing.
