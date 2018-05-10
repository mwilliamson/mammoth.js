var _ = require("underscore");

var promises = require("./promises");
var Html = require("./html");

exports.imgElement = imgElement;

function imgElement(func) {
    return function(element, messages) {
        return promises.when(func(element)).then(function(result) {
            var attributes = _.clone(result);
            if (element.altText) {
                attributes.alt = element.altText;
            }
            return [Html.freshElement("img", attributes)];
        });
    };
}

// Undocumented, but retained for backwards-compatibility with 0.3.x
exports.inline = exports.imgElement;

exports.dataUri = imgElement(function(element) {
    return element.read("base64").then(function(imageBuffer) {
        var imgEl = {
            src: "data:" + element.contentType + ";base64," + imageBuffer
        };
        if (element.dimensions != null){
            imgEl.height = parseInt(element.dimensions.height, 10);
            imgEl.width = parseInt(element.dimensions.width, 10);
        }
        return imgEl;
    });
});
