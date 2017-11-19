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
    ul: true,
    li: true
};


function prettyWriter() {
    var indentationLevel = 0;
    var indentation = "  ";
    var stack = [];
    var start = true;
    var inText = false;
    
    var writer = simpleWriter();
    
    function open(tagName, attributes) {
        if (indentedElements[tagName]) {
            indent();
        }
        stack.push(tagName);
        writer.open(tagName, attributes);
        if (indentedElements[tagName]) {
            indentationLevel++;
        }
        start = false;
    }
    
    function close(tagName) {
        if (indentedElements[tagName]) {
            indentationLevel--;
            indent();
        }
        stack.pop();
        writer.close(tagName);
    }
    
    function text(value) {
        startText();
        writer.text(value.replace("\n", "\n" + indentation));
    }
    
    function selfClosing(tagName, attributes) {
        indent();
        writer.selfClosing(tagName, attributes);
    }
    
    function append(html) {
        startText();
        writer.append(html.replace("\n", "\n" + indentation));
    }
    
    function insideIndentedElement() {
        return stack.length === 0 || indentedElements[stack[stack.length - 1]];
    }
    
    function startText() {
        if (!inText) {
            indent();
            inText = true;
        }
    }
    
    function indent() {
        inText = false;
        if (!start && insideIndentedElement()) {
            writer.append("\n");
            for (var i = 0; i < indentationLevel; i++) {
                writer.append(indentation);
            }
        }
    }
    
    return {
        asString: writer.asString,
        open: open,
        close: close,
        text: text,
        selfClosing: selfClosing,
        append: append
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
            return util.format(' %s="%s"', key, escapeHtmlAttribute(value));
        }).join("");
    }
    
    function text(value) {
        fragments.push(escapeHtmlText(value));
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

function escapeHtmlText(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
