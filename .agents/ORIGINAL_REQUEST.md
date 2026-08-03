# Original User Request

## 2026-08-01T05:02:21Z

Refactoring and fixing linting warnings, build warnings, and auth edge cases for the SiteProof web app based on a full diagnostic audit.

Working directory: c:\Users\Lenovo\Documents\vibe codding
Integrity mode: development

## Requirements

### R1. Resolve Lint Warnings
Clean up the codebase by removing all unused imports and unused variables. The code should pass the `npm run lint` command without any warnings related to unused variables or unused imports.

### R2. Implement Route-Level Code Splitting
Implement React code splitting (`React.lazy` and `Suspense`) in `App.jsx` for all the main pages to resolve the Vite build warning regarding chunk size limits (>500kB).

### R3. Fix AuthContext Navigation Issue
Refactor `AuthContext.jsx` to eliminate the use of `window.location.href = '/dashboard'` inside the `onAuthStateChange` listener. Ensure that navigation after successful Google OAuth login uses React Router's navigation mechanisms or is handled appropriately without triggering a full page reload, while maintaining the correct application state.

## Acceptance Criteria

### Code Quality & Build
- [ ] Running `npm run lint` outputs 0 warnings.
- [ ] Running `npm run build` completes successfully and no individual chunk is larger than 500kB (or the warning is significantly mitigated).

### Auth Flow
- [ ] Google OAuth login redirects to the dashboard without causing a full page reload.
