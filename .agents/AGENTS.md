# Project-Scoped Rules

## Netlify Deployments
- When using MCP tools or any other method to manually deploy a web application in this project, ALWAYS deploy the compiled build folder (e.g., `dist` for Vite). NEVER deploy the root project directory, as this will result in the live server trying to serve raw uncompiled source files instead of the actual web application.
- Before deploying, always ensure the project has been fully built locally (e.g., by running `npm run build`) so that the `dist` folder is up to date.
- Always check that Netlify Continuous Deployment triggers have successfully fired when making a `git push`. If they do not fire, verify Netlify's branch settings before attempting to override with a manual deploy.

## Automatic Deployment and Source Control
- The user has no technical knowledge and prefers an automated experience. Whenever you make code changes that should be deployed or saved, you MUST automatically commit and push the changes to GitHub (`git add .`, `git commit -m "..."`, `git push`) WITHOUT asking the user for permission.
- If deployment to Netlify, Supabase, or other integrated services requires additional commands beyond pushing to the main branch, execute them automatically.
