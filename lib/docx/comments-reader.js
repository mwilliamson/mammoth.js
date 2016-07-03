var documents = require("../documents");
var Result = require("../results").Result;

function createCommentsReader(bodyReader) {
    function readCommentsXml(xml) {
        return Result.combine(xml.root.getElementsByTagName("w:comment")
            .map(readCommentElement));
    }

    function readCommentElement(element) {
        var id = element.attributes["w:id"];
        return bodyReader.readXmlElements(element.children)
            .map(function(body) {
                return documents.comment({commentId: id, body: body});
            });
    }
    
    return readCommentsXml;
}

exports.createCommentsReader = createCommentsReader;
