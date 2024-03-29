// @flow
import gettextParser from 'gettext-parser'
import fs from 'fs'

import type {
  AddLocationT,
  ConfigT,
  AstNodeT,
  ObjectPropertyT,
} from '../../types'

const DEFAULT_FUNCTION_NAME = 'i18n'

const DEFAULT_FILE_NAME = 'messages.pot'

const DEFAULT_HEADERS = {
  'content-type': 'text/plain; charset=UTF-8',
}

const DEFAULT_ADD_LOCATION = 'full'

function isStringLiteral(node: AstNodeT) {
  return node.type === 'StringLiteral'
}

function isTemplateLiteral(node: AstNodeT) {
  return node.type === 'TemplateLiteral';
}
function isSimpleLiteral(node: AstNodeT) {
  return isStringLiteral(node) || (isTemplateLiteral(node) && typeof getStringValue(node) === 'string') 
}

function isObjectLiteral(node: AstNodeT) {
  return node.type === 'ObjectExpression'
}

function getContextProperty(node: AstNodeT) {
  return (
    node.properties &&
    node.properties.find(
      (property: ObjectPropertyT) => property.key.name === 'context'
    )
  )
}

function isStringConcatExpr(node: AstNodeT) {
  const left = node.left
  const right = node.right

  return (
    node.type === 'BinaryExpression' &&
    node.operator === '+' &&
    ((isSimpleLiteral(left) || isStringConcatExpr(left)) &&
      (isSimpleLiteral(right) || isStringConcatExpr(right)))
  )
}

function getStringValue(node: AstNodeT) {
  if (isStringLiteral(node)) {
    return node.value
  }

  if (isTemplateLiteral(node)) {
    // Support only simple template literals without expressions
    if (node.expressions.length > 0 || node.quasis.length !== 1) {
      return null
    }
    return node.quasis[0].value.cooked

  }

  if (isStringConcatExpr(node)) {
    const [left, right] = [getStringValue(node.left), getStringValue(node.right)]
    if ([left, right].includes(null)) {
      return null
    }
    return left + right
  }

  return null
}

function getExtractedComment(node: AstNodeT) {
  const comments = []
    ; (node.leadingComments || []).forEach((commentNode: AstNodeT) => {
      const match = commentNode.value.match(/^\s*translators:\s*(.*?)\s*$/im)
      if (match) {
        comments.push(match[1])
      }
    })
  return comments.length > 0 ? comments.join('\n') : null
}

function getReference(
  addLocation: AddLocationT,
  fn: string,
  node: AstNodeT
): ?string {
  if (!addLocation || addLocation === 'full') {
    return `${fn}:${node.loc.start.line}`
  }

  if (addLocation === 'file') {
    const index = fn.lastIndexOf('/')

    return `${fn.slice(index + 1)}:${node.loc.start.line}`
  }

  return null
}

function getRelativePathName(
  { filename, root }: { filename: string, root: string },
  base: string = ''
) {
  // to remove first '/' as well
  const sourceFileName = filename.substr(root.length + 1)

  return sourceFileName.substr(0, base.length) === base
    ? sourceFileName.substr(base.length)
    : sourceFileName
}

let currentWriteToFileName
let data
const relocatedComments = {}

export default function plugin() {
  return {
    visitor: {
      VariableDeclaration({ node }: { node: AstNodeT }) {
        const extractedComment = getExtractedComment(node)
        if (!extractedComment) {
          return
        }
        node.declarations.forEach((declarator: AstNodeT) => {
          const comment = getExtractedComment(declarator)
          if (!comment) {
            const key = `${declarator.init.start}|${declarator.init.end}`
            relocatedComments[key] = extractedComment
          }
        })
      },

      CallExpression(
        { node, parent }: { node: AstNodeT, parent: AstNodeT },
        config: ConfigT
      ) {
        const {
          functionName = DEFAULT_FUNCTION_NAME,
          fileName = DEFAULT_FILE_NAME,
          headers = DEFAULT_HEADERS,
          addLocation = DEFAULT_ADD_LOCATION,
          noLocation = false,
          replacements = null,
        } = config.opts

        let base = config.opts.baseDirectory
        if (base) {
          base = `${base.match(/^(.*?)\/*$/)[1]}/`
        }

        if (fileName !== currentWriteToFileName) {
          currentWriteToFileName = fileName
          data = { charset: 'UTF-8', headers, translations: { context: {} } }

          headers['content-type'] =
            headers['content-type'] || DEFAULT_HEADERS['content-type']
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

        const sourceFileName = getRelativePathName(config.file.opts, base)

        if (addLocation !== 'never' && !noLocation) {
          translate.comments = {
            reference: getReference(addLocation, sourceFileName, node),
          }
        }

        let extractedComment = getExtractedComment(node)
        if (!extractedComment) {
          extractedComment = getExtractedComment(parent)
          if (!extractedComment) {
            extractedComment = relocatedComments[`${node.start}|${node.end}`]
          }
        }

        if (extractedComment && translate.comments) {
          translate.comments = {
            ...translate.comments,

            extracted: extractedComment,
          }
        }

        const options = args[args.length - 1]

        if (isObjectLiteral(options)) {
          const ctxtProp = getContextProperty(options)

          if (ctxtProp) {
            const messageContext = getStringValue(ctxtProp.value)
            if (messageContext) {
              translate.msgctxt = messageContext
            }
          }
        }

        let context = defaultContext
        const msgctxt = translate.msgctxt
        if (msgctxt) {
          data.translations[msgctxt] = data.translations[msgctxt] || {}
          context = data.translations[msgctxt]
        }

        context[translate.msgid] = translate

        if (replacements) {
          const contextName = translate.msgctxt || ""
          const contextReplacements = replacements[contextName]
          if (
            contextReplacements &&
            (typeof contextReplacements[translate.msgid] === 'string' ||
              typeof contextReplacements[translate.msgid_plural] === 'string')
          ) {
            const newTranslate = {
              ...translate,
              comments: {
                ...translate.comments,
                extracted:
                  `REPLACEMENT for "${translate.msgid}"`.trim() +
                  (translate.msgctxt ? `, context: "${translate.msgctxt}"` : ''),
              },
            }

            newTranslate.msgid =
              typeof contextReplacements[translate.msgid] === 'string'
                ? contextReplacements[newTranslate.msgid]
                : newTranslate.msgid

            newTranslate.msgid_plural =
              typeof contextReplacements[translate.msgid_plural] === 'string'
                ? contextReplacements[newTranslate.msgid_plural]
                : newTranslate.msgid_plural

            newTranslate.msgctxt = translate.msgctxt

            context[newTranslate.msgid] = newTranslate
          }
        }

        const output = gettextParser.po.compile(data)
        fs.writeFileSync(fileName, output)
      },
    },
  }
}
