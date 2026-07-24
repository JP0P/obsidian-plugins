# Asana — Setup

Two plugins use Asana, and **both read an Asana Personal Access Token (PAT)**:

- **Asana** (`asana`) — create Asana tasks from highlighted text / the current line.
- **Auto Link Title** (custom) — pasting an Asana URL resolves to the real task/project
  name instead of the generic "Asana" page title.

> 🔑 **Your PAT is personal — generate your own.** It is **not** a shared secret and must
> **never** be committed. Each person creates their own and pastes it into their local
> plugin settings.

## 1. Create your Personal Access Token

1. Go to **[Asana → My Settings → Apps → Manage Developer Apps](https://app.asana.com/0/my-apps)**
   (or directly the "Personal access tokens" section).
2. **Create new token**, name it (e.g. "Obsidian"), and copy it. You won't see it again.

## 2. Paste it into each plugin

- **Asana plugin:** Settings → **Asana** → paste the PAT.
- **Auto Link Title:** Settings → **Auto Link Title** → paste the **same** PAT.
  Leave blank to disable Asana title resolution (normal link-title scraping still works).

## How Auto Link Title uses it

Pasting an Asana URL with the stock plugin scrapes the page `<title>`, which is just
"Asana" (the task name isn't in the HTML). Our custom version calls the Asana API to get
the actual name, then falls back to normal scraping if there's no token or the API fails.

Supported URL formats:
- New: `/1/{workspace_gid}/project/{project_gid}/task/{task_gid}`
- Old: `/0/{project_gid}/{task_gid}/f`

It tries a task lookup first, then a project lookup.

> **Note:** the Community-plugins store has the *stock* Auto Link Title without Asana
> support. Install our version from this repo
> ([`obsidian-auto-link-title/`](../obsidian-auto-link-title/)), not the store.
