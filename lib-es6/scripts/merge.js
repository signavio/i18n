import _toArray from "@babel/runtime/helpers/toArray";
import { exec } from 'child_process';
import path from 'path';

if (process.argv.length < 4) {
  throw new Error('Invalid arguments, expected: `node i18n/scripts/merge.js pot_file po_file ...`');
}

var _process$argv = _toArray(process.argv),
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
var templatePath = path.resolve(process.cwd(), potFile);
poFiles.forEach(function (fileName) {
  exec("msgmerge ".concat(flags.join(' '), " -o ").concat(fileName, " ").concat(fileName, " ").concat(templatePath), function (error, stdout, stderr) {
    // eslint-disable-next-line no-console
    if (error) {}
  });
});