import ReactDOMServer from 'react-dom/server'

import i18n from '../../src'

describe('Test interpolation', () => {
  it('should support using interpolation with Markdown and number', () => {
    const t = i18n('This is a **__test__**.', {
      test: 100,
      markdown: true,
    })

    // expect(t).toBe({})
    const renderedHtml = ReactDOMServer.renderToStaticMarkup(t)
    expect(renderedHtml).toBe('<span>This is a <strong>100</strong>.</span>')
  })
})
