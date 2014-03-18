var optimist = require("optimist");

var mammoth = require("./");

var argv = optimist.argv;

mammoth.convertToHtml({path: argv._[0]})
    .then(function(result) {
        process.stdout.write(result.value);
    })
    .done();

