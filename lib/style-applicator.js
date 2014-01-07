exports.StyleApplicator = StyleApplicator;

function StyleApplicator(options) {
    styleApplicatorOptions = options.styleApplicator || {};

    function processDocumentStyles(document) {
        for (var i = 0; i < document.value.children.length; i++) {
            var element = document.value.children[i];
            switch (element.type) {
                case 'paragraph':
                    document.value.children[i] = processParagraphStyles(document.value.children[i]);
                    break;
            }
        }
        return document;
    }

    function processParagraphStyles(element) {
        if (!element.styleName) {
            if (styleApplicatorOptions.alignment && element.alignment) {
                element.styleName = element.alignment+"Aligned";
            }
        }
        return element;
    }

    return {
        processDocumentStyles: processDocumentStyles
    }
}