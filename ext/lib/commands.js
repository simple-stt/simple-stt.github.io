(function (root, factory) {
  const exported = factory()

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.commands = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function buildCommandReplacements(commandPhrases) {
    const phrases = commandPhrases && typeof commandPhrases === 'object'
      ? commandPhrases
      : {}

    return [
      { phrase: phrases.paragraphBreak, value: '\n\n' },
      { phrase: phrases.lineBreak, value: '\n' },
    ]
  }

  function transformTranscriptText(text, commandPhrases) {
    let result = String(text || '')

    buildCommandReplacements(commandPhrases).forEach(item => {
      const phrase = String(item.phrase || '').trim()
      if (!phrase) return
      result = result.replace(new RegExp(escapeRegExp(phrase), 'gi'), item.value)
    })

    return result
  }

  return {
    buildCommandReplacements,
    escapeRegExp,
    transformTranscriptText,
  }
})
