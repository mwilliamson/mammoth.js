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

    this.empty = function(attrs) {
        return this.open(attrs) + this.close();
    };
}

function markdownLink(link, text) {
    var attrs = {};

    this.open = function(attributes) {
        attrs = attributes || {};

        return "[";
    };

    this.close = function() {
        return (attrs[text] || "") + "](" + (attrs[link] || "") + ")";
    };

    this.empty = function(attrs) {
        // don't display empty content (this is mainly to remove images with no src data)
        var content = this.open(attrs) + this.close();

        if (content === "[]()") {
            return "";
        }

        return content;
    };
}

function markdownList() {
    this.open = function(attrs) {
        return attrs.indent > -1 ? "\n" : "";
    };

    this.close = function(attrs) {
        return attrs.indent > -1 ? "" : "\n";
    };

    this.empty = function(attrs) {
        return this.open(attrs) + this.close();
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

    this.empty = function(attrs) {
        return this.open(attrs) + this.close();
    };
}

// map HTML tags to Markdown syntax
var htmlmarkdown = {
    // paragraphs elements use three line feeds to close
    // this prevents them being caught by collapsing list elements in `asString`
    // while still allowing them to be collapsed when multiple empty lines are removed
    "h1": new markdownElement("# ", "\n\n\n"),
    "h2": new markdownElement("## ", "\n\n\n"),
    "h3": new markdownElement("### ", "\n\n\n"),
    "h4": new markdownElement("#### ", "\n\n\n"),
    "h5": new markdownElement("##### ", "\n\n\n"),
    "h6": new markdownElement("###### ", "\n\n\n"),
    "p": new markdownElement("", "\n\n\n"),
    "br": new markdownElement("", "  \n"),
    "ul": new markdownList(),
    "ol": new markdownList(),
    "li": new markdownListItem(),
    "strong": new markdownElement("**"),
    "em": new markdownElement("*"),
    "a": new markdownLink("href"),
    "img": new markdownLink("src", "alt"),
};

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
        if (htmlmarkdown[tagName]) {
            attributes = attributes || {};

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
        if (htmlmarkdown[tagName]) {
            fragments.push(htmlmarkdown[tagName].empty(attributes));
        }
    }
    
    function text(value) {
        fragments.push(value);
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
