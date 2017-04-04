// @flow
import gettextParser from 'gettext-parser'
import fs from 'fs'

import type { AddLocationT, ConfigT } from '../../types'

const DEFAULT_FUNCTION_NAME = 'i18n'

const DEFAULT_FILE_NAME = 'messages.pot'

const DEFAULT_HEADERS = {
  'content-type': 'text/plain; charset=UTF-8',
}

const DEFAULT_ADD_LOCATION = 'full'

function isStringLiteral(node) {
  return node.type === 'StringLiteral'
}

function isStringConcatExpr(node) {
  const left = node.left
  const right = node.right

  return node.type === 'BinaryExpression' && node.operator === '+' && (
    (isStringLiteral(left) || isStringConcatExpr(left)) &&
    (isStringLiteral(right) || isStringConcatExpr(right))
  )
}

function getStringValue(node) {
  if (isStringLiteral(node)) {
    return node.value
  }

  if (isStringConcatExpr(node)) {
    return getStringValue(node.left) + getStringValue(node.right)
  }

  return null
}

function getTranslatorComment(node) {
  const comments = [];
  (node.leadingComments || []).forEach((commentNode) => {
    const match = commentNode.value.match(/^\s*translators:\s*(.*?)\s*$/im)
    if (match) {
      comments.push(match[1])
    }
  })
  return comments.length > 0 ? comments.join('\n') : null
}

function getReference(addLocation: AddLocationT, fn: string, node): ?string {
  if (!addLocation || addLocation === 'full') {
    return `${fn}:${node.loc.start.line}`
  }

  if (addLocation === 'file') {
    return fn
  }

  return null
}

export default function plugin() {
  let currentFileName
  let data
  const relocatedComments = {}

  return { visitor: {

    VariableDeclaration({ node }) {
      const translatorComment = getTranslatorComment(node)
      if (!translatorComment) {
        return
      }
      node.declarations.forEach((declarator) => {
        const comment = getTranslatorComment(declarator)
        if (!comment) {
          const key = `${declarator.init.start}|${declarator.init.end}`
          relocatedComments[key] = translatorComment
        }
      })
    },

    CallExpression({ node, parent }, config: ConfigT) {
      const {
        functionName = DEFAULT_FUNCTION_NAME,
        fileName = DEFAULT_FILE_NAME,
        headers = DEFAULT_HEADERS,
        addLocation = DEFAULT_ADD_LOCATION,
        noLocation = false,
      } = config.opts

      let base = config.opts.baseDirectory
      if (base) {
        base = `${base.match(/^(.*?)\/*$/)[1]}/`
      }

      if (fileName !== currentFileName) {
        currentFileName = fileName
        data = {
          charset: 'UTF-8',
          headers,
          translations: { context: {} },
        }

        headers['content-type'] = headers['content-type']
          || DEFAULT_HEADERS['content-type']
      }

      const defaultContext = data.translations.context

      if (node.callee.name !== functionName) {
        return
      }

      const translate = {}

      const args = node.arguments
      if (args.length === 0) {
        return
      }

      let value = getStringValue(args[0])

      if (!value) {
        return
      }

      translate.msgid = value
      translate.msgstr = ['']

      if (args.length >= 2) {
        value = getStringValue(args[1])
        if (value) {
          translate.msgid_plural = value
          translate.msgstr.push('')
        }
      }

      let fn = config.file.log.filename
      if (base && fn && fn.substr(0, base.length) === base) {
        fn = fn.substr(base.length)
      }

      if (addLocation !== 'never' || !noLocation) {
        translate.comments = {
          reference: getReference(addLocation, fn, node),
        }
      }

      let translatorComment = getTranslatorComment(node)
      if (!translatorComment) {
        translatorComment = getTranslatorComment(parent)
        if (!translatorComment) {
          translatorComment = relocatedComments[
            `${node.start}|${node.end}`]
        }
      }

      if (translatorComment) {
        translate.comments.translator = translatorComment
      }

      let context = defaultContext
      const msgctxt = translate.msgctxt
      if (msgctxt) {
        data.translations[msgctxt] = data.translations[msgctxt] || {}
        context = data.translations[msgctxt]
      }

      context[translate.msgid] = translate

      const output = gettextParser.po.compile(data)
      fs.writeFileSync(fileName, output)
    },
  } }
}
