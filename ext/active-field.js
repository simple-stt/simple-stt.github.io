(function () {
  function getFocusedElementSnapshot(options, callback) {
    const opts = options && typeof options === 'object' ? options : {}
    const done = typeof callback === 'function' ? callback : function () {}
    const currentWindowOnly = opts.currentWindowOnly !== false

    chrome.tabs.query({ active: true, currentWindow: currentWindowOnly }, tabs => {
      const currentTab = tabs[0]
      if (!currentTab || !currentTab.id) {
        done(null)
        return
      }
      if (currentTab.url && currentTab.url.startsWith(chrome.runtime.getURL(''))) {
        done(null)
        return
      }
      if (window.SimpleSttSettings.isRestrictedUrl(currentTab.url)) {
        done(null)
        return
      }

      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: () => {
          const activeElement = document.activeElement
          if (!activeElement) return null

          if (typeof activeElement.selectionStart === 'number' && typeof activeElement.selectionEnd === 'number') {
            return {
              kind: 'text-control',
              valueLength: String(activeElement.value || '').length,
              selectionStart: activeElement.selectionStart,
              selectionEnd: activeElement.selectionEnd,
            }
          }

          if (activeElement.isContentEditable) {
            const selection = window.getSelection()
            return {
              kind: 'contenteditable',
              textLength: String(activeElement.innerText || '').length,
              selectionTextLength: selection ? String(selection.toString() || '').length : 0,
            }
          }

          return null
        },
      }, results => {
        const snapshot = chrome.runtime.lastError || !results || !results[0] ? null : results[0].result
        done(snapshot)
      })
    })
  }

  function insertTextIntoFocusedElement(text, options, callback) {
    const message = String(text || '')
    const opts = options && typeof options === 'object' ? options : {}
    const done = typeof callback === 'function' ? callback : function () {}
    if (!message) {
      done(false)
      return
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const currentTab = tabs[0]
      if (!currentTab || !currentTab.id) {
        done(false)
        return
      }
      if (currentTab.url && currentTab.url.startsWith(chrome.runtime.getURL(''))) {
        done(false)
        return
      }
      if (window.SimpleSttSettings.isRestrictedUrl(currentTab.url)) {
        done(false)
        return
      }

      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: payload => {
          const activeElement = document.activeElement
          if (!activeElement) return false

          const now = Date.now()
          const lastText = activeElement.dataset ? activeElement.dataset.simpleSttLastInsertText : ''
          const lastAt = activeElement.dataset ? Number(activeElement.dataset.simpleSttLastInsertAt || 0) : 0
          if (lastText === payload.text && now - lastAt < 700) return false

          if (activeElement.dataset) {
            activeElement.dataset.simpleSttLastInsertText = payload.text
            activeElement.dataset.simpleSttLastInsertAt = String(now)
          }

          if (typeof activeElement.setRangeText === 'function') {
            const start = activeElement.selectionStart
            const end = activeElement.selectionEnd
            activeElement.setRangeText(payload.text, start, end, 'end')
            activeElement.dispatchEvent(new Event('input', { bubbles: true }))
            activeElement.focus()
            return true
          }

          if (activeElement.isContentEditable) {
            document.execCommand('insertText', false, payload.text)
            return true
          }

          return false
        },
        args: [{ text: message, meta: opts.meta || null }],
      }, results => {
        if (chrome.runtime.lastError || !results || !results[0]) {
          done(false)
          return
        }

        done(Boolean(results[0].result))
      })
    })
  }

  window.SimpleSttActiveField = {
    getFocusedElementSnapshot,
    insertTextIntoFocusedElement,
  }
})()
