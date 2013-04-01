var util = require("util");

var _ = require("underscore");

exports.HtmlGenerator = HtmlGenerator;


function HtmlGenerator() {
    var stack = [];
    var fragments = [];
    
    function text(value) {
        if (value.length > 0) {
            writeAll();
            fragments.push(escapeHtml(value))
        }
    }
    
    function asString() {
        return fragments.join("");
    }
    
    function append(otherHtmlGenerator) {
        if (otherHtmlGenerator._fragments.length > 0) {
            writeAll();
        }
        otherHtmlGenerator._fragments.forEach(function(fragment) {
            fragments.push(fragment);
        });
    }
    
    function style(style) {
        var firstFreshPartIndex = findIndex(style, function(part) {
            return part.fresh;
        });
        
        var partIndex = 0;
        while (partIndex < firstFreshPartIndex && stylePartMatchesStackElement(style[partIndex], stack[partIndex])) {
            partIndex++;
        }
        while (stack.length > partIndex) {
            pop();
        }
        for (; partIndex < style.length; partIndex++) {
            push(style[partIndex]);
        }
    }
    
    function stylePartMatchesStackElement(stylePart, stackElement) {
        return stackElement && stylePart.tagName === stackElement.element.tagName;
    }
    
    function push(element) {
        stack.push({
            element: element,
            written: false
        });
    }
    
    function pop() {
        var stackElement = stack.pop();
        if (stackElement.written) {
            fragments.push(util.format("</%s>", stackElement.element.tagName));
        }
    }
    
    function popAll() {
        while (stack.length > 0) {
            pop();
        }
    }
    
    function writeAll() {
        stack.filter(function(element) {
            return !element.written;
        }).forEach(writeElement);
    }
    
    function writeElement(stackElement) {
        stackElement.written = true;
        var element = stackElement.element;
        if (element["class"]) {
            var attributeString = util.format(' %s="%s"', "class", element["class"]);
        } else {
            var attributeString = "";
        }
        if (element.href) {
            attributeString += util.format(' href="%s"', escapeHtml(element.href));
        }
        fragments.push(util.format("<%s%s>", element.tagName, attributeString));
    }
    
    return {
        style: style,
        text: text,
        closeAll: popAll,
        asString: asString,
        append: append,
        push: push,
        pop: pop,
        _fragments: fragments
    };
}


function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function findIndex(array, predicate) {
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return i;
        }
    }
    return -1;
}
