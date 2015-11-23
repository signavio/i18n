var path = require('path');
var exec = require('child_process').exec;

var _ = require('lodash');

if(process.argv.length < 4) {
  throw new Error('Invalid arguments, expected: `node i18n/scripts/merge.js pot_file po_file ...`');
}

var templatePath = path.resolve(process.cwd(), process.argv[2]);

_.each(process.argv.slice(3), function (fileName) {
    exec(`msgmerge -o ${fileName} ${fileName} ${templatePath}`, function(error, stdout, stderr) {
        console.log(stdout);
        if(error) {
            console.error(stderr);
        }
    });

});