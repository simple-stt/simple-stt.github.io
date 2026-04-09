const { expect } = require('chai')

const commands = require('../../ext/lib/commands')
const transcriptEngine = require('../../ext/lib/transcript-engine')

function transformText(text) {
  return commands.transformTranscriptText(text, {
    lineBreak: 'carriage return',
    paragraphBreak: 'double carriage return',
  })
}

describe('transcript engine', () => {
  it('adds a boundary between plain transcript chunks', () => {
    expect(transcriptEngine.appendTextWithBoundary('alpha', 'beta')).to.equal('alpha beta')
    expect(transcriptEngine.appendTextWithBoundary('alpha ', 'beta')).to.equal('alpha beta')
  })

  it('keeps interim speech and pending manual text in one displayed surface', () => {
    const state = transcriptEngine.createTranscriptState({
      committedText: 'alpha',
      speechInterim: 'beta',
      pendingPostSpeechText: ' gamma',
    })

    expect(transcriptEngine.getDisplayedText(state)).to.equal('alpha beta gamma')
  })

  it('keeps manual suffix text pending while interim speech is visible', () => {
    const state = transcriptEngine.applyManualInput(
      transcriptEngine.createTranscriptState({
        committedText: 'alpha',
        speechInterim: 'beta',
      }),
      'alpha beta gamma'
    )

    expect(state.committedText).to.equal('alpha')
    expect(state.speechInterim).to.equal('beta')
    expect(state.pendingPostSpeechText).to.equal(' gamma')
  })

  it('commits final speech before the pending manual suffix', () => {
    const initialState = transcriptEngine.createTranscriptState({
      committedText: 'alpha',
      speechInterim: 'beta',
      pendingPostSpeechText: ' gamma',
      manualEditVersion: 3,
    })

    const result = transcriptEngine.applyFinalSpeech(initialState, 'beta', {
      now: 1000,
      transformText,
    })

    expect(result.ignoredDuplicateFinal).to.equal(false)
    expect(result.state.committedText).to.equal('alpha beta gamma')
    expect(result.state.pendingPostSpeechText).to.equal('')
    expect(result.appendedText).to.equal(' beta')
  })

  it('suppresses duplicate finals when the same speech commit repeats immediately', () => {
    const initialState = transcriptEngine.createTranscriptState({
      committedText: 'alpha beta',
      manualEditVersion: 3,
      lastSpeechCommit: {
        text: 'beta',
        before: 'alpha',
        after: 'alpha beta',
        at: 1000,
        manualEditVersion: 2,
      },
    })

    const result = transcriptEngine.applyFinalSpeech(initialState, 'beta', {
      now: 1500,
      transformText,
    })

    expect(result.ignoredDuplicateFinal).to.equal(true)
    expect(result.state.committedText).to.equal('alpha beta')
  })
})
