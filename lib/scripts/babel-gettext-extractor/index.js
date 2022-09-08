"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: !0
});
exports["default"] = plugin;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _gettextParser = _interopRequireDefault(require("gettext-parser"));

var _fs = _interopRequireDefault(require("fs"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var DEFAULT_FUNCTION_NAME = 'i18n';
var DEFAULT_FILE_NAME = 'messages.pot';
var DEFAULT_HEADERS = {
  'content-type': 'text/plain; charset=UTF-8'
};
var DEFAULT_ADD_LOCATION = 'full';
var NO_CONTEXT = 'no_context';

function isStringLiteral(node) {
  return node.type === 'StringLiteral';
}

function isObjectLiteral(node) {
  return node.type === 'ObjectExpression';
}

function getContextProperty(node) {
  return node.properties && node.properties.find(function (property) {
    return property.key.name === 'context';
  });
}

function isStringConcatExpr(node) {
  var left = node.left;
  var right = node.right;
  return node.type === 'BinaryExpression' && node.operator === '+' && (isStringLiteral(left) || isStringConcatExpr(left)) && (isStringLiteral(right) || isStringConcatExpr(right));
}

function getStringValue(node) {
  if (isStringLiteral(node)) {
    return node.value;
  }

  if (isStringConcatExpr(node)) {
    return getStringValue(node.left) + getStringValue(node.right);
  }

  return null;
}

function getExtractedComment(node) {
  var comments = [];
  (node.leadingComments || []).forEach(function (commentNode) {
    var match = commentNode.value.match(/^\s*translators:\s*(.*?)\s*$/im);

    if (match) {
      comments.push(match[1]);
    }
  });
  return comments.length > 0 ? comments.join('\n') : null;
}

function getReference(addLocation, fn, node) {
  if (!addLocation || addLocation === 'full') {
    return "".concat(fn, ":").concat(node.loc.start.line);
  }

  if (addLocation === 'file') {
    var index = fn.lastIndexOf('/');
    return "".concat(fn.slice(index + 1), ":").concat(node.loc.start.line);
  }

  return null;
}

function getRelativePathName(_ref) {
  var filename = _ref.filename,
      root = _ref.root;
  var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  // to remove first '/' as well
  var sourceFileName = filename.substr(root.length + 1);
  return sourceFileName.substr(0, base.length) === base ? sourceFileName.substr(base.length) : sourceFileName;
}

var currentWriteToFileName;
var data;
var relocatedComments = {};

function plugin() {
  return {
    visitor: {
      VariableDeclaration: function VariableDeclaration(_ref2) {
        var node = _ref2.node;
        var extractedComment = getExtractedComment(node);

        if (!extractedComment) {
          return;
        }

        node.declarations.forEach(function (declarator) {
          var comment = getExtractedComment(declarator);

          if (!comment) {
            var key = "".concat(declarator.init.start, "|").concat(declarator.init.end);
            relocatedComments[key] = extractedComment;
          }
        });
      },
      CallExpression: function CallExpression(_ref3, config) {
        var node = _ref3.node,
            parent = _ref3.parent;
        var _config$opts = config.opts,
            _config$opts$function = _config$opts.functionName,
            functionName = _config$opts$function === void 0 ? DEFAULT_FUNCTION_NAME : _config$opts$function,
            _config$opts$fileName = _config$opts.fileName,
            fileName = _config$opts$fileName === void 0 ? DEFAULT_FILE_NAME : _config$opts$fileName,
            _config$opts$headers = _config$opts.headers,
            headers = _config$opts$headers === void 0 ? DEFAULT_HEADERS : _config$opts$headers,
            _config$opts$addLocat = _config$opts.addLocation,
            addLocation = _config$opts$addLocat === void 0 ? DEFAULT_ADD_LOCATION : _config$opts$addLocat,
            _config$opts$noLocati = _config$opts.noLocation,
            noLocation = _config$opts$noLocati === void 0 ? !1 : _config$opts$noLocati,
            _config$opts$replacem = _config$opts.replacements,
            replacements = _config$opts$replacem === void 0 ? null : _config$opts$replacem;
        var base = config.opts.baseDirectory;

        if (base) {
          base = "".concat(base.match(/^(.*?)\/*$/)[1], "/");
        }

        if (fileName !== currentWriteToFileName) {
          currentWriteToFileName = fileName;
          data = {
            charset: 'UTF-8',
            headers: headers,
            translations: {
              context: {}
            }
          };
          headers['content-type'] = headers['content-type'] || DEFAULT_HEADERS['content-type'];
        }

        var defaultContext = data.translations.context;

        if (node.callee.name !== functionName) {
          return;
        }

        var translate = {};
        var args = node.arguments;

        if (args.length === 0) {
          return;
        }

        var value = getStringValue(args[0]);

        if (!value) {
          return;
        }

        translate.msgid = value;
        translate.msgstr = [''];

        if (args.length >= 2) {
          value = getStringValue(args[1]);

          if (value) {
            translate.msgid_plural = value;
            translate.msgstr.push('');
          }
        }

        var sourceFileName = getRelativePathName(config.file.opts, base);

        if (addLocation !== 'never' && !noLocation) {
          translate.comments = {
            reference: getReference(addLocation, sourceFileName, node)
          };
        }

        var extractedComment = getExtractedComment(node);

        if (!extractedComment) {
          extractedComment = getExtractedComment(parent);

          if (!extractedComment) {
            extractedComment = relocatedComments["".concat(node.start, "|").concat(node.end)];
          }
        }

        if (extractedComment && translate.comments) {
          translate.comments = _objectSpread(_objectSpread({}, translate.comments), {}, {
            extracted: extractedComment
          });
        }

        var options = args[args.length - 1];

        if (isObjectLiteral(options)) {
          var ctxtProp = getContextProperty(options);

          if (ctxtProp) {
            var messageContext = ctxtProp.value.extra.rawValue;

            if (messageContext) {
              translate.msgctxt = messageContext;
            }
          }
        }

        var context = defaultContext;
        var msgctxt = translate.msgctxt;

        if (msgctxt) {
          data.translations[msgctxt] = data.translations[msgctxt] || {};
          context = data.translations[msgctxt];
        }

        context[translate.msgid] = translate;

        if (replacements) {
          var contextName = translate.msgctxt || NO_CONTEXT;
          var contextReplacements = replacements[contextName];

          if (contextReplacements && (typeof contextReplacements[translate.msgid] === 'string' || typeof contextReplacements[translate.msgid_plural] === 'string')) {
            var newTranslate = _objectSpread(_objectSpread({}, translate), {}, {
              comments: _objectSpread(_objectSpread({}, translate.comments), {}, {
                extracted: "REPLACEMENT for \"".concat(translate.msgid, "\"").trim() + (translate.msgctxt ? ", context: ".concat(translate.msgctxt) : '')
              })
            });

            newTranslate.msgid = typeof contextReplacements[translate.msgid] === 'string' ? contextReplacements[newTranslate.msgid] : newTranslate.msgid;
            newTranslate.msgid_plural = typeof contextReplacements[translate.msgid_plural] === 'string' ? contextReplacements[newTranslate.msgid_plural] : newTranslate.msgid_plural;
            newTranslate.msgctxt = translate.msgctxt;
            context[newTranslate.msgid] = newTranslate;
          }
        }

        var output = _gettextParser["default"].po.compile(data);

        _fs["default"].writeFileSync(fileName, output);
      }
    }
  };
}