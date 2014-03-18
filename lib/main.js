var fs = require("fs");

var optimist = require("optimist");

var mammoth = require("./");

var argv = optimist.argv;

mammoth.convertToHtml({path: argv._[0]})
    .then(function(result) {
        var outputStream = argv._[1] ? fs.createWriteStream(argv._[1]) : process.stdout;
        
        outputStream.write(result.value);
    })
    .done();

