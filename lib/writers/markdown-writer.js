var _ = require("underscore");


function symmetricMarkdownElement(end) {
    return markdownElement(end, end);
}

function markdownElement(start, end) {
    return function() {
        return {start: start, end: end};
    };
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

function markdownList(options) {
    return function(attributes, list) {
        return {
            start: list ? "\n" : "",
            end: list ? "" : "\n",
            list: {
                isOrdered: options.isOrdered,
                indent: list ? list.indent + 1 : 0,
                count: 0
            }
        };
    };
}

function markdownListItem(attributes, list, listItem) {
    list = list || {indent: 0, isOrdered: false, count: 0};
    list.count++;
    listItem.hasClosed = false;
    
    var bullet = list.isOrdered ? list.count + "." : "-";
    var start = repeatString("\t", list.indent) + bullet + " ";
        
    return {
        start: start,
        end: function() {
            if (!listItem.hasClosed) {
                listItem.hasClosed = true;
                return "\n";
            }
        }
    };
}

function repeatString(value, count) {
    return new Array(count + 1).join(value);
}

function markdownTable() {
    return {
        start: "\n",
        end: "\n\n"
    };
}

function markdownTableRow(attributes, list, listItem) {
    return {
        start: "| ",
        end: "|\n",
        separator: " | "
    };
}

function markdownTableCell() {
    return {};
}

function markdownWriter() {
    var fragments = [];
    var elementStack = [];
    var list = null;
    var listItem = {};
    
    var htmlToMarkdown = {
        "p": function(attributes) {
            // Check if this p tag is inside a table cell
            var isInTableCell = elementStack.some(function(element) {
                return element.tagName === "td" || element.tagName === "th";
            });
            // If inside table cell, don't add extra newlines
            if (isInTableCell) {
                return {start: "", end: ""};
            } else {
                return {start: "", end: "\n\n"};
            }
        },
        "br": markdownElement("", "  \n"),
        "ul": markdownList({isOrdered: false}),
        "ol": markdownList({isOrdered: true}),
        "li": markdownListItem,
        "strong": symmetricMarkdownElement("__"),
        "em": symmetricMarkdownElement("*"),
        "a": markdownLink,
        "img": markdownImage,
        "table": markdownTable,
        "thead": markdownElement("", ""),
        "tbody": markdownElement("", ""),
        "tr": markdownTableRow,
        "th": markdownTableCell,
        "td": markdownTableCell
    };
    
    (function() {
        for (var i = 1; i <= 6; i++) {
            htmlToMarkdown["h" + i] = markdownElement(repeatString("#", i) + " ", "\n\n");
        }
    })();
    
    function open(tagName, attributes) {
        attributes = attributes || {};
        
        var createElement = htmlToMarkdown[tagName] || function() {
            return {};
        };
        var element = createElement(attributes, list, listItem);
        var newElement = {end: element.end, list: list, separator: element.separator, tagName: tagName, attributes: attributes, children: []};
        elementStack.push(newElement);
        
        if (element.list) {
            list = element.list;
        }
        
        var anchorBeforeStart = element.anchorPosition === "before";
        if (anchorBeforeStart) {
            writeAnchor(attributes);
        }

        fragments.push(element.start || "");
        if (!anchorBeforeStart) {
            writeAnchor(attributes);
        }
        
        // Add this element as a child to its parent
        if (elementStack.length > 1) {
            var parentElement = elementStack[elementStack.length - 2];
            parentElement.children.push(newElement);
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
        
        // Add separator after closing td/th if parent is tr
        if (tagName === "td" || tagName === "th") {
            var parentElement = elementStack[elementStack.length - 1];
            if (parentElement && parentElement.separator) {
                fragments.push(parentElement.separator);
            }
        }
        
        var tableElement = null;
        
        // Find the parent table element
        for (var i = elementStack.length - 1; i >= 0; i--) {
            if (elementStack[i].tagName === "table") {
                tableElement = elementStack[i];
                break;
            }
        }
        
        // If closing a tr, remove trailing separator before adding end
        if (tagName === "tr") {
            // Check if last fragment is a separator and remove it
            if (fragments[fragments.length - 1] === " | ") {
                fragments.pop();
            }
            fragments.push("|");
            fragments.push("\n");
            // Add header separator row after closing first tr (whether in thead or not for better compatibility)
            if (tableElement) {
                // Check if this tr is the first child of the table or its thead/tbody
                var isFirstChildLocal = false;
                
                // Check direct children of table
                if (tableElement.children.length === 1 && tableElement.children[0] === element) {
                    isFirstChildLocal = true;
                }
                // Check children of thead/tbody
                for (var jLocal = 0; jLocal < tableElement.children.length; jLocal++) {
                    var childLocal = tableElement.children[jLocal];
                    if ((childLocal.tagName === "thead" || childLocal.tagName === "tbody") && childLocal.children.length === 1 && childLocal.children[0] === element) {
                        isFirstChildLocal = true;
                        break;
                    }
                }
                
                if (isFirstChildLocal) {
                    var headerSeparatorLocal = "| ";
                    element.children.forEach(function(cell) {
                        headerSeparatorLocal += "--- | ";
                    });
                    // Ensure proper header separator format
                    headerSeparatorLocal = headerSeparatorLocal.replace(/ \| $/, " |");
                    fragments.push(headerSeparatorLocal + "\n");
                }
            }
            return;
        }
        
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
    
    return {
        asString: function() {
            var result = fragments.join("");
            // Clean up table formatting
            result = result
                // Remove extra | at end of table rows
                .replace(/ \| \|/g, " |")
                // Remove extra trailing blank lines
                .replace(/\n\n\n+$/, "\n\n");
            return result;
        },
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
