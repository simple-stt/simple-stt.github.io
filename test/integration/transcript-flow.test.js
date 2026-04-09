const { expect } = require('chai')

const commands = require('../../ext/lib/commands')
const transcriptEngine = require('../../ext/lib/transcript-engine')

describe('shared transcript flow', () => {
  it('models the extension-style interim, manual suffix, and final speech flow', () => {
    const transformText = text => commands.transformTranscriptText(text, {
      lineBreak: 'carriage return',
      paragraphBreak: 'double carriage return',
    })

    let state = transcriptEngine.createTranscriptState({
      committedText: 'hello',
    })

    state = transcriptEngine.applyInterimSpeech(state, 'world', { transformText })
    expect(transcriptEngine.getDisplayedText(state)).to.equal('hello world')

    state = transcriptEngine.applyManualInput(state, 'hello world!')
    expect(transcriptEngine.getDisplayedText(state)).to.equal('hello world!')

    const result = transcriptEngine.applyFinalSpeech(state, 'world', {
      now: 1200,
      transformText,
    })

    expect(result.ignoredDuplicateFinal).to.equal(false)
    expect(result.state.committedText).to.equal('hello world!')
    expect(transcriptEngine.getDisplayedText(result.state)).to.equal('hello world!')
  })
})
