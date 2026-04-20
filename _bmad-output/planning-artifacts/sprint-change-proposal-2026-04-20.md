# Sprint Change Proposal — Add E2E Test Suite to Epic 2

**Date:** 2026-04-20
**Scope:** Minor
**Status:** Approved

## 1. Issue Summary

No E2E test stories exist in the sprint plan despite the infrastructure being scaffolded in Story 1.1 (Playwright workspace, CI pipeline placeholders). The architecture document defines `e2e/tests/*.spec.ts` files covering auth, capture, tasks, groups, and accessibility — but no story delivers them. The CI E2E and accessibility gates remain non-functional placeholders.

## 2. Impact Analysis

- **Epic 2:** Gains one new story (2-10-e2e-test-suite) at the end, after 2-9. No existing stories affected.
- **Epics 3 & 4:** Unaffected. May receive their own E2E stories in future.
- **PRD:** No conflict. NFR24 (axe-core in CI) is supported by this change.
- **Architecture:** No conflict. Implements what's already designed in the `e2e/` workspace.
- **UX:** No conflict.
- **CI/CD:** The placeholder E2E and accessibility gates become functional.

## 3. Recommended Approach

**Direct Adjustment** — add Story 2.10 to Epic 2 covering auth, capture loop, task completion, empty state, and accessibility E2E tests. Positioned after 2.9 so the full capture-to-complete loop is functional before tests are written.

- Effort: Low
- Risk: Low
- Timeline impact: One additional story at the end of Epic 2

## 4. Changes Applied

### Epics File
- **Added** Story 2.10: End-to-End Test Suite after Story 2.9 in `_bmad-output/planning-artifacts/epics.md`

### Sprint Status
- **Added** `2-10-e2e-test-suite: backlog` entry in `_bmad-output/implementation-artifacts/sprint-status.yaml`

## 5. Implementation Handoff

- **Scope:** Minor — Developer agent handles implementation
- **Next step:** Run `create-story 2.10` when ready to create the detailed story file, then `dev-story` for implementation
- **Success criteria:** Playwright E2E tests pass in CI, E2E and accessibility gates are no longer placeholders
