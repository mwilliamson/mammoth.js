function Document(children) {
    return {
        type: "document",
        children: children
    };
}

Paragraph = ElementWithChildren("paragraph");
Run = ElementWithChildren("run");

function Text(value) {
    return {
        type: "text",
        value: value
    };
}

function Hyperlink(children, options) {
    return {
        type: "hyperlink",
        children: children,
        href: options.href
    };
}

function ElementWithChildren(type) {
    return function(children, properties) {
        return {
            type: type,
            children: children,
            properties: properties || {}
        };
    };
}

function Image(read, altText) {
    return {
        type: "image",
        read: read,
        altText: altText
    };
}

exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;
exports.Hyperlink = Hyperlink;
exports.Image = Image;
