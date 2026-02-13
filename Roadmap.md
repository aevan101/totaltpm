# Total TPM Roadmap

## Data Backup & Sync

- **Track app-data.json in git** — Remove from `.gitignore` so user data is pushed/pulled with code. Simple but risks merge conflicts if both computers edit between syncs.
- **Automated local backups** — Periodically copy `app-data.json` to iCloud Drive, Dropbox, or another synced folder. Low effort, decent safety net.
- **Cloud database** — Replace the JSON file with a service like Supabase or Firebase. Enables real-time sync across computers with automatic backup. Significantly more work.

## UX Improvements

- **Kanban card reordering within columns** — Currently cards drop at the end of a column. Support drag-to-reorder within the same column based on pointer position.
