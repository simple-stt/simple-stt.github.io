(function () {
  Vue.component('app-status', {
    props: {
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
    computed: {
      statusChipClasses() {
        if (this.isReading && !this.isPaused) {
          return 'success--text text--lighten-2'
        }

        if (this.isPaused || this.statusDotClass === 'status-warning') {
          return 'warning--text text--lighten-2'
        }

        return ''
      },
      statusDotColor() {
        if (this.isReading && !this.isPaused) return 'accent'
        if (this.isPaused) return 'warning'
        if (this.statusDotClass === 'status-warning') return 'warning'
        if (this.statusDotClass === 'status-active') return 'error'
        return 'grey'
      },
    },
    render(h) {
      return h('div', { staticClass: 'd-flex align-center status-strip' }, [
        h('v-icon', {
          staticClass: 'status-dot',
          props: {
            color: this.statusDotColor,
            'x-small': true,
          },
        }, ['mdi-circle']),
        h('v-chip', {
          staticClass: 'status-chip',
          class: this.statusChipClasses,
          props: {
            label: true,
            outlined: true,
            small: true,
          },
        }, [this.statusLabel]),
      ])
    },
  })
})()
