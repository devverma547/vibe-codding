# Oxlint Diagnostics Detailed Summary

Total warnings: 90
Total affected files: 25

### File: `src/components/layout/Navbar.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 22 | 36 | `eslint(no-unused-vars)` | Variable 'user' is declared but never used. Unused variables should start with a '_'. | 'user' is declared here | Consider removing this declaration. |

### File: `src/utils/validators.js` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 17 | 12 | `eslint(no-unused-vars)` | Catch parameter '_err' is caught but never used. | '_err' is declared here | Consider handling this error. |

### File: `src/pages/scanner/ScannerPage.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 11 | 8 | `eslint(no-unused-vars)` | Identifier 'Input' is imported but never used. | 'Input' is imported here | Consider removing this import. |

### File: `src/components/common/ErrorBoundary.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 3 | 10 | `eslint(no-unused-vars)` | Identifier 'Button' is imported but never used. | 'Button' is imported here | Consider removing this import. |

### File: `src/utils/generators.js` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 119 | 42 | `eslint(no-unused-vars)` | Parameter 'issues' is declared but never used. Unused parameters should start with a '_'. | 'issues' is declared here | Consider removing this parameter. |

### File: `src/contexts/ToastContext.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 50 | 14 | `react(only-export-components)` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |  |  |

### File: `src/contexts/ThemeContext.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 40 | 14 | `react(only-export-components)` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |  |  |

### File: `src/components/landing/TerminalTypingCard.jsx` (2 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 1 | 38 | `eslint(no-unused-vars)` | Identifier 'useRef' is imported but never used. | 'useRef' is imported here | Consider removing this import. |
| 31 | 19 | `react-hooks(exhaustive-deps)` | React Hook useEffect has missing dependencies: 'fullText.length', and 'fullText' |  | Either include it or remove the dependency array. |

### File: `src/contexts/AuthContext.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 183 | 14 | `react(only-export-components)` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |  |  |

### File: `src/pages/contact/ContactPage.jsx` (3 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 2 | 10 | `eslint(no-unused-vars)` | Identifier 'motion' is imported but never used. | 'motion' is imported here | Consider removing this import. |
| 3 | 64 | `eslint(no-unused-vars)` | Identifier 'MapPin' is imported but never used. | 'MapPin' is imported here | Consider removing this import. |
| 3 | 72 | `eslint(no-unused-vars)` | Identifier 'Phone' is imported but never used. | 'Phone' is imported here | Consider removing this import. |

### File: `src/pages/report/ReportPage.jsx` (7 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 2 | 21 | `eslint(no-unused-vars)` | Identifier 'Link' is imported but never used. | 'Link' is imported here | Consider removing this import. |
| 6 | 12 | `eslint(no-unused-vars)` | Identifier 'ChevronDown' is imported but never used. | 'ChevronDown' is imported here | Consider removing this import. |
| 6 | 25 | `eslint(no-unused-vars)` | Identifier 'ChevronUp' is imported but never used. | 'ChevronUp' is imported here | Consider removing this import. |
| 6 | 82 | `eslint(no-unused-vars)` | Identifier 'ExternalLink' is imported but never used. | 'ExternalLink' is imported here | Consider removing this import. |
| 14 | 10 | `eslint(no-unused-vars)` | Variable 'copiedCode' is declared but never used. Unused variables should start with a '_'. | 'copiedCode' is declared here | Consider removing this declaration. |
| 78 | 9 | `eslint(no-unused-vars)` | Variable 'handleCopyCode' is declared but never used. Unused variables should start with a '_'. | 'handleCopyCode' is declared here | Consider removing this declaration. |
| 44 | 25 | `react-hooks(exhaustive-deps)` | React Hook useEffect has a missing dependency: 'loadingSteps.length' | useEffect uses `loadingSteps.length` here | Either include it or remove the dependency array. |

### File: `src/components/landing/InteractiveDemoVideo.jsx` (5 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 2 | 18 | `eslint(no-unused-vars)` | Identifier 'AnimatePresence' is imported but never used. | 'AnimatePresence' is imported here | Consider removing this import. |
| 3 | 10 | `eslint(no-unused-vars)` | Identifier 'ShieldCheck' is imported but never used. | 'ShieldCheck' is imported here | Consider removing this import. |
| 3 | 33 | `eslint(no-unused-vars)` | Identifier 'CheckCircle' is imported but never used. | 'CheckCircle' is imported here | Consider removing this import. |
| 3 | 61 | `eslint(no-unused-vars)` | Identifier 'ArrowRight' is imported but never used. | 'ArrowRight' is imported here | Consider removing this import. |
| 3 | 79 | `eslint(no-unused-vars)` | Identifier 'RefreshCw' is imported but never used. | 'RefreshCw' is imported here | Consider removing this import. |

### File: `src/services/database.service.js` (2 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 121 | 14 | `eslint(no-unused-vars)` | Catch parameter 'err' is caught but never used. | 'err' is declared here | Consider handling this error. |
| 136 | 14 | `eslint(no-unused-vars)` | Catch parameter 'err' is caught but never used. | 'err' is declared here | Consider handling this error. |

### File: `src/pages/profile/ProfilePage.jsx` (2 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 2 | 74 | `eslint(no-unused-vars)` | Identifier 'Monitor' is imported but never used. | 'Monitor' is imported here | Consider removing this import. |
| 29 | 14 | `eslint(no-unused-vars)` | Catch parameter 'error' is caught but never used. | 'error' is declared here | Consider handling this error. |

### File: `src/pages/pricing/PricingPage.jsx` (5 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 1 | 17 | `eslint(no-unused-vars)` | Identifier 'useState' is imported but never used. | 'useState' is imported here | Consider removing this import. |
| 2 | 10 | `eslint(no-unused-vars)` | Identifier 'Link' is imported but never used. | 'Link' is imported here | Consider removing this import. |
| 3 | 10 | `eslint(no-unused-vars)` | Identifier 'motion' is imported but never used. | 'motion' is imported here | Consider removing this import. |
| 4 | 17 | `eslint(no-unused-vars)` | Identifier 'ShieldCheck' is imported but never used. | 'ShieldCheck' is imported here | Consider removing this import. |
| 4 | 47 | `eslint(no-unused-vars)` | Identifier 'HelpCircle' is imported but never used. | 'HelpCircle' is imported here | Consider removing this import. |

### File: `src/pages/auth/SignupPage.jsx` (10 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 4 | 18 | `eslint(no-unused-vars)` | Identifier 'Loader2' is imported but never used. | 'Loader2' is imported here | Consider removing this import. |
| 4 | 27 | `eslint(no-unused-vars)` | Identifier 'User' is imported but never used. | 'User' is imported here | Consider removing this import. |
| 4 | 33 | `eslint(no-unused-vars)` | Identifier 'Mail' is imported but never used. | 'Mail' is imported here | Consider removing this import. |
| 4 | 39 | `eslint(no-unused-vars)` | Identifier 'Lock' is imported but never used. | 'Lock' is imported here | Consider removing this import. |
| 9 | 8 | `eslint(no-unused-vars)` | Identifier 'Input' is imported but never used. | 'Input' is imported here | Consider removing this import. |
| 13 | 16 | `eslint(no-unused-vars)` | Variable 'setName' is declared but never used. Unused variables should start with a '_'. | 'setName' is declared here | Consider removing this declaration. |
| 14 | 17 | `eslint(no-unused-vars)` | Variable 'setEmail' is declared but never used. Unused variables should start with a '_'. | 'setEmail' is declared here | Consider removing this declaration. |
| 15 | 20 | `eslint(no-unused-vars)` | Variable 'setPassword' is declared but never used. Unused variables should start with a '_'. | 'setPassword' is declared here | Consider removing this declaration. |
| 16 | 27 | `eslint(no-unused-vars)` | Variable 'setConfirmPassword' is declared but never used. Unused variables should start with a '_'. | 'setConfirmPassword' is declared here | Consider removing this declaration. |
| 31 | 9 | `eslint(no-unused-vars)` | Variable 'handleSubmit' is declared but never used. Unused variables should start with a '_'. | 'handleSubmit' is declared here | Consider removing this declaration. |

### File: `src/components/ui/Card.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 9 | 3 | `eslint(no-unused-vars)` | Parameter 'variant' is declared but never used. Unused parameters should start with a '_'. | 'variant' is declared here | Consider removing this parameter. |

### File: `src/pages/landing/LandingPage.jsx` (13 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 1 | 27 | `eslint(no-unused-vars)` | Identifier 'useEffect' is imported but never used. | 'useEffect' is imported here | Consider removing this import. |
| 1 | 38 | `eslint(no-unused-vars)` | Identifier 'useRef' is imported but never used. | 'useRef' is imported here | Consider removing this import. |
| 6 | 3 | `eslint(no-unused-vars)` | Identifier 'ShieldCheck' is imported but never used. | 'ShieldCheck' is imported here | Consider removing this import. |
| 7 | 10 | `eslint(no-unused-vars)` | Identifier 'Globe' is imported but never used. | 'Globe' is imported here | Consider removing this import. |
| 7 | 51 | `eslint(no-unused-vars)` | Identifier 'Lock' is imported but never used. | 'Lock' is imported here | Consider removing this import. |
| 8 | 25 | `eslint(no-unused-vars)` | Identifier 'CheckSquare' is imported but never used. | 'CheckSquare' is imported here | Consider removing this import. |
| 8 | 38 | `eslint(no-unused-vars)` | Identifier 'Layers' is imported but never used. | 'Layers' is imported here | Consider removing this import. |
| 9 | 3 | `eslint(no-unused-vars)` | Identifier 'AlertTriangle' is imported but never used. | 'AlertTriangle' is imported here | Consider removing this import. |
| 9 | 27 | `eslint(no-unused-vars)` | Identifier 'Code2' is imported but never used. | 'Code2' is imported here | Consider removing this import. |
| 9 | 47 | `eslint(no-unused-vars)` | Identifier 'Check' is imported but never used. | 'Check' is imported here | Consider removing this import. |
| 9 | 68 | `eslint(no-unused-vars)` | Identifier 'HelpCircle' is imported but never used. | 'HelpCircle' is imported here | Consider removing this import. |
| 9 | 80 | `eslint(no-unused-vars)` | Identifier 'Terminal' is imported but never used. | 'Terminal' is imported here | Consider removing this import. |
| 20 | 9 | `eslint(no-unused-vars)` | Variable 'navigate' is declared but never used. Unused variables should start with a '_'. | 'navigate' is declared here | Consider removing this declaration. |

### File: `src/components/scanner/ScanModal.jsx` (3 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 3 | 18 | `eslint(no-unused-vars)` | Identifier 'AnimatePresence' is imported but never used. | 'AnimatePresence' is imported here | Consider removing this import. |
| 4 | 56 | `eslint(no-unused-vars)` | Identifier 'AlertTriangle' is imported but never used. | 'AlertTriangle' is imported here | Consider removing this import. |
| 36 | 63 | `react-hooks(exhaustive-deps)` | React Hook useEffect has missing dependencies: 'steps.length', and 'steps' |  | Either include it or remove the dependency array. |

### File: `src/pages/auth/LoginPage.jsx` (8 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 4 | 18 | `eslint(no-unused-vars)` | Identifier 'Loader2' is imported but never used. | 'Loader2' is imported here | Consider removing this import. |
| 4 | 27 | `eslint(no-unused-vars)` | Identifier 'Mail' is imported but never used. | 'Mail' is imported here | Consider removing this import. |
| 4 | 33 | `eslint(no-unused-vars)` | Identifier 'Lock' is imported but never used. | 'Lock' is imported here | Consider removing this import. |
| 8 | 8 | `eslint(no-unused-vars)` | Identifier 'Input' is imported but never used. | 'Input' is imported here | Consider removing this import. |
| 9 | 8 | `eslint(no-unused-vars)` | Identifier 'Button' is imported but never used. | 'Button' is imported here | Consider removing this import. |
| 12 | 17 | `eslint(no-unused-vars)` | Variable 'setEmail' is declared but never used. Unused variables should start with a '_'. | 'setEmail' is declared here | Consider removing this declaration. |
| 13 | 20 | `eslint(no-unused-vars)` | Variable 'setPassword' is declared but never used. Unused variables should start with a '_'. | 'setPassword' is declared here | Consider removing this declaration. |
| 29 | 9 | `eslint(no-unused-vars)` | Variable 'handleSubmit' is declared but never used. Unused variables should start with a '_'. | 'handleSubmit' is declared here | Consider removing this declaration. |

### File: `src/pages/about/AboutPage.jsx` (4 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 2 | 10 | `eslint(no-unused-vars)` | Identifier 'Link' is imported but never used. | 'Link' is imported here | Consider removing this import. |
| 4 | 43 | `eslint(no-unused-vars)` | Identifier 'ShieldCheck' is imported but never used. | 'ShieldCheck' is imported here | Consider removing this import. |
| 4 | 56 | `eslint(no-unused-vars)` | Identifier 'Zap' is imported but never used. | 'Zap' is imported here | Consider removing this import. |
| 8 | 9 | `eslint(no-unused-vars)` | Variable 'navigate' is declared but never used. Unused variables should start with a '_'. | 'navigate' is declared here | Consider removing this declaration. |

### File: `src/components/layout/Sidebar.jsx` (4 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 1 | 10 | `eslint(no-unused-vars)` | Identifier 'useState' is imported but never used. | 'useState' is imported here | Consider removing this import. |
| 9 | 3 | `eslint(no-unused-vars)` | Identifier 'Settings' is imported but never used. | 'Settings' is imported here | Consider removing this import. |
| 14 | 3 | `eslint(no-unused-vars)` | Identifier 'HelpCircle' is imported but never used. | 'HelpCircle' is imported here | Consider removing this import. |
| 23 | 11 | `eslint(no-unused-vars)` | Variable 'user' is declared but never used. Unused variables should start with a '_'. | 'user' is declared here | Consider removing this declaration. |

### File: `src/pages/history/HistoryPage.jsx` (2 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 3 | 18 | `eslint(no-unused-vars)` | Identifier 'Filter' is imported but never used. | 'Filter' is imported here | Consider removing this import. |
| 10 | 8 | `eslint(no-unused-vars)` | Identifier 'Input' is imported but never used. | 'Input' is imported here | Consider removing this import. |

### File: `src/pages/dashboard/DashboardPage.jsx` (10 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 2 | 10 | `eslint(no-unused-vars)` | Identifier 'Link' is imported but never used. | 'Link' is imported here | Consider removing this import. |
| 3 | 10 | `eslint(no-unused-vars)` | Identifier 'motion' is imported but never used. | 'motion' is imported here | Consider removing this import. |
| 5 | 15 | `eslint(no-unused-vars)` | Identifier 'ExternalLink' is imported but never used. | 'ExternalLink' is imported here | Consider removing this import. |
| 5 | 43 | `eslint(no-unused-vars)` | Identifier 'ArrowDownRight' is imported but never used. | 'ArrowDownRight' is imported here | Consider removing this import. |
| 6 | 3 | `eslint(no-unused-vars)` | Identifier 'Search' is imported but never used. | 'Search' is imported here | Consider removing this import. |
| 6 | 11 | `eslint(no-unused-vars)` | Identifier 'ShieldCheck' is imported but never used. | 'ShieldCheck' is imported here | Consider removing this import. |
| 6 | 24 | `eslint(no-unused-vars)` | Identifier 'Zap' is imported but never used. | 'Zap' is imported here | Consider removing this import. |
| 6 | 29 | `eslint(no-unused-vars)` | Identifier 'AlertTriangle' is imported but never used. | 'AlertTriangle' is imported here | Consider removing this import. |
| 6 | 44 | `eslint(no-unused-vars)` | Identifier 'Activity' is imported but never used. | 'Activity' is imported here | Consider removing this import. |
| 6 | 54 | `eslint(no-unused-vars)` | Identifier 'Globe' is imported but never used. | 'Globe' is imported here | Consider removing this import. |

### File: `src/pages/auth/VerifyEmailPage.jsx` (1 warnings)

| Line | Column | Rule | Description / Message | Label / Context | Help / Proposed Cleanup |
|---|---|---|---|---|---|
| 90 | 14 | `eslint(no-unused-vars)` | Catch parameter 'error' is caught but never used. | 'error' is declared here | Consider handling this error. |

