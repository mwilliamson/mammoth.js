var promises = require("./promises");
var htmlPaths = require("./html-paths");

exports.inline = function(func) {
    return function(element, html, messages, callback) {
        return promises.when(func(element)).then(function(result) {
            var attributes = {src: result.src};
            if (element.altText) {
                attributes.alt = element.altText;
            }
            html.selfClosing(htmlPaths.element("img", attributes));
        }).then(callback, callback);
    };
};
