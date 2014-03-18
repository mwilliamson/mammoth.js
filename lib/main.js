var fs = require("fs");

var mammoth = require("./");

function main(argv) {
    mammoth.convertToHtml({path: argv._[0]})
        .then(function(result) {
            var outputStream = argv._[1] ? fs.createWriteStream(argv._[1]) : process.stdout;
            
            outputStream.write(result.value);
        })
        .done();
}

module.exports = main;
