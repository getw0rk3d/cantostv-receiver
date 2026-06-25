# CantosTV for Phone — Downloads & Cast Receiver

Public repo for the **CantosTV phone app**. It serves two purposes:

1. **Phone app downloads** — every version is published on the **[Releases page](https://github.com/getw0rk3d/cantostv-receiver/releases)**.
2. **Google Cast custom receiver** — `index.html` + `receiver.js`, the branded CantosTV
   receiver that runs on a Chromecast when you cast from the app.

## Download the phone app

➡️ **[Latest release (always newest version)](https://github.com/getw0rk3d/cantostv-receiver/releases/latest)**

Direct APK link (always points to the latest release — never goes stale):

```
https://github.com/getw0rk3d/cantostv-receiver/releases/latest/download/CantosTV.apk
```

### Install on an Android phone
1. Download the APK above.
2. Open it and allow **"install from unknown sources"** if prompted.
3. Install, then open **CantosTV** and sign in with your playlist
   (Xtream host / username / password, or an M3U URL).

Already installed? The app checks for updates itself via `versions.json` and prompts you in-app.

## Repo files (don't break these)

- **`index.html`, `receiver.js`** — the Google Cast custom receiver, hosted via GitHub Pages
  and registered in the Google Cast console. Casting from the phone depends on these.
- **`versions.json`** — the phone app's in-app update manifest (latest version + download URL).
  Bumped each release so existing installs get the update prompt.

## Notes

- This is the **phone** app. The Android TV / Google TV / Chromecast app is a separate build,
  distributed from [`cantostv-tv-releases`](https://github.com/getw0rk3d/cantostv-tv-releases).
- Your login is entered on the device; no credentials are bundled in the app.
