"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toArray"));

var _child_process = require("child_process");

var _path = _interopRequireDefault(require("path"));

if (process.argv.length < 4) {
  throw new Error('Invalid arguments, expected: `node i18n/scripts/merge.js pot_file po_file ...`');
}

var _process$argv = (0, _toArray2["default"])(process.argv),
    cliArguments = _process$argv.slice(2);

var flags = [];
var files = [];
cliArguments.forEach(function (arg) {
  if (arg.startsWith('-')) {
    flags.push(arg);
  } else {
    files.push(arg);
  }
});
var potFile = files[0],
    poFiles = files.slice(1);

var templatePath = _path["default"].resolve(process.cwd(), potFile);

poFiles.forEach(function (fileName) {
  (0, _child_process.exec)("msgmerge ".concat(flags.join(' '), " -o ").concat(fileName, " ").concat(fileName, " ").concat(templatePath), function (error, stdout, stderr) {
    // eslint-disable-next-line no-console
    if (error) {}
  });
});