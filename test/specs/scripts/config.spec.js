import { expect } from 'chai'

import getConfig from '../../../src/scripts/config'

describe('config', () => {
  it('should load the next .i18nrc it finds while traversing its parents.', () => {
    const config = getConfig('test/fixtures/i18nConfigDir/parent/child')

    expect(config).to.have.property('key')
    expect(config.key).to.equal('value')
  })

  it('should find the config if the specified folder contains it.', () => {
    const config = getConfig('test/fixtures/i18nConfigDir')

    expect(config).to.have.property('key')
    expect(config.key).to.equal('value')
  })

  it('should pickup babel configs', () => {
    const config = getConfig('test/fixtures/i18nConfigDir')

    expect(config).to.have.property('babel')
    expect(config.babel).to.eql({
      plugins: ['transform-flow-strip-types'],
    })
  })
})
