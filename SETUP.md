# Setup Guide

Reproduce this Obsidian setup in another vault. Written so a person **or an AI agent**
can execute it step by step. Sections 2–5 are the shared essentials; sections 6–7 are
optional personal preferences.

> **AI agents:** a condensed, copy-paste checklist is at the very bottom
> ([For AI agents](#for-ai-agents)). Read the folder-name rule in step 2 first — it's the
> one thing that silently breaks setups.

## 0. What you're setting up

- **3 custom plugins** (from this repo) + **7 community plugins** (installed normally).
- **Credentials** for 3 of them (Google Calendar, Asana, Auto Link Title).
- **Optional:** Cursor-style hotkeys and the Tokyo Night theme.

## 1. Prerequisites

- **Obsidian 1.7.2+**, desktop (Windows / macOS / Linux). `drift-inline` is desktop-only.
- A local copy of this repo.
- The target vault's config folder path: `<vault>/.obsidian/`.

## 2. Install the custom plugins

Copy these three folders from this repo into `<vault>/.obsidian/plugins/`:

```
drift-inline/
obsidian-auto-link-title/
obsidian-rollover-daily-todos/
```

> 🔑 **Folder name must equal the manifest `id`.** Obsidian silently ignores a plugin
> whose folder name differs from the `id` in its `manifest.json`. These three folders are
> already named correctly — **copy them as-is; do not rename.**

## 3. Install the community plugins

Install each of these (unmodified). Use Obsidian's **Community Plugins → Browse** where
the plugin is listed; otherwise install from the GitHub source (via
[BRAT](https://github.com/TfTHacker/obsidian42-brat) or a manual copy of the release).

| Plugin | id | Version | Source |
|--------|----|---------|--------|
| Claude Sidebar | `claude-sidebar` | 1.7.5 | [derek-larson14/obsidian-claude-sidebar](https://github.com/derek-larson14/obsidian-claude-sidebar) |
| Claudian | `claudian` | 2.0.1 | [YishenTu/claudian](https://github.com/YishenTu/claudian) |
| Terminal | `terminal` | 3.23.0 | [polyipseity/obsidian-terminal](https://github.com/polyipseity/obsidian-terminal) |
| Tab Switcher | `cycle-through-panes` | 1.4.0 | [Vinzent03/obsidian-cycle-through-panes](https://github.com/Vinzent03/obsidian-cycle-through-panes) |
| Calendar | `calendar` | 1.5.10 | [liamcain/obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin) |
| Asana | `asana` | 0.1.8 | [mryanb/obsidian-asana](https://github.com/mryanb/obsidian-asana) |
| Google Calendar | `google-calendar` | 1.10.16 | [YukiGasai/obsidian-google-calendar](https://github.com/YukiGasai/obsidian-google-calendar) |

> ⚠️ **Do NOT install the original `drift` plugin** — it conflicts with `drift-inline`.

## 4. Enable the plugins

The exact set we run is in [`config/community-plugins.json`](./config/community-plugins.json).

- **Fresh vault (no plugins yet):** copy that file to `<vault>/.obsidian/community-plugins.json`.
- **Existing vault:** merge its 10 entries into the vault's existing
  `community-plugins.json` (it's a JSON array of plugin ids).

Then reload Obsidian (**Cmd/Ctrl+P → "Reload app without saving"**) and confirm all 10
plugins show as enabled with no load errors.

## 5. Credentials (3 plugins)

No secrets live in this repo — follow each doc:

| Plugin | What it needs | Doc |
|--------|---------------|-----|
| Google Calendar | Shared org OAuth client (Client ID + Secret **from the maintainer**) | [docs/google-calendar-setup.md](./docs/google-calendar-setup.md) |
| Asana | Your **own** Asana Personal Access Token | [docs/asana-setup.md](./docs/asana-setup.md) |
| Auto Link Title | The **same** Asana PAT (for resolving Asana link titles) | [docs/asana-setup.md](./docs/asana-setup.md) |

---

## 6. Hotkeys (personal preference)

`config/hotkeys.cursor.json` contains the Cursor/VS Code-style bindings. Two categories:

**Required for a plugin to work as intended**
- **Tab Switcher** (`cycle-through-panes`) ships with **no default binding**. Bind
  MRU tab cycling or it does nothing:
  - `Ctrl+Tab` → *Cycle through panes: focus on last active pane*
  - `Ctrl+Shift+Tab` → *…reverse*

**Optional Cursor-style extras**
- `Alt+↑` / `Alt+↓` → move line up / down
- `Cmd+Shift+[` / `Cmd+Shift+]` → previous / next tab

To apply: merge the entries in [`config/hotkeys.cursor.json`](./config/hotkeys.cursor.json)
into `<vault>/.obsidian/hotkeys.json` (don't overwrite the whole file if the vault already
has custom hotkeys). On Windows/Linux, `Meta` = the Windows/Super key — you may prefer to
change those two `Meta` bindings to `Ctrl`.

## 7. Theme (personal preference)

We use **Tokyo Night** (a dark, code-editor aesthetic). **Settings → Appearance → Themes →
Manage → search "Tokyo Night" → Use.** Any theme works; this is just the default that
matches the Cursor feel.

---

## 8. Verify it works

- [ ] All 10 plugins listed in **Settings → Community plugins**, enabled, no errors.
- [ ] Paste an Asana task URL into a note → it resolves to the real task name.
- [ ] Have Claudian or Claude Sidebar edit a note → an **inline diff** appears with
      Accept ✓ / Reject ✗ controls.
- [ ] `Ctrl+Tab` cycles tabs in most-recently-used order.
- [ ] Google Calendar sidebar loads your calendar after login.

---

## For AI agents

Condensed checklist. `$V` = target vault root.

1. **Copy custom plugins** into `$V/.obsidian/plugins/` (names must stay exactly as-is):
   `drift-inline/`, `obsidian-auto-link-title/`, `obsidian-rollover-daily-todos/`.
2. **Install community plugins** (§3): `claude-sidebar`, `claudian`, `terminal`,
   `cycle-through-panes`, `calendar`, `asana`, `google-calendar`. **Never** install `drift`.
3. **Enable**: write/merge `config/community-plugins.json` → `$V/.obsidian/community-plugins.json`.
4. **Hotkeys** (optional): merge `config/hotkeys.cursor.json` → `$V/.obsidian/hotkeys.json`.
   Required-for-function: the two `cycle-through-panes` bindings.
5. **Credentials**: cannot be automated — surface `docs/asana-setup.md` and
   `docs/google-calendar-setup.md` to the user; the Google Client ID/Secret and each
   user's Asana PAT are obtained out-of-band.
6. **Do NOT** copy any `data.json` between vaults — those hold personal tokens.
7. Reload Obsidian and run the §8 checks.
