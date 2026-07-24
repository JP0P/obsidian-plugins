# Google Calendar — Setup

Plugin: **[Google Calendar](https://github.com/YukiGasai/obsidian-google-calendar)** by YukiGasai.
Purpose: view your Google Calendar (Timeline / Schedule) in an Obsidian sidebar.

> 🔒 **Credentials are not in this repo.** We use a **shared org OAuth client**. Get the
> **Client ID** and **Client Secret** privately from the maintainer — do not commit them
> anywhere.

## If you're in our Google Workspace org

You do **not** need your own Google Cloud project. Reuse the shared client and log in with
your work account — you'll see your own calendar. The OAuth consent screen is **Internal**,
so it only works for accounts in our org.

1. **Settings → Community plugins → Browse → "Google Calendar" → Install → Enable.**
2. **Settings → Google Calendar** → turn **Use custom client** ON.
3. Paste the **Client ID** and **Client Secret** you got from the maintainer.
4. Click **Login** → authorize with your **work account** → Allow. (An
   "internal/unverified app" screen is expected — continue.)
5. **Cmd/Ctrl+P → "Open gCal Timeline View"** → drag the panel to the sidebar →
   right-click the tab → **Pin**.

## Notes & troubleshooting

- There's no "day view" command — use **Timeline View** (hourly) or **Schedule View** (agenda).
- Blank view or an auth loop usually means a wrong redirect URI or a **trailing space** in
  the pasted secret.
- **Not in our org** (personal Gmail / another company)? The shared client won't work —
  you'd need to create your own Google Cloud project and OAuth client.

## Admin only — recreating the shared client

Only needed if the shared client is ever deleted.

- Application type: **Web application**
- Authorized **redirect URIs** (not JavaScript origins):
  - `http://127.0.0.1:42813/callback`
  - `https://google-auth-obsidian-redirect.vercel.app/callback`
- Enable the **Google Calendar API** in the same project.
- Keep the consent screen **Internal**.
