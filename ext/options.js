const hotkeys = window.SimpleSttLib.hotkeys
const speechReader = window.SimpleSttLib.speechReader

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
  data: {
    settings: window.SimpleSttSettings.defaults(),
    availableVoices: [],
    loading: true,
    loadedSettingsSnapshot: window.SimpleSttSettings.serialize(window.SimpleSttSettings.defaults()),
    saving: false,
    voiceListener: null,
    snackbar: {
      show: false,
      text: '',
    },
  },
  computed: {
    isDirty() {
      return this.pageSettingsSnapshot(this.settings) !== this.pageSettingsSnapshot(
        window.SimpleSttSettings.defaults()
      )
    },
    canReset() {
      return this.isDirty
    },
    canSave() {
      if (this.loading || this.saving) return false
      return this.pageSettingsSnapshot(this.settings) !== this.loadedSettingsSnapshot
    },
    languageOptions() {
      return speechReader.getLanguageOptions(this.availableVoices)
    },
    languageValues() {
      return this.languageOptions.map(option => option.value)
    },
    voiceOptions() {
      return speechReader.getSelectableVoices(
        this.availableVoices,
        this.settings.speech.language
      ).map(voice => ({
        text: voice.lang ? `${voice.name} (${voice.lang})` : voice.name,
        value: voice.name,
      }))
    },
  },
  watch: {
    availableVoices() {
      if (!this.languageValues.includes(this.settings.speech.language)) {
        this.settings.speech.language = this.languageValues[0] || 'en-US'
      }
    },
    'settings.speech.language': function (value) {
      const voices = speechReader.getSelectableVoices(
        this.availableVoices,
        value
      )
      const currentVoiceName = this.settings.speech.voiceName
      const stillValid = voices.some(voice => voice.name === currentVoiceName)

      if (!stillValid) {
        this.settings.speech.voiceName = voices[0] ? voices[0].name : ''
      }
    },
  },
  methods: {
    pageSettingsSnapshot(value) {
      const normalized = window.SimpleSttSettings.normalize(value)
      const defaults = window.SimpleSttSettings.defaults()

      return window.SimpleSttSettings.serialize({
        ...normalized,
        insertIntoActiveField: defaults.insertIntoActiveField,
      })
    },
    async loadSettings() {
      this.loading = true
      this.settings = await window.SimpleSttSettings.get()
      this.loadedSettingsSnapshot = this.pageSettingsSnapshot(this.settings)
      this.loading = false
    },
    async loadVoices() {
      this.availableVoices = await speechReader.loadVoices()
    },
    async saveSettings() {
      this.saving = true
      this.settings = await window.SimpleSttSettings.save(this.settings)
      this.loadedSettingsSnapshot = this.pageSettingsSnapshot(this.settings)
      this.saving = false
      this.showSnackbar('Settings saved')
    },
    async resetSettings() {
      this.saving = true
      const defaults = window.SimpleSttSettings.defaults()
      this.settings = await window.SimpleSttSettings.save({
        ...defaults,
        insertIntoActiveField: this.settings.insertIntoActiveField,
      })
      this.loadedSettingsSnapshot = this.pageSettingsSnapshot(this.settings)
      this.saving = false
      this.showSnackbar('Settings reset')
    },
    openApp() {
      window.SimpleSttSettings.openOrFocusExtensionPage('app.html')
    },
    showSnackbar(text) {
      this.snackbar.text = text
      this.snackbar.show = false
      this.$nextTick(() => {
        this.snackbar.show = true
      })
    },
    normalizeHotkey() {
      this.settings.hotkeys.toggleTranscribing = hotkeys.normalizeHotkey(
        this.settings.hotkeys.toggleTranscribing
      )
    },
  },
  async mounted() {
    window.SimpleSttSettings.applyThemeVars(document)
    await this.loadSettings()
    await this.loadVoices()

    if (window.speechSynthesis) {
      this.voiceListener = async () => {
        await this.loadVoices()
      }

      window.speechSynthesis.addEventListener('voiceschanged', this.voiceListener)
    }
  },
  beforeDestroy() {
    if (window.speechSynthesis && this.voiceListener) {
      window.speechSynthesis.removeEventListener('voiceschanged', this.voiceListener)
    }
  },
  render(h) {
    return h('v-app', [
      h('v-main', [
        h('v-container', {
          staticClass: 'fill-height pa-4 d-flex align-center justify-center',
          props: { fluid: true },
        }, [
          h('v-card', {
            staticClass: 'options-card',
            props: {
              outlined: true,
              loading: this.loading,
            },
          }, [
            h('v-card-title', { staticClass: 'd-flex align-center justify-space-between' }, [
              h('div', { staticClass: 'd-flex align-center options-brand' }, [
                h('img', {
                  staticClass: 'options-logo',
                  attrs: {
                    src: 'icons/icon-64.png',
                    alt: 'Simple STT logo',
                  },
                }),
                h('div', [
                  h('div', { staticClass: 'text-h5 font-weight-medium' }, ['Simple STT Settings']),
                  h('div', { staticClass: 'body-2 grey--text text--lighten-1 mt-1' }, ['Adjust spoken command phrases and a few core extension behaviors.']),
                ]),
              ]),
              h('div', { staticClass: 'd-flex align-center' }, [
                h('v-btn', {
                  staticClass: 'mr-2',
                  props: {
                    text: true,
                  },
                  attrs: {
                    href: 'https://github.com/basedwon/simple-stt',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  },
                }, [
                  h('v-icon', { props: { left: true } }, ['mdi-github']),
                  'GitHub'
                ]),
                h('v-btn', {
                  props: {
                    text: true,
                  },
                  on: { click: this.openApp },
                }, [
                  h('v-icon', { props: { left: true } }, ['mdi-open-in-new']),
                  'Open App'
                ]),
              ]),
            ]),
            h('v-divider'),
            h('v-card-text', { staticClass: 'pt-5' }, [
              h('v-row', [
                h('v-col', { props: { cols: 12, md: 6 } }, [
                  h('div', { staticClass: 'subtitle-2 text-uppercase grey--text text--lighten-1 mb-3' }, ['Spoken Commands']),
                  h('v-text-field', {
                    staticClass: 'mb-3',
                    props: {
                      outlined: true,
                      hideDetails: 'auto',
                      label: 'Line break phrase',
                      hint: 'Inserted as a single newline',
                      value: this.settings.commandPhrases.lineBreak,
                    },
                    on: {
                      input: value => {
                        this.settings.commandPhrases.lineBreak = value
                      },
                    },
                  }),
                  h('v-text-field', {
                    props: {
                      outlined: true,
                      hideDetails: 'auto',
                      label: 'Paragraph break phrase',
                      hint: 'Inserted as a blank line',
                      value: this.settings.commandPhrases.paragraphBreak,
                    },
                    on: {
                      input: value => {
                        this.settings.commandPhrases.paragraphBreak = value
                      },
                    },
                  }),
                ]),
                h('v-col', { props: { cols: 12, md: 6 } }, [
                  h('div', { staticClass: 'subtitle-2 text-uppercase grey--text text--lighten-1 mb-3' }, ['Keyboard']),
                  h('v-text-field', {
                    props: {
                      outlined: true,
                      hideDetails: 'auto',
                      label: 'Toggle transcription hotkey',
                      hint: 'Format like Alt+Shift+R or Cmd+Shift+R',
                      value: this.settings.hotkeys.toggleTranscribing,
                    },
                    on: {
                      input: value => {
                        this.settings.hotkeys.toggleTranscribing = value
                      },
                      blur: this.normalizeHotkey,
                    },
                  }),
                  h('div', { staticClass: 'body-2 grey--text text--lighten-1 mt-3' }, [
                    'App shortcuts: Ctrl/Cmd+A selects the transcript, Ctrl/Cmd+C copies, and Ctrl/Cmd+X cuts.',
                  ]),
                  h('div', { staticClass: 'subtitle-2 text-uppercase grey--text text--lighten-1 mt-6 mb-3' }, ['Reading']),
                  h('v-select', {
                    staticClass: 'mb-3',
                    props: {
                      hideDetails: 'auto',
                      items: this.languageOptions,
                      label: 'Language',
                      outlined: true,
                      hint: 'Controls transcription language and filters read-aloud voices.',
                      value: this.settings.speech.language,
                    },
                    on: {
                      input: value => {
                        this.settings.speech.language = value
                      },
                    },
                  }),
                  h('v-select', {
                    props: {
                      hideDetails: 'auto',
                      items: this.voiceOptions,
                      label: 'Read-aloud voice',
                      outlined: true,
                      hint: 'Uses the browser speech-synthesis voices available on this device.',
                      value: this.settings.speech.voiceName,
                    },
                    on: {
                      input: value => {
                        this.settings.speech.voiceName = value
                      },
                    },
                  }),
                ]),
              ]),
            ]),
            h('v-divider'),
            h('v-card-actions', { staticClass: 'px-4 py-3' }, [
              h('v-btn', {
                props: {
                  text: true,
                  disabled: !this.canReset,
                },
                on: { click: this.resetSettings },
              }, ['Reset defaults']),
              h('v-spacer'),
              h('v-btn', {
                props: {
                  color: 'accent',
                  depressed: true,
                  disabled: !this.canSave,
                  loading: this.saving,
                },
                on: { click: this.saveSettings },
              }, ['Save settings']),
            ]),
          ]),
        ]),
      ]),
      h('v-snackbar', {
        props: {
          value: this.snackbar.show,
          timeout: 2200,
          top: true,
          right: true,
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
