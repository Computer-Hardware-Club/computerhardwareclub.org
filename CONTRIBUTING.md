# Contributing

## Workflow

1. Create a branch from `main`.
2. Make the smallest reasonable change.
3. Run `npm run verify`.
4. Open a pull request with a clear summary, screenshots for visual changes, and any follow-up notes.
5. Merge only after review.

## Content updates

- Keep officer names, contact info, and meeting details current.
- Prefer replacing placeholder images/text with real club content when available.
- When changing copy, keep the tone practical and student-facing.
- Compress images before committing them when possible.

## Code and structure

- Do not commit `dist/` or `node_modules/`.
- Keep the site dependency-light and static unless there is a strong reason to add complexity.
- Reuse existing structure and styles before adding new patterns.
- If you add a new page, make sure it is reachable from navigation or footer links and included in the build if needed.

## Verification

Run these commands before opening a pull request:

```bash
npm test
npm run build
```

For visual changes, also preview the site locally and verify desktop/mobile layouts.

## Reviews

- Ask for review from another club maintainer when possible.
- Call out changes that affect club operations, officer information, or domain/deployment settings.

