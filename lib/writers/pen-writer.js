var _ = require("underscore");

function escapeHtmlText(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// var htmlToMarkdown = {
//     "p": markdownElement("", "\n\n"),
//     "br": markdownElement("", "  \n"),
//     "ul": markdownList({isOrdered: false}),
//     "ol": markdownList({isOrdered: true}),
//     "li": markdownListItem,
//     "strong": symmetricMarkdownElement("__"),
//     "em": symmetricMarkdownElement("*"),
//     "a": markdownLink,
//     "img": markdownImage,
//     "h1": markdownElement("# ", "\n\n"),
//     "h2": markdownElement("## ", "\n\n"),
//     "h3": markdownElement("### ", "\n\n")
// };

function penWriter(options) {
    var fragments = [];

    function open(tagName, attributes) {
        var attributeString = generateAttributeString(attributes);
        fragments.push("<" + tagName + attributeString + ">");
    }

    function close(tagName) {
        fragments.push("</" + tagName + ">");
    }

    function selfClosing(tagName, attributes) {
        var attributeString = generateAttributeString(attributes);
        fragments.push("<" + tagName + attributeString + " />");
    }

    function generateAttributeString(attributes) {
        return _.map(attributes, function(value, key) {
            return " " + key + '="' + escapeHtmlAttribute(value) + '"';
        }).join("");
    }

    function text(value) {
        fragments.push(escapeHtmlText(value));
    }

    function append(html) {
        fragments.push(html);
    }

    function asString() {
        return fragments.join("");
    }

    return {
        asString: asString,
        open: open,
        close: close,
        text: text,
        selfClosing: selfClosing,
        _append: append
    };
}

exports.writer = penWriter;