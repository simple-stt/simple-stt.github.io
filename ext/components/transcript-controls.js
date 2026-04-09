(function () {
  Vue.component('transcript-controls', {
    props: {
      canToggleTranscribing: {
        type: Boolean,
        default: false,
      },
      isStarting: {
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
    },
    render(h) {
      return h('v-btn', {
        props: {
          color: this.toggleButtonColor,
          depressed: true,
          disabled: !this.canToggleTranscribing,
          large: !this.isCompact,
          loading: this.isStarting,
          rounded: true,
          small: this.isCompact,
        },
        attrs: {
          'aria-label': this.toggleButtonLabel,
        },
        on: {
          click: () => this.$emit('toggle-transcribing'),
        },
      }, [
        h('v-icon', {
          props: {
            left: true,
          },
        }, [this.toggleButtonIcon]),
        h('span', [this.toggleButtonLabel]),
      ])
    },
  })
})()
