(function (root, factory) {
  const exported = factory(root)

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.speechSession = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  function normalizeLanguage(value) {
    return String(value || 'en-US').trim() || 'en-US'
  }

  function createSpeechRecognitionSession(opts) {
    const settings = opts && typeof opts === 'object' ? opts : {}
    const Recognition = root.SpeechRecognition || root.webkitSpeechRecognition

    const session = {
      recognition: null,
      stream: null,
      supported: Boolean(Recognition),
      shouldBeListening: false,
      isListening: false,
      isStarting: false,
      isRecovering: false,
      language: normalizeLanguage(settings.language),
      lastActivityAt: 0,
      stallThresholdMs: Number(settings.stallThresholdMs || 18000),
      watchdogIntervalMs: Number(settings.watchdogIntervalMs || 3000),
      restartTimer: null,
      watchdogTimer: null,
      destroyRequested: false,
      error: '',
      recoveryReason: '',
      onState: typeof settings.onState === 'function' ? settings.onState : function () {},
      onInterim: typeof settings.onInterim === 'function' ? settings.onInterim : function () {},
      onFinal: typeof settings.onFinal === 'function' ? settings.onFinal : function () {},
      onError: typeof settings.onError === 'function' ? settings.onError : function () {},
      emitState() {
        this.onState({
          supported: this.supported,
          isListening: this.isListening,
          isStarting: this.isStarting,
          isRecovering: this.isRecovering,
          lastActivityAt: this.lastActivityAt,
          recoveryReason: this.recoveryReason,
          error: this.error,
        })
      },
      markActivity() {
        this.lastActivityAt = Date.now()
      },
      clearRestartTimer() {
        if (!this.restartTimer) return
        clearTimeout(this.restartTimer)
        this.restartTimer = null
      },
      clearWatchdog() {
        if (!this.watchdogTimer) return
        clearInterval(this.watchdogTimer)
        this.watchdogTimer = null
      },
      ensureWatchdog() {
        if (this.watchdogTimer || !this.supported) return

        this.watchdogTimer = setInterval(() => {
          if (!this.shouldBeListening || this.destroyRequested) return
          if (this.isStarting || this.isRecovering) return
          if (!this.lastActivityAt) return
          if (Date.now() - this.lastActivityAt < this.stallThresholdMs) return

          this.scheduleRestart('stall')
        }, this.watchdogIntervalMs)
      },
      scheduleRestart(reason, delay) {
        if (!this.shouldBeListening || this.destroyRequested) return
        if (this.restartTimer) return

        this.recoveryReason = String(reason || 'reconnecting')
        this.isRecovering = true
        this.isListening = false
        this.isStarting = false
        this.emitState()

        try {
          if (this.recognition) this.recognition.abort()
        } catch (err) {}

        this.restartTimer = setTimeout(() => {
          this.restartTimer = null
          this.startRecognition()
        }, typeof delay === 'number' ? delay : 500)
      },
      buildRecognition() {
        if (!Recognition) return null

        const recognition = new Recognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = this.language
        recognition.onstart = () => {
          this.isStarting = false
          this.isListening = true
          this.isRecovering = false
          this.error = ''
          this.recoveryReason = ''
          this.markActivity()
          this.ensureWatchdog()
          this.emitState()
        }
        recognition.onresult = event => {
          let interim = ''
          let finalText = ''

          for (let ii = event.resultIndex; ii < event.results.length; ii += 1) {
            const result = event.results[ii]
            const transcript = result && result[0] && result[0].transcript
              ? result[0].transcript
              : ''

            if (result.isFinal) finalText += transcript
            else interim += transcript
          }

          this.markActivity()
          this.onInterim(interim)
          if (finalText) this.onFinal(finalText)
        }
        recognition.onerror = event => {
          const code = event && event.error ? event.error : 'speech-error'
          const transient = code === 'no-speech' || code === 'aborted'
          const recoverable = transient || code === 'network'

          this.error = code
          if (!recoverable) this.onError(code)
          if (!this.shouldBeListening) return

          if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
            this.shouldBeListening = false
            this.isRecovering = false
          }

          if (recoverable && this.shouldBeListening) {
            this.scheduleRestart(code, code === 'network' ? 900 : 400)
          }

          this.emitState()
        }
        recognition.onend = () => {
          this.isListening = false
          this.isStarting = false
          this.emitState()

          if (!this.shouldBeListening || this.destroyRequested) return
          this.scheduleRestart(this.error || 'reconnecting', 400)
        }

        this.recognition = recognition
        return recognition
      },
      async ensureStream() {
        if (this.stream) return this.stream
        this.stream = await root.navigator.mediaDevices.getUserMedia({ audio: true })
        return this.stream
      },
      async startRecognition() {
        if (!this.supported) {
          this.error = 'speech-not-supported'
          this.onError(this.error)
          this.emitState()
          return false
        }

        if (this.isListening || this.isStarting) return true
        if (!this.recognition) this.buildRecognition()
        if (!this.recognition) return false
        this.recognition.lang = this.language

        this.clearRestartTimer()

        try {
          await this.ensureStream()
          this.markActivity()
          this.isStarting = true
          this.emitState()
          this.recognition.start()
          return true
        } catch (err) {
          this.isStarting = false
          this.isRecovering = false
          this.error = err && err.name ? err.name : 'speech-start-failed'
          this.onError(this.error)
          this.emitState()
          return false
        }
      },
      async start() {
        this.destroyRequested = false
        this.shouldBeListening = true
        this.ensureWatchdog()
        return this.startRecognition()
      },
      setLanguage(value) {
        this.language = normalizeLanguage(value)
        if (this.recognition) this.recognition.lang = this.language
      },
      stopTracks() {
        if (!this.stream) return
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      },
      stop() {
        this.shouldBeListening = false
        this.destroyRequested = false
        this.clearRestartTimer()
        this.clearWatchdog()
        this.onInterim('')

        if (this.recognition && (this.isListening || this.isStarting)) {
          try {
            this.recognition.stop()
          } catch (err) {}
        }

        this.isListening = false
        this.isStarting = false
        this.isRecovering = false
        this.recoveryReason = ''
        this.stopTracks()
        this.emitState()
        return true
      },
      destroy() {
        this.destroyRequested = true
        this.shouldBeListening = false
        this.clearRestartTimer()
        this.clearWatchdog()
        this.onInterim('')

        if (this.recognition) {
          try {
            this.recognition.abort()
          } catch (err) {}

          this.recognition.onstart = null
          this.recognition.onresult = null
          this.recognition.onerror = null
          this.recognition.onend = null
          this.recognition = null
        }

        this.isListening = false
        this.isStarting = false
        this.isRecovering = false
        this.recoveryReason = ''
        this.stopTracks()
        this.emitState()
      },
    }

    session.emitState()
    return session
  }

  return {
    createSpeechRecognitionSession,
  }
})
