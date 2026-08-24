---
name: siteproof-audit-and-deploy
description: "Standard workflow for auditing, testing, building, and deploying the SiteProof web application to Netlify and GitHub. Covers parallel audit orchestration, smart caching, and automated Netlify manual/API deployments."
---

# SiteProof Audit, Build & Deploy Skill

This skill documents the standard procedures for developing, optimizing, verifying, and deploying the **SiteProof** platform.

---

## 1. Audit Pipeline Architecture

SiteProof uses a **high-speed parallel architecture** to keep website audit times under 15–20 seconds:

1. **Active Scans (Live Fresh Audits)**:
   - When a user submits a URL or clicks "Re-scan", always execute with `{ forceRefresh: true }` so any new code deployments are immediately audited live.
2. **Concurrent Dispatch**:
   - At $t=0$, trigger `runLighthouseAnalysis(url, 'mobile')` (Google PageSpeed) and `fetchCodeAnalysis(githubRepo, url)` (GitHub Code Quality) **simultaneously**.
   - As soon as PageSpeed returns, pass results to `fetchPageSpeedAnalysis(lighthouseResults, url)`.
   - Merge both results via `mergeParallelReports()`.
3. **Smart Cache Layer (`urlCache`)**:
   - Store full audit reports with a 24-hour TTL in local/Supabase storage.
   - History page and direct report links (`/report/:reportId`) load instantly in under 0.1 seconds from cache.
4. **Clean UI Standards**:
   - Display the `NVIDIA AI` badge only when the NVIDIA AI service is active.
   - Never display confusing "fallback" banners or badges to users.

---

## 2. Testing & Verification

Before every deployment, verify the entire test suite and production build:

```powershell
# 1. Run all unit and integration tests (single-threaded for Windows stability)
npm test

# 2. Compile production bundle
npm run build
```

* Ensure all 10+ test suites (63+ tests) pass without regression.
* Verify the `dist/` directory is updated with compiled production assets.

---

## 3. GitHub & Netlify Deployment Workflow

Because Netlify is configured to deploy the compiled `dist/` folder:

### Step 1: Commit and Push Source Code
```powershell
git add .
git commit -m "feat/fix: <description>"
git push
```

### Step 2: Deploy Compiled `dist` via Netlify MCP
When deploying to the live Netlify site (`vibe-codding-site`):
1. **Always build first**: Run `npm run build`.
2. **Deploy the `dist` directory** using the Netlify MCP tool:
   - Tool: `netlify-deploy-services-updater`
   - Parameters:
     ```json
     {
       "selectSchema": {
         "operation": "deploy-site",
         "params": {
           "siteId": "b6cb327d-954f-472e-983a-36b17fe2da28",
           "deployDirectory": "c:\\Users\\Lenovo\\Documents\\vibe codding\\dist"
         }
       }
     }
     ```
3. **Check Deploy Status**:
   - Tool: `netlify-deploy-services-reader` -> `get-deploy-for-site` with `deployId`.
   - Poll until `state: "ready"`.

### Step 3: Cache Busting / User Verification
- Instruct the user to perform a hard refresh (`Ctrl + Shift + R` or `Ctrl + F5` on Windows) to view the latest live assets immediately.
