var htmlPaths = require("./html-paths");
var Html = require("./html");


exports.element = element;

function element(name) {
    return function(html) {
        return Html.elementWithTag(htmlPaths.element(name), [html]);
    };
}
