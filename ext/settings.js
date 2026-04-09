(function () {
  const hotkeys = window.SimpleSttLib.hotkeys
  const settingsSchema = window.SimpleSttLib.settingsSchema

  const STORAGE_KEY = 'simpleSttSettings'
  const THEME_COLORS = {
    primary: '#5876ad',
    accent: '#7ee476',
    error: '#d86464',
    warning: '#f0b25b',
  }

  function isRestrictedUrl(url) {
    const value = String(url || '').trim()
    if (!value) return true
    if (value.startsWith('chrome://')) return true
    if (value.startsWith('devtools://')) return true
    if (value.startsWith('about:')) return true
    if (value.startsWith('view-source:')) return true
    if (value.startsWith('edge://')) return true
    if (value.startsWith('brave://')) return true
    if (value.startsWith('opera://')) return true
    if (value.startsWith('vivaldi://')) return true
    if (value.startsWith('chrome-extension://')) {
      return !value.startsWith(chrome.runtime.getURL(''))
    }
    return false
  }

  function openOrFocusExtensionPage(path) {
    const normalizedPath = String(path || '').trim().replace(/^\/+/, '')
    const targetUrl = chrome.runtime.getURL(normalizedPath)

    return new Promise(resolve => {
      chrome.tabs.query({}, tabs => {
        const existingTab = tabs.find(tab => tab && tab.url === targetUrl)

        if (existingTab) {
          chrome.tabs.update(existingTab.id, { active: true }, () => {
            if (existingTab.windowId) chrome.windows.update(existingTab.windowId, { focused: true }, () => resolve(existingTab))
            else resolve(existingTab)
          })
          return
        }

        chrome.tabs.create({ url: targetUrl }, tab => resolve(tab))
      })
    })
  }

  function applyThemeVars(targetDocument) {
    const doc = targetDocument || document
    if (!doc || !doc.documentElement) return

    doc.documentElement.style.setProperty('--simple-stt-primary', THEME_COLORS.primary)
    doc.documentElement.style.setProperty('--simple-stt-accent', THEME_COLORS.accent)
    doc.documentElement.style.setProperty('--simple-stt-error', THEME_COLORS.error)
    doc.documentElement.style.setProperty('--simple-stt-warning', THEME_COLORS.warning)
  }

  function getSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get([STORAGE_KEY], result => {
        resolve(settingsSchema.normalizeSettings(result[STORAGE_KEY]))
      })
    })
  }

  function saveSettings(partial) {
    return new Promise(resolve => {
      getSettings().then(current => {
        const next = settingsSchema.mergeSettings(current, partial)
        chrome.storage.sync.set({ [STORAGE_KEY]: next }, () => resolve(next))
      })
    })
  }

  function resetSettings() {
    const next = settingsSchema.cloneDefaults()
    return new Promise(resolve => {
      chrome.storage.sync.set({ [STORAGE_KEY]: next }, () => resolve(next))
    })
  }

  window.SimpleSttSettings = {
    defaults: settingsSchema.cloneDefaults,
    get: getSettings,
    isRestrictedUrl,
    matchesHotkeyEvent: hotkeys.matchesHotkeyEvent,
    normalize: settingsSchema.normalizeSettings,
    normalizeHotkey: hotkeys.normalizeHotkey,
    openOrFocusExtensionPage,
    parseHotkey: hotkeys.parseHotkey,
    applyThemeVars,
    save: saveSettings,
    serialize: settingsSchema.serializeSettings,
    reset: resetSettings,
    storageKey: STORAGE_KEY,
    themeColors: THEME_COLORS,
  }
})()
