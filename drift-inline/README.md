# Drift Inline (Original)

Cursor-style **inline diffs** for external edits to your notes. When an AI tool
(Claudian, Claude Sidebar), a sync service, or any script writes to a markdown
file, Drift Inline shows the change *inside the note* — green additions, red
strikethrough deletions — with per-change **Accept ✓ / Reject ✗** controls.

Inspired by [Drift](https://github.com/ryanbbrown/obsidian-drift) (which shows a
side-by-side diff in a separate tab), but written from scratch to render the diff
**inline in the editor**, the way Cursor's IDE does.

## Why

Inline-diff AI plugins only show a diff for edits they generate themselves. Tools
like Claudian write directly to disk, so nothing shows you an inline, reviewable
diff of what they changed. Drift Inline fills that gap — it detects the external
write and overlays a reviewable diff on the affected note.

## Features

- **Detection** — triggers on tools that change your notes (Claudian, Claude
  Sidebar, sync, scripts), with configurable filtering (see Configuration).
- **Inline rendering** — added lines highlighted green; removed lines shown as
  red strikethrough widgets; a control bar above the first change.
- **Per-hunk Accept / Reject** — resolve each change independently, plus
  **Accept all / Reject all**. Resolving one change never disturbs the others,
  and bulk actions only affect changes still pending (matches Cursor / VS Code).
- **Commands** — `Accept all changes`, `Reject all changes`,
  `Toggle external change detection` (assign hotkeys in Settings → Hotkeys).

## Configuration — what triggers a diff (v0.3.0)

Changes are classified as **internal** (made by Obsidian itself — the daily-note
button, templates, rollover-daily-todos, etc.) or **external** (a CLI tool such
as Claudian / Claude Sidebar, or sync). Internal writes are detected by
instrumenting the vault API and attributed to a plugin via the call stack.

Default policy: **diff external changes, ignore internal ones** — so the
daily-note button no longer prompts, while AI edits still do. On top of that:

- **Plugin allow-list / block-list** (by plugin id, for internal writes). The
  allow-list defaults to `claudian` so its non-CLI (`vault.process`) writes also
  diff. Add any in-process plugin id to allow it; block-list to silence one.
- **Path allow-list / block-list** (globs — `*`, `**`, trailing `/` for
  folders), e.g. only `Projects/**`, or never `Templates/`.
- **Per-file frontmatter** — skip files with `drift-inline: ignore`, or an
  opt-in-only mode (`drift-inline: true`).

> **Limitation:** the two CLI tools (Claudian, Claude Sidebar) both write via a
> subprocess, so they appear as *external* and cannot be told apart from each
> other deterministically. Per-plugin control is precise for **in-process**
> plugins.

## How it works

The changed content is already on disk (that's how it's detected), so the diff is
rendered on the *new* text using an "already-applied" model:

- **Accept** = keep the new text (already written) — just clear the overlay.
- **Reject** = write the old text back to disk.

The file is modeled as unchanged context runs interleaved with change *hunks*,
each with a `pending / accepted / rejected` status. The editor document is always
kept equal to the content implied by those statuses; internal edits are tagged so
the detector ignores its own writes.

## Install

Copy `main.js`, `manifest.json`, and `styles.css` into your vault at:

```
.obsidian/plugins/drift-inline/
```

Then reload plugins and enable **Drift Inline** in Settings → Community Plugins.

> **Note:** disable the original **Drift** plugin if you have it — both react to
> external changes and will conflict. Drift Inline warns you on load if it detects
> Drift is also enabled.

## Known limitations (v0.2.3)

- Inline overlay requires the file to be **open** in an editor; changes to
  background files raise a notice to open-and-review.
- Pending diffs are held **in memory** (not persisted across restart).
- **Line-level** diff (no intra-line/word-level highlighting yet).
- Desktop only.

## Status

Prototype (v0.2.3). Built collaboratively inside the vault with Claudian.
