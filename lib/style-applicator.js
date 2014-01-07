exports.HeuristicsProcessor = HeuristicsProcessor;

function HeuristicsProcessor() {
    function processHeuristics(document) {
        for (var i = 0; i < document.value.children.length; i++) {
            var element = document.value.children[i];
            switch (element.type) {
                case 'paragraph':
                    document.value.children[i] = processParagraph(document.value.children[i]);
                    break;
            }
        }
        return document;
    }

    function processParagraph(element) {
        if (element.alignment == 'center' && !element.styleName) {
            element.styleName = "CenteredHeading";
        }
        return element;
    }

    return {
        processHeuristics: processHeuristics
    }
}