var _ = require("underscore");

var htmlWriter = require("./html-writer");

exports.HtmlGenerator = HtmlGenerator;


function HtmlGenerator(options) {
    var stack = [];
    var writer = htmlWriter.writer(options);
    
    function text(value) {
        if (value.length > 0) {
            writeAll();
            writer.text(value);
        }
    }
    
    function asString() {
        return writer.asString();
    }
    
    function append(otherHtmlGenerator) {
        var otherString = otherHtmlGenerator.asString();
        if (otherString.length > 0) {
            writeAll();
        }
        writer.append(otherString);
    }
    
    function satisfyPath(style) {
        var firstFreshPartIndex = findIndex(style, function(part) {
            return part.fresh;
        });
        
        var partIndex = 0;
        while (partIndex < firstFreshPartIndex && stylePartMatchesStackElement(style[partIndex], stack[partIndex])) {
            partIndex++;
        }
        while (stack.length > partIndex) {
            close();
        }
        for (; partIndex < style.length; partIndex++) {
            open(style[partIndex]);
        }
    }
    
    function stylePartMatchesStackElement(stylePart, stackElement) {
        return stackElement && stylePart.matchesElement(stackElement);
    }
    
    function open(htmlPathElement) {
        var stackElement = Object.create(htmlPathElement);
        stackElement.written = false;
        stack.push(stackElement);
    }
    
    function close() {
        var element = stack.pop();
        if (element.written) {
            writer.close(element.tagName);
        }
    }
    
    function closeAll() {
        while (stack.length > 0) {
            close();
        }
    }
    
    function writeAll() {
        stack.filter(function(element) {
            return !element.written;
        }).forEach(writeElement);
    }
    
    function writeElement(element) {
        element.written = true;
        writer.open(element.tagName, element.attributes);
    }
    
    function selfClosing(element) {
        writer.selfClosing(element.tagName, element.attributes);
    }
    
    return {
        satisfyPath: satisfyPath,
        text: text,
        open: open,
        close: close,
        closeAll: closeAll,
        asString: asString,
        append: append,
        selfClosing: selfClosing
    };
}

function findIndex(array, predicate) {
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return i;
        }
    }
    return -1;
}
