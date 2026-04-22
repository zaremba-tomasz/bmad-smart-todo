## Tooling

- Cursor
- Docker

## BMad process

- create brief
- domain analysis to establish common language and best practices
- prd creation
- ux discovery
- validate prd
- epics and stories
- implementation readiness
- create story
- dev story
- review story
- ...

## Models used

- specification + story implementation: Opus 4.6 (high reasoning effort)
- code review: GPT 5.4 (high reasoning effort) + Codex 5.3 (high reasoning effort)

## Observations + notes

- start of the specification process slightly overwhelming: too many agents/commands available and /bmad-help was not clearly pointing which persona should be used (had to go with roadmap)
- interesting conversation with agent, smart questions to frame and shape idea before PRD was created
- advanced solicitation very beneficial in terms of different perspectives and addressing/challenging gaps
- LLM context window super heavy (especially during architecture planning loading just previous artifacts reserved ~50% of 200k window)
- convenient interaction model with abbreviations or single characters
- implementation using massive amount of tokens; maybe due Cursor usage
- very convenient correct course which was used to address missing training artifacts during epic 2
- very useful implementation checkpoint which was very helpful to briefly summarize the change and discuss regarding implementation details
- models very capable of tech stack configuration. Even for Supabase LLM was able to configure not only persistence layer but magic link as well. Also integrating it with docker-compose was pretty smooth
