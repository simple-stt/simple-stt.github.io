const fs = require('fs')
const path = require('path')
const { expect } = require('chai')

const ROOT = path.resolve(__dirname, '../..')

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath))
}

describe('repo public surfaces', () => {
  it('keeps the public extension and static web surfaces in place', () => {
    expect(exists('ext/manifest.json')).to.equal(true)
    expect(exists('ext/app.html')).to.equal(true)
    expect(exists('ext/popup.html')).to.equal(true)
    expect(exists('ext/options.html')).to.equal(true)
    expect(exists('ext/settings.js')).to.equal(true)
    expect(exists('ext/vendor/vue.runtime.js')).to.equal(true)
    expect(exists('dist')).to.equal(true)
    expect(exists('server.js')).to.equal(true)
    expect(exists('README.md')).to.equal(true)
    expect(exists('package.json')).to.equal(true)
  })

  it('keeps the shared product library in the public repo contract', () => {
    expect(exists('ext/lib/commands.js')).to.equal(true)
    expect(exists('ext/lib/transcript-engine.js')).to.equal(true)
    expect(exists('ext/lib/hotkeys.js')).to.equal(true)
    expect(exists('ext/lib/settings-schema.js')).to.equal(true)
    expect(exists('ext/lib/speech-session.js')).to.equal(true)
  })
})
