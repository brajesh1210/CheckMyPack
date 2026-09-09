# CheckMyPack

**Scan the packet. Know the truth.**

An Android app that photographs a packaged-food label and checks it against the
**Legal Metrology (Packaged Commodities) Rules, 2011** and **FSSAI** labelling
regulations, returning **PASS / VIOLATION / RETAKE** with the exact rule cited.

> Smart India Hackathon 2026 · Problem **SIH26034** · Software · Agriculture / FoodTech / Rural

---

## The one design rule

**The AI only reads. The rule engine decides.**

A vision model transcribes what is printed on the label. It is explicitly
forbidden from mentioning laws, judging compliance, or guessing at a value it
cannot see. The verdict is then computed on the device by a deterministic
engine against a versioned rules document.

This matters for three reasons:

- The same label always produces the same verdict.
- Every finding cites a statute, so a result can be defended.
- A model error can only ever cause a *missing* field, never an invented
  violation.

## Never falsely accuse

A blurry, dark or glared photo is caught by an on-device quality gate **before**
anything is read. The app returns RETAKE and explains what to fix. It never
reports a violation it is not confident about, because a wrong accusation
against a small shopkeeper is worse than a missed one.

---

## What works today

| Area | Status |
|---|---|
| Android APK, built in CI | ✅ |
| Camera capture, gallery import | ✅ |
| Quality gate: blur, glare, darkness, contrast | ✅ |
| Client-side compression to under 500 KB | ✅ |
| Online reading — Gemini via a Supabase Edge Function | ✅ optional |
| Offline reading — Tesseract.js on-device | ✅ |
| Barcode detection + Open Food Facts cross-check | ✅ |
| Deterministic rule engine, 21 rules, LMPC + FSSAI | ✅ |
| Pan masala RSP rule, GSR 881(E) | ✅ |
| Expired-product detection and red banner | ✅ |
| On-label bounding boxes, tap-linked to the checklist | ✅ |
| Report PDF with annotated image and offline-verifiable QR | ✅ |
| WhatsApp share, one-tap 14404 | ✅ |
| Voice read-out (Web Speech) | ✅ |
| Hindi + English throughout | ✅ |
| Accounts and cross-device history (Supabase) | ✅ optional |
| Offline-first sync queue | ✅ |
| Officer console: heat map, repeat-offender registry, CSV export | ✅ |
| Sample packs demo mode | ✅ |
| Full offline operation | ✅ |

Everything marked *optional* degrades cleanly: with nothing configured the app
is a fully working offline scanner with local history.

---

## Running it

```bash
npm install
npm run dev
```

### Build the Android app

```bash
npm run build
npm run android:sync
cd android && ./gradlew assembleDebug
```

The APK lands in `android/app/build/outputs/apk/debug/`. Pushing to `main` also
builds one in CI; download it from the run's artifacts.

For day-to-day work, live reload onto a connected phone is much faster:

```bash
npm run android:live
```

### Optional backend

Copy `.env.example` to `.env.local` and fill in a Supabase project URL and anon
key to enable online reading, accounts and the shared officer console. See
[`docs/BACKEND.md`](docs/BACKEND.md) for the full setup, including how to
promote a user to a verified officer.

---

## Verifying it

```bash
npm run verify
```

Six harnesses, 145 checks, no network access required:

| Harness | Covers |
|---|---|
| `verify-engine` | Rule adjudication against real label text, date parsing |
| `verify-remote` | Online reader contract and all nine of its failure modes |
| `verify-sync` | Upload queue: retries, backoff, dedupe, guest and offline behaviour |
| `verify-report` | QR payload round-trip, size limits, hostile input |
| `verify-officer` | Analytics aggregation, offline fallback, CSV escaping |
| `verify-i18n` | Key parity, placeholder integrity, no untranslated UI |

The engine harness compiles the real `extract.ts` and `engine.ts` and runs them
over the same label text the demo uses, so the verdicts are produced by the
engine rather than hardcoded.

---

## How a scan works

```
capture → quality gate → compress → read → extract → barcode → rules → verdict
```

1. **Quality gate.** Laplacian variance for blur, highlight clipping for glare,
   luma and contrast for exposure. Fails closed to RETAKE.
2. **Compress.** Under 500 KB before anything else, so every later stage is
   working on the same small image.
3. **Read.** Gemini when configured and reachable, Tesseract otherwise. When
   the online reader is used, Tesseract still runs to supply bounding boxes.
4. **Extract.** Field matchers pull out MRP, net quantity, dates, FSSAI licence,
   customer care and the rest.
5. **Cross-check.** Barcode looked up against Open Food Facts, where the net
   quantity can be corroborated.
6. **Adjudicate.** The rule engine produces findings, each with a statute, a
   severity and guidance.

## Privacy

The photograph never leaves the device unless the user shares it. Only the
machine-readable findings are uploaded, and location is coarsened to district
before it is sent. `verify-sync` fails the build if the image bytes appear
anywhere in an outgoing row.

Scans have no update or delete policy in the database: once filed, a scan is
evidence.

---

## Stack

React 18 · TypeScript · Vite · Tailwind · Zustand · react-i18next ·
Capacitor 7 (Android) · Tesseract.js · jsPDF · Supabase (Postgres, Auth, Edge
Functions) · Gemini

Free to run: the Supabase and Gemini free tiers comfortably cover a pilot.

## Documentation

- [`docs/BACKEND.md`](docs/BACKEND.md) — deploying the Edge Function, database
  setup, accounts, sync behaviour
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — working on frontend and backend in
  parallel without breaking the build

## Disclaimer

CheckMyPack is an advisory tool. It is not a substitute for official
enforcement action, and its output is not a legal determination.
