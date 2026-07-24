# Obsidian Setup (Plugins + Config)

Everything needed to reproduce our team's Obsidian setup in another vault — custom
plugins, the community plugins we run, credentials/onboarding docs, and the
"make Obsidian feel like Cursor" configuration.

> **Setting up a new vault?** Follow **[SETUP.md](./SETUP.md)** top to bottom.
> It's written so a person *or* an AI agent can execute it step by step.

---

## What's in this repo

| Path | What it is |
|------|------------|
| [`SETUP.md`](./SETUP.md) | Ordered, reproducible setup guide (start here) |
| [`MAKE-OBSIDIAN-LIKE-CURSOR.md`](./MAKE-OBSIDIAN-LIKE-CURSOR.md) | How the plugins + hotkeys + theme turn Obsidian into a Cursor-style AI editor |
| [`drift-inline/`](./drift-inline/) | **Custom plugin** — Cursor-style inline diffs |
| [`obsidian-auto-link-title/`](./obsidian-auto-link-title/) | **Custom plugin** — Auto Link Title + Asana titles |
| [`obsidian-rollover-daily-todos/`](./obsidian-rollover-daily-todos/) | **Custom plugin** — Rollover Daily Todos + completed-child fix |
| [`config/`](./config/) | Drop-in config: enabled-plugins list + Cursor-style hotkeys |
| [`docs/`](./docs/) | Credential/onboarding docs (Google Calendar, Asana) |

Folder names for the three custom plugins **match their manifest `id`** on purpose —
copy them into `.obsidian/plugins/` as-is and Obsidian will load them. (A folder whose
name differs from its manifest `id` is silently ignored.)

---

## Custom / modified plugins

Install these **from this repo**, not the community store — the store versions
don't have our changes.

| Plugin | Version | Based on | Our change |
|--------|---------|----------|------------|
| [drift-inline](./drift-inline/) | 0.3.3 | Original, inspired by [Drift](https://github.com/ryanbbrown/obsidian-drift) | Cursor-style **inline diffs** for external/AI edits, with per-hunk accept/reject |
| [obsidian-auto-link-title](./obsidian-auto-link-title/) | 1.5.5 | [Auto Link Title v1.5.5](https://github.com/zolrath/obsidian-auto-link-title) | Asana API integration — pasted Asana URLs resolve to the real task/project name |
| [obsidian-rollover-daily-todos](./obsidian-rollover-daily-todos/) | 1.2.0 | [Rollover Daily Todos v1.2.0](https://github.com/lumoe/obsidian-rollover-daily-todos) | Completed sub-tasks no longer roll over as unfinished |

## Community plugins we run (unmodified)

Install these from Obsidian's **Community Plugins** browser where available; for the
rest, use the linked source (some install via [BRAT](https://github.com/TfTHacker/obsidian42-brat)
or manual copy). Exact versions are what we run today.

| Plugin (id) | Version | Purpose | Needs setup | Source |
|-------------|---------|---------|:-----------:|--------|
| Claude Sidebar (`claude-sidebar`) | 1.7.5 | Run Claude Code / other AI CLIs in a sidebar | — | [derek-larson14/obsidian-claude-sidebar](https://github.com/derek-larson14/obsidian-claude-sidebar) |
| Claudian (`claudian`) | 2.0.1 | Claude Code as an in-vault AI collaborator | — | [YishenTu/claudian](https://github.com/YishenTu/claudian) |
| Terminal (`terminal`) | 3.23.0 | Integrated shell/terminal | — | [polyipseity/obsidian-terminal](https://github.com/polyipseity/obsidian-terminal) |
| Tab Switcher (`cycle-through-panes`) | 1.4.0 | MRU (browser-style) tab cycling | **hotkey** | [Vinzent03/obsidian-cycle-through-panes](https://github.com/Vinzent03/obsidian-cycle-through-panes) |
| Calendar (`calendar`) | 1.5.10 | Calendar view for daily notes | — | [liamcain/obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin) |
| Asana (`asana`) | 0.1.8 | Create Asana tasks from notes | **PAT** → [docs/asana-setup.md](./docs/asana-setup.md) | [mryanb/obsidian-asana](https://github.com/mryanb/obsidian-asana) |
| Google Calendar (`google-calendar`) | 1.10.16 | Google Calendar in a sidebar | **OAuth** → [docs/google-calendar-setup.md](./docs/google-calendar-setup.md) | [YukiGasai/obsidian-google-calendar](https://github.com/YukiGasai/obsidian-google-calendar) |

> ⚠️ **Do not install the original `drift` plugin.** It reacts to the same external
> changes as `drift-inline` and the two conflict. `drift-inline` replaces it.

---

## Make Obsidian feel like Cursor

The custom `drift-inline` plugin plus Terminal, the AI sidebars, and a set of
IDE-style hotkeys turn Obsidian into a Cursor-like AI editor: talk to an AI in the
sidebar, let it edit your notes, and review its changes as **inline diffs you accept
or reject** — just like Cursor.

Full write-up: **[MAKE-OBSIDIAN-LIKE-CURSOR.md](./MAKE-OBSIDIAN-LIKE-CURSOR.md)**.

---

## Credentials & secrets

This repo contains **no secrets, tokens, or account IDs** — and it should stay that way
(it's public). Plugin `data.json` files (which hold tokens) are intentionally excluded.

- **Asana** PATs are per-person — each user generates their own ([docs/asana-setup.md](./docs/asana-setup.md)).
- **Google Calendar** uses a shared org OAuth client; the Client ID/Secret are **not**
  in this repo — get them privately from the maintainer ([docs/google-calendar-setup.md](./docs/google-calendar-setup.md)).

## Personal preferences

The **plugins and credential setup above are the shared essentials.** The hotkeys and
theme in [`config/`](./config/) and the Cursor doc are **one person's preferences** — a
reasonable default, but adopt or skip them freely. They're kept separate so they don't
clutter the core setup.
