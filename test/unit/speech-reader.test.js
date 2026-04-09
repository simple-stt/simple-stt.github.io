const { expect } = require('chai')

const speechReader = require('../../ext/lib/speech-reader')

describe('speech reader', () => {
  it('cleans markdownish noise while preserving readable text', () => {
    const cleaned = speechReader.cleanText(`
# Heading
Visit https://example.com
**Bold** and [linked](https://example.com) text
`)

    expect(cleaned).to.include('Heading')
    expect(cleaned).to.include('Bold and linked text')
    expect(cleaned).to.not.include('https://example.com')
  })

  it('chunks long text into multiple readable pieces', () => {
    const chunks = speechReader.chunkText(
      [
        'Alpha sentence one is already fairly long and descriptive.',
        'Beta sentence two keeps going with enough additional words to make the reader break this into saner speech chunks instead of one giant utterance.',
        'Gamma sentence three adds even more text so the chunker has to split the passage across multiple pieces for stable playback.',
      ].join(' ')
    )

    expect(chunks.length).to.be.greaterThan(1)
    expect(chunks.join(' ')).to.include('Alpha sentence one')
  })

  it('derives language options from the available voices', () => {
    const options = speechReader.getLanguageOptions([
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Google UK English Male', lang: 'en-GB' },
    ])

    expect(options).to.deep.equal([
      { text: 'English (US)', value: 'en-US' },
      { text: 'English (UK)', value: 'en-GB' },
    ])
  })

  it('filters selectable voices to the chosen language when matches exist', () => {
    const voices = speechReader.getSelectableVoices([
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Google UK English Male', lang: 'en-GB' },
    ], 'en-GB')

    expect(voices).to.deep.equal([
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Google UK English Male', lang: 'en-GB' },
    ])
  })
})
