var _ = require("underscore");

var promises = require("./promises");
var Html = require("./html");

exports.imgElement = function(func) {
    return function(element, messages) {
        return promises.when(func(element)).then(function(result) {
            var attributes = _.clone(result);
            if (element.altText) {
                attributes.alt = element.altText;
            }
            return [Html.freshElement("img", attributes)];
        });
    };
};

// Undocumented, but retained for backwards-compatibility with 0.3.x
exports.inline = exports.imgElement;
