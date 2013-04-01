exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;


function Document(children) {
    return {
        type: "document",
        children: children
    };
}

function Paragraph(children, properties) {
    return {
        type: "paragraph",
        children: children,
        properties: properties || {}
    };
}

function Run(children, properties) {
    return {
        type: "run",
        children: children,
        properties: properties || {}
    };
}

function Text(value) {
    return {
        type: "text",
        value: value
    };
}
