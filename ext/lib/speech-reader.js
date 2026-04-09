(function (root, factory) {
  const exported = factory(root)

  if (typeof module === 'object' && module.exports) module.exports = exported

  if (root) {
    root.SimpleSttLib = root.SimpleSttLib || {}
    root.SimpleSttLib.speechReader = exported
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  function getSpeechSynthesis() {
    if (!root || !root.speechSynthesis) return null
    return root.speechSynthesis
  }

  function normalizeVoiceName(value) {
    return String(value || '').trim()
  }

  function normalizeLanguage(value) {
    return String(value || 'en-US').trim() || 'en-US'
  }

  const LANGUAGE_LABELS = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'en-AU': 'English (Australia)',
    'en-CA': 'English (Canada)',
  }

  function getLanguageLabel(language) {
    const normalizedLanguage = normalizeLanguage(language)
    if (LANGUAGE_LABELS[normalizedLanguage]) {
      return LANGUAGE_LABELS[normalizedLanguage]
    }

    return normalizedLanguage
  }

  function languageMatches(voice, language) {
    if (!voice || typeof voice.lang !== 'string') return false

    const target = normalizeLanguage(language).toLowerCase()
    const shortTarget = target.split('-')[0]
    const voiceLang = voice.lang.toLowerCase()

    return voiceLang === target || voiceLang.startsWith(`${shortTarget}-`)
  }

  function cleanText(text) {
    return String(text || '')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/\b(?:https?:\/\/|www\.)\S+\b/g, '')
      .replace(/[*_~`]+/g, '')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  function chunkLine(line, minLength, maxLength) {
    const chunks = []
    let index = 0

    while (index < line.length) {
      let end = Math.min(index + minLength, line.length - 1)

      while (
        end < line.length - 1 &&
        end - index < maxLength &&
        !/[.!?;:,]/.test(line[end])
      ) {
        end += 1
      }

      if (/[.!?;:,]/.test(line[end])) end += 1

      if (end - index > maxLength) {
        let fallback = end

        while (fallback > index && line[fallback] !== ' ') fallback -= 1
        if (fallback > index) end = fallback
      }

      while (end < line.length && /\S/.test(line[end])) end += 1

      const chunk = line.slice(index, end).trim()
      if (chunk) chunks.push(chunk)
      index = end
    }

    return chunks
  }

  function chunkText(text, minLength, maxLength) {
    return cleanText(text)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .reduce((chunks, line) => {
        return chunks.concat(chunkLine(line, minLength || 110, maxLength || 190))
      }, [])
  }

  function loadVoices() {
    const synth = getSpeechSynthesis()
    if (!synth) return Promise.resolve([])

    return new Promise(resolve => {
      const voices = synth.getVoices()
      if (voices.length) {
        resolve(voices)
        return
      }

      const handleVoices = () => {
        synth.removeEventListener('voiceschanged', handleVoices)
        resolve(synth.getVoices())
      }

      synth.addEventListener('voiceschanged', handleVoices)
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', handleVoices)
        resolve(synth.getVoices())
      }, 1500)
    })
  }

  function getSelectableVoices(voices, language) {
    const allVoices = Array.isArray(voices) ? voices : []
    const normalizedLanguage = normalizeLanguage(language).toLowerCase()
    const shortLanguage = normalizedLanguage.split('-')[0]
    const exactVoices = allVoices.filter(voice => {
      return String(voice && voice.lang || '').toLowerCase() === normalizedLanguage
    })

    if (exactVoices.length) return exactVoices

    const familyVoices = allVoices.filter(voice => {
      const voiceLanguage = String(voice && voice.lang || '').toLowerCase()
      return voiceLanguage.startsWith(`${shortLanguage}-`)
    })

    return familyVoices.length ? familyVoices : allVoices
  }

  function getLanguageOptions(voices) {
    const allVoices = Array.isArray(voices) ? voices : []
    const seen = new Set()
    const options = []

    allVoices.forEach(voice => {
      const language = normalizeLanguage(voice && voice.lang)
      if (seen.has(language)) return
      seen.add(language)
      options.push({
        text: getLanguageLabel(language),
        value: language,
      })
    })

    options.sort((left, right) => {
      if (left.value === 'en-US') return -1
      if (right.value === 'en-US') return 1
      return left.text.localeCompare(right.text)
    })

    if (!options.length) {
      return [{
        text: getLanguageLabel('en-US'),
        value: 'en-US',
      }]
    }

    return options
  }

  function pickVoice(voices, voiceName, language) {
    const allVoices = Array.isArray(voices) ? voices : []
    const normalizedLanguage = normalizeLanguage(language)
    const selectableVoices = getSelectableVoices(allVoices, normalizedLanguage)
    const normalizedName = normalizeVoiceName(voiceName)
    if (!selectableVoices.length) return null

    const defaultVoice = (normalizedLanguage === 'en-US'
      ? selectableVoices.find(voice => {
        return voice.name === 'Google US English' && voice.lang === 'en-US'
      }) || selectableVoices.find(voice => voice.name === 'Google US English')
      : null) ||
      selectableVoices.find(voice => voice.lang === normalizedLanguage) ||
      selectableVoices.find(voice => languageMatches(voice, normalizedLanguage)) ||
      selectableVoices[0]

    if (!normalizedName) return defaultVoice

    return selectableVoices.find(voice => voice.name === normalizedName) ||
      selectableVoices.find(voice => voice.name.includes(normalizedName)) ||
      defaultVoice
  }

  function createSpeechReader(opts) {
    const options = opts && typeof opts === 'object' ? opts : {}
    const synth = getSpeechSynthesis()

    const reader = {
      synth,
      minChunkLength: Number(options.minChunkLength || 110),
      maxChunkLength: Number(options.maxChunkLength || 190),
      listeners: {},
      voices: [],
      language: normalizeLanguage(options.language),
      voiceName: normalizeVoiceName(options.voiceName),
      voice: null,
      text: '',
      chunks: [],
      index: 0,
      isReading: false,
      isPaused: false,
      cancelToken: 0,
      voiceListener: null,
      async init() {
        this.voices = await loadVoices()
        this.voice = pickVoice(this.voices, this.voiceName, this.language)
        this.emitVoices()

        if (this.synth) {
          this.voiceListener = async () => {
            this.voices = await loadVoices()
            this.voice = pickVoice(this.voices, this.voiceName, this.language)
            this.emitVoices()
            this.emitState()
          }

          this.synth.addEventListener('voiceschanged', this.voiceListener)
        }

        this.emitState()
        return this.voices
      },
      destroy() {
        if (this.synth && this.voiceListener) {
          this.synth.removeEventListener('voiceschanged', this.voiceListener)
        }

        this.stop()
        this.voiceListener = null
      },
      on(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = []
        this.listeners[event].push(handler)
      },
      emit(event, payload) {
        const handlers = this.listeners[event] || []
        handlers.forEach(handler => handler(payload))
      },
      emitVoices() {
        this.emit('voices', {
          language: this.language,
          selectedVoiceName: this.voice ? this.voice.name : '',
          voices: this.voices.map(voice => ({
            default: Boolean(voice.default),
            lang: voice.lang,
            name: voice.name,
          })),
        })
      },
      emitProgress() {
        this.emit('progress', {
          currentChunk: this.chunks[this.index] || '',
          index: this.index,
          total: this.chunks.length,
        })
      },
      emitState() {
        this.emit('state', {
          currentChunk: this.chunks[this.index] || '',
          hasText: Boolean(this.text),
          index: this.index,
          isPaused: this.isPaused,
          isReading: this.isReading,
          language: this.language,
          selectedVoiceName: this.voice ? this.voice.name : '',
          supported: Boolean(this.synth),
          total: this.chunks.length,
        })
      },
      setLanguage(value) {
        this.language = normalizeLanguage(value)
        this.voice = pickVoice(this.voices, this.voiceName, this.language)
        this.emitVoices()
        this.emitState()
      },
      setVoiceName(value) {
        this.voiceName = normalizeVoiceName(value)
        this.voice = pickVoice(this.voices, this.voiceName, this.language)
        this.emitVoices()
        this.emitState()
      },
      updateText(text, options) {
        const nextOptions = options && typeof options === 'object' ? options : {}
        const nextText = String(text || '')

        this.text = nextText
        this.chunks = chunkText(nextText, this.minChunkLength, this.maxChunkLength)

        if (nextOptions.resetIndex !== false) this.index = 0

        this.emitProgress()
        this.emitState()
        return this.chunks
      },
      cancelCurrentSpeech() {
        if (!this.synth) return
        this.cancelToken += 1
        this.synth.cancel()
      },
      start(text, options) {
        if (!this.synth) {
          this.emitState()
          return false
        }

        const nextOptions = options && typeof options === 'object' ? options : {}
        if (typeof text === 'string') this.updateText(text, nextOptions)
        else if (!this.chunks.length) this.updateText(this.text, nextOptions)

        if (!this.chunks.length) {
          this.stop()
          return false
        }

        this.cancelCurrentSpeech()
        this.isReading = true
        this.isPaused = false
        this.emitState()
        this.speakCurrentChunk()
        return true
      },
      pause() {
        if (!this.isReading || this.isPaused) return
        this.isPaused = true
        this.cancelCurrentSpeech()
        this.emitState()
      },
      resume() {
        if (!this.isReading || !this.isPaused) return
        this.isPaused = false
        this.emitState()
        this.speakCurrentChunk()
      },
      restart(text) {
        if (typeof text === 'string') this.updateText(text)
        else this.index = 0

        return this.start(this.text, { resetIndex: false })
      },
      stop() {
        this.cancelCurrentSpeech()
        this.isReading = false
        this.isPaused = false
        this.index = 0
        this.emitProgress()
        this.emitState()
      },
      finish() {
        this.cancelCurrentSpeech()
        this.isReading = false
        this.isPaused = false
        this.index = 0
        this.emitProgress()
        this.emitState()
        this.emit('done')
      },
      speakCurrentChunk() {
        if (!this.synth || !this.isReading || this.isPaused) return
        if (this.index >= this.chunks.length) {
          this.finish()
          return
        }

        const token = this.cancelToken
        const utterance = new root.SpeechSynthesisUtterance(this.chunks[this.index])
        utterance.voice = this.voice
        utterance.onend = () => {
          if (token !== this.cancelToken || this.isPaused || !this.isReading) return
          this.index += 1
          this.emitProgress()
          this.speakCurrentChunk()
        }
        utterance.onerror = () => {
          if (token !== this.cancelToken || !this.isReading) return
          this.index += 1
          this.emitProgress()
          this.speakCurrentChunk()
        }

        this.emitProgress()
        this.synth.speak(utterance)
      },
    }

    reader.emitState()
    return reader
  }

  return {
    chunkText,
    cleanText,
    createSpeechReader,
    getLanguageOptions,
    getSelectableVoices,
    loadVoices,
    normalizeLanguage,
  }
})
