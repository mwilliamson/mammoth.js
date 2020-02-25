var _ = require("underscore");

var tableState = {
    isTable: false,
    trCount: 0,
    tdCount: 0
};

var listState = {
    list: null,
    listItem: {}
};

function symmetricMarkdownElement(end) {
    return markdownElement(end, end);
}

function markdownElement(start, end) {
    return function() {
        return {start: start, end: end};
    };
}

function markdownParagraph(){
    return {start: "", end: tableState.isTable ? " " : "\n\n"};
}

function markdownBr(){
    return {start: "", end: tableState.isTable ? " " : "  \n"};
}

function markdownLink(attributes) {
    var href = attributes.href || "";
    if (href) {
        return {
            start: "[",
            end: "](" + href + ")",
            anchorPosition: "before"
        };
    } else {
        return {};
    }
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

function markdownHeader(index) {
    return function() {
        var isInsideTable = tableState.isTable;
        return {
            start: isInsideTable ? "" : repeatString("#", index) + " ",
            end: isInsideTable ? " " : "\n\n"
        };
    };
}

function markdownList(options) {
    return function() {
        return {
            start: function() {
                var isInsideTable = tableState.isTable;
                var hasParentList = !!listState.list;

                var start = isInsideTable ? "" : hasParentList ? "\n" : "";
                listState.list = {
                    isOrdered: options.isOrdered,
                    indent: listState.list ? listState.list.indent + 1 : 0,
                    count: 0
                };
                return start;
            },
            end: function() {
                var isInsideTable = tableState.isTable;
                var hasParentList = !!listState.list;

                return hasParentList || isInsideTable ? "" : "\n";
            }
        };
    };
}

function markdownListItem() {
    var isInsideTable = tableState.isTable;
    var list = listState.list || {indent: 0, isOrdered: false, count: 0};

    list.count++;
    listState.listItem.hasClosed = false;
    
    var bullet = list.isOrdered ? list.count + "." : "-";
    var start = isInsideTable ? "" : repeatString("\t", list.indent) + bullet + " ";
        
    return {
        start: start,
        end: function() {
            if (!listState.listItem.hasClosed) {
                listState.listItem.hasClosed = true;
                return isInsideTable ? ";" : "\n";
            }
        }
    };
}

function markdownTable() {
    tableState.isTable = true;
    tableState.tdCount = 0;
    tableState.trCount = 0;
    return {
        start: "",
        end: function() {
            tableState.isTable = false;
            return "\n";
        }
    };
}

function markdownTr() {
    var start = "";
    if (tableState.trCount === 1) {
        start = "|" + new Array(tableState.tdCount).fill("-|").join("") + "\n";
    }
    tableState.trCount++;
    tableState.tdCount = 0;
    return {start: start, end: "|\n"};

}

function markdownTd() {
    tableState.tdCount++;
    return {start: "|", end: ""};
}

var htmlToMarkdown = {
    "p": markdownParagraph,
    "br": markdownBr,
    "ul": markdownList({isOrdered: false}),
    "ol": markdownList({isOrdered: true}),
    "li": markdownListItem,
    "strong": symmetricMarkdownElement("__"),
    "em": symmetricMarkdownElement("*"),
    "a": markdownLink,
    "img": markdownImage,
    "table": markdownTable,
    "tr": markdownTr,
    "td": markdownTd
};

(function() {
    for (var i = 1; i <= 6; i++) {
        htmlToMarkdown["h" + i] = markdownHeader(i);
    }
})();

function repeatString(value, count) {
    return new Array(count + 1).join(value);
}

function markdownWriter() {
    var fragments = [];
    var elementStack = [];
    
    function open(tagName, attributes) {
        attributes = attributes || {};
        
        var createElement = htmlToMarkdown[tagName] || function() {
            return {};
        };
        var element = createElement(attributes);
        elementStack.push({end: element.end, list: listState.list});
        
        var anchorBeforeStart = element.anchorPosition === "before";
        if (anchorBeforeStart) {
            writeAnchor(attributes);
        }

        var start = _.isFunction(element.start) ? element.start() : element.start;
        fragments.push(start || "");
        if (!anchorBeforeStart) {
            writeAnchor(attributes);
        }
    }
    
    function writeAnchor(attributes) {
        if (attributes.id) {
            fragments.push('<a id="' + attributes.id + '"></a>');
        }
    }
    
    function close() {
        var element = elementStack.pop();
        listState.list = element.list;
        var end = _.isFunction(element.end) ? element.end() : element.end;
        fragments.push(end || "");
    }
    
    function selfClosing(tagName, attributes) {
        open(tagName, attributes);
        close(tagName);
    }
    
    function text(value) {
        fragments.push(escapeMarkdown(value));
    }
    
    function asString() {
        return fragments.join("");
    }

    return {
        asString: asString,
        open: open,
        close: close,
        text: text,
        selfClosing: selfClosing
    };
}

exports.writer = markdownWriter;

function escapeMarkdown(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g, '\\$1');
}

