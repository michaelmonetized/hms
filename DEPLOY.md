# Deploy — hms

## Live status (2026-09-08 night)
- Vercel project **linked** to `michaelmonetized/hms` on team hustle-launch (`prj_afPjkvW2HBoF9gvlGjxnJG0nh0fE`).
- Initial production deploy failed: pnpm 11 `ERR_PNPM_IGNORED_BUILDS` for `@clerk/shared` / `esbuild` (see `pnpm-workspace.yaml` `allowBuilds`).
- Fix pushed: `allowBuilds` set true + `pnpm.onlyBuiltDependencies`. Live: **https://hms-cyan-six.vercel.app** (production alias; `hms.vercel.app` was unavailable). Team alias `hms-hustle-launch.vercel.app` may require Vercel auth.

## How to ship
1. Push to `main` (Git integration auto-deploys).
2. Or set `VERCEL_TOKEN` repo secret and run Blacksmith Ship if added later.
3. Env (Clerk/Convex) may still be required for full app functionality after static build succeeds.

## Blockers needing Michael
- Confirm Clerk + Convex production env vars in Vercel project settings if runtime auth/data is required.
- Custom domain (if any) — DNS out of scope.
