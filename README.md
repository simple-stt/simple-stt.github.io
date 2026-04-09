<p align="center">
  <img src="ext/icons/icon-256.png" alt="Simple STT logo" width="180">
</p>

<h1 align="center">Simple STT</h1>

<p align="center">
  <a href="https://github.com/simple-stt/simple-stt.github.io/actions/workflows/ci.yml">
    <img src="https://github.com/simple-stt/simple-stt.github.io/actions/workflows/ci.yml/badge.svg" alt="CI status">
  </a>
  <a href="https://github.com/simple-stt/simple-stt.github.io/actions/workflows/pages.yml">
    <img src="https://github.com/simple-stt/simple-stt.github.io/actions/workflows/pages.yml/badge.svg" alt="Pages deploy status">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License">
  </a>
</p>

<p align="center">
  Speech-to-text, simplified. Live transcription, read-aloud, voice commands,
  and a clean transcript workspace.
</p>

<p align="center">
  <a href="https://simple-stt.github.io/"><strong>Open The Hosted App</strong></a>
</p>

Simple STT is a speech-to-text browser app and extension with live transcription, read-aloud, configurable voice commands, and optional active-field insertion.

## What It Includes

* a full-page transcript workspace
* a compact popup launcher
* a settings surface for language, voice, hotkey, and command phrases
* a hosted web app at [simple-stt.github.io](https://simple-stt.github.io/)
* optional writing of final dictated text into the currently focused editable field in the active tab

## Features

* One live transcript surface with interim and final speech merged into the same textarea
* Start and stop transcription from the main app
* Read-aloud with play, pause, resume, and restart controls
* Language selection and read-aloud voice selection
* Copy, cut, and clear transcript actions
* Configurable spoken command phrases for line and paragraph breaks
* Configurable transcription toggle hotkey
* Optional active-field writing for normal web pages
* Guards against restricted browser and internal pages
* Snackbar feedback for clipboard actions, settings changes, and important errors

## Open The App

### Hosted web app

Visit [simple-stt.github.io](https://simple-stt.github.io/)

### Extension app

* Click the extension toolbar icon, then choose `Open App`
* Open settings from the popup gear or the app gear

The extension deduplicates its own app and settings tabs, so opening them again focuses the existing tab instead of creating a new copy.

## Install The Extension

1. Open `chrome://extensions` in Google Chrome
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this repository's `ext/` directory

Chrome only:

* This project is built and tested for Google Chrome
* Brave and other Chromium browsers are not supported targets for this repo

## How Transcription Works

* The main app page is the primary workspace
* Interim speech stays visible in the same textarea while speaking
* Final speech is committed into the transcript
* The transcript grows until a visual cap, then scrolls internally
* The textarea auto-focuses on load and regains focus after the main transcript actions

## Read Aloud

Simple STT can read the transcript back using the browser speech-synthesis engine.

* If text is selected, it reads the selection
* If no text is selected, it can read from the cursor position
* Restart jumps back to the beginning and starts again
* Starting read-aloud stops active transcription so the app does not transcribe its own output

## Active-Field Writing

When `Write to active field` is enabled in the main app, final dictated text is also inserted into the currently focused editable field in the active tab.

Notes:

* This only applies to normal editable pages and fields
* Restricted browser and internal pages are skipped quietly
* Turning the toggle off keeps transcription local to Simple STT
* The setting is persisted through the shared settings layer

## Spoken Commands

Simple STT replaces configured spoken phrases after recognition finalizes.

Default phrases:

* `carriage return` => newline
* `double carriage return` => blank line

You can change these in Settings.

## Keyboard Shortcuts

Default transcription toggle:

* `Alt+Shift+R`

Transcript actions in the app page:

* `Ctrl/Cmd+A` selects the transcript
* `Ctrl/Cmd+C` copies the transcript
* `Ctrl/Cmd+X` cuts the transcript

The transcription toggle hotkey is configurable in Settings.

Expected hotkey format:

* `Alt+Shift+R`
* `Cmd+Shift+R`
* `Ctrl+Alt+K`

If the saved value is blank or invalid, Simple STT falls back to the default.

## Settings

Settings currently support:

* line break phrase
* paragraph break phrase
* transcription toggle hotkey
* language
* read-aloud voice

The live `Write to active field` mode toggle stays on the main app because it is intended as a working-mode control rather than a static preference.

## Permissions

* `activeTab`: lets the extension interact with the current tab when needed
* `scripting`: used for focused-field insertion into editable pages
* `storage`: stores settings such as command phrases and the hotkey
* `tabs`: used for app and settings tab focusing and deduping

## Limitations

* Speech recognition depends on the browser's built-in speech recognition support
* Behavior is intended for Google Chrome only
* Active-field writing will not work on restricted browser and internal pages
* Dictation quality and availability depend on the browser speech engine and microphone permissions

## License

MIT. See [LICENSE](LICENSE).
