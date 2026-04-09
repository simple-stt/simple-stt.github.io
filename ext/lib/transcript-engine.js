(function (root, factory) {
  const exported = factory()

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.transcriptEngine = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createTranscriptState(overrides) {
    const source = overrides && typeof overrides === 'object' ? overrides : {}
    const lastSpeechCommit = source.lastSpeechCommit && typeof source.lastSpeechCommit === 'object'
      ? source.lastSpeechCommit
      : {}

    return {
      committedText: String(source.committedText || ''),
      speechInterim: String(source.speechInterim || ''),
      pendingPostSpeechText: String(source.pendingPostSpeechText || ''),
      manualEditVersion: Number(source.manualEditVersion || 0),
      lastSpeechCommit: {
        text: String(lastSpeechCommit.text || ''),
        before: String(lastSpeechCommit.before || ''),
        after: String(lastSpeechCommit.after || ''),
        at: Number(lastSpeechCommit.at || 0),
        manualEditVersion: Number(lastSpeechCommit.manualEditVersion || 0),
      },
    }
  }

  function applyTextTransform(text, transformText) {
    if (typeof transformText !== 'function') return String(text || '')
    return String(transformText(text || ''))
  }

  function appendTextWithBoundary(baseText, addition) {
    const current = String(baseText || '')
    const next = String(addition || '')
    if (!next) return current
    if (!current) return next
    if (/[\s\n]$/.test(current) || /^[\s\n]/.test(next)) return current + next
    return current + ' ' + next
  }

  function mergeTranscriptText(baseText, addition, options) {
    const opts = options && typeof options === 'object' ? options : {}
    const cleanAddition = applyTextTransform(addition, opts.transformText)
    return appendTextWithBoundary(baseText, cleanAddition)
  }

  function getDisplayedText(state, options) {
    const current = createTranscriptState(state)
    const baseText = current.speechInterim
      ? mergeTranscriptText(current.committedText, current.speechInterim, options)
      : current.committedText

    return baseText + current.pendingPostSpeechText
  }

  function applyManualInput(state, value, options) {
    const current = createTranscriptState(state)
    const nextValue = String(value || '')
    const nextState = createTranscriptState({
      ...current,
      manualEditVersion: current.manualEditVersion + 1,
    })

    if (current.speechInterim) {
      const speechDisplay = getDisplayedText({
        ...current,
        pendingPostSpeechText: '',
      }, options)

      if (nextValue.startsWith(speechDisplay)) {
        nextState.pendingPostSpeechText = nextValue.slice(speechDisplay.length)
        return nextState
      }
    }

    nextState.committedText = nextValue
    nextState.speechInterim = ''
    nextState.pendingPostSpeechText = ''
    return nextState
  }

  function applyInterimSpeech(state, text, options) {
    const current = createTranscriptState(state)
    return createTranscriptState({
      ...current,
      speechInterim: applyTextTransform(text, options && options.transformText),
    })
  }

  function shouldIgnoreDuplicateFinal(state, transcript, nextCommitted, now) {
    const current = createTranscriptState(state)
    if (transcript !== current.lastSpeechCommit.text) return false
    if (now - current.lastSpeechCommit.at >= 900) return false
    if (nextCommitted === current.lastSpeechCommit.after) return true
    return current.manualEditVersion !== current.lastSpeechCommit.manualEditVersion
  }

  function applyFinalSpeech(state, text, options) {
    const current = createTranscriptState(state)
    const opts = options && typeof options === 'object' ? options : {}
    const now = Number(opts.now || Date.now())
    const transcript = applyTextTransform(text, opts.transformText)

    if (!transcript) {
      return {
        state: current,
        appendedText: '',
        transcript: '',
        ignoredDuplicateFinal: false,
      }
    }

    const before = current.committedText
    const speechCommitted = appendTextWithBoundary(before, transcript)
    const nextCommitted = speechCommitted + current.pendingPostSpeechText

    if (shouldIgnoreDuplicateFinal(current, transcript, nextCommitted, now)) {
      return {
        state: current,
        appendedText: '',
        transcript,
        ignoredDuplicateFinal: true,
      }
    }

    return {
      state: createTranscriptState({
        ...current,
        committedText: nextCommitted,
        speechInterim: '',
        pendingPostSpeechText: '',
        lastSpeechCommit: {
          text: transcript,
          before,
          after: nextCommitted,
          at: now,
          manualEditVersion: current.manualEditVersion,
        },
      }),
      appendedText: speechCommitted.slice(before.length),
      transcript,
      ignoredDuplicateFinal: false,
    }
  }

  return {
    appendTextWithBoundary,
    applyFinalSpeech,
    applyInterimSpeech,
    applyManualInput,
    createTranscriptState,
    getDisplayedText,
    mergeTranscriptText,
    shouldIgnoreDuplicateFinal,
  }
})
