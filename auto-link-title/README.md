# Auto Link Title (Modified)

Based on [Auto Link Title v1.5.5](https://github.com/zolrath/obsidian-auto-link-title) by Matt Furden.

## What's Changed

### Feature: Asana API integration for task/project titles

**Problem:** When pasting Asana URLs, the plugin scrapes the page's `<title>` tag, which is generic and unhelpful (e.g., just "Asana"). The actual task or project name isn't in the HTML title.

**Fix:** Added Asana API support that fetches the real task/project name before falling back to normal scraping.

**How it works:**
1. Configure your Asana Personal Access Token in the plugin settings (get one at https://app.asana.com/0/my-apps)
2. When you paste an Asana URL, the plugin detects it and calls the Asana API to get the task or project name
3. Supports both URL formats:
   - New: `/1/{workspace_gid}/project/{project_gid}/task/{task_gid}`
   - Old: `/0/{project_gid}/{task_gid}/f`
4. Tries task lookup first, falls back to project lookup
5. If the Asana API fails or no token is set, falls back to normal title scraping

**Example:**
```
Before (original plugin):
[Asana](https://app.asana.com/1/123/project/456/task/789)

After (with Asana token configured):
[Migrate Blockbook Status Dashboard to TypeScript](https://app.asana.com/1/123/project/456/task/789)
```

## Settings

| Setting | Description |
|---------|-------------|
| **Asana Personal Access Token** | Your Asana PAT for fetching task/project titles. Leave blank to disable Asana integration. |

## Installation

Copy `main.js`, `manifest.json`, and `styles.css` into your vault at:

```
.obsidian/plugins/obsidian-auto-link-title/
```

Then restart Obsidian or reload plugins.
