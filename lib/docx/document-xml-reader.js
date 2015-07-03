exports.DocumentXmlReader = DocumentXmlReader;

var documents = require("../documents");
var Result = require("../results").Result;


function DocumentXmlReader(options) {
    var bodyReader = options.bodyReader;
    var rawNotes = (options.footnotes || []).concat(options.endnotes || []);
    
    
    function convertXmlToDocument(documentXml) {
        var body = documentXml.root.first("w:body");
        
        var result = bodyReader.readXmlElements(body.children)
            .flatMap(function(children) {
                return readNotes().map(function(notes) {
                    return new documents.Document(children, {notes: notes});
                });
            });
        return new Result(result.value, result.messages);
    }
    
    function readNotes() {
        return Result.combine(rawNotes.map(function(rawNote) {
            return bodyReader.readXmlElements(rawNote.body).map(function(body) {
                return new documents.Note({
                    noteType: rawNote.noteType,
                    noteId: rawNote.id,
                    body: body
                });
            });
        })).map(function(notes) {
            return new documents.Notes(notes);
        });
    }
    
    return {
        convertXmlToDocument: convertXmlToDocument
    };
}
