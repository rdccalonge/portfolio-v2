# Reni Calonge — Portfolio v2

Angular motion portfolio, GitHub-backed Pages CMS, and PDF/Word CV generation. **No custom API, database, or hosted backend.** The original portfolio is untouched.

## Preview locally

Requires Node 24 (24.15+), npm, and .NET 10 for CV generation.

```powershell
cd C:\Users\rdcca\source\repos\portfolio\portfolio-v2
npm ci
npm start
```

Open http://localhost:4200. `npm run build` creates the verified static site in `dist/public/browser` for `/portfolio-v2/`.

## Owner-only CMS access

The CMS is an owner editing tool, separate from the public portfolio. Visitors see your work and CV downloads; the portfolio has no CMS/admin link or editing form. Open [Pages CMS](https://app.pagescms.org) directly when you want to make updates.

Keep the GitHub repository owned by your personal account, authorize the Pages CMS GitHub App for this repository only, and do not grant other people repository write access or invite Pages CMS collaborators. Access is controlled by GitHub/CMS authentication and permissions; removing a public link is not an access control. Review these permissions in your accounts after setup.

This README is public documentation when the repository is public. It explains your maintenance workflow but grants nobody editing access. Never include passwords or tokens here. The README is not included in the deployed website.

See [Pages CMS collaborator permissions](https://pagescms.org/docs/configuration/collaborators/).

## Owner setup: connect the CMS and GitHub Pages once

1. Create a **separate public GitHub repository named portfolio-v2**. Copy this project's contents to its root, including `.pages.yml`, `.github/`, and `.gitignore`. Exclude `node_modules`, `dist`, `.angular`, `.local`, `bin`, and `obj`. The project is nested inside the old repository only for development; its CMS/workflow files become active at the new repository root.
2. Commit and push the implementation to `main` using your usual Git tools. Do not overwrite the old portfolio repository.
3. In the new repository: **Settings → Pages → Source → GitHub Actions**.
4. Visit [Pages CMS](https://app.pagescms.org), sign in with GitHub, and authorize its GitHub App for **portfolio-v2 only**. Open the repository. `.pages.yml` loads the forms.
5. Check **Build and deploy portfolio** under Actions. After success, visit `https://rdccalonge.github.io/portfolio-v2/`.

See the [CMS quick start](https://pagescms.org/docs/quick-start/) and [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Adding the config locally does not activate the account connection.

## Add a project using a form

1. In Pages CMS open **Portfolio content → Projects** and add an item.
2. Enter a unique **Project URL slug**, title, category, description, technologies, and at least one system layer.
3. Add the problem, your contribution, decisions, and verified outcomes. Blank sections are hidden. Upload approved screenshots and write accessibility descriptions.
4. Choose an accent; switch **Featured** on for priority placement. Keep the slug unchanged after publishing.
5. Switch **Published** on when ready, then **Save**. A GitHub commit triggers validation, CV generation, page generation, tests, and deployment. Watch Actions until completion. Failed builds leave the last deployment live; correct the fields and save again.

Reorder list items in the editor. Turn Published off to archive a project; its previous URL will stop resolving. When deleting a project, also remove its slug from CV settings.

**Unpublished is not private:** source JSON and uploaded images remain visible in a public GitHub repository. The site build excludes unpublished content and unselected media, but never store confidential details in CMS fields or Git history.

## Profile and CV forms

### Add a new layer

In Pages CMS, open **Layers** in the sidebar and add an entry. Set its **Layer name** (for example `Mobile`), short description, icon/emoji, and display order, then Save. Lower order numbers appear first. Open **Portfolio content** afterward: the new layer is available in **Projects → System layers** and **Skills → Layer**. Save your assignments to update the website and CV. Refresh the CMS if its selector still shows the previous list.

Layer names are identifiers. To rename one safely, create the replacement, update all project/skill assignments, then delete the old entry. Builds reject duplicate names or deleting a layer that is still referenced; the last successfully deployed site stays live.


- **Profile and photo** edits your photo and public contacts. The current photo is an optimized copy of the old portfolio's `images/pic01.jpg`.
- **Work experience / Education** adds entries. Leave unverified dates blank. Dates use `YYYY` or `YYYY-MM`; End also accepts `Present`.
- **Skills** populates the systems map. **CV export settings** selects/reorders sections and project slugs and sets a public CV summary.
- Featured projects appear first, preserving relative order. Downloads include a plain single-column PDF and editable DOCX. Photos are omitted from the CV.
- The C# console tool runs at build time only. No .NET runtime or API is deployed.

## Generate CVs locally

```powershell
dotnet build tools/CvExporter
dotnet run --project tools/CvExporter -- --install-browser
npm run export:public
npm run build
```

Generated files appear in `public/downloads/` and are ignored by Git. CI recreates them before deployment. Missing Chromium blocks the export rather than publishing a broken CV.

For private tailoring, create `.local/private-cv.json` with `content` set to the normalized document in `.local/public-content.json`, plus optional `privatePhone` and `privateAddress`. Change `content.cv` to tailor sections, project order, and summary.

```powershell
dotnet run --project tools/CvExporter -- --input .local/private-cv.json --output .local/exports
```

Keep private requests and exports in ignored `.local/` or outside the repository. They are never copied into the public build.

## Verification

```powershell
npm test
dotnet test tests/CvExporter.Tests
npm run build
npx playwright install chromium
npm run test:e2e
```

Static browser tests cover base-path routes, direct refresh, filters, portrait, motion controls, mobile overflow, and CV downloads. `node scripts/check-motion.mjs` also checks the running dev preview using local Chrome on Windows.

## Codex workflow

Read `docs/specification.md` and `AGENTS.md`. Use short feature specs and acceptance tests (lightweight SDD). Optional Angular documentation MCP:

```text
codex mcp add angular-cli -- npx --no-install ng mcp --read-only
```

Run that manually if desired; this project does not modify account configuration. No CMS plugin is required.
