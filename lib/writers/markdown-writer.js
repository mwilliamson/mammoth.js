var _ = require("underscore");


function markdownElement(start, end) {
    if (end === undefined) {
        end = start;
    }

    function open(attrs) {
        return start;
    }

    function close() {
        return end;
    }
    
    return {open: open, close: close};
}

function markdownLink() {
    var href;

    function open(attributes) {
        href = attributes.href;
        return "[";
    }

    function close() {
        return "](" + (href || "") + ")";
    }
    
    return {open: open, close: close, anchorPosition: "before"};
}

function markdownImage() {
    function open(attributes) {
        var src = attributes.src || "";
        var altText = attributes.alt || "";
        if (src || altText) {
            return "![" + altText + "](" + src + ")";
        }
    }

    function close() {
        return "";
    }
    
    return {open: open, close: close};
}

function markdownList() {
    function open(attrs) {
        return attrs.indent > -1 ? "\n" : "";
    }

    function close(attrs) {
        return attrs.indent > -1 ? "" : "\n";
    }
    
    return {open: open, close: close};
}

function markdownListItem() {
    function open(attrs) {
        var output = "";

        for(var i = 0; i < attrs.indent; ++i) {
            output += "\t";
        }

        return output + (attrs.type === "ul" ? "-" : attrs.count + ".") + " ";
    }

    function close() {
        return "\n";
    }
    
    return {open: open, close: close};
}

// map HTML tags to Markdown syntax
var htmlmarkdown = {
    // paragraphs elements use three line feeds to close
    // this prevents them being caught by collapsing list elements in `asString`
    // while still allowing them to be collapsed when multiple empty lines are removed
    "p": markdownElement("", "\n\n\n"),
    "br": markdownElement("", "  \n"),
    "ul": markdownList(),
    "ol": markdownList(),
    "li": markdownListItem(),
    "strong": markdownElement("**"),
    "em": markdownElement("*"),
    "a": markdownLink(),
    "img": markdownImage(),
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
        
        var idHasBeenWritten = false;
        
        if (htmlmarkdown[tagName]) {
            if (htmlmarkdown[tagName].anchorPosition === "before") {
                writeAnchor(attributes);
                idHasBeenWritten = true;
            }
            
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
        if (!idHasBeenWritten) {
            writeAnchor(attributes);
        }
    }
    
    function writeAnchor(attributes) {
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
