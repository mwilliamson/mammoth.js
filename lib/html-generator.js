var util = require("util");

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
        popAll();
        style.forEach(function(tagName) {
            push(tagName);
        });
    }
    
    function push(element) {
        stack.push(element);
        fragments.push(util.format("<%s>", element));
    }
    
    function pop() {
        var element = stack.pop();
        fragments.push(util.format("</%s>", element));
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
