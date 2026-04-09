(function () {
  Vue.component('composer-field', {
    props: {
      value: {
        type: String,
        default: '',
      },
    },
    data() {
      return {
        autoFollowScroll: true,
        textareaEl: null,
      }
    },
    mounted() {
      this.bindTextarea()
    },
    updated() {
      this.bindTextarea()
    },
    beforeDestroy() {
      this.unbindTextarea()
    },
    methods: {
      getTextareaElement() {
        const field = this.$refs.transcriptField
        if (!field || !field.$el) return null
        return field.$el.querySelector('textarea')
      },
      bindTextarea() {
        const textarea = this.getTextareaElement()
        if (textarea === this.textareaEl) return

        this.unbindTextarea()
        this.textareaEl = textarea

        if (!this.textareaEl) return

        this.textareaEl.addEventListener('scroll', this.handleTextareaScroll, {
          passive: true,
        })
        this.autoFollowScroll = true
      },
      unbindTextarea() {
        if (!this.textareaEl) return
        this.textareaEl.removeEventListener('scroll', this.handleTextareaScroll)
        this.textareaEl = null
      },
      isNearBottom() {
        const textarea = this.getTextareaElement()
        if (!textarea) return true

        const remaining = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight
        return remaining <= 48
      },
      handleTextareaScroll() {
        this.autoFollowScroll = this.isNearBottom()
      },
      focusTranscript(selectAll) {
        this.$nextTick(() => {
          const textarea = this.getTextareaElement()
          if (!textarea) return
          textarea.focus()
          if (selectAll) textarea.select()
        })
      },
      scrollDraftToBottom() {
        const textarea = this.getTextareaElement()
        if (!textarea) return
        if (!this.autoFollowScroll && !this.isNearBottom()) return
        textarea.scrollTop = textarea.scrollHeight
        this.autoFollowScroll = true
      },
      getReadingContext(fullText, options) {
        const nextOptions = options && typeof options === 'object' ? options : {}
        const text = String(fullText || '')
        const textarea = this.getTextareaElement()

        if (!textarea || nextOptions.restart) {
          return {
            mode: 'full',
            start: 0,
            text: text.trim(),
          }
        }

        const selectionStart = Number(textarea.selectionStart || 0)
        const selectionEnd = Number(textarea.selectionEnd || 0)

        if (selectionEnd > selectionStart) {
          const selectedText = text.slice(selectionStart, selectionEnd)
          if (selectedText.trim()) {
            return {
              mode: 'selection',
              start: selectionStart,
              text: selectedText,
            }
          }
        }

        const fromCursor = text.slice(selectionStart)
        if (selectionStart < text.length - 1 && fromCursor.trim()) {
          return {
            mode: 'cursor',
            start: selectionStart,
            text: fromCursor.trimStart(),
          }
        }

        return {
          mode: 'full',
          start: 0,
          text: text.trim(),
        }
      },
    },
    render(h) {
      return h('v-card-text', { staticClass: 'simple-stt-body' }, [
        h('v-textarea', {
          ref: 'transcriptField',
          staticClass: 'transcript-textarea',
          props: {
            autoGrow: true,
            hideDetails: true,
            outlined: true,
            placeholder: 'Speak or type here',
            rows: 10,
            value: this.value,
          },
          on: {
            input: value => this.$emit('input', value),
          },
        }),
      ])
    },
  })
})()
