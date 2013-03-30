var optimist = require("optimist");
var ZipFile = require("zipfile").ZipFile;
var q = require("q");

var mammoth = require("./");


var argv = optimist.argv;
var zipFile = new ZipFile(argv._[0]);
var docxFile = {
    read: function(path) {
        return q.ninvoke(zipFile, "readFile", path, "utf-8")
            .then(function(value) {
                return value.toString();
            });
    }
};


var converter = new mammoth.Converter();
converter.convertToHtml(docxFile)
    .then(function(result) {
        console.log(result);
    })
    .done();

