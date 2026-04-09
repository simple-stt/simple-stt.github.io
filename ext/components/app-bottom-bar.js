(function () {
  Vue.component('app-bottom-bar', {
    props: {
      hasText: {
        type: Boolean,
        default: false,
      },
      isPaused: {
        type: Boolean,
        default: false,
      },
      isReading: {
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
    },
    render(h) {
      return h('v-card-actions', {
        staticClass: 'pa-3 flex-grow-0',
      }, [
        h('app-status', {
          staticClass: 'ml-1',
          props: {
            isPaused: this.isPaused,
            isReading: this.isReading,
            statusDotClass: this.statusDotClass,
            statusLabel: this.statusLabel,
          },
        }),
        h('v-spacer'),
        h('composer-controls', {
          props: {
            hasText: this.hasText,
          },
          on: {
            clear: () => this.$emit('clear'),
            cut: () => this.$emit('cut'),
            copy: () => this.$emit('copy'),
          },
        }),
      ])
    },
  })
})()
