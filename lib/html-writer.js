var util = require("util");
var _ = require("underscore");

exports.writer = writer;

function writer() {
    var fragments = [];
    
    function open(tagName, attributes) {
        var attributeString = generateAttributeString(attributes);
        fragments.push(util.format("<%s%s>", tagName, attributeString));
    }
    
    function close(tagName) {
        fragments.push(util.format("</%s>", tagName));
    }
    
    function selfClosing(tagName, attributes) {
        var attributeString = generateAttributeString(attributes);
        fragments.push(util.format("<%s%s />", tagName, attributeString));
    }
    
    function generateAttributeString(attributes) {
        return _.map(attributes, function(value, key) {
            return util.format(' %s="%s"', key, escapeHtml(value));
        }).join("");
    }
    
    function text(value) {
        fragments.push(escapeHtml(value));
    }
    
    function append(html) {
        fragments.push(html);
    }
    
    function asString() {
        return fragments.join("");
    }
    
    return {
        asString: asString,
        open: open,
        close: close,
        text: text,
        selfClosing: selfClosing,
        append: append
    };
}


function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
