var htmlWriter = require("./html-writer");
var markdownWriter = require("./markdown-writer");
var penWriter = require("./pen-writer");

exports.writer = writer;

function writer(options) {
    options = options || {};
    if (options.outputFormat === "markdown") {
        return markdownWriter.writer();
    } else if (options.outputFormat === "pen") {
        return penWriter.writer();
    } else {
        return htmlWriter.writer(options);
    }
}