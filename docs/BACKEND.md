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

Watch the logs live while you scan:

```cmd
supabase functions logs extract-label --tail
```

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
