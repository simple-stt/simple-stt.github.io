(function () {
  Vue.component('app-brand', {
    computed: {
      isMobile() {
        return Boolean(this.$vuetify.breakpoint.xsOnly)
      },
      isTablet() {
        return Boolean(this.$vuetify.breakpoint.mdAndDown)
      },
      logoSize() {
        return this.isMobile ? 36 : 54
      },
      showTitle() {
        return true
      },
      titleClass() {
        if (this.isMobile) return 'text-subtitle-1 font-weight-medium'
        if (this.isTablet) return 'text-h6 font-weight-medium'
        return 'text-h5 font-weight-medium'
      },
    },
    render(h) {
      return h('div', { staticClass: 'd-flex align-center min-width-0 simple-stt-brand' }, [
        h('v-avatar', {
          staticClass: 'mr-3',
          props: {
            size: this.logoSize,
            tile: true,
          },
        }, [
          h('img', {
            staticClass: 'simple-stt-logo',
            attrs: {
              src: 'icons/icon-128.png',
              alt: 'Simple STT logo',
            },
          }),
        ]),
        this.showTitle
          ? h('div', { staticClass: 'min-width-0' }, [
            h('div', { staticClass: this.titleClass }, ['Simple STT']),
            this.isTablet
              ? null
              : h('div', {
                staticClass: 'body-2 grey--text text--lighten-1',
              }, ['Speech-to-text, simplified.']),
          ])
          : null,
      ])
    },
  })
})()
