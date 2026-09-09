# Project Instructions

Before making significant changes, read:

- docs/PRD.md
- docs/TECHNICAL_DESIGN.md

## Development Principles

- Follow the product scope defined in the PRD.
- Work phase by phase. Do not implement future phases unless explicitly requested.
- Keep business logic outside React page components.
- Nutrition calculations must be deterministic and based on structured food data.
- Do not let AI guess or invent nutrition values.
- Use React, TypeScript and Vite.
- Use Zustand for application state.
- Use localStorage for V1 persistence.
- Keep the UI mobile-first.
- Prefer simple, maintainable implementations over unnecessary abstraction.
- Do not add backend, authentication, cloud database, AI API, barcode scanning, or other out-of-scope features unless explicitly requested.
- Run typecheck/build checks after meaningful implementation changes.
- Fix errors before considering a phase complete.
- Preserve existing working behavior unless the current task explicitly requires changing it.

## Product Scope Reminder

The core flow is:

Food Library
→ Inventory
→ Meal Planning
→ Recipe
→ Shopping

## Safety and Change Control

- Never delete any file or directory without explicit user permission.
- Never rename or move existing files without explicit user permission unless the change has been specifically requested.
- Do not modify files outside the current project root.
- Do not overwrite existing user-created content when a safer incremental edit is possible.
- Before making a large refactor or any potentially destructive change, explain what will change and wait for explicit approval.
- Never run destructive shell commands such as `rm -rf` unless explicitly authorized.
- Never run destructive Git commands such as `git reset --hard`, `git clean -fd`, or force push without explicit user permission.
- Do not discard, revert, or overwrite uncommitted user changes.
- Do not rewrite Git history, change remotes, or force-push branches without explicit permission.
- Never expose, print, commit, or hard-code passwords, API keys, tokens, credentials, or other secrets.
- Do not modify `.env` files or credential files unless explicitly requested.
- Do not install unnecessary dependencies. Before adding a new dependency, prefer existing project capabilities and explain why the dependency is needed.
- Do not execute downloaded scripts or unknown external code without explicit permission.
- Do not make network requests, upload project files, or send project data to external services unless the task explicitly requires it.
- Keep changes scoped to the current task. Do not make unrelated cleanup, refactors, or feature additions.
- If an instruction is ambiguous and could result in data loss, breaking changes, or significant restructuring, stop and ask before proceeding.

The app is a planning tool, not a calorie diary or fitness tracking app.