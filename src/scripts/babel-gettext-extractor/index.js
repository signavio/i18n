var gettextParser = require('gettext-parser');
var fs = require('fs');

var DEFAULT_FUNCTION_NAME = 'i18n';

var DEFAULT_FILE_NAME = 'messages.pot';

var DEFAULT_HEADERS = {
  'content-type': 'text/plain; charset=UTF-8'
};

function isStringLiteral(node) {
  return node.type === 'Literal' && (typeof node.value === 'string');
}

function isStringConcatExpr(node) {
  var left = node.left;
  var right = node.right;

  return node.type === "BinaryExpression" && node.operator === '+' && (
      (isStringLiteral(left) || isStringConcatExpr(left)) &&
      (isStringLiteral(right) || isStringConcatExpr(right))
  );
}

function getStringValue(node) {
  if(isStringLiteral(node)) {
    return node.value;
  }

  if(isStringConcatExpr(node)) {
    return getStringValue(node.left) + getStringValue(node.right);
  }

  return null;
}

function getTranslatorComment(node) {
  var comments = [];
  (node.leadingComments || []).forEach(function(commentNode) {
    var match = commentNode.value.match(/^\s*translators:\s*(.*?)\s*$/im);
    if (match) {
      comments.push(match[1]);
    }
  });
  return comments.length > 0 ? comments.join('\n') : null;
}

export default function plugin(babel) {

  var currentFileName;
  var data;
  var Plugin = babel.Plugin;
  var relocatedComments = {};

  return { visitor: {

    VariableDeclaration: function({ node }) {
      var translatorComment = getTranslatorComment(node);
      if (!translatorComment) {
        return;
      }
      node.declarations.forEach(function(declarator) {
        var comment = getTranslatorComment(declarator);
        if (!comment) {
          var key = declarator.init.start + '|' + declarator.init.end;
          relocatedComments[key] = translatorComment;
        }
      });
    },

    CallExpression: function({ node, parent }, config) {
      var gtCfg = config.opts && config.opts.extra
        && config.opts.extra.gettext || {};

      var functionName = gtCfg.functionName || DEFAULT_FUNCTION_NAME;
      var fileName = gtCfg.fileName || DEFAULT_FILE_NAME;
      var headers = gtCfg.headers || DEFAULT_HEADERS;
      var base = gtCfg.baseDirectory;
      if (base) {
        base = base.match(/^(.*?)\/*$/)[1] + '/';
      }

      if (fileName !== currentFileName) {
        currentFileName = fileName;
        data = {
          charset: 'UTF-8',
          headers: headers,
          translations: {context: {}}
        };

        headers['content-type'] = headers['content-type']
          || DEFAULT_HEADERS['content-type'];
      }

      var defaultContext = data.translations.context;

      if (node.callee.name !== functionName) {
        return;
      }

      var translate = {};

      var args = node.arguments;
      if(args.length === 0) {
        return;
      }

      var value = getStringValue(args[0])

      if(!value) {
        return;
      }

      translate.msgid = value;
      translate.msgstr = [''];
      
      if(args.length >= 2) {
        value = getStringValue(args[1]);
        if(value) {
          translate.msgid_plural = value;
          translate.msgstr.push('');
        }
      }

      var fn = config.log.filename;
      if (base && fn && fn.substr(0, base.length) == base) {
        fn = fn.substr(base.length);
      }

      translate.comments = {
        reference: fn + ':' + node.loc.start.line
      };

      var translatorComment = getTranslatorComment(node);
      if (!translatorComment) {
        translatorComment = getTranslatorComment(parent);
        if (!translatorComment) {
          translatorComment = relocatedComments[
            node.start + '|' + node.end];
        }
      }

      if (translatorComment) {
        translate.comments.translator = translatorComment;
      }

      var context = defaultContext;
      var msgctxt = translate.msgctxt;
      if (msgctxt) {
        data.translations[msgctxt] = data.translations[msgctxt] || {};
        context = data.translations[msgctxt];
      }

      context[translate.msgid] = translate;

      var output = gettextParser.po.compile(data);
      fs.writeFileSync(fileName, output);
    }
  }};
};