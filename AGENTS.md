# Agent Instructions

This repository is the GitHub Profile README for Riyad Sarkar (github.com/riyadsarkar07).

## Source of Truth

- Edit public profile content in `profile.config.json`.
- Regenerate the README with `npm run generate`.
- Regenerate the contribution heatmap with `npm run generate:contributions`.
- Do not hand-edit generated sections of `README.md`; edit the config or generator instead.
- `assets/banner.svg`, `assets/banner-mobile.svg`, `assets/footer.svg`, and `assets/divider.svg` are hand-authored brand assets. Edit them directly when changing the visual identity.

## Identity and Privacy

- The profile belongs to Riyad Sarkar. Never introduce another person's name, biography, links, or assets.
- Only include links, projects, skills, and claims that are verifiable from the user's GitHub profile or public repositories.
- Do not invent metrics, certifications, employers, or contact details.
- Never commit credentials, private email addresses, or unpublished project information.

## Quality Checks

Run after changes:

```bash
npm run check
```

For visual changes, render the SVGs at desktop and mobile widths and inspect them in light and dark surroundings.

## GitHub Profile Constraints

- Keep the hero readable at GitHub's profile width.
- Preserve the `<picture>` sources for the responsive mobile banner.
- Include meaningful `alt` text on every image.
- Prefer local SVG assets over unreliable third-party widgets.
