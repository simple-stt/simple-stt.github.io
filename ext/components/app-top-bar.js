(function () {
  Vue.component('app-top-bar', {
    props: {
      canToggleTranscribing: {
        type: Boolean,
        default: false,
      },
      insertIntoActiveField: {
        type: Boolean,
        default: true,
      },
      hasText: {
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
      isCompact() {
        return Boolean(this.$vuetify.breakpoint.smAndDown)
      },
      isMobile() {
        return Boolean(this.$vuetify.breakpoint.xsOnly)
      },
    },
    render(h) {
      return h('v-toolbar', {
        staticClass: 'flex-grow-0',
        props: {
          color: 'transparent',
          flat: true,
          height: 75,
        },
      }, [
        h('app-brand'),
        h('v-spacer'),
        h('v-switch', {
          staticClass: 'mt-0 pt-0 active-field-switch',
          class: this.isCompact ? 'mr-0' : 'mr-4',
          props: {
            color: 'accent',
            dense: true,
            hideDetails: true,
            inputValue: this.insertIntoActiveField,
            inset: true,
            label: this.isCompact ? '' : 'Write to active field',
          },
          on: {
            change: value => this.$emit('update-insert-into-active-field', value),
          },
        }),
        h('v-btn', {
          staticClass: 'mr-sm-and-up-2',
          props: {
            icon: true,
            plain: true,
            small: this.isCompact,
          },
          attrs: {
            'aria-label': 'Open settings',
          },
          on: {
            click: () => this.$emit('open-settings'),
          },
        }, [
          h('v-icon', {
            attrs: {
              size: '18',
            },
          }, ['mdi-cog']),
        ]),
        h('reader-controls', {
          staticClass: 'mr-1 mr-sm-2',
          props: {
            hasText: this.hasText,
            readButtonIcon: this.readButtonIcon,
            readButtonLabel: this.readButtonLabel,
            supported: this.readerSupported,
            small: this.isCompact,
          },
          on: {
            restart: () => this.$emit('read-restart'),
            toggle: () => this.$emit('read-toggle'),
          },
        }),
        h('transcript-controls', {
          props: {
            canToggleTranscribing: this.canToggleTranscribing,
            isStarting: this.isStarting,
            toggleButtonColor: this.toggleButtonColor,
            toggleButtonIcon: this.toggleButtonIcon,
            toggleButtonLabel: this.toggleButtonLabel,
          },
          on: {
            'toggle-transcribing': () => this.$emit('toggle-transcribing'),
          },
        }),
      ])
    },
  })
})()
