---
title: "Product Brief Distillate: todo-app-bmad-training"
type: llm-distillate
source: "product-brief-todo-app-bmad-training.md"
created: "2026-04-13"
purpose: "Token-efficient context for downstream PRD creation"
---

# Smart Todo — Product Brief Distillate

## Competitive Intelligence

- **Todoist** — Market leader with AI add-on for suggestions/breakdown; has natural-language date parsing but it's a feature within a complex app, not the core UX; no place/priority extraction from freeform text
- **TickTick** — Strong NL date/time input plus habits, Pomodoro, calendar views; feature-rich surface feels heavy; not focused on minimal extraction-first capture
- **Motion / Reclaim.ai** — AI autopilot scheduling and calendar defense; optimized for teams/power users, not lightweight personal freeform capture
- **Akiflow** — Unified inbox with "Aki" assistant; integration-first complexity and pricing skew away from individual MVP use case
- **Taskade / ClickUp / Morgen** — Bundled AI inside broader workspace/PM suites; NLP capture is one slice of a large product
- **Key gap Smart Todo fills:** No incumbent makes full extraction of time + place + priority from natural language the *primary and defining experience*; all treat it as a feature within a larger product

## Market Context

- Productivity apps market estimated ~$14B+ in 2026, projected toward ~$31B by 2034
- 2025–2026 framed as the gen-AI wave in productivity — summarization, suggestions, automation becoming table stakes
- Consolidation toward all-in-one platforms (Microsoft 365, Google Workspace, Notion) pulls user attention toward deep integrations
- Cheap, capable LLM APIs (OpenRouter, etc.) make structured extraction feasible for solo/small-team MVPs without building classic NLP
- Remote/hybrid work sustains demand for lightweight personal cognitive-load reducers

## User Sentiment (from research)

- Friction — too many steps, clutter, system maintenance — kills todo app adoption, not lack of features
- Users frustrated when AI feels like a black box; they want clear labels, easy correction, predictable overrides when the model is wrong
- Trust issues: fear of confidently wrong outputs ("hallucinations") and privacy unease with personal text sent to opaque models
- Pushback on "AI for AI's sake" — users gravitate to tools fixing a concrete job with reliable behavior
- Hybrid expectations dominate: automate boring structuring (dates, fields) but keep humans clearly in control of priorities and scheduling

## Requirements Hints

- **Core interaction loop:** Keyboard shortcut OR floating action button → type natural language → LLM extracts time/date, location, priority, recurrence → editable structured form → user confirms/edits → save
- **Task groups:** Up to 3 user-created groups (e.g., Work, Family, Personal) for segregation — hard limit in MVP
- **Recurring tasks:** Explicitly in MVP scope (e.g., monthly bills); acknowledged as harder for LLM to parse than single dates
- **Responsive web design:** Required for MVP; no native mobile
- **LLM integration:** OpenRouter for production (multi-model flexibility); LM Studio for local dev (zero-cost development)
- **Privacy posture:** Task text sent to LLM API for extraction only — not stored, logged, or used for model training
- **Graceful degradation:** If LLM unavailable or slow, capture falls back to standard manual structured form
- **Empty state:** Must guide users toward first capture — critical for first-use retention
- **First-use experience:** Designed to demonstrate extraction immediately on very first task (the "aha moment")
- **Authentication:** Basic access only — small, known user group of 6 (creator + 5 friends)

## Technical Context

- **Platform:** Web-only for MVP; responsive design covers mobile browsers
- **LLM routing:** OpenRouter chosen for production — provider-agnostic access to multiple models, flexibility to optimize cost/quality tradeoffs, not locked to single vendor
- **Local dev:** LM Studio for hosting local models — zero API cost during development
- **Extraction fields:** title, due date/time, location, priority level, recurrence pattern
- **Extraction target:** 80%+ accuracy without manual correction; recurrence expected to be lower initially

## Scope Signals

### Explicitly IN for MVP
- Natural language quick capture (shortcut + UI trigger)
- LLM extraction (time, place, priority, recurrence)
- Editable structured form pre-save
- Up to 3 task groups
- Recurring tasks
- Responsive web design
- Task completion tracking
- Considered empty state / onboarding
- OpenRouter + LM Studio dual LLM strategy

### Explicitly OUT for MVP
- Collaboration or sharing
- Calendar integration
- Native mobile app
- Intelligent/dynamic groups (e.g., "Today" view)
- External input channels (email, messaging, voice)
- Advanced authentication / user management

### Future (post-validation)
- Intelligent dynamic groups ("Today" aggregating across groups by due date/priority/context)
- Mailbox integration as input channel
- Scheduled tasks, reminders, habit tracking
- Mobile native app
- More sophisticated task portfolio tools

## Risks & Considerations

- **Incumbent replication risk:** Todoist/TickTick could ship extraction-first capture as a modal; differentiation window may be narrow — execution speed matters
- **Recurrence extraction accuracy:** Parsing "every second Tuesday" is notably harder than "tomorrow at 3pm"; users may lose trust if recurrence frequently wrong
- **Privacy sensitivity:** Personal tasks contain health, financial, relationship info; even small user group may self-censor if data handling isn't transparent
- **Keyboard shortcut fragility:** Browser-level shortcuts conflict across OS/browser combos; mitigated by persistent UI element fallback
- **LLM cost scaling:** Token spend scales with capture frequency; enthusiastic users could create unexpected cost pressure
- **Platform giant risk:** Google/Microsoft bundling AI copilots with existing task tools caps willingness to adopt standalone capture app
- **Habit formation:** MVP excludes "Today" view, which could limit daily-driver stickiness; feedback may be biased toward novelty not habit

## Rejected Ideas / Decisions

- **Mobile native for MVP** — rejected; web-first validates concept faster with less investment; mobile is post-validation
- **Collaboration/sharing** — rejected for MVP; product is personal productivity focused; complexity doesn't serve validation goal
- **Calendar integration** — rejected for MVP; adds integration complexity without validating core extraction hypothesis
- **Single capture trigger (shortcut only)** — rejected after review; added persistent UI element as fallback for accessibility and cross-browser compatibility
- **Vague "regularly" adoption metric** — replaced with quantified "4 days/week for 3 consecutive weeks"
- **Single capture-time metric** — split into LLM latency (3s p90) and user interaction time (<5s) to isolate variables

## Open Questions

- What specific LLM model(s) will be used via OpenRouter for production? Cost/quality tradeoff needs evaluation
- What does "basic access" authentication look like concretely? Shared URL? Simple login? Token-based?
- How will task completion rate be measured and tracked? In-app analytics? Manual review?
- What's the recurrence accuracy threshold below which the feature hurts more than it helps?
- How will the 6-person cohort provide feedback? Structured surveys? Informal conversation?

## Positioning & Narrative

- **Core positioning:** "Thought-speed capture" — own the cognitive tax reduction narrative rather than competing on todo app feature checklists
- **Trust-first AI:** Show the work, let users correct it — anti-black-box positioning as a deliberate brand choice
- **Secondary audience signal:** Neurodivergent / executive-function users are a high-engagement adjacent audience where the core value (fuzzy intent → structured action) directly addresses their primary barrier
- **Radical simplicity as strategy:** Scope discipline is deliberate — faster shipping, clearer metrics, credible path to own the capture layer before expanding
