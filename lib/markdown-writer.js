
function mdElement(start, end) {
    if (end === undefined)
        end = start;

    this.open = function(attributes) {
        return start;
    };

    this.close = function() {
        return end;
    };
}
function mdLink(link, text) {
    var attrs = {};

    this.open = function(attributes) {
        attrs = attributes;
        return "[";
    };

    this.close = function() {
        return (attrs[text] || "") + "](" + (attrs[link] || "") + ")";
    };
}
function mdListItem() {
    this.open = function(attributes) {
        var output = "";

        for(var i = 0; i < attributes["indent"]; ++i)
            output += "\t";

        return output + (attributes["type"] === "ul" ? "-" : attributes["count"] + ".") + " ";
    };

    this.close = function() {
        return "\n";
    };
}

// map HTML tags to Markdown syntax
var htmlmd = {
    "h1": new mdElement("# ", "\n\n"),
    "h2": new mdElement("## ", "\n\n"),
    "h3": new mdElement("### ", "\n\n"),
    "h4": new mdElement("#### ", "\n\n"),
    "h5": new mdElement("##### ", "\n\n"),
    "h6": new mdElement("###### ", "\n\n"),
    "p": new mdElement("", "\n\n"),
    "br": new mdElement("", "  \n"),
    "ul": new mdElement("\n", ""),
    "ol": new mdElement("\n", ""),
    "li": new mdListItem(),
    "strong": new mdElement("**"),
    "em": new mdElement("*"),
    "a": new mdLink("href"),
    "img": new mdLink("src", "alt"),
};

function mdWriter() {
    var fragments = [];
    var list = {
        indent: -1,
        type: "ul",
        count: 0
    };
    
    function isList(tagName) {
        return tagName == "ul" || tagName == "ol";
    }

    function open(tagName, attributes) {
        if(htmlmd[tagName]) {
            if(tagName == "li") {
                attributes = attributes || {};
                attributes["indent"] = list.indent;
                attributes["type"] = list.type;
                attributes["count"] = ++list.count;
            }

            fragments.push(htmlmd[tagName].open(attributes));

            if(isList(tagName)) {
                list.type = tagName;
                list.indent++;
                list.count = 0;
            }
        }
    }
    
    function close(tagName) {
        if(htmlmd[tagName]) {
            fragments.push(htmlmd[tagName].close());

            if(isList(tagName)) {
                list.indent--;
            }
        }
    }
    
    function selfClosing(tagName, attributes) {
        if(htmlmd[tagName]) {
            fragments.push(htmlmd[tagName].open(attributes));
            fragments.push(htmlmd[tagName].close());
        }
    }
    
    function text(value) {
        fragments.push(value);
    }
    
    function append(html) {
        fragments.push(html);
    }
    
    function asString() {
        return fragments.join("").replace(/\n{2,}/, "\n\n");
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