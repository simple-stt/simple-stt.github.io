(function () {
  Vue.component('reader-controls', {
    props: {
      hasText: {
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
      supported: {
        type: Boolean,
        default: false,
      },
      small: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      readTooltip() {
        if (this.readButtonLabel === 'Pause') return 'Pause read-aloud'
        if (this.readButtonLabel === 'Resume') return 'Resume read-aloud'
        return 'Read aloud'
      },
    },
    render(h) {
      return h('div', {
        staticClass: 'd-flex align-center',
      }, [
        h('v-tooltip', {
          props: { bottom: true },
          scopedSlots: {
            activator: ({ on, attrs }) => {
              return h('v-btn', {
                attrs: {
                  ...attrs,
                  'aria-label': 'Restart reading from beginning',
                },
                props: {
                  disabled: !this.hasText,
                  icon: true,
                  plain: true,
                  small: this.small,
                },
                on: {
                  ...on,
                  click: () => this.$emit('restart'),
                },
              }, [
                h('v-icon', ['mdi-skip-backward']),
              ])
            },
          },
        }, [h('span', ['Restart read-aloud'])]),
        h('v-tooltip', {
          props: { bottom: true },
          scopedSlots: {
            activator: ({ on, attrs }) => {
              return h('v-btn', {
                attrs: {
                  ...attrs,
                  'aria-label': this.readButtonLabel,
                },
                props: {
                  disabled: !this.hasText || !this.supported,
                  icon: true,
                  plain: true,
                  small: this.small,
                },
                on: {
                  ...on,
                  click: () => this.$emit('toggle'),
                },
              }, [
                h('v-icon', [this.readButtonIcon]),
              ])
            },
          },
        }, [h('span', [this.readTooltip])]),
      ])
    },
  })
})()
