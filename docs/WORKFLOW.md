# Working in parallel: Ansh on the UI, you on the backend

The single rule that prevents almost every problem: **you two edit different
folders.** Git only conflicts when two people change the same lines of the same
file, so if the folders never overlap, merges stay boring.

---

## Who owns what

### Ansh — frontend

```
src/pages/          all screens
src/components/     shared UI pieces
src/index.css       design tokens, utility classes
tailwind.config.js  palette, type scale, spacing
public/             static images
```

### You — backend and logic

```
src/lib/            quality gate, OCR, extraction, rule engine, barcode, share
src/scan/           the pipeline runner and demo samples
src/store/          app state
src/i18n/           translations
scripts/            build and test tooling
android/            native shell
.github/            CI
```

### Shared — talk before editing

```
src/App.tsx         routes
package.json        dependencies
capacitor.config.ts native config
```

Only three files are shared, and they change rarely.

---

## The contract between you

Ansh's screens never compute anything. They read from the store and call
functions from `src/lib`. That keeps his work purely visual.

```tsx
// Any page Ansh builds looks like this:
import { useApp } from '../store/app'

export default function SomeScreen() {
  const { scans } = useApp()          // data comes from your side
  return <div>{/* his markup */}</div> // he owns everything in here
}
```

If he needs a new piece of data, he asks you for it rather than computing it in
the component. If you change a field name in the store, you tell him.

The shape he can rely on is in `src/store/app.ts` — `StoredScan`. Treat it as a
published interface: add fields freely, but renaming or removing one is a
conversation.

---

## Daily loop

### Ansh (UI work) — browser only

```cmd
npm run dev
```

Opens on `http://localhost:5173`. Every save refreshes instantly. He should
**never** build an APK for normal UI work; it is fifty times slower and gains
him nothing. Chrome's device toolbar (F12, then Ctrl+Shift+M, pick a phone)
matches the real thing closely enough.

To check on a real phone without installing anything, he can open his laptop's
LAN address on his phone's browser — `npm run dev` already binds to the network,
and the terminal prints the URL.

### You (backend work)

```cmd
npm run dev        # UI to click through
npm run verify     # rule-engine tests, run this often
```

`npm run verify` is your safety net. It runs the real extractor and engine
against known label text and asserts the verdicts. Run it after any change to
`src/lib` — it catches mistakes in seconds that would take ten minutes to find
by hand on a phone.

---

## Branches

```cmd
git checkout -b ui-work        # Ansh
git checkout -b backend-work   # you
```

Both push their own branch. Merge into `main` when a piece is finished:

```cmd
git checkout main
git pull
git merge ui-work
git push origin main
```

Pull from `main` daily so you never drift far apart:

```cmd
git checkout ui-work
git merge main
```

Merging often means small, easy merges. Merging once a week means pain.

If you prefer to skip branches entirely, that also works — just run
`git pull` **before** you start editing and `git push` as soon as you finish.

---

## Does the app update itself from GitHub?

**No.** An installed APK is frozen. New code on GitHub does not reach a phone
that already has the app; you install the new APK over the old one. Android
keeps your data as long as the package name is unchanged, so it is an upgrade,
not a fresh install — no need to uninstall first.

You have three ways to see changes on a phone, from fastest to slowest:

### 1. Live reload — instant, no rebuild

The APK loads the UI from your laptop over WiFi. Save a file, the phone updates.

Phone and laptop must be on the same WiFi, and the phone must be plugged in with
USB debugging enabled.

```cmd
npm run android:live
```

Capacitor works out your LAN address, installs a dev build, and connects it.
This is the right tool when Ansh wants to check a screen on real hardware.

Stop the command and the app goes back to its bundled copy.

### 2. Rebuild the APK locally — about two minutes

Needs Android Studio installed.

```cmd
npm run android:sync
cd android
gradlew.bat assembleDebug
```

APK appears at `android\app\build\outputs\apk\debug\app-debug.apk`. Copy it to
the phone and tap it. It installs over the top.

### 3. Let CI build it — about five minutes, nothing installed locally

Push to `main`, then Actions → newest run → **Artifacts** →
`CheckMyPack-apk-buildNN`. The build number is in the filename, so you always
know which one you are holding.

---

## Avoiding build failures

Nearly every Gradle failure we hit came from one of these. Check them first.

**Always sync before building.** Changing `src/` does nothing to the APK until
the web bundle is copied into the native project:

```cmd
npm run android:sync
```

Skipping this is the most common cause of "I fixed it but the app still shows
the old thing".

**After `npm install` of any Capacitor plugin, sync again.** New plugins need
their native code registered.

**Do not hand-edit `android/app/src/main/assets/public/`.** It is generated;
your changes get wiped on the next sync. It is gitignored for that reason.

**Do not add duplicate resource names.** Two files declaring the same
`<color name="...">` fails the build. If you need a new colour, add it to
`android/app/src/main/res/values/colors.xml` only.

**Regenerate icons with the script, not by hand:**

```cmd
npm run android:icons
```

**If Gradle behaves strangely, clear its cache:**

```cmd
cd android
gradlew.bat clean
```

**Version floor:** the Capacitor camera plugin requires `minSdkVersion = 24`
(Android 7.0), and current androidx needs `compileSdkVersion = 36` with Android
Gradle plugin 8.9.1. These are set in `android/variables.gradle` and
`android/build.gradle`. Leave them alone unless a build error asks otherwise.

---

## Before every push

```cmd
npm run verify     # engine tests pass
npm run build      # TypeScript compiles
```

Thirty seconds locally saves a five-minute round trip through CI. The same two
commands run in the workflow, so if they pass here they pass there.
