import { marked } from 'marked'
import React from 'react'

const defaultOptions = {
  markdown: false,
}

export default (singleton) => {
  return function translate(
    text: string,
    plural?: string | { [key: string]: any },
    options?: { [key: string]: any }
  ) {
    // singleton.messages contains the translation messages for the currently active languae
    // format: singular key -> [ plural key, singular translations, plural translation ]
    let finalOptions: any = options
    let finalPlural = plural

    if (!finalOptions && isPlainObject(finalPlural)) {
      finalOptions = plural
      finalPlural = undefined
    }

    finalOptions = {
      ...defaultOptions,
      ...finalOptions,
      context:
        finalOptions && finalOptions.context
          ? `${finalOptions.context}\u0004`
          : '',
    }

    const [translatedSingular, translatedPlural] = (
      singleton.messages[finalOptions.context + text] || [null, null, null]
    ).slice(1)

    // find the raw translation message
    let translation

    if (finalPlural && needsPlural(finalOptions)) {
      translation =
        translatedPlural && isString(translatedPlural)
          ? translatedPlural
          : finalPlural
    } else {
      translation =
        translatedSingular && isString(translatedSingular)
          ? translatedSingular
          : text
    }

    // apply markdown processing if necessary
    if (finalOptions.markdown) {
      translation = applyMarkdown(translation)
    }

    // insert regular interpolations
    translation = insertInterpolations(translation, finalOptions)

    // insert React component interpolations
    const result = insertReactComponentInterpolations(translation, finalOptions)

    return result.length === 1 ? result[0] : result
  }

  function needsPlural(options) {
    return isNumber(options.count) && Math.abs(options.count) !== 1
  }

  function isWrappedInPTag(translation) {
    return (
      translation.lastIndexOf('<p>') === 0 &&
      translation.indexOf('</p>') === translation.length - 5
    )
  }

  function applyMarkdown(translation) {
    // Escape underscores.
    // (Since we use underscores to denote interpolations, we have to
    // exclude them from the markdown notation. Use asterisk (*) instead.)
    let finalTranslation = marked(translation.replace(/_/g, '\\_'))

    // remove single, outer wrapping <p>-tag
    if (isWrappedInPTag(finalTranslation)) {
      // last occurrence of <p> is at the start, first occurrence of </p> is a the very end
      finalTranslation = finalTranslation.substring(
        3,
        finalTranslation.length - 5
      )
    }

    return finalTranslation.replace(/\\_/g, '_')
  }

  function htmlStringToReactComponent(html, { key }) {
    // eslint-disable-next-line react/no-danger
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />
  }

  function insertInterpolations(translation, options) {
    let regularInterpolations = {}

    for (const [key, value] of Object.entries(options)) {
      if (key !== 'markdown' && !React.isValidElement(value)) {
        regularInterpolations[key] = options[key]
      }
    }

    let finalTranslation = translation

    Object.entries(regularInterpolations).forEach(([key, val]) => {
      finalTranslation = finalTranslation.replace(
        new RegExp(singleton.interpolationPattern.replace('(\\w+)', key), 'g'),
        options.markdown ? escapeHtml(val) : val // only escape options when using markdown
      )
    })

    return finalTranslation
  }

  function insertReactComponentInterpolations(translation, options) {
    const result = []
    let match
    let substr
    let start = 0

    const interpolationRegExp = new RegExp(singleton.interpolationPattern, 'g')
    while ((match = interpolationRegExp.exec(translation)) !== null) {
      const key = match[1]
      const component = options[key]

      if (match.index > 0) {
        substr = translation.substring(start, match.index)
        result.push(
          options.markdown
            ? htmlStringToReactComponent(substr, {
                key: result.length,
              })
            : substr
        )
      }

      if (React.isValidElement(component)) {
        result.push(React.cloneElement(component, { key: result.length }))
      } else {
        // no interpolation specified, leave the placeholder unchanged
        result.push(match[0])
      }
      start = interpolationRegExp.lastIndex
    }

    // append part after last match
    if (start < translation.length) {
      substr = translation.substring(start)
      result.push(
        options.markdown
          ? htmlStringToReactComponent(substr, {
              key: result.length,
            })
          : substr
      )
    }

    // re-concatenate all string elements
    return result.reduce((acc, element) => {
      const lastAccumulatedElement = acc[acc.length - 1]
      if (isString(element) && isString(lastAccumulatedElement)) {
        // eslint-disable-next-line no-param-reassign
        acc[acc.length - 1] = lastAccumulatedElement + element
      } else {
        acc.push(element)
      }
      return acc
    }, [])
  }
}

// Stack Overflow approves
// See https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript/6234804#6234804

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const isString = (str) => str && typeof str.valueOf() === 'string'
const isNumber = (num) => num != null && typeof num.valueOf() === 'number'
const isPlainObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]'
