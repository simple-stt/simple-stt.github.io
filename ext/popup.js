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
  methods: {
    openLinkedPage() {
      window.SimpleSttSettings.openOrFocusExtensionPage('app.html')
      window.close()
    },
    openSettingsPage() {
      window.SimpleSttSettings.openOrFocusExtensionPage('options.html')
      window.close()
    },
  },
  mounted() {
    window.SimpleSttSettings.applyThemeVars(document)
  },
  render(h) {
    return h('v-app', { staticClass: 'popup-shell' }, [
      h('v-container', {
        staticClass: 'fill-height pa-4 d-flex align-center justify-center',
        props: { fluid: true },
      }, [
        h('v-card', {
          staticClass: 'popup-card',
          props: { outlined: true },
        }, [
          h('v-card-title', { staticClass: 'd-flex align-center justify-space-between py-3 px-4' }, [
            h('div', { staticClass: 'd-flex align-center popup-brand' }, [
              h('img', {
                staticClass: 'popup-logo',
                attrs: {
                  src: 'icons/icon-64.png',
                  alt: 'Simple STT logo',
                },
              }),
              h('div', { staticClass: 'text-h6 font-weight-medium' }, ['Simple STT']),
            ]),
            h('v-btn', {
              staticClass: 'grey--text text--lighten-1',
              props: {
                plain: true,
                icon: true,
                small: true,
              },
              attrs: {
                'aria-label': 'Open settings',
              },
              on: { click: this.openSettingsPage },
            }, [
              h('v-icon', ['mdi-cog']),
            ]),
          ]),
          h('v-divider'),
          h('v-card-text', { staticClass: 'py-4 px-4' }, [
            h('div', { staticClass: 'body-2 grey--text text--lighten-1' }, [
              'Open the full transcript workspace and start dictating.',
            ]),
          ]),
          h('v-divider'),
          h('v-card-actions', { staticClass: 'px-4 pb-4 pt-3' }, [
            h('v-btn', {
              props: {
                color: 'accent',
                depressed: true,
                block: true,
              },
              on: { click: this.openLinkedPage },
            }, [
              h('v-icon', { props: { left: true } }, ['mdi-open-in-new']),
              'Open App'
            ]),
          ]),
        ]),
      ]),
    ])
  },
})
