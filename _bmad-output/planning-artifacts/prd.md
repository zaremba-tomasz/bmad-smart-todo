---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
workflowStatus: complete
completedAt: 2026-04-13
inputDocuments:
  - product-brief-todo-app-bmad-training.md
  - research/domain-personal-task-management-nlp-research-2026-04-13.md
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: Web App (SPA/PWA)
  domain: Personal Productivity (AI-Native)
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Smart Todo

**Author:** Tomasz
**Date:** 2026-04-13

## Executive Summary

Smart Todo is a personal productivity web application that eliminates the friction between thinking of a task and capturing it. Users type tasks in natural language — "Call the dentist next Monday, it's important" — and an LLM extracts structured metadata (title, due date, location, priority, recurrence) into an editable form for one-click confirmation. The product targets people who currently **don't capture tasks at all** because the cognitive cost of opening an app, filling fields, and picking dates exceeds their willingness to bother. This is behavior change, not efficiency optimization.

The product operates on two reinforcing loops. The **capture loop** removes input friction through AI-powered extraction, making task entry nearly as fast as the thought itself. The **completion loop** drives retention through visible progress — completed tasks accumulate into a motivational surface that delivers the psychological reward of getting things done. Capture gets tasks in; completion satisfaction keeps users coming back.

This is a concept-validation MVP targeting 6 users (the creator + 5 friends), built to prove that LLM-powered structured extraction makes task capture meaningfully better. The tech stack uses OpenRouter for production LLM integration, Supabase for authentication and data persistence, and LM Studio for zero-cost local development.

### What Makes This Special

**Extraction-as-architecture, not extraction-as-feature.** Competitors like Todoist and TickTick parse dates from text as one capability among many. Smart Todo makes multi-field natural language extraction (time, place, priority, recurrence) the entire interaction model — not bolted on, but foundational.

**Trust-first AI.** Every extracted field is visible and editable before saving. In a market trending toward black-box AI automation, Smart Todo shows its work. The editable form is simultaneously the product UX, the trust mechanism, and the graceful degradation path when the LLM is unavailable.

**Completion as motivation.** The product doesn't just make capture easy — it makes finishing tasks satisfying. The growing list of completed tasks is a deliberate motivational surface, not an afterthought archive.

**Privacy trajectory.** The MVP validates extraction via cloud LLMs, but the strategic direction is fully local AI on device. As small language models mature, Smart Todo evolves toward a future where task data never leaves the user's device — a positioning that strengthens over time as privacy awareness grows and no competitor currently owns.

## Project Classification

| Dimension | Value |
|---|---|
| **Project Type** | Web App (SPA/PWA) |
| **Domain** | Personal Productivity (AI-Native) |
| **Complexity** | Medium |
| **Project Context** | Greenfield |

**Complexity rationale:** The interaction surface is small but load-bearing. LLM integration as the core UX (not a feature), graceful degradation between AI and manual paths, WCAG 2.1 AA accessibility on dynamic form transitions, and privacy-by-design for external API calls collectively place this beyond a standard CRUD application.

## Success Criteria

### User Success

- **Capture adoption:** 6 active users capturing tasks at least 4 days per week over 3 consecutive weeks
- **Capture volume growth:** Average tasks captured per user trends upward week-over-week during the first 3 weeks, indicating users are capturing tasks they previously wouldn't have recorded
- **Completion loop engagement:** Users active 2+ weeks show a growing ratio of completed-to-open tasks, with at least 10% week-over-week improvement in completion ratio after week 2
- **Capture friction:** Time from seeing extracted fields to saved task is under 5 seconds — the form review step should feel like confirmation, not data entry

### Business Success

- **Concept validation (quantitative):** At least 4 of 6 users meet the capture adoption threshold (4+ days/week for 3 consecutive weeks) without prompting or reminders
- **Concept validation (qualitative):** At least 3 of the 5 invited friends independently express preference for Smart Todo over their previous task management method (or lack thereof) in unprompted feedback or structured check-in
- **Behavior change signal:** At least 2 users report capturing tasks they would have previously kept in their head or forgotten entirely
- **Go/no-go decision:** After the 3-week validation period, the quantitative and qualitative signals together determine whether to invest in building beyond MVP

### Technical Success

- **LLM extraction latency:** Structured fields returned within 3 seconds (target for selected models). Hard degradation timeout at 5 seconds — if extraction hasn't returned, transition to manual form.
- **Extraction accuracy:** LLM correctly identifies time, place, and priority without manual correction in at least 80% of inputs. Recurrence extraction accuracy expected to be lower initially; the editable form serves as the safety net.
- **Graceful degradation:** When LLM is unavailable or exceeds 5s timeout, the manual form is presented without error states or broken UI — the fallback path must feel intentional, not broken.
- **Data persistence:** Tasks persisted in Supabase PostgreSQL, accessible across devices and browser sessions. No data loss on browser clear or device switch.

### Measurable Outcomes

| Metric | Target | Measurement Method |
|---|---|---|
| Weekly active capture days | ≥4 days/week per user | App usage telemetry |
| Capture volume trend | Upward week-over-week (weeks 1–3) | Per-user task creation count |
| Completion ratio growth | ≥10% WoW improvement after week 2 | Completed / open task ratio |
| Extraction accuracy | ≥80% no-correction saves | Saves without field edits / total saves |
| Extraction target latency | ≤3 seconds | API response timing (selected models) |
| Extraction degradation timeout | 5 seconds | Hard cutoff to manual form |
| Capture-to-save time | ≤5 seconds | Timestamp from extraction display to save |
| Qualitative preference | ≥3 of 5 friends prefer Smart Todo | Structured check-in at week 3 |

## Product Scope

### MVP - Minimum Viable Product

- Passwordless magic link authentication via Supabase Auth
- Quick capture via keyboard shortcut or persistent UI element with natural language input
- LLM-powered extraction of title, due date/time, location, priority, and recurrence into editable structured form
- One-click save after review/edit of extracted fields
- Manual structured form as graceful degradation when LLM is unavailable or 5s timeout reached
- Up to 3 user-created task groups for simple organization
- Task completion tracking with visible completed tasks list (motivational surface)
- Thumbs up/down extraction quality feedback mechanism
- Considered empty state with suggested rich example input (first-use revelation)
- Task persistence in Supabase PostgreSQL with row-level security (user isolation)
- Responsive web design (mobile + desktop)
- Containerized Node.js + Fastify backend proxy
- OpenRouter LLM integration (production) + LM Studio support (development)
- WCAG 2.1 AA accessibility from day one
- "Powered by AI" transparency indicator

### Growth Features (Post-MVP)

- Recurring tasks support
- Offline persistence (IndexedDB) + service worker + PWA installability
- Intelligent dynamic groups (e.g., "Today" view aggregating tasks by due date across groups)
- Overdue task visual distinction
- Task search and filtering
- Completion analytics (streaks, weekly summaries, productivity trends)
- Privacy policy and GDPR lawful basis formalization
- On-device small language model for local extraction (zero marginal cost, full privacy)
- Voice input as secondary capture modality

### Vision (Future)

- Fully local AI on mobile — task data never leaves the device
- Multi-modal capture (voice, image/OCR for receipts and notes)
- Context-aware extraction (calendar integration for temporal resolution)
- Proactive task suggestions and intelligent rescheduling
- Cross-platform native apps with seamless sync
- EU data routing via OpenRouter

## User Journeys

### Journey 1: Magda's Monday Mind Dump

**Persona:** Magda, 36, works full-time in marketing, two kids (4 and 7), trains for a half-marathon three mornings a week. Her partner shares the load but they both feel like they're running a logistics operation, not a family. She tried Todoist for a month but stopped using it because adding a task with the right date and priority took longer than just remembering it. Now she keeps a mental list that leaks — things fall through the cracks weekly.

**Opening Scene:** It's Monday morning, 7:15 AM. Magda just dropped the kids at school and is walking to her car. Her head is already spinning: *the electricity bill is overdue, she needs to book a dentist appointment for Olek, there's a parent-teacher meeting Thursday she hasn't confirmed, and she promised she'd bring snacks for Saturday's football practice.* She knows from experience that by the time she's at her desk, at least one of these will be forgotten.

**Rising Action:** She pulls out her phone, opens Smart Todo in the browser, and types into the capture bar: "Pay electricity bill today, urgent." In under two seconds, the form appears — title extracted, due date set to today, priority marked as urgent. She taps save without editing anything. Then: "Book dentist for Olek next week." Title extracted, due date set to next Monday, no priority. She bumps priority to medium and saves. "Parent-teacher meeting Thursday 5pm" — date and time extracted perfectly. "Buy snacks for Kuba's football Saturday" — date extracted, location blank. She doesn't bother adding a location. Four tasks captured in under 90 seconds. Her head is lighter already.

**Climax:** At her desk, she opens Smart Todo and sees all four tasks organized in her "Family" group. The electricity bill is flagged urgent at the top. She pays it immediately, marks it complete, and feels the small satisfaction of watching it move to the completed list. By end of day she's completed two of four. The completed list has five items from the weekend plus today's two — she's on a streak and it feels good.

**Resolution:** Three weeks in, Magda's "Family" group has 12 completed tasks visible. She's capturing things she never would have written down before — "Ask Ola about summer camp recommendations," "Check if Olek's shoes still fit." The friction is so low that the threshold for "worth capturing" has dropped. Her mental load is measurably lighter. She tells Tomasz: "It's like having a second brain that actually listens."

**Requirements revealed:** Quick capture input accessible immediately on load. Fast extraction (<3s) for short, natural sentences. Date/time extraction from relative expressions ("today," "next week," "Thursday 5pm"). Priority extraction from emotional language ("urgent"). Task groups for life domain separation. Completed tasks list as visible, motivational surface. Responsive design for mobile browser use. Cross-device access (phone capture, desktop review) via Supabase persistence.

### Journey 2: Magda's Bad Signal Day

**Persona:** Same Magda, but it's a Wednesday and she's in the car park under the office building where mobile signal is weak.

**Opening Scene:** Magda remembers she needs to cancel a subscription that renews Friday. She opens Smart Todo and types: "Cancel Netflix subscription before Friday." The capture bar shows a loading indicator — the LLM request is in flight but the signal is poor.

**Rising Action:** Three seconds pass. The loading indicator is still spinning. At the 5-second mark, the app transitions smoothly to the manual form — title field pre-populated with her raw text, all other fields empty and editable. No error message, no "something went wrong" banner. The form just appears, ready for input. Magda manually picks Friday as the due date, sets priority to high, and saves.

**Climax:** The task is saved to Supabase and appears in her list immediately. Later, when she's back at her desk with full connectivity, she captures another task — "Reply to Anna's email about the project timeline" — and extraction works normally. The experience is seamless; there's no jarring difference between the AI-assisted save and the manual save. Both tasks sit in her list identically.

**Resolution:** Magda doesn't think of the manual form as a "broken" experience. She barely notices the difference. The product kept its promise: extraction enhances, but never gates.

**Requirements revealed:** Graceful degradation with 5-second timeout. Pre-populated title field from raw input on fallback. No error states for LLM unavailability — the manual form IS the fallback, not an error page. Visual consistency between AI-extracted and manually-entered tasks. Note: full offline persistence (task creation without connectivity) is deferred to Phase 2.

### Journey 3: Daniel's Racing Thoughts

**Persona (theoretical):** Daniel, 29, software developer, diagnosed ADHD. His challenge isn't laziness or disorganization — it's that the gap between "I should do this" and "I've forgotten I should do this" is measured in seconds, not hours. Traditional todo apps require too many decisions at the moment of capture: *which project? what priority? when?* Each decision is a branch point where his attention can derail. He needs a tool where the path from thought to captured task has zero branches.

**Opening Scene:** Daniel is in a standup meeting and his manager mentions that the Q3 planning document needs review by Friday. Simultaneously, he remembers he hasn't paid his phone bill and his mum's birthday is next Tuesday. Three tasks, all hitting at once, none related to each other.

**Rising Action:** He opens Smart Todo in a browser tab (already pinned) and rapid-fires: "Review Q3 planning doc by Friday" — save. "Pay phone bill, high priority" — save. "Buy birthday present for mum, before next Tuesday" — save. Three tasks, three extractions, three saves. Total time: under 45 seconds. He didn't choose groups, didn't agonize over exact times, didn't open a calendar widget. The LLM handled the structure; he just dumped and moved on.

**Climax:** The critical moment isn't the capture — it's the *relief*. The three items are out of his head and into a trusted system. His working memory is freed. He can re-engage with the standup without the background anxiety of "I'm going to forget something."

**Resolution:** For Daniel, the completed tasks list serves a different function than for Magda. It's not primarily motivational — it's *proof*. Proof that his system works, that things don't fall through, that he can trust the external brain. Each completed task is evidence that the system held.

**Requirements revealed:** Pinnable browser tab with instant capture access. Minimal decision points at capture time — the extraction should handle as much as possible so the user makes zero choices beyond typing and confirming. Fast sequential captures (multiple tasks in rapid succession). The completed list as trust-building evidence, not just motivation.

### Journey 4: Tomasz at Day 15

**Persona:** Tomasz, the creator. Two weeks in, past the novelty phase. Smart Todo is part of his routine, not a new toy.

**Opening Scene:** Tuesday morning, 8:00 AM. Tomasz opens Smart Todo with his coffee. He sees his task list: three items from yesterday (one he meant to do but didn't — "Call the mechanic about winter tyres") and a new one he captured at 11 PM the night before when an idea struck: "Research flight prices to Kraków for Christmas." Note: recurring tasks and overdue visual distinction are Phase 2 features not present in the MVP.

**Rising Action:** He scans his list, makes a mental note about the mechanic task, and moves on. No morning planning ceremony, no "daily review" ritual — just a glance, a mental note, and on with the day.

**Climax:** At 2 PM he's in a meeting and someone mentions a report that needs updating. He opens the pinned tab, types "Update quarterly sales report by end of week" and saves in 5 seconds without losing the thread of the conversation. This is the habit loop in action — capture is so low-friction that it doesn't compete with whatever else he's doing. It's not a context switch; it's a micro-interruption.

**Resolution:** By end of week, Tomasz has 14 completed tasks visible. He notices the growing list and feels a quiet satisfaction — not the excitement of week one, but the deeper comfort of a system that works. He captures things he'd never have bothered with before: "Look up that podcast Marek mentioned," "Check if passport needs renewing." The capture threshold has permanently lowered.

**Requirements revealed:** Quick access via pinned browser tab. Completed task count visibility. Low-friction capture that works as a micro-interruption during other activities. Time-of-day agnostic — captures happen morning, afternoon, late night. Cross-device session persistence (captured on phone at night, visible on desktop in the morning).

### Journey Requirements Summary

| Capability | Journeys | Priority | MVP Status |
|---|---|---|---|
| Quick capture input (instant access, single text field) | All four | Critical | MVP |
| LLM extraction (date, time, priority, recurrence) | 1, 3, 4 | Critical | MVP |
| Graceful degradation (manual form on LLM timeout/failure) | 2 | Critical | MVP |
| Editable structured form (review before save) | 1, 2, 3 | Critical | MVP |
| Passwordless authentication (magic link) | All four | Critical | MVP |
| Task persistence (Supabase, cross-device) | 1, 4 | Critical | MVP |
| Task groups (up to 3, user-created) | 1, 4 | High | MVP |
| Completed tasks list (visible, motivational) | 1, 3, 4 | High | MVP |
| Responsive mobile browser design | 1 | High | MVP |
| Sequential rapid capture (multiple tasks in succession) | 3 | Medium | MVP |
| First-use empty state (guides toward first capture) | 1 | Medium | MVP |
| Recurring tasks (daily/weekly/monthly display) | 4 | High | Phase 2 |
| Offline persistence (IndexedDB, offline-capable) | 2 | High | Phase 2 |
| Overdue task visibility | 4 | Medium | Phase 2 |

## Domain-Specific Requirements

### AI & Privacy Constraints

- **Zero data retention:** LLM providers must not retain prompts or completions after processing. OpenRouter configured with no-training provider filtering from first deployment.
- **Data minimization:** Only raw task text is sent to the LLM API — never user account data, task history, group names, or metadata.
- **Stateless extraction:** Each LLM API call is independent. No conversation history, no user profiling, no cross-task context sent to the provider.
- **AI transparency:** The extraction UI inherently satisfies EU AI Act limited-risk transparency obligations — users see the AI's output and edit it before saving. An explicit "Powered by AI" indicator must be present in the extraction interface.
- **Privacy policy:** Required at launch. Must disclose: LLM processing of task text, provider identity (OpenRouter routing to multiple providers), zero-retention and no-training policies, data subject contact information, and local data retention periods.
- **GDPR lawful basis:** Deferred for MVP (6 known users). Will be addressed before any broader rollout.
- **EU data routing:** Deferred for MVP. OpenRouter's `eu.openrouter.ai` to be evaluated for growth phase.

### Accessibility Requirements

WCAG 2.1 Level AA compliance from day one — this is a hard requirement, not a growth-phase goal. See Non-Functional Requirements > Accessibility for full specification.

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| LLM provider changes data retention policy | OpenRouter provider filtering enforces no-training; model-agnostic architecture enables rapid provider switching |
| Task text contains sensitive PII (health, financial) | Zero retention + no-training filtering at provider level; PII scrubbing deferred but architecture must not preclude adding it later |
| Accessibility regression during development | WCAG 2.1 AA is acceptance criteria on every user-facing story; automated accessibility testing in CI |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Zero-Decision Capture (Primary Innovation)**
Smart Todo inverts the traditional task management interaction model. Where every existing competitor — even those with NLP features — still requires users to make decisions at capture time (pick a project, choose a label, select a filter), Smart Todo eliminates decision points entirely. The user types naturally, the LLM extracts structure, and the editable form presents the result for confirmation. The user's job shifts from "translate your thought into fields" to "verify the system understood you." This is an architectural commitment to extraction-as-the-core-interaction, not a feature bolted onto a form-based product.

Users don't experience this as "AI architecture" — they experience it as "the app stays out of my way." The innovation is invisible when it works and only noticeable when it's absent (graceful degradation to manual form). That invisibility is the success signal.

**2. Editable Extraction as Dual-Purpose UX**
The extraction review form serves two distinct functions that evolve with use. For new users, it builds trust — they see the AI's work and can verify it, establishing confidence through transparency. For returning users, it shifts to error prevention — a fast quality check that catches wrong dates or misread priorities before they become missed deadlines. The form is simultaneously the product UX, the trust mechanism, and the graceful degradation path — one component serving three purposes without requiring the user to think about any of them.

**3. Local AI Trajectory (Strategic Innovation)**
The MVP validates extraction via cloud LLMs (OpenRouter), but the product roadmap targets on-device small language models. For the MVP user group, this trajectory's value is **reliability and zero-latency extraction** — no bad signal days, no 3-second timeouts, no dependency on connectivity. At scale, it becomes a **privacy differentiator** — the only AI-powered task manager where data never leaves the device. The roadmap doesn't change; the framing shifts from privacy-first (growth narrative) to reliability-first (MVP narrative).

### Market Context & Competitive Landscape

The personal task management market has no product occupying the "high AI + low complexity" quadrant. Todoist leads in NLP with rule-based date parsing and recently added AI features (Ramble for voice, Assist for project breakdown), but these are additive features on a 15-year-old architecture. TickTick has explicitly avoided AI integration. Motion and Reclaim.ai are AI-first but focused on scheduling optimization, not capture. The zero-decision capture position is unoccupied.

The timing window is real but finite — estimated 12–18 months before incumbents close the gap. The MVP must validate the extraction loop before Todoist or others extend their AI features to multi-field extraction.

### Validation Approach

- **Primary validation:** The MVP itself. 6 users over 3 weeks, measuring extraction accuracy (≥80% no-correction saves), capture adoption (≥4 days/week), and behavior change (capture volume trending upward).
- **Extraction quality feedback:** A lightweight thumbs up/down mechanism on the extraction review form. Prominent during the 3-week validation period; designed to fade gracefully afterward (e.g., triggered only after field corrections rather than always-visible) to avoid becoming visual noise once extraction quality is established.
- **Model/prompt iteration:** Extraction quality feedback directly informs prompt refinement and model selection. OpenRouter's multi-model routing enables A/B testing across models without code changes.

### Innovation Risk Mitigation

| Innovation Risk | Fallback Strategy |
|---|---|
| Extraction accuracy below 80% threshold | Iterative: refine prompts, switch models via OpenRouter. The editable form absorbs imperfect extraction gracefully — a wrong extraction that's easily corrected is still faster than manual entry from scratch |
| Extraction latency exceeds 3s consistently | Route to faster/smaller models (GPT-4o mini, Claude Haiku, Gemini Flash). OpenRouter enables model switching without code changes |
| Users stop noticing the extraction (becomes invisible) | This is success, not failure. Measure by absence: correction rates, manual-form fallback frustration, and comparative feedback vs. previous tools |
| Privacy trajectory blocked by SLM immaturity | Cloud extraction via OpenRouter remains the production path. Local models are a growth-phase enhancement, not an MVP dependency. Frame local AI as reliability gain first, privacy gain second |

## Web App Specific Requirements

### Project-Type Overview

Smart Todo is a single-page application (SPA) designed for fast, repeated access throughout the day. The app's primary interaction — natural language capture with LLM extraction — requires minimal UI surface and no multi-page routing. The architecture prioritizes instant availability (fast load, ready-to-type immediately) over feature richness.

### Browser Support Matrix

| Browser | Platform | Support Level |
|---|---|---|
| Chrome (latest 2 versions) | Desktop, Android | Full support |
| Safari (latest 2 versions) | Desktop, iOS | Supported with documented PWA limitations |
| Firefox (latest 2 versions) | Desktop | Full support |
| Edge (latest 2 versions) | Desktop | Full support |

**Notes:**
- Safari on iOS is a required mobile target but has meaningful PWA limitations: aggressive service worker eviction (killed after days of non-use, resulting in full network fetch on next load), potential IndexedDB storage clearance under OS storage pressure, and no push notification support via PWA. These are documented known limitations relevant to Phase 2 (PWA installability), not bugs to fix.
- No IE11 or legacy browser support.
- Mobile Chrome and Safari are the two required mobile targets.

### Responsive Design

- **Mobile-first approach:** The capture input and task list must be fully usable on screens from 320px width upward.
- **Breakpoints:** Mobile (≤768px), Tablet (769–1024px), Desktop (≥1025px). The core capture-to-save flow must be identical across all breakpoints — no mobile-specific compromises on functionality.
- **Touch targets:** Minimum 44x44px for all interactive elements (per WCAG requirements).
- **Viewport:** The capture input should be visible immediately on load without scrolling on any breakpoint.

### Performance Targets

See Non-Functional Requirements > Performance for the authoritative performance specification. Key targets: FCP ≤1.5s, LCP ≤2.5s, TTI ≤3.0s, CLS ≤0.1, Lighthouse ≥90.

**JS bundle size:** The initial bundle target depends on the SPA framework choice — this is an architecture decision that directly drives the performance budget. Lightweight frameworks (Svelte ~4KB, Preact ~4KB) enable aggressive targets (~80KB gzipped). Heavier frameworks (React ~45KB, Vue ~34KB) consume half the budget before product code. The architecture phase should resolve framework selection with bundle size as a weighted criterion.

### First-Use Experience

The empty state must do more than say "Type a task above." To guarantee the first interaction demonstrates the extraction magic (first-use revelation), the empty state must include a **suggested rich example input** — e.g., "Try typing: *Call the dentist next Monday, high priority*" — so the user's first extraction shows multi-field parsing (title, date, priority) working together. If the user's first task is "Buy milk" (no extractable metadata), the product's core value is invisible.

### Technical Architecture Considerations

- **SPA framework:** Single-page application with client-side routing (if any routing needed — the MVP may be a single view with modal/overlay for capture). Framework selection is an architecture decision; see bundle size note above.
- **Backend proxy:** Containerized **Node.js + Fastify** application serving as the API proxy between the SPA client and OpenRouter. Responsibilities: secure API key storage, extraction request forwarding, timeout management, and basic rate limiting to control API costs. Hosting decision (cloud VM, container service, serverless) deferred to architecture phase — the containerized approach keeps options open.
- **Data persistence:** **Supabase** provides authentication (magic link), PostgreSQL database (task storage), and row-level security (user isolation). The SPA client uses the Supabase SDK for auth and direct database access. The Fastify proxy may verify Supabase auth tokens for extraction requests.
- **API integration:** Standard REST calls from client to backend proxy, proxy to OpenRouter. No WebSocket or real-time infrastructure needed. The 3s target / 5s degradation timeout must account for proxy overhead.
- **No SSR/SSG required:** No SEO concerns, no public content. Client-side rendering is sufficient.
- **No landing page:** The app IS the product for MVP. Marketing/landing page deferred.
- **Phase 2 infrastructure:** IndexedDB for offline storage, service workers for PWA installability, and Workbox for cache management are deferred to growth phase.

### Implementation Considerations

- **LM Studio compatibility:** Development environment uses LM Studio for local inference. The API integration layer must abstract the provider so switching between LM Studio (dev) and OpenRouter (production) requires only configuration changes, not code changes. The backend proxy handles this abstraction.
- **Environment configuration:** Provider URL, model selection, and API keys managed through environment variables in the backend proxy. No secrets in client-side code.
- **Testing:** Cross-browser testing across the support matrix. Safari iOS tested on real devices where available (simulators miss PWA-specific bugs). Known Safari limitations documented and communicated to iOS users in the test group. Lighthouse CI for performance regression detection.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — the minimum that proves the extraction loop changes user behavior, delivered within a usable-enough experience that 6 test users stick with it for 3 weeks.

**Scoping principle:** The extraction loop is the hypothesis. Everything in the MVP exists either to test that hypothesis directly or to prevent non-extraction friction from contaminating the signal.

**Resource Requirements:** Solo developer (the creator), estimated 3-5 weeks build time.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (Magda's Monday Mind Dump) — fully supported
- Journey 2 (Magda's Bad Signal Day) — graceful degradation supported (manual form on timeout); full offline persistence deferred
- Journey 3 (Daniel's Racing Thoughts) — fully supported
- Journey 4 (Tomasz at Day 15) — supported except recurring tasks and overdue visibility (re-create tasks manually during validation)

**Must-Have Capabilities:**

| Capability | Rationale |
|---|---|
| Passwordless magic link authentication (Supabase Auth) | User identity for task persistence and cross-device access |
| Task persistence (Supabase PostgreSQL + RLS) | Cross-device access, data durability, user isolation |
| Quick capture input (natural language text field) | The product IS this input |
| LLM extraction (title, date/time, location, priority, recurrence) | Core hypothesis |
| Editable structured form (review/edit before save) | Trust mechanism + degradation path |
| Graceful degradation (manual form on 5s timeout or error) | "Extraction enhances, never gates" promise |
| One-click save | Frictionless completion of capture loop |
| Task list with group filtering | Prevents flat-list cognitive overload that kills retention |
| Up to 3 user-created task groups | Minimum organization for multi-domain life (Work, Family, Personal) |
| Mark task as complete | Completion loop — the retention driver |
| Completed tasks view | Motivational surface — dopamine from visible progress |
| Thumbs up/down extraction feedback | Validation data collection during 3-week test |
| First-use empty state with suggested rich example | Guarantees first extraction demonstrates value |
| Containerized Node.js + Fastify backend proxy | Production-grade infrastructure: API key management, request forwarding, timeout handling, rate limiting |
| Responsive design (mobile + desktop) | Magda captures on phone, Daniel on desktop |
| WCAG 2.1 AA accessibility | Hard requirement from day one |
| "Powered by AI" transparency indicator | EU AI Act compliance |

**Explicitly Deferred from MVP:**

| Feature | Reason for deferral | Phase |
|---|---|---|
| Recurring tasks | Users can re-create weekly tasks manually for 3-week validation. Annoying but not hypothesis-breaking | Phase 2 |
| Offline persistence (IndexedDB + service worker) | MVP runs online-only. Graceful degradation handles timeout/error cases. Full local-first architecture is growth infrastructure | Phase 2 |
| PWA installability | Depends on service worker; deferred with offline | Phase 2 |
| Overdue task visual distinction | Nice-to-have; users can see due dates in the list | Phase 2 |
| Task search and filtering | 3-week validation with 6 users won't generate enough tasks to need search | Phase 2 |
| Completion analytics (streaks, summaries) | The completed list is the MVP motivational surface; analytics enhance it later | Phase 2 |
| On-device small language model | Strategic innovation, not MVP dependency | Phase 3 |
| Voice input | Secondary capture modality; text-first for validation | Phase 3 |

### Risk Mitigation Strategy

**Technical Risks:**
- *Most challenging aspect:* LLM extraction accuracy across diverse natural language inputs. Mitigated by editable form (absorbs errors gracefully) and thumbs up/down feedback (provides optimization signal).
- *Simplification available:* Extraction schema starts with flat fields (no nested objects). Recurrence extraction deferred with recurring tasks.

**Market Risks:**
- *Biggest risk:* Users don't care about extraction — they just want a simple list. Mitigated by MVP scoping: if extraction is removed, the remaining app is too minimal to retain users, confirming the hypothesis cleanly (extraction was the value, or it wasn't).
- *Learning needed:* Does capture volume actually increase week-over-week? Does the completion loop drive retention independently of extraction novelty?

**Resource Risks:**
- *Solo developer:* The scoped MVP is achievable for one developer in 3-5 weeks. The containerized Fastify proxy and WCAG compliance are the most time-consuming elements beyond the core extraction loop.
- *Absolute minimum cut:* If timeline pressure mounts, groups could be a single hardcoded set rather than user-created, and the feedback mechanism (thumbs up/down) could be a post-launch addition rather than a launch feature.

## Functional Requirements

### Authentication & Identity

- **FR1:** Users can log in via passwordless magic link sent to their email
- **FR2:** Users can log out
- **FR3:** User sessions persist across browser closes (users stay logged in until explicit logout)
- **FR4:** Users see only their own tasks (enforced by row-level security)

### Task Capture

- **FR5:** Users can enter a task in natural language via a quick capture text input
- **FR6:** Users can trigger the quick capture input via a keyboard shortcut
- **FR7:** Users can access the quick capture input via a persistent UI element (e.g., floating action button or always-visible input field)
- **FR8:** Users can submit natural language input for LLM-powered extraction
- **FR9:** Users see visual feedback indicating extraction is in progress after submitting natural language input
- **FR10:** Users can view extracted structured fields (title, due date, due time, location, priority) in an editable form after submission
- **FR11:** Users can edit any extracted field before saving
- **FR12:** Users can save a task with one click/action after reviewing extracted fields
- **FR13:** Users can capture multiple tasks in rapid succession without navigating away from the capture interface

### Graceful Degradation

- **FR14:** Users are presented with a manual structured form when LLM extraction times out (5 seconds) or fails
- **FR15:** The manual form pre-populates the title field with the user's raw input text
- **FR16:** Users can manually fill all task fields (title, due date, due time, location, priority) via the manual form
- **FR17:** Users can save tasks via the manual form with the same one-click action as the extraction path

### Task Organization

- **FR18:** Users can create up to 3 task groups
- **FR19:** Users can name and rename their task groups
- **FR20:** Users can assign a task to a group during capture or editing
- **FR21:** Users can save tasks without assigning a group (ungrouped/inbox state)
- **FR22:** Users can view tasks filtered by group
- **FR23:** Users can view all tasks across groups in a unified list
- **FR24:** Users can view tasks ordered by a meaningful default (e.g., due date, priority, or creation time)

### Task Management

- **FR25:** Users can view their list of open (incomplete) tasks
- **FR26:** Users can view task details (title, due date, due time, location, priority, group)
- **FR27:** Users can edit any field of an existing task
- **FR28:** Users can delete a task

### Task Completion

- **FR29:** Users can mark a task as complete
- **FR30:** Users can view a list of completed tasks
- **FR31:** Users can unmark a completed task (return to open)
- **FR32:** Users can see the count of completed tasks

### Extraction Feedback

- **FR33:** Users can provide thumbs up/down feedback on extraction quality after reviewing extracted fields
- **FR34:** The system records extraction feedback for analysis (correction rates, thumbs up/down signals)

### First-Use Experience

- **FR35:** New users see an empty state that guides them toward their first task capture
- **FR36:** The empty state presents a suggested rich example input (e.g., "Try typing: *Call the dentist next Monday, high priority*") that demonstrates multi-field extraction on first use

### AI Transparency & Privacy

- **FR37:** The extraction interface displays a visible "Powered by AI" indicator
- **FR38:** The system sends only the raw task text to the LLM API — no user metadata, task history, or group information
- **FR39:** The system is configured to use LLM providers that do not retain prompts or train on user data

### System Configuration

- **FR40:** The system supports OpenRouter as the LLM provider in production
- **FR41:** The system supports LM Studio as the LLM provider in development
- **FR42:** Switching between LLM providers requires only configuration changes, not code changes
- **FR43:** The backend proxy manages API keys, request forwarding, and timeout enforcement without exposing secrets to the client

## Non-Functional Requirements

### Performance

| Metric | Requirement | Rationale |
|---|---|---|
| LLM extraction target latency | ≤3s (p90) for selected models | Core UX promise — "faster than thinking" |
| LLM extraction degradation timeout | 5s hard cutoff to manual form | Safety net — extraction enhances, never gates |
| Capture-to-save time | ≤5s from extraction display to saved task | The review step should feel like confirmation, not data entry |
| First Contentful Paint | ≤1.5s | Users open app multiple times daily |
| Largest Contentful Paint | ≤2.5s | Capture input must be interactive quickly |
| Time to Interactive | ≤3.0s | Keystrokes accepted within 3 seconds of navigation |
| Cumulative Layout Shift | ≤0.1 | No layout jumps during extraction/form transitions |
| Lighthouse Performance score | ≥90 | Maintained as CI quality gate |
| Supabase query latency | ≤500ms for task CRUD operations | Database operations should feel instant; extraction is the only "wait" |

### Security

- **Authentication:** Passwordless magic link via Supabase Auth. No passwords stored or managed by the application.
- **Session management:** Supabase handles session tokens and refresh. Sessions persist across browser closes (user stays logged in).
- **Row-level security:** Supabase RLS policies ensure users can only read and write their own tasks. No application-level authorization logic needed — the database enforces isolation.
- **API key protection:** OpenRouter API key stored in the Fastify backend proxy environment. Never exposed to the client. Supabase service role key (if used server-side) also restricted to the proxy.
- **Infrastructure access control:** IP whitelisting at the infrastructure level restricts access to known users during MVP validation.
- **Transport encryption:** All traffic over HTTPS. Supabase enforces TLS for database connections.
- **No sensitive data in client storage:** Auth tokens managed by Supabase SDK. No API keys, no credentials in localStorage or IndexedDB.

### Accessibility

- **WCAG 2.1 Level AA compliance** — hard requirement from day one, applied across all functional requirements.
- **Keyboard operability:** The complete capture-to-save flow and all task management operations must be fully operable via keyboard.
- **Screen reader compatibility:** Dynamic content updates (extraction results, form transitions, task completion state changes) announced via ARIA live regions.
- **Focus management:** Predictable focus behavior during extraction-to-form transitions. No lost focus, no trapped focus.
- **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text.
- **Focus indicators:** Visible focus indicators on all interactive elements.
- **Touch targets:** Minimum 44x44px for all interactive elements on touch devices.
- **Automated testing:** Accessibility checks integrated into CI pipeline to prevent regression.

### Integration

- **Supabase:** Auth (magic link), PostgreSQL database (task persistence), Row-Level Security (user isolation). Supabase client SDK in the SPA for auth and direct database access.
- **OpenRouter (production):** LLM extraction via REST API through Fastify proxy. Structured output with JSON Schema enforcement. Provider filtering for no-training policy.
- **LM Studio (development):** Local LLM inference for zero-cost development. Same API contract as OpenRouter — provider switching via configuration only.
- **Provider abstraction:** The Fastify proxy abstracts LLM provider differences. The SPA client calls a single extraction endpoint; the proxy routes to OpenRouter or LM Studio based on environment configuration.

### Reliability

- **Graceful degradation:** LLM extraction failure (timeout, error, offline) results in manual form presentation — never an error page, never a broken state.
- **Data durability:** Tasks persisted in Supabase PostgreSQL with standard Supabase backup policies. No data loss on browser clear, device switch, or app reinstall.
- **Auth resilience:** If Supabase Auth is temporarily unavailable, users with active sessions can continue using the app. New logins blocked until auth recovers.
- **Extraction independence:** Task creation must succeed even if the LLM provider is completely down. The manual form path bypasses the extraction infrastructure entirely.
