# Rollover Daily Todos (Modified)

Based on [Rollover Daily Todos v1.2.0](https://github.com/lumoe/obsidian-rollover-daily-todos) by Lukas Molschl (originally by Matthew Sessions).

## What's Changed

### Fix: Completed child tasks no longer rolled over as unfinished

**Problem:** When `rolloverChildren` is enabled, the plugin grabs all children of an unfinished parent todo — including completed ones. This means a checked-off subtask like `- [x] Done thing` would get rolled over to today's Objectives as if it were still pending. If `copyCompletedTasks` is also enabled, the same completed child would appear *twice* in today's note (once under Objectives, once under Recaps).

**Fix:** `getTodos()` now filters out completed children so they are only handled by `getCompletedTodos()`. Unfinished children still roll over normally.

**Example — before fix:**
```
# Objectives (today, after rollover):
- [ ] Support Infra
  - [x] Sync w/ michael on macros thing   <-- shouldn't be here, it's done!
  - [ ] Work on lead-to-user flow

# Recaps (today, after rollover):
- Support Infra
  - Sync w/ michael on macros thing        <-- duplicate
```

**Example — after fix:**
```
# Objectives (today, after rollover):
- [ ] Support Infra
  - [ ] Work on lead-to-user flow

# Recaps (today, after rollover):
- Support Infra
  - Sync w/ michael on macros thing        <-- only appears here
```

## Installation

Copy `main.js` and `manifest.json` into your vault at:

```
.obsidian/plugins/obsidian-rollover-daily-todos/
```

Then restart Obsidian or reload plugins.
