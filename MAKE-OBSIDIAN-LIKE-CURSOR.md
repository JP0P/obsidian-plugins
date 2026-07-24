# Make Obsidian Feel Like Cursor

Turning Obsidian into a [Cursor](https://cursor.com)-style AI editor: chat with an
AI in a side panel, let it edit your notes, and **review its changes as inline diffs
you accept or reject** — over Markdown instead of code.

This is the payoff of the whole repo. The flagship piece is the custom
[`drift-inline`](./drift-inline/) plugin, which recreates Cursor's inline-diff review
for AI edits to your notes.

## Cursor → Obsidian, feature by feature

| Cursor (the IDE) | Obsidian equivalent here | Source |
|------------------|--------------------------|--------|
| AI chat side panel | **Claudian** + **Claude Sidebar** | community |
| **Inline diff** of AI edits with Accept/Reject | **Drift Inline** | [`drift-inline/`](./drift-inline/) (custom) |
| Integrated terminal | **Terminal** | community |
| `Ctrl+Tab` most-recently-used tab switch | **Tab Switcher** (`cycle-through-panes`) | community + hotkey |
| Move line `Alt+↑/↓`, tab nav `⌘⇧[` / `⌘⇧]` | hotkeys | [`config/hotkeys.cursor.json`](./config/hotkeys.cursor.json) |
| Dark, code-editor aesthetic | **Tokyo Night** theme | community theme |

## The four pillars

### 1. AI in the sidebar — Claudian & Claude Sidebar
Two ways to run an AI coding agent (Claude Code, and others) right next to your notes:
- **Claudian** embeds Claude Code as an in-vault collaborator that can read and edit
  your notes.
- **Claude Sidebar** runs Claude Code (or Codex / Gemini CLI, etc.) as a terminal in a
  side panel.

Both edit files by running a CLI as a subprocess — which is exactly what makes pillar 3
necessary.

### 2. Integrated terminal — Terminal
A real shell docked in Obsidian, so you can run git, scripts, and CLIs without leaving
the vault — the way Cursor's built-in terminal works.

### 3. Inline diffs — Drift Inline ⭐ (the hard part)
When an AI tool edits a note, you don't want to guess what changed. Drift Inline shows
the change **inside the note** — green additions, red strikethrough deletions — with
per-change **Accept ✓ / Reject ✗** controls, exactly like Cursor.

See the engineering story below for *why this was non-trivial* — it's the bulk of the
work in this repo.

### 4. IDE muscle memory — hotkeys & theme
Cursor-style keybindings ([`config/hotkeys.cursor.json`](./config/hotkeys.cursor.json))
and the **Tokyo Night** theme make the whole thing feel like an editor, not a wiki. See
[SETUP.md §6–7](./SETUP.md#6-hotkeys-personal-preference). *(These are personal
preferences — adopt or swap freely.)*

## A typical loop

1. Open a note. Ask Claudian (or Claude Sidebar) to make a change.
2. The AI writes the change to disk.
3. **Drift Inline** overlays the change inline — green/red, with Accept/Reject.
4. Accept the parts you like, reject the rest. Keep moving.

---

## The engineering story of Drift Inline

*Condensed from the design notes. Full v0.3.x behavior is in
[`drift-inline/README.md`](./drift-inline/README.md).*

### Why Cursor-style inline diffs are hard in Obsidian

Inline-diff plugins assume the document **still holds the original text** and paint the
new text as an *unapplied proposal* you then accept. AI CLI tools work the opposite way:
they **write the change straight to disk**. By the time anything notices, the file
already contains the new text — there's no "proposal" to render, and no plugin, call
stack, or event to attribute the write to. From Obsidian's view it's an anonymous
external file change, identical to editing the file in another app.

### The approach: merge detection with an inline renderer

Rather than wiring two plugins together (their useful internals aren't safely callable
across plugin boundaries), Drift Inline is a **single plugin** that keeps a robust
**detection engine** (inspired by [Drift](https://github.com/ryanbbrown/obsidian-drift))
and adds a **from-scratch inline renderer** — one bundle, no fragile cross-plugin calls.

### The "already-applied" model

Because the new text is *already on disk*, the diff is rendered over the **new** text:
- **Added lines** → green highlight (they really exist in the doc).
- **Removed lines** → red strikethrough shown as widgets at the boundary (not in the doc).
- **Accept** = keep the new text — just clear the overlay. *No write.*
- **Reject** = write the old text back to disk.

This avoids a delicate revert-then-reapply dance and reads like a git diff laid over the
new file.

### Telling AI edits from Obsidian's own edits (v0.3.0)

A naive watcher would also flag Obsidian's *own* writes (opening a daily note, templates,
rollover) and nag you constantly. Drift Inline classifies every change as:
- **Internal** — an in-process write by Obsidian/a plugin, detected by instrumenting the
  vault API and attributed to a plugin via the call stack (`/plugins/<id>/`).
- **External** — an out-of-process write (a CLI subprocess or sync) with no in-process call.

**Default policy: diff external writes, ignore internal ones.** So the daily-note button
never prompts, while AI CLI edits always do. On top of that: per-plugin allow/block lists
(for internal writers), path globs, and per-file frontmatter opt-out
(`drift-inline: ignore`).

### Version history

- **v0.1.0** — inline renderer + detection; whole-file Accept/Reject.
- **v0.2.0** — **per-hunk** Accept/Reject; each change resolved independently.
- **v0.2.1** — bulk "Accept all / Reject all" only touch still-pending hunks (a hunk you
  already resolved keeps its decision — matches Cursor / VS Code).
- **v0.3.0** — configurable triggers (internal vs external classification, path & plugin
  allow/block lists, frontmatter opt-out).
- **v0.3.3** — current; cross-platform desktop.

### Honest limitations

- The two CLI tools (Claudian, Claude Sidebar) both write via subprocess, so they look
  identical as "external" and can't be told apart from each other.
- Inline overlay needs the file **open** in an editor; background-file edits raise a
  notice to open-and-review.
- Pending diffs are held **in memory** (not persisted across restart).
- **Line-level** diff (no intra-line/word-level highlighting yet).
- Desktop only.

---

## Set it up

The Cursor experience is the sum of the whole repo — follow **[SETUP.md](./SETUP.md)**.
The minimum for the inline-diff magic: install & enable [`drift-inline`](./drift-inline/)
plus at least one of Claudian / Claude Sidebar, and **do not** enable the original `drift`
plugin (it conflicts).
