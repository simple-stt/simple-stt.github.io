const path = require('path')
const { expect } = require('chai')

const { DIST_DIR, resolveRequestPath } = require('../../server')

describe('server path resolution', () => {
  it('maps the root request to dist/index.html', () => {
    expect(resolveRequestPath(DIST_DIR, '/')).to.equal(
      path.join(DIST_DIR, 'index.html')
    )
  })

  it('rejects path traversal outside dist', () => {
    expect(resolveRequestPath(DIST_DIR, '/../README.md')).to.equal(null)
  })
})
