function Document(children) {
    return {
        type: "document",
        children: children
    };
}

function Paragraph(children, properties) {
    properties = properties || {};
    return {
        type: "paragraph",
        children: children,
        styleName: properties.styleName || null,
        numbering: properties.numbering || null
    };
}

function Run(children, properties) {
    properties = properties || {};
    return {
        type: "run",
        children: children,
        styleName: properties.styleName || null,
        isBold: properties.isBold,
        isItalic: properties.isItalic
    };
}

function Text(value) {
    return {
        type: "text",
        value: value
    };
}

function Tab(value) {
    return {
        type: "tab"
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

function Image(options) {
    return {
        type: "image",
        read: options.readImage,
        altText: options.altText,
        contentType: options.contentType
    };
}

exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;
exports.Tab = Tab;
exports.Hyperlink = Hyperlink;
exports.Image = Image;
