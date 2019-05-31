// @flow
import escape from 'lodash/escape'
import forEach from 'lodash/forEach'
import has from 'lodash/has'
import isNumber from 'lodash/isNumber'
import pickBy from 'lodash/pickBy'
import marked from 'marked'
import React, { type Node } from 'react'

import { type TranslationsT } from './types'

const placeholderRegex = /__(\w+)__/g

type OptionsT = {
  markdown?: boolean,
  context?: string,
}

type PluralOptionsT = OptionsT & {
  count: number,
}
const defaultOptions = {
  markdown: false,
}

export default (singleton: TranslationsT) =>
  function translate(
    text: string,
    plural?: string | OptionsT,
    options?: PluralOptionsT
  ) {
    // singleton.messages contains the translation messages for the currently active languae
    // format: singular key -> [ plural key, singular translations, plural translation ]
    let finalOptions = options
    let finalPlural = plural

    if (!finalOptions && typeof plural !== 'string') {
      finalOptions = (plural: ?OptionsT)
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
        translatedPlural && typeof translatedPlural === 'string'
          ? translatedPlural
          : finalPlural
    } else {
      translation =
        translatedSingular && typeof translatedSingular === 'string'
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

function needsPlural(options: PluralOptionsT) {
  return isNumber(options.count) && Math.abs(options.count) !== 1
}

function isWrappedInPTag(translation: string) {
  return (
    translation.lastIndexOf('<p>') === 0 &&
    translation.indexOf('</p>') === translation.length - 5
  )
}

function applyMarkdown(translation: string) {
  // Escape underscores.
  // (Since we use underscores to denote interpolations, we have to
  // exclude them from the markdown notation. Use asterisk (*) instead.)
  let finalTranslation = marked(translation.replace(/_/g, '\\_'))

  // remove single, outer wrapping <p>-tag
  if (isWrappedInPTag(finalTranslation)) {
    // last occurrence of <p> is at the start, first occurence of </p> is a the very end
    finalTranslation = finalTranslation.substring(
      3,
      finalTranslation.length - 5
    )
  }

  return finalTranslation.replace(/\\_/g, '_')
}

function htmlStringToReactComponent(html: string) {
  // eslint-disable-next-line react/no-danger
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function insertInterpolations(translation: string, options) {
  const regularInterpolations = pickBy(
    options,
    (val: Node, key) => !has(defaultOptions, key) && !React.isValidElement(val)
  )

  let finalTranslation = translation

  forEach(regularInterpolations, (val, key) => {
    finalTranslation = finalTranslation.replace(
      new RegExp(`__${key}__`, 'g'),
      options.markdown ? escape(val) : val // only escape options when using markdown
    )
  })

  return finalTranslation
}

function insertReactComponentInterpolations(
  translation: string,
  options: OptionsT
): Array<Node> {
  const result = []
  let match
  let substr
  let start = 0

  while ((match = placeholderRegex.exec(translation)) !== null) {
    if (!match) {
      break
    }

    const key = match[1]
    const component = options[key]

    if (match.index > 0) {
      substr = translation.substring(start, match.index)
      result.push(
        options.markdown ? htmlStringToReactComponent(substr) : substr
      )
    }

    if (React.isValidElement(component)) {
      result.push(
        result.indexOf(component) >= 0
          ? React.cloneElement(component)
          : component
      )
    } else {
      // no interpolation specified, leave the placeholder unchanged
      result.push(match[0])
    }
    start = placeholderRegex.lastIndex
  }

  // append part after last match
  if (start < translation.length) {
    substr = translation.substring(start)
    result.push(options.markdown ? htmlStringToReactComponent(substr) : substr)
  }

  // re-concatenate all string elements
  return result.reduce((acc: Array<Node>, element: Node) => {
    const lastAccumulatedElement = acc[acc.length - 1]
    if (
      typeof element === 'string' &&
      typeof lastAccumulatedElement === 'string'
    ) {
      // eslint-disable-next-line no-param-reassign
      acc[acc.length - 1] = lastAccumulatedElement + element
    } else {
      acc.push(element)
    }
    return acc
  }, [])
}
