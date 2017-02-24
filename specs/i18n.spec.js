import React from 'react'
import ReactDOMServer from 'react-dom/server'

import { expect } from 'chai'

import i18n, { init, setLocale, reset } from '../src/index'

import config from './config'

function getLangLoader(locale) {
  // A runtime exception will be throw every time that the requested locale file
  // cannot be found. Webpack uses a regular expression to build all locales as
  // separate bundles.
  // eslint-disable-next-line global-require,import/no-dynamic-require
  return require(`bundle?lazy!./locales/${locale}.po`)
}

describe('i18n', () => {
  beforeEach(reset)

  describe('setLocale', () => {
    it('should make sure the correct bundle will be loaded when init is called', () => {
      setLocale('de_DE')
      // return a promise and use mocha's built in promises support
      return init(getLangLoader, config).then(() => {
        expect(i18n('for')).to.equal('für')
      })
    })

    it('should load the respective bundle if called after init', (done) => {
      setLocale('en_US')
      // return a promise and use mocha's built in promises support
      init(getLangLoader, config).then(() => {
        expect(i18n('for')).to.equal('for')
        setLocale('de_DE')
        return init(getLangLoader, config).then(() => {
          expect(i18n('for')).to.equal('für')

          done()
        })
      })
    })
  })

  describe('#translate', () => {
    it('should return a plain string whenever possible', () => {
      const t = i18n('This is a __test__.', { test: 'success' })
      expect(t).to.be.a('string')
      expect(t).to.equal('This is a success.')
    })

    it('should not escape interpolations', () => {
      const t = i18n('This is a __test__.', { test: '<success>' })
      expect(t).to.be.a('string')
      expect(t).to.equal('This is a <success>.')
    })

    it('should support using Markdown in translation messages', () => {
      const t = i18n('This is a **__test__**.', { test: 'success', markdown: true })
      expect(React.isValidElement(t)).to.be.true
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).to.equal('<span>This is a <strong>success</strong>.</span>')
    })

    it('should correctly escape interpolations when used with Markdown', () => {
      const t = i18n('This is a **__test__**.', { test: '<success>', markdown: true })
      expect(React.isValidElement(t)).to.be.true
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).to.equal('<span>This is a <strong>&lt;success&gt;</strong>.</span>')
    })

    it.skip('should not be possible to break Markdown from interpolations', () => {
      const t = i18n('**__foo__**', { foo: 'bar** baz **baa', markdown: true })
      expect(React.isValidElement(t)).to.be.true
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).to.equal('<span>foo <strong>bar** baz **baa</strong></span>')
    })

    it('should support React components for interpolation values', () => {
      const comp = <div>comp content</div>
      const t = i18n('before __reactComp__ after', {
        reactComp: comp,
      })

      expect(t).to.be.an('array')
      expect(t).to.have.length(3)
      expect(t[0]).to.equal('before ')
      expect(t[1]).to.equal(comp)
      expect(t[2]).to.equal(' after')
    })

    it('should support using the same React component multiple times', () => {
      const comp = <div>comp content</div>
      const t = i18n('before __reactComp__ within __reactComp__', {
        reactComp: comp,
      })

      expect(t).to.be.an('array')
      expect(t).to.have.length(4)
      expect(t[0]).to.equal('before ')
      expect(t[1]).to.deep.equal(comp)
      expect(t[2]).to.equal(' within ')
      expect(t[3]).to.deep.equal(comp)
    })

    it('should keep HTML entities in translation messages unescaped', () => {
      const t = i18n('This is a <__test__>.', { test: React.createElement('span', null, 'success') })
      expect(t).to.be.an('array')
      expect(t).to.have.length(3)
      expect(t[0]).to.equal('This is a <')
      expect(t[2]).to.equal('>.')
    })

    it('should fallback to the translation key, if no translation was found.', (done) => {
      expect(i18n('This is not translated')).to.equal('This is not translated')

      setLocale('de_DE')

      init(getLangLoader, config).then(() => {
        expect(i18n('This is not translated')).to.equal('This is not translated')

        done()
      }).catch(done)
    })

    it('should consider the context option, if provided', (done) => {
      setLocale('de_DE')

      init(getLangLoader, config).then(() => {
        expect(i18n('Export', { context: 'button label' })).to.equal('Exportieren')

        done()
      }).catch(done)
    })

    it('should use the translation key without any msgctxt, if no msgctxt is provided', (done) => {
      setLocale('de_DE')

      init(getLangLoader, config).then(() => {
        expect(i18n('Export')).to.equal('Exportiere')

        done()
      }).catch(done)
    })
  })
})
