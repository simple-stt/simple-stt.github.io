(function (root, factory) {
  const exported = factory()

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.speechErrors = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function formatSpeechError(code) {
    const messages = {
      'audio-capture': 'Microphone unavailable',
      'copy-failed': 'Copy failed',
      'NotAllowedError': 'Permission denied',
      'network': 'Speech network error',
      'not-allowed': 'Permission denied',
      'NotFoundError': 'Microphone unavailable',
      'service-not-allowed': 'Speech service not allowed',
      'speech-not-supported': 'Speech unavailable',
    }

    return messages[code] || 'Speech recognition error'
  }

  return {
    formatSpeechError,
  }
})
