# Config (drop-in)

Reference config for reproducing the setup. See [SETUP.md](../SETUP.md) for how to apply.

| File | Goes to | How |
|------|---------|-----|
| `community-plugins.json` | `<vault>/.obsidian/community-plugins.json` | The exact set of 10 enabled plugins. Copy on a fresh vault; **merge** into an existing one. |
| `hotkeys.cursor.json` | `<vault>/.obsidian/hotkeys.json` | Cursor/VS Code-style bindings. **Merge** these entries — don't overwrite existing hotkeys. |

Notes:
- `community-plugins.json` only lists which plugins are **enabled** — the plugin files
  still have to be installed first (SETUP §2–3).
- `hotkeys.cursor.json` bindings:
  - `Ctrl+Tab` / `Ctrl+Shift+Tab` — MRU tab cycling (**required** for Tab Switcher; it has
    no default binding).
  - `Alt+↑` / `Alt+↓` — move line up/down.
  - `Meta+Shift+[` / `Meta+Shift+]` — previous/next tab. `Meta` is Cmd on macOS; on
    Windows/Linux change to `Ctrl` if you prefer.
- These are **personal preferences**, kept out of the core plugin setup on purpose.
