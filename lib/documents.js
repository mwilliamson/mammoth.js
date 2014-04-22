var types = {
    document: "document",
    paragraph: "paragraph",
    run: "run",
    text: "text",
    tab: "tab",
    hyperlink: "hyperlink",
    image: "image"
};

function Document(children) {
    return {
        type: types.document,
        children: children
    };
}

function Paragraph(children, properties) {
    properties = properties || {};
    return {
        type: types.paragraph,
        children: children,
        styleId: properties.styleId || null,
        styleName: properties.styleName || null,
        numbering: properties.numbering || null,
        alignment: properties.alignment || null
    };
}

function Run(children, properties) {
    properties = properties || {};
    return {
        type: types.run,
        children: children,
        styleId: properties.styleId || null,
        styleName: properties.styleName || null,
        isBold: properties.isBold,
        isItalic: properties.isItalic
    };
}

function Text(value) {
    return {
        type: types.text,
        value: value
    };
}

function Tab(value) {
    return {
        type: types.tab
    };
}

function Hyperlink(children, options) {
    return {
        type: types.hyperlink,
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
        type: types.image,
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
