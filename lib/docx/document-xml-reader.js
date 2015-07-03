exports.DocumentXmlReader = DocumentXmlReader;

var documents = require("../documents");
var Result = require("../results").Result;


function DocumentXmlReader(options) {
    var bodyReader = options.bodyReader;
    
    function convertXmlToDocument(documentXml) {
        var body = documentXml.root.first("w:body");
        
        var result = bodyReader.readXmlElements(body.children)
            .map(function(children) {
                return new documents.Document(children, {notes: options.notes});
            });
        return new Result(result.value, result.messages);
    }
    
    return {
        convertXmlToDocument: convertXmlToDocument
    };
}
