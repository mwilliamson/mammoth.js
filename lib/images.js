var promises = require("./promises");
var Html = require("./html");

exports.inline = function(func) {
    return function(element, messages, callback) {
        return promises.when(func(element)).then(function(result) {
            var attributes = {src: result.src};
            if (element.altText) {
                attributes.alt = element.altText;
            }
            return Html.selfClosingElement("img", attributes);
        }).then(function(value) {
            callback(null, value);
        }, callback);
    };
};
