# Portfolio v2 specification

Audience: interviewers evaluating Reni Calonge for full-stack roles. Show personality, technical range, actual work, and an easy-to-read CV.

## Personal motion
Lead with Reni's name and the reused optimized photo. Floating chips, rotating text, scrolling marquee, scroll reveals, pointer tilt, system signals, and 3D are decorative enhancements. Honor reduced motion and persist an explicit pause control. Prerendered content is readable without JavaScript.

## CMS and contract
Pages CMS is the form editor. Place .pages.yml at the root of the separate portfolio-v2 repository. Forms edit profile/photo, projects, skills, experience, education, and ordered CV selections in content/portfolio.json and public/media. No custom API or database. Original portfolio files remain untouched.
CMS editing is intended for the owner only. Do not show CMS links or forms on the public portfolio. Keep owner setup instructions in README; authentication and GitHub/CMS permissions enforce access. Do not invite collaborators or grant repository write access if editing should remain owner-only.
content/schema.json defines the shared contract. Normalize empty optional CMS fields and /media/ paths, validate slugs/links/IDs, generate TypeScript types, and create normalized C# export input. New projects default unpublished. Published entries only enter the site and public CV.
Layer definitions live in content/layers/*.json and have CMS-managed name, description, icon, and order. Project and skill fields reference that collection by name. The build joins definitions into the normalized public document; filter buttons/system cards are generated from it. Duplicate names (case-insensitive) and dangling assignments block builds. Existing string assignments and local export documents remain compatible.
Unpublished is a website visibility flag, not confidentiality: a public repository exposes all source data. Private CV requests belong in ignored .local/ or outside Git. Never fabricate employers, dates, or metrics.

## Publishing and exports
CMS Save makes a GitHub commit. Main pushes trigger Actions: validate/test, generate CVs, build/prerender, browser-test, deploy only dist/public/browser. Pull requests build without deploying. Failed builds leave the previous deployment live. Follow Actions to distinguish saved content from deployment completion.
The C# console exporter uses Playwright .NET PDF and Open XML SDK DOCX with shared ordered blocks. Public exports use published entries and selected sections/projects; private CLI exports cannot target public/. No .NET API runs in production.
Base path: /portfolio-v2/. Published slugs produce directly refreshable static pages. Only selected published media and whitelisted public CVs enter the artifact. Generated CVs are ignored by Git and recreated in CI.

## Acceptance
- Add/edit/reorder/archive projects and career entries through CMS forms without template edits.
- Invalid input, duplicate slugs, missing screenshots, and unknown CV IDs block builds.
- Unpublished entries/unselected media are absent from site/CV output.
- PDF/DOCX share selected text, order, links, and readable pagination.
- Search/filter, keyboard/touch, motion controls, reduced-motion, no-WebGL and mobile layouts work.
- Artifacts exclude CMS config, source JSON, credentials, C# sources, private exports and backend/admin code.
- Target mobile Lighthouse >=90 performance and >=95 accessibility; measure before claiming achieved.

## Prerequisites and provenance
The owner must create the separate repository, push this implementation, enable Pages from Actions, and authorize Pages CMS. Local config does not connect an account. Seed content comes from the old HTML/README; employment details await the CV. Existing project screenshots need confidentiality review before upload.
