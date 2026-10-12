# Portfolio working agreement

Use Angular, Pages CMS, and a C# console CV exporter; do not introduce React or a hosted/local API backend.
Read docs/specification.md before architecture changes. Never invent employers, dates, metrics, or achievements.
Deploy only approved content. Drafts, private CVs, local APIs, and the admin bundle must never be deployed.
Run npm run build, npm test, and dotnet test tests/CvExporter.Tests after relevant changes. The CMS uses .pages.yml at the standalone portfolio-v2 repository root.
Treat Three.js as progressive enhancement. Keep keyboard, touch, reduced motion, and no-WebGL experiences usable.
Use Angular documentation/MCP for framework guidance, aligned with pinned dependencies.
Never force-push. Do not deploy into the original portfolio repository. GitHub Actions generates CVs and deploys only dist/public/browser. CMS saves are Git commits; unpublished entries in a public repository are not confidential.
