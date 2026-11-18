# Repository instructions

## Scope

This repository holds Greg Lapinski's CV, portfolio website, and career planning.
Engram also tracks the career and product milestones discussed in this project.
Implementation bugs and tasks for Engram, TermAl, PhoenixCodeNav, and Starfish
remain in their respective projects; CV tracks the broader outcomes and links
to evidence without duplicating those implementation backlogs.

## Engram tracking

The tracked `.engram-project` file declares `github.com/grlap/CV`.
Use Engram for tasks, goals, decisions, and persistent project context.

- At session start and after compaction, call `next` with `peek: true`, then
  list `memories`. Follow continuations and read relevant entries in full.
  The CLI equivalents are `engram work next --peek`, `engram work memories`,
  and `engram work memories KEY --full`.
- Prefer host-injected Engram MCP tools. The CLI uses the same operations;
  obtain the explicit home from `ENGRAM_HOME` or the host's confirmed Engram
  settings and pass `--home` when necessary. Never guess or initialize an
  alternate store to work around missing configuration.
- Preserve the host's actor and session identity. In a TermAl session, use
  its actual session id; do not borrow another session's identity.
- Inspect existing work before creating an item. Claim an implementation
  item before changing files; record decisions and actual verification on it.
- Goals are planning items. Recording a goal does not authorize starting its
  work, changing another repository, or assigning work to other agents.
- Record completion only when the acceptance criteria are met. If project
  policy requires an evaluation, obtain it before `done`.
- Save durable context with `remember`; revise the existing key when the
  decision changes. Do not maintain a parallel Markdown goal tracker.
- Attribute advisor reports and distinguish them from directly verified
  results. Preserve the distinction between implemented, installed, and
  observed working behavior.

The initial integration is advisory tracking. It does not grant additional
execution, publication, commit, push, installation, or restart authority.
Keep `AGENTS.md` and `CLAUDE.md` in sync when changing these instructions.
