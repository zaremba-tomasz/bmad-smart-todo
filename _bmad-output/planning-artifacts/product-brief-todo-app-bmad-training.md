---
title: "Product Brief: Smart Todo"
status: "complete"
created: "2026-04-13"
updated: "2026-04-13"
inputs: [user interview, web market research]
---

# Product Brief: Smart Todo

## Executive Summary

Every day, millions of people capture tasks the way they think — "Pick up groceries at Tesco tomorrow afternoon, pretty urgent" — then spend time manually breaking that sentence into fields: title, due date, location, priority. It's a small friction, but it compounds across dozens of daily tasks into a real cognitive tax.

**Smart Todo** is a thought-speed capture tool for personal productivity. Users trigger a quick-capture input, type their task in plain language, and an LLM instantly extracts the structured metadata — time, place, and priority — presenting it in an editable form for confirmation. One keystroke to capture, one click to save. No field-filling, no widget-hopping, no translation between how you think and how your tool works.

This is a concept-validation MVP targeting a small group of early adopters, built to prove that LLM-powered structured extraction can make task capture feel effortless. The market for personal productivity tools is growing toward $31B by 2034, and while incumbents are adding AI features, none have made intelligent natural-language capture the core of the experience.

## The Problem

Current todo apps force users to translate their natural thoughts into structured data. You think "Call the dentist next Monday, it's important" — but you have to type a title, pick a date from a calendar widget, select a priority dropdown, maybe add a location. Each field is a micro-decision, each widget a context switch.

The result: people either over-simplify their tasks (losing context), abandon structure entirely (dumping everything into a flat list), or avoid capture altogether (keeping tasks in their head until they're forgotten). The tools that are supposed to reduce cognitive load end up adding it.

Some apps like Todoist and TickTick have introduced date parsing from text, but it's a feature buried inside a complex product — not the core interaction model. No tool today makes the full extraction of time, place, and priority from natural language the primary and defining experience.

## The Solution

Smart Todo is built around a single, optimized interaction loop:

1. **Trigger** — A keyboard shortcut or a persistent UI element (e.g., floating action button) opens the quick-capture input
2. **Speak naturally** — Type the task as you think it: "Pay electricity bill every month, high priority"
3. **Review extraction** — The LLM parses your input and presents a structured form with extracted fields: title, due date/time, location, priority, and recurrence
4. **Confirm or adjust** — Edit any field if the extraction needs tweaking
5. **Save** — One click to store

If the LLM is unavailable or slow, the capture gracefully degrades to a standard structured form — extraction enhances the experience but never gates it.

The first-use experience is designed to demonstrate extraction immediately — the user's very first task shows the "type naturally, see structure" moment, establishing the product's value within seconds.

Tasks are organized into up to 3 user-created groups (e.g., Work, Family, Personal) for simple segregation. Recurring tasks are supported for repeating obligations like bills or routines.

The tech stack uses OpenRouter for LLM integration in production (access to multiple models, flexibility to optimize cost/quality) and local models via LM Studio for development — keeping dev costs at zero while maintaining production reliability. Task text is sent to the LLM API solely for extraction and is not stored, logged, or used for model training.

## What Makes This Different

- **Thought-speed capture** — The entire UX is built around eliminating the cognitive tax of task entry. This isn't an AI feature bolted onto a todo app; it's a capture tool that closes the gap between thinking and doing.
- **Trust-first AI** — Every extracted field is visible and editable before saving. In a market of black-box "AI magic," Smart Todo shows its work. Users see exactly what the LLM understood and correct it in one tap — building confidence with every interaction rather than eroding it.
- **Radical simplicity** — No project management features, no team collaboration, no integrations ecosystem. Just fast, intelligent task capture and organization for one person.
- **Flexible LLM backend** — OpenRouter integration means the app isn't locked to a single model provider and can adapt as the LLM landscape evolves.

## Who This Serves

**Primary user:** Individuals who manage a moderate-to-high volume of personal tasks across life domains (work, family, errands) and are frustrated by the friction of traditional todo apps. They think in natural language and want their tools to keep up.

These are people who've tried Todoist, TickTick, Apple Reminders, or Google Tasks and found them either too complex or too rigid. They want something that captures tasks at the speed of thought.

**Secondary audience:** Users who struggle with executive function (e.g., ADHD) where the translation from thought to structured task is the exact barrier that causes tasks to be lost or avoided. The frictionless capture loop directly addresses this pain point.

## Success Criteria

- **Adoption:** 6 active users (the creator + 5 friends) capturing tasks at least 4 days per week over 3 consecutive weeks
- **Task completion rate:** Users are completing tasks they capture — the extraction quality is high enough that tasks have accurate, actionable metadata
- **LLM extraction latency:** Structured fields returned within 3 seconds (p90)
- **User capture friction:** Time from seeing extracted fields to saved task is under 5 seconds
- **Extraction accuracy:** LLM correctly identifies time, place, and priority without manual correction in at least 80% of inputs. Recurrence extraction is expected to have lower accuracy initially; the editable form serves as the safety net

## Scope

### MVP Includes
- Quick capture via keyboard shortcut or persistent UI element with natural language input
- LLM-powered extraction of time/date, location, priority, and recurrence
- Editable structured form for review before saving
- Up to 3 user-created task groups
- Recurring tasks support
- Considered empty state that guides users toward their first capture
- Responsive web design
- Task completion tracking
- OpenRouter LLM integration (production) + LM Studio support (development)

### MVP Excludes
- Collaboration or sharing features
- Calendar integration
- Native mobile applications
- Intelligent/dynamic task groups (e.g., "Today" view)
- External input channels (email, messaging)
- User authentication beyond basic access (small, known user group)

## Vision

If Smart Todo validates the core hypothesis — that LLM extraction makes task capture dramatically better — the product evolves along four axes:

1. **Smarter organization** — Intelligent dynamic groups like "Today" that aggregate tasks across groups by due date, priority, or context. The app starts anticipating what you need to see.
2. **More input channels** — Mailbox integration, messaging apps, voice input. Anywhere a task originates, Smart Todo can ingest and structure it.
3. **Richer task portfolio** — Scheduled tasks, reminders, habit tracking. The foundation of natural-language understanding extends to increasingly sophisticated personal productivity workflows.
4. **Mobile native** — Once the concept is proven on web, a dedicated mobile app brings quick capture to the device where most tasks are first thought of.

The north star is a personal productivity tool that truly understands you — where capturing and organizing tasks requires zero translation between how you think and how the tool works.
