(function () {
  Vue.component('app-shell', {
    props: {
      canToggleTranscribing: {
        type: Boolean,
        default: false,
      },
      displayedText: {
        type: String,
        default: '',
      },
      insertIntoActiveField: {
        type: Boolean,
        default: true,
      },
      isPaused: {
        type: Boolean,
        default: false,
      },
      isReading: {
        type: Boolean,
        default: false,
      },
      isStarting: {
        type: Boolean,
        default: false,
      },
      readButtonIcon: {
        type: String,
        default: 'mdi-play',
      },
      readButtonLabel: {
        type: String,
        default: 'Listen',
      },
      readerSupported: {
        type: Boolean,
        default: false,
      },
      statusDotClass: {
        type: String,
        default: 'status-idle',
      },
      statusLabel: {
        type: String,
        default: 'Idle',
      },
      toggleButtonColor: {
        type: String,
        default: 'primary',
      },
      toggleButtonIcon: {
        type: String,
        default: 'mdi-microphone',
      },
      toggleButtonLabel: {
        type: String,
        default: 'Start',
      },
    },
    computed: {
      hasText() {
        return Boolean(this.displayedText)
      },
    },
    methods: {
      fieldRef() {
        return this.$refs.field
      },
      getTextareaElement() {
        const field = this.fieldRef()
        return field ? field.getTextareaElement() : null
      },
      focusTranscript(selectAll) {
        const field = this.fieldRef()
        if (!field) return
        field.focusTranscript(selectAll)
      },
      scrollDraftToBottom() {
        const field = this.fieldRef()
        if (!field) return
        field.scrollDraftToBottom()
      },
      getReadingContext(fullText, options) {
        const field = this.fieldRef()
        if (!field) {
          return { mode: 'full', start: 0, text: String(fullText || '').trim() }
        }

        return field.getReadingContext(fullText, options)
      },
    },
    render(h) {
      return h('v-card', {
        staticClass: 'd-flex flex-column fill-height simple-stt-card',
        props: {
          outlined: true,
        },
      }, [
        h('app-top-bar', {
          props: {
            canToggleTranscribing: this.canToggleTranscribing,
            hasText: this.hasText,
            insertIntoActiveField: this.insertIntoActiveField,
            isStarting: this.isStarting,
            readButtonIcon: this.readButtonIcon,
            readButtonLabel: this.readButtonLabel,
            readerSupported: this.readerSupported,
            toggleButtonColor: this.toggleButtonColor,
            toggleButtonIcon: this.toggleButtonIcon,
            toggleButtonLabel: this.toggleButtonLabel,
          },
          on: {
            'open-settings': () => this.$emit('open-settings'),
            'read-restart': () => this.$emit('read-restart'),
            'read-toggle': () => this.$emit('read-toggle'),
            'toggle-transcribing': () => this.$emit('toggle-transcribing'),
            'update-insert-into-active-field': value => this.$emit('update-insert-into-active-field', value),
          },
        }),
        h('v-divider', { staticClass: 'simple-stt-divider' }),
        h('composer-field', {
          ref: 'field',
          staticClass: 'flex-grow-1',
          props: {
            value: this.displayedText,
          },
          on: {
            input: value => this.$emit('input', value),
          },
        }),
        h('v-divider', { staticClass: 'simple-stt-divider' }),
        h('app-bottom-bar', {
          props: {
            hasText: this.hasText,
            isPaused: this.isPaused,
            isReading: this.isReading,
            statusDotClass: this.statusDotClass,
            statusLabel: this.statusLabel,
          },
          on: {
            clear: () => this.$emit('clear'),
            copy: () => this.$emit('copy'),
            cut: () => this.$emit('cut'),
          },
        }),
      ])
    },
  })
})()
