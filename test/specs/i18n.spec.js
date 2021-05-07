import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { expect } from 'chai'

import i18n, { init, setLocale, reset } from '../../src'
import { escapeHtml } from '../../src/translate'
import config from './config'

function getLangLoader(locale) {
  // A runtime exception will be throw every time that the requested locale file
  // cannot be found. Webpack uses a regular expression to build all locales as
  // separate bundles.

  // Don't use string template here because of weird webpack bug:
  // https://github.com/webpack/webpack/issues/4921

  // eslint-disable-next-line global-require,import/no-dynamic-require,prefer-template
  return require('bundle-loader?lazy-loader!./locales/' + locale + '.po')
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

    it('should load the respective bundle if called after init', () => {
      setLocale('en_US')
      // return a promise and use mocha's built in promises support
      return init(getLangLoader, config).then(() => {
        expect(i18n('for')).to.equal('for')
        setLocale('de_DE')
        return init(getLangLoader, config).then(() => {
          expect(i18n('for')).to.equal('für')
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
      const t = i18n('This is a **__test__**.', {
        test: 'success',
        markdown: true,
      })
      expect(React.isValidElement(t)).to.be.true
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).to.equal(
        '<span>This is a <strong>success</strong>.</span>'
      )
    })

    it('should correctly escape interpolations when used with Markdown', () => {
      const t = i18n('This is a **__test__**.', {
        test: '<success>',
        markdown: true,
      })
      expect(React.isValidElement(t)).to.be.true
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).to.equal(
        '<span>This is a <strong>&lt;success&gt;</strong>.</span>'
      )
    })

    it('should not replace "__markdown__" placeholders', () => {
      const t = i18n('This is __markdown__.', { markdown: true })
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(<div>{t}</div>)
      expect(renderedHtml).to.equal(
        '<div><span>This is </span>__markdown__<span>.</span></div>'
      )
    })

    it.skip('should not be possible to break Markdown from interpolations', () => {
      const t = i18n('**__foo__**', { foo: 'bar** baz **baa', markdown: true })
      expect(React.isValidElement(t)).to.be.true
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).to.equal(
        '<span>foo <strong>bar** baz **baa</strong></span>'
      )
    })

    it('should support React elements as interpolation values', () => {
      const element = <div>element content</div>
      const t = i18n('before __reactElement__ after', {
        reactElement: element,
      })
      const elementClone = { ...t[1], key: null }

      expect(t).to.be.an('array')
      expect(t).to.have.length(3)
      expect(t[0]).to.equal('before ')
      expect(elementClone).to.deep.equal(element)
      expect(t[2]).to.equal(' after')
    })

    it('should support using the same React element multiple times', () => {
      const element = <div>element content</div>
      const t = i18n('before __reactElement__ within __reactElement__', {
        reactElement: element,
      })

      const elementClone1 = { ...t[1], key: null }
      const elementClone2 = { ...t[3], key: null }

      expect(t).to.be.an('array')
      expect(t).to.have.length(4)
      expect(t[0]).to.equal('before ')
      expect(elementClone1).to.deep.equal(element)
      expect(t[2]).to.equal(' within ')
      expect(elementClone2).to.deep.equal(element)
    })

    it('should keep HTML entities in translation messages unescaped', () => {
      const t = i18n('This is a <__test__>.', {
        test: React.createElement('span', null, 'success'),
      })
      expect(t).to.be.an('array')
      expect(t).to.have.length(3)
      expect(t[0]).to.equal('This is a <')
      expect(t[2]).to.equal('>.')
    })

    it('should keep original pattern for missing interpolations', () =>
      init(getLangLoader, config).then(() => {
        expect(i18n('1 __interpolation__ 2')).to.equal('1 __interpolation__ 2')
      }))

    it('should fallback to the translation key, if no translation was found.', () => {
      expect(i18n('This is not translated')).to.equal('This is not translated')

      setLocale('de_DE')

      return init(getLangLoader, config).then(() => {
        expect(i18n('This is not translated')).to.equal(
          'This is not translated'
        )
      })
    })

    it('should consider the context option, if provided', () => {
      setLocale('de_DE')

      return init(getLangLoader, config).then(() => {
        expect(i18n('Export')).to.equal('Exportiere')
        expect(i18n('Export', { context: 'button label' })).to.equal(
          'Exportieren'
        )
      })
    })

    it('should use the translation key without any msgctxt, if no msgctxt is provided', () => {
      setLocale('de_DE')

      return init(getLangLoader, config).then(() => {
        expect(i18n('Export')).to.equal('Exportiere')
      })
    })

    it('should resolve plural', () => {
      const t1 = i18n('__count__ day', '__count__ days', { count: 0 })
      const t2 = i18n('__count__ day', '__count__ days', { count: 2 })
      const t3 = i18n('__count__ day', '__count__ days', { count: -2 })
      expect(t1).to.be.a('string')
      expect(t1).to.equal('0 days')
      expect(t2).to.equal('2 days')
      expect(t3).to.equal('-2 days')
    })

    it('should resolve singular', () => {
      const t1 = i18n('__count__ case', '__count__ cases', { count: 1 })
      const t2 = i18n('__count__ case', '__count__ cases', { count: -1 })
      expect(t1).to.be.a('string')
      expect(t1).to.equal('1 case')
      expect(t2).to.equal('-1 case')
    })

    it('should assign unique keys to all React element interpolations', () => {
      const result = i18n(
        'This __button__ is used twice: __button__. __foo__',
        {
          button: React.createElement('button'),
          foo: React.createElement('span', { key: 'will-be-overridden' }),
        }
      )

      expect(result[1].key).to.equal('1')
      expect(result[3].key).to.equal('3')
      expect(result[5].key).to.equal('5')

      const resultMarkdown = i18n('A __button__ and a [link](#foo)', {
        button: React.createElement('button'),
        markdown: true,
      })
      resultMarkdown.forEach((element) => {
        expect(element).to.have.property('key')
      })
    })

    it('should allow defining a custom syntax for interpolations', () =>
      init(getLangLoader, {
        ...config,
        interpolationPattern: '\\{\\{(\\w+)\\}\\}',
      }).then(() => {
        expect(
          i18n('This is a {{interpolation}}', { interpolation: 'green test' })
        ).to.equal('This is a green test')
      }))

    it('should escape "&", "<", ">" \'"\' and "\'"', () => {
      const str = '<div> & <p> are so called \'html tags"'
      expect(escapeHtml(str)).to.equal(
        '&lt;div&gt; &amp; &lt;p&gt; are so called &#039;html tags&quot;'
      )
    })
  })
})
