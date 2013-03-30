var optimist = require("optimist");

var mammoth = require("./");

var argv = optimist.argv;

var converter = new mammoth.Converter();
converter.convertToHtml(argv._[0])
    .then(function(result) {
        console.log(result);
    })
    .done();

