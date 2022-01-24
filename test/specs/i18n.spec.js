import React from 'react'
import ReactDOMServer from 'react-dom/server'

import i18n, { init, setLocale, reset } from '../../src'
import { escapeHtml } from '../../src/translate'
import config from './config'

function getLangLoader(locale) {
  // eslint-disable-next-line global-require,import/no-dynamic-require,prefer-template
  return require('./locales/' + locale + '.po')
}

describe('i18n', () => {
  beforeEach(reset)

  describe('setLocale', () => {
    it('should make sure the correct bundle will be loaded when init is called', () => {
      setLocale('de_DE')
      // return a promise and use mocha's built in promises support
      return init(getLangLoader, config).then(() => {
        expect(i18n('for')).toBe('für')
      })
    })

    it('should load the respective bundle if called after init', () => {
      setLocale('en_US')
      // return a promise and use mocha's built in promises support
      return init(getLangLoader, config).then(() => {
        expect(i18n('for')).toBe('for')
        setLocale('de_DE')
        return init(getLangLoader, config).then(() => {
          expect(i18n('for')).toBe('für')
        })
      })
    })
  })

  describe('#translate', () => {
    it('should return a plain string whenever possible', () => {
      const t = i18n('This is a __test__.', { test: 'success' })
      expect(typeof t).toBe('string')
      expect(t).toBe('This is a success.')
    })

    it('should not escape interpolations', () => {
      const t = i18n('This is a __test__.', { test: '<success>' })
      expect(typeof t).toBe('string')
      expect(t).toBe('This is a <success>.')
    })

    it('should support using Markdown in translation messages', () => {
      const t = i18n('This is a **__test__**.', {
        test: 'success',
        markdown: true,
      })
      expect(React.isValidElement(t)).toBe(true)
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).toBe(
        '<span>This is a <strong>success</strong>.</span>'
      )
    })

    it('should correctly escape interpolations when used with Markdown', () => {
      const t = i18n('This is a **__test__**.', {
        test: '<success>',
        markdown: true,
      })
      expect(React.isValidElement(t)).toBe(true)
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).toBe(
        '<span>This is a <strong>&lt;success&gt;</strong>.</span>'
      )
    })

    it('should not replace "__markdown__" placeholders', () => {
      const t = i18n('This is __markdown__.', { markdown: true })
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(<div>{t}</div>)
      expect(renderedHtml).toBe(
        '<div><span>This is </span>__markdown__<span>.</span></div>'
      )
    })

    it('should not be possible to break Markdown from interpolations', () => {
      const t = i18n('**__foo__**', { foo: 'bar** baz **baa', markdown: true })
      expect(React.isValidElement(t)).toBe(true)
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).toBe('<span><strong>bar** baz **baa</strong></span>')
    })

    it('should support React elements as interpolation values', () => {
      const element = <div>element content</div>
      const t = i18n('before __reactElement__ after', {
        reactElement: element,
      })
      const elementClone = { ...t[1], key: null }

      expect(Array.isArray(t)).toBe(true)
      expect(t).toHaveLength(3)
      expect(t[0]).toBe('before ')
      expect(elementClone).toEqual(element)
      expect(t[2]).toBe(' after')
    })

    it('should support using the same React element multiple times', () => {
      const element = <div>element content</div>
      const t = i18n('before __reactElement__ within __reactElement__', {
        reactElement: element,
      })

      const elementClone1 = { ...t[1], key: null }
      const elementClone2 = { ...t[3], key: null }

      expect(Array.isArray(t)).toBe(true)
      expect(t).toHaveLength(4)
      expect(t[0]).toBe('before ')
      expect(elementClone1).toEqual(element)
      expect(t[2]).toBe(' within ')
      expect(elementClone2).toEqual(element)
    })

    it('should keep HTML entities in translation messages unescaped', () => {
      const t = i18n('This is a <__test__>.', {
        test: React.createElement('span', null, 'success'),
      })
      expect(Array.isArray(t)).toBe(true)
      expect(t).toHaveLength(3)
      expect(t[0]).toBe('This is a <')
      expect(t[2]).toBe('>.')
    })

    it('should keep original pattern for missing interpolations', () =>
      init(getLangLoader, config).then(() => {
        expect(i18n('1 __interpolation__ 2')).toBe('1 __interpolation__ 2')
      }))

    it('should fallback to the translation key, if no translation was found.', () => {
      expect(i18n('This is not translated')).toBe('This is not translated')

      setLocale('de_DE')

      return init(getLangLoader, config).then(() => {
        expect(i18n('This is not translated')).toBe('This is not translated')
      })
    })

    it('should consider the context option, if provided', () => {
      setLocale('de_DE')

      return init(getLangLoader, config).then(() => {
        expect(i18n('Export')).toBe('Exportiere')
        expect(i18n('Export', { context: 'button label' })).toBe('Exportieren')
      })
    })

    it('should use the translation key without any msgctxt, if no msgctxt is provided', () => {
      setLocale('de_DE')

      return init(getLangLoader, config).then(() => {
        expect(i18n('Export')).toBe('Exportiere')
      })
    })

    it('should resolve plural', () => {
      const t1 = i18n('__count__ day', '__count__ days', { count: 0 })
      const t2 = i18n('__count__ day', '__count__ days', { count: 2 })
      const t3 = i18n('__count__ day', '__count__ days', { count: -2 })
      expect(typeof t1).toBe('string')
      expect(t1).toBe('0 days')
      expect(t2).toBe('2 days')
      expect(t3).toBe('-2 days')
    })

    it('should resolve singular', () => {
      const t1 = i18n('__count__ case', '__count__ cases', { count: 1 })
      const t2 = i18n('__count__ case', '__count__ cases', { count: -1 })
      expect(typeof t1).toBe('string')
      expect(t1).toBe('1 case')
      expect(t2).toBe('-1 case')
    })

    it('should assign unique keys to all React element interpolations', () => {
      const result = i18n(
        'This __button__ is used twice: __button__. __foo__',
        {
          button: React.createElement('button'),
          foo: React.createElement('span', { key: 'will-be-overridden' }),
        }
      )

      expect(result[1].key).toBe('1')
      expect(result[3].key).toBe('3')
      expect(result[5].key).toBe('5')

      const resultMarkdown = i18n('A __button__ and a [link](#foo)', {
        button: React.createElement('button'),
        markdown: true,
      })
      resultMarkdown.forEach((element) => {
        expect(element).toHaveProperty('key')
      })
    })

    it('should allow defining a custom syntax for interpolations', () =>
      init(getLangLoader, {
        ...config,
        interpolationPattern: '\\{\\{(\\w+)\\}\\}',
      }).then(() => {
        expect(
          i18n('This is a {{interpolation}}', { interpolation: 'green test' })
        ).toBe('This is a green test')
      }))

    it('should escape "&", "<", ">" \'"\' and "\'"', () => {
      const str = '<div> & <p> are so called \'html tags"'
      expect(escapeHtml(str)).toBe(
        '&lt;div&gt; &amp; &lt;p&gt; are so called &#039;html tags&quot;'
      )
    })

    it('should handle undefined values with markdown', () => {
      expect(
        i18n(undefined, {
          markdown: true,
        })
      ).toStrictEqual([])
    })

    it('should handle undefined values without markdown', () => {
      expect(i18n(undefined, {})).toStrictEqual([])
    })

    it('should support using Markdown in translation with number', () => {
      const t = i18n('This is a **__test__**.', {
        test: 100,
        markdown: true,
      })
      expect(React.isValidElement(t)).toBe(true)
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
      expect(renderedHtml).toBe('<span>This is a <strong>100</strong>.</span>')
    })
  })
})
