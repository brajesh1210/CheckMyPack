# Backend: online label reading

## What this adds

The app already works with nothing configured: it reads labels on-device with
Tesseract and judges them with the local rule engine. This backend makes the
*reading* step faster and far more accurate on real-world packs — curved film,
mixed fonts, Hindi text — by sending the photo to Gemini through a Supabase Edge
Function.

It is an accelerator, never a dependency. If the endpoint is missing, the phone
is offline, the call times out, or the response is malformed, the pipeline
silently falls back to Tesseract. The user sees a slightly slower scan, not an
error.

## The design rule that matters

**The model only reads. The engine alone judges.**

The Edge Function's prompt forbids mentioning laws, rules, or whether anything
is missing — it transcribes declarations and returns nulls for what it cannot
see. The verdict is computed afterwards on the device by `src/lib/engine.ts`
against `rules.json`. This is what lets us defend any result on stage: the same
fields always produce the same verdict, and each finding cites a statute.

It also means a wrong answer from the model can only ever cause a missing
field — never an invented violation.

## Cost

Free in practice. Gemini's free tier covers roughly 1,500 requests a day, and
Supabase's free tier covers 500,000 function calls a month. A demo will use a
few dozen.

---

## Setting it up

You need a Supabase account (free) and a Gemini API key (free).

### 1. Get a Gemini key

https://aistudio.google.com/apikey → **Create API key** → copy it.

### 2. Create a Supabase project

https://supabase.com → **New project**. Any region near India is fine.

### 3. Install the CLI

```cmd
npm install -g supabase
supabase login
```

### 4. Link and deploy

From the project root:

```cmd
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=your_gemini_key_here
supabase functions deploy extract-label --no-verify-jwt
```

`YOUR_PROJECT_REF` is in your Supabase dashboard URL:
`https://supabase.com/dashboard/project/<THIS_PART>`

`--no-verify-jwt` lets the app call the function without a signed-in user, which
matters because guests can scan.

### 5. Point the app at it

Create `.env.local` in the project root (copy `.env.example`):

```
VITE_EXTRACT_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-label
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BUILD_ID=dev
```

The anon key is in Supabase → **Settings → API → Project API keys → anon public**.
It is safe in a client build; the Gemini key never leaves the server.

### 6. Rebuild

```cmd
npm run build
npm run android:sync
```

Vite bakes env variables in at build time, so a rebuild is required after any
change to `.env.local`.

---

## Checking it works

Scan a pack and open the result. If the online reader was used, extraction
finishes in about two seconds instead of eight, and the stored scan records
`reader: "gemini"`.

To test the function directly:

```cmd
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-label ^
  -H "Content-Type: application/json" ^
  -d "{\"image\":\"<base64 jpeg>\"}"
```

Watch the logs while you scan, in the dashboard: project → **Logs → Edge
Functions**. The CLI has no stable `functions logs` subcommand — it moves
between versions, so the dashboard is the reliable place.

## Forcing on-device reading

Useful when demonstrating the offline story, or when comparing the two readers:

```ts
runPipeline(source, onProgress, { forceLocal: true })
```

Turning off WiFi and mobile data does the same thing.

---

## How the two readers combine

When the online reader succeeds, the pipeline still runs Tesseract in the
background. This is deliberate:

- Gemini returns accurate values but no coordinates.
- Tesseract returns coordinates, which is what draws the tappable boxes on the
  result screen.

`mergeFields` keeps the online value where it exists and attaches the local
bounding box to it. If Tesseract fails, the scan proceeds without boxes rather
than failing.

## Failure behaviour, in order

| Situation | What happens |
|---|---|
| `VITE_EXTRACT_URL` unset | Tesseract only. No network calls. |
| Phone offline | Tesseract only. |
| Function returns 5xx or 429 | Falls back to Tesseract. |
| Call exceeds 12 seconds | Aborted, falls back to Tesseract. |
| Response is not valid JSON | Falls back to Tesseract. |
| Quality gate fails first | Nothing is read at all — verdict is RETAKE. |

No branch of that table shows the user an error. The worst case is a slower
scan.

---

# Accounts and sync

## What signing in changes

Nothing essential. A guest can scan, get a verdict, see history, generate a PDF
and share it. An account only adds history that survives a reinstall, and the
officer console.

This is deliberate. Requiring a login before someone can check a packet would
kill the use case at the shop counter.

## Setting it up

### 1. Run the migration

```cmd
supabase db push
```

That applies `supabase/migrations/0001_init.sql`: profiles, scans, complaints,
row-level security, and the two officer views.

### 2. Enable Google sign-in

Supabase dashboard → **Authentication → Providers → Google** → enable, and paste
a client ID and secret from the Google Cloud console.

In Google Cloud → **Credentials → OAuth client → Authorised redirect URIs**, add:

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Then in Supabase → **Authentication → URL Configuration → Redirect URLs**, add
the app's deep link so the Android shell can be returned to:

```
in.checkmypack.app://auth-callback
```

### 3. Add the URL to `.env.local`

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Rebuild afterwards — Vite bakes these in at build time.

## Promoting an officer

Officer access is granted manually, never self-service. In the Supabase SQL
editor:

```sql
update public.profiles
set role = 'officer', officer_verified = true
where id = (select id from auth.users where email = 'officer@example.gov.in');
```

A database trigger prevents a user from setting these columns on themselves, so
this is the only route.

## How syncing behaves

A scan is saved locally and shown immediately. Uploading happens afterwards in
the background, from a queue that survives app restarts.

| Situation | Behaviour |
|---|---|
| Signed out (guest) | Work is queued, nothing is sent. Signing in later drains the backlog. |
| Offline | Queued. Flushed automatically when connectivity returns. |
| Transient failure | Retried with backoff: 2s, 4s, 8s, 16s, then dropped. |
| Row rejected (RLS, bad data) | Dropped immediately — retrying cannot help. |
| Verdict is RETAKE | Never queued. An unreadable photo is not evidence. |
| Backend not configured | Queue is never used; the app is purely local. |

The user is never blocked on any of this and never shown a sync error.

## What is uploaded, and what is not

Uploaded: the verdict, grade, score, the findings with their statute
references, image quality metrics, the barcode, and a district-level location.

**Not uploaded: the photograph.** A label picture can also capture a person, a
shop front, or a bill. Only the machine-readable evidence leaves the device.
`scripts/verify-sync.mjs` asserts this — it fails if any field of the outgoing
row contains the image bytes.

Location is coarsened to district before it is sent. That supports a heat-map
without recording which shop a specific person visited.

## Scans are evidence

The `scans` table has insert and select policies but deliberately **no update
or delete policy**. A consumer cannot alter or withdraw a scan after filing it.
Findings are stored alongside the verdict and the rules version, so if the rule
engine is later corrected, historical scans can be re-adjudicated instead of
silently carrying a wrong call forward.

---

# Testing the deployed function

Do this **before** building the app. If the Gemini model name has been retired,
the function returns an error, and the app quietly falls back to Tesseract —
which looks exactly like "still getting retakes". One call settles it.

From PowerShell, in the project root:

```powershell
$b = [Convert]::ToBase64String([IO.File]::ReadAllBytes("test-packs\test-pack-compliant.jpg"))
$body = @{ image = $b; mimeType = "image/jpeg" } | ConvertTo-Json
Invoke-RestMethod `
  -Uri "https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-label" `
  -Method Post -Body $body -ContentType "application/json"
```

**Good** — a JSON object starting with `source: gemini`, plus the fields it read:

```
source model            fields
------ -----            ------
gemini gemini-3.5-flash @{mrp=₹45.00; net_qty=200 g; expiry=12/2027; ...}
```

**Bad** — `error: The reading service is unavailable.` Check why:

Look at the function's logs in the dashboard (project → **Logs → Edge
Functions**).

### When Google retires a model

Gemini model names are withdrawn a few months after Google announces it.
`gemini-2.0-flash` was switched off on 1 June 2026; the function kept calling it
and every scan came back 502, which the app reported as a retake.

The model is therefore **not** frozen in the code. It is read from the
`GEMINI_MODEL` secret, with `gemini-3.5-flash` as the default. To move to a new
one:

```cmd
supabase secrets set GEMINI_MODEL=gemini-3.8-flash
supabase functions deploy extract-label --no-verify-jwt
```

No code change, no rebuild of the app. Check what is current at
<https://ai.google.dev/gemini-api/docs/models> before choosing; prefer a
*Stable* model over a Preview one, and avoid anything with a published
shutdown date.

### Other errors worth knowing

| Response | Meaning |
| --- | --- |
| `503 The extraction service is not configured` | `GEMINI_API_KEY` was never set — run `supabase secrets set GEMINI_API_KEY=...` and redeploy |
| `502 The reading service is unavailable` | The Gemini call failed: retired model, bad key, or quota. Logs will say which |
| `400 No image was supplied` | The request body had no `image` field |

`test-packs/test-pack-violation.jpg` is the second fixture: it deliberately has
no MRP and no customer care, so a healthy reader still returns fields but the
engine reports a violation.
