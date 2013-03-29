var util = require("util");

var _ = require("underscore");

exports.HtmlGenerator = HtmlGenerator;


function HtmlGenerator() {
    var stack = [];
    var fragments = [];
    
    function text(value) {
        fragments.push(escapeHtml(value))
    }
    
    function asString() {
        popAll();
        return fragments.join("");
    }
    
    function style(style) {
        var firstFreshPartIndex = findIndex(style, function(part) {
            return part.fresh;
        });
        
        var partIndex = 0;
        while (partIndex < firstFreshPartIndex && stylePartMatchesHtmlElement(style[partIndex], stack[partIndex])) {
            partIndex++;
        }
        while (stack.length > partIndex) {
            pop();
        }
        for (; partIndex < style.length; partIndex++) {
            push(style[partIndex]);
        }
    }
    
    function stylePartMatchesHtmlElement(stylePart, htmlElement) {
        return htmlElement && stylePart.tagName === htmlElement.tagName;
    }
    
    function push(element) {
        stack.push(element);
        if (element["class"]) {
            var attributeString = util.format(' %s="%s"', "class", element["class"]);
        } else {
            var attributeString = "";
        }
        fragments.push(util.format("<%s%s>", element.tagName, attributeString));
    }
    
    function pop() {
        var element = stack.pop();
        fragments.push(util.format("</%s>", element.tagName));
    }
    
    function popAll() {
        while (stack.length > 0) {
            pop();
        }
    }
    
    return {
        style: style,
        text: text,
        asString: asString
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
