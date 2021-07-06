import getConfig from '../../../src/scripts/config'

describe('config', () => {
  it(
    'should load the next .i18nrc it finds while traversing its parents.',
    () => {
      const config = getConfig('test/fixtures/i18nConfigDir/parent/child')

      expect(config).toHaveProperty('key')
      expect(config.key).toBe('value')
    }
  )

  it('should find the config if the specified folder contains it.', () => {
    const config = getConfig('test/fixtures/i18nConfigDir')

    expect(config).toHaveProperty('key')
    expect(config.key).toBe('value')
  })

  it('should pickup babel configs', () => {
    const config = getConfig('test/fixtures/i18nConfigDir')

    expect(config).toHaveProperty('babel')
    expect(config.babel).toEqual({
      plugins: ['transform-flow-strip-types'],
    })
  })
})
