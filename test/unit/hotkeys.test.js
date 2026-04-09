const { expect } = require('chai')

const hotkeys = require('../../ext/lib/hotkeys')

describe('hotkeys', () => {
  it('normalizes modifier aliases and key casing', () => {
    expect(hotkeys.normalizeHotkey('command+shift+r')).to.equal('Cmd+Shift+R')
    expect(hotkeys.normalizeHotkey('control+alt+k')).to.equal('Ctrl+Alt+K')
  })

  it('falls back to the default hotkey when the value is blank', () => {
    expect(hotkeys.normalizeHotkey('')).to.equal(hotkeys.DEFAULT_TOGGLE_HOTKEY)
  })

  it('matches keyboard events against a normalized hotkey', () => {
    const matches = hotkeys.matchesHotkeyEvent('Alt+Shift+R', {
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      key: 'r',
    })

    expect(matches).to.equal(true)
  })
})
