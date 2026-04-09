(function (root, factory) {
  const exported = factory(root)

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.clipboard = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  async function copyTextToClipboard(text) {
    if (
      !root.navigator ||
      !root.navigator.clipboard ||
      typeof root.navigator.clipboard.writeText !== 'function'
    ) {
      throw new Error('Clipboard unavailable')
    }

    await root.navigator.clipboard.writeText(String(text || ''))
  }

  return {
    copyTextToClipboard,
  }
})
