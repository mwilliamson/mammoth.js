var htmlWriter = require("./html-writer");
var markdownWriter = require("./markdown-writer");
var jsonWriter = require("./json-writer");

exports.writer = writer;


function writer(options) {
    options = options || {};
    if (options.outputFormat === "markdown") {
        return markdownWriter.writer();
    } else if (options.outputFormat === 'json') {
        return jsonWriter.writer(options);
    } else {
        return htmlWriter.writer(options);
    }
}
