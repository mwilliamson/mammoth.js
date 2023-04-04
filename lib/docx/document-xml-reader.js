exports.DocumentXmlReader = DocumentXmlReader;

var documents = require("../documents");
var Result = require("../results").Result;


function DocumentXmlReader(options) {
    var bodyReader = options.bodyReader;

    function convertXmlToDocument(element, firstTag) {
        if (firstTag === undefined){
            firstTag = "w:body";
        }
        var body = element.first(firstTag);

        if (body === undefined && element.name === firstTag) {
            body = element;
        }

        var result = bodyReader.readXmlElements(body.children)
            .map(function(children) {
                return new documents.Document(children, {
                    notes: options.notes,
                    comments: options.comments
                });
            });
        return new Result(result.value, result.messages);
    }

    return {
        convertXmlToDocument: convertXmlToDocument
    };
}
