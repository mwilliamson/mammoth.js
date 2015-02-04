var _ = require("underscore");


function markdownElement(start, end) {
    if (end === undefined) {
        end = start;
    }

    this.open = function(attrs) {
        return start;
    };

    this.close = function() {
        return end;
    };
}

function markdownLink() {
    var href;

    this.open = function(attributes) {
        href = attributes.href;
        return "[";
    };

    this.close = function() {
        return "](" + (href || "") + ")";
    };
}

function markdownImage() {
    this.open = function(attributes) {
        var src = attributes.src || "";
        var altText = attributes.alt || "";
        if (src || altText) {
            return "![" + altText + "](" + src + ")";
        }
    };

    this.close = function() {
        return "";
    };
}

function markdownList() {
    this.open = function(attrs) {
        return attrs.indent > -1 ? "\n" : "";
    };

    this.close = function(attrs) {
        return attrs.indent > -1 ? "" : "\n";
    };
}

function markdownListItem() {
    this.open = function(attrs) {
        var output = "";

        for(var i = 0; i < attrs.indent; ++i) {
            output += "\t";
        }

        return output + (attrs.type === "ul" ? "-" : attrs.count + ".") + " ";
    };

    this.close = function() {
        return "\n";
    };
}

// map HTML tags to Markdown syntax
var htmlmarkdown = {
    // paragraphs elements use three line feeds to close
    // this prevents them being caught by collapsing list elements in `asString`
    // while still allowing them to be collapsed when multiple empty lines are removed
    "p": new markdownElement("", "\n\n\n"),
    "br": new markdownElement("", "  \n"),
    "ul": new markdownList(),
    "ol": new markdownList(),
    "li": new markdownListItem(),
    "strong": new markdownElement("**"),
    "em": new markdownElement("*"),
    "a": new markdownLink(),
    "img": new markdownImage(),
};

(function() {
    for (var i = 1; i <= 6; i++) {
        htmlmarkdown["h" + i] = new markdownElement(repeatString("#", i) + " ", "\n\n\n");
    }
})();

function repeatString(value, count) {
    return new Array(count + 1).join(value);
}

function markdownWriter() {
    var fragments = [];
    var listStack = [];
    var list = {
        indent: -1,
        type: "ul",
        count: 0
    };
    
    function isList(tagName) {
        return tagName === "ul" || tagName === "ol";
    }

    function open(tagName, attributes) {
        attributes = attributes || {};

        if (htmlmarkdown[tagName]) {
            if (tagName === "li") {
                attributes.indent = list.indent;
                attributes.type = list.type;
                attributes.count = ++list.count;
            } else if (isList(tagName)) {
                attributes.indent = list.indent;
            }

            fragments.push(htmlmarkdown[tagName].open(attributes));

            if (isList(tagName)) {
                listStack.push(_.clone(list));

                list.type = tagName;
                list.indent++;
                list.count = 0;
            }
        }
        
        if (attributes.id) {
            fragments.push('<a id="' + attributes.id + '"></a>');
        }
    }
    
    function close(tagName) {
        if (htmlmarkdown[tagName]) {
            if (isList(tagName)) {
                list = listStack.pop();
            }

            fragments.push(htmlmarkdown[tagName].close(list));
        }
    }
    
    function selfClosing(tagName, attributes) {
        open(tagName, attributes);
        close(tagName);
    }
    
    function text(value) {
        fragments.push(escapeMarkdown(value));
    }
    
    function append(html) {
        fragments.push(html);
    }
    
    function asString() {
        // massage the output to collapse mulitple empty lines and empty lines between nested lists
        return fragments.join("").replace(/\n{2}(\t*)([2-9]\d*\.|- )/g, "\n$1$2").replace(/\n{3,}/g, "\n\n");
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

exports.writer = markdownWriter;

function escapeMarkdown(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g, '\\$1');
}
