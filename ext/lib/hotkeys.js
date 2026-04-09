(function (root, factory) {
  const exported = factory()

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.hotkeys = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_TOGGLE_HOTKEY = 'Alt+Shift+R'
  const MODIFIER_ORDER = ['Ctrl', 'Cmd', 'Alt', 'Shift']
  const MODIFIER_ALIASES = {
    alt: 'Alt',
    cmd: 'Cmd',
    command: 'Cmd',
    control: 'Ctrl',
    ctrl: 'Ctrl',
    meta: 'Cmd',
    option: 'Alt',
    shift: 'Shift',
  }
  const KEY_ALIASES = {
    enter: 'Enter',
    esc: 'Escape',
    escape: 'Escape',
    space: 'Space',
    tab: 'Tab',
  }

  function normalizeMainKey(token) {
    if (!token) return ''
    const lower = token.toLowerCase()

    if (KEY_ALIASES[lower]) return KEY_ALIASES[lower]
    if (token.length === 1) return token.toUpperCase()
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
  }

  function normalizeHotkey(value, fallback) {
    const fallbackValue = String(fallback || DEFAULT_TOGGLE_HOTKEY)
    const raw = String(value || '').trim()
    if (!raw) return fallbackValue

    const seen = {}
    let key = ''

    raw.split('+').map(part => part.trim()).filter(Boolean).forEach(token => {
      const lower = token.toLowerCase()
      if (MODIFIER_ALIASES[lower]) {
        seen[MODIFIER_ALIASES[lower]] = true
        return
      }

      key = normalizeMainKey(token)
    })

    if (!key) return fallbackValue

    return MODIFIER_ORDER.filter(name => seen[name]).concat(key).join('+')
  }

  function parseHotkey(value, fallback) {
    const normalized = normalizeHotkey(value, fallback)
    const parts = normalized.split('+')
    const key = parts.pop() || ''

    return {
      alt: parts.includes('Alt'),
      ctrl: parts.includes('Ctrl'),
      key,
      meta: parts.includes('Cmd'),
      normalized,
      shift: parts.includes('Shift'),
    }
  }

  function matchesHotkeyEvent(value, event, fallback) {
    const hotkey = parseHotkey(value, fallback)
    const eventKey = String(event && event.key ? event.key : '').trim()
    if (!event || !eventKey) return false

    return Boolean(event.altKey) === hotkey.alt &&
      Boolean(event.ctrlKey) === hotkey.ctrl &&
      Boolean(event.metaKey) === hotkey.meta &&
      Boolean(event.shiftKey) === hotkey.shift &&
      normalizeMainKey(eventKey) === hotkey.key
  }

  return {
    DEFAULT_TOGGLE_HOTKEY,
    matchesHotkeyEvent,
    normalizeHotkey,
    parseHotkey,
  }
})
