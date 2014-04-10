var util = require("util");
var _ = require("underscore");

exports.writer = writer;

function writer(options) {
    options = options || {};
    if (options.prettyPrint) {
        return prettyWriter();
    } else {
        return simpleWriter();
    }
}


var indentedElements = {
    div: true,
    p: true,
    ul: true
};


function prettyWriter() {
    var indentationLevel = 0;
    var stack = [];
    
    var writer = simpleWriter();
    
    function open(tagName, attributes) {
        indent();
        stack.push(tagName);
        writer.open(tagName, attributes);
        if (indentedElements[tagName]) {
            indentationLevel++;
        }
    }
    
    function close(tagName) {
        if (indentedElements[tagName]) {
            indentationLevel--;
        }
        indent();
        stack.pop();
        writer.close(tagName);
    }
    
    function text(value) {
        indent();
        writer.text(value);
    }
    
    function insideIndentedElement() {
        return stack.length > 0 && indentedElements[stack[stack.length - 1]];
    }
    
    function indent() {
        if (insideIndentedElement()) {
            writer.append("\n");
            for (var i = 0; i < indentationLevel; i++) {
                writer.append("  ");
            }
        }
    }
    
    return {
        asString: writer.asString,
        open: open,
        close: close,
        text: text,
        selfClosing: writer.selfClosing,
        append: writer.append
    };
}


function simpleWriter() {
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
