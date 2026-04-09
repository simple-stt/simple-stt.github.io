const { expect } = require('chai')

const settingsSchema = require('../../ext/lib/settings-schema')

describe('settings schema', () => {
  it('returns normalized defaults for missing values', () => {
    const settings = settingsSchema.normalizeSettings(null)

    expect(settings.commandPhrases.lineBreak).to.equal('carriage return')
    expect(settings.commandPhrases.paragraphBreak).to.equal('double carriage return')
    expect(settings.hotkeys.toggleTranscribing).to.equal('Alt+Shift+R')
    expect(settings.speech.language).to.equal('en-US')
    expect(settings.speech.voiceName).to.equal('Google US English')
    expect(settings.insertIntoActiveField).to.equal(true)
  })

  it('merges nested settings patches cleanly', () => {
    const settings = settingsSchema.mergeSettings(settingsSchema.cloneDefaults(), {
      commandPhrases: {
        lineBreak: 'line break',
      },
      hotkeys: {
        toggleTranscribing: 'cmd+shift+t',
      },
      speech: {
        language: 'en-GB',
        voiceName: 'Google US English',
      },
      insertIntoActiveField: false,
    })

    expect(settings.commandPhrases.lineBreak).to.equal('line break')
    expect(settings.commandPhrases.paragraphBreak).to.equal('double carriage return')
    expect(settings.hotkeys.toggleTranscribing).to.equal('Cmd+Shift+T')
    expect(settings.speech.language).to.equal('en-GB')
    expect(settings.speech.voiceName).to.equal('Google US English')
    expect(settings.insertIntoActiveField).to.equal(false)
  })
})
