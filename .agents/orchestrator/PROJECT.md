# Project: SiteProof Web App Refactoring

## Architecture
SiteProof web application built with React, Vite, React Router, and Tailwind / Supabase AuthContext.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Resolve Lint Warnings | Clean up unused imports and unused variables across codebase so `npm run lint` passes with 0 warnings. | none | DONE |
| 2 | M2: Code Splitting in App.jsx | Implement React.lazy and Suspense for page components in `App.jsx` to reduce chunk size below 500kB during `npm run build`. | none | DONE |
| 3 | M3: AuthContext Navigation Fix | Refactor `AuthContext.jsx` to eliminate `window.location.href = '/dashboard'` and use React Router navigation without full reloads. | M1, M2 | DONE |

## Interface Contracts
- `AuthContext.jsx`: Provides auth state and login handlers without window.location side effects.
- `App.jsx`: Main routing component wrapping lazy-loaded page components inside `<Suspense fallback={...}>`.

## Code Layout
- Root: `c:\Users\Lenovo\Documents\vibe codding`
- Components & Pages: `src/`
- Navigation / Routing: `src/App.jsx`
- Auth: `src/context/AuthContext.jsx` (or similar path under `src/`)
