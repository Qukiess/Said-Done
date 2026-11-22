# Said & Done

A warm, private diary. Write or speak your day, keep a gentle streak with rest days, and follow your goals.

## Use it on iPhone

1. Open https://qukiess.github.io/Said-Done/ in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open Said & Done from the home screen. Write there, not in the Safari tab: iPhone keeps the two separately.

## What is in version 0.1

- Today: write an entry, or record a voice note (with live transcription where the phone supports it)
- Your days: a monthly calendar with your streak, longest streak and rest days (2 per month), search, edit and delete
- Goals: this month, 3 months, 6 months or this year; count times per week or a total
- Passcode lock, export and restore of backups
- The logo drawing animation on first launch, and the page tear at the start of each month

Everything is stored on the device (IndexedDB). Nothing is sent to a server.

## Project layout

- `docs/`: the web app, served by GitHub Pages. No build step.
- `ios/`: an early SwiftUI prototype for a possible native version later.
