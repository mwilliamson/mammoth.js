var htmlPaths = require("./html-paths");


exports.element = element;

function element(name) {
    return function(html) {
        html.open(htmlPaths.element(name));
    };
}
