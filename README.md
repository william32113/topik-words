# Learn Korean TOPIK App

This repository includes a browser-based `PWA` version designed for personal use on iPhone without needing the App Store.

## Product Goal

Build a lightweight and pleasant TOPIK learning app that helps Chinese-speaking learners study Korean vocabulary with:

- TOPIK level filtering
- Korean word, pronunciation, and Chinese meaning
- example sentences
- flashcards
- quiz mode
- favorites and progress tracking

## Current PWA Features

1. `TOPIK 1` to `TOPIK 6` level tabs
2. Search by Korean, romanization, or Chinese meaning
3. Word detail popup with example sentence
4. Korean pronunciation using browser speech synthesis
5. Favorites saved in local storage
6. Flashcard review mode
7. Simple multiple-choice quiz
8. Installable PWA with offline cache

## Windows-Friendly Stack

- UI: `HTML`, `CSS`, `JavaScript`
- Installable shell: `PWA`
- Persistence: `localStorage`
- Audio: browser `SpeechSynthesis`
- Offline: `Service Worker`

## Folder Guide

- `index.html`
  - main PWA screen
- `styles.css`
  - mobile-first UI styling
- `app.js`
  - app logic, flashcards, quiz, favorites, speech
- `manifest.webmanifest`
  - install metadata
- `service-worker.js`
  - offline support
- `data/`
  - sample TOPIK vocabulary JSON
- `docs/`
  - product notes
- `ios-app/TopikWord/`
  - earlier SwiftUI starter files if you later move to native iOS

## Run Locally On Windows

Because browsers block some local file features, use a tiny local server.

### Option 1: Python

```bash
python -m http.server 8080
```

Then open:

`http://localhost:8080`

### Option 2: VS Code Live Server

Open the folder in VS Code and run Live Server.

## Use On iPhone

1. Put the project on a reachable web host or your local network.
2. Open it in `Safari` on iPhone.
3. Tap `Share`.
4. Tap `Add to Home Screen`.
5. Launch it like a normal app icon.

## Later Native Upgrade

If you later get access to a Mac, you can still reuse the vocabulary/content plan and move toward the SwiftUI starter under `ios-app/TopikWord/`.
