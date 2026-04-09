(function () {
  Vue.component('composer-controls', {
    props: {
      hasText: {
        type: Boolean,
        default: false,
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
    methods: {
      renderButton(h, icon, label, colorClass, eventName) {
        return h('v-btn', {
          staticClass: colorClass,
          props: {
            disabled: !this.hasText,
            icon: this.isMobile,
            small: this.isMobile,
            text: !this.isMobile,
          },
          on: {
            click: () => this.$emit(eventName),
          },
        }, [
          h('v-icon', {
            props: {
              left: !this.isMobile,
              small: this.isCompact,
            },
          }, [icon]),
          this.isMobile ? null : h('span', [label]),
        ])
      },
    },
    render(h) {
      return h('div', { staticClass: 'd-flex align-center composer-controls' }, [
        this.renderButton(h, 'mdi-broom', 'Clear', 'grey--text text--darken-1', 'clear'),
        this.renderButton(h, 'mdi-content-cut', 'Cut', 'grey--text text--lighten-1', 'cut'),
        this.renderButton(h, 'mdi-content-copy', 'Copy', 'grey--text text--lighten-1', 'copy'),
      ])
    },
  })
})()
