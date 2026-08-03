# Plan: SiteProof Web App Refactoring

## Phase 1: Exploration
1. Dispatch 3 `teamwork_preview_explorer` subagents to investigate:
   - Explorer 1: Analyze lint warnings in the codebase (`npm run lint`), identify files with unused imports and unused variables.
   - Explorer 2: Analyze `App.jsx` and page imports for `React.lazy` and `Suspense` code splitting; analyze build output and chunk sizes (`npm run build`).
   - Explorer 3: Analyze `AuthContext.jsx` and auth flow navigation, identifying how `window.location.href` is used and how to refactor to React Router navigation.

## Phase 2: Execution & Iteration Loop
- Milestone 1: Dispatch `teamwork_preview_worker` to fix all lint warnings, verify with `teamwork_preview_reviewer` + `teamwork_preview_challenger` + `teamwork_preview_auditor`.
- Milestone 2: Dispatch `teamwork_preview_worker` to implement code splitting in `App.jsx`, verify chunk sizes with reviewers and auditors.
- Milestone 3: Dispatch `teamwork_preview_worker` to refactor `AuthContext.jsx` navigation, verify smooth router transition without reload.

## Phase 3: Final Integration & Verification
- Run full verification across all requirements (0 lint warnings, no chunk > 500kB, clean AuthContext navigation, Forensic Auditor audit pass).
- Submit victory claim to Sentinel.
