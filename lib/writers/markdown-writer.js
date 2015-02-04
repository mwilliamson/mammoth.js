function markdownElement(start, end) {
    if (end === undefined) {
        end = start;
    }
    
    return function() {
        return {start: start, end: end};
    };
}

function markdownLink(attributes) {
    var href = attributes.href || "";
    return {
        start: "[",
        end: "](" + href + ")",
        anchorPosition: "before"
    };
}

function markdownImage(attributes) {
    var src = attributes.src || "";
    var altText = attributes.alt || "";
    if (src || altText) {
        return {start: "![" + altText + "](" + src + ")"};
    } else {
        return {};
    }
}

function markdownList(attributes) {
    return {
        start: attributes.indent > -1 ? "\n" : "",
        end: attributes.indent > -1 ? "" : "\n"
    };
}

function markdownListItem(attributes) {
    var start = repeatString("\t", Math.max(attributes.indent, 0)) +
        (attributes.type === "ul" ? "-" : attributes.count + ".") + " ";
        
    return {start: start, end: "\n"};
}

// map HTML tags to Markdown syntax
var htmlmarkdown = {
    // paragraphs elements use three line feeds to close
    // this prevents them being caught by collapsing list elements in `asString`
    // while still allowing them to be collapsed when multiple empty lines are removed
    "p": markdownElement("", "\n\n\n"),
    "br": markdownElement("", "  \n"),
    "ul": markdownList,
    "ol": markdownList,
    "li": markdownListItem,
    "strong": markdownElement("**"),
    "em": markdownElement("*"),
    "a": markdownLink,
    "img": markdownImage,
};

(function() {
    for (var i = 1; i <= 6; i++) {
        htmlmarkdown["h" + i] = markdownElement(repeatString("#", i) + " ", "\n\n\n");
    }
})();

function repeatString(value, count) {
    return new Array(count + 1).join(value);
}

function markdownWriter() {
    var fragments = [];
    var elementStack = [];
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
        
        if (tagName === "li") {
            attributes.indent = list.indent;
            attributes.type = list.type;
            attributes.count = ++list.count;
        } else if (isList(tagName)) {
            attributes.indent = list.indent;
        }
        
        var idHasBeenWritten = false;
        
        var createElement = htmlmarkdown[tagName] || function() { return {}; };
        var element = createElement(attributes);
        elementStack.push({end: element.end, list: list});
        
        if (element.anchorPosition === "before") {
            writeAnchor(attributes);
            idHasBeenWritten = true;
        }

        fragments.push(element.start || "");

        if (isList(tagName)) {
            list = {
                type: tagName,
                indent: list.indent + 1,
                count: 0
            };
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
        var element = elementStack.pop();
        list = element.list;
        fragments.push(element.end || "");
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
