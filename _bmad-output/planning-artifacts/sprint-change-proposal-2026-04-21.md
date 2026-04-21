# Sprint Change Proposal — Activate Lighthouse CI Gate & Local Performance Script

**Date:** 2026-04-21
**Triggered by:** Planning gap review — NFR8 documented but never broken into an implementable story
**Scope classification:** Minor — Direct Adjustment
**Approved edits:** 3

---

## Section 1: Issue Summary

NFR8 specifies "Lighthouse Performance score ≥90, maintained as CI quality gate." The PRD, architecture, and epics all reference Lighthouse as one of the 8 CI pipeline gates. Story 1.1 created a commented-out placeholder in `.github/workflows/ci.yml`, but no story was ever created to:

1. Replace the placeholder with a real Lighthouse CI job
2. Provide a local `pnpm lighthouse` script for developer use during development

The gap was discovered during project review after Epic 2 neared completion — all other CI gates (lint, typecheck, unit test, build, schema drift, integration tests, E2E, accessibility) have been activated, but Lighthouse and Docker build remain as placeholders.

---

## Section 2: Impact Analysis

**Epic impact:** Epic 2 only — one new story added (Story 2.12). No other epics affected.

**Story impact:** No existing stories modified. New Story 2.12 is additive and has no dependencies on unfinished work (the SPA is built and servable).

**Artifact conflicts:** None. All planning artifacts (PRD, Architecture) already describe Lighthouse as a CI gate. The architecture's Development Workflow section needs a one-line addition to document the new local script.

**Technical impact:** Low. The CI placeholder already exists. Implementation involves installing `@lhci/cli`, configuring a performance budget, and wiring up the CI job and root script.

---

## Section 3: Recommended Approach

**Selected path:** Direct Adjustment — add Story 2.12 to Epic 2.

**Rationale:**
- The NFR exists, the architecture documents it, and the CI placeholder exists
- This is purely additive — no rollback, no scope change, no MVP impact
- Completes the planned quality gate infrastructure that all other gates already have

**Effort estimate:** Low
**Risk level:** Low
**Timeline impact:** None — fits naturally as the last story in Epic 2

---

## Section 4: Detailed Change Proposals

### 4.1 Epics — Add Story 2.12

**Target:** `_bmad-output/planning-artifacts/epics.md`
**Action:** Append after Story 2.11

```markdown
### Story 2.12: Lighthouse CI Gate & Local Performance Script

As a developer,
I want Lighthouse performance analysis running as a CI quality gate and available as a local development script,
So that performance regressions are caught before merge and I can profile performance during development.

**Acceptance Criteria:**

**Given** the web app is built
**When** I run `pnpm lighthouse` from the monorepo root
**Then** Lighthouse CI runs against the production build of apps/web served locally
**And** performance, accessibility, best-practices, and SEO categories are audited
**And** the results are printed to the console with category scores
**And** the command exits with non-zero status if Performance score < 90

**Given** a PR is opened against main
**When** the CI pipeline runs the Lighthouse job
**Then** Lighthouse CI audits the built SPA served via a local static server
**And** the job fails (blocks merge) if Performance score < 90 (NFR8)
**And** Lighthouse HTML report is uploaded as a CI artifact on failure

**Given** a developer wants to inspect performance locally
**When** they run `pnpm lighthouse` in the monorepo root
**Then** the script builds the web app (if not already built), serves it, runs Lighthouse, and tears down the server
**And** results are available in the console for quick iteration

**Note:** This story activates the commented-out Lighthouse placeholder in ci.yml from Story 1.1. The @lhci/cli package (Lighthouse CI) is the recommended tooling. Performance budget configuration should be co-located with the web app.
```

**Rationale:** Fulfills NFR8 which was specified in PRD and Architecture but never broken into a story.

### 4.2 Sprint Status — Add Story 2.12 entry

**Target:** `_bmad-output/implementation-artifacts/sprint-status.yaml`
**Action:** Add entry after `2-11-api-integration-tests`

```yaml
  2-12-lighthouse-ci-gate-and-local-performance-script: backlog
```

**Rationale:** Track the new story in sprint status alongside the rest of Epic 2.

### 4.3 Architecture — Document local Lighthouse script

**Target:** `_bmad-output/planning-artifacts/architecture.md`
**Action:** Add one line to Development Workflow > Local Development code block

```bash
pnpm lighthouse             # Build web app, serve, run Lighthouse CI audit (fails if Performance < 90)
```

**Rationale:** Document the local script alongside existing dev commands so developers discover it naturally. The CI gate is already documented in the architecture's CI pipeline table.

---

## Section 5: Implementation Handoff

**Change scope:** Minor — Direct implementation by Developer agent

**Handoff:** Developer agent (`bmad-dev-story` or `bmad-quick-dev`)

**Responsibilities:**
1. Apply the 3 artifact edits above (epics, sprint status, architecture)
2. Create the Story 2.12 story file via `bmad-create-story`
3. Implement via `bmad-dev-story`

**Success criteria:**
- `pnpm lighthouse` runs locally and reports Lighthouse scores
- CI pipeline has an active Lighthouse job that blocks merge on Performance < 90
- Lighthouse HTML report uploaded as CI artifact on failure
- All existing CI gates continue to pass
