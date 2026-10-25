# CLAUDE.md — Wolf River Wood

Website client (HospCreative). Build not started yet.

## Connected services

All IDs and access notes live in the local `.env` (gitignored; template in `.env.example`). Never print tokens or
commit IDs here.

| Service | Target | `.env` keys |
|---|---|---|
| Discord | HospCreative server, `#wolfriverwood` (client updates go here) | `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_ID` |
| GitHub | `wolfriverwoodco-lab/wolfriverwood-website` (moving to a client org; update `origin` after) | `GITHUB_REPO` |
| Cloudflare | Client's own Cloudflare account | `CLOUDFLARE_ACCOUNT_ID` |
| Google Drive | Client's shared `wolfriverwood-website` folder (use rclone, `--drive-shared-with-me`) | `GDRIVE_FOLDER_ID` |

### Cloudflare auth

Use wrangler's OAuth login (it refreshes itself) and pass `CLOUDFLARE_ACCOUNT_ID`. Do not set a global
`CLOUDFLARE_API_TOKEN`: running shells keep the old value after a rotation, and it overrides OAuth (error 9109).

## Website rules

Website project: follow the global Website Projects rule (`hospcreative-site`, `websites-slop-gate`, then
`websites-quality-gate` before calling it done).
