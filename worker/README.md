# H.O.P.E. TURN credential worker

A tiny Cloudflare Worker that mints short-lived [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/)
credentials and hands them to the browser. The frontend calls it at connect
time; the Cloudflare API token stays here as a secret and never ships to the
client.

## One-time setup

1. **Create a TURN key.** Cloudflare Dashboard → **Realtime → TURN → Create**.
   Copy the **TURN Key ID** and **API Token**.

2. **Install & log in.**
   ```bash
   cd worker
   npm install
   npx wrangler login
   ```

3. **Set the secrets** (stored in Cloudflare, never committed):
   ```bash
   npx wrangler secret put TURN_KEY_ID          # paste the key id
   npx wrangler secret put TURN_KEY_API_TOKEN   # paste the API token
   ```

4. **Lock the origin.** In `wrangler.toml`, set `ALLOWED_ORIGIN` to your exact
   Pages origin, e.g. `https://<user>.github.io`. (`*` works but lets any site
   spend your TURN quota.)

5. **Deploy.**
   ```bash
   npx wrangler deploy
   ```
   Wrangler prints the Worker URL, e.g. `https://hope-turn.<subdomain>.workers.dev`.

## Wire it into the site

Set the frontend's ICE endpoint to the Worker URL and redeploy the site:

- Repo → Settings → Secrets and variables → **Actions → Variables** →
  add `ICE_SERVERS_URL = https://hope-turn.<subdomain>.workers.dev`
- Re-run the **Deploy to GitHub Pages** workflow.

The client fetches fresh ICE servers from the Worker on each connect and
caches them until shortly before they expire. If the fetch fails it falls
back to any build-time `TURN_URLS` / then PeerJS public defaults.

## Verify

```bash
curl https://hope-turn.<subdomain>.workers.dev
# → {"iceServers":{"urls":[...],"username":"...","credential":"..."},"ttl":86400}
```
