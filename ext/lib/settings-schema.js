(function (root, factory) {
  const hotkeys = typeof module === 'object' && module.exports
    ? require('./hotkeys')
    : root.SimpleSttLib.hotkeys

  const exported = factory(hotkeys)

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.settingsSchema = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (hotkeys) {
  const DEFAULTS = {
    commandPhrases: {
      lineBreak: 'carriage return',
      paragraphBreak: 'double carriage return',
    },
    hotkeys: {
      toggleTranscribing: hotkeys.DEFAULT_TOGGLE_HOTKEY,
    },
    speech: {
      language: 'en-US',
      voiceName: 'Google US English',
    },
    insertIntoActiveField: true,
  }

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULTS))
  }

  function normalizeSettings(raw) {
    const defaults = cloneDefaults()
    const source = raw && typeof raw === 'object' ? raw : {}
    const phrases = source.commandPhrases && typeof source.commandPhrases === 'object'
      ? source.commandPhrases
      : {}
    const sourceHotkeys = source.hotkeys && typeof source.hotkeys === 'object'
      ? source.hotkeys
      : {}
    const sourceSpeech = source.speech && typeof source.speech === 'object'
      ? source.speech
      : {}

    return {
      commandPhrases: {
        lineBreak: String(phrases.lineBreak || defaults.commandPhrases.lineBreak).trim() || defaults.commandPhrases.lineBreak,
        paragraphBreak: String(phrases.paragraphBreak || defaults.commandPhrases.paragraphBreak).trim() || defaults.commandPhrases.paragraphBreak,
      },
      hotkeys: {
        toggleTranscribing: hotkeys.normalizeHotkey(
          sourceHotkeys.toggleTranscribing,
          defaults.hotkeys.toggleTranscribing
        ),
      },
      speech: {
        language: String(
          sourceSpeech.language || defaults.speech.language
        ).trim() || defaults.speech.language,
        voiceName: String(
          sourceSpeech.voiceName || defaults.speech.voiceName
        ).trim() || defaults.speech.voiceName,
      },
      insertIntoActiveField: source.insertIntoActiveField !== false,
    }
  }

  function mergeSettings(current, partial) {
    const source = normalizeSettings(current)
    const patch = partial && typeof partial === 'object' ? partial : {}

    return normalizeSettings({
      ...source,
      ...patch,
      commandPhrases: {
        ...source.commandPhrases,
        ...(patch.commandPhrases || {}),
      },
      hotkeys: {
        ...source.hotkeys,
        ...(patch.hotkeys || {}),
      },
      speech: {
        ...source.speech,
        ...(patch.speech || {}),
      },
    })
  }

  function serializeSettings(value) {
    return JSON.stringify(normalizeSettings(value))
  }

  return {
    DEFAULTS,
    cloneDefaults,
    mergeSettings,
    normalizeSettings,
    serializeSettings,
  }
})
