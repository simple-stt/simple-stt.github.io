const { expect } = require('chai')

const commands = require('../../ext/lib/commands')

describe('commands', () => {
  it('replaces configured spoken command phrases with line breaks', () => {
    const result = commands.transformTranscriptText(
      'alpha carriage return beta double carriage return gamma',
      {
        lineBreak: 'carriage return',
        paragraphBreak: 'double carriage return',
      }
    )

    expect(result).to.equal('alpha \n beta \n\n gamma')
  })

  it('ignores empty command phrases', () => {
    const result = commands.transformTranscriptText('alpha beta', {
      lineBreak: '',
      paragraphBreak: '   ',
    })

    expect(result).to.equal('alpha beta')
  })
})
