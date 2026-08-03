# Empirical Challenge & Stress-Test Report: Auth Flow & State Propagation

**Agent**: Challenger 2 (critic, specialist)  
**Date**: 2026-08-01  
**Project**: SiteProof (`c:\Users\Lenovo\Documents\vibe codding`)  

---

## Executive Summary

Empirical stress-testing of the Auth flow, React Router component integration, and state propagation was conducted using custom Vitest stress harnesses and static AST/search inspection.

- **Vitest Execution Status**: **PASSING** (2 test files, 17/17 tests passing cleanly).
- **`window.location.href` Inspection**: **CLEAN**. No `window.location.href = ...` navigation calls found in `src/`.
- **`window.location.reload()` Inspection**: **3 OCCURRENCES FOUND** in error recovery/boundary components (`ErrorBoundary.jsx`, `NetworkErrorPage.jsx`, `ServerErrorPage.jsx`).
- **State Propagation Edge Case Regressions Discovered**: 3 empirical findings identified.

---

## 1. Inspection of Core Auth Components

- `src/contexts/AuthContext.jsx`: Provides global `user`, `isAuthenticated`, `isLoading` state using React Context and Supabase `onAuthStateChange`.
- `src/pages/auth/LoginPage.jsx`: Uses `useAuth()`, `useNavigate()`, `useLocation()`. Properly redirects logged-in users via React Router `navigate()`. Initiates Google sign-in without hard reloads.
- `src/pages/auth/SignupPage.jsx`: Uses `useAuth()`, `useNavigate()`. Handles account creation & Google sign-in via React Router.
- `src/pages/auth/AuthCallback.jsx`: Parses URL search/hash parameters from OAuth redirect using standard `URLSearchParams` and navigates cleanly using React Router `navigate('/dashboard', { replace: true })` or `navigate('/login', { replace: true })`.

---

## 2. Empirical Verification of `window.location` Usage

A workspace-wide regex/string scan across `src/` yielded the following:

### `window.location.href`
- **Result**: `0` assignment calls (`window.location.href = ...`).
- **Note**: `window.location.origin` is safely read in `src/services/auth.service.js` (lines 7, 80, 122) to construct callback URLs (`new URL(path, window.location.origin).href`).

### `window.location.reload()`
- **Result**: **3 calls remaining in error handling components**:
  1. `src/components/common/ErrorBoundary.jsx:38`: `onClick={() => window.location.reload()}`
  2. `src/pages/errors/NetworkErrorPage.jsx:30`: `onClick={() => window.location.reload()}`
  3. `src/pages/errors/ServerErrorPage.jsx:31`: `onClick={() => window.location.reload()}`

---

## 3. Vitest Test Execution Results

Ran `npx vitest run` with existing and newly added AuthFlow stress harness tests (`src/pages/auth/AuthFlow.test.jsx`).

```text
 RUN  v4.1.10 C:/Users/Lenovo/Documents/vibe codding

 ✓ src/App.test.jsx (1 test) 137ms
 ✓ src/pages/auth/AuthFlow.test.jsx (16 tests) 568ms

 Test Files  2 passed (2)
      Tests  17 passed (17)
   Start at  10:57:50
   Duration  4.31s
```

All 17 tests passed cleanly.

---

## 4. Empirical Edge Case Findings & State Propagation Risks

### Finding 1: Global Component Tree Unmounting During Auth Actions (CRITICAL)
- **Location**: `src/contexts/AuthContext.jsx` (lines 60, 76, 92, 120, 134, 162-170)
- **Mechanism**: `AuthContext` calls `setIsLoading(true)` during `login()`, `signup()`, `logout()`, `googleSignIn()`, and `updateProfile()`.
- **Failure Mode**: `AuthProvider` evaluates `{isLoading ? <LoadingSpinner /> : children}`. Because `isLoading` becomes `true` during any of these async auth actions, the entire `children` element tree (including modals, forms, and page components) is unmounted while the async promise is pending. When the promise completes and `setIsLoading(false)` is called, `children` remounts from scratch.
- **Impact**: Any component local state (such as inline form validation errors, toast triggers, or error state in `AuthModal.jsx`) is destroyed upon unmount.
- **Recommendation**: Reserve `isLoading` in `AuthContext` exclusively for initial session hydration (`initializeAuth`). Action-specific loading states should be handled locally within components or tracked as separate context flags (e.g. `isAuthenticating`).

### Finding 2: Premature React Router Navigation in `AuthModal.jsx` (MEDIUM)
- **Location**: `src/components/auth/AuthModal.jsx` (lines 22-25)
- **Mechanism**: When `googleSignIn()` returns `{ success: true }`, `AuthModal` immediately executes `navigate('/dashboard')`.
- **Failure Mode**: At the instant `googleSignIn()` returns, the user has only initiated the OAuth flow; they are not yet authenticated (`isAuthenticated` is still `false`). When `navigate('/dashboard')` is called, `ProtectedRoute` intercepts the navigation and immediately redirects the user to `/login` or `/verify-email` right before the browser redirects to Google's OAuth consent page.
- **Impact**: Causes redundant router transitions and potential race conditions with Supabase's browser redirect.
- **Recommendation**: Align `AuthModal.jsx` with `LoginPage.jsx` and `SignupPage.jsx` — do not call `navigate('/dashboard')` on OAuth initiation; allow Supabase OAuth to handle the window redirect to Google.

### Finding 3: `ProtectedRoute` Blocking Unverified OAuth Users (LOW / UX RISK)
- **Location**: `src/components/auth/ProtectedRoute.jsx` (lines 27-29)
- **Mechanism**: `ProtectedRoute` checks `if (user && !user.email_confirmed_at) return <Navigate to="/verify-email" replace />;`.
- **Failure Mode**: Certain OAuth providers or mock/dev auth environments might not populate `email_confirmed_at` on the `user` object upon initial sign-in.
- **Impact**: OAuth users could get trapped in the `/verify-email` loop despite completing third-party OAuth authentication.
- **Recommendation**: Check provider identity (e.g. `user.app_metadata?.provider === 'google'`) before enforcing email verification redirects for OAuth users.
