const clipboard = window.SimpleSttLib.clipboard
const commands = window.SimpleSttLib.commands
const hotkeys = window.SimpleSttLib.hotkeys
const speechErrors = window.SimpleSttLib.speechErrors
const speechReader = window.SimpleSttLib.speechReader
const speechSession = window.SimpleSttLib.speechSession
const transcriptEngine = window.SimpleSttLib.transcriptEngine

const app = new Vue({
  el: '#app',
  vuetify: new Vuetify({
    theme: {
      dark: true,
      themes: {
        dark: window.SimpleSttSettings.themeColors,
      },
    },
  }),
  data() {
    return {
      ...transcriptEngine.createTranscriptState(),
      settings: window.SimpleSttSettings.defaults(),
      recognitionSession: null,
      reader: null,
      draftScrollTimer: null,
      externalInsertTimer: null,
      hotkeyHandler: null,
      storageListener: null,
      pendingExternalInsert: null,
      supported: false,
      isListening: false,
      isStarting: false,
      isRecovering: false,
      recoveryReason: '',
      lastActivityAt: 0,
      speechError: '',
      readerSupported: false,
      readerVoices: [],
      selectedVoiceName: '',
      isReading: false,
      isPaused: false,
      readerCurrentChunk: '',
      readerIndex: 0,
      readerTotal: 0,
      snackbar: {
        show: false,
        text: '',
        color: '',
        timeout: 2200,
      },
      lastSnackbarKey: '',
      lastSnackbarAt: 0,
    }
  },
  computed: {
    displayedText() {
      return transcriptEngine.getDisplayedText(this.getTranscriptState())
    },
    hasText() {
      return Boolean(this.displayedText)
    },
    statusLabel() {
      if (this.isReading && !this.isPaused) return 'Reading aloud'
      if (this.isPaused) return 'Reading paused'
      if (!this.supported) return 'Unavailable'
      if (this.isStarting) return 'Starting...'
      if (this.isRecovering) return 'Reconnecting...'
      if (this.speechError) return speechErrors.formatSpeechError(this.speechError)
      if (this.isListening) return 'Transcribing'
      return 'Idle'
    },
    statusDotClass() {
      if (this.isRecovering) return 'status-warning'
      if (this.speechError) return 'status-warning'
      if (this.isListening || this.isStarting) return 'status-active'
      return 'status-idle'
    },
    toggleButtonLabel() {
      if (this.isStarting) return 'Starting...'
      return (this.isListening || this.isRecovering) ? 'Stop' : 'Start'
    },
    toggleButtonIcon() {
      return (this.isListening || this.isRecovering)
        ? 'mdi-microphone-off'
        : 'mdi-microphone'
    },
    toggleButtonColor() {
      return (this.isListening || this.isRecovering) ? 'error' : 'primary'
    },
    canToggleTranscribing() {
      return this.supported && !this.isStarting
    },
    readButtonIcon() {
      if (this.isReading && !this.isPaused) return 'mdi-pause'
      return 'mdi-play'
    },
    readButtonLabel() {
      if (this.isReading && !this.isPaused) return 'Pause'
      if (this.isPaused) return 'Resume'
      return 'Listen'
    },
  },
  watch: {
    displayedText(value) {
      if (String(value || '').trim()) return
      if (!this.isReading && !this.isPaused) return
      this.stopReading()
    },
    'settings.speech.language': function (value) {
      if (this.reader) this.reader.setLanguage(value)
      if (this.recognitionSession) this.recognitionSession.setLanguage(value)
    },
    'settings.speech.voiceName': function (value) {
      if (!this.reader) return
      this.reader.setVoiceName(value)
    },
  },
  methods: {
    getTranscriptState() {
      return transcriptEngine.createTranscriptState({
        committedText: this.committedText,
        speechInterim: this.speechInterim,
        pendingPostSpeechText: this.pendingPostSpeechText,
        manualEditVersion: this.manualEditVersion,
        lastSpeechCommit: this.lastSpeechCommit,
      })
    },
    applyTranscriptState(nextState) {
      const state = transcriptEngine.createTranscriptState(nextState)
      this.committedText = state.committedText
      this.speechInterim = state.speechInterim
      this.pendingPostSpeechText = state.pendingPostSpeechText
      this.manualEditVersion = state.manualEditVersion
      this.lastSpeechCommit = state.lastSpeechCommit
    },
    transformTranscript(text) {
      return commands.transformTranscriptText(text, this.settings.commandPhrases)
    },
    async loadSettings() {
      this.settings = await window.SimpleSttSettings.get()
    },
    async saveSettingsPatch(partial, snackbarText) {
      this.settings = await window.SimpleSttSettings.save(partial)
      if (snackbarText) this.showSnackbar(snackbarText)
    },
    handleStorageChanged(changes, areaName) {
      if (areaName !== 'sync') return
      if (!changes[window.SimpleSttSettings.storageKey]) return
      this.settings = window.SimpleSttSettings.normalize(
        changes[window.SimpleSttSettings.storageKey].newValue
      )
    },
    showSnackbar(text, color, key) {
      const now = Date.now()
      const dedupeKey = key || text
      if (dedupeKey === this.lastSnackbarKey && now - this.lastSnackbarAt < 1400) return

      this.lastSnackbarKey = dedupeKey
      this.lastSnackbarAt = now
      this.snackbar.text = text
      this.snackbar.color = color || ''
      this.snackbar.show = false
      this.$nextTick(() => {
        this.snackbar.show = true
      })
    },
    openSettingsPage() {
      window.SimpleSttSettings.openOrFocusExtensionPage('options.html')
    },
    async setInsertIntoActiveField(value) {
      await this.saveSettingsPatch(
        { insertIntoActiveField: Boolean(value) },
        value ? 'Active-field writing enabled' : 'Active-field writing disabled'
      )
      this.focusTranscriptSoon()
    },
    shellRef() {
      return this.$refs.shell || null
    },
    getTextareaElement() {
      const shell = this.shellRef()
      return shell ? shell.getTextareaElement() : null
    },
    focusTranscript(selectAll) {
      const shell = this.shellRef()
      if (!shell) return
      shell.focusTranscript(selectAll)
    },
    isTranscriptFocused() {
      const textarea = this.getTextareaElement()
      return Boolean(textarea && document.activeElement === textarea)
    },
    hasTranscriptSelection() {
      const textarea = this.getTextareaElement()
      if (!textarea) return false

      return typeof textarea.selectionStart === 'number' &&
        typeof textarea.selectionEnd === 'number' &&
        textarea.selectionStart !== textarea.selectionEnd
    },
    getReadingContext(options) {
      const shell = this.shellRef()
      if (!shell) {
        return { mode: 'full', start: 0, text: String(this.displayedText || '').trim() }
      }

      return shell.getReadingContext(this.displayedText, options)
    },
    scheduleDraftScroll() {
      if (this.draftScrollTimer) clearTimeout(this.draftScrollTimer)
      this.$nextTick(() => {
        this.draftScrollTimer = setTimeout(() => {
          this.draftScrollTimer = null
          this.scrollDraftToBottom()
        }, 0)
      })
    },
    clearPendingExternalInsert() {
      this.pendingExternalInsert = null
      if (this.externalInsertTimer) {
        clearTimeout(this.externalInsertTimer)
        this.externalInsertTimer = null
      }
    },
    scrollDraftToBottom() {
      const shell = this.shellRef()
      if (!shell) return
      shell.scrollDraftToBottom()
    },
    async copyToClipboard(showFeedback) {
      try {
        await clipboard.copyTextToClipboard(this.displayedText)
        if (this.speechError === 'copy-failed') this.speechError = ''
        if (showFeedback !== false) this.showSnackbar('Copied to clipboard')
        this.focusTranscriptSoon()
        return true
      } catch (err) {
        this.speechError = 'copy-failed'
        this.showSnackbar('Copy failed', 'warning')
        return false
      }
    },
    async cutTranscript() {
      if (!this.displayedText) return
      const copied = await this.copyToClipboard(false)
      if (!copied) return
      this.clearTranscript(false)
      this.showSnackbar('Cut to clipboard')
      this.focusTranscriptSoon()
    },
    clearTranscript(showFeedback) {
      this.clearPendingExternalInsert()
      this.applyTranscriptState(transcriptEngine.createTranscriptState())
      if (showFeedback !== false) this.showSnackbar('Transcript cleared')
      if (this.isReading || this.isPaused) this.stopReading()
      this.scheduleDraftScroll()
      this.focusTranscriptSoon()
    },
    handleManualInput(value) {
      this.clearPendingExternalInsert()
      this.applyTranscriptState(transcriptEngine.applyManualInput(
        this.getTranscriptState(),
        value
      ))
      this.scheduleDraftScroll()
    },
    handleSpeechInterim(text) {
      this.applyTranscriptState(transcriptEngine.applyInterimSpeech(
        this.getTranscriptState(),
        text,
        {
          transformText: value => this.transformTranscript(value),
        }
      ))

      if (this.speechInterim && this.speechError === 'network') this.speechError = ''
      this.scheduleDraftScroll()
    },
    queueExternalInsert(appendedText) {
      if (!this.settings.insertIntoActiveField || !appendedText) return

      const insertMeta = {
        insertId: Date.now() + Math.random(),
        manualEditVersion: this.manualEditVersion,
        externalSnapshot: null,
      }

      this.pendingExternalInsert = insertMeta
      if (this.externalInsertTimer) clearTimeout(this.externalInsertTimer)

      window.SimpleSttActiveField.getFocusedElementSnapshot({}, snapshot => {
        if (!this.pendingExternalInsert || this.pendingExternalInsert.insertId !== insertMeta.insertId) return

        insertMeta.externalSnapshot = snapshot
        this.externalInsertTimer = setTimeout(() => {
          this.externalInsertTimer = null
          if (!this.pendingExternalInsert || this.pendingExternalInsert.insertId !== insertMeta.insertId) return
          if (this.manualEditVersion !== insertMeta.manualEditVersion) {
            this.pendingExternalInsert = null
            return
          }

          window.SimpleSttActiveField.getFocusedElementSnapshot({}, currentSnapshot => {
            if (!this.pendingExternalInsert || this.pendingExternalInsert.insertId !== insertMeta.insertId) return
            if (JSON.stringify(currentSnapshot || null) !== JSON.stringify(insertMeta.externalSnapshot || null)) {
              this.pendingExternalInsert = null
              return
            }

            window.SimpleSttActiveField.insertTextIntoFocusedElement(appendedText, { meta: insertMeta }, () => {
              if (this.pendingExternalInsert && this.pendingExternalInsert.insertId === insertMeta.insertId) {
                this.pendingExternalInsert = null
              }
            })
          })
        }, 90)
      })
    },
    handleSpeechFinal(text) {
      const result = transcriptEngine.applyFinalSpeech(this.getTranscriptState(), text, {
        now: Date.now(),
        transformText: value => this.transformTranscript(value),
      })

      if (!result.transcript || result.ignoredDuplicateFinal) return

      this.applyTranscriptState(result.state)
      if (this.speechError === 'network') this.speechError = ''
      this.scheduleDraftScroll()
      this.queueExternalInsert(result.appendedText)
    },
    updateRecognitionState(state) {
      this.supported = state.supported
      this.isListening = state.isListening
      this.isStarting = state.isStarting
      this.isRecovering = Boolean(state.isRecovering)
      this.recoveryReason = String(state.recoveryReason || '')
      this.lastActivityAt = Number(state.lastActivityAt || 0)

      if (!state.error || state.error === 'no-speech' || state.error === 'aborted') {
        this.speechError = ''
        return
      }

      if (state.error === 'network' && (state.isListening || state.isStarting)) {
        this.speechError = ''
        return
      }

      this.speechError = state.error
    },
    handleReaderState(nextState) {
      this.readerSupported = Boolean(nextState.supported)
      this.isReading = Boolean(nextState.isReading)
      this.isPaused = Boolean(nextState.isPaused)
      this.readerCurrentChunk = String(nextState.currentChunk || '')
      this.readerIndex = Number(nextState.index || 0)
      this.readerTotal = Number(nextState.total || 0)
      this.selectedVoiceName = String(nextState.selectedVoiceName || '')
    },
    handleReaderVoices(payload) {
      this.readerVoices = Array.isArray(payload.voices) ? payload.voices : []
      this.selectedVoiceName = String(payload.selectedVoiceName || '')
    },
    handleReaderDone() {
      this.focusTranscriptSoon()
    },
    async stopReading() {
      if (!this.reader) return
      this.reader.stop()
      this.focusTranscriptSoon()
    },
    async pauseReading() {
      if (!this.reader) return
      this.reader.pause()
      this.focusTranscriptSoon()
    },
    async resumeReading() {
      if (!this.reader) return
      this.reader.resume()
      this.focusTranscriptSoon()
    },
    async beginReading(options) {
      if (!this.reader) return

      const context = this.getReadingContext(options)
      if (!context.text) return

      if (this.isListening || this.isStarting || this.isRecovering) {
        this.stopTranscribing()
      }

      this.reader.setLanguage(this.settings.speech.language)
      this.reader.setVoiceName(this.settings.speech.voiceName)
      this.reader.start(context.text)
      this.focusTranscriptSoon()
    },
    async restartReading() {
      if (!this.reader) return
      if (!this.displayedText.trim()) return

      if (this.isListening || this.isStarting || this.isRecovering) {
        this.stopTranscribing()
      }

      this.reader.setLanguage(this.settings.speech.language)
      this.reader.setVoiceName(this.settings.speech.voiceName)
      this.reader.restart(this.displayedText)
      this.focusTranscriptSoon()
    },
    async toggleReading() {
      if (!this.reader) return
      if (this.isReading && !this.isPaused) {
        this.pauseReading()
        return
      }

      if (this.isPaused) {
        this.resumeReading()
        return
      }

      this.beginReading()
    },
    async startTranscribing() {
      if (!this.recognitionSession) return
      if (this.isReading || this.isPaused) {
        this.stopReading()
      }
      this.speechError = ''
      this.recognitionSession.setLanguage(this.settings.speech.language)
      await this.recognitionSession.start()
      this.focusTranscriptSoon()
      this.scheduleDraftScroll()
    },
    stopTranscribing() {
      if (!this.recognitionSession) return
      this.recognitionSession.stop()
      this.focusTranscriptSoon()
      this.scheduleDraftScroll()
    },
    async toggleTranscribing() {
      if (!this.supported || this.isStarting) return
      if (this.isListening || this.isRecovering) {
        this.stopTranscribing()
        return
      }
      await this.startTranscribing()
    },
    handleGlobalKeydown(event) {
      const key = String(event.key || '').toLowerCase()

      if (hotkeys.matchesHotkeyEvent(this.settings.hotkeys.toggleTranscribing, event)) {
        event.preventDefault()
        this.toggleTranscribing()
        return
      }

      if (!(event.metaKey || event.ctrlKey) || event.altKey) return

      if (key === 'a') {
        if (this.isTranscriptFocused()) return
        event.preventDefault()
        this.focusTranscript(true)
        return
      }

      if (key === 'c') {
        if (this.isTranscriptFocused() && this.hasTranscriptSelection()) return
        event.preventDefault()
        this.copyToClipboard()
        return
      }

      if (key === 'x') {
        if (this.isTranscriptFocused() && this.hasTranscriptSelection()) return
        event.preventDefault()
        this.cutTranscript()
      }
    },
    focusTranscriptSoon() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.focusTranscript(false)
        }, 30)
      })
    },
  },
  async mounted() {
    window.SimpleSttSettings.applyThemeVars(document)
    await this.loadSettings()

    this.reader = speechReader.createSpeechReader({
      language: this.settings.speech.language,
      voiceName: this.settings.speech.voiceName,
    })
    this.reader.on('state', this.handleReaderState)
    this.reader.on('voices', this.handleReaderVoices)
    this.reader.on('done', this.handleReaderDone)
    this.reader.init()

    this.recognitionSession = speechSession.createSpeechRecognitionSession({
      language: this.settings.speech.language,
      onState: this.updateRecognitionState,
      onInterim: this.handleSpeechInterim,
      onFinal: this.handleSpeechFinal,
      onError: code => {
        if (code === 'no-speech' || code === 'aborted' || code === 'network') return
        this.speechError = code
        this.showSnackbar(speechErrors.formatSpeechError(code), 'warning', `speech:${code}`)
      },
    })

    this.updateRecognitionState({
      supported: this.recognitionSession.supported,
      isListening: false,
      isStarting: false,
      isRecovering: false,
      recoveryReason: '',
      lastActivityAt: 0,
      error: '',
    })
    this.scheduleDraftScroll()
    this.focusTranscriptSoon()
    this.hotkeyHandler = event => this.handleGlobalKeydown(event)
    this.storageListener = (changes, areaName) => this.handleStorageChanged(changes, areaName)
    window.addEventListener('keydown', this.hotkeyHandler)
    chrome.storage.onChanged.addListener(this.storageListener)
  },
  beforeDestroy() {
    if (this.draftScrollTimer) clearTimeout(this.draftScrollTimer)
    if (this.externalInsertTimer) clearTimeout(this.externalInsertTimer)
    if (this.reader) this.reader.destroy()
    if (this.recognitionSession) this.recognitionSession.destroy()
    if (this.hotkeyHandler) window.removeEventListener('keydown', this.hotkeyHandler)
    if (this.storageListener) chrome.storage.onChanged.removeListener(this.storageListener)
  },
  render(h) {
    return h('v-app', { staticClass: 'simple-stt-app' }, [
      h('v-main', [
        h('v-container', {
          staticClass: 'fill-height pa-3 pa-sm-4 d-flex align-center justify-center',
          props: { fluid: true },
        }, [
          h('app-shell', {
            ref: 'shell',
            props: {
              canToggleTranscribing: this.canToggleTranscribing,
              displayedText: this.displayedText,
              insertIntoActiveField: this.settings.insertIntoActiveField,
              isPaused: this.isPaused,
              isReading: this.isReading,
              isStarting: this.isStarting,
              readButtonIcon: this.readButtonIcon,
              readButtonLabel: this.readButtonLabel,
              readerSupported: this.readerSupported,
              statusDotClass: this.statusDotClass,
              statusLabel: this.statusLabel,
              toggleButtonColor: this.toggleButtonColor,
              toggleButtonIcon: this.toggleButtonIcon,
              toggleButtonLabel: this.toggleButtonLabel,
            },
            on: {
              clear: () => this.clearTranscript(true),
              copy: () => this.copyToClipboard(),
              cut: this.cutTranscript,
              input: this.handleManualInput,
              'open-settings': this.openSettingsPage,
              'read-restart': this.restartReading,
              'read-toggle': this.toggleReading,
              'toggle-transcribing': this.toggleTranscribing,
              'update-insert-into-active-field': this.setInsertIntoActiveField,
            },
          }),
        ]),
      ]),
      h('v-snackbar', {
        props: {
          value: this.snackbar.show,
          timeout: this.snackbar.timeout,
          color: this.snackbar.color,
          bottom: true,
        },
        on: {
          input: value => {
            this.snackbar.show = value
          },
        },
      }, [this.snackbar.text]),
    ])
  },
})
