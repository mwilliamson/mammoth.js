
var _ = require("underscore");

function mdElement(start, end) {
    if (end === undefined)
        end = start;

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
function mdLink(link, text) {
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

        if(content === "[]()") {
            return "";
        }

        return content;
    };
}
function mdList() {
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
function mdListItem() {
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
var htmlmd = {
    // paragraphs elements use three line feeds to close
    // this prevents them being caught by collapsing list elements in `asString`
    // while still allowing them to be collapsed when multiple empty lines are removed
    "h1": new mdElement("# ", "\n\n\n"),
    "h2": new mdElement("## ", "\n\n\n"),
    "h3": new mdElement("### ", "\n\n\n"),
    "h4": new mdElement("#### ", "\n\n\n"),
    "h5": new mdElement("##### ", "\n\n\n"),
    "h6": new mdElement("###### ", "\n\n\n"),
    "p": new mdElement("", "\n\n\n"),
    "br": new mdElement("", "  \n"),
    "ul": new mdList(),
    "ol": new mdList(),
    "li": new mdListItem(),
    "strong": new mdElement("**"),
    "em": new mdElement("*"),
    "a": new mdLink("href"),
    "img": new mdLink("src", "alt"),
};

function mdWriter() {
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
        if(htmlmd[tagName]) {
            attributes = attributes || {};

            if(tagName === "li") {
                attributes.indent = list.indent;
                attributes.type = list.type;
                attributes.count = ++list.count;
            }
            else if(isList(tagName)) {
                attributes.indent = list.indent;
            }

            fragments.push(htmlmd[tagName].open(attributes));

            if(isList(tagName)) {
                listStack.push(_.clone(list));

                list.type = tagName;
                list.indent++;
                list.count = 0;
            }
        }
    }
    
    function close(tagName) {
        if(htmlmd[tagName]) {
            if(isList(tagName)) {
                list = listStack.pop();
            }

            fragments.push(htmlmd[tagName].close(list));
        }
    }
    
    function selfClosing(tagName, attributes) {
        if(htmlmd[tagName]) {
            fragments.push(htmlmd[tagName].empty(attributes));
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

exports.writer = mdWriter;